import { Product, Customer, Supplier, Sale, StockHistory, StoreSettings, User, Expense, AppNotification } from './types';
import { getLocalDateString } from './utils';

export const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'محمود إسماعيل (المالك)', role: 'Owner', username: 'owner', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop', active: true },
  { id: 'u2', name: 'أحمد علي (المدير)', role: 'Manager', username: 'manager', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop', active: true },
  { id: 'u3', name: 'سارة محمد (كاشير)', role: 'Cashier', username: 'cashier', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&fit=crop', active: true }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'تيشرت اوفرسايز زارا قطن',
    brand: 'Zara',
    category: 'تيشرتات',
    type: 'mens',
    season: 'Summer',
    purchasePrice: 220,
    sellingPrice: 450,
    wholesalePrice: 350,
    discount: 10,
    barcode: '8801928371',
    notes: 'قطن مصري 100% ممتاز معالج ضد الانكماش',
    imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&fit=crop',
    stockAlertLevel: 5,
    variants: [
      { id: 'v1_white_s', size: 'S', color: 'أبيض', colorHex: '#FFFFFF', quantity: 12, barcode: '8801928371-WS', sku: 'Z-TS-WHT-S' },
      { id: 'v1_white_m', size: 'M', color: 'أبيض', colorHex: '#FFFFFF', quantity: 8, barcode: '8801928371-WM', sku: 'Z-TS-WHT-M' },
      { id: 'v1_white_l', size: 'L', color: 'أبيض', colorHex: '#FFFFFF', quantity: 4, barcode: '8801928371-WL', sku: 'Z-TS-WHT-L' },
      { id: 'v1_white_xl', size: 'XL', color: 'أبيض', colorHex: '#FFFFFF', quantity: 1, barcode: '8801928371-WXL', sku: 'Z-TS-WHT-XL' },
      { id: 'v1_black_s', size: 'S', color: 'أسود', colorHex: '#000000', quantity: 10, barcode: '8801928371-BS', sku: 'Z-TS-BLK-S' },
      { id: 'v1_black_m', size: 'M', color: 'أسود', colorHex: '#000000', quantity: 15, barcode: '8801928371-BM', sku: 'Z-TS-BLK-M' },
      { id: 'v1_black_l', size: 'L', color: 'أسود', colorHex: '#000000', quantity: 0, barcode: '8801928371-BL', sku: 'Z-TS-BLK-L' },
      { id: 'v1_beige_m', size: 'M', color: 'بيج', colorHex: '#F5F5DC', quantity: 6, barcode: '8801928371-BG-M', sku: 'Z-TS-BEG-M' },
      { id: 'v1_beige_l', size: 'L', color: 'بيج', colorHex: '#F5F5DC', quantity: 11, barcode: '8801928371-BG-L', sku: 'Z-TS-BEG-L' }
    ]
  },
  {
    id: 'p2',
    name: 'بنطلون جينز سليم فيت تاون تيم',
    brand: 'Town Team',
    category: 'بنطلونات',
    type: 'mens',
    season: 'All Seasons',
    purchasePrice: 350,
    sellingPrice: 650,
    wholesalePrice: 500,
    discount: 0,
    barcode: '4001928372',
    notes: 'خامة مريحة مع نسبة ليكرا خفيفة',
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&fit=crop',
    stockAlertLevel: 4,
    variants: [
      { id: 'v2_blue_30', size: '30', color: 'أزرق داكن', colorHex: '#1A365D', quantity: 5, barcode: '4001928372-B30', sku: 'TT-JN-BLU-30' },
      { id: 'v2_blue_32', size: '32', color: 'أزرق داكن', colorHex: '#1A365D', quantity: 6, barcode: '4001928372-B32', sku: 'TT-JN-BLU-32' },
      { id: 'v2_blue_34', size: '34', color: 'أزرق داكن', colorHex: '#1A365D', quantity: 0, barcode: '4001928372-B34', sku: 'TT-JN-BLU-34' },
      { id: 'v2_blue_36', size: '36', color: 'أزرق داكن', colorHex: '#1A365D', quantity: 3, barcode: '4001928372-B36', sku: 'TT-JN-BLU-36' },
      { id: 'v2_grey_32', size: '32', color: 'رمادي', colorHex: '#718096', quantity: 8, barcode: '4001928372-G32', sku: 'TT-JN-GRY-32' },
      { id: 'v2_grey_34', size: '34', color: 'رمادي', colorHex: '#718096', quantity: 4, barcode: '4001928372-G34', sku: 'TT-JN-GRY-34' }
    ]
  },
  {
    id: 'p3',
    name: 'قميص كتان كاجوال كانكريت',
    brand: 'Concrete',
    category: 'قمصان',
    type: 'mens',
    season: 'Summer',
    purchasePrice: 400,
    sellingPrice: 790,
    wholesalePrice: 600,
    discount: 15,
    barcode: '3201928373',
    notes: 'كتان طبيعي بارد ومناسب للأجواء الحارة',
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300&fit=crop',
    stockAlertLevel: 3,
    variants: [
      { id: 'v3_olive_m', size: 'M', color: 'زيتوني', colorHex: '#556B2F', quantity: 10, barcode: '3201928373-OM', sku: 'C-LN-OLV-M' },
      { id: 'v3_olive_l', size: 'L', color: 'زيتوني', colorHex: '#556B2F', quantity: 15, barcode: '3201928373-OL', sku: 'C-LN-OLV-L' },
      { id: 'v3_white_m', size: 'M', color: 'أبيض', colorHex: '#FFFFFF', quantity: 8, barcode: '3201928373-WM', sku: 'C-LN-WHT-M' },
      { id: 'v3_white_l', size: 'L', color: 'أبيض', colorHex: '#FFFFFF', quantity: 12, barcode: '3201928373-WL', sku: 'C-LN-WHT-L' },
      { id: 'v3_white_xl', size: 'XL', color: 'أبيض', colorHex: '#FFFFFF', quantity: 7, barcode: '3201928373-WXL', sku: 'C-LN-WHT-XL' }
    ]
  },
  {
    id: 'p4',
    name: 'فستان شيفون نسائي مشجر زارا',
    brand: 'Zara',
    category: 'فساتين',
    type: 'womens',
    season: 'Spring',
    purchasePrice: 600,
    sellingPrice: 1250,
    wholesalePrice: 950,
    discount: 5,
    barcode: '2201928374',
    notes: 'مبطن بالكامل تصميم أنيق جدا وعصري',
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&fit=crop',
    stockAlertLevel: 2,
    variants: [
      { id: 'v4_floral_s', size: 'S', color: 'مشجر وردي', colorHex: '#FFB6C1', quantity: 4, barcode: '2201928374-FS', sku: 'Z-DR-FLR-S' },
      { id: 'v4_floral_m', size: 'M', color: 'مشجر وردي', colorHex: '#FFB6C1', quantity: 5, barcode: '2201928374-FM', sku: 'Z-DR-FLR-M' },
      { id: 'v4_floral_l', size: 'L', color: 'مشجر وردي', colorHex: '#FFB6C1', quantity: 0, barcode: '2201928374-FL', sku: 'Z-DR-FLR-L' }
    ]
  },
  {
    id: 'p5',
    name: 'جاكيت جباردين شتوي ديفاكتو',
    brand: 'Defacto',
    category: 'جاكيت ومعاطف',
    type: 'mens',
    season: 'Winter',
    purchasePrice: 700,
    sellingPrice: 1450,
    wholesalePrice: 1100,
    discount: 20,
    barcode: '1101928375',
    notes: 'مبطن بالفرو لتدفئة ممتازة',
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&fit=crop',
    stockAlertLevel: 3,
    variants: [
      { id: 'v5_black_m', size: 'M', color: 'أسود', colorHex: '#000000', quantity: 8, barcode: '1101928375-BM', sku: 'DF-JK-BLK-M' },
      { id: 'v5_black_l', size: 'L', color: 'أسود', colorHex: '#000000', quantity: 6, barcode: '1101928375-BL', sku: 'DF-JK-BLK-L' },
      { id: 'v5_black_xl', size: 'XL', color: 'أسود', colorHex: '#000000', quantity: 2, barcode: '1101928375-BXL', sku: 'DF-JK-BLK-XL' },
      { id: 'v5_camel_m', size: 'M', color: 'جملي', colorHex: '#C19A6B', quantity: 5, barcode: '1101928375-CM', sku: 'DF-JK-CML-M' },
      { id: 'v5_camel_l', size: 'L', color: 'جملي', colorHex: '#C19A6B', quantity: 1, barcode: '1101928375-CL', sku: 'DF-JK-CML-L' }
    ]
  },
  {
    id: 'p6',
    name: 'بيجامة قطن أطفال ديفاكتو',
    brand: 'Defacto',
    category: 'ملابس نوم',
    type: 'kids',
    season: 'All Seasons',
    purchasePrice: 150,
    sellingPrice: 320,
    wholesalePrice: 240,
    discount: 0,
    barcode: '9901928376',
    notes: 'قطن ناعم جدا مريح ومناسب لبشرة الأطفال الحساسة',
    imageUrl: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=300&fit=crop',
    stockAlertLevel: 5,
    variants: [
      { id: 'v6_blue_4y', size: '4-5Y', color: 'أزرق ميكي', colorHex: '#63B3ED', quantity: 15, barcode: '9901928376-B4', sku: 'DF-PJ-BLU-4Y' },
      { id: 'v6_blue_6y', size: '6-7Y', color: 'أزرق ميكي', colorHex: '#63B3ED', quantity: 12, barcode: '9901928376-B6', sku: 'DF-PJ-BLU-6Y' },
      { id: 'v6_pink_4y', size: '4-5Y', color: 'وردي باربي', colorHex: '#F687B3', quantity: 14, barcode: '9901928376-P4', sku: 'DF-PJ-PNK-4Y' }
    ]
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'كريم ممدوح', phone: '01012345678', address: 'مصر الجديدة، القاهرة', ordersCount: 15, totalSpent: 9450, loyaltyPoints: 470, lastPurchaseDate: '2026-06-25' },
  { id: 'c2', name: 'أمنية مصطفى', phone: '01298765432', address: 'المعادي، القاهرة', ordersCount: 8, totalSpent: 5200, loyaltyPoints: 260, lastPurchaseDate: '2026-06-28' },
  { id: 'c3', name: 'طارق السعيد', phone: '01155443322', address: 'سموحة، الإسكندرية', ordersCount: 4, totalSpent: 2900, loyaltyPoints: 145, lastPurchaseDate: '2026-06-15' },
  { id: 'c4', name: 'ياسمين مروان', phone: '01588776655', address: 'الدقي، الجيزة', ordersCount: 1, totalSpent: 450, loyaltyPoints: 20, lastPurchaseDate: '2026-06-29' }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 's1', name: 'مصنع غزل ونسيج المحلة الموحد', phone: '04022334455', address: 'المحلة الكبرى، الغربية', debt: 15000, productsCount: 12, lastOrderDate: '2026-06-10' },
  { id: 's2', name: 'مكتب الهدى للملابس الجاهزة (زارا وديفاكتو)', phone: '01050506070', address: 'العتبة، القاهرة', debt: 4500, productsCount: 45, lastOrderDate: '2026-06-20' },
  { id: 's3', name: 'مجموعة النساجون للملابس والمنسوجات', phone: '0225889911', address: 'المنطقة الحرة، مدينة نصر، القاهرة', debt: 0, productsCount: 8, lastOrderDate: '2026-05-15' }
];

