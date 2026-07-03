import React, { useState, useMemo } from 'react';
import { Sale, Product, StoreSettings } from '../types';
import { printThermalReceipt } from '../utils/thermalPrinter';
import { 
  FileText, Search, Printer, Share2, Eye, ShieldAlert, 
  RotateCcw, Landmark, User, CreditCard, ChevronRight, ArrowUpRight, 
  Plus, Calendar, AlertCircle, ShoppingBag, ArrowLeftRight, CheckCircle, Edit
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InvoicesProps {
  sales: Sale[];
  products: Product[];
  isArabic: boolean;
  settings: StoreSettings;
  setActiveTab: (tab: string) => void;
  onLoadInvoiceForEditing: (sale: Sale) => void;
}

export default function Invoices({ 
  sales, 
  products, 
  isArabic, 
  settings,
  setActiveTab,
  onLoadInvoiceForEditing 
}: InvoicesProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Sale | null>(null);
  const [methodFilter, setMethodFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All'); // All, Normal, Returned

  // Calculate metrics
  const stats = useMemo(() => {
    let totalRev = 0;
    let totalReturns = 0;
    let cashSales = 0;
    let cardSales = 0;

    sales.forEach(sale => {
      totalRev += sale.total;
      if (sale.isReturned) {
        totalReturns += sale.returnedAmount || 0;
      }
      if (sale.paymentMethod === 'Cash') {
        cashSales += sale.total;
      } else if (sale.paymentMethod === 'Visa') {
        cardSales += sale.total;
      }
    });

    return {
      totalRev,
      totalReturns,
      count: sales.length,
      cashSales,
      cardSales
    };
  }, [sales]);

  // Filter invoices
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Search text
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        sale.invoiceNumber.toLowerCase().includes(searchLower) ||
        (sale.customerName || '').toLowerCase().includes(searchLower) ||
        (sale.cashierName || '').toLowerCase().includes(searchLower) ||
        sale.items.some(it => it.name.toLowerCase().includes(searchLower));

      // Payment Method
      const matchesMethod = methodFilter === 'All' || sale.paymentMethod === methodFilter;

      // Sale Type
      const matchesType = typeFilter === 'All' || (sale.saleType || 'retail') === typeFilter;

      // Return Status
      let matchesStatus = true;
      if (statusFilter === 'Normal') {
        matchesStatus = !sale.isReturned;
      } else if (statusFilter === 'Returned') {
        matchesStatus = !!sale.isReturned;
      }

      return matchesSearch && matchesMethod && matchesType && matchesStatus;
    }).reverse(); // Latest first
  }, [sales, searchTerm, methodFilter, typeFilter, statusFilter]);

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString(isArabic ? 'ar-EG' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${isArabic ? 'ج.م' : 'EGP'}`;
  };

  const handleEditClick = (sale: Sale) => {
    onLoadInvoiceForEditing(sale);
    setActiveTab('pos');
  };

  return (
    <div className="space-y-6" id="all-invoices-registry-view">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-500" />
            <span>{isArabic ? 'سجل الفواتير والمبيعات بالكامل 📄' : 'Full Invoices & Sales Log 📄'}</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {isArabic 
              ? 'مراجعة وتتبع كافة الفواتير المصدرة من النظام، طباعة الإيصالات، تعديل المبيعات، والبحث المتقدم.' 
              : 'Review and trace all issued receipts, print copies, edit previous transactions, and browse parameters.'}
          </p>
        </div>
        
        {/* Quick sale button */}
        <button
          onClick={() => setActiveTab('pos')}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-lg hover:shadow-indigo-900/10 transition-all self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isArabic ? 'إنشاء فاتورة مبيعات جديدة' : 'Create New Invoice'}</span>
        </button>
      </div>

      {/* KPI Cards Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'إجمالي الفواتير المصدرة' : 'Total Invoices Count'}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-white font-mono">{stats.count}</span>
            <span className="text-xs text-gray-500">{isArabic ? 'فاتورة' : 'bills'}</span>
          </div>
        </div>

        <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] text-gray-400 font-bold block text-emerald-400">{isArabic ? 'إجمالي قيمة المبيعات' : 'Gross Sales Value'}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-emerald-400 font-mono">{formatCurrency(stats.totalRev)}</span>
          </div>
        </div>

        <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] text-gray-400 font-bold block text-rose-400">{isArabic ? 'إجمالي المسترد / المرتجعات' : 'Total Refunded / Returns'}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-rose-400 font-mono">{formatCurrency(stats.totalReturns)}</span>
          </div>
        </div>

        <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-4 space-y-1">
          <span className="text-[10px] text-gray-400 font-bold block text-indigo-400">{isArabic ? 'المبيعات النقدية (الكاش)' : 'Cash Drawer Revenue'}</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-indigo-400 font-mono">{formatCurrency(stats.cashSales)}</span>
          </div>
        </div>
      </div>

      {/* Workspace Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main List Section */}
        <div className={`${selectedInvoice ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4 transition-all duration-300`}>
          
          {/* Advanced Filtering Bar */}
          <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{isArabic ? 'مرشحات البحث والتصفية' : 'Search Filters'}</span>
              <span className="text-[10px] text-gray-500 font-bold font-mono">
                {filteredSales.length} {isArabic ? 'فاتورة تطابق التصفية' : 'matched records'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {/* Search input */}
              <div className="space-y-1 col-span-1 sm:col-span-2">
                <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'البحث بالاسم، الرقم، الصنف' : 'Search Text'}</label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5 rtl:left-auto rtl:right-3" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={isArabic ? 'أدخل رقم الفاتورة، اسم العميل، الكاشير...' : 'Search customer, cashier, items...'}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl py-1.5 pl-9 pr-4 rtl:pl-4 rtl:pr-9 text-xs text-white focus:outline-none placeholder-gray-600 focus:border-indigo-500/50"
                  />
                </div>
              </div>

              {/* Method filter */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'طريقة السداد' : 'Payment Method'}</label>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="All">{isArabic ? 'كل طرق الدفع' : 'All Methods'}</option>
                  <option value="Cash">{isArabic ? 'نقدي (Cash)' : 'Cash'}</option>
                  <option value="Visa">{isArabic ? 'بطاقة (Visa)' : 'Visa'}</option>
                  <option value="Vodafone Cash">{isArabic ? 'فودافون كاش' : 'Vodafone Cash'}</option>
                  <option value="Instapay">{isArabic ? 'إنستاباي' : 'Instapay'}</option>
                  <option value="Split">{isArabic ? 'متعدد (Split)' : 'Split Payment'}</option>
                </select>
              </div>

              {/* Status filter */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'حالة الارتجاع' : 'Return Status'}</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="All">{isArabic ? 'كل الفواتير' : 'All Invoices'}</option>
                  <option value="Normal">{isArabic ? 'سليمة فقط' : 'Standard Sales'}</option>
                  <option value="Returned">{isArabic ? 'المرتجعة فقط' : 'With Returns'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Invoices List Table */}
          <div className="bg-[#0F0F12] border border-white/5 rounded-2xl overflow-hidden shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left rtl:text-right">
                <thead className="bg-[#141418] text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-gray-850">
                  <tr>
                    <th className="py-3.5 px-4">{isArabic ? 'رقم الفاتورة' : 'Invoice Number'}</th>
                    <th className="py-3.5 px-3">{isArabic ? 'التاريخ' : 'Date'}</th>
                    <th className="py-3.5 px-3">{isArabic ? 'اسم العميل' : 'Customer'}</th>
                    <th className="py-3.5 px-3">{isArabic ? 'الكاشير' : 'Cashier'}</th>
                    <th className="py-3.5 px-3">{isArabic ? 'طريقة السداد' : 'Payment'}</th>
                    <th className="py-3.5 px-3">{isArabic ? 'الإجمالي الكلي' : 'Total Amount'}</th>
                    <th className="py-3.5 px-4 text-center">{isArabic ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-850 text-gray-300 font-sans">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-gray-500 font-bold">
                        <ShoppingBag className="w-8 h-8 mx-auto text-gray-700 mb-2" />
                        {isArabic ? 'لا توجد فواتير تطابق شروط التصفية والبحث' : 'No matching invoices found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map((sale) => {
                      const isSelected = selectedInvoice?.id === sale.id;
                      return (
                        <tr 
                          key={sale.id} 
                          onClick={() => setSelectedInvoice(sale)}
                          className={`hover:bg-gray-800/10 cursor-pointer transition-all ${
                            isSelected ? 'bg-indigo-600/5' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono font-black text-white">
                            <div className="flex items-center gap-1.5">
                              <span>{sale.invoiceNumber}</span>
                              {sale.isReturned && (
                                <span className="w-2 h-2 rounded-full bg-rose-500" title={isArabic ? 'مرتجع' : 'Returned'} />
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-gray-400 font-mono text-[11px] whitespace-nowrap">{sale.date.substring(5, 16)}</td>
                          <td className="py-3.5 px-3 font-bold">{sale.customerName || (isArabic ? 'عميل نقدي' : 'Cash Customer')}</td>
                          <td className="py-3.5 px-3 text-gray-400">{sale.cashierName}</td>
                          <td className="py-3.5 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-gray-950 font-semibold text-indigo-400 text-[10px] border border-gray-850">
                              {sale.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-black text-emerald-400">{formatCurrency(sale.total)}</td>
                          <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedInvoice(sale)}
                                className="p-1.5 rounded-lg bg-gray-950 hover:bg-gray-900 border border-gray-850 text-indigo-400 cursor-pointer"
                                title={isArabic ? 'عرض التفاصيل' : 'View Details'}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Details Side Panel (col 5) */}
        {selectedInvoice && (
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, x: isArabic ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[#0F0F12] border border-white/5 rounded-3xl p-5 space-y-4 shadow-xl relative sticky top-6"
              id="selected-invoice-side-drawer"
            >
              {/* Drawer Header */}
              <div className="flex justify-between items-start border-b border-gray-850 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white font-mono">{selectedInvoice.invoiceNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      selectedInvoice.saleType === 'wholesale' 
                        ? 'bg-purple-500/10 text-purple-400' 
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {selectedInvoice.saleType === 'wholesale' ? (isArabic ? 'جملة' : 'Wholesale') : (isArabic ? 'قطاعي' : 'Retail')}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">{selectedInvoice.date}</p>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1 bg-gray-950 hover:bg-gray-900 border border-gray-850 text-gray-400 hover:text-white rounded-lg cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status and return tracking */}
              {selectedInvoice.isReturned && (
                <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-1 text-[11px]">
                  <div className="flex justify-between font-black text-rose-400">
                    <span>{isArabic ? '🔴 حالة الفاتورة:' : '🔴 Status:'}</span>
                    <span>{isArabic ? 'تم إرجاع سلع / مرتجع جزئي' : 'Item(s) Returned / Partially Refunded'}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 font-mono">
                    <span>{isArabic ? 'إجمالي المبلغ المسترد:' : 'Total Refund Amount:'}</span>
                    <span className="font-bold text-white">{formatCurrency(selectedInvoice.returnedAmount || 0)}</span>
                  </div>
                </div>
              )}

              {/* Customer and Cashier */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-gray-950 p-3 rounded-xl border border-gray-850/80">
                <div className="space-y-0.5">
                  <span className="text-[9px] text-gray-500 font-bold block">{isArabic ? 'العميل' : 'Customer'}</span>
                  <span className="text-white font-bold block truncate">{selectedInvoice.customerName || (isArabic ? 'عميل نقدي' : 'Cash Customer')}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] text-gray-500 font-bold block">{isArabic ? 'الكاشير المسؤول' : 'Cashier Operator'}</span>
                  <span className="text-white font-medium block truncate">{selectedInvoice.cashierName || 'System'}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <span className="text-[10px] text-gray-400 font-bold block uppercase tracking-wider">{isArabic ? 'السلع والمبيعات داخل الفاتورة' : 'Invoice Items Detail'}</span>
                
                <div className="space-y-1.5 max-h-[30vh] overflow-y-auto pr-1">
                  {selectedInvoice.items.map((it, idx) => (
                    <div key={idx} className="bg-gray-950/40 p-2.5 rounded-xl border border-gray-850 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-white font-bold block">{it.name}</span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {isArabic ? `اللون: ${it.color} / المقاس: ${it.size}` : `Col: ${it.color} / Size: ${it.size}`}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] text-gray-400 block">{it.quantity} x {formatCurrency(it.finalPrice)}</span>
                        <span className="text-white font-black">{formatCurrency(it.finalPrice * it.quantity)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Breakdowns */}
              <div className="space-y-1 text-xs border-t border-gray-850 pt-3">
                <div className="flex justify-between text-gray-400">
                  <span>{isArabic ? 'المجموع الفرعي:' : 'Subtotal:'}</span>
                  <span className="font-mono text-white">{formatCurrency(selectedInvoice.subtotal)}</span>
                </div>
                {selectedInvoice.discountAmount > 0 && (
                  <div className="flex justify-between text-rose-400">
                    <span>{isArabic ? 'الخصم الممنوح:' : 'Discount Amount:'}</span>
                    <span className="font-mono">-{formatCurrency(selectedInvoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>{isArabic ? 'الضريبة (14%):' : 'Tax (14%):'}</span>
                  <span className="font-mono text-white">{formatCurrency(selectedInvoice.taxAmount || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold border-t border-gray-850 pt-2 mt-1">
                  <span className="text-white">{isArabic ? 'الصافي النهائي:' : 'Final Paid Total:'}</span>
                  <span className="text-emerald-400 font-black font-sans">{formatCurrency(selectedInvoice.total)}</span>
                </div>
              </div>

              {/* Actions Grid */}
              <div className="pt-2 border-t border-gray-850/60">
                <button
                  type="button"
                  onClick={() => printThermalReceipt(selectedInvoice, settings, isArabic)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isArabic ? 'إعادة طباعة الفاتورة 🖨️' : 'Re-print Receipt 🖨️'}</span>
                </button>
              </div>

              {/* Split payment details if any */}
              {selectedInvoice.paymentMethod === 'Split' && selectedInvoice.payments && (
                <div className="p-3 bg-gray-950 rounded-xl border border-gray-850 space-y-1.5">
                  <span className="text-[9px] text-gray-500 font-bold uppercase block">{isArabic ? 'تفاصيل السداد المتعدد' : 'Split Payment Breakdown'}</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-400">
                    {selectedInvoice.payments.map((p, pIdx) => (
                      <div key={pIdx} className="flex justify-between border-b border-gray-900 pb-0.5">
                        <span>{p.method}:</span>
                        <span className="text-white font-bold">{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
