import React, { useState, useEffect } from 'react';
import { 
  User, StoreSettings, Product, Customer, Supplier, Sale, Expense, StockHistory, AppNotification, UserRole 
} from './types';
import { StoreDB, INITIAL_PRODUCTS, INITIAL_CUSTOMERS, INITIAL_SUPPLIERS, INITIAL_SALES, INITIAL_EXPENSES, INITIAL_USERS } from './data';
import { getLocalDateString, getLocalDateTimeString } from './utils';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Returns from './components/Returns';
import Invoices from './components/Invoices';
import Products from './components/Products';
import Inventory from './components/Inventory';
import Customers from './components/Customers';
import Suppliers from './components/Suppliers';
import Reports from './components/Reports';
import SettingsComponent from './components/Settings';
import LowStockAlertModal from './components/LowStockAlertModal';
import { 
  subscribeCollection, 
  subscribeSettings, 
  syncCollectionToFirestore, 
  saveSettingsToFirestore 
} from './firebase';

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'أناقة كلوذينج شوب',
  phone: '01012345678',
  address: 'شارع عباس العقاد، مدينة نصر، القاهرة',
  taxRate: 14,
  currency: 'EGP',
  language: 'ar',
  theme: 'dark',
  salesTarget: 150000
};

export default function App() {
  // Authentication & Global states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editingInvoice, setEditingInvoice] = useState<Sale | null>(null);
  const [isArabic, setIsArabic] = useState(true);
  const [universalSearchTerm, setUniversalSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  // Business state ledger
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [history, setHistory] = useState<StockHistory[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [lowStockItemsForAlert, setLowStockItemsForAlert] = useState<{
    product: Product;
    variantName: string;
    size: string;
    color: string;
    qty: number;
    threshold: number;
  }[]>([]);

  // 1. Initial Local Database Loading & Firebase Real-time Synchronization Setup
  useEffect(() => {
    // A. First, load existing local cache instantly to prevent any screen flash or empty lists
    const savedSetts = StoreDB.get<StoreSettings>('settings', DEFAULT_SETTINGS);
    setSettings(savedSetts);
    setIsArabic(savedSetts.language === 'ar');

    const savedUsers = StoreDB.get<User[]>('users', INITIAL_USERS);
    setUsers(savedUsers);

    const savedProducts = StoreDB.get<Product[]>('products', INITIAL_PRODUCTS);
    setProducts(savedProducts);

    const savedCustomers = StoreDB.get<Customer[]>('customers', INITIAL_CUSTOMERS);
    setCustomers(savedCustomers);

    const savedSuppliers = StoreDB.get<Supplier[]>('suppliers', INITIAL_SUPPLIERS);
    setSuppliers(savedSuppliers);

    const savedSales = StoreDB.get<Sale[]>('sales', INITIAL_SALES);
    setSales(savedSales);

    const savedExpenses = StoreDB.get<Expense[]>('expenses', INITIAL_EXPENSES);
    setExpenses(savedExpenses);

    // Initial Stock History seed
    const initialHistory: StockHistory[] = [];
    INITIAL_PRODUCTS.forEach(p => {
      p.variants.forEach(v => {
        initialHistory.push({
          id: `h_init_${v.id}`,
          productId: p.id,
          productName: p.name,
          variantId: v.id,
          size: v.size,
          color: v.color,
          type: 'In',
          quantity: v.quantity,
          previousQty: 0,
          newQty: v.quantity,
          date: '2026-06-01 10:00',
          reason: 'الرصيد الافتتاحي لتأسيس المحل',
          operator: 'م. كريم ممدوح'
        });
      });
    });
    const savedHistory = StoreDB.get<StockHistory[]>('history', initialHistory);
    setHistory(savedHistory);

    // Initial notifications seed
    const initialNotifs: AppNotification[] = [
      {
        id: 'n_welcome',
        title: 'أهلاً بك في نظام أناقة POS!',
        message: 'تم تفعيل التخزين السحابي الفوري والعمل دون إنترنت بنجاح.',
        type: 'target_achieved',
        isRead: false,
        date: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      }
    ];
    const savedNotifs = StoreDB.get<AppNotification[]>('notifications', initialNotifs);
    setNotifications(savedNotifs);

    // B. Setup real-time listeners to sync across multiple devices (Laptops, Phones, etc.)
    const unsubSettings = subscribeSettings<StoreSettings>(
      (updatedSettings) => {
        setSettings(updatedSettings);
        setIsArabic(updatedSettings.language === 'ar');
      },
      DEFAULT_SETTINGS
    );

    const unsubUsers = subscribeCollection<User>('users', INITIAL_USERS, setUsers);
    const unsubProducts = subscribeCollection<Product>('products', INITIAL_PRODUCTS, setProducts);
    const unsubCustomers = subscribeCollection<Customer>('customers', INITIAL_CUSTOMERS, setCustomers);
    const unsubSuppliers = subscribeCollection<Supplier>('suppliers', INITIAL_SUPPLIERS, setSuppliers);
    const unsubSales = subscribeCollection<Sale>('sales', INITIAL_SALES, setSales);
    const unsubExpenses = subscribeCollection<Expense>('expenses', INITIAL_EXPENSES, setExpenses);
    const unsubHistory = subscribeCollection<StockHistory>('history', initialHistory, setHistory);
    const unsubNotifs = subscribeCollection<AppNotification>('notifications', initialNotifs, setNotifications);

    return () => {
      // Cleanup subscriptions on unmount
      unsubSettings();
      unsubUsers();
      unsubProducts();
      unsubCustomers();
      unsubSuppliers();
      unsubSales();
      unsubExpenses();
      unsubHistory();
      unsubNotifs();
    };
  }, []);

  // Sync state helper (Updates LocalCache + MemoryState + Firestore Cloud Sync)
  const syncState = <T,>(key: string, data: T, setter: React.Dispatch<React.SetStateAction<T>>) => {
    // 1. Update localStorage instantly
    StoreDB.set(key, data);
    // 2. Update React memory state instantly
    setter(data);
    // 3. Smart-Sync to Firestore in the background
    if (key === 'settings') {
      saveSettingsToFirestore(data);
    } else if (Array.isArray(data)) {
      syncCollectionToFirestore(key, data as any[]);
    }
  };

  // Login handler
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    addNotification({
      id: `n_login_${Date.now()}`,
      title: isArabic ? 'تسجيل دخول جديد' : 'New User Login',
      message: isArabic 
        ? `قام الموظف ${user.name} (${user.role === 'Owner' ? 'المالك' : user.role === 'Manager' ? 'المدير' : 'الكاشير'}) بتسجيل الدخول الفوري.` 
        : `${user.name} logged in successfully as ${user.role}.`,
      type: 'target_achieved',
      isRead: false,
      date: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });

    // Check low stock levels
    const alertItems: {
      product: Product;
      variantName: string;
      size: string;
      color: string;
      qty: number;
      threshold: number;
    }[] = [];

    products.forEach(p => {
      p.variants.forEach(v => {
        if (v.quantity <= p.stockAlertLevel) {
          alertItems.push({
            product: p,
            variantName: `${p.name} (${v.color} - ${v.size})`,
            size: v.size,
            color: v.color,
            qty: v.quantity,
            threshold: p.stockAlertLevel
          });
        }
      });
    });

    if (alertItems.length > 0) {
      setLowStockItemsForAlert(alertItems);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Notification utilities
  const addNotification = (notif: AppNotification) => {
    const updated = [notif, ...notifications].slice(0, 20);
    syncState('notifications', updated, setNotifications);
  };

  const markNotificationAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    syncState('notifications', updated, setNotifications);
  };

  // Settings update
  const handleUpdateSettings = (newSetts: StoreSettings) => {
    syncState('settings', newSetts, setSettings);
    setIsArabic(newSetts.language === 'ar');
  };

  const handleUpdateUsers = (newUsers: User[]) => {
    syncState('users', newUsers, setUsers);
  };

  // PRODUCTS CATALOG CRUD
  const handleAddProduct = (newProduct: Product) => {
    const updated = [newProduct, ...products];
    syncState('products', updated, setProducts);

    const newLogs: StockHistory[] = newProduct.variants.map(v => ({
      id: `h_add_${v.id}_${Date.now()}`,
      productId: newProduct.id,
      productName: newProduct.name,
      variantId: v.id,
      size: v.size,
      color: v.color,
      type: 'In',
      quantity: v.quantity,
      previousQty: 0,
      newQty: v.quantity,
      date: getLocalDateTimeString().substring(0, 16),
      reason: isArabic ? 'تسجيل منتج جديد وتعبئة رصيد افتتاحي' : 'Apparel model catalog registration opening stock',
      operator: currentUser?.name || 'النظام التلقائي'
    }));

    syncState('history', [...newLogs, ...history], setHistory);

    addNotification({
      id: `notif_add_${newProduct.id}`,
      title: isArabic ? 'تم إضافة موديل ملابس' : 'New apparel registered',
      message: isArabic 
        ? `تم إضافة الموديل ${newProduct.name} ماركة ${newProduct.brand} بنجاح للكتالوج.` 
        : `Successfully registered ${newProduct.name} (${newProduct.brand}) to catalogue.`,
      type: 'large_sale',
      isRead: false,
      date: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    const updated = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    syncState('products', updated, setProducts);

    addNotification({
      id: `notif_up_${updatedProduct.id}`,
      title: isArabic ? 'تم تحديث بيانات الموديل' : 'Apparel model modified',
      message: isArabic 
        ? `تم تحديث مواصفات ${updatedProduct.name} ومصفوفة المقاسات بالكامل.` 
        : `Successfully updated dimensions specs for ${updatedProduct.name}.`,
      type: 'large_sale',
      isRead: false,
      date: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });
  };

  const handleDeleteProduct = (productId: string) => {
    const updated = products.filter(p => p.id !== productId);
    syncState('products', updated, setProducts);
  };

  const handleClearAllProducts = () => {
    syncState('products', [], setProducts);
  };

  // INVENTORY stock manual direct changes
  const handleUpdateProductStockDirectly = (productId: string, variantId: string, newQty: number, reason: string) => {
    let previousQty = 0;
    let targetVariantColor = '';
    let targetVariantSize = '';
    let targetProductName = '';

    const updatedProducts = products.map(p => {
      if (p.id !== productId) return p;
      targetProductName = p.name;
      
      const updatedVariants = p.variants.map(v => {
        if (v.id !== variantId) return v;
        previousQty = v.quantity;
        targetVariantColor = v.color;
        targetVariantSize = v.size;
        return { ...v, quantity: newQty };
      });

      return { ...p, variants: updatedVariants };
    });

    syncState('products', updatedProducts, setProducts);

    const changeAmount = Math.abs(newQty - previousQty);
    const newLog: StockHistory = {
      id: `h_adj_${variantId}_${Date.now()}`,
      productId,
      productName: targetProductName,
      variantId,
      size: targetVariantSize,
      color: targetVariantColor,
      type: 'Adjustment',
      quantity: changeAmount,
      previousQty,
      newQty,
      date: getLocalDateTimeString().substring(0, 16),
      reason,
      operator: currentUser?.name || 'مدير النظام'
    };

    syncState('history', [newLog, ...history], setHistory);

    addNotification({
      id: `notif_adj_${Date.now()}`,
      title: isArabic ? 'تعديل مخزني يدوي' : 'Manual stock adjustment',
      message: isArabic 
        ? `تم تعديل رصيد ${targetProductName} (${targetVariantColor}/${targetVariantSize}) من ${previousQty} إلى ${newQty}.` 
        : `Adjusted ${targetProductName} qty from ${previousQty} to ${newQty}.`,
      type: 'low_stock',
      isRead: false,
      date: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });
  };

  // POS INTERFACES: Direct invoice adding & separate stock updates
  const handleAddSale = (newSale: Sale) => {
    const updatedSales = [newSale, ...sales];
    syncState('sales', updatedSales, setSales);

    // Award loyalty points to customers automatically
    if (newSale.customerId) {
      const updatedCustomers = customers.map(cust => {
        if (cust.id !== newSale.customerId) return cust;
        const updatedSpent = cust.totalSpent + newSale.total;
        const updatedOrders = cust.ordersCount + 1;
        const ptsGranted = Math.floor(newSale.total / 10); // +1 point per 10 EGP spent
        const updatedPoints = cust.loyaltyPoints + ptsGranted;

        return {
          ...cust,
          totalSpent: updatedSpent,
          ordersCount: updatedOrders,
          loyaltyPoints: updatedPoints,
          lastPurchaseDate: newSale.date
        };
      });
      syncState('customers', updatedCustomers, setCustomers);
    }

    addNotification({
      id: `notif_sale_${newSale.id}`,
      title: isArabic ? 'تم تأكيد عملية البيع وطباعة الفاتورة' : 'Sale transaction committed',
      message: isArabic 
        ? `تم إصدار الفاتورة رقم ${newSale.invoiceNumber} بمبلغ ${newSale.total.toLocaleString()} ج.م بنجاح.` 
        : `Successfully issued checkout invoice ${newSale.invoiceNumber} totaling EGP ${newSale.total}.`,
      type: 'large_sale',
      isRead: false,
      date: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });
  };

  const handleUpdateSale = (updatedSale: Sale) => {
    const updatedSales = sales.map(s => s.id === updatedSale.id ? updatedSale : s);
    syncState('sales', updatedSales, setSales);

    // Update customer's total spent / loyalty points if they had one
    if (updatedSale.customerId) {
      const originalSale = sales.find(s => s.id === updatedSale.id);
      const originalTotal = originalSale ? originalSale.total : 0;
      const diffTotal = updatedSale.total - originalTotal;

      if (diffTotal !== 0) {
        const updatedCustomers = customers.map(cust => {
          if (cust.id !== updatedSale.customerId) return cust;
          const updatedSpent = Math.max(0, cust.totalSpent + diffTotal);
          const ptsDelta = Math.floor(updatedSale.total / 10) - Math.floor(originalTotal / 10);
          const updatedPoints = Math.max(0, cust.loyaltyPoints + ptsDelta);

          return {
            ...cust,
            totalSpent: updatedSpent,
            loyaltyPoints: updatedPoints,
            lastPurchaseDate: updatedSale.date
          };
        });
        syncState('customers', updatedCustomers, setCustomers);
      }
    }

    addNotification({
      id: `notif_sale_up_${updatedSale.id}`,
      title: isArabic ? 'تم حفظ التعديلات على الفاتورة' : 'Sale transaction updated',
      message: isArabic 
        ? `تم تحديث الفاتورة رقم ${updatedSale.invoiceNumber} بالكامل بنجاح.` 
        : `Successfully applied edits to invoice ${updatedSale.invoiceNumber}.`,
      type: 'large_sale',
      isRead: false,
      date: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });
  };

  const handleReturnSale = (
    saleId: string,
    returnedItems: { variantId: string; productId: string; quantity: number; returnToStock: boolean }[],
    returnedAmount: number
  ) => {
    // 1. Update sales: mark returned and update refund amount
    const targetSale = sales.find(s => s.id === saleId);
    if (!targetSale) return;

    const updatedSales = sales.map(s => {
      if (s.id !== saleId) return s;
      const prevRefunded = s.returnedAmount || 0;
      return {
        ...s,
        isReturned: true,
        returnedAmount: prevRefunded + returnedAmount
      };
    });
    syncState('sales', updatedSales, setSales);

    // 2. Adjust products inventory stock for items returned to stock
    const updatedProducts = products.map(prod => {
      const itemsToUpdateForThisProduct = returnedItems.filter(ri => ri.productId === prod.id && ri.returnToStock);
      if (itemsToUpdateForThisProduct.length === 0) return prod;

      const updatedVariants = prod.variants.map(v => {
        const item = itemsToUpdateForThisProduct.find(ri => ri.variantId === v.id);
        if (!item) return v;

        const previousQty = v.quantity;
        const newQty = previousQty + item.quantity;

        // Log to stock history
        const returnLog: StockHistory = {
          id: `h_ret_${v.id}_${Date.now()}_${Math.floor(Math.random() * 100)}`,
          productId: prod.id,
          productName: prod.name,
          variantId: v.id,
          size: v.size,
          color: v.color,
          type: 'Adjustment',
          quantity: item.quantity,
          previousQty,
          newQty,
          date: getLocalDateTimeString().substring(0, 16),
          reason: isArabic 
            ? `مرتجع مبيعات للفاتورة رقم ${targetSale.invoiceNumber}` 
            : `Sales return for invoice #${targetSale.invoiceNumber}`,
          operator: currentUser?.name || 'مدير النظام'
        };

        // Sync history immediately
        const currentHist = StoreDB.get<StockHistory[]>('history', []);
        const updatedHistory = [returnLog, ...currentHist];
        syncState('history', updatedHistory, setHistory);

        return { ...v, quantity: newQty };
      });

      return { ...prod, variants: updatedVariants };
    });
    syncState('products', updatedProducts, setProducts);

    // 3. Deductspent total and points from customer
    if (targetSale.customerId) {
      const updatedCustomers = customers.map(cust => {
        if (cust.id !== targetSale.customerId) return cust;
        const newSpent = Math.max(0, cust.totalSpent - returnedAmount);
        const ptsDeducted = Math.floor(returnedAmount / 10);
        const newPoints = Math.max(0, cust.loyaltyPoints - ptsDeducted);
        return {
          ...cust,
          totalSpent: newSpent,
          loyaltyPoints: newPoints
        };
      });
      syncState('customers', updatedCustomers, setCustomers);
    }

    addNotification({
      id: `notif_ret_${saleId}_${Date.now()}`,
      title: isArabic ? 'تم تأكيد مرتجع المبيعات' : 'Sales return processed',
      message: isArabic
        ? `تم تسجيل عملية مرتجع للفاتورة ${targetSale.invoiceNumber} بقيمة مستردة قدرها ${returnedAmount.toLocaleString()} ج.م.`
        : `Successfully processed refund for invoice ${targetSale.invoiceNumber} totaling EGP ${returnedAmount}.`,
      type: 'low_stock',
      isRead: false,
      date: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });
  };

  const handleUpdateProductStockFromPOS = (productId: string, variantId: string, changeQty: number, invoiceNum: string) => {
    let previousQty = 0;
    let targetVariantColor = '';
    let targetVariantSize = '';
    let targetProductName = '';
    let alertStockLevel = 5;

    const updatedProducts = products.map(p => {
      if (p.id !== productId) return p;
      targetProductName = p.name;
      alertStockLevel = p.stockAlertLevel;
      
      const updatedVariants = p.variants.map(v => {
        if (v.id !== variantId) return v;
        previousQty = v.quantity;
        targetVariantColor = v.color;
        targetVariantSize = v.size;
        const finalQty = Math.max(0, previousQty + changeQty); // changeQty is negative during sale (e.g., -2)
        return { ...v, quantity: finalQty };
      });

      return { ...p, variants: updatedVariants };
    });

    syncState('products', updatedProducts, setProducts);

    const absoluteQty = Math.abs(changeQty);
    const finalNewQty = Math.max(0, previousQty + changeQty);

    // Create history record
    const saleLog: StockHistory = {
      id: `h_pos_${variantId}_${Date.now()}_${Math.floor(Math.random() * 100)}`,
      productId,
      productName: targetProductName,
      variantId,
      size: targetVariantSize,
      color: targetVariantColor,
      type: 'Sale',
      quantity: absoluteQty,
      previousQty,
      newQty: finalNewQty,
      date: getLocalDateTimeString().substring(0, 16),
      reason: `عملية بيع كاشير فاتورة ${invoiceNum}`,
      operator: currentUser?.name || 'الكاشير'
    };

    // Save and sync history
    const currentHist = StoreDB.get<StockHistory[]>('history', []);
    const updatedHistory = [saleLog, ...currentHist];
    syncState('history', updatedHistory, setHistory);

    // Notify if depleted below safety threshold
    if (finalNewQty <= alertStockLevel) {
      addNotification({
        id: `notif_dep_${variantId}_${Date.now()}`,
        title: isArabic ? 'تنبيه مخزون منخفض!' : 'Low safety stock warning!',
        message: isArabic 
          ? `نفذ أو شارف مخزون ${targetProductName} المقاس ${targetVariantSize} اللون ${targetVariantColor} على النفاد (الرصيد: ${finalNewQty} قطعة).`
          : `Safety stock low for ${targetProductName} (${targetVariantColor}/${targetVariantSize}). Left: ${finalNewQty}.`,
        type: finalNewQty === 0 ? 'out_of_stock' : 'low_stock',
        isRead: false,
        date: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      });
    }
  };

  // CUSTOMERS ADD
  const handleAddCustomer = (newCust: Customer) => {
    const updated = [newCust, ...customers];
    syncState('customers', updated, setCustomers);

    addNotification({
      id: `notif_cust_${newCust.id}`,
      title: isArabic ? 'تم تسجيل عميل جديد' : 'New customer profile',
      message: isArabic 
        ? `تم تسجيل بيانات العميل ${newCust.name} في قاعدة الـ CRM بنجاح.` 
        : `Successfully added customer ${newCust.name} to POS loyalty directory.`,
      type: 'target_achieved',
      isRead: false,
      date: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });
  };

  // SUPPLIERS
  const handleAddSupplier = (newSupp: Supplier) => {
    const updated = [newSupp, ...suppliers];
    syncState('suppliers', updated, setSuppliers);

    addNotification({
      id: `notif_supp_${newSupp.id}`,
      title: isArabic ? 'تسجيل جهة توريد ملابس' : 'Supplier registered',
      message: isArabic 
        ? `تم قيد المورد ${newSupp.name} في حسابات الجملة بنجاح.` 
        : `Successfully registered ${newSupp.name} to supplier database.`,
      type: 'target_achieved',
      isRead: false,
      date: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });
  };

  const handleUpdateSupplierDebt = (supplierId: string, payAmount: number) => {
    let targetSupplierName = '';
    const updatedSuppliers = suppliers.map(s => {
      if (s.id !== supplierId) return s;
      targetSupplierName = s.name;
      const newDebt = Math.max(0, s.debt + payAmount);
      return { ...s, debt: newDebt };
    });

    syncState('suppliers', updatedSuppliers, setSuppliers);

    addNotification({
      id: `notif_pay_${supplierId}_${Date.now()}`,
      title: isArabic ? 'تحديث حساب مديونية مورد' : 'Supplier debt ledger update',
      message: isArabic 
        ? `تم سداد دفعة مالية بقيمة ${Math.abs(payAmount).toLocaleString()} ج.م لصالح ${targetSupplierName}.` 
        : `Registered payment of EGP ${Math.abs(payAmount)} to ${targetSupplierName}.`,
      type: payAmount < 0 ? 'large_sale' : 'low_stock',
      isRead: false,
      date: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });
  };

  const handleOrderStockFromSupplier = (supplierId: string, productId: string, variantId: string, qty: number, costPrice: number) => {
    let targetProductName = '';
    let targetColor = '';
    let targetSize = '';

    const updatedProducts = products.map(p => {
      if (p.id !== productId) return p;
      targetProductName = p.name;
      
      const updatedVariants = p.variants.map(v => {
        if (v.id !== variantId) return v;
        targetColor = v.color;
        targetSize = v.size;
        const previousQty = v.quantity;
        const newQty = previousQty + qty;

        const replenishLog: StockHistory = {
          id: `h_repl_${v.id}_${Date.now()}`,
          productId: p.id,
          productName: p.name,
          variantId: v.id,
          size: v.size,
          color: v.color,
          type: 'In',
          quantity: qty,
          previousQty,
          newQty,
          date: getLocalDateTimeString().substring(0, 16),
          reason: `توريد شحنة ملابس جديدة من المورد`,
          operator: currentUser?.name || 'مكتب المشتريات'
        };

        // Append log to history
        const currentHist = StoreDB.get<StockHistory[]>('history', []);
        StoreDB.set('history', [replenishLog, ...currentHist]);
        setHistory([replenishLog, ...currentHist]);

        return { ...v, quantity: newQty };
      });

      return { ...p, variants: updatedVariants };
    });

    syncState('products', updatedProducts, setProducts);

    // Supplier billing debt addition
    const orderBillingAmount = qty * costPrice;
    let targetSupplierName = '';

    const updatedSuppliers = suppliers.map(s => {
      if (s.id !== supplierId) return s;
      targetSupplierName = s.name;
      const updatedDebt = s.debt + orderBillingAmount;
      return { ...s, debt: updatedDebt };
    });

    syncState('suppliers', updatedSuppliers, setSuppliers);

    addNotification({
      id: `notif_proc_${Date.now()}`,
      title: isArabic ? 'شحنة ملابس جديدة بالمخزن' : 'Apparel shipment arrived',
      message: isArabic 
        ? `تم إضافة ${qty} قطعة من ${targetProductName} (${targetColor}/${targetSize}) للمخزن وإضافة ${orderBillingAmount.toLocaleString()} ج.م لمديونية المورد ${targetSupplierName}.` 
        : `Successfully restocked ${qty} units of ${targetProductName}. Added EGP ${orderBillingAmount} to ${targetSupplierName}'s account.`,
      type: 'large_sale',
      isRead: false,
      date: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });
  };

  // EXPENSES
  const handleAddExpense = (newExp: Expense) => {
    const updated = [newExp, ...expenses];
    syncState('expenses', updated, setExpenses);

    addNotification({
      id: `notif_exp_${newExp.id}`,
      title: isArabic ? 'سند صرف مصروفات تشغيلية' : 'Store operational expense logged',
      message: isArabic 
        ? `تم تسجيل مصروف ${newExp.title} بقيمة ${newExp.amount.toLocaleString()} ج.م بنجاح.` 
        : `Successfully logged expense ${newExp.title} (EGP ${newExp.amount}).`,
      type: 'low_stock',
      isRead: false,
      date: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });
  };

  const handleDeleteExpense = (expId: string) => {
    const updated = expenses.filter(e => e.id !== expId);
    syncState('expenses', updated, setExpenses);
  };

  // Router matching
  const renderTabContent = () => {
    if (currentUser) {
      const defaultRoles: Record<string, UserRole[]> = {
        dashboard: ['Owner', 'Manager', 'Cashier'],
        pos: ['Owner', 'Manager', 'Cashier'],
        returns: ['Owner', 'Manager', 'Cashier'],
        invoices: ['Owner', 'Manager', 'Cashier'],
        products: ['Owner', 'Manager'],
        inventory: ['Owner', 'Manager'],
        customers: ['Owner', 'Manager', 'Cashier'],
        suppliers: ['Owner', 'Manager'],
        reports: ['Owner'],
        settings: ['Owner', 'Manager']
      };

      const allowed = (settings.permissions && settings.permissions[activeTab]) || defaultRoles[activeTab] || ['Owner'];
      
      if (!settings.allowAllRoles && !allowed.includes(currentUser.role)) {
        return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 rounded-3xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl max-w-lg mx-auto space-y-4">
            <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/20 text-rose-400">
              <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0-6V9m0 12a9 9 0 110-18 9 9 0 010 18z" />
              </svg>
            </div>
            <h3 className="text-base font-black text-white">
              {isArabic ? 'غير مصرح بالدخول 🔐' : 'Access Restricted 🔐'}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              {isArabic 
                ? 'عذراً، ليس لديك الصلاحية الفنية للوصول إلى هذا القسم. يرجى مراجعة مالك النظام لتعديل صلاحيات دورك.'
                : 'Sorry, you do not have permissions to access this section. Please contact the owner to update your account privileges.'}
            </p>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow"
            >
              {isArabic ? 'العودة للرئيسية 🏠' : 'Back to Dashboard 🏠'}
            </button>
          </div>
        );
      }
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            sales={sales} 
            products={products} 
            settings={settings} 
            setActiveTab={setActiveTab}
            isArabic={isArabic} 
          />
        );
      case 'pos':
        return (
          <POS 
            products={products} 
            customers={customers} 
            suppliers={suppliers}
            sales={sales}
            settings={settings} 
            currentUser={currentUser!} 
            onAddSale={handleAddSale}
            onUpdateSale={handleUpdateSale}
            onUpdateProductStock={handleUpdateProductStockFromPOS}
            onAddCustomer={handleAddCustomer}
            isArabic={isArabic} 
            initialInvoiceToLoad={editingInvoice}
            onClearInitialInvoiceToLoad={() => setEditingInvoice(null)}
          />
        );
      case 'returns':
        return (
          <Returns 
            sales={sales}
            products={products}
            customers={customers}
            isArabic={isArabic}
            currentUser={currentUser!}
            onReturnSale={handleReturnSale}
          />
        );
      case 'invoices':
        return (
          <Invoices 
            sales={sales}
            products={products}
            isArabic={isArabic}
            settings={settings}
            setActiveTab={setActiveTab}
            onLoadInvoiceForEditing={(sale) => setEditingInvoice(sale)}
          />
        );
      case 'products':
        return (
          <Products 
            products={products} 
            settings={settings} 
            currentUser={currentUser!} 
            onAddProduct={handleAddProduct} 
            onUpdateProduct={handleUpdateProduct} 
            onDeleteProduct={handleDeleteProduct} 
            onClearAllProducts={handleClearAllProducts}
            isArabic={isArabic} 
          />
        );
      case 'inventory':
        return (
          <Inventory 
            products={products} 
            history={history} 
            settings={settings} 
            currentUser={currentUser!} 
            onUpdateProductStockDirectly={handleUpdateProductStockDirectly} 
            isArabic={isArabic} 
          />
        );
      case 'customers':
        return (
          <Customers 
            customers={customers} 
            sales={sales} 
            settings={settings} 
            currentUser={currentUser!} 
            onAddCustomer={handleAddCustomer} 
            isArabic={isArabic} 
          />
        );
      case 'suppliers':
        return (
          <Suppliers 
            suppliers={suppliers} 
            products={products} 
            settings={settings} 
            currentUser={currentUser!} 
            onAddSupplier={handleAddSupplier} 
            onUpdateSupplierDebt={handleUpdateSupplierDebt} 
            onOrderStockFromSupplier={handleOrderStockFromSupplier}
            isArabic={isArabic} 
          />
        );
      case 'reports':
        return (
          <Reports 
            sales={sales} 
            products={products} 
            expenses={expenses} 
            settings={settings} 
            currentUser={currentUser!} 
            onAddExpense={handleAddExpense} 
            onDeleteExpense={handleDeleteExpense} 
            isArabic={isArabic} 
          />
        );
      case 'settings':
        return (
          <SettingsComponent 
            settings={settings} 
            updateSettings={handleUpdateSettings} 
            currentUser={currentUser!} 
            isArabic={isArabic} 
            users={users}
            onUpdateUsers={handleUpdateUsers}
          />
        );
      default:
        return (
          <Dashboard 
            sales={sales} 
            products={products} 
            settings={settings} 
            setActiveTab={setActiveTab}
            isArabic={isArabic} 
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 antialiased selection:bg-indigo-500/30 selection:text-white overflow-x-hidden">
      {currentUser ? (
        <Layout
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          currentUser={currentUser}
          onLogout={handleLogout}
          settings={settings}
          updateSettings={handleUpdateSettings}
          notifications={notifications}
          markNotificationAsRead={markNotificationAsRead}
          universalSearchTerm={universalSearchTerm}
          setUniversalSearchTerm={setUniversalSearchTerm}
        >
          {renderTabContent()}
          {lowStockItemsForAlert.length > 0 && (
            <LowStockAlertModal
              lowStockItems={lowStockItemsForAlert}
              isArabic={isArabic}
              onClose={() => setLowStockItemsForAlert([])}
              onGoToInventory={() => setActiveTab('inventory')}
            />
          )}
        </Layout>
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} isArabic={isArabic} theme={settings.theme} users={users} />
      )}
    </div>
  );
}