export const INITIAL_EXPENSES: Expense[] = [
  { id: 'e1', title: 'إيجار المحل الشهري', category: 'إيجار', amount: 8000, date: '2026-06-01', notes: 'إيجار شهر يونيو 2026' },
  { id: 'e2', title: 'فاتورة الكهرباء والتكييف', category: 'مرافق', amount: 2450, date: '2026-06-15', notes: 'كهرباء الصيف' },
  { id: 'e3', title: 'أكياس تعبئة مطبوعة باللوجو', category: 'تعبئة وتغليف', amount: 1500, date: '2026-06-18', notes: 'شراء 1000 شنطة بلاستيك كحلي' },
  { id: 'e4', title: 'رواتب موظفين مساعدة', category: 'مرتبات', amount: 6000, date: '2026-06-25', notes: 'رواتب عمال المساعدة الإضافيين' }
];

// Helper to generate dates relative to today
const getDateAgo = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return getLocalDateString(d);
};

export const INITIAL_SALES: Sale[] = [
  {
    id: 's_inv_1',
    invoiceNumber: 'INV-2026-0001',
    customerId: 'c1',
    customerName: 'كريم ممدوح',
    cashierId: 'u3',
    cashierName: 'سارة محمد',
    date: `${getDateAgo(5)} 14:32:10`,
    subtotal: 1550,
    discountAmount: 150,
    taxAmount: 196,
    total: 1596,
    paymentMethod: 'Cash',
    payments: [{ method: 'Cash', amount: 1596 }],
    items: [
      { id: 'si1', productId: 'p1', variantId: 'v1_white_m', name: 'تيشرت اوفرسايز زارا قطن', brand: 'Zara', size: 'M', color: 'أبيض', quantity: 2, purchasePrice: 220, originalPrice: 450, discount: 10, finalPrice: 405, subtotal: 810 },
      { id: 'si2', productId: 'p2', variantId: 'v2_blue_32', name: 'بنطلون جينز سليم فيت تاون تيم', brand: 'Town Team', size: '32', color: 'أزرق داكن', quantity: 1, purchasePrice: 350, originalPrice: 650, discount: 0, finalPrice: 650, subtotal: 650 }
    ]
  },
  {
    id: 's_inv_2',
    invoiceNumber: 'INV-2026-0002',
    customerId: 'c2',
    customerName: 'أمنية مصطفى',
    cashierId: 'u3',
    cashierName: 'سارة محمد',
    date: `${getDateAgo(3)} 18:15:40`,
    subtotal: 2650,
    discountAmount: 125,
    taxAmount: 353.5,
    total: 2878.5,
    paymentMethod: 'Split',
    payments: [
      { method: 'Visa', amount: 2000, transactionRef: 'TXN889102' },
      { method: 'Cash', amount: 878.5 }
    ],
    items: [
      { id: 'si3', productId: 'p4', variantId: 'v4_floral_m', name: 'فستان شيفون نسائي مشجر زارا', brand: 'Zara', size: 'M', color: 'مشجر وردي', quantity: 1, purchasePrice: 600, originalPrice: 1250, discount: 5, finalPrice: 1187.5, subtotal: 1187.5 },
      { id: 'si4', productId: 'p5', variantId: 'v5_camel_m', name: 'جاكيت جباردين شتوي ديفاكتو', brand: 'Defacto', size: 'M', color: 'جملي', quantity: 1, purchasePrice: 700, originalPrice: 1450, discount: 20, finalPrice: 1160, subtotal: 1160 }
    ]
  },
  {
    id: 's_inv_3',
    invoiceNumber: 'INV-2026-0003',
    customerId: 'c1',
    customerName: 'كريم ممدوح',
    cashierId: 'u2',
    cashierName: 'أحمد علي',
    date: `${getDateAgo(2)} 21:05:00`,
    subtotal: 1450,
    discountAmount: 290,
    taxAmount: 162.4,
    total: 1322.4,
    paymentMethod: 'Instapay',
    payments: [{ method: 'Instapay', amount: 1322.4, transactionRef: 'IP_99210293' }],
    items: [
      { id: 'si5', productId: 'p5', variantId: 'v5_black_l', name: 'جاكيت جباردين شتوي ديفاكتو', brand: 'Defacto', size: 'L', color: 'أسود', quantity: 1, purchasePrice: 700, originalPrice: 1450, discount: 20, finalPrice: 1160, subtotal: 1160 }
    ]
  },
  {
    id: 's_inv_4',
    invoiceNumber: 'INV-2026-0004',
    customerId: 'c3',
    customerName: 'طارق السعيد',
    cashierId: 'u3',
    cashierName: 'سارة محمد',
    date: `${getDateAgo(1)} 13:40:22`,
    subtotal: 970,
    discountAmount: 45,
    taxAmount: 129.5,
    total: 1054.5,
    paymentMethod: 'Vodafone Cash',
    payments: [{ method: 'Vodafone Cash', amount: 1054.5, transactionRef: '01011223344_VF_9921' }],
    items: [
      { id: 'si6', productId: 'p1', variantId: 'v1_beige_m', name: 'تيشرت اوفرسايز زارا قطن', brand: 'Zara', size: 'M', color: 'بيج', quantity: 1, purchasePrice: 220, originalPrice: 450, discount: 10, finalPrice: 405, subtotal: 405 },
      { id: 'si7', productId: 'p6', variantId: 'v6_pink_4y', name: 'بيجامة قطن أطفال ديفاكتو', brand: 'Defacto', size: '4-5Y', color: 'وردي باربي', quantity: 1, purchasePrice: 150, originalPrice: 320, discount: 0, finalPrice: 320, subtotal: 320 }
    ]
  },
  {
    id: 's_inv_5',
    invoiceNumber: 'INV-2026-0005',
    customerId: 'c4',
    customerName: 'ياسمين مروان',
    cashierId: 'u3',
    cashierName: 'سارة محمد',
    date: `${getDateAgo(0)} 10:15:30`, // Today morning
    subtotal: 450,
    discountAmount: 45,
    taxAmount: 56.7,
    total: 461.7,
    paymentMethod: 'Cash',
    payments: [{ method: 'Cash', amount: 461.7 }],
    items: [
      { id: 'si8', productId: 'p1', variantId: 'v1_white_xl', name: 'تيشرت اوفرسايز زارا قطن', brand: 'Zara', size: 'XL', color: 'أبيض', quantity: 1, purchasePrice: 220, originalPrice: 450, discount: 10, finalPrice: 405, subtotal: 405 }
    ]
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', type: 'out_of_stock', title: 'منتج غير متوفر', message: 'نفذت كمية بنطلون جينز سليم فيت تاون تيم (مقاس 34 - أزرق داكن)', isRead: false, date: getDateAgo(1) },
  { id: 'n2', type: 'low_stock', title: 'مخزون منخفض جداً', message: 'تبقى قطعة واحدة فقط من تيشرت اوفرسايز زارا قطن (مقاس XL - أبيض)', isRead: false, date: getDateAgo(0) },
  { id: 'n3', type: 'target_achieved', title: 'مبيعات قياسية', message: 'تهانينا! تم تحقيق 85% من هدف المبيعات لشهر يونيو 2026', isRead: true, date: getDateAgo(2) }
];

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'محل الصقر للملابس الراقية',
  phone: '01011223344',
  address: '25 شارع العروبة، مصر الجديدة، القاهرة',
  taxRate: 14, // 14% Egypt VAT
  currency: 'EGP',
  language: 'ar',
  theme: 'dark', // Dark glass styling looks premium
  salesTarget: 50000
};

