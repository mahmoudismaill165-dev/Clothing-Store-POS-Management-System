import React, { useState } from 'react';
import { Product, ProductVariant, StockHistory, StoreSettings, User } from '../types';
import { 
  Package, TrendingUp, TrendingDown, ArrowDownUp, AlertTriangle, 
  RotateCcw, SlidersHorizontal, Settings2, Plus, Minus
} from 'lucide-react';
import { motion } from 'motion/react';

interface InventoryProps {
  products: Product[];
  history: StockHistory[];
  settings: StoreSettings;
  currentUser: User;
  onUpdateProductStockDirectly: (productId: string, variantId: string, newQty: number, reason: string) => void;
  isArabic: boolean;
}

export default function Inventory({
  products,
  history,
  settings,
  currentUser,
  onUpdateProductStockDirectly,
  isArabic
}: InventoryProps) {
  const [filterType, setFilterType] = useState<'All' | 'Low' | 'Out'>('All');
  const [activeAdjustProduct, setActiveAdjustProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [adjustAmount, setAdjustAmount] = useState<number>(1);
  const [adjustAction, setAdjustAction] = useState<'add' | 'subtract'>('add');
  const [adjustReason, setAdjustReason] = useState(isArabic ? 'جرد سنوي معتاد للمحل' : 'Regular physical count audit');

  // Compile all variants into a single flat list to facilitate easy grid lookup
  const flatVariants: { product: Product; variant: ProductVariant }[] = [];
  products.forEach(p => {
    p.variants.forEach(v => {
      flatVariants.push({ product: p, variant: v });
    });
  });

  // Apply filters
  const filteredVariants = flatVariants.filter(item => {
    if (filterType === 'Low') {
      return item.variant.quantity > 0 && item.variant.quantity <= item.product.stockAlertLevel;
    }
    if (filterType === 'Out') {
      return item.variant.quantity === 0;
    }
    return true; // All
  });

  const handleApplyAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdjustProduct || !selectedVariantId) return;

    const targetVariant = activeAdjustProduct.variants.find(v => v.id === selectedVariantId);
    if (!targetVariant) return;

    const change = adjustAction === 'add' ? adjustAmount : -adjustAmount;
    const finalNewQty = Math.max(0, targetVariant.quantity + change);

    // Trigger state save
    onUpdateProductStockDirectly(activeAdjustProduct.id, selectedVariantId, finalNewQty, adjustReason);

    // Reset forms
    setActiveAdjustProduct(null);
    setSelectedVariantId('');
    setAdjustAmount(1);
    setAdjustReason(isArabic ? 'جرد سنوي معتاد للمحل' : 'Regular physical count audit');
  };

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString(isArabic ? 'ar-EG' : 'en-US')} ${isArabic ? 'ج.م' : 'EGP'}`;
  };

  return (
    <div className="space-y-6" id="inventory-tab-root">
      
      {/* KPI Overview header row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-4 rounded-2xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold block uppercase">{isArabic ? 'إجمالي القطع المتوفرة' : 'Total Apparel pieces'}</span>
            <h4 className="text-lg font-black mt-0.5 font-mono">
              {flatVariants.reduce((acc, curr) => acc + curr.variant.quantity, 0)} {isArabic ? 'قطعة' : 'units'}
            </h4>
          </div>
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold block uppercase">{isArabic ? 'موديلات منتهية تماماً' : 'Totally sold out items'}</span>
            <h4 className="text-lg font-black text-rose-400 mt-0.5 font-mono">
              {flatVariants.filter(item => item.variant.quantity === 0).length} {isArabic ? 'متغيرات' : 'SKUs'}
            </h4>
          </div>
          <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold block uppercase">{isArabic ? 'إجمالي قيمة رأس مال البضاعة' : 'Asset inventory valuation'}</span>
            <h4 className="text-lg font-black text-emerald-400 mt-0.5 font-sans">
              {formatCurrency(flatVariants.reduce((acc, curr) => acc + (curr.variant.quantity * curr.product.purchasePrice), 0))}
            </h4>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Split Status table and Stock adjustments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Real-time stock counts (7 Cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
            <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
              <SlidersHorizontal className="w-4 h-4 text-indigo-400 animate-spin-slow" />
              {isArabic ? 'جدول التدقيق المخزني الفوري' : 'Real-time stock ledger'}
            </h4>

            {/* View filters */}
            <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-xl border border-gray-800">
              <button
                onClick={() => setFilterType('All')}
                className={`px-3 py-1 rounded-lg text-[9px] font-extrabold cursor-pointer transition-all ${
                  filterType === 'All' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                {isArabic ? 'الكل' : 'All'}
              </button>
              <button
                onClick={() => setFilterType('Low')}
                className={`px-3 py-1 rounded-lg text-[9px] font-extrabold cursor-pointer transition-all ${
                  filterType === 'Low' ? 'bg-amber-500/25 text-amber-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                {isArabic ? 'قرب ينتهي' : 'Low stock'}
              </button>
              <button
                onClick={() => setFilterType('Out')}
                className={`px-3 py-1 rounded-lg text-[9px] font-extrabold cursor-pointer transition-all ${
                  filterType === 'Out' ? 'bg-rose-500/25 text-rose-400' : 'text-gray-400 hover:text-white'
                }`}
              >
                {isArabic ? 'منتهي' : 'Out'}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
            <table className="w-full text-xs text-left rtl:text-right" id="inventory-ledger-table">
              <thead>
                <tr className="border-b border-gray-800 text-gray-500 font-extrabold text-[9px] uppercase tracking-wider">
                  <th className="py-2 px-3">{isArabic ? 'المنتج / البراند' : 'Apparel Model'}</th>
                  <th className="py-2 px-3">{isArabic ? 'المقاس/اللون' : 'Variant'}</th>
                  <th className="py-2 px-3">{isArabic ? 'الكمية' : 'StockQty'}</th>
                  <th className="py-2 px-3 font-mono">{isArabic ? 'الباركود المستقل' : 'Barcode'}</th>
                  <th className="py-2 px-3 text-center">{isArabic ? 'تعديل' : 'Modify'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40 text-gray-300 font-sans">
                {filteredVariants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500 font-bold border-dashed border-gray-850">
                      {isArabic ? 'لا توجد تنبيهات مخزنية مطابقة للفلتر المحدد' : 'No matching variants found for this filter'}
                    </td>
                  </tr>
                ) : (
                  filteredVariants.map(({ product, variant }) => {
                    const isOut = variant.quantity === 0;
                    const isLow = variant.quantity > 0 && variant.quantity <= product.stockAlertLevel;

                    return (
                      <tr key={variant.id} className="hover:bg-gray-800/20 transition-all">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-white block truncate max-w-[160px]">{product.name}</span>
                          <span className="text-[9px] text-indigo-400 font-medium block">{product.brand}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <span style={{ backgroundColor: variant.colorHex }} className="w-2.5 h-2.5 rounded-full border border-gray-800 shrink-0" />
                            <span>{variant.color} - <strong className="text-white font-mono">{variant.size}</strong></span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          {isOut ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-bold text-[9px]">
                              {isArabic ? 'منفذ بالكامل' : 'Out'}
                            </span>
                          ) : isLow ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold text-[9px] animate-pulse">
                              {variant.quantity} {isArabic ? 'قليل جداً' : 'Low'}
                            </span>
                          ) : (
                            <span className="font-mono font-extrabold text-white">{variant.quantity}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[10px] text-gray-400">{variant.barcode}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              setActiveAdjustProduct(product);
                              setSelectedVariantId(variant.id);
                            }}
                            className="p-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-indigo-400 cursor-pointer"
                            id={`adjust-btn-${variant.id}`}
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Manual Adjustments widget drawer (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
                <Settings2 className="w-4 h-4 text-pink-400" />
                {isArabic ? 'تعديل وتعديل رصيد الصنف' : 'Inventory Stock Adjustment'}
              </h4>
              <p className="text-[11px] text-gray-400 leading-normal">
                {isArabic 
                  ? 'اختر أي صنف من الجدول الأيمن لتعديل كميته الفورية وتوثيق أسباب الفروق المخزنية رسمياً في النظام.' 
                  : 'Select an entry from the left grid to correct inventory discrepancies for damages, counts or shipments.'}
              </p>

              {activeAdjustProduct ? (
                <form onSubmit={handleApplyAdjustment} className="space-y-3.5 text-xs text-gray-300">
                  <div className="p-3.5 bg-gray-950 border border-indigo-500/20 rounded-2xl">
                    <span className="text-[9px] text-indigo-400 font-bold block uppercase">{activeAdjustProduct.brand}</span>
                    <h5 className="font-bold text-white text-xs mt-0.5">{activeAdjustProduct.name}</h5>
                    <div className="flex items-center gap-2 mt-2">
                      <label className="text-gray-500 font-semibold">{isArabic ? 'متغير المقاس واللون:' : 'Selected variant:'}</label>
                      <select
                        value={selectedVariantId}
                        onChange={(e) => setSelectedVariantId(e.target.value)}
                        className="bg-gray-900 border border-gray-800 rounded p-1 text-white text-xs font-mono"
                        id="adjust-variant-selector"
                      >
                        {activeAdjustProduct.variants.map((v) => (
                          <option key={v.id} value={v.id}>{v.color} - {v.size} ({isArabic ? 'الحالي' : 'Current'}: {v.quantity})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Add vs Subtract */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustAction('add')}
                      className={`py-1.5 rounded-xl font-bold border transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                        adjustAction === 'add' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-gray-900 border-gray-800 text-gray-500'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'إضافة كمية' : 'Add Qty'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustAction('subtract')}
                      className={`py-1.5 rounded-xl font-bold border transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                        adjustAction === 'subtract' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-gray-900 border-gray-800 text-gray-500'
                      }`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                      <span>{isArabic ? 'عجز / تالف' : 'Subtract Qty'}</span>
                    </button>
                  </div>

                  {/* Quantity to adjust */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'الكمية المطلوبة للتعديل:' : 'Quantity to change:'}</label>
                    <input 
                      type="number" min="1" required
                      value={adjustAmount || ''} onChange={(e) => setAdjustAmount(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white font-mono text-center font-bold"
                      id="adjust-quantity-input"
                    />
                  </div>

                  {/* Justification reason */}
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'سبب التعديل المخزني بالتفصيل:' : 'Reason for adjustment:'}</label>
                    <input 
                      type="text" required
                      value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder={isArabic ? 'مثال: جرد بضاعة تالفة، وصول شحنة مكملة...' : 'e.g., damaged transit, shipment receipt'}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white placeholder-gray-600"
                      id="adjust-reason-input"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveAdjustProduct(null)}
                      className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-400 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      {isArabic ? 'تراجع' : 'Bypass'}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
                      id="adjust-submit-button"
                    >
                      {isArabic ? 'تأكيد وحفظ التغيير' : 'Confirm Change'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-12 text-center text-gray-500 font-bold border border-dashed border-gray-800 rounded-2xl">
                  {isArabic ? '👈 اختر صنف لتعديل رصيده من الجدول' : '👈 Choose an item to audit from the left grid'}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Stock History Audit log lists (100% complete) */}
      <div className="p-6 rounded-3xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl space-y-4">
        <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
          <ArrowDownUp className="w-4 h-4 text-emerald-400" />
          {isArabic ? 'سجل تتبع ومراجعة حركات المخزن بالكامل' : 'Apparel Inventory stock activity audit'}
        </h4>

        <div className="overflow-x-auto max-h-56">
          <table className="w-full text-xs text-left rtl:text-right" id="stock-history-audit-table">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 font-extrabold text-[9px] uppercase tracking-wider">
                <th className="py-2 px-3">{isArabic ? 'التاريخ' : 'Date'}</th>
                <th className="py-2 px-3">{isArabic ? 'المنتج' : 'Apparel Product'}</th>
                <th className="py-2 px-3">{isArabic ? 'المقاس/اللون' : 'Variant'}</th>
                <th className="py-2 px-3 text-center">{isArabic ? 'نوع الحركة' : 'Operation'}</th>
                <th className="py-2 px-3 text-center">{isArabic ? 'الكمية' : 'ChangeQty'}</th>
                <th className="py-2 px-3 text-center">{isArabic ? 'الرصيد السابق/الجديد' : 'Prev/New Qty'}</th>
                <th className="py-2 px-3">{isArabic ? 'السبب الموثق' : 'Recorded Reason'}</th>
                <th className="py-2 px-3">{isArabic ? 'المنفذ' : 'Operator'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40 text-gray-300 font-sans">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 font-bold">
                    {isArabic ? 'لا توجد حركات مخزنية مسجلة حاليًا' : 'No inventory operations logged yet'}
                  </td>
                </tr>
              ) : (
                history.map((log) => {
                  let badge = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
                  if (log.type === 'Sale') badge = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                  if (log.type === 'In') badge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                  if (log.type === 'Adjustment') badge = 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';

                  return (
                    <tr key={log.id} className="hover:bg-gray-800/20 transition-all">
                      <td className="py-2 px-3 text-gray-500 font-mono text-[10px]">{log.date}</td>
                      <td className="py-2 px-3 font-bold text-white">{log.productName}</td>
                      <td className="py-2 px-3 font-mono text-gray-400">{log.size || '-'} / {log.color || '-'}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-bold ${badge}`}>
                          {log.type}
                        </span>
                      </td>
                      <td className={`py-2 px-3 text-center font-bold font-mono text-[12px] ${
                        log.type === 'In' || (log.type === 'Adjustment' && log.newQty > log.previousQty) ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {log.type === 'In' || (log.type === 'Adjustment' && log.newQty > log.previousQty) ? '+' : ''}
                        {log.newQty - log.previousQty}
                      </td>
                      <td className="py-2 px-3 text-center font-mono text-[11px] text-gray-400">
                        {log.previousQty} ➔ {log.newQty}
                      </td>
                      <td className="py-2 px-3 text-[10px] text-gray-400 max-w-[200px] truncate" title={log.reason}>{log.reason}</td>
                      <td className="py-2 px-3 font-bold text-indigo-400">{log.operator}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
