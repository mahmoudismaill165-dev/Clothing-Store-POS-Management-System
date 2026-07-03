import React, { useState } from 'react';
import { Customer, Sale, StoreSettings, User } from '../types';
import { 
  Users, Plus, Trash2, Phone, MapPin, BadgePercent, 
  ShoppingBag, Search, Eye, Award, CalendarClock
} from 'lucide-react';
import { motion } from 'motion/react';

interface CustomersProps {
  customers: Customer[];
  sales: Sale[];
  settings: StoreSettings;
  currentUser: User;
  onAddCustomer: (newCust: Customer) => void;
  isArabic: boolean;
}

export default function Customers({
  customers,
  sales,
  settings,
  currentUser,
  onAddCustomer,
  isArabic
}: CustomersProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const newCust: Customer = {
      id: `c_${Date.now()}`,
      name,
      phone,
      address: address || (isArabic ? 'العنوان غير محدد' : 'Address Not Specified'),
      ordersCount: 0,
      totalSpent: 0,
      loyaltyPoints: 0
    };

    onAddCustomer(newCust);
    setName('');
    setPhone('');
    setAddress('');
    setShowAddForm(false);
  };

  // Filter customers based on search query
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get purchases for active detailed customer
  const customerSales = selectedCustomer 
    ? sales.filter(s => s.customerId === selectedCustomer.id)
    : [];

  const formatCurrency = (val: number) => {
    return `${val.toLocaleString(isArabic ? 'ar-EG' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${isArabic ? 'ج.م' : 'EGP'}`;
  };

  return (
    <div className="space-y-6" id="customers-tab-root">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            {isArabic ? 'إدارة العملاء ونظام نقاط الولاء والـ CRM' : 'Customers CRM & Loyalty Workspace'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {isArabic 
              ? 'تتبع قيمة مشتريات العملاء، تجميع نقاط الخصم، ومراجعة سجلات الفواتير التاريخية لتقديم عروض مخصصة.' 
              : 'Monitor customer lifetime value, manage points ledger, and retrieve previous transaction logs.'}
          </p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white transition-all cursor-pointer shadow-md flex items-center gap-1.5 self-start"
            id="add-new-customer-button"
          >
            <Plus className="w-4 h-4" />
            <span>{isArabic ? 'تسجيل عميل جديد' : 'Register New Customer'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: Customers List & Search (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Quick Add New Customer Form Panel inline */}
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-3xl bg-gray-900/35 border border-indigo-500/10 backdrop-blur-md shadow-xl"
              id="customer-add-form"
            >
              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-gray-800">
                  <span className="font-extrabold text-indigo-400">{isArabic ? 'نموذج تسجيل عميل ملابس جديد' : 'Register Customer Details'}</span>
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)}
                    className="p-1 rounded-lg bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'الاسم بالكامل' : 'Full Name'}</label>
                    <input 
                      type="text" required placeholder={isArabic ? 'مثال: كريم ممدوح' : 'Full Name'}
                      value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/50 focus:outline-none text-white placeholder-gray-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'رقم الهاتف المحمول' : 'Phone Number'}</label>
                    <input 
                      type="text" required placeholder="01011223344"
                      value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/50 focus:outline-none text-white placeholder-gray-600 font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 font-bold block">{isArabic ? 'مقر السكن / العنوان' : 'Living Address'}</label>
                    <input 
                      type="text" placeholder={isArabic ? 'مثال: مصر الجديدة، القاهرة' : 'Address'}
                      value={address} onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-500/50 focus:outline-none text-white placeholder-gray-600"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3.5 py-1.5 bg-gray-800 text-gray-300 rounded-lg font-bold"
                  >
                    {isArabic ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 bg-indigo-600 text-white rounded-lg font-bold shadow-md cursor-pointer"
                  >
                    {isArabic ? 'تسجيل العميل' : 'Register'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* CRM List Panel */}
          <div className="p-6 rounded-3xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl space-y-4">
            
            {/* Search Input bar */}
            <div className="relative max-w-sm w-full">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text"
                placeholder={isArabic ? 'ابحث باسم العميل أو رقم الهاتف...' : 'Search customer by name, phone...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-gray-950/60 border border-gray-800 text-white placeholder-gray-500"
                id="crm-search-input"
              />
            </div>

            {/* Customers Data Grid Table */}
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-xs text-left rtl:text-right" id="customers-table">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 font-extrabold text-[9px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">{isArabic ? 'العميل' : 'Customer name'}</th>
                    <th className="py-2.5 px-3">{isArabic ? 'رقم الهاتف' : 'Contact Phone'}</th>
                    <th className="py-2.5 px-3">{isArabic ? 'عدد المشتريات' : 'Orders count'}</th>
                    <th className="py-2.5 px-3">{isArabic ? 'إجمالي المدفوعات' : 'Total spent'}</th>
                    <th className="py-2.5 px-3">{isArabic ? 'نقاط الولاء' : 'Loyalty points'}</th>
                    <th className="py-2.5 px-3 text-center">{isArabic ? 'تفاصيل' : 'History'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40 text-gray-300 font-sans">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-500 font-bold">
                        {isArabic ? 'لم يتم العثور على عملاء مطابقين للبحث.' : 'No customer matched your search.'}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust) => (
                      <tr 
                        key={cust.id} 
                        className={`hover:bg-gray-800/20 transition-all ${
                          selectedCustomer?.id === cust.id ? 'bg-indigo-500/5 border-l-2 border-indigo-500' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <span className="font-bold text-white block">{cust.name}</span>
                          <span className="text-[9px] text-gray-500 block truncate max-w-[150px]">{cust.address}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-gray-400">{cust.phone}</td>
                        <td className="py-3 px-3 font-mono font-bold text-center text-white">{cust.ordersCount}</td>
                        <td className="py-3 px-3 font-bold text-emerald-400">{formatCurrency(cust.totalSpent)}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-black font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                            <Award className="w-3.5 h-3.5 shrink-0" />
                            {cust.loyaltyPoints} {isArabic ? 'نقطة' : 'PTS'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => setSelectedCustomer(cust)}
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-indigo-400 cursor-pointer"
                            id={`view-cust-btn-${cust.id}`}
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

        </div>

        {/* Right column: Selected Customer Purchases & Insights (4 Cols) */}
        <div className="lg:col-span-4">
          <div className="p-6 rounded-3xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl h-full flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase border-b border-gray-800 pb-2">
                <CalendarClock className="w-4 h-4 text-emerald-400 animate-pulse" />
                {isArabic ? 'تاريخ مشتريات العميل بالتفصيل' : 'Purchase history detailed'}
              </h4>

              {selectedCustomer ? (
                <div className="space-y-4 text-xs">
                  {/* Quick Profile Overview */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-gray-500 font-bold block uppercase">{isArabic ? 'اسم العميل المختار:' : 'Auditing Profile:'}</span>
                    <h5 className="font-black text-white text-sm">{selectedCustomer.name}</h5>
                    <div className="text-[10px] text-gray-400 space-y-0.5 pt-1">
                      <div className="flex items-center gap-1"><Phone className="w-3 h-3 text-gray-500" /> <span>{selectedCustomer.phone}</span></div>
                      <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-500" /> <span className="truncate max-w-[200px]">{selectedCustomer.address}</span></div>
                    </div>
                  </div>

                  {/* Orders history list */}
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    <span className="text-[9px] text-gray-500 font-extrabold block uppercase">
                      {isArabic ? 'الفواتير المستخرجة للعميل:' : 'REVENUE INVOICES ATTACHED:'}
                    </span>

                    {customerSales.length === 0 ? (
                      <div className="py-12 text-center text-gray-600 font-bold bg-black/10 rounded-2xl border border-dashed border-gray-800">
                        {isArabic ? 'لا توجد فواتير مرتبطة بهذا العميل' : 'No invoices associated'}
                      </div>
                    ) : (
                      customerSales.map((sale) => (
                        <div 
                          key={sale.id}
                          className="p-3 bg-gray-950/60 border border-gray-800 hover:border-gray-750 rounded-xl space-y-1"
                        >
                          <div className="flex justify-between font-mono font-bold text-[11px]">
                            <span className="text-white">{sale.invoiceNumber}</span>
                            <span className="text-emerald-400">{formatCurrency(sale.total)}</span>
                          </div>
                          <div className="flex justify-between text-[9px] text-gray-500">
                            <span>{sale.date.split(' ')[0]}</span>
                            <span>{sale.items.length} {isArabic ? 'منتجات' : 'items'} • {sale.paymentMethod}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-20 text-center text-gray-500 font-bold border border-dashed border-gray-800 rounded-2xl">
                  {isArabic ? '👈 اختر عميل من الجدول لعرض تاريخ مشترياته بالكامل' : '👈 Choose a profile from the grid to view their entire shopping records'}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}

// Custom Close icon local mock
const X = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