// LocalStorage Persistence Handler
export class StoreDB {
  static get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(`cloth_pos_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static set(key: string, value: any): void {
    try {
      localStorage.setItem(`cloth_pos_${key}`, JSON.stringify(value));
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }

  static init() {
    if (!localStorage.getItem('cloth_pos_initialized')) {
      this.set('users', INITIAL_USERS);
      this.set('products', INITIAL_PRODUCTS);
      this.set('customers', INITIAL_CUSTOMERS);
      this.set('suppliers', INITIAL_SUPPLIERS);
      this.set('sales', INITIAL_SALES);
      this.set('expenses', INITIAL_EXPENSES);
      this.set('notifications', INITIAL_NOTIFICATIONS);
      this.set('settings', DEFAULT_SETTINGS);
      this.set('history', [
        {
          id: 'h1',
          productId: 'p1',
          productName: 'تيشرت اوفرسايز زارا قطن',
          variantId: 'v1_white_xl',
          size: 'XL',
          color: 'أبيض',
          type: 'Sale',
          quantity: 1,
          previousQty: 2,
          newQty: 1,
          reason: 'عملية بيع فاتورة INV-2026-0005',
          date: `${getDateAgo(0)} 10:15:30`,
          operator: 'سارة محمد'
        }
      ] as StockHistory[]);
      
      localStorage.setItem('cloth_pos_initialized', 'true');
    }
  }
}
