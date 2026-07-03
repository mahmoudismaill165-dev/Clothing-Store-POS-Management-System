import React, { useState, useMemo } from 'react';
import { Sale, SaleItem, Product, Customer } from '../types';
import { 
  RotateCcw, Search, Calendar, User as UserIcon, FileText, 
  ArrowLeft, CheckCircle, AlertCircle, ShoppingBag, Trash2, Printer, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReturnsProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  isArabic: boolean;
  currentUser: { name: string; role: string };
  onReturnSale: (
    saleId: string, 
    returnedItems: { variantId: string; productId: string; quantity: number; returnToStock: boolean }[], 
    returnedAmount: number
  ) => void;
}

export default function Returns({ 
  sales, 
  products, 
  customers, 
  isArabic, 
  currentUser,
  onReturnSale 
}: ReturnsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  
  // Track quantities being returned for the selected invoice
  // Key: variantId, Value: number
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [returnToStockSettings, setReturnToStockSettings] = useState<Record<string, boolean>>({});
  const [returnReason, setReturnReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<'Cash' | 'Visa' | 'Vodafone Cash' | 'Instapay'>('Cash');
  const [successReceipt, setSuccessReceipt] = useState<{
    invoiceNumber: string;
    items: { name: string; size: string; color: string; quantity: number; refundPrice: number }[];
    totalRefund: number;
    date: string;
    refundMethod: string;
  } | null>(null);

  // Filter sales
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      const matchSearch = 
        sale.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.cashierName || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [sales, searchTerm]);

  const handleSelectSale = (sale: Sale) => {
    setSelectedSale(sale);
    setReturnReason('');
    // Initialize return quantities to 0 for all items in the sale
    const qtys: Record<string, number> = {};
    const stockToggles: Record<string, boolean> = {};
    sale.items.forEach(it => {
      qtys[it.variantId] = 0;
      stockToggles[it.variantId] = true; // default return to stock is true
    });
    setReturnQuantities(qtys);
    setReturnToStockSettings(stockToggles);
    setSuccessReceipt(null);
  };

  const handleQtyChange = (variantId: string, maxQty: number, change: number) => {
    const current = returnQuantities[variantId] || 0;
    const next = Math.min(maxQty, Math.max(0, current + change));
    setReturnQuantities(prev => ({
      ...prev,
      [variantId]: next
    }));
  };

  const handleStockToggle = (variantId: string) => {
    setReturnToStockSettings(prev => ({
      ...prev,
      [variantId]: !prev[variantId]
    }));
  };

  // Calculate total refund amount for selected items
  const currentRefundSummary = useMemo(() => {
    if (!selectedSale) return { subtotal: 0, discountSaved: 0, finalRefund: 0, itemsCount: 0 };
    
    let subtotal = 0;
    let itemsCount = 0;
    
    selectedSale.items.forEach(it => {
      const returnQty = returnQuantities[it.variantId] || 0;
      if (returnQty > 0) {
        subtotal += it.finalPrice * returnQty;
        itemsCount += returnQty;
      }
    });

    return {
      subtotal,
      finalRefund: subtotal, // In apparel stores, we refund the net final price they paid per item
      itemsCount
    };
  }, [selectedSale, returnQuantities]);

  const handleProcessReturn = () => {
    if (!selectedSale) return;
    
    const itemsToReturn = selectedSale.items.filter(it => (returnQuantities[it.variantId] || 0) > 0);
    if (itemsToReturn.length === 0) {
      alert(isArabic ? 'الرجاء اختيار سلعة واحدة على الأقل لإرجاعها!' : 'Please select at least one item to return!');
      return;
    }

    const payload = itemsToReturn.map(it => ({
      variantId: it.variantId,
      productId: it.productId,
      quantity: returnQuantities[it.variantId],
      returnToStock: !!returnToStockSettings[it.variantId]
    }));

    const refundAmount = currentRefundSummary.finalRefund;

    // Call state update callback
    onReturnSale(selectedSale.id, payload, refundAmount);

    // Save success receipt data before clearing
    setSuccessReceipt({
      invoiceNumber: selectedSale.invoiceNumber,
      items: itemsToReturn.map(it => ({
        name: it.name,
        size: it.size,
        color: it.color,
        quantity: returnQuantities[it.variantId],
        refundPrice: it.finalPrice
      })),
      totalRefund: refundAmount,
      date: new Date().toLocaleString(isArabic ? 'ar-EG' : 'en-US'),
      refundMethod
    });

    // Reset view
    setSelectedSale(null);
  };

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString(isArabic ? 'ar-EG' : 'en-US')} ${isArabic ? 'ج.م' : 'EGP'}`;
  };

  return (
    <div className="space-y-6" id="sales-returns-container">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2.5">
            <RotateCcw className="w-6 h-6 text-indigo-500 animate-spin-slow" />
            <span>{isArabic ? 'إدارة المرتجعات واسترداد الأموال 🔄' : 'Returns & Refunds Manager 🔄'}</span>
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {isArabic 
              ? 'تسجيل مرتجعات المبيعات للفواتير المصدرة، تسوية الخزينة وإعادة المنتجات لرفوف المخزن تلقائياً.' 
              : 'Process returns for issued receipts, settle cash balances, and restock variants with logging.'}
          </p>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Invoice Finder (cols 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0F0F12] border border-white/5 rounded-2xl p-4 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">{isArabic ? 'البحث عن فاتورة مبيعات' : 'Find Sales Receipt'}</h3>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">
                {sales.length} {isArabic ? 'فاتورة متوفرة' : 'Invoices'}
              </span>
            </div>

            {/* Search inputs */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5 rtl:left-auto rtl:right-3" />
              <input 
                type="text"
                placeholder={isArabic ? 'رقم الفاتورة، اسم العميل، الكاشير...' : 'Receipt #, customer, or cashier...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2 pl-9 pr-4 rtl:pl-4 rtl:pr-9 text-xs text-white focus:outline-none placeholder-gray-600 focus:border-indigo-500/50"
              />
            </div>

            {/* Invoices List */}
            <div className="space-y-2 max-h-[58vh] overflow-y-auto pr-1">
              {filteredSales.length === 0 ? (
                <div className="py-12 text-center text-gray-500 text-xs">
                  <AlertCircle className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                  {isArabic ? 'لم يتم العثور على فواتير تطابق البحث' : 'No matching invoices found.'}
                </div>
              ) : (
                filteredSales.map((sale) => {
                  const isReturnedFull = sale.isReturned && (sale.returnedAmount || 0) >= sale.total;
                  return (
                    <button
                      key={sale.id}
                      onClick={() => handleSelectSale(sale)}
                      className={`w-full text-left rtl:text-right p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                        selectedSale?.id === sale.id
                          ? 'bg-indigo-600/15 border-indigo-500 text-white shadow'
                          : 'bg-gray-950/40 border-gray-850 hover:bg-gray-900/60 text-gray-300'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="font-mono text-xs font-black text-white">{sale.invoiceNumber}</span>
                        <span className="text-xs font-bold text-emerald-400 font-sans">{formatCurrency(sale.total)}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-3 h-3 text-indigo-400" />
                          <span className="truncate max-w-[120px]">{sale.customerName || (isArabic ? 'عميل نقدي' : 'Cash')}</span>
                        </span>
                        <span className="font-mono">{sale.date}</span>
                      </div>

                      {/* Refund status badge */}
                      {sale.isReturned && (
                        <div className="mt-1 self-start">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-black ${
                            isReturnedFull ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {isReturnedFull 
                              ? (isArabic ? 'إرجاع كامل للطلب 🔴' : 'Fully Returned 🔴') 
                              : (isArabic ? `مرتجع جزئي بقيمة: ${formatCurrency(sale.returnedAmount || 0)} 🟡` : `Partially Refunded: ${formatCurrency(sale.returnedAmount || 0)} 🟡`)
                            }
                          </span>
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Active Return Calculator / Details Panel (cols 7) */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {successReceipt ? (
              /* Success Receipt view */
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-[#0F0F12] border border-emerald-500/20 rounded-2xl p-6 text-center space-y-5"
                id="return-receipt-success"
              >
                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{isArabic ? 'تم تأكيد المرتجع وتسوية الحسابات!' : 'Return Processed Successfully!'}</h3>
                  <p className="text-xs text-emerald-400 mt-1">
                    {isArabic 
                      ? `تم إصدار إيصال رد المبلغ وقيمته: ${formatCurrency(successReceipt.totalRefund)}` 
                      : `Successfully issued return receipt of: ${formatCurrency(successReceipt.totalRefund)}`}
                  </p>
                </div>

                {/* Return voucher representation */}
                <div className="bg-gray-950 p-4 rounded-xl text-left rtl:text-right text-xs space-y-3 font-mono border border-gray-850 max-w-md mx-auto">
                  <div className="text-center font-bold text-sm border-b border-gray-800 pb-2 text-white">
                    {isArabic ? 'إيصال مرتجع مبيعات' : 'SALES RETURN RECEIPT'}
                  </div>
                  
                  <div className="flex justify-between text-gray-400 text-[11px]">
                    <span>{isArabic ? 'فاتورة الشراء الأصلية:' : 'Original Invoice:'}</span>
                    <span className="text-white font-bold">{successReceipt.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-[11px]">
                    <span>{isArabic ? 'تاريخ المرتجع:' : 'Return Date:'}</span>
                    <span className="text-white">{successReceipt.date}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 text-[11px]">
                    <span>{isArabic ? 'طريقة رد النقود:' : 'Refund Method:'}</span>
                    <span className="text-white font-bold">{successReceipt.refundMethod}</span>
                  </div>

                  <table className="w-full text-[11px] border-t border-b border-gray-850 my-2 py-2">
                    <thead>
                      <tr className="text-gray-400">
                        <th className="text-left rtl:text-right py-1">{isArabic ? 'الصنف' : 'Item'}</th>
                        <th className="text-center py-1">{isArabic ? 'الكمية' : 'Qty'}</th>
                        <th className="text-right rtl:text-left py-1">{isArabic ? 'القيمة المستردة' : 'Refund'}</th>
                      </tr>
                    </thead>
                    <tbody className="text-gray-200">
                      {successReceipt.items.map((it, idx) => (
                        <tr key={idx} className="border-t border-gray-900/50">
                          <td className="py-1.5">{it.name} ({it.color}/{it.size})</td>
                          <td className="text-center py-1.5 font-bold text-white">{it.quantity}</td>
                          <td className="text-right rtl:text-left py-1.5 text-emerald-400 font-bold">{formatCurrency(it.refundPrice * it.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-between items-center text-sm font-black text-white pt-2">
                    <span>{isArabic ? 'إجمالي القيمة المستردة:' : 'Total Refund Amount:'}</span>
                    <span className="text-lg text-emerald-400 font-sans">{formatCurrency(successReceipt.totalRefund)}</span>
                  </div>
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => alert(isArabic ? 'جاري إرسال إيصال المرتجع للطابعة الحرارية...' : 'Routing document to printer...')}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <Printer className="w-4 h-4" />
                    <span>{isArabic ? 'طباعة الإيصال' : 'Print Return Voucher'}</span>
                  </button>
                  <button
                    onClick={() => setSuccessReceipt(null)}
                    className="px-5 py-2 rounded-xl bg-gray-900 border border-gray-800 hover:bg-gray-850 text-gray-300 text-xs font-bold cursor-pointer"
                  >
                    {isArabic ? 'متابعة المرتجعات' : 'Process Another Return'}
                  </button>
                </div>
              </motion.div>
            ) : selectedSale ? (
              /* Selected Invoice Details & Return Workboard */
              <motion.div
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                className="bg-[#0F0F12] border border-white/5 rounded-2xl p-5 space-y-5 shadow-sm relative"
                id="active-return-workboard"
              >
                {/* Header info of selected receipt */}
                <div className="flex justify-between items-start border-b border-gray-850 pb-4">
                  <div>
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider mb-1.5 inline-block">
                      {isArabic ? 'جاري تسوية مرتجع للفاتورة' : 'Active Settle Session'}
                    </span>
                    <h3 className="text-base font-black text-white font-mono">{selectedSale.invoiceNumber}</h3>
                    <div className="flex gap-4 text-xs text-gray-400 mt-1">
                      <span>{isArabic ? `الكاشير: ${selectedSale.cashierName}` : `Cashier: ${selectedSale.cashierName}`}</span>
                      <span>•</span>
                      <span>{selectedSale.date}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedSale(null)}
                    className="p-1 text-gray-400 hover:text-white bg-gray-900 border border-gray-850 rounded-lg cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>

                {/* Items in this invoice with quantity selectors */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{isArabic ? 'محتويات الفاتورة وتحديد كميات المرتجع' : 'Invoice Items & Refund Allocation'}</h4>
                  
                  <div className="space-y-2.5 max-h-[35vh] overflow-y-auto pr-1">
                    {selectedSale.items.map((item) => {
                      const selectedReturnQty = returnQuantities[item.variantId] || 0;
                      const returnToStock = returnToStockSettings[item.variantId] !== false;
                      
                      return (
                        <div 
                          key={item.id} 
                          className={`p-3.5 rounded-xl border transition-all ${
                            selectedReturnQty > 0 
                              ? 'bg-rose-500/5 border-rose-500/20' 
                              : 'bg-gray-950/40 border-gray-850/80'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h5 className="text-xs font-black text-white">{item.name}</h5>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] bg-gray-900 text-gray-400 px-1.5 py-0.2 rounded border border-gray-800">
                                  {isArabic ? `اللون: ${item.color}` : `Color: ${item.color}`}
                                </span>
                                <span className="text-[10px] bg-gray-900 text-gray-400 px-1.5 py-0.2 rounded border border-gray-800">
                                  {isArabic ? `المقاس: ${item.size}` : `Size: ${item.size}`}
                                </span>
                              </div>
                              
                              <div className="text-[10px] text-gray-400 font-sans mt-2">
                                {isArabic ? 'سعر البيع بالفاتورة:' : 'Sales price:'} <span className="font-bold text-white">{formatCurrency(item.finalPrice)}</span>
                                <span className="mx-1 font-mono">•</span>
                                {isArabic ? 'الكمية المشتراة:' : 'Bought Qty:'} <span className="font-bold text-white">{item.quantity}</span>
                              </div>
                            </div>

                            {/* Return count controls */}
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <div className="flex items-center gap-1 bg-gray-950 rounded-xl border border-gray-800 p-1">
                                <button
                                  type="button"
                                  onClick={() => handleQtyChange(item.variantId, item.quantity, -1)}
                                  className="w-6 h-6 rounded-lg bg-gray-900 hover:bg-gray-850 text-gray-400 hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center text-xs font-black text-white font-mono">
                                  {selectedReturnQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleQtyChange(item.variantId, item.quantity, 1)}
                                  className="w-6 h-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                                >
                                  +
                                </button>
                              </div>

                              {/* Toggle: Return to stock or Defective */}
                              {selectedReturnQty > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleStockToggle(item.variantId)}
                                  className={`px-2 py-0.5 rounded text-[9px] font-black uppercase cursor-pointer border ${
                                    returnToStock
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                      : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                  }`}
                                >
                                  {returnToStock 
                                    ? (isArabic ? 'إرجاع للرفوف 📦' : 'Restock Item 📦')
                                    : (isArabic ? 'بضاعة تالفة ❌' : 'Defective (No Stock) ❌')
                                  }
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Return Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-800/40">
                  {/* Refund method */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'طريقة رد المبالغ المالية' : 'Refund Destination'}</label>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value as any)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="Cash">{isArabic ? 'خزينة الكاشير (نقدي)' : 'Drawer Cash'}</option>
                      <option value="Visa">{isArabic ? 'بطاقة بنكية (Visa)' : 'Bank Card'}</option>
                      <option value="Vodafone Cash">{isArabic ? 'محفظة إلكترونية' : 'Vodafone Cash'}</option>
                      <option value="Instapay">{isArabic ? 'إنستاباي' : 'Instapay'}</option>
                    </select>
                  </div>

                  {/* Return Reason */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'سبب الارتجاع' : 'Reason for Refund'}</label>
                    <input 
                      type="text"
                      placeholder={isArabic ? 'مقاس غير مناسب، عيب تصنيع...' : 'Wrong size, fabric defect...'}
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder-gray-600"
                    />
                  </div>
                </div>

                {/* Settle Block */}
                <div className="p-4 rounded-2xl bg-gray-950 border border-gray-850/80 space-y-3">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{isArabic ? 'عدد القطع المسترجعة:' : 'Refunded Items:'}</span>
                    <span className="font-bold text-white font-mono">{currentRefundSummary.itemsCount} {isArabic ? 'قطع' : 'pcs'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center font-bold text-sm text-white pt-2 border-t border-gray-800/50">
                    <span>{isArabic ? 'المبلغ الإجمالي المسترد للعميل:' : 'Total Payable Refund:'}</span>
                    <span className="text-xl text-emerald-400 font-black">{formatCurrency(currentRefundSummary.finalRefund)}</span>
                  </div>
                </div>

                {/* Confirm refund action */}
                <button
                  type="button"
                  disabled={currentRefundSummary.itemsCount === 0}
                  onClick={handleProcessReturn}
                  className={`w-full py-3.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg transition-all ${
                    currentRefundSummary.itemsCount > 0
                      ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer hover:shadow-rose-900/10'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  }`}
                  id="submit-refund-sales-btn"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>{isArabic ? 'تأكيد وإصدار إيصال المرتجع 💸' : 'Confirm & Process Refund 💸'}</span>
                </button>
              </motion.div>
            ) : (
              /* Idle state placeholder */
              <div 
                className="bg-[#0F0F12]/30 border border-dashed border-gray-800 rounded-2xl p-12 text-center text-gray-500 flex flex-col items-center justify-center h-[65vh]"
                id="returns-idle-placeholder"
              >
                <ShoppingBag className="w-12 h-12 text-gray-700 mb-3 animate-pulse" />
                <h4 className="text-xs font-bold text-gray-300">{isArabic ? 'لم يتم تحديد فاتورة' : 'No Active Invoice Selected'}</h4>
                <p className="text-[11px] text-gray-500 mt-1.5 max-w-sm mx-auto">
                  {isArabic 
                    ? 'اختر أو ابحث عن فاتورة مبيعات مسجلة من القائمة الجانبية لبدء تسجيل مرتجعات السلع وضبط مخزون المحل.' 
                    : 'Search and click an issued receipt from the sidebar registry to begin a refund or return.'}
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
