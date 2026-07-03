import React, { useState } from 'react';
import { Product, ProductVariant, ApparelType, ClothingSeason, StoreSettings, User } from '../types';
import { 
  Plus, Edit, Trash2, LayoutGrid, List, Check, X, 
  Shirt, ArrowUpRight, Sparkles, SlidersHorizontal, Image
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductsProps {
  products: Product[];
  settings: StoreSettings;
  currentUser: User;
  onAddProduct: (newProduct: Product) => void;
  onUpdateProduct: (updatedProduct: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onClearAllProducts?: () => void;
  isArabic: boolean;
}

export default function Products({
  products,
  settings,
  currentUser,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onClearAllProducts,
  isArabic
}: ProductsProps) {
  // Navigation tabs inside products
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<ApparelType>('mens');
  const [season, setSeason] = useState<ClothingSeason>('Summer');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [wholesalePrice, setWholesalePrice] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [barcode, setBarcode] = useState('');
  const [stockAlertLevel, setStockAlertLevel] = useState<number>(5);

  // Variant generator fields
  const [rawSizes, setRawSizes] = useState('S,M,L,XL');
  const [rawColors, setRawColors] = useState('أبيض,أسود');
  const [defaultVariantQty, setDefaultVariantQty] = useState<number>(10);
  const [colorHexMap, setColorHexMap] = useState<Record<string, string>>({
    'أبيض': '#FFFFFF',
    'أسود': '#000000',
    'أزرق': '#1A365D',
    'بيج': '#F5F5DC',
    'رمادي': '#718096',
    'زيتوني': '#556B2F',
    'جملي': '#C19A6B'
  });
  
  // Array of prepared variants for custom quantity entry
  const [tempVariants, setTempVariants] = useState<ProductVariant[]>([]);

  const handleGenerateVariantGrid = () => {
    const sizes = rawSizes.split(',').map(s => s.trim()).filter(Boolean);
    const colors = rawColors.split(',').map(c => c.trim()).filter(Boolean);

    if (sizes.length === 0 || colors.length === 0) {
      alert(isArabic ? 'الرجاء إدخال مقاس ولون واحد على الأقل للمصفوفة!' : 'Please enter at least one size and color to compile the matrix!');
      return;
    }

    const compiled: ProductVariant[] = [];
    const baseCode = barcode || Math.floor(1000000000 + Math.random() * 9000000000).toString();

    colors.forEach(col => {
      sizes.forEach(sz => {
        const customId = `v_${col}_${sz}_${Date.now()}`;
        const suffix = `${col.charCodeAt(0) || '0'}${sz}`;
        compiled.push({
          id: customId,
          size: sz,
          color: col,
          colorHex: colorHexMap[col] || '#CBD5E1',
          quantity: defaultVariantQty, // default initial stock
          barcode: `${baseCode}-${suffix}`,
          sku: `${brand.toUpperCase() || 'APP'}-${col.substring(0,2).toUpperCase()}-${sz}`
        });
      });
    });

    setTempVariants(compiled);
  };

  const handleApplyQtyToAll = () => {
    setTempVariants(
      tempVariants.map(v => ({ ...v, quantity: Math.max(0, defaultVariantQty) }))
    );
  };

  const handleUpdateTempVariantQty = (variantId: string, qty: number) => {
    setTempVariants(
      tempVariants.map(v => v.id === variantId ? { ...v, quantity: Math.max(0, qty) } : v)
    );
  };

  const handleUpdateTempVariantBarcode = (variantId: string, code: string) => {
    setTempVariants(
      tempVariants.map(v => v.id === variantId ? { ...v, barcode: code } : v)
    );
  };

  const handleUpdateTempVariantSKU = (variantId: string, skuStr: string) => {
    setTempVariants(
      tempVariants.map(v => v.id === variantId ? { ...v, sku: skuStr } : v)
    );
  };

  const handleResetForm = () => {
    setName('');
    setBrand('');
    setCategory('');
    setType('mens');
    setSeason('Summer');
    setPurchasePrice(0);
    setSellingPrice(0);
    setWholesalePrice(0);
    setDiscount(0);
    setNotes('');
    setBarcode('');
    setStockAlertLevel(5);
    setTempVariants([]);
    setShowAddForm(false);
    setEditingProduct(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let finalVariants = tempVariants;
    if (finalVariants.length === 0) {
      const sizes = rawSizes.split(',').map(s => s.trim()).filter(Boolean);
      const colors = rawColors.split(',').map(c => c.trim()).filter(Boolean);

      if (sizes.length === 0 || colors.length === 0) {
        alert(isArabic ? 'الرجاء إدخال مقاس ولون واحد على الأقل للمصفوفة!' : 'Please enter at least one size and color to compile the matrix!');
        return;
      }

      const compiled: ProductVariant[] = [];
      const baseCode = barcode || Math.floor(1000000000 + Math.random() * 9000000000).toString();

      colors.forEach(col => {
        sizes.forEach(sz => {
          const customId = `v_${col}_${sz}_${Date.now()}`;
          const suffix = `${col.charCodeAt(0) || '0'}${sz}`;
          compiled.push({
            id: customId,
            size: sz,
            color: col,
            colorHex: colorHexMap[col] || '#CBD5E1',
            quantity: defaultVariantQty, // default initial stock
            barcode: `${baseCode}-${suffix}`,
            sku: `${brand.toUpperCase() || 'APP'}-${col.substring(0,2).toUpperCase()}-${sz}`
          });
        });
      });
      finalVariants = compiled;
    }

    const mainBarcode = barcode || finalVariants[0]?.barcode || Math.floor(1000000000 + Math.random() * 9000000000).toString();

    if (editingProduct) {
      const updated: Product = {
        ...editingProduct,
        name,
        brand,
        category,
        type,
        season,
        purchasePrice,
        sellingPrice,
        wholesalePrice: wholesalePrice || sellingPrice,
        discount,
        notes,
        barcode: mainBarcode,
        imageUrl: '',
        variants: finalVariants,
        stockAlertLevel
      };
      onUpdateProduct(updated);
    } else {
      const created: Product = {
        id: `p_${Date.now()}`,
        name,
        brand,
        category,
        type,
        season,
        purchasePrice,
        sellingPrice,
        wholesalePrice: wholesalePrice || sellingPrice,
        discount,
        notes,
        barcode: mainBarcode,
        imageUrl: '',
        variants: finalVariants,
        stockAlertLevel
      };
      onAddProduct(created);
    }

    handleResetForm();
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setBrand(product.brand);
    setCategory(product.category);
    setType(product.type);
    setSeason(product.season);
    setPurchasePrice(product.purchasePrice);
    setSellingPrice(product.sellingPrice);
    setWholesalePrice(product.wholesalePrice || product.sellingPrice);
    setDiscount(product.discount);
    setNotes(product.notes || '');
    setBarcode(product.barcode);
    setStockAlertLevel(product.stockAlertLevel || 5);
    setTempVariants(product.variants);
    setShowAddForm(true);
  };

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString(isArabic ? 'ar-EG' : 'en-US')} ${isArabic ? 'ج.م' : 'EGP'}`;
  };

  return (
    <div className="space-y-6" id="products-tab-root">
      
      {/* Title Header with Add Product toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <Shirt className="w-5 h-5 text-indigo-400" />
            {isArabic ? 'إدارة كتالوج المنتجات والموديلات' : 'Apparel Catalog Management'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {isArabic 
              ? 'إضافة الملابس، تحديد العلامات التجارية، تتبع المقاسات وتوزيع باركود منفصل لكل variant.' 
              : 'Construct apparel parameters, prices, custom variant sizes, colors, and SKU codes.'}
          </p>
        </div>
        {!showAddForm && (
          <div className="flex flex-wrap items-center gap-3 self-start">
            {products.length > 0 && onClearAllProducts && (
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                id="clear-all-products-button"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isArabic ? 'حذف كافة الأصناف البدء من الصفر' : 'Clear All Products'}</span>
              </button>
            )}
            <button
              onClick={() => {
                handleResetForm();
                setShowAddForm(true);
              }}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              id="add-new-product-button"
            >
              <Plus className="w-4 h-4" />
              <span>{isArabic ? 'إضافة منتج جديد مع الماتريكس' : 'Add Apparel & Build Matrix'}</span>
            </button>
          </div>
        )}
      </div>

      {showClearConfirm && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-extrabold text-white">{isArabic ? 'هل أنت متأكد تماماً من حذف كافة المنتجات من الكتالوج؟' : 'Are you absolutely sure you want to clear all products?'}</h4>
            <p className="text-gray-400 mt-1">{isArabic ? 'هذا الإجراء سيقوم بتصفير كافة الأصناف والمقاسات والألوان بالمخزن بالكامل ولا يمكن التراجع عنه.' : 'This will completely wipe out all items, sizes, and quantities in the stock. This action is irreversible.'}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 font-bold hover:bg-gray-700 cursor-pointer"
            >
              {isArabic ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              onClick={() => {
                if (onClearAllProducts) onClearAllProducts();
                setShowClearConfirm(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 cursor-pointer"
            >
              {isArabic ? 'نعم، احذف الكل' : 'Yes, Delete All'}
            </button>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {showAddForm ? (
          /* FORM VIEW: ADD / EDIT CLOTHES & VARIANTS */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="p-6 rounded-3xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl"
            id="product-editor-form-view"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Core Information Section */}
              <div className="border-b border-gray-800 pb-4">
                <h4 className="text-sm font-bold text-indigo-400 mb-4 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4" />
                  {isArabic ? 'بيانات الموديل الأساسية' : 'Apparel Core Configurations'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-bold block">{isArabic ? 'اسم المنتج' : 'Apparel Name'}</label>
                    <input 
                      type="text" required placeholder="مثال: تيشرت اوفرسايز زارا"
                      value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/50 focus:outline-none text-white placeholder-gray-600"
                    />
                  </div>

                  {/* Brand */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-bold block">{isArabic ? 'البراند / الماركة' : 'Brand Name'}</label>
                    <input 
                      type="text" required placeholder="Zara, Nike, Adidas, Concrete..."
                      value={brand} onChange={(e) => setBrand(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/50 focus:outline-none text-white placeholder-gray-600"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-bold block">{isArabic ? 'التصنيف' : 'Category'}</label>
                    <input 
                      type="text" required placeholder="تيشرتات، بنطلونات، فساتين، بدل..."
                      value={category} onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/50 focus:outline-none text-white placeholder-gray-600"
                    />
                  </div>

                  {/* Type */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-bold block">{isArabic ? 'النوع الفئة' : 'Apparel Section'}</label>
                    <select
                      value={type} onChange={(e) => setType(e.target.value as ApparelType)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                    >
                      <option value="mens">{isArabic ? 'رجالي' : 'Mens'}</option>
                      <option value="womens">{isArabic ? 'حريمي' : 'Womens'}</option>
                      <option value="kids">{isArabic ? 'أطفال' : 'Kids'}</option>
                      <option value="unisex">{isArabic ? 'للجنسين' : 'Unisex'}</option>
                    </select>
                  </div>

                  {/* Season */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-bold block">{isArabic ? 'موسم الملابس' : 'Season'}</label>
                    <select
                      value={season} onChange={(e) => setSeason(e.target.value as ClothingSeason)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
                    >
                      <option value="Summer">{isArabic ? 'صيفي' : 'Summer'}</option>
                      <option value="Winter">{isArabic ? 'شتوي' : 'Winter'}</option>
                      <option value="Spring">{isArabic ? 'ربيعي' : 'Spring'}</option>
                      <option value="Autumn">{isArabic ? 'خريفي' : 'Autumn'}</option>
                      <option value="All Seasons">{isArabic ? 'كل الفصول' : 'All Seasons'}</option>
                    </select>
                  </div>

                  {/* Main Barcode */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-bold block">{isArabic ? 'الباركود العام للنموذج' : 'Model Master Barcode'}</label>
                    <input 
                      type="text" placeholder="مثال: 8801928371 (أو اتركه فارغا للتوليد التلقائي)"
                      value={barcode} onChange={(e) => setBarcode(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/50 focus:outline-none text-white placeholder-gray-600 font-mono"
                    />
                  </div>

                  {/* Purchase Price */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-bold block">{isArabic ? 'سعر الشراء الكلي (ج.م)' : 'Purchase Cost Price'}</label>
                    <input 
                      type="number" min="0" required
                      value={purchasePrice || ''} onChange={(e) => setPurchasePrice(Number(e.target.value))}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/50 focus:outline-none text-white font-mono"
                    />
                  </div>

                  {/* Selling Price */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-bold block">{isArabic ? 'سعر البيع الافتراضي قطاعي (ج.م)' : 'Selling Retail Price'}</label>
                    <input 
                      type="number" min="0" required
                      value={sellingPrice || ''} onChange={(e) => setSellingPrice(Number(e.target.value))}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/50 focus:outline-none text-white font-mono"
                    />
                  </div>

                  {/* Wholesale Price */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-bold block">{isArabic ? 'سعر بيع الجملة (ج.م)' : 'Wholesale Selling Price'}</label>
                    <input 
                      type="number" min="0" required
                      value={wholesalePrice || ''} onChange={(e) => setWholesalePrice(Number(e.target.value))}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/50 focus:outline-none text-white font-mono"
                    />
                  </div>

                  {/* Discount percentage */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-bold block">{isArabic ? 'الخصم الترويجي الافتراضي (%)' : 'Catalog Discount (%)'}</label>
                    <input 
                      type="number" min="0" max="95"
                      value={discount || ''} onChange={(e) => setDiscount(Number(e.target.value))}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/50 focus:outline-none text-white font-mono"
                    />
                  </div>

                  {/* Alert Threshold */}
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-400 font-bold block">{isArabic ? 'الحد الأدنى لتنبيه نواقص المخزون' : 'Safety Stock Alert Level'}</label>
                    <input 
                      type="number" min="0" required
                      value={stockAlertLevel || ''} onChange={(e) => setStockAlertLevel(Number(e.target.value))}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/50 focus:outline-none text-white font-mono"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1 mt-4">
                  <label className="text-[11px] text-gray-400 font-bold block">{isArabic ? 'ملاحظات وتفاصيل الخامات' : 'Material Detail Notes'}</label>
                  <textarea 
                    rows={2} placeholder={isArabic ? 'مثال: قطن مصري 100% ممتاز معالج ضد الانكماش والوبر' : 'e.g. 100% Premium Egyptian cotton with shrink treatment'}
                    value={notes} onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs focus:outline-none text-white placeholder-gray-600"
                  />
                </div>
              </div>

              {/* DYNAMIC VARIANT MATRIX GENERATION MODULE */}
              <div className="border-b border-gray-800 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                  <h4 className="text-sm font-bold text-pink-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-pink-400" />
                    {isArabic ? 'مصفوفة المقاسات والألوان (Apparel Variant Builder)' : 'Dynamic Variant Attributes Matrix'}
                  </h4>
                  <button
                    type="button"
                    onClick={handleGenerateVariantGrid}
                    className="px-3.5 py-1.5 rounded-xl text-[10px] font-black bg-pink-600 hover:bg-pink-700 text-white shadow shadow-pink-600/15 cursor-pointer self-start"
                    id="generate-variants-trigger-btn"
                  >
                    {isArabic ? 'توليد وتحديث مصفوفة الموديلات' : 'Compile Sizes x Colors Grid'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-xs text-gray-400">
                  <div>
                    <label className="block font-bold mb-1">{isArabic ? 'المقاسات المطلوبة (مفصولة بفواصل)' : 'Required sizes (comma separated)'}</label>
                    <input 
                      type="text" value={rawSizes} onChange={(e) => setRawSizes(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                      placeholder="e.g. S,M,L,XL,XXL or 30,32,34,36"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">{isArabic ? 'الألوان المطلوبة (مفصولة بفواصل)' : 'Required colors (comma separated)'}</label>
                    <input 
                      type="text" value={rawColors} onChange={(e) => setRawColors(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      placeholder="e.g. أبيض,أسود,أزرق داكن"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">{isArabic ? 'الكمية الابتدائية الافتراضية للموديل' : 'Default Initial Qty for Compiled SKUs'}</label>
                    <input 
                      type="number" min="0" value={defaultVariantQty} onChange={(e) => setDefaultVariantQty(Number(e.target.value))}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Generated list with editable individual stock levels */}
                {tempVariants.length > 0 && (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1 border border-gray-800 p-3 rounded-2xl bg-black/25">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-800/60">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">
                        {isArabic ? 'جدول توزيع مخزون المتغيرات والباركود' : 'Varying Stock Allocations per SKU'}
                      </span>
                      <button
                        type="button"
                        onClick={handleApplyQtyToAll}
                        className="px-2.5 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-[9px] font-extrabold cursor-pointer transition-all self-start sm:self-auto"
                      >
                        {isArabic ? `تطبيق الكمية (${defaultVariantQty}) على كل المتغيرات` : `Apply (${defaultVariantQty}) to all SKUs`}
                      </button>
                    </div>
                    <div className="grid grid-cols-12 gap-2 text-[10px] text-gray-500 font-extrabold pb-1 border-b border-gray-800 px-2 uppercase pt-1">
                      <div className="col-span-3">{isArabic ? 'اللون / المقاس' : 'Variant'}</div>
                      <div className="col-span-2 text-center">{isArabic ? 'الكمية الافتتاحية' : 'Qty'}</div>
                      <div className="col-span-3 text-center">{isArabic ? 'الباركود المستقل' : 'Variant Barcode'}</div>
                      <div className="col-span-4 text-center">{isArabic ? 'رمز SKU المخزني' : 'SKU Code'}</div>
                    </div>

                    {tempVariants.map((v) => (
                      <div key={v.id} className="grid grid-cols-12 gap-2 items-center py-1.5 px-2 bg-gray-900/40 rounded-xl text-xs text-gray-300">
                        <div className="col-span-3 flex items-center gap-2">
                          <span style={{ backgroundColor: v.colorHex || '#FFF' }} className="w-3 h-3 rounded-full border border-gray-800 shrink-0" />
                          <span className="font-sans font-bold">{v.color} - <strong className="text-white font-mono">{v.size}</strong></span>
                        </div>
                        
                        <div className="col-span-2 text-center">
                          <input 
                            type="number" min="0"
                            value={v.quantity} onChange={(e) => handleUpdateTempVariantQty(v.id, Number(e.target.value))}
                            className="w-full bg-gray-950 border border-gray-800 rounded p-1 text-center font-mono text-white text-xs"
                          />
                        </div>

                        <div className="col-span-3 text-center">
                          <input 
                            type="text"
                            value={v.barcode} onChange={(e) => handleUpdateTempVariantBarcode(v.id, e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded p-1 text-center font-mono text-white text-[10px]"
                          />
                        </div>

                        <div className="col-span-4 text-center">
                          <input 
                            type="text"
                            value={v.sku} onChange={(e) => handleUpdateTempVariantSKU(v.id, e.target.value)}
                            className="w-full bg-gray-950 border border-gray-800 rounded p-1 text-center font-mono text-white text-[10px]"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Controls Footer */}
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs cursor-pointer"
                  id="cancel-product-form-button"
                >
                  {isArabic ? 'إلغاء والتراجع' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md"
                  id="save-product-form-button"
                >
                  {isArabic ? 'حفظ البيانات بالكامل في الكتالوج' : 'Save Catalog Apparel'}
                </button>
              </div>

            </form>
          </motion.div>
        ) : (
          /* GRID LIST: CLOTHES CATALOG LIST */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            id="products-catalog-grid-display"
          >
            {products.length === 0 ? (
              <div className="col-span-full py-16 text-center border border-dashed border-gray-800 rounded-3xl p-6 text-gray-500">
                <Shirt className="w-12 h-12 mx-auto text-gray-700 animate-bounce" />
                <p className="text-sm font-bold mt-3">{isArabic ? 'لم يتم العثور على أي ملابس مسجلة بالدليل.' : 'No apparel products registered yet.'}</p>
              </div>
            ) : (
              products.map((p) => {
                // Compute total pieces across all variants
                const totalPieces = p.variants.reduce((acc, curr) => acc + curr.quantity, 0);

                return (
                  <div 
                    key={p.id}
                    className="p-4 rounded-3xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl flex flex-col justify-between"
                  >
                    <div>
                      {/* Styled Info Badge Frame instead of Image */}
                      <div className="relative rounded-2xl p-4 bg-gray-950 mb-3 border border-gray-800/40 flex flex-col justify-between h-28 overflow-hidden">
                        <div className="flex items-center justify-between z-10">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 text-[10px] font-extrabold uppercase tracking-widest border border-indigo-500/20">
                            {p.brand}
                          </span>
                          {p.discount > 0 && (
                            <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black font-mono">
                              {p.discount}% OFF
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-end z-10">
                          <span className="text-[10px] text-gray-400 font-extrabold uppercase">
                            {p.season === 'Summer' && (isArabic ? 'صيفي ☀️' : 'Summer ☀️')}
                            {p.season === 'Winter' && (isArabic ? 'شتوي ❄️' : 'Winter ❄️')}
                            {p.season === 'Spring' && (isArabic ? 'ربيعي 🌸' : 'Spring 🌸')}
                            {p.season === 'Autumn' && (isArabic ? 'خريفي 🍂' : 'Autumn 🍂')}
                            {p.season === 'All Seasons' && (isArabic ? 'كل الفصول 🔄' : 'All Seasons 🔄')}
                          </span>
                          <span className="text-[10px] bg-gray-900 border border-white/5 text-gray-300 font-bold rounded px-2 py-0.5 font-mono">
                            {totalPieces} {isArabic ? 'قطعة بالمخزن' : 'pcs in stock'}
                          </span>
                        </div>
                        {/* Decorative background grid element to look premium */}
                        <div className="absolute right-[-10px] bottom-[-10px] opacity-10 text-gray-400">
                          <Shirt className="w-20 h-20" />
                        </div>
                      </div>

                      {/* Header Specs */}
                      <div>
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                          {p.category} • {p.type === 'mens' ? (isArabic ? 'رجالي' : 'Mens') : p.type === 'womens' ? (isArabic ? 'حريمي' : 'Womens') : (isArabic ? 'أطفال' : 'Kids')}
                        </span>
                        <h4 className="font-extrabold text-white text-sm line-clamp-1 truncate mt-0.5">{p.name}</h4>
                      </div>

                      {/* Variants capsule bubbles */}
                      <div className="mt-3.5 space-y-1">
                        <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-widest block">
                          {isArabic ? 'المقاسات والألوان المتاحة بالمخزن:' : 'AVAILABLE VARIANTS MATRIX:'}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {p.variants.map((v) => (
                            <span 
                              key={v.id} 
                              className={`px-1.5 py-0.5 rounded border text-[9px] font-mono font-bold flex items-center gap-1 ${
                                v.quantity <= 0 
                                  ? 'bg-rose-500/5 text-rose-400 border-rose-500/10' 
                                  : v.quantity <= p.stockAlertLevel 
                                    ? 'bg-amber-500/5 text-amber-400 border-amber-500/10' 
                                    : 'bg-gray-800 text-gray-300 border-gray-700/80'
                              }`}
                            >
                              <span style={{ backgroundColor: v.colorHex }} className="w-1.5 h-1.5 rounded-full border border-gray-900 shrink-0" />
                              <span>{v.size}:</span>
                              <span>{v.quantity}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Footer Prices & Actions */}
                    <div className="mt-5 border-t border-gray-800/40 pt-3.5 flex items-center justify-between text-xs">
                      <div className="grid grid-cols-2 gap-x-4">
                        <div>
                          <span className="text-[9px] text-gray-500 block">{isArabic ? 'قطاعي (مفرد)' : 'Retail Price'}</span>
                          <span className="font-extrabold text-white font-sans">{formatCurrency(p.sellingPrice * (1 - p.discount / 100))}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-500 block">{isArabic ? 'سعر جملة' : 'Wholesale'}</span>
                          <span className="font-bold text-indigo-300 font-sans">{formatCurrency(p.wholesalePrice || p.sellingPrice)}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditClick(p)}
                          className="p-2 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 cursor-pointer"
                          title={isArabic ? 'تعديل هذا المنتج ومتغيراته' : 'Edit Apparel model'}
                          id={`edit-apparel-${p.id}`}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(isArabic ? 'هل أنت متأكد من حذف هذا الموديل نهائياً من النظام ومسح متغيراته؟' : 'Are you sure you want to delete this apparel model?')) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 cursor-pointer"
                          title={isArabic ? 'حذف المنتج' : 'Delete product'}
                          id={`delete-apparel-${p.id}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
