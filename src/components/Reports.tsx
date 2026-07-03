import React, { useState, useMemo } from 'react';
import { Sale, Product, Expense, StoreSettings, User } from '../types';
import { getLocalDateString } from '../utils';
import { 
  BarChart3, Landmark, TrendingUp, DollarSign, Wallet, 
  Layers, Plus, Trash2, Calendar, FileSpreadsheet, PieChart
} from 'lucide-react';
import { motion } from 'motion/react';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  expenses: Expense[];
  settings: StoreSettings;
  currentUser: User;
  onAddExpense: (newExp: Expense) => void;
  onDeleteExpense: (expId: string) => void;
  isArabic: boolean;
}

export default function Reports({
  sales,
  products,
  expenses,
  settings,
  currentUser,
  onAddExpense,
  onDeleteExpense,
  isArabic
}: ReportsProps) {
  // Expense registration form states
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('إيجار');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseNotes, setExpenseNotes] = useState('');

  // 1. Core KPIs
  const totalRevenue = useMemo(() => {
    return sales.reduce((acc, curr) => acc + curr.total, 0);
  }, [sales]);

  const totalInvoicesCount = sales.length;

  const averageInvoiceValue = useMemo(() => {
    if (sales.length === 0) return 0;
    return totalRevenue / sales.length;
  }, [totalRevenue, sales]);

  const totalCostOfGoodsSold = useMemo(() => {
    return sales.reduce((acc, sale) => {
      return acc + sale.items.reduce((itemAcc, item) => itemAcc + (item.purchasePrice * item.quantity), 0);
    }, 0);
  }, [sales]);

  const totalOperatingExpenses = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses]);

  const rawGrossProfits = totalRevenue - totalCostOfGoodsSold;
  const netEarnings = rawGrossProfits - totalOperatingExpenses;

  // Wholesale vs Retail stats
  const salesTypeStats = useMemo(() => {
    let retailTotal = 0;
    let wholesaleTotal = 0;
    let retailInvoices = 0;
    let wholesaleInvoices = 0;

    sales.forEach(s => {
      if (s.saleType === 'wholesale') {
        wholesaleTotal += s.total;
        wholesaleInvoices += 1;
      } else {
        retailTotal += s.total;
        retailInvoices += 1;
      }
    });

    const totalStats = retailTotal + wholesaleTotal;
    const retailPercentage = totalStats > 0 ? Math.round((retailTotal / totalStats) * 100) : 0;
    const wholesalePercentage = totalStats > 0 ? Math.round((wholesaleTotal / totalStats) * 100) : 0;

    return {
      retailTotal,
      wholesaleTotal,
      retailInvoices,
      wholesaleInvoices,
      retailPercentage,
      wholesalePercentage
    };
  }, [sales]);

  // 2. Sizewise breakdown
  const sizeBreakdown = useMemo(() => {
    const counts: Record<string, number> = { 'S': 0, 'M': 0, 'L': 0, 'XL': 0, 'XXL': 0, 'Other': 0 };
    sales.forEach(sale => {
      sale.items.forEach(it => {
        const sz = it.size.toUpperCase();
        if (sz.startsWith('S')) counts['S'] += it.quantity;
        else if (sz.startsWith('M')) counts['M'] += it.quantity;
        else if (sz.startsWith('L')) counts['L'] += it.quantity;
        else if (sz.startsWith('XL')) counts['XL'] += it.quantity;
        else if (sz.startsWith('XXL') || sz.includes('2XL') || sz.includes('36')) counts['XXL'] += it.quantity;
        else counts['Other'] += it.quantity;
      });
    });
    return counts;
  }, [sales]);

  // 3. Colorwise breakdown
  const colorBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    sales.forEach(sale => {
      sale.items.forEach(it => {
        const col = it.color;
        counts[col] = (counts[col] || 0) + it.quantity;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5); // top 5 colors
  }, [sales]);

  // 4. Brand performance
  const brandBreakdown = useMemo(() => {
    const rev: Record<string, number> = {};
    sales.forEach(sale => {
      sale.items.forEach(it => {
        const brand = it.brand || 'Other';
        rev[brand] = (rev[brand] || 0) + it.subtotal;
      });
    });
    return Object.entries(rev).sort((a,b) => b[1] - a[1]);
  }, [sales]);

  // 5. Daily sales for last 7 days SVG chart
  const last7DaysSales = useMemo(() => {
    const chartData: { label: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateString(d);
      const dailySum = sales
        .filter(s => s.date.startsWith(dateStr))
        .reduce((sum, curr) => sum + curr.total, 0);

      const dayNamesAr = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
      const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      chartData.push({
        label: isArabic ? dayNamesAr[d.getDay()] : dayNamesEn[d.getDay()],
        amount: dailySum
      });
    }
    return chartData;
  }, [sales, isArabic]);

  // Max value in last 7 days to scale SVG graph correctly
  const max7DayVal = useMemo(() => {
    const maxVal = Math.max(...last7DaysSales.map(d => d.amount));
    return maxVal > 0 ? maxVal : 1000;
  }, [last7DaysSales]);

  // Expense submission
  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle || expenseAmount <= 0) return;

    const newExp: Expense = {
      id: `e_${Date.now()}`,
      title: expenseTitle,
      category: expenseCategory,
      amount: expenseAmount,
      date: new Date().toISOString().split('T')[0],
      notes: expenseNotes || (isArabic ? 'مصاريف تشغيلية للمحل' : 'Store operational expense')
    };

    onAddExpense(newExp);

    setExpenseTitle('');
    setExpenseAmount(0);
    setExpenseNotes('');
    setShowExpenseForm(false);
  };

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString(isArabic ? 'ar-EG' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ${isArabic ? 'ج.م' : 'EGP'}`;
  };

  return (
    <div className="space-y-6" id="reports-tab-root">
      
      {/* Financial Overview Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="reports-metrics-cards">
        
        {/* KPI 1: Gross Revenue */}
        <div className="p-5 rounded-2xl bg-gray-900/35 border border-white/5 backdrop-blur-md flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold block uppercase">{isArabic ? 'إجمالي المبيعات التاريخية' : 'Lifetime gross sales'}</span>
            <h3 className="text-lg font-black text-indigo-400 font-sans">{formatCurrency(totalRevenue)}</h3>
            <span className="text-[9px] text-gray-500 font-medium">
              {isArabic ? `متوسط التذكرة: ${formatCurrency(averageInvoiceValue)}` : `Average Ticket: ${formatCurrency(averageInvoiceValue)}`}
            </span>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
            <DollarSign className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* KPI 2: Cost of Goods Sold */}
        <div className="p-5 rounded-2xl bg-gray-900/35 border border-white/5 backdrop-blur-md flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold block uppercase">{isArabic ? 'تكلفة المبيعات (رأس المال)' : 'Cost of apparel sold'}</span>
            <h3 className="text-lg font-black text-rose-400 font-sans">{formatCurrency(totalCostOfGoodsSold)}</h3>
            <span className="text-[9px] text-gray-500 font-medium">
              {isArabic ? `هامش الربح الإجمالي: ${formatCurrency(rawGrossProfits)}` : `Gross Margin: ${formatCurrency(rawGrossProfits)}`}
            </span>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 3: Operational Expenses */}
        <div className="p-5 rounded-2xl bg-gray-900/35 border border-white/5 backdrop-blur-md flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold block uppercase">{isArabic ? 'المصاريف التشغيلية للمحل' : 'Operational Expenses'}</span>
            <h3 className="text-lg font-black text-amber-500 font-sans">{formatCurrency(totalOperatingExpenses)}</h3>
            <span className="text-[9px] text-gray-500 font-medium">
              {isArabic ? `${expenses.length} فواتير مصروفات مسجلة` : `${expenses.length} expense tickets saved`}
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* KPI 4: Net Profit margin */}
        <div className="p-5 rounded-2xl bg-gray-900/35 border border-white/5 backdrop-blur-md flex items-center justify-between shadow-xl">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold block uppercase">{isArabic ? 'صافي الأرباح التشغيلية' : 'Store Net Profits'}</span>
            <h3 className={`text-lg font-black font-sans ${netEarnings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {formatCurrency(netEarnings)}
            </h3>
            <span className="text-[9px] text-gray-500 font-medium">
              {isArabic ? 'بعد حساب تكلفة البضاعة والمصاريف' : 'Earnings after all deductions'}
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Landmark className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* SVG Daily sales and sizes split Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SVG CHART 1: 7 Day Revenue trend (8 Cols) */}
        <div className="lg:col-span-8 p-6 rounded-3xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl space-y-4">
          <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
            <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0" />
            {isArabic ? 'مخطط اتجاه المبيعات في آخر 7 أيام' : 'Daily sales trend over last 7 days'}
          </h4>

          {/* Render interactive SVG graph bar chart */}
          <div className="pt-6 relative" id="daily-sales-svg-chart">
            <svg viewBox="0 0 600 240" className="w-full h-64 overflow-visible font-sans select-none">
              
              {/* Horizontal Grid lines */}
              <line x1="50" y1="30" x2="570" y2="30" stroke="#1F2937" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="50" y1="80" x2="570" y2="80" stroke="#1F2937" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="50" y1="130" x2="570" y2="130" stroke="#1F2937" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="50" y1="180" x2="570" y2="180" stroke="#1F2937" strokeWidth="1" strokeDasharray="4 4" />
              
              {/* Axis Bottom */}
              <line x1="50" y1="200" x2="570" y2="200" stroke="#4B5563" strokeWidth="1.5" />

              {/* Y-Axis scale label counts */}
              <text x="15" y="35" fill="#9CA3AF" className="text-[9px] font-mono">{(max7DayVal).toFixed(0)}</text>
              <text x="15" y="115" fill="#9CA3AF" className="text-[9px] font-mono">{(max7DayVal / 2).toFixed(0)}</text>
              <text x="25" y="195" fill="#9CA3AF" className="text-[9px] font-mono">0</text>

              {/* DRAW CHANNELS BARS */}
              {last7DaysSales.map((dataObj, idx) => {
                const barWidth = 36;
                const gap = 38;
                const xPos = 65 + (idx * (barWidth + gap));
                
                // Scale bar height to fit the 170px space (from Y=30 to Y=200)
                const rawHeight = (dataObj.amount / max7DayVal) * 160;
                const barHeight = rawHeight > 5 ? rawHeight : 5; // minimum visibility height
                const yPos = 200 - barHeight;

                return (
                  <g key={idx} className="group cursor-pointer">
                    {/* Hover Glow box background */}
                    <rect 
                      x={xPos - 8} 
                      y="15" 
                      width={barWidth + 16} 
                      height="210" 
                      fill="transparent" 
                      className="hover:fill-white/5 rounded-xl transition-all" 
                    />
                    
                    {/* Visual bar with premium indigo gradient */}
                    <rect 
                      x={xPos} 
                      y={yPos} 
                      width={barWidth} 
                      height={barHeight} 
                      rx="6" 
                      fill="url(#indigoGrad)" 
                      className="group-hover:fill-indigo-400 transition-all"
                    />

                    {/* Numeric amount indicator text */}
                    <text 
                      x={xPos + (barWidth / 2)} 
                      y={yPos - 8} 
                      textAnchor="middle" 
                      fill="#FFFFFF" 
                      className="text-[9px] font-black font-mono opacity-0 group-hover:opacity-100 transition-all bg-black"
                    >
                      {dataObj.amount.toFixed(0)}
                    </text>

                    {/* X-Axis bottom Day label */}
                    <text 
                      x={xPos + (barWidth / 2)} 
                      y="218" 
                      textAnchor="middle" 
                      fill="#9CA3AF" 
                      className="text-[9px] font-semibold"
                    >
                      {dataObj.label}
                    </text>
                  </g>
                );
              })}

              {/* Define linear gradient fill */}
              <defs>
                <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366F1" />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.4" />
                </linearGradient>
              </defs>

            </svg>
          </div>
        </div>

        {/* SVG CHART 2: Sizes distribution (4 Cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl space-y-4">
          <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
            <PieChart className="w-4 h-4 text-pink-400 shrink-0" />
            {isArabic ? 'توزيع مبيعات الملابس بحسب المقاس' : 'Sizes Sales Distribution Ratio'}
          </h4>

          {/* Horizontal progress visualization */}
          <div className="space-y-4 pt-3 text-xs" id="sizes-percentage-distribution">
            {Object.entries(sizeBreakdown).map(([szName, count]) => {
              const totalItemsCount = (Object.values(sizeBreakdown) as number[]).reduce((a: number, b: number) => a + b, 0);
              const countNum = count as number;
              const percentage = totalItemsCount > 0 ? Math.round((countNum / totalItemsCount) * 100) : 0;

              return (
                <div key={szName} className="space-y-1.5">
                  <div className="flex justify-between font-bold text-gray-300">
                    <span className="font-mono text-sm">{szName} Size</span>
                    <span className="font-mono text-gray-500">{count} {isArabic ? 'وحدات' : 'items'} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-950 h-2 rounded-full border border-gray-850 overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* WHOLESALE VS RETAIL SALES RATIO WIDGET */}
      <div className="p-6 rounded-3xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            {isArabic ? 'تحليلات قنوات البيع: الجملة مقابل القطاعي' : 'Wholesale vs Retail Sales Analytics'}
          </h4>
          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-md font-bold">
            {isArabic ? 'تقسيم إيرادات القنوات' : 'Channel Revenue Split'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Retail sales card */}
          <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/10 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-indigo-400 font-bold uppercase block">{isArabic ? 'مبيعات التجزئة (القطاعي)' : 'Retail Sales (Single units)'}</span>
              <h3 className="text-xl font-black text-white font-sans">{formatCurrency(salesTypeStats.retailTotal)}</h3>
              <p className="text-[10px] text-gray-500">
                {isArabic ? `عدد الفواتير القطاعي: ${salesTypeStats.retailInvoices}` : `Retail Invoices: ${salesTypeStats.retailInvoices}`}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-indigo-400 font-mono">{salesTypeStats.retailPercentage}%</span>
              <span className="text-[8px] text-gray-500 block uppercase font-bold">{isArabic ? 'من المبيعات' : 'of total'}</span>
            </div>
          </div>

          {/* Wholesale sales card */}
          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/10 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-amber-400 font-bold uppercase block">{isArabic ? 'مبيعات الجملة' : 'Wholesale Sales (Bulk prices)'}</span>
              <h3 className="text-xl font-black text-white font-sans">{formatCurrency(salesTypeStats.wholesaleTotal)}</h3>
              <p className="text-[10px] text-gray-500">
                {isArabic ? `عدد الفواتير الجملة: ${salesTypeStats.wholesaleInvoices}` : `Wholesale Invoices: ${salesTypeStats.wholesaleInvoices}`}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-amber-400 font-mono">{salesTypeStats.wholesalePercentage}%</span>
              <span className="text-[8px] text-gray-500 block uppercase font-bold">{isArabic ? 'من المبيعات' : 'of total'}</span>
            </div>
          </div>
        </div>

        {/* Visual progress comparison bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[10px] font-bold text-gray-400 font-sans">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> {isArabic ? 'قطاعي (تجزئة)' : 'Retail'} ({salesTypeStats.retailPercentage}%)</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {isArabic ? 'جملة' : 'Wholesale'} ({salesTypeStats.wholesalePercentage}%)</span>
          </div>
          <div className="w-full bg-gray-950 h-3 rounded-full border border-gray-800 overflow-hidden flex">
            <div 
              className="bg-indigo-600 h-full transition-all duration-500" 
              style={{ width: `${salesTypeStats.retailPercentage}%` }}
            />
            <div 
              className="bg-amber-600 h-full transition-all duration-500" 
              style={{ width: `${salesTypeStats.wholesalePercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Colors & Brands performance row split */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Colors hotness list */}
        <div className="p-6 rounded-3xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl space-y-4">
          <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase border-b border-gray-800 pb-2.5">
            {isArabic ? 'أكثر الألوان مبيعاً ورواجاً بالمحل' : 'Most Popular colors sold'}
          </h4>
          <div className="space-y-3">
            {colorBreakdown.length === 0 ? (
              <div className="text-center py-8 text-gray-500 font-semibold">{isArabic ? 'سيرد هنا توزيع الألوان بعد إجراء المبيعات' : 'Colors statistics empty'}</div>
            ) : (
              colorBreakdown.map(([colorName, qty], idx) => (
                <div key={idx} className="flex items-center justify-between text-xs font-sans text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full border border-gray-800" style={{ backgroundColor: '#FFF' }} />
                    <span className="font-bold">{colorName}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-mono font-bold text-[10px]">
                    {qty} {isArabic ? 'قطع مباعة' : 'Units sold'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Brand performance list */}
        <div className="p-6 rounded-3xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl space-y-4">
          <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase border-b border-gray-800 pb-2.5">
            {isArabic ? 'مبيعات العلامات التجارية والبراندات' : 'Brand Revenue Performance'}
          </h4>
          <div className="space-y-3">
            {brandBreakdown.length === 0 ? (
              <div className="text-center py-8 text-gray-500 font-semibold">{isArabic ? 'سيتم تصنيف مبيعات البراندات فور إصدار فواتير' : 'Brands statistics empty'}</div>
            ) : (
              brandBreakdown.map(([brandName, rev], idx) => (
                <div key={idx} className="flex items-center justify-between text-xs text-gray-300">
                  <span className="font-bold">{brandName}</span>
                  <span className="font-bold text-emerald-400 font-sans">{formatCurrency(rev)}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* OPERATIONAL EXPENSES LOGS & FORM (100% complete) */}
      <div className="p-6 rounded-3xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl space-y-5">
        
        {/* Header with trigger button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
          <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
            <Wallet className="w-4 h-4 text-amber-500 shrink-0" />
            {isArabic ? 'بيان ومصروفات المحل التشغيلية' : 'Store operational expenses schedule'}
          </h4>

          {!showExpenseForm && (
            <button
              onClick={() => setShowExpenseForm(true)}
              className="px-3 py-1.5 rounded-xl text-[10px] font-black bg-indigo-600 hover:bg-indigo-700 text-white shadow cursor-pointer flex items-center gap-1 self-start"
              id="show-expense-form-btn"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isArabic ? 'تسجيل سند صرف مصروفات' : 'Log Store Expense'}</span>
            </button>
          )}
        </div>

        {/* Expense form inline slide */}
        {showExpenseForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="p-4 border border-indigo-500/20 bg-gray-950/45 rounded-2xl"
            id="expense-form"
          >
            <form onSubmit={handleAddExpenseSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'بيان المصروف' : 'Expense Title'}</label>
                <input 
                  type="text" required placeholder={isArabic ? 'مثال: فاتورة كهرباء وتكييف' : 'e.g. electric bill'}
                  value={expenseTitle} onChange={(e) => setExpenseTitle(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'التصنيف الباب' : 'Expense Category'}</label>
                <select
                  value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="إيجار">{isArabic ? 'إيجار' : 'Rent'}</option>
                  <option value="مرافق">{isArabic ? 'مرافق وكهرباء' : 'Utility'}</option>
                  <option value="تعبئة وتغليف">{isArabic ? 'تعبئة وتغليف' : 'Packaging'}</option>
                  <option value="مرتبات">{isArabic ? 'مرتبات وعمالة' : 'Salaries'}</option>
                  <option value="أخرى">{isArabic ? 'مصاريف ترويجية وأخرى' : 'Other'}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'مبلغ الصرف الفعلي (ج.م)' : 'Paid Amount (EGP)'}</label>
                <input 
                  type="number" min="1" required
                  value={expenseAmount || ''} onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              <div className="space-y-1 flex items-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowExpenseForm(false)}
                  className="py-2 px-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-[10px]"
                >
                  {isArabic ? 'تراجع' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[10px] shadow"
                  id="expense-submit-btn"
                >
                  {isArabic ? 'تسجيل الصرف' : 'Commit Expense'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Expenses List */}
        <div className="overflow-x-auto max-h-56">
          <table className="w-full text-xs text-left rtl:text-right" id="expenses-table">
            <thead>
              <tr className="border-b border-gray-800 text-gray-500 font-extrabold text-[9px] uppercase tracking-wider">
                <th className="py-2 px-3">{isArabic ? 'التاريخ' : 'Date'}</th>
                <th className="py-2 px-3">{isArabic ? 'بيان المصروف' : 'Expense line'}</th>
                <th className="py-2 px-3">{isArabic ? 'التصنيف' : 'Category'}</th>
                <th className="py-2 px-3 font-mono">{isArabic ? 'المبلغ' : 'Amount'}</th>
                <th className="py-2 px-3 text-center">{isArabic ? 'حذف' : 'Delete'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/40 text-gray-300 font-sans">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500 font-bold">
                    {isArabic ? 'لم يتم تسجيل أي سندات صرف مصروفات حاليًا' : 'No expenses recorded yet'}
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-800/20 transition-all">
                    <td className="py-2.5 px-3 text-gray-500 font-mono">{exp.date}</td>
                    <td className="py-2.5 px-3 font-bold text-white">{exp.title}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 font-bold text-[9px]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-rose-400 font-sans">{formatCurrency(exp.amount)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-1 rounded-lg bg-gray-900 border border-gray-800 text-gray-500 hover:text-rose-400 cursor-pointer"
                        id={`del-expense-btn-${exp.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
