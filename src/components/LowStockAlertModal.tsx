import React from 'react';
import { Product } from '../types';
import { AlertTriangle, X, ArrowUpRight, ShieldAlert, Package, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';

interface LowStockAlertModalProps {
  lowStockItems: {
    product: Product;
    variantName: string;
    size: string;
    color: string;
    qty: number;
    threshold: number;
  }[];
  isArabic: boolean;
  onClose: () => void;
  onGoToInventory: () => void;
}

export default function LowStockAlertModal({
  lowStockItems,
  isArabic,
  onClose,
  onGoToInventory
}: LowStockAlertModalProps) {
  if (lowStockItems.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" id="low-stock-alert-modal-container">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="relative w-full max-w-2xl bg-[#0F0F12] border border-red-500/20 rounded-3xl p-6 shadow-2xl overflow-hidden"
        id="low-stock-alert-modal-card"
      >
        {/* Subtle decorative alert pattern */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />

        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-gray-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>{isArabic ? 'تنبيه: نواقص المخزون ومستوى إعادة الطلب ⚠️' : 'Warning: Safety Stock Alert ⚠️'}</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {isArabic 
                  ? `تم رصد عدد ${lowStockItems.length} صنف/مقاس وصل لمستوى الأمان أو أقل من حد إعادة الطلب.` 
                  : `Detected ${lowStockItems.length} variants at or below their reorder points.`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white rounded-xl cursor-pointer transition-all"
            id="low-stock-alert-close-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Badge / Summary Box */}
        <div className="bg-red-500/5 border border-red-500/10 p-3 rounded-2xl flex items-center gap-2.5 text-xs text-red-400 font-bold mb-4">
          <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
          <span>
            {isArabic 
              ? 'يرجى مراجعة القائمة وتوريد السلع المطلوبة لتفادي نفاد الكميات المتاحة للبيع.'
              : 'Please review the list and procure replenishment quantities to avoid stockouts.'}
          </span>
        </div>

        {/* Items List (Scrollable) */}
        <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
          {lowStockItems.map((item, index) => (
            <div 
              key={index}
              className="p-3 bg-gray-950 rounded-2xl border border-gray-900 flex items-center justify-between text-xs hover:border-red-500/10 transition-all"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-white">{item.product.name}</span>
                  <span className="px-1.5 py-0.5 rounded bg-gray-900 border border-gray-850 text-gray-400 text-[10px] font-mono">
                    {item.product.brand}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-400 font-medium">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full border border-gray-850" style={{ backgroundColor: item.product.variants.find(v => v.size === item.size && v.color === item.color)?.colorHex || '#ccc' }} />
                    <span>{isArabic ? 'اللون:' : 'Color:'} {item.color}</span>
                  </span>
                  <span className="text-gray-600">•</span>
                  <span>{isArabic ? 'المقاس:' : 'Size:'} <strong className="text-gray-300 font-mono">{item.size}</strong></span>
                  <span className="text-gray-600">•</span>
                  <span>{isArabic ? 'النوع:' : 'Category:'} <span className="text-gray-300">{item.product.category}</span></span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 justify-end">
                  <span className="text-gray-400">{isArabic ? 'المتاح حالياً:' : 'Current Stock:'}</span>
                  <span className={`font-black font-mono text-sm ${item.qty === 0 ? 'text-red-500' : 'text-amber-400'}`}>
                    {item.qty}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  {isArabic ? `حد إعادة الطلب: ${item.threshold}` : `Reorder Level: ${item.threshold}`}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-6 border-t border-gray-800 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-850 text-gray-300 hover:text-white font-bold text-xs rounded-xl border border-gray-850 transition-all cursor-pointer"
            id="low-stock-alert-dismiss-btn"
          >
            {isArabic ? 'موافق، إغلاق' : 'Okay, Dismiss'}
          </button>
          
          <button
            onClick={() => {
              onGoToInventory();
              onClose();
            }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-red-900/10 transition-all"
            id="low-stock-alert-action-btn"
          >
            <Package className="w-4 h-4" />
            <span>{isArabic ? 'الذهاب لإدارة المخزون' : 'Go to Stock Management'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
