import React, { useState } from 'react';
import { Product, Sale, User, StoreSettings } from '../types';
import { getLocalDateString } from '../utils';
import { 
  TrendingUp, FileText, AlertTriangle, Landmark, Shirt, 
  ArrowUpRight, Eye, ShieldAlert, BadgePercent, CalendarDays,
  Printer, Share2, Search, X
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
  settings: StoreSettings;
  setActiveTab: (tab: string) => void;
  isArabic: boolean;
}

export default function Dashboard({ products, sales, settings, setActiveTab, isArabic }: DashboardProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);
  const [showAllInvoicesModal, setShowAllInvoicesModal] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceMethodFilter, setInvoiceMethodFilter] = useState('All');
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState('All');

  // Today's date string matching standard sales format (e.g. YYYY-MM-DD)
  const todayStr = getLocalDateString();

  // Filters for today's sales
  const todaySales = sales.filter(s => s.date.startsWith(todayStr));
  
  // Calculations
  const todayRevenue = todaySales.reduce((acc, curr) => acc + curr.total, 0);
  const todayInvoiceCount = todaySales.length;

  // Let's compute net profit (Selling Price - Purchase Price - Item Discount) for all sales of today
  const calculateProfit = (saleList: Sale[]) => {
    return saleList.reduce((acc, sale) => {
      const saleProfit = sale.items.reduce((itemAcc, item) => {
        // purchasePrice is stored per item to guarantee correctness even if product price changes later
        const margin = (item.finalPrice - item.purchasePrice) * item.quantity;
        return itemAcc + margin;
      }, 0);
      // We subtract VAT from profits? No, VAT is collected tax, usually excluded from net profit margins.
      // But we can subtract discounts
      return acc + saleProfit;
    }, 0);
  };

  const todayProfit = calculateProfit(todaySales);
  const totalProfitAllTime = calculateProfit(sales);
  const totalRevenueAllTime = sales.reduce((acc, curr) => acc + curr.total, 0);

  // Products low in stock
  // We check each variant's quantity inside all products.
  const lowStockVariants: { product: Product; variantName: string; size: string; color: string; qty: number }[] = [];
  products.forEach(p => {
    p.variants.forEach(v => {
      if (v.quantity <= p.stockAlertLevel) {
        lowStockVariants.push({
          product: p,
          variantName: `${p.name} (${v.color} - ${v.size})`,
          size: v.size,
          color: v.color,
          qty: v.quantity
        });
      }
    });
  });

  // Top Selling Products algorithm
  const productSalesMap: Record<string, { product: Product; qty: number; revenue: number }> = {};
  sales.forEach(sale => {
    sale.items.forEach(item => {
      if (!productSalesMap[item.productId]) {
        const prod = products.find(p => p.id === item.productId);
        if (prod) {
          productSalesMap[item.productId] = { product: prod, qty: 0, revenue: 0 };
        }
      }
      if (productSalesMap[item.productId]) {
        productSalesMap[item.productId].qty += item.quantity;
        productSalesMap[item.productId].revenue += item.subtotal;
      }
    });
  });

  const bestSellers = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 4);

  // Dynamic progress toward target
  const monthTarget = settings.salesTarget || 50000;
  const currentMonthSalesTotal = sales
    .filter(s => {
      // simplified month filter matching YYYY-MM
      const currentMonthStr = todayStr.substring(0, 7);
      return s.date.startsWith(currentMonthStr);
    })
    .reduce((acc, curr) => acc + curr.total, 0);

  const targetPercentage = Math.min(Math.round((currentMonthSalesTotal / monthTarget) * 100), 100);

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString(isArabic ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${isArabic ? 'ج.م' : 'EGP'}`;
  };

  return (
    <div className="space-y-6" id="dashboard-tab-root">
      
      {/* Target Progress Bar Card */}
      <div className="p-5 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-indigo-400 block tracking-wider uppercase">
              {isArabic ? 'مؤشر أداء المبيعات الشهري' : 'MONTHLY REVENUE TARGET TARGET'}
            </span>
            <h2 className="text-xl font-extrabold mt-1">
              {isArabic ? 'حالة تحقيق الهدف البيعي للمحل' : 'Store Sales Target Meter'}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {isArabic 
                ? `تم تحصيل ${formatCurrency(currentMonthSalesTotal)} من أصل هدف شهري ${formatCurrency(monthTarget)}`
                : `Earned ${formatCurrency(currentMonthSalesTotal)} of monthly objective ${formatCurrency(monthTarget)}`}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-2xl font-black text-indigo-400 font-mono">{targetPercentage}%</span>
            <div className="w-32 bg-gray-800 rounded-full h-3.5 overflow-hidden border border-gray-700">
              <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${targetPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="kpi-cards-grid">
        
        {/* Card 1: Today's Revenue */}
        <div className={`p-5 rounded-2xl transition-colors ${
          settings.theme === 'dark' 
            ? 'bg-[#18181B] border border-white/5 text-[#E4E4E7]' 
            : 'bg-white border border-gray-100 shadow-sm text-gray-800'
        } flex items-center justify-between`}>
          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-semibold block uppercase tracking-wider">
              {isArabic ? 'مبيعات اليوم' : "Today's Sales"}
            </span>
            <h3 className="text-xl font-bold tracking-tight font-sans">{formatCurrency(todayRevenue)}</h3>
            <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded inline-flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              {isArabic ? 'مباشر' : 'Live'}
            </span>
          </div>
          <div className="p-3.5 bg-indigo-600/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
            <TrendingUp className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Card 2: Today's Invoices */}
        <div className={`p-5 rounded-2xl transition-colors ${
          settings.theme === 'dark' 
            ? 'bg-[#18181B] border border-white/5 text-[#E4E4E7]' 
            : 'bg-white border border-gray-100 shadow-sm text-gray-800'
        } flex items-center justify-between`}>
          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-semibold block uppercase tracking-wider">
              {isArabic ? 'الفواتير المصدرة' : 'Today Invoices'}
            </span>
            <h3 className="text-xl font-bold tracking-tight font-mono">{todayInvoiceCount} {isArabic ? 'فواتير' : 'Invoices'}</h3>
            <span className="text-[10px] text-gray-400 font-medium">
              {isArabic ? 'خلال الـ 24 ساعة الماضية' : 'Completed transactions'}
            </span>
          </div>
          <div className="p-3.5 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Stock Alerts */}
        <div className={`p-5 rounded-2xl transition-colors ${
          lowStockVariants.length > 0
            ? settings.theme === 'dark' 
              ? 'bg-red-500/10 border border-red-500/20 text-red-400' 
              : 'bg-red-50 border border-red-100 text-red-700'
            : settings.theme === 'dark' 
              ? 'bg-[#18181B] border border-white/5 text-[#E4E4E7]' 
              : 'bg-white border border-gray-100 shadow-sm text-gray-800'
        } flex items-center justify-between`}>
          <div className="space-y-1">
            <span className={`text-xs font-semibold block uppercase tracking-wider ${lowStockVariants.length > 0 ? 'text-red-400' : 'text-gray-400'}`}>
              {isArabic ? 'نواقص المخزون' : 'Stock Alerts'}
            </span>
            <h3 className="text-xl font-bold tracking-tight font-mono">{lowStockVariants.length} {isArabic ? 'تنبيهات' : 'Alerts'}</h3>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              lowStockVariants.length > 0 ? 'bg-red-500/15 text-red-500 animate-pulse' : 'bg-emerald-500/10 text-emerald-500'
            }`}>
              {lowStockVariants.length > 0 ? (isArabic ? 'بحاجة لتعبئة' : 'Requires Restock') : (isArabic ? 'مخزون ممتاز' : 'Healthy Levels')}
            </span>
          </div>
          <div className={`p-3.5 rounded-2xl border ${
            lowStockVariants.length > 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-gray-800 text-gray-500 border-gray-700'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Net Profits */}
        <div className={`p-5 rounded-2xl transition-colors ${
          settings.theme === 'dark' 
            ? 'bg-[#18181B] border border-white/5 text-[#E4E4E7]' 
            : 'bg-white border border-gray-100 shadow-sm text-gray-800'
        } flex items-center justify-between`}>
          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-semibold block uppercase tracking-wider">
              {isArabic ? 'أرباح اليوم الصافية' : 'Net Profits Today'}
            </span>
            <h3 className="text-xl font-bold tracking-tight text-emerald-400 font-sans">{formatCurrency(todayProfit)}</h3>
            <span className="text-[10px] text-gray-400 font-medium">
              {isArabic ? `إجمالي الأرباح: ${formatCurrency(totalProfitAllTime)}` : `All-time profit: ${totalProfitAllTime}`}
            </span>
          </div>
          <div className="p-3.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Column 1 & 2: Recent sales and Top Selling */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Sales Block */}
          <div className={`p-6 rounded-3xl transition-colors ${
            settings.theme === 'dark' 
              ? 'bg-[#18181B]/50 border border-white/5 text-[#E4E4E7]' 
              : 'bg-white border border-gray-100 shadow-sm text-gray-800'
          } space-y-4`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                {isArabic ? 'آخر فواتير مبيعات اليوم' : 'Recent Invoices Today'}
              </h4>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveTab('invoices')}
                  className="px-2.5 py-1 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                  id="open-all-invoices-log-btn"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'سجل الفواتير بالكامل 📁' : 'Full Invoices Registry 📁'}</span>
                </button>
                <button 
                  onClick={() => setActiveTab('pos')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>{isArabic ? 'فاتورة جديدة 🛒' : 'New Invoice 🛒'}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left rtl:text-right" id="recent-sales-table">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">{isArabic ? 'رقم الفاتورة' : 'Invoice'}</th>
                    <th className="py-2.5 px-3">{isArabic ? 'العميل' : 'Customer'}</th>
                    <th className="py-2.5 px-3">{isArabic ? 'التوقيت' : 'Time'}</th>
                    <th className="py-2.5 px-3">{isArabic ? 'المبلغ' : 'Amount'}</th>
                    <th className="py-2.5 px-3">{isArabic ? 'طريقة الدفع' : 'Payment'}</th>
                    <th className="py-2.5 px-3 text-center">{isArabic ? 'عرض' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-gray-300 font-sans">
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500 font-semibold">
                        {isArabic ? 'لم يتم العثور على مبيعات مسجلة' : 'No sales invoices saved yet'}
                      </td>
                    </tr>
                  ) : (
                    sales.slice(0, 5).map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-800/20 transition-all">
                        <td className="py-3 px-3 font-mono font-bold text-white">{sale.invoiceNumber}</td>
                        <td className="py-3 px-3">{sale.customerName || (isArabic ? 'عميل نقدي' : 'Cash Customer')}</td>
                        <td className="py-3 px-3 text-gray-400 font-mono text-[11px]">{sale.date.split(' ')[1] || sale.date}</td>
                        <td className="py-3 px-3 font-bold text-emerald-400">{formatCurrency(sale.total)}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] ${
                            sale.paymentMethod === 'Cash' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                            sale.paymentMethod === 'Visa' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            sale.paymentMethod === 'Vodafone Cash' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            sale.paymentMethod === 'Instapay' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                            'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}>
                            {sale.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button 
                            onClick={() => setSelectedInvoice(sale)}
                            className="p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Selling Clothes */}
          <div className={`p-6 rounded-3xl transition-colors ${
            settings.theme === 'dark' 
              ? 'bg-[#18181B]/50 border border-white/5 text-[#E4E4E7]' 
              : 'bg-white border border-gray-100 shadow-sm text-gray-800'
          } space-y-4`}>
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Shirt className="w-4 h-4 text-pink-400" />
              {isArabic ? 'المنتجات الأكثر مبيعاً ورواجاً' : 'Best Selling Apparel items'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {bestSellers.length === 0 ? (
                <div className="col-span-2 text-center py-6 text-gray-500 font-semibold">
                  {isArabic ? 'سيتم سرد المنتجات الأكثر مبيعًا عند بدء المبيعات' : 'Top sellers will appear here once sold'}
                </div>
              ) : (
                bestSellers.map(({ product, qty, revenue }) => (
                  <div 
                    key={product.id}
                    className="p-3.5 rounded-2xl bg-gray-900/40 border border-gray-800 flex items-center gap-3"
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                      <Shirt className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-white truncate">{product.name}</h5>
                      <p className="text-[10px] text-gray-400 mt-0.5">{product.brand} • {product.category}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-indigo-400 font-bold">{qty} {isArabic ? 'قطع مباعة' : 'Units sold'}</span>
                        <span className="text-[10px] text-emerald-400 font-bold">{formatCurrency(revenue)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Column 3: Stock alerts panel */}
        <div className="space-y-6">
          <div className={`p-6 rounded-3xl transition-colors ${
            settings.theme === 'dark' 
              ? 'bg-[#18181B]/50 border border-white/5 text-[#E4E4E7]' 
              : 'bg-white border border-gray-100 shadow-sm text-gray-800'
          } space-y-4 h-full flex flex-col`}>
            <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              {isArabic ? 'المنتجات التي قاربت على النفاد' : 'Stock Depletion Alerts'}
            </h4>
            <p className="text-xs text-gray-400 leading-normal">
              {isArabic 
                ? 'المنتجات التالية تخطت الحد الأدنى للأمان ويجب طلبها فوراً من الموردين لتجنب توقف البيع.' 
                : 'The following variants have dropped below safe threshold level. Order restock promptly.'}
            </p>

            <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[420px] pr-1">
              {lowStockVariants.length === 0 ? (
                <div className="p-10 text-center text-gray-500 font-bold border border-dashed border-gray-800 rounded-2xl">
                  {isArabic ? 'المخزون بالكامل آمن وممتاز! 👍' : 'All stock is safe! 👍'}
                </div>
              ) : (
                lowStockVariants.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <h5 className="font-bold text-gray-200 truncate">{item.product.name}</h5>
                      <span className="text-[9px] text-gray-400 block mt-0.5">
                        {isArabic ? 'المقاس:' : 'Size:'} <strong className="text-white font-mono">{item.size}</strong> • {isArabic ? 'اللون:' : 'Color:'} <strong className="text-white">{item.color}</strong>
                      </span>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 text-[10px] font-bold font-mono">
                        {item.qty} {isArabic ? 'قطع متبقية' : 'left'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setActiveTab('inventory')}
              className="w-full py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-md text-center mt-4 shrink-0 block"
              id="dashboard-goto-inventory-button"
            >
              {isArabic ? 'إدارة المخزون والتوريد' : 'Manage & Replenish Stock'}
            </button>
          </div>
        </div>

      </div>

      {/* Invoice Details Dialog Modal (Simulation) */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-gray-950 border border-gray-800 rounded-3xl p-6 shadow-2xl relative"
            id="dashboard-invoice-details-modal"
          >
            <div className="flex justify-between items-start border-b border-gray-800 pb-3 mb-4">
              <div>
                <h4 className="text-sm font-extrabold text-white">{isArabic ? 'تفاصيل فاتورة البيع' : 'Invoice Details'}</h4>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{selectedInvoice.invoiceNumber}</p>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="text-xs text-gray-400 hover:text-white px-2 py-1 bg-gray-900 border border-gray-800 rounded-lg cursor-pointer"
              >
                {isArabic ? 'إغلاق' : 'Close'}
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 text-gray-400">
                <div>{isArabic ? 'تاريخ المعاملة:' : 'Date:'} <span className="text-white font-mono">{selectedInvoice.date}</span></div>
                <div>{isArabic ? 'مسؤول الكاشير:' : 'Cashier:'} <span className="text-white">{selectedInvoice.cashierName}</span></div>
                <div>{isArabic ? 'العميل:' : 'Customer:'} <span className="text-white">{selectedInvoice.customerName || (isArabic ? 'نقدي' : 'Cash')}</span></div>
                <div>{isArabic ? 'طريقة السداد:' : 'Payment:'} <span className="text-white">{selectedInvoice.paymentMethod}</span></div>
              </div>

              {/* Items List */}
              <div className="border-t border-b border-gray-800/60 py-2 my-2 space-y-1 max-h-40 overflow-y-auto">
                {selectedInvoice.items.map((it, index) => (
                  <div key={index} className="flex justify-between py-1 text-gray-300">
                    <div>
                      <span>{it.name} ({it.size} - {it.color})</span>
                      <span className="text-[10px] text-gray-500 block">
                        {it.quantity} x {formatCurrency(it.finalPrice)}
                      </span>
                    </div>
                    <span className="font-bold text-white mt-1">{formatCurrency(it.subtotal)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-gray-400">
                <div className="flex justify-between">
                  <span>{isArabic ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                  <span className="text-white font-mono">{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>{isArabic ? 'الخصم المباشر:' : 'Direct Discount:'}</span>
                  <span className="font-mono">-{formatCurrency(selectedInvoice.discountAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isArabic ? 'ضريبة القيمة المضافة (14%):' : 'VAT (14%):'}</span>
                  <span className="text-white font-mono">{formatCurrency(selectedInvoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-400 text-sm font-bold border-t border-gray-800 pt-2 mt-1">
                  <span>{isArabic ? 'المجموع النهائي:' : 'Final Total:'}</span>
                  <span className="font-sans font-black">{formatCurrency(selectedInvoice.total)}</span>
                </div>
              </div>

              {/* Action buttons (Print/Share PDF) */}
              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-gray-800/60 mt-2">
                <button
                  type="button"
                  onClick={() => alert(isArabic ? 'جاري إرسال أمر الطباعة لطابعة البلوتوث الحرارية...' : 'Routing document stream to Bluetooth thermal printer...')}
                  className="py-2 rounded-xl text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1 cursor-pointer shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'طباعة الفاتورة' : 'Print Invoice'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert(isArabic ? 'جاري تصدير وتحميل الفاتورة كملف PDF...' : 'Generating & downloading PDF receipt...')}
                  className="py-2 rounded-xl text-[11px] font-bold bg-gray-900 border border-gray-800 hover:bg-gray-850 text-gray-300 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'تصدير PDF' : 'Export PDF'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Full Invoices Log Dialog Modal */}
      {showAllInvoicesModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-4xl bg-[#0F0F12] border border-white/10 rounded-3xl p-6 shadow-2xl relative flex flex-col max-h-[90vh]"
            id="all-invoices-log-modal"
          >
            {/* Header */}
            <div className="flex justify-between items-start border-b border-gray-850 pb-4 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  <span>{isArabic ? 'سجل الفواتير التاريخية المصدّرة بالكامل' : 'Historical Issued Invoices Registry'}</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  {isArabic 
                    ? 'ابحث في كافة فواتير النظام، افتح التفاصيل، اطبع الإيصال، أو قم بإدارة ومطابقة البيانات.' 
                    : 'Search through all POS invoices, review details, print receipts, and cross-reference entries.'}
                </p>
              </div>
              <button 
                onClick={() => setShowAllInvoicesModal(false)}
                className="text-xs text-gray-400 hover:text-white px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-xl cursor-pointer"
              >
                {isArabic ? 'إغلاق السجل' : 'Close Registry'}
              </button>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 text-xs">
              {/* Search bar */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'البحث في الفواتير (رقم الفاتورة، اسم العميل، الكاشير)' : 'Search Invoices (Number, Customer, Cashier)'}</label>
                <input 
                  type="text"
                  placeholder={isArabic ? 'أدخل رقم الفاتورة أو اسم العميل...' : 'Type to search...'}
                  value={invoiceSearch}
                  onChange={(e) => setInvoiceSearch(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none"
                />
              </div>

              {/* Payment Method filter */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'تصفية حسب طريقة السداد' : 'Filter by Payment Method'}</label>
                <select
                  value={invoiceMethodFilter}
                  onChange={(e) => setInvoiceMethodFilter(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="All">{isArabic ? 'كل طرق الدفع' : 'All Payment Methods'}</option>
                  <option value="Cash">{isArabic ? 'نقدي (Cash)' : 'Cash'}</option>
                  <option value="Visa">{isArabic ? 'فيزا / بطاقة (Visa)' : 'Visa'}</option>
                  <option value="Vodafone Cash">{isArabic ? 'فودافون كاش' : 'Vodafone Cash'}</option>
                  <option value="Instapay">{isArabic ? 'إنستاباي' : 'Instapay'}</option>
                  <option value="Split">{isArabic ? 'دفع متعدد (Split)' : 'Split Payment'}</option>
                </select>
              </div>

              {/* Invoice Type filter */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'نوع الفاتورة' : 'Invoice Sale Type'}</label>
                <select
                  value={invoiceTypeFilter}
                  onChange={(e) => setInvoiceTypeFilter(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                >
                  <option value="All">{isArabic ? 'كل الأنواع (قطاعي وجملة)' : 'All Types (Retail & Wholesale)'}</option>
                  <option value="retail">{isArabic ? 'بيع قطاعي' : 'Retail Sale'}</option>
                  <option value="wholesale">{isArabic ? 'بيع جملة' : 'Wholesale Sale'}</option>
                </select>
              </div>
            </div>

            {/* Invoices List Container */}
            <div className="flex-1 overflow-y-auto border border-gray-800/60 bg-gray-950/40 rounded-2xl">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead className="sticky top-0 bg-[#0F0F12] text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-gray-800">
                  <tr>
                    <th className="py-2.5 px-3">{isArabic ? 'رقم الفاتورة' : 'Invoice Number'}</th>
                    <th className="py-2.5 px-3">{isArabic ? 'تاريخ المعاملة' : 'Transaction Date'}</th>
                    <th className="py-2.5 px-3">{isArabic ? 'العميل' : 'Customer'}</th>
                    <th className="py-2.5 px-3">{isArabic ? 'الكاشير' : 'Cashier'}</th>
                    <th className="py-2.5 px-3">{isArabic ? 'طريقة السداد' : 'Payment'}</th>
                    <th className="py-2.5 px-3">{isArabic ? 'نوع البيع' : 'Type'}</th>
                    <th className="py-2.5 px-3">{isArabic ? 'المبلغ الإجمالي' : 'Total Amount'}</th>
                    <th className="py-2.5 px-3 text-center">{isArabic ? 'فتح الفاتورة' : 'View Details'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-gray-300 font-sans">
                  {sales.filter(sale => {
                    // Filter match
                    const matchSearch = 
                      sale.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
                      (sale.customerName || '').toLowerCase().includes(invoiceSearch.toLowerCase()) ||
                      (sale.cashierName || '').toLowerCase().includes(invoiceSearch.toLowerCase());
                    
                    const matchMethod = invoiceMethodFilter === 'All' || sale.paymentMethod === invoiceMethodFilter;
                    const matchType = invoiceTypeFilter === 'All' || (sale.saleType || 'retail') === invoiceTypeFilter;

                    return matchSearch && matchMethod && matchType;
                  }).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-500 font-semibold">
                        {isArabic ? 'لم يتم العثور على فواتير تطابق شروط التصفية والبحث' : 'No invoices matched your filter and search criteria.'}
                      </td>
                    </tr>
                  ) : (
                    sales.filter(sale => {
                      const matchSearch = 
                        sale.invoiceNumber.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
                        (sale.customerName || '').toLowerCase().includes(invoiceSearch.toLowerCase()) ||
                        (sale.cashierName || '').toLowerCase().includes(invoiceSearch.toLowerCase());
                      
                      const matchMethod = invoiceMethodFilter === 'All' || sale.paymentMethod === invoiceMethodFilter;
                      const matchType = invoiceTypeFilter === 'All' || (sale.saleType || 'retail') === invoiceTypeFilter;

                      return matchSearch && matchMethod && matchType;
                    }).map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-800/20 transition-all">
                        <td className="py-3 px-3 font-mono font-bold text-white">{sale.invoiceNumber}</td>
                        <td className="py-3 px-3 text-gray-400 font-mono text-[11px]">{sale.date}</td>
                        <td className="py-3 px-3 font-bold">{sale.customerName || (isArabic ? 'عميل نقدي' : 'Cash Customer')}</td>
                        <td className="py-3 px-3 text-gray-400">{sale.cashierName}</td>
                        <td className="py-3 px-3 font-semibold text-indigo-400">{sale.paymentMethod}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            sale.saleType === 'wholesale' 
                              ? 'bg-purple-500/10 text-purple-400' 
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}>
                            {sale.saleType === 'wholesale' ? (isArabic ? 'جملة' : 'Wholesale') : (isArabic ? 'قطاعي' : 'Retail')}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-emerald-400">{formatCurrency(sale.total)}</td>
                        <td className="py-3 px-3 text-center">
                          <button 
                            onClick={() => {
                              setSelectedInvoice(sale);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer text-[10px] flex items-center gap-1 mx-auto"
                            id={`registry-open-invoice-${sale.id}`}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isArabic ? 'فتح وتفاصيل' : 'Open Details'}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
