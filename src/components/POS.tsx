import React, { useState, useMemo, useEffect } from 'react';
import { Product, ProductVariant, Customer, Sale, SaleItem, PaymentMethod, StoreSettings, User, AppNotification, StockHistory } from '../types';
import { INITIAL_PRODUCTS } from '../data';
import { getLocalDateString, getLocalDateTimeString } from '../utils';
import { printThermalReceipt } from '../utils/thermalPrinter';
import { 
  Search, ScanLine, ShoppingCart, Trash2, UserPlus, 
  Minus, Plus, Tag, CircleAlert, Landmark, Receipt, 
  Printer, Share2, CheckCircle2, CreditCard, Wallet, Layers, Shirt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface POSProps {
  products: Product[];
  customers: Customer[];
  suppliers: any[];
  sales: Sale[];
  settings: StoreSettings;
  currentUser: User;
  onAddSale: (newSale: Sale) => void;
  onUpdateSale?: (updatedSale: Sale) => void;
  onUpdateProductStock: (productId: string, variantId: string, changeQty: number, invoiceNum: string) => void;
  onAddCustomer: (newCustomer: Customer) => void;
  isArabic: boolean;
  initialInvoiceToLoad?: Sale | null;
  onClearInitialInvoiceToLoad?: () => void;
}

export default function POS({
  products,
  customers,
  sales,
  settings,
  currentUser,
  onAddSale,
  onUpdateSale,
  onUpdateProductStock,
  onAddCustomer,
  isArabic,
  initialInvoiceToLoad,
  onClearInitialInvoiceToLoad
}: POSProps) {
  // POS States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [invoiceDiscount, setInvoiceDiscount] = useState<number>(0); // as EGP discount
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [currentEditingInvoice, setCurrentEditingInvoice] = useState<Sale | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [showVariantModal, setShowVariantModal] = useState<Product | null>(null);
  const [saleType, setSaleType] = useState<'retail' | 'wholesale'>('retail');
  const [mobilePosTab, setMobilePosTab] = useState<'products' | 'cart'>('products');
  
  // Split payment details
  const [splitCash, setSplitCash] = useState<number>(0);
  const [splitVisa, setSplitVisa] = useState<number>(0);
  const [splitVfCash, setSplitVfCash] = useState<number>(0);
  const [splitInstapay, setSplitInstapay] = useState<number>(0);

  // New customer quick insert
  const [showAddCustomerQuick, setShowAddCustomerQuick] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Checkout Receipt States
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Error messaging states
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  // 1. Categories list
  const categories = useMemo(() => {
    const list = new Set<string>();
    products.forEach(p => list.add(p.category));
    return ['All', ...Array.from(list)];
  }, [products]);

  // 2. Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.barcode.includes(searchTerm);
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchTerm]);

  // 3. Find unique variant color lists to draw preview dots
  const getProductColors = (product: Product) => {
    const colors = new Set<string>();
    product.variants.forEach(v => colors.add(v.colorHex || '#FFFFFF'));
    return Array.from(colors);
  };

  // 4. Cart calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, curr) => acc + curr.subtotal, 0);
  }, [cart]);

  const taxAmount = useMemo(() => {
    const rate = settings.taxRate || 14;
    return Math.round(((subtotal - invoiceDiscount) * (rate / 100)) * 100) / 100;
  }, [subtotal, invoiceDiscount, settings.taxRate]);

  const grandTotal = useMemo(() => {
    const tot = subtotal - invoiceDiscount + taxAmount;
    return Math.max(tot, 0);
  }, [subtotal, invoiceDiscount, taxAmount]);

  // Sync split defaults when grandTotal updates
  const handleSelectSplit = () => {
    setPaymentMethod('Split');
    setSplitCash(Math.round(grandTotal / 2));
    setSplitVisa(Math.round((grandTotal - grandTotal / 2) * 100) / 100);
    setSplitVfCash(0);
    setSplitInstapay(0);
  };

  const handleToggleSaleType = (type: 'retail' | 'wholesale') => {
    setSaleType(type);
    
    // Update all items in the cart
    const updatedCart = cart.map(item => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return item;
      
      const finalPrice = type === 'retail'
        ? product.sellingPrice * (1 - product.discount / 100)
        : (product.wholesalePrice || product.sellingPrice);
         
      const originalPrice = type === 'retail' ? product.sellingPrice : (product.wholesalePrice || product.sellingPrice);
      const discountAmount = type === 'retail' ? (product.sellingPrice - finalPrice) : 0;
      
      return {
        ...item,
        originalPrice,
        discount: discountAmount,
        finalPrice,
        subtotal: item.quantity * finalPrice
      };
    });
    setCart(updatedCart);
  };

  // 5. Add direct item with selected variant to cart
  const handleAddVariantToCart = (product: Product, variant: ProductVariant) => {
    // Check available stock
    if (variant.quantity <= 0) {
      setErrorMsg(isArabic ? 'هذا المقاس واللون ينفذ بالكامل من المخزن!' : 'Selected variant is out of stock!');
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    const existingIndex = cart.findIndex(it => it.variantId === variant.id);

    if (existingIndex > -1) {
      const existingItem = cart[existingIndex];
      if (existingItem.quantity + 1 > variant.quantity) {
        setErrorMsg(isArabic ? `عذرًا! لا يوجد سوى ${variant.quantity} قطع متوفرة فقط.` : `Only ${variant.quantity} pieces in stock.`);
        setTimeout(() => setErrorMsg(''), 3000);
        return;
      }
      
      const updatedCart = [...cart];
      updatedCart[existingIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + 1,
        subtotal: (existingItem.quantity + 1) * existingItem.finalPrice
      };
      setCart(updatedCart);
    } else {
      // New item row
      const finalPrice = saleType === 'retail'
        ? product.sellingPrice * (1 - product.discount / 100)
        : (product.wholesalePrice || product.sellingPrice);
      const originalPrice = saleType === 'retail' ? product.sellingPrice : (product.wholesalePrice || product.sellingPrice);
      const discountAmount = saleType === 'retail' ? (product.sellingPrice - finalPrice) : 0;

      const newItem: SaleItem = {
        id: `cart_${Date.now()}_${variant.id}`,
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        brand: product.brand,
        size: variant.size,
        color: variant.color,
        quantity: 1,
        purchasePrice: product.purchasePrice,
        originalPrice: originalPrice,
        discount: discountAmount,
        finalPrice: finalPrice,
        subtotal: finalPrice
      };
      setCart([...cart, newItem]);
    }
    
    setShowVariantModal(null);
  };

  const handleUpdateQty = (itemId: string, currentQty: number, maxQty: number, change: number) => {
    const targetIdx = cart.findIndex(it => it.id === itemId);
    if (targetIdx === -1) return;

    const newQty = currentQty + change;
    if (newQty <= 0) {
      // Remove item
      setCart(cart.filter(it => it.id !== itemId));
      return;
    }

    if (newQty > maxQty) {
      setErrorMsg(isArabic ? `عذرًا! الحد الأقصى للمخزون المتاح هو ${maxQty} قطع.` : `Limit reached! Maximum available is ${maxQty}.`);
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }

    const updated = [...cart];
    updated[targetIdx] = {
      ...updated[targetIdx],
      quantity: newQty,
      subtotal: newQty * updated[targetIdx].finalPrice
    };
    setCart(updated);
  };

  const handleRemoveItem = (itemId: string) => {
    setCart(cart.filter(it => it.id !== itemId));
  };

  // 6. Barcode Scanner Simulation Handler
  // This is highly helpful for physical POS simulation without real hardware hooked up!
  const simulateBarcodeScan = (simBarcode: string) => {
    // Search products for variant with this barcode
    let matchedProduct: Product | null = null;
    let matchedVariant: ProductVariant | null = null;

    for (const p of products) {
      const v = p.variants.find(varObj => varObj.barcode === simBarcode);
      if (v) {
        matchedProduct = p;
        matchedVariant = v;
        break;
      }
    }

    if (matchedProduct && matchedVariant) {
      handleAddVariantToCart(matchedProduct, matchedVariant);
      // Play brief synthesized beep audio
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime); // C6 note
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } catch (e) {
        // audio context blocked by browser policy
      }
    } else {
      setErrorMsg(isArabic ? 'الباركود غير مطابق لأي منتج!' : 'Barcode not found!');
      setTimeout(() => setErrorMsg(''), 2500);
    }
  };

  // Quick select scan helpers
  const simScans = [
    { label: 'زارا أبيض S', barcode: '8801928371-WS' },
    { label: 'جينز أزرق 30', barcode: '4001928372-B30' },
    { label: 'قميص زيتوني M', barcode: '3201928373-OM' },
    { label: 'جاكيت أسود XL', barcode: '1101928375-BXL' }
  ];

  // 7. Quick Customer Creation
  const handleCreateCustomerQuick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    const newCust: Customer = {
      id: `c_${Date.now()}`,
      name: newCustName,
      phone: newCustPhone,
      address: newCustAddress || (isArabic ? 'غير محدد' : 'Not Specified'),
      ordersCount: 0,
      totalSpent: 0,
      loyaltyPoints: 0
    };

    onAddCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    
    // reset form
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setShowAddCustomerQuick(false);
  };

  const activeCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId);
  }, [customers, selectedCustomerId]);

  // 8. Submit checkout transaction
  const handleCheckout = () => {
    if (cart.length === 0) {
      setErrorMsg(isArabic ? 'السلة فارغة بالكامل!' : 'The cart is empty!');
      setTimeout(() => setErrorMsg(''), 2000);
      return;
    }

    // Prepare payment details
    let finalPayments: { method: PaymentMethod; amount: number; transactionRef?: string }[] = [];
    
    if (paymentMethod === 'Split') {
      const sumSplit = splitCash + splitVisa + splitVfCash + splitInstapay;
      // Allow +/- 1 EGP margin due to fractional rounding
      if (Math.abs(sumSplit - grandTotal) > 1.1) {
        setErrorMsg(
          isArabic 
            ? `خطأ في تقسيم الدفع! مجموع المبالغ المدخلة ${sumSplit} ج.م لا يساوي الفاتورة الكلية ${grandTotal} ج.م` 
            : `Split error! Sum of parts (${sumSplit}) must match grand total (${grandTotal})`
        );
        setTimeout(() => setErrorMsg(''), 4000);
        return;
      }
      if (splitCash > 0) finalPayments.push({ method: 'Cash', amount: splitCash });
      if (splitVisa > 0) finalPayments.push({ method: 'Visa', amount: splitVisa, transactionRef: 'TXN-SPLIT-VS' });
      if (splitVfCash > 0) finalPayments.push({ method: 'Vodafone Cash', amount: splitVfCash, transactionRef: 'TXN-SPLIT-VF' });
      if (splitInstapay > 0) finalPayments.push({ method: 'Instapay', amount: splitInstapay, transactionRef: 'TXN-SPLIT-IP' });
    } else {
      finalPayments.push({ method: paymentMethod, amount: grandTotal, transactionRef: `TXN_${Date.now().toString().substring(7)}` });
    }

    if (currentEditingInvoice) {
      // Restore previous items back to stock first
      currentEditingInvoice.items.forEach(oldItem => {
        onUpdateProductStock(oldItem.productId, oldItem.variantId, oldItem.quantity, currentEditingInvoice.invoiceNumber);
      });

      const updatedSale: Sale = {
        ...currentEditingInvoice,
        items: [...cart],
        subtotal: subtotal,
        discountAmount: invoiceDiscount,
        taxAmount: taxAmount,
        total: grandTotal,
        payments: finalPayments,
        paymentMethod: paymentMethod,
        customerId: selectedCustomerId || undefined,
        customerName: activeCustomer?.name || undefined,
        cashierId: currentUser.id,
        cashierName: currentUser.name,
        notes: isArabic ? `تم تعديل الفاتورة في ${getLocalDateTimeString()}` : `Modified on ${getLocalDateTimeString()}`,
        saleType: saleType
      };

      if (onUpdateSale) {
        onUpdateSale(updatedSale);
      } else {
        onAddSale(updatedSale);
      }

      // Deduct new items from stock
      cart.forEach(item => {
        onUpdateProductStock(item.productId, item.variantId, -item.quantity, currentEditingInvoice.invoiceNumber);
      });

      setReceiptSale(updatedSale);
      setCurrentEditingInvoice(null);
    } else {
      // Build unique invoice number
      const nextInvNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newSale: Sale = {
        id: `s_${Date.now()}`,
        invoiceNumber: nextInvNum,
        items: [...cart],
        subtotal: subtotal,
        discountAmount: invoiceDiscount,
        taxAmount: taxAmount,
        total: grandTotal,
        payments: finalPayments,
        paymentMethod: paymentMethod,
        customerId: selectedCustomerId || undefined,
        customerName: activeCustomer?.name || undefined,
        cashierId: currentUser.id,
        cashierName: currentUser.name,
        date: getLocalDateTimeString(),
        notes: isArabic ? 'فاتورة بيع مباشرة من الكاشير' : 'Cashier desk sale',
        saleType: saleType
      };

      // Commit to state database
      onAddSale(newSale);

      // Update product stock levels for each cart item
      cart.forEach(item => {
        onUpdateProductStock(item.productId, item.variantId, -item.quantity, nextInvNum);
      });

      setReceiptSale(newSale);
    }

    setCheckoutSuccess(true);
    
    // Clear cart states
    setCart([]);
    setInvoiceDiscount(0);
    setSelectedCustomerId('');
    setPaymentMethod('Cash');
    setSplitCash(0);
    setSplitVisa(0);
    setSplitVfCash(0);
    setSplitInstapay(0);
  };

  const handleLoadInvoiceForEditing = (sale: Sale) => {
    setCart(sale.items);
    setInvoiceDiscount(sale.discountAmount);
    setSelectedCustomerId(sale.customerId || '');
    setPaymentMethod(sale.paymentMethod);
    setSaleType(sale.saleType || 'retail');
    setCurrentEditingInvoice(sale);
    
    if (sale.paymentMethod === 'Split') {
      const splitCashVal = sale.payments?.find(p => p.method === 'Cash')?.amount || 0;
      const splitVisaVal = sale.payments?.find(p => p.method === 'Visa')?.amount || 0;
      const splitVfVal = sale.payments?.find(p => p.method === 'Vodafone Cash')?.amount || 0;
      const splitInstapayVal = sale.payments?.find(p => p.method === 'Instapay')?.amount || 0;
      setSplitCash(splitCashVal);
      setSplitVisa(splitVisaVal);
      setSplitVfCash(splitVfVal);
      setSplitInstapay(splitInstapayVal);
    }
    
    setInfoMsg(isArabic 
      ? `⚠️ تم تحميل محتويات الفاتورة ${sale.invoiceNumber} في السلة للتعديل والبيع من جديد!` 
      : `⚠️ Loaded items from invoice ${sale.invoiceNumber} into basket for editing!`
    );
    setTimeout(() => setInfoMsg(''), 6000);
  };

  useEffect(() => {
    if (initialInvoiceToLoad) {
      handleLoadInvoiceForEditing(initialInvoiceToLoad);
      if (onClearInitialInvoiceToLoad) {
        onClearInitialInvoiceToLoad();
      }
    }
  }, [initialInvoiceToLoad]);

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString(isArabic ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${isArabic ? 'ج.م' : 'EGP'}`;
  };

  return (
    <div className="flex flex-col gap-4 h-full" id="pos-terminal-wrapper">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center bg-gray-900/40 border border-white/5 p-1 rounded-2xl w-full shrink-0">
        <button
          type="button"
          onClick={() => setMobilePosTab('products')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
            mobilePosTab === 'products'
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 shadow-lg'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Shirt className="w-4 h-4" />
          <span>{isArabic ? 'كتالوج الملابس والأصناف' : 'Clothing Catalog'}</span>
        </button>
        <button
          type="button"
          onClick={() => setMobilePosTab('cart')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer relative ${
            mobilePosTab === 'cart'
              ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 shadow-lg'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{isArabic ? 'سلة الكاشير' : 'Checkout Cart'}</span>
          {cart.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border border-gray-900 animate-pulse">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[calc(100vh-140px)] lg:min-h-[500px] h-auto flex-1" id="pos-terminal-grid">
        
        {/* 1. LEFT CONTAINER: SEARCH AND APPAREL PRODUCT GRID (7 Cols) */}
        <div className={`lg:col-span-7 flex flex-col space-y-4 lg:h-full h-auto lg:overflow-hidden ${mobilePosTab === 'products' ? 'flex' : 'hidden lg:flex'}`}>
        
        {/* Rapid Search and Scan Simulation panel */}
        <div className="p-4 rounded-2xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl flex flex-col gap-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Live Search */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text"
                placeholder={isArabic ? 'ابحث باسم المنتج، براند، أو باركود...' : 'Search by name, brand, barcode...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-gray-950/60 border border-gray-800 text-white placeholder-gray-500"
                id="pos-product-search-input"
              />
            </div>

            {/* Simulated Barcode Trigger list */}
            <div className="flex items-center gap-1.5 shrink-0 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl text-[10px] text-indigo-300 font-mono overflow-x-auto max-w-full">
              <ScanLine className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="font-bold shrink-0">{isArabic ? 'محاكاة الباركود:' : 'Scan simulator:'}</span>
              {simScans.map((scan, idx) => (
                <button
                  key={idx}
                  onClick={() => simulateBarcodeScan(scan.barcode)}
                  className="bg-gray-900 hover:bg-gray-800 text-indigo-400 border border-gray-800 px-1.5 py-0.5 rounded cursor-pointer transition-all"
                  id={`sim-scan-btn-${idx}`}
                >
                  {scan.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alert messages inside terminal */}
          {errorMsg && (
            <div className="p-2 bg-rose-500/15 border border-rose-500/20 rounded-lg text-[10px] font-bold text-rose-400 text-center flex items-center justify-center gap-2">
              <CircleAlert className="w-3.5 h-3.5" />
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="p-2 bg-emerald-500/15 border border-emerald-500/20 rounded-lg text-[10px] font-bold text-emerald-400 text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {infoMsg}
            </div>
          )}

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none pr-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-gray-950/40 text-gray-400 border border-gray-800/80 hover:bg-gray-900'
                }`}
                id={`cat-filter-${cat}`}
              >
                {cat === 'All' ? (isArabic ? 'الكل' : 'All Apparel') : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products List Scrollable Stage */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-gray-800 rounded-3xl p-6 text-center">
              <span className="text-3xl">👗👔</span>
              <p className="text-xs text-gray-500 font-bold mt-3">
                {isArabic ? 'لم نجد ملابس تطابق فلتر البحث الحالي!' : 'No clothing items match this filter!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4" id="pos-products-grid">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.variants.every(v => v.quantity === 0);
                
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (!isOutOfStock) {
                        setShowVariantModal(p);
                      }
                    }}
                    className={`p-3 rounded-2xl bg-gray-900/30 border transition-all duration-200 text-xs flex flex-col h-full relative cursor-pointer ${
                      isOutOfStock 
                        ? 'opacity-50 border-rose-500/10' 
                        : 'border-white/5 hover:border-indigo-500/30 hover:bg-gray-900/40 hover:shadow-lg hover:shadow-indigo-500/5'
                    }`}
                    id={`pos-prod-card-${p.id}`}
                  >
                    {p.discount > 0 && (
                      <span className="absolute top-2.5 right-2.5 px-1.5 py-0.5 rounded-md bg-rose-500 text-white text-[9px] font-black z-10 font-mono">
                        -{p.discount}%
                      </span>
                    )}
                    {/* Styled Badge/Text block instead of Image */}
                    <div className="relative rounded-xl overflow-hidden mb-2 px-3 py-3 bg-gray-950/80 border border-white/5 flex flex-col justify-between h-20">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-300 font-extrabold uppercase px-1.5 py-0.5 rounded border border-indigo-500/20 truncate max-w-[80%]">
                          {p.brand}
                        </span>
                        <Shirt className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      </div>
                      <div className="text-[9px] text-gray-400 font-bold truncate">
                        {p.category}
                      </div>
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center font-black text-[10px] text-rose-400 uppercase tracking-widest">
                          {isArabic ? 'نفذ بالكامل' : 'SOLD OUT'}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between space-y-1.5">
                      <div>
                        <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block">{p.brand}</span>
                        <h4 className="font-extrabold text-white leading-snug line-clamp-1 truncate">{p.name}</h4>
                      </div>

                      {/* Variant quick color indicator preview dot */}
                      <div className="flex items-center gap-1">
                        {getProductColors(p).slice(0, 4).map((col, idx) => (
                          <span 
                            key={idx} 
                            style={{ backgroundColor: col }} 
                            className="w-2 h-2 rounded-full border border-gray-800 shrink-0" 
                          />
                        ))}
                        {getProductColors(p).length > 4 && (
                          <span className="text-[8px] text-gray-500 font-bold font-mono">+{getProductColors(p).length - 4}</span>
                        )}
                      </div>

                      <div className="flex items-end justify-between pt-1">
                        <div className="font-sans">
                          {p.discount > 0 ? (
                            <>
                              <span className="text-emerald-400 font-bold font-sans">
                                {formatCurrency(p.sellingPrice * (1 - p.discount / 100))}
                              </span>
                              <span className="text-[10px] text-gray-500 line-through block font-sans">
                                {formatCurrency(p.sellingPrice)}
                              </span>
                            </>
                          ) : (
                            <span className="text-white font-bold font-sans">
                              {formatCurrency(p.sellingPrice)}
                            </span>
                          )}
                        </div>
                        <span className="text-[9px] text-gray-400 font-medium">
                          {isArabic ? 'اختر مقاس/لون' : 'Select'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Summary of Last 5 Invoices */}
        <div className="bg-[#0F0F12]/80 border border-white/5 rounded-2xl p-3.5 space-y-3 shrink-0" id="quick-last-invoices-summary">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-black text-white flex items-center gap-2 uppercase tracking-wider">
              <Receipt className="w-3.5 h-3.5 text-indigo-400" />
              <span>{isArabic ? 'آخر 5 فواتير صادرة 📄' : 'Last 5 Issued Invoices 📄'}</span>
            </h4>
            <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-bold font-mono">
              {isArabic ? 'إجراءات سريعة للطباعة' : 'Quick Print Desk'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-[10px]">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 font-bold uppercase tracking-wider text-[9px]">
                  <th className="pb-1 px-1">{isArabic ? 'رقم الفاتورة' : 'Invoice #'}</th>
                  <th className="pb-1 px-1">{isArabic ? 'التاريخ' : 'Date'}</th>
                  <th className="pb-1 px-1">{isArabic ? 'العميل' : 'Customer'}</th>
                  <th className="pb-1 px-1">{isArabic ? 'المبلغ الكلي' : 'Total'}</th>
                  <th className="pb-1 px-1 text-center">{isArabic ? 'طباعة سريعة 🖨️' : 'Quick Print 🖨️'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/30 text-gray-300 font-sans">
                {sales.slice(-5).reverse().map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-800/10 transition-all">
                    <td className="py-2 px-1 font-mono font-bold text-white text-[11px]">{sale.invoiceNumber}</td>
                    <td className="py-2 px-1 text-gray-400 font-mono text-[9px]">{sale.date.substring(5, 16)}</td>
                    <td className="py-2 px-1 font-bold truncate max-w-[75px]">{sale.customerName || (isArabic ? 'عميل نقدي' : 'Cash')}</td>
                    <td className="py-2 px-1 font-bold text-emerald-400">{formatCurrency(sale.total)}</td>
                    <td className="py-2 px-1 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          printThermalReceipt(sale, settings, isArabic);
                        }}
                        className="mx-auto px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg flex items-center justify-center gap-1 cursor-pointer text-[9px] transition-all"
                        title={isArabic ? 'طباعة حرارية مباشرة الفاتورة' : 'Direct Thermal Print Invoice'}
                      >
                        <Printer className="w-3 h-3" />
                        <span>{isArabic ? 'طباعة' : 'Print'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500 font-semibold">
                      {isArabic ? 'لا توجد فواتير صادرة بعد' : 'No invoices issued yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 2. RIGHT CONTAINER: CASH DESK AND CART PANEL (5 Cols) */}
      <div className={`lg:col-span-5 flex flex-col lg:h-full h-auto min-h-[500px] lg:min-h-0 bg-gray-950/50 border border-white/5 rounded-3xl lg:overflow-hidden shadow-2xl ${mobilePosTab === 'cart' ? 'flex' : 'hidden lg:flex'}`}>
        
        {/* Cart Header */}
        <div className="p-4 border-b border-gray-800/40 bg-gray-950/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-indigo-400 shrink-0" />
            <h4 className="text-xs font-black text-white">{isArabic ? 'سلة المبيعات والطلب' : 'POS Checkout Basket'}</h4>
          </div>
          
          {/* Wholesale / Retail Toggle Buttons */}
          <div className="flex items-center bg-gray-900 border border-white/5 p-0.5 rounded-lg">
            <button
              onClick={() => handleToggleSaleType('retail')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold transition-all cursor-pointer ${
                saleType === 'retail' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {isArabic ? 'قطاعي' : 'Retail'}
            </button>
            <button
              onClick={() => handleToggleSaleType('wholesale')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold transition-all cursor-pointer ${
                saleType === 'wholesale' 
                  ? 'bg-amber-600 text-white shadow-md' 
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {isArabic ? 'جملة' : 'Wholesale'}
            </button>
          </div>

          <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold font-mono">
            {cart.reduce((acc, curr) => acc + curr.quantity, 0)} {isArabic ? 'وحدات' : 'items'}
          </span>
        </div>

        {/* Editing Invoice Banner */}
        {currentEditingInvoice && (
          <div className="mx-4 my-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[10px] font-bold text-amber-400 flex items-center justify-between gap-2 shrink-0 animate-pulse">
            <span>⚠️ {isArabic ? `أنت تقوم بتعديل الفاتورة رقم: ${currentEditingInvoice.invoiceNumber}` : `You are editing invoice: ${currentEditingInvoice.invoiceNumber}`}</span>
            <button 
              onClick={() => {
                setCurrentEditingInvoice(null);
                setCart([]);
                setInvoiceDiscount(0);
                setSelectedCustomerId('');
              }}
              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[8px] font-extrabold uppercase shrink-0 cursor-pointer"
            >
              {isArabic ? 'إلغاء التعديل' : 'Cancel'}
            </button>
          </div>
        )}

        {/* Customer Attachment Panel */}
        <div className="p-3 border-b border-gray-800/20 bg-gray-900/20 flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setShowAddCustomerQuick(false);
              }}
              className="flex-1 bg-gray-950 border border-gray-800 text-[11px] text-gray-200 py-1.5 px-3 rounded-xl focus:outline-none"
              id="pos-customer-selector"
            >
              <option value="">{isArabic ? '👤 عميل نقدي (بدون تتبع نقاط)' : '👤 Cash customer (No loyalty)'}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>
            <button
              onClick={() => setShowAddCustomerQuick(!showAddCustomerQuick)}
              className="p-1.5 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 cursor-pointer"
              title={isArabic ? 'إضافة عميل سريع' : 'Add customer'}
              id="pos-quick-customer-add-toggle"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Loyalty points banner */}
          {activeCustomer && (
            <div className="p-2 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[10px] flex justify-between text-indigo-300">
              <span>{isArabic ? 'العميل المميز:' : 'Premium VIP:'} <strong>{activeCustomer.name}</strong></span>
              <span>{isArabic ? 'نقاط الولاء:' : 'Loyalty PTS:'} <strong className="text-white font-mono">{activeCustomer.loyaltyPoints} نقطة</strong></span>
            </div>
          )}

          {/* Quick Customer Add Form Drawer */}
          {showAddCustomerQuick && (
            <form onSubmit={handleCreateCustomerQuick} className="p-3 bg-gray-950/80 border border-indigo-500/20 rounded-xl space-y-2.5 text-[11px]">
              <span className="font-bold text-indigo-400 block">{isArabic ? 'تسجيل عميل سريع' : 'Register Customer'}</span>
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="text" 
                  required
                  placeholder={isArabic ? 'الاسم بالكامل' : 'Full Name'} 
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="bg-gray-900 border border-gray-800 p-1.5 rounded focus:outline-none"
                  id="pos-new-customer-name"
                />
                <input 
                  type="text" 
                  required
                  placeholder={isArabic ? 'رقم الهاتف' : 'Phone'} 
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="bg-gray-900 border border-gray-800 p-1.5 rounded focus:outline-none font-mono"
                  id="pos-new-customer-phone"
                />
              </div>
              <input 
                type="text" 
                placeholder={isArabic ? 'العنوان (اختياري)' : 'Address (Optional)'} 
                value={newCustAddress}
                onChange={(e) => setNewCustAddress(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 p-1.5 rounded focus:outline-none"
                id="pos-new-customer-address"
              />
              <button 
                type="submit" 
                className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded cursor-pointer text-center"
                id="pos-new-customer-submit"
              >
                {isArabic ? 'حفظ وإلحاق بالطلب' : 'Save & Attach'}
              </button>
            </form>
          )}
        </div>

        {/* Cart Item rows scroll list */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-800/30 px-3 py-1 bg-gray-950/20">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 text-center text-gray-500 gap-2">
              <span className="text-2xl opacity-40">🛍️</span>
              <p className="text-[11px] font-bold">{isArabic ? 'ابدأ باختيار الملابس أو مسح الباركود' : 'Add clothes to complete receipt checkout'}</p>
            </div>
          ) : (
            cart.map((item) => {
              // Locate max quantities from actual product to safeguard POS checkout
              const associatedProduct = products.find(p => p.id === item.productId);
              const assocVariant = associatedProduct?.variants.find(v => v.id === item.variantId);
              const stockLimit = assocVariant ? assocVariant.quantity : 99;

              return (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-gray-400 font-bold block truncate">{item.name}</span>
                    <div className="flex items-center gap-1.5 text-[9px] text-gray-500 mt-1 font-sans">
                      <span>{isArabic ? 'المقاس:' : 'Size:'} <strong className="text-gray-300 font-mono">{item.size}</strong></span>
                      <span>•</span>
                      <span>{isArabic ? 'اللون:' : 'Color:'} <strong className="text-gray-300">{item.color}</strong></span>
                    </div>
                  </div>

                  {/* Quantity Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity, stockLimit, -1)}
                      className="p-1 rounded bg-gray-900 border border-gray-800 text-gray-400 hover:text-white cursor-pointer"
                      id={`cart-minus-${item.id}`}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-mono font-bold text-white text-[11px]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQty(item.id, item.quantity, stockLimit, 1)}
                      className="p-1 rounded bg-gray-900 border border-gray-800 text-gray-400 hover:text-white cursor-pointer"
                      id={`cart-plus-${item.id}`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Subtotal & Delete */}
                  <div className="text-right shrink-0 min-w-[70px]">
                    <span className="font-bold text-white block font-sans">{formatCurrency(item.subtotal)}</span>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1.5 text-gray-500 hover:text-rose-400 cursor-pointer"
                    id={`cart-delete-${item.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Totals & Checkout Panel */}
        <div className="p-4 border-t border-gray-800/40 bg-gray-950/80 space-y-3.5 shrink-0">
          
          {/* Subtotal, Direct invoice discount input, Egypt tax */}
          <div className="space-y-1.5 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>{isArabic ? 'المجموع المؤقت:' : 'Temporary Subtotal:'}</span>
              <span className="text-white font-mono">{formatCurrency(subtotal)}</span>
            </div>

            {/* Custom Discount Panel */}
            <div className="flex items-center justify-between text-rose-400">
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                <span>{isArabic ? 'خصم مخصص للعميل (ج.م):' : 'EGP Custom Discount:'}</span>
              </div>
              <input 
                type="number"
                min="0"
                max={subtotal}
                value={invoiceDiscount || ''}
                onChange={(e) => setInvoiceDiscount(Math.min(Number(e.target.value), subtotal))}
                placeholder="0"
                className="w-16 bg-gray-900 border border-gray-800 rounded px-1.5 py-0.5 text-right font-mono text-white text-xs focus:outline-none"
                id="pos-invoice-discount-input"
              />
            </div>

            {/* Egypt VAT 14% */}
            <div className="flex justify-between">
              <span>{isArabic ? `ضريبة القيمة المضافة (${settings.taxRate || 14}%):` : `VAT (${settings.taxRate || 14}%):`}</span>
              <span className="text-white font-mono">{formatCurrency(taxAmount)}</span>
            </div>

            {/* Grand Total */}
            <div className="flex justify-between text-white text-base font-black border-t border-gray-800/60 pt-2.5 mt-1.5">
              <span>{isArabic ? 'المجموع الصافي النهائي:' : 'Receipt Grand Total:'}</span>
              <span className="text-indigo-400 font-sans">{formatCurrency(grandTotal)}</span>
            </div>
          </div>

          {/* Payment Methods selector */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">
              {isArabic ? 'طريقة السداد المناسبة:' : 'METHOD OF SETTLEMENT:'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('Cash')}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  paymentMethod === 'Cash' 
                    ? 'bg-teal-500/10 border-teal-500/30 text-teal-400 shadow-md' 
                    : 'bg-gray-900 border-gray-800 text-gray-400'
                }`}
                id="payment-method-cash"
              >
                <Wallet className="w-4 h-4 shrink-0" />
                <span>Cash</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('Visa')}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  paymentMethod === 'Visa' 
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 shadow-md' 
                    : 'bg-gray-900 border-gray-800 text-gray-400'
                }`}
                id="payment-method-visa"
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span>Visa Card</span>
              </button>

              <button
                type="button"
                onClick={handleSelectSplit}
                className={`py-1.5 px-2 rounded-xl text-[10px] font-bold border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer col-span-1 ${
                  paymentMethod === 'Split' 
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 shadow-md' 
                    : 'bg-gray-900 border-gray-800 text-gray-400'
                }`}
                id="payment-method-split"
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span>Split Payment</span>
              </button>
            </div>

            {/* If Mobile Wallets / Vodafone Cash is preferred */}
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setPaymentMethod('Vodafone Cash')}
                className={`py-1 px-2 rounded-xl text-[9px] font-bold border transition-all cursor-pointer ${
                  paymentMethod === 'Vodafone Cash' 
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' 
                    : 'bg-gray-900 border-gray-800 text-gray-400'
                }`}
                id="payment-method-vodafone"
              >
                Vodafone Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('Instapay')}
                className={`py-1 px-2 rounded-xl text-[9px] font-bold border transition-all cursor-pointer ${
                  paymentMethod === 'Instapay' 
                    ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' 
                    : 'bg-gray-900 border-gray-800 text-gray-400'
                }`}
                id="payment-method-instapay"
              >
                Instapay
              </button>
            </div>
          </div>

          {/* Split Payment values inputs if activated */}
          {paymentMethod === 'Split' && (
            <div className="p-3 bg-gray-950 border border-yellow-500/20 rounded-xl space-y-2.5 text-[11px] font-sans">
              <span className="font-bold text-yellow-500 block">{isArabic ? 'تفاصيل السداد المتعدد:' : 'Split values entry:'}</span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-gray-500 block mb-0.5">Cash EGP</label>
                  <input 
                    type="number" 
                    value={splitCash || ''} 
                    onChange={(e) => setSplitCash(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-800 p-1 rounded text-white text-xs font-mono"
                    id="split-cash-input"
                  />
                </div>
                <div>
                  <label className="text-gray-500 block mb-0.5">Visa Card EGP</label>
                  <input 
                    type="number" 
                    value={splitVisa || ''} 
                    onChange={(e) => setSplitVisa(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-800 p-1 rounded text-white text-xs font-mono"
                    id="split-visa-input"
                  />
                </div>
                <div>
                  <label className="text-gray-500 block mb-0.5">Vodafone EGP</label>
                  <input 
                    type="number" 
                    value={splitVfCash || ''} 
                    onChange={(e) => setSplitVfCash(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-800 p-1 rounded text-white text-xs font-mono"
                    id="split-vodafone-input"
                  />
                </div>
                <div>
                  <label className="text-gray-500 block mb-0.5">Instapay EGP</label>
                  <input 
                    type="number" 
                    value={splitInstapay || ''} 
                    onChange={(e) => setSplitInstapay(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-800 p-1 rounded text-white text-xs font-mono"
                    id="split-instapay-input"
                  />
                </div>
              </div>
              <div className="text-[10px] text-gray-400 flex justify-between pt-1 border-t border-gray-900">
                <span>{isArabic ? 'الموزع الكلي:' : 'Split Sum:'} <strong className="text-white font-mono">{splitCash + splitVisa + splitVfCash + splitInstapay}</strong></span>
                <span>{isArabic ? 'المطلوب:' : 'Required:'} <strong className="text-indigo-400 font-mono">{grandTotal}</strong></span>
              </div>
            </div>
          )}

          {/* Action Trigger checkout button */}
          <button
            type="button"
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer ${
              cart.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            id="pos-checkout-submit-button"
          >
            <Landmark className="w-4 h-4 shrink-0" />
            <span>{isArabic ? 'إنهاء وحفظ المعاملة الفورية' : 'Execute Receipt Settlement'}</span>
          </button>

        </div>

      </div>

      {/* 3. VARIANT SELECTION DRAWER/MODAL DIALOG */}
      {showVariantModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-gray-950 border border-gray-800 rounded-3xl p-6 shadow-2xl relative"
            id="pos-variant-picker-modal"
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b border-gray-800 pb-3 mb-5">
              <div>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">{showVariantModal.brand}</span>
                <h3 className="text-base font-extrabold text-white">{showVariantModal.name}</h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{isArabic ? 'اختر المقاس واللون المتاح للتسليم' : 'Pick the matching size/color'}</p>
              </div>
              <button 
                onClick={() => setShowVariantModal(null)}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-gray-900 border border-gray-800 rounded-lg cursor-pointer font-bold"
              >
                {isArabic ? 'تراجع' : 'Cancel'}
              </button>
            </div>

            {/* List of variants in tabular selection */}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              <div className="grid grid-cols-4 text-[10px] font-extrabold text-gray-500 uppercase pb-1 border-b border-gray-900 px-2">
                <span>{isArabic ? 'اللون' : 'Color'}</span>
                <span>{isArabic ? 'المقاس' : 'Size'}</span>
                <span>{isArabic ? 'المخزون الحالي' : 'Stock'}</span>
                <span className="text-center">{isArabic ? 'إجراء' : 'Action'}</span>
              </div>

              {showVariantModal.variants.map((v) => {
                const outStock = v.quantity <= 0;
                return (
                  <div 
                    key={v.id} 
                    className={`grid grid-cols-4 items-center py-2 px-2 rounded-xl text-xs transition-colors ${
                      outStock ? 'bg-red-500/5 text-gray-500' : 'hover:bg-gray-900 text-gray-200'
                    }`}
                  >
                    {/* Color */}
                    <div className="flex items-center gap-2">
                      <span 
                        style={{ backgroundColor: v.colorHex || '#FFF' }} 
                        className="w-3.5 h-3.5 rounded-full border border-gray-800 shrink-0"
                      />
                      <span className="truncate">{v.color}</span>
                    </div>

                    {/* Size */}
                    <span className="font-mono font-extrabold text-white text-sm">{v.size}</span>

                    {/* Stock status pill */}
                    <div>
                      {outStock ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[10px] font-bold">
                          {isArabic ? 'منتهي' : 'Out'}
                        </span>
                      ) : (
                        <span className={`px-1.5 py-0.5 rounded font-mono font-bold text-[11px] ${
                          v.quantity <= showVariantModal.stockAlertLevel 
                            ? 'bg-amber-500/10 text-amber-400' 
                            : 'bg-emerald-500/10 text-emerald-400'
                        }`}>
                          {v.quantity} {isArabic ? 'قطعة' : 'pcs'}
                        </span>
                      )}
                    </div>

                    {/* Select trigger button */}
                    <div className="text-center">
                      <button
                        type="button"
                        disabled={outStock}
                        onClick={() => handleAddVariantToCart(showVariantModal, v)}
                        className={`w-full py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${
                          outStock 
                            ? 'bg-gray-900 text-gray-600 cursor-not-allowed' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow shadow-indigo-600/15'
                        }`}
                        id={`select-variant-${v.id}`}
                      >
                        {isArabic ? '+ السلة' : '+ Basket'}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* 4. RECEIPT SHOWDOWN DIALOG MODAL (CHOP CHECKOUT SUCCESS) */}
      {checkoutSuccess && receiptSale && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-white text-gray-900 rounded-3xl p-6 shadow-2xl relative border-t-8 border-indigo-600"
            id="thermal-receipt-modal"
          >
            
            {/* Header Stamp Success */}
            <div className="text-center pb-4 border-b border-dashed border-gray-300">
              <div className="inline-flex items-center justify-center p-2.5 bg-emerald-100 text-emerald-600 rounded-full mb-3 shadow">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-black tracking-tight">{isArabic ? 'تم حفظ فاتورة المبيعات بنجاح' : 'Invoice Saved Successfully'}</h2>
              <p className="text-[10px] text-gray-500 mt-0.5">{isArabic ? 'تم تحديث كميات مخزون المحل آلياً' : 'Store apparel stock levels synced'}</p>
            </div>

            {/* Thermal Printable Receipt frame */}
            <div className="py-4 space-y-4 font-mono text-[11px] text-gray-700" id="thermal-receipt-print-area">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-black text-black">{settings.storeName || (isArabic ? 'محل الصقر' : 'Al-Saqr Store')}</h3>
                <p className="text-[10px]">{settings.address || (isArabic ? 'مصر الجديدة، القاهرة' : 'Cairo, Egypt')}</p>
                <p className="text-[10px]">{isArabic ? 'هاتف:' : 'Tel:'} {settings.phone}</p>
              </div>

              <div className="border-t border-b border-dashed border-gray-300 py-2 space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>{isArabic ? 'رقم الفاتورة:' : 'Invoice No:'}</span>
                  <strong className="text-black">{receiptSale.invoiceNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span>{isArabic ? 'التاريخ والتوقيت:' : 'Date:'}</span>
                  <span>{receiptSale.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isArabic ? 'الكاشير:' : 'Cashier:'}</span>
                  <span>{receiptSale.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isArabic ? 'العميل الملحق:' : 'Customer Attached:'}</span>
                  <span>{receiptSale.customerName || (isArabic ? 'عميل نقدي' : 'Cash checkout')}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isArabic ? 'نوع المبيعات:' : 'Sale Category:'}</span>
                  <span className={`px-1.5 py-0.2 rounded font-bold ${receiptSale.saleType === 'wholesale' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
                    {receiptSale.saleType === 'wholesale' ? (isArabic ? 'بيع جملة' : 'Wholesale') : (isArabic ? 'قطاعي (مفرد)' : 'Retail')}
                  </span>
                </div>
              </div>

              {/* Items in thermal list */}
              <div className="space-y-2 border-b border-dashed border-gray-300 pb-3">
                <span className="font-extrabold text-black block mb-1 text-center">{isArabic ? '--- بيان المشتريات ---' : '--- APPAREL SALES ITEMS ---'}</span>
                {receiptSale.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between leading-tight text-[10px]">
                    <div className="max-w-[240px]">
                      <span className="font-bold text-black">{it.name}</span>
                      <span className="block text-gray-500">
                        ({it.size} / {it.color}) • {it.quantity} x {formatCurrency(it.finalPrice)}
                      </span>
                    </div>
                    <span className="font-bold text-black self-end">{formatCurrency(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Total calculations */}
              <div className="space-y-1 text-right text-[10px] font-sans">
                <div className="flex justify-between">
                  <span>{isArabic ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                  <span>{formatCurrency(receiptSale.subtotal)}</span>
                </div>
                <div className="flex justify-between text-rose-600">
                  <span>{isArabic ? 'خصم الفاتورة مخصص:' : 'Invoice Discount:'}</span>
                  <span>-{formatCurrency(receiptSale.discountAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isArabic ? `ضريبة القيمة المضافة (${settings.taxRate || 14}%):` : `VAT (${settings.taxRate || 14}%):`}</span>
                  <span>{formatCurrency(receiptSale.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-black text-sm font-black border-t border-dashed border-gray-300 pt-2 font-mono">
                  <span>{isArabic ? 'المجموع الإجمالي:' : 'Grand Net Total:'}</span>
                  <span className="text-lg">{formatCurrency(receiptSale.total)}</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 pt-1.5">
                  <span>{isArabic ? 'طريقة الدفع:' : 'Payment:'}</span>
                  <strong>{receiptSale.paymentMethod}</strong>
                </div>
              </div>

              {/* QR and Barcode Mock Simulation */}
              <div className="text-center pt-3 border-t border-dashed border-gray-300 space-y-2 font-sans">
                <div className="bg-gray-100 p-2 inline-block rounded-xl border">
                  <div className="grid grid-cols-6 gap-0.5 w-24 h-24 mx-auto opacity-80 select-none">
                    {/* Simulated visual QR blocks */}
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div 
                        key={i} 
                        className={`w-full h-full ${
                          (i % 3 === 0 || i % 4 === 0 || i < 6 || i > 30 || (i % 7 === 0 && i > 12)) 
                            ? 'bg-black' 
                            : 'bg-white'
                        }`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-[8px] text-gray-400">
                  {isArabic ? 'شكراً لزيارتكم • يسعدنا دائماً خدمتكم' : 'THANK YOU FOR SHOPPING WITH US • AL-PRINCE APPAREL'}
                </p>
              </div>

            </div>

            {/* Print share controls */}
            <div className="flex gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => printThermalReceipt(receiptSale, settings, isArabic)}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1 cursor-pointer shadow"
                id="receipt-print-btn"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isArabic ? 'طباعة الفاتورة 🖨️' : 'Print Thermal 🖨️'}</span>
              </button>

              <button
                type="button"
                onClick={() => alert(isArabic ? 'تم حفظ ملف الفاتورة بصيغة PDF في مجلد التنزيلات!' : 'Invoice saved as PDF to downloads!')}
                className="py-2 px-3 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center justify-center gap-1 cursor-pointer"
                id="receipt-share-btn"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCheckoutSuccess(false);
                  setReceiptSale(null);
                }}
                className="py-2 px-4 rounded-xl text-xs font-bold bg-gray-900 hover:bg-gray-800 text-white cursor-pointer"
                id="receipt-close-btn"
              >
                {isArabic ? 'الرجوع للمبيعات' : 'Next Sale'}
              </button>
            </div>

          </motion.div>
        </div>
      )}

    </div>
    </div>
  );
}
