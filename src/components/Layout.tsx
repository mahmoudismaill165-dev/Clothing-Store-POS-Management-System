import React, { useState, useEffect } from 'react';
import { User, StoreSettings, AppNotification } from '../types';
import { 
  LayoutDashboard, ShoppingCart, Shirt, Package, Users, Truck, 
  BarChart3, Settings, LogOut, Moon, Sun, Bell, Search, Globe, 
  Menu, X, Calendar, Clock, AlertTriangle, HelpCircle, RotateCcw, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onLogout: () => void;
  settings: StoreSettings;
  updateSettings: (settings: StoreSettings) => void;
  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => void;
  universalSearchTerm: string;
  setUniversalSearchTerm: (term: string) => void;
}

export default function Layout({
  children,
  activeTab,
  setActiveTab,
  currentUser,
  onLogout,
  settings,
  updateSettings,
  notifications,
  markNotificationAsRead,
  universalSearchTerm,
  setUniversalSearchTerm
}: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');

  const isArabic = settings.language === 'ar';
  const isDark = settings.theme === 'dark';

  // Digital clock update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const optionsTime: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
      const optionsDate: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
      
      setTimeStr(now.toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', optionsTime));
      setDateStr(now.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', optionsDate));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isArabic]);

  // Close sidebar on mobile screens on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, []);

  const toggleTheme = () => {
    updateSettings({
      ...settings,
      theme: settings.theme === 'dark' ? 'light' : 'dark'
    });
  };

  const toggleLanguage = () => {
    updateSettings({
      ...settings,
      language: settings.language === 'ar' ? 'en' : 'ar'
    });
  };

  const navItems = [
    { id: 'dashboard', labelAr: 'لوحة القيادة', labelEn: 'Dashboard', icon: LayoutDashboard, roles: ['Owner', 'Manager', 'Cashier'] },
    { id: 'pos', labelAr: 'فاتورة مبيعات جديدة 🛒', labelEn: 'New Sales Invoice 🛒', icon: ShoppingCart, roles: ['Owner', 'Manager', 'Cashier'] },
    { id: 'returns', labelAr: 'مرتجع مبيعات 🔄', labelEn: 'Sales Returns 🔄', icon: RotateCcw, roles: ['Owner', 'Manager', 'Cashier'] },
    { id: 'invoices', labelAr: 'سجل الفواتير 📄', labelEn: 'Invoices Registry 📄', icon: FileText, roles: ['Owner', 'Manager', 'Cashier'] },
    { id: 'products', labelAr: 'المنتجات والأنواع', labelEn: 'Apparel Inventory', icon: Shirt, roles: ['Owner', 'Manager'] },
    { id: 'inventory', labelAr: 'حركة المخزون', labelEn: 'Stock Status', icon: Package, roles: ['Owner', 'Manager'] },
    { id: 'customers', labelAr: 'سجل العملاء CRM', labelEn: 'Customers CRM', icon: Users, roles: ['Owner', 'Manager', 'Cashier'] },
    { id: 'suppliers', labelAr: 'الموردين والمطالبات', labelEn: 'Suppliers Hub', icon: Truck, roles: ['Owner', 'Manager'] },
    { id: 'reports', labelAr: 'التقارير والأرباح', labelEn: 'Analytics & Profits', icon: BarChart3, roles: ['Owner'] },
    { id: 'settings', labelAr: 'إعدادات النظام', labelEn: 'System Settings', icon: Settings, roles: ['Owner', 'Manager'] },
  ];

  const unreadNotifications = notifications.filter(n => !n.isRead);

  // Filter nav elements according to current role
  const visibleNavItems = settings.allowAllRoles 
    ? navItems 
    : navItems.filter(item => {
        const allowedRoles = (settings.permissions && settings.permissions[item.id]) || item.roles;
        return allowedRoles.includes(currentUser.role);
      });

  return (
    <div 
      className={`min-h-screen flex transition-colors duration-300 ${
        isDark ? 'bg-[#0A0A0C] text-[#E4E4E7] font-sans' : 'bg-[#F4F4F5] text-[#18181B] font-sans'
      }`}
      dir={isArabic ? 'rtl' : 'ltr'}
      id="main-layout-root"
    >
      
      {/* Backdrop overlay for mobile screen */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-20 lg:hidden cursor-pointer"
          id="mobile-sidebar-backdrop"
        />
      )}

      {/* Sidebar navigation */}
      <aside 
        className={`fixed inset-y-0 z-30 transition-all duration-300 flex flex-col ${
          isArabic ? 'right-0 border-l' : 'left-0 border-r'
        } ${
          sidebarOpen
            ? 'translate-x-0 w-64'
            : isArabic
              ? 'translate-x-full lg:translate-x-0 lg:w-20'
              : '-translate-x-full lg:translate-x-0 lg:w-20'
        } ${
          isDark 
            ? 'bg-[#0F0F12] border-white/5' 
            : 'bg-white border-gray-200/60'
        }`}
        id="sidebar-container"
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800/20">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30">
              <Shirt className="w-5 h-5 text-indigo-400 shrink-0" />
            </div>
            {sidebarOpen && (
              <span className="font-extrabold text-sm tracking-wide bg-gradient-to-r from-indigo-400 to-indigo-200 bg-clip-text text-transparent truncate max-w-[150px]">
                {settings.storeName || (isArabic ? 'محل ملابس الصقر' : 'Apparel POS')}
              </span>
            )}
          </div>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-1.5 rounded-lg hover:bg-gray-800/10 cursor-pointer hidden lg:block`}
            id="sidebar-toggle-button"
          >
            {sidebarOpen ? <X className="w-4 h-4 text-gray-400" /> : <Menu className="w-4 h-4 text-gray-400" />}
          </button>
        </div>

        {/* User profile section */}
        <div className={`p-4 border-b border-gray-800/10 flex items-center gap-3 ${!sidebarOpen ? 'justify-center' : ''}`}>
          <img 
            src={currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&fit=crop"} 
            alt={currentUser.name} 
            className="w-10 h-10 rounded-full object-cover border-2 border-indigo-500/20 shrink-0"
          />
          {sidebarOpen && (
            <div className="overflow-hidden">
              <h4 className="text-xs font-bold truncate text-gray-200 dark:text-white">{currentUser.name}</h4>
              <p className="text-[10px] text-indigo-400 font-semibold uppercase mt-0.5 tracking-wider">
                {currentUser.role === 'Owner' && (isArabic ? 'المالك 👑' : 'Owner 👑')}
                {currentUser.role === 'Manager' && (isArabic ? 'المدير 👔' : 'Manager 👔')}
                {currentUser.role === 'Cashier' && (isArabic ? 'كاشير 🛒' : 'Cashier 🛒')}
              </p>
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer group text-xs font-bold ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                    : isDark 
                      ? 'text-gray-400 hover:bg-gray-900/50 hover:text-white' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                } ${!sidebarOpen ? 'justify-center px-0' : ''}`}
                title={!sidebarOpen ? (isArabic ? item.labelAr : item.labelEn) : undefined}
                id={`nav-tab-${item.id}`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                {sidebarOpen && (
                  <span className="truncate">
                    {isArabic ? item.labelAr : item.labelEn}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-gray-800/10 space-y-1">
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all cursor-pointer ${
              !sidebarOpen ? 'justify-center px-0' : ''
            }`}
            id="sidebar-logout-button"
          >
            <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
            {sidebarOpen && <span>{isArabic ? 'تسجيل الخروج' : 'Logout Workspace'}</span>}
          </button>
        </div>
      </aside>

      {/* Main workspace container */}
      <div 
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${
          sidebarOpen ? 'lg:pl-64 lg:rtl:pl-0 lg:rtl:pr-64' : 'lg:pl-20 lg:rtl:pl-0 lg:rtl:pr-20'
        }`}
        id="workspace-viewport"
      >
        
        {/* Navigation Header */}
        <header className={`h-16 sticky top-0 z-20 flex items-center justify-between px-6 border-b shadow-sm ${
          isDark 
            ? 'bg-[#0A0A0C]/80 backdrop-blur-md border-white/5 shadow-black/10' 
            : 'bg-white/80 backdrop-blur-md border-gray-200/60 shadow-gray-100/10'
        }`} id="navbar-top">
          
          <div className="flex items-center gap-4 flex-1">
            {/* Mobile menu trigger */}
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-gray-800/10 cursor-pointer lg:hidden text-gray-400"
              id="mobile-sidebar-toggle"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Universal search engine */}
            <div className="relative max-w-xs lg:max-w-md w-full hidden sm:block">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text"
                placeholder={isArabic ? 'بحث سريع عن منتج، عميل، فاتورة، باركود...' : 'Quick search product, customer, invoice...'}
                value={universalSearchTerm}
                onChange={(e) => setUniversalSearchTerm(e.target.value)}
                className={`w-full pl-9 pr-4 py-1.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                  isDark 
                    ? 'bg-gray-900/60 border border-gray-800 text-white placeholder-gray-500' 
                    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'
                }`}
                id="universal-search-input"
              />
            </div>

            {/* Live digital clock */}
            <div className="hidden lg:flex items-center gap-2 border-l dark:border-gray-800 pl-4 text-xs text-gray-400 font-mono select-none">
              <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
              <span>{timeStr}</span>
              <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0 ml-1.5" />
              <span className="truncate">{dateStr}</span>
            </div>
          </div>

          {/* Quick buttons */}
          <div className="flex items-center gap-2">
            
            {/* Quick manual scan shortcut for POS */}
            {activeTab === 'pos' && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] rounded-lg font-mono">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                {isArabic ? 'الماسح اللاسلكي متصل' : 'Scanner Engaged'}
              </span>
            )}

            {/* Language toggle button */}
            <button
              onClick={toggleLanguage}
              className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                isDark 
                  ? 'bg-gray-900/40 border-gray-800 hover:bg-gray-800/50 text-gray-300' 
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm'
              }`}
              title={isArabic ? 'التغيير للإنجليزية' : 'Switch to Arabic'}
              id="language-toggle-button"
            >
              <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="hidden md:inline font-sans">{isArabic ? 'English' : 'العربية'}</span>
            </button>

            {/* Theme toggle button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark 
                  ? 'bg-gray-900/40 border-gray-800 hover:bg-gray-800/50 text-amber-400' 
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-indigo-600 shadow-sm'
              }`}
              id="theme-toggle-button"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Live Notifications bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className={`p-2 rounded-xl border transition-all cursor-pointer relative ${
                  isDark 
                    ? 'bg-gray-900/40 border-gray-800 hover:bg-gray-800/50 text-gray-300' 
                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600 shadow-sm'
                } ${unreadNotifications.length > 0 ? 'animate-pulse' : ''}`}
                id="notifications-bell-button"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-gray-900">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {/* Notification drop-down panel */}
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute mt-2 w-80 rounded-2xl shadow-xl z-50 border overflow-hidden ${
                      isArabic ? 'left-0' : 'right-0'
                    } ${
                      isDark 
                        ? 'bg-gray-900/95 backdrop-blur-xl border-gray-800 shadow-black/30' 
                        : 'bg-white/95 backdrop-blur-xl border-gray-200 shadow-gray-200/40'
                    }`}
                    id="notifications-dropdown-menu"
                  >
                    <div className="p-3 border-b border-gray-800/10 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400">
                        {isArabic ? 'إشعارات النظام التلقائية' : 'System Automation Alerts'}
                      </span>
                      {unreadNotifications.length > 0 && (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-full">
                          {unreadNotifications.length} {isArabic ? 'جديد' : 'New'}
                        </span>
                      )}
                    </div>
                    <div className="max-h-64 overflow-y-auto divide-y divide-gray-800/10 text-xs">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                          {isArabic ? 'لا توجد إشعارات حاليًا' : 'No alerts generated'}
                        </div>
                      ) : (
                        notifications.map((n) => {
                          let alertBg = 'bg-indigo-500/5';
                          let alertBorder = 'border-indigo-500/10';
                          if (n.type === 'out_of_stock') { alertBg = 'bg-rose-500/5'; alertBorder = 'border-rose-500/10'; }
                          if (n.type === 'low_stock') { alertBg = 'bg-amber-500/5'; alertBorder = 'border-amber-500/10'; }
                          
                          return (
                            <div 
                              key={n.id}
                              onClick={() => {
                                markNotificationAsRead(n.id);
                                if (n.type === 'low_stock' || n.type === 'out_of_stock') {
                                  setActiveTab('inventory');
                                }
                                setNotificationsOpen(false);
                              }}
                              className={`p-3 transition-colors cursor-pointer flex items-start gap-2.5 hover:bg-gray-800/10 ${
                                !n.isRead ? 'font-bold bg-indigo-500/10' : ''
                              }`}
                              id={`notification-item-${n.id}`}
                            >
                              <div className="mt-0.5">
                                {(n.type === 'out_of_stock' || n.type === 'low_stock') ? (
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                ) : (
                                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className={`text-[11px] ${!n.isRead ? 'text-white' : 'text-gray-400'}`}>{n.title}</h5>
                                <p className="text-[10px] text-gray-500 leading-normal mt-0.5 line-clamp-2">{n.message}</p>
                                <span className="text-[8px] text-gray-600 mt-1 block font-mono">{n.date}</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </header>

        {/* Dynamic page content */}
        <main className="flex-1 p-6 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        
      </div>
    </div>
  );
}
