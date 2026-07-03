export type UserRole = 'Owner' | 'Manager' | 'Cashier';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  username: string;
  avatar?: string;
  active: boolean;
}

export type ApparelType = 'mens' | 'womens' | 'kids' | 'unisex';
export type ClothingSeason = 'Summer' | 'Winter' | 'Spring' | 'Autumn' | 'All Seasons';

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  colorHex?: string; // for visual representation
  quantity: number;
  barcode: string;
  sku: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  type: ApparelType;
  season: ClothingSeason;
  purchasePrice: number;
  sellingPrice: number;
  wholesalePrice?: number; // wholesale price (سعر الجملة)
  discount: number; // percentage
  notes?: string;
  barcode: string; // main barcode
  imageUrl?: string;
  variants: ProductVariant[];
  stockAlertLevel: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  ordersCount: number;
  totalSpent: number;
  loyaltyPoints: number;
  lastPurchaseDate?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  debt: number;
  productsCount: number;
  lastOrderDate?: string;
}

export interface SaleItem {
  id: string; // unique item row id
  productId: string;
  variantId: string;
  name: string;
  brand: string;
  size: string;
  color: string;
  quantity: number;
  purchasePrice: number; // to calculate net profits
  originalPrice: number;
  discount: number; // per item discount amount or percentage
  finalPrice: number;
  subtotal: number;
}

export type PaymentMethod = 'Cash' | 'Visa' | 'Vodafone Cash' | 'Instapay' | 'Split';

export interface PaymentDetails {
  method: PaymentMethod;
  amount: number;
  transactionRef?: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  items: SaleItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  payments: PaymentDetails[];
  paymentMethod: PaymentMethod | 'Split';
  customerId?: string;
  customerName?: string;
  cashierId: string;
  cashierName: string;
  date: string;
  notes?: string;
  saleType?: 'retail' | 'wholesale';
  isReturned?: boolean;
  returnedAmount?: number;
  returnDate?: string;
}

export interface StockHistory {
  id: string;
  productId: string;
  productName: string;
  variantId?: string;
  size?: string;
  color?: string;
  type: 'In' | 'Out' | 'Adjustment' | 'Sale' | 'Return';
  quantity: number; // absolute change
  previousQty: number;
  newQty: number;
  reason: string;
  date: string;
  operator: string;
}

export interface StoreSettings {
  storeName: string;
  logoUrl?: string;
  phone: string;
  address: string;
  taxRate: number; // e.g., 14 for 14% VAT in Egypt
  currency: string; // EGP, USD, etc.
  language: 'ar' | 'en';
  theme: 'light' | 'dark';
  salesTarget: number; // Monthly sales target EGP
  permissions?: Record<string, UserRole[]>;
  allowAllRoles?: boolean;
}

export interface AppNotification {
  id: string;
  type: 'out_of_stock' | 'low_stock' | 'large_sale' | 'target_achieved';
  title: string;
  message: string;
  isRead: boolean;
  date: string;
  metadata?: Record<string, any>;
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
}
