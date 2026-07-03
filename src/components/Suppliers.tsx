import React, { useState } from 'react';
import { Supplier, Product, StoreSettings, User, StockHistory } from '../types';
import { 
  Truck, Plus, Phone, MapPin, Landmark, HandCoins, 
  Search, RefreshCw, Layers, CheckCircle2, ShoppingBag, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SuppliersProps {
  suppliers: Supplier[];
  products: Product[];
  settings: StoreSettings;
  currentUser: User;
  onAddSupplier: (newSupp: Supplier) => void;
  onUpdateSupplierDebt: (supplierId: string, payAmount: number) => void;
  onOrderStockFromSupplier: (supplierId: string, productId: string, variantId: string, qty: number, costPrice: number) => void;
  isArabic: boolean;
}

export default function Suppliers({
  suppliers,
  products,
  settings,
  currentUser,
  onAddSupplier,
  onUpdateSupplierDebt,
  onOrderStockFromSupplier,
  isArabic
}: SuppliersProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDebtForm, setShowDebtForm] = useState<Supplier | null>(null);
  const [showOrderForm, setShowOrderForm] = useState<Supplier | null>(null);

  // Quick State parameters
  const [searchTerm, setSearchTerm] = useState('');
  
  // Supplier Add form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [initialDebt, setInitialDebt] = useState<number>(0);

  // Debt Payment form fields
  const [payAmount, setPayAmount] = useState<number>(0);

  // Stock replenishment form fields
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [orderQty, setOrderQty] = useState<number>(10);
  const [customCost, setCustomCost] = useState<number>(0);

  // Computed data matches
  const activeOrderProduct = products.find(p => p.id === selectedProductId);

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const newSupp: Supplier = {
      id: `s_${Date.now()}`,
      name,
      phone,
      address: address || (isArabic ? 'العنوان غير محدد' : 'Not Specified'),
      debt: initialDebt,
      productsCount: 0
    };

    onAddSupplier(newSupp);
    
    // reset
    setName('');
    setPhone('');
    setAddress('');
    setInitialDebt(0);
    setShowAddForm(false);
  };

  const handlePayDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDebtForm || payAmount <= 0) return;

    onUpdateSupplierDebt(showDebtForm.id, -payAmount);
    setPayAmount(0);
    setShowDebtForm(null);
  };

  const handleOrderReplenishSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showOrderForm || !selectedProductId || !selectedVariantId || orderQty <= 0) return;

    // Execute order stock
    onOrderStockFromSupplier(
      showOrderForm.id,
      selectedProductId,
      selectedVariantId,
      orderQty,
      customCost
    );

    // Reset fields
    setSelectedProductId('');
    setSelectedVariantId('');
    setOrderQty(10);
    setCustomCost(0);
    setShowOrderForm(null);
  };

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.phone.includes(searchTerm) ||
    s.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString(isArabic ? 'ar-EG' : 'en-US')} ${isArabic ? 'ج.م' : 'EGP'}`;
  };

  return (
    <div className="space-y-6" id="suppliers-tab-root">
      
      {/* Title Header with Add Supp Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-indigo-400 animate-pulse" />
            {isArabic ? 'إدارة الموردين والمديونيات والتوريد' : 'Suppliers & Wholesalers Registry'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {isArabic 
              ? 'تسجيل مكاتب بيع الجملة ومصانع المنسوجات، وتتبع حساب المديونيات المعلقة، ومحاكاة طلبات شحن الملابس للمحل.' 
              : 'Add apparel mills, maintain balance sheet records, and execute restock procurement streams.'}
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-md flex items-center gap-1.5 self-start"
            id="add-new-supplier-button"
          >
            <Plus className="w-4 h-4" />
            <span>{isArabic ? 'تسجيل مورد ملابس جديد' : 'Register Supplier'}</span>
          </button>
        )}
      </div>

      {/* Grid view containing suppliers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Suppliers Grid List (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Form Quick Add Supplier inline drawer */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-3xl bg-gray-900/35 border border-indigo-500/10 backdrop-blur-md shadow-xl"
              id="supplier-add-form"
            >
              <form onSubmit={handleCreateSupplier} className="space-y-4 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                  <span className="font-extrabold text-indigo-400">{isArabic ? 'نموذج تسجيل مورد / مصنع منسوجات' : 'New Supplier Attributes'}</span>
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)}
                    className="p-1 rounded-lg bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'اسم الشركة / المورد' : 'Supplier Name'}</label>
                    <input 
                      type="text" required placeholder={isArabic ? 'مثال: مكتب الهدى للملابس' : 'Supplier/Mill name'}
                      value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'رقم الهاتف' : 'Contact Phone'}</label>
                    <input 
                      type="text" required placeholder="010XXXXXXXX"
                      value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 font-mono focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'العنوان' : 'Office Address'}</label>
                    <input 
                      type="text" placeholder={isArabic ? 'مثال: العتبة، القاهرة' : 'Address'}
                      value={address} onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'المديونية الافتتاحية (ج.م)' : 'Opening Debt credit (EGP)'}</label>
                    <input 
                      type="number" min="0"
                      value={initialDebt || ''} onChange={(e) => setInitialDebt(Number(e.target.value))}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3.5 py-1.5 bg-gray-800 text-gray-300 rounded-lg font-bold"
                  >
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 bg-indigo-600 text-white rounded-lg font-bold shadow-md cursor-pointer"
                  >
                    {isArabic ? 'تسجيل المورد' : 'Register Vendor'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Suppliers Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5" id="suppliers-list-display">
            {filteredSuppliers.length === 0 ? (
              <div className="col-span-full py-16 text-center border border-dashed border-gray-800 rounded-3xl p-6 text-gray-500 font-bold">
                {isArabic ? 'لا يوجد أي مورد ملابس مطابق للبحث الحالي!' : 'No suppliers found matching your query.'}
              </div>
            ) : (
              filteredSuppliers.map((sup) => (
                <div 
                  key={sup.id}
                  className="p-5 rounded-3xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3.5">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-white text-sm">{sup.name}</h4>
                        <span className="text-[9px] text-gray-500 font-bold tracking-widest block mt-0.5 uppercase">
                          {isArabic ? 'شركة توريد ملابس معتمدة' : 'Verified Apparel Supplier'}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-[10px] font-mono font-bold">
                        {sup.productsCount || 0} {isArabic ? 'أصناف' : 'items'}
                      </span>
                    </div>

                    {/* Contact detail block */}
                    <div className="text-[11px] text-gray-400 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-500" />
                        <span className="font-mono">{sup.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-500" />
                        <span className="truncate max-w-[200px]">{sup.address}</span>
                      </div>
                    </div>

                    {/* Debts Schedule Display */}
                    <div className="p-3 bg-gray-950 border border-gray-850 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wide block">{isArabic ? 'المديونية المستحقة للمورد' : 'DEBT OUTSTANDING'}</span>
                        <span className={`text-xs font-mono font-black ${
                          sup.debt > 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {formatCurrency(sup.debt)}
                        </span>
                      </div>
                      {sup.debt > 0 && (
                        <span className="text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-md font-bold px-1.5 py-0.5 uppercase tracking-wide animate-pulse">
                          {isArabic ? 'مطالبة دفع' : 'Payable'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="pt-4 border-t border-gray-800/40 grid grid-cols-2 gap-2">
                    {/* Pay Debt trigger */}
                    <button
                      onClick={() => {
                        setShowDebtForm(sup);
                        setShowOrderForm(null);
                        setPayAmount(Math.min(sup.debt, 5000));
                      }}
                      className="py-2 bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 border border-rose-500/20 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1"
                      id={`pay-debt-trigger-${sup.id}`}
                    >
                      <HandCoins className="w-3.5 h-3.5 shrink-0" />
                      <span>{isArabic ? 'تسديد دفعة مالية' : 'Pay debt'}</span>
                    </button>

                    {/* Replenish restock trigger */}
                    <button
                      onClick={() => {
                        setShowOrderForm(sup);
                        setShowDebtForm(null);
                        if (products.length > 0) {
                          setSelectedProductId(products[0].id);
                          setSelectedVariantId(products[0].variants[0]?.id || '');
                          setCustomCost(products[0].purchasePrice);
                        }
                      }}
                      className="py-2 bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1"
                      id={`procure-trigger-${sup.id}`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                      <span>{isArabic ? 'شحن بضاعة للمحل' : 'Procure stock'}</span>
                    </button>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>

        {/* Right Side: Floating modal interaction drawers (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <AnimatePresence mode="wait">
            
            {/* INTERACTION 1: Pay debt Form card */}
            {showDebtForm && (
              <motion.div
                key="debt-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6 rounded-3xl bg-gray-900/35 border border-rose-500/10 backdrop-blur-md shadow-xl space-y-4"
                id="supplier-debt-pay-form-card"
              >
                <div className="flex justify-between items-start border-b border-gray-800 pb-2">
                  <h5 className="font-extrabold text-white text-xs flex items-center gap-1">
                    <HandCoins className="w-4 h-4 text-rose-400" />
                    <span>{isArabic ? 'تسجيل سداد دائنية' : 'Pay debt schedules'}</span>
                  </h5>
                  <button 
                    onClick={() => setShowDebtForm(null)}
                    className="p-1 rounded-lg bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <form onSubmit={handlePayDebtSubmit} className="space-y-3.5 text-xs text-gray-300">
                  <div className="p-3.5 bg-gray-950 border border-rose-500/15 rounded-2xl">
                    <span className="text-[9px] text-gray-500 font-bold block uppercase">{isArabic ? 'المستفيد:' : 'Payee Vendor:'}</span>
                    <strong className="text-white text-xs block mt-0.5">{showDebtForm.name}</strong>
                    <span className="text-[10px] text-gray-400 mt-2 block">
                      {isArabic ? 'المديونية الكلية المستحقة:' : 'Total due debit:'} <strong className="text-rose-400 font-mono">{formatCurrency(showDebtForm.debt)}</strong>
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'القيمة المدفوعة (ج.م):' : 'Payment Amount (EGP):'}</label>
                    <input 
                      type="number" min="1" max={showDebtForm.debt} required
                      value={payAmount || ''} onChange={(e) => setPayAmount(Math.min(Number(e.target.value), showDebtForm.debt))}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-center text-sm font-bold focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md text-center"
                    id="submit-debt-payment-btn"
                  >
                    {isArabic ? 'تأكيد السداد والخصم من الحساب' : 'Execute payment'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* INTERACTION 2: Procure / Order Stock Form card */}
            {showOrderForm && (
              <motion.div
                key="order-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="p-6 rounded-3xl bg-gray-900/35 border border-emerald-500/10 backdrop-blur-md shadow-xl space-y-4"
                id="supplier-order-form-card"
              >
                <div className="flex justify-between items-start border-b border-gray-800 pb-2">
                  <h5 className="font-extrabold text-white text-xs flex items-center gap-1">
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    <span>{isArabic ? 'طلب شحن بضاعة للمحل' : 'Procure inventory cargo'}</span>
                  </h5>
                  <button 
                    onClick={() => setShowOrderForm(null)}
                    className="p-1 rounded-lg bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {products.length === 0 ? (
                  <div className="py-6 text-center text-gray-500 font-semibold border rounded-xl border-dashed">
                    {isArabic ? 'يجب تسجيل ملابس بالدليل أولاً!' : 'Register clothes in catalog first!'}
                  </div>
                ) : (
                  <form onSubmit={handleOrderReplenishSubmit} className="space-y-3.5 text-xs text-gray-300">
                    <div className="p-3.5 bg-gray-950 border border-emerald-500/15 rounded-2xl">
                      <span className="text-[9px] text-gray-500 font-bold block uppercase">{isArabic ? 'جهة التوريد المصنعة:' : 'Fabric Supplier:'}</span>
                      <strong className="text-white text-xs block mt-0.5">{showOrderForm.name}</strong>
                    </div>

                    {/* Product Selection */}
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'الموديل المطلوب توريده:' : 'Select apparel model:'}</label>
                      <select
                        value={selectedProductId}
                        onChange={(e) => {
                          const pId = e.target.value;
                          setSelectedProductId(pId);
                          const matchingP = products.find(p => p.id === pId);
                          if (matchingP) {
                            setSelectedVariantId(matchingP.variants[0]?.id || '');
                            setCustomCost(matchingP.purchasePrice);
                          }
                        }}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                        id="order-product-selector"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.brand} - {p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Variant Selection inside product */}
                    {activeOrderProduct && (
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'اختر المقاس واللون المكمل:' : 'Select exact size/color:'}</label>
                        <select
                          value={selectedVariantId}
                          onChange={(e) => setSelectedVariantId(e.target.value)}
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                          id="order-variant-selector"
                        >
                          {activeOrderProduct.variants.map((v) => (
                            <option key={v.id} value={v.id}>{v.color} - {v.size} (الرصيد الحالي: {v.quantity})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Quantity & Custom cost */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'كمية الشحنة:' : 'Procure Qty:'}</label>
                        <input 
                          type="number" min="1" required
                          value={orderQty || ''} onChange={(e) => setOrderQty(Math.max(1, Number(e.target.value)))}
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-center font-bold"
                          id="order-quantity-input"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'تكلفة القطعة (ج.م):' : 'Unit Cost Cost:'}</label>
                        <input 
                          type="number" min="1" required
                          value={customCost || ''} onChange={(e) => setCustomCost(Number(e.target.value))}
                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-center font-bold"
                          id="order-cost-input"
                        />
                      </div>
                    </div>

                    {/* Total Order Cost preview */}
                    <div className="p-3 bg-gray-950 border border-gray-900 rounded-xl flex justify-between text-[11px] font-sans">
                      <span>{isArabic ? 'تكلفة التوريد الكلية:' : 'Total Shipment Billing:'}</span>
                      <strong className="text-white font-mono">{formatCurrency(orderQty * customCost)}</strong>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md text-center"
                      id="submit-procure-order-btn"
                    >
                      {isArabic ? 'شحن البضاعة وإضافة التكلفة للمديونية' : 'Execute resting shipment'}
                    </button>
                  </form>
                )}
              </motion.div>
            )}

            {/* DEFAULT STATE DRAW HELP PANEL */}
            {!showDebtForm && !showOrderForm && (
              <div className="p-6 rounded-3xl bg-gray-900/35 border border-dashed border-gray-800 shadow-xl flex flex-col justify-center items-center text-center py-20 text-gray-500 gap-2 font-sans">
                <Truck className="w-8 h-8 text-gray-700 animate-bounce" />
                <h5 className="font-extrabold text-xs text-gray-400">{isArabic ? 'مكتب سكرتارية التوريد والمحاسبة' : 'Vendor Procurement Office'}</h5>
                <p className="text-[10px] leading-relaxed max-w-[180px]">
                  {isArabic ? 'اضغط على تسديد الديون أو توريد بضاعة في يسار الشاشة لبدء المعاملة.' : 'Press Pay Debt or Procure buttons from the left vendor listing to execute transactions.'}
                </p>
              </div>
            )}

          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}


