import React, { useState } from 'react';
import { StoreSettings, User, UserRole } from '../types';
import { INITIAL_USERS } from '../data';
import { 
  Settings, Sliders, RefreshCw, ShieldCheck, Save, Download, 
  Upload, Check, ArrowRight, HelpCircle, BookOpen, Layers,
  Users, UserPlus, Trash2, UserCheck, UserX, Smartphone, QrCode, Copy
} from 'lucide-react';
import { motion } from 'motion/react';
import SystemDocs from './SystemDocs';

interface SettingsProps {
  settings: StoreSettings;
  updateSettings: (newSetts: StoreSettings) => void;
  currentUser: User;
  isArabic: boolean;
  users?: User[];
  onUpdateUsers?: (newUsers: User[]) => void;
}

export default function SettingsComponent({
  settings,
  updateSettings,
  currentUser,
  isArabic,
  users = [],
  onUpdateUsers = () => {}
}: SettingsProps) {
  const [showDocs, setShowDocs] = useState(false);
  
  // Store form local states
  const [storeName, setStoreName] = useState(settings.storeName);
  const [phone, setPhone] = useState(settings.phone);
  const [address, setAddress] = useState(settings.address);
  const [taxRate, setTaxRate] = useState(settings.taxRate);
  const [salesTarget, setSalesTarget] = useState(settings.salesTarget);
  const [allowAllRoles, setAllowAllRoles] = useState(!!(settings as any).allowAllRoles);
  const [permissions, setPermissions] = useState<Record<string, UserRole[]>>(
    settings.permissions || {
      dashboard: ['Owner', 'Manager', 'Cashier'],
      pos: ['Owner', 'Manager', 'Cashier'],
      returns: ['Owner', 'Manager', 'Cashier'],
      invoices: ['Owner', 'Manager', 'Cashier'],
      products: ['Owner', 'Manager'],
      inventory: ['Owner', 'Manager'],
      customers: ['Owner', 'Manager', 'Cashier'],
      suppliers: ['Owner', 'Manager'],
      reports: ['Owner'],
      settings: ['Owner', 'Manager']
    }
  );
  
  // Backup JSON local states
  const [backupJSON, setBackupJSON] = useState('');
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);

  // User management local states
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Cashier');
  const [newUserAvatar, setNewUserAvatar] = useState('');
  const [userActionError, setUserActionError] = useState('');
  const [userActionSuccess, setUserActionSuccess] = useState('');

  const [copiedLink, setCopiedLink] = useState(false);
  const [linkType, setLinkType] = useState<'shareable' | 'direct'>('direct');

  const getShareableUrl = () => {
    if (typeof window === 'undefined') return '';
    const origin = window.location.origin;
    // Auto-rewrite dev URL to public shareable URL for QR and mobile usage
    if (origin.includes('ais-dev-')) {
      return origin.replace('ais-dev-', 'ais-pre-');
    }
    return origin;
  };

  const getDirectUrl = () => {
    if (typeof window === 'undefined') return '';
    return window.location.origin;
  };

  const shareableUrl = getShareableUrl();
  const directUrl = getDirectUrl();
  const activeUrl = linkType === 'shareable' ? shareableUrl : directUrl;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionError('');
    setUserActionSuccess('');

    if (!newUserName.trim() || !newUserUsername.trim()) {
      setUserActionError(isArabic ? 'برجاء ملء جميع الحقول المطلوبة!' : 'Please fill all required fields!');
      return;
    }

    const cleanUsername = newUserUsername.trim().toLowerCase();
    
    // Check if username already exists
    const exists = users.some(u => u.username.toLowerCase() === cleanUsername);
    if (exists) {
      setUserActionError(isArabic ? 'اسم المستخدم هذا موجود بالفعل! اختر اسماً آخر.' : 'Username already exists! Choose another.');
      return;
    }

    // Default avatars depending on role
    const defaultAvatars = {
      Owner: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop',
      Manager: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&fit=crop',
      Cashier: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&fit=crop'
    };

    const newUserObj: User = {
      id: `u_${Date.now()}`,
      name: newUserName.trim(),
      username: cleanUsername,
      role: newUserRole,
      avatar: newUserAvatar.trim() || defaultAvatars[newUserRole],
      active: true
    };

    onUpdateUsers([...users, newUserObj]);
    setNewUserName('');
    setNewUserUsername('');
    setNewUserAvatar('');
    setNewUserRole('Cashier');
    setUserActionSuccess(isArabic ? 'تم إضافة المستخدم الجديد بنجاح!' : 'New user added successfully!');
    setTimeout(() => setUserActionSuccess(''), 3000);
  };

  const handleToggleUserStatus = (userId: string) => {
    if (userId === currentUser.id) {
      alert(isArabic ? 'لا يمكنك تعطيل حسابك الشخصي النشط حالياً!' : 'You cannot deactivate your own active session!');
      return;
    }
    const updated = users.map(u => u.id === userId ? { ...u, active: !u.active } : u);
    onUpdateUsers(updated);
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser.id) {
      alert(isArabic ? 'لا يمكنك حذف حسابك الشخصي الذي تستخدمه حالياً!' : 'You cannot delete your own active account!');
      return;
    }
    if (window.confirm(isArabic ? 'هل أنت متأكد من رغبتك في حذف هذا المستخدم نهائياً؟' : 'Are you sure you want to permanently delete this user?')) {
      const updated = users.filter(u => u.id !== userId);
      onUpdateUsers(updated);
    }
  };

  const handleSaveStoreInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      ...settings,
      storeName,
      phone,
      address,
      taxRate,
      salesTarget,
      allowAllRoles,
      permissions
    } as any);
    alert(isArabic ? 'تم حفظ إعدادات النظام وصلاحيات الأدوار بنجاح!' : 'Store settings and role permissions updated successfully!');
  };

  const handleExportBackup = () => {
    // Collect all local storage keys
    const backupObj: Record<string, any> = {};
    const keys = ['users', 'products', 'customers', 'suppliers', 'sales', 'expenses', 'notifications', 'settings', 'history'];
    keys.forEach(k => {
      const val = localStorage.getItem(`cloth_pos_${k}`);
      if (val) backupObj[k] = JSON.parse(val);
    });

    const jsonStr = JSON.stringify(backupObj, null, 2);
    setBackupJSON(jsonStr);
    setBackupSuccess(true);
    
    // Copy to clipboard
    try {
      navigator.clipboard.writeText(jsonStr);
      setTimeout(() => setBackupSuccess(false), 3000);
    } catch (e) {
      // clip board blocked or not supported in iframe, still displayed in textarea
    }
  };

  const handleDownloadBackupFile = () => {
    const backupObj: Record<string, any> = {};
    const keys = ['users', 'products', 'customers', 'suppliers', 'sales', 'expenses', 'notifications', 'settings', 'history'];
    keys.forEach(k => {
      const val = localStorage.getItem(`cloth_pos_${k}`);
      if (val) backupObj[k] = JSON.parse(val);
    });

    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `cloth_pos_backup_${dateStr}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setBackupSuccess(true);
    setTimeout(() => setBackupSuccess(false), 3000);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const keys = ['users', 'products', 'customers', 'suppliers', 'sales', 'expenses', 'notifications', 'settings', 'history'];
        
        let restoredCount = 0;
        keys.forEach(k => {
          if (parsed[k]) {
            localStorage.setItem(`cloth_pos_${k}`, JSON.stringify(parsed[k]));
            restoredCount++;
          }
        });

        if (restoredCount > 0) {
          alert(isArabic ? 'تهانينا! تم استرجاع البيانات من الملف بالكامل بنجاح. سيتم الآن تحديث الصفحة لتطبيق التغييرات.' : 'Success! Data restored from file. Reloading workspace...');
          window.location.reload();
        } else {
          alert(isArabic ? 'ملف النسخ الاحتياطي غير صالح!' : 'Invalid backup JSON file structure!');
        }
      } catch (err) {
        alert(isArabic ? 'حدث خطأ أثناء قراءة ملف النسخة الاحتياطية! يرجى التحقق من صحته.' : 'Error reading backup file! Verify it is a valid JSON.');
      }
    };
    reader.readAsText(file);
  };

  const handleImportRestore = () => {
    if (!backupJSON) {
      alert(isArabic ? 'برجاء لصق كود النسخة الاحتياطية أولاً!' : 'Please paste backup JSON code first!');
      return;
    }

    try {
      const parsed = JSON.parse(backupJSON);
      const keys = ['users', 'products', 'customers', 'suppliers', 'sales', 'expenses', 'notifications', 'settings', 'history'];
      
      let restoredCount = 0;
      keys.forEach(k => {
        if (parsed[k]) {
          localStorage.setItem(`cloth_pos_${k}`, JSON.stringify(parsed[k]));
          restoredCount++;
        }
      });

      if (restoredCount > 0) {
        setRestoreSuccess(true);
        alert(isArabic ? 'تهانينا! تم استرجاع البيانات بالكامل بنجاح. سيتم الآن تحديث الصفحة لتطبيق التغييرات.' : 'Success! Data restored. Reloading workspace...');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        alert(isArabic ? 'كود النسخ الاحتياطي غير صالح!' : 'Invalid backup JSON data structure!');
      }
    } catch (e) {
      alert(isArabic ? 'خطأ في معالجة الكود! يرجى التحقق من صحة كود الـ JSON الملتصق.' : 'Parsing error! Verify backup syntax copy.');
    }
  };

  return (
    <div className="space-y-6" id="settings-tab-root">
      
      {/* Settings Options Toggle between specs and parameters */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-800 pb-3">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            {isArabic ? 'إعدادات النظام الفنية وتفاصيل الكود' : 'System Setup & Core Technical Files'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {isArabic 
              ? 'تخصيص نسب ضريبة القيمة المضافة، أهداف المبيعات، تصدير واسترجاع قواعد البيانات والاطلاع على التوثيق الفني.' 
              : 'Edit business metadata, taxes, perform automated backup sequences, and view technical architecture.'}
          </p>
        </div>

        {/* System docs visual toggle */}
        <button
          onClick={() => setShowDocs(!showDocs)}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow ${
            showDocs 
              ? 'bg-indigo-600 text-white' 
              : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20'
          }`}
          id="toggle-system-docs-btn"
        >
          <BookOpen className="w-4 h-4" />
          <span>{isArabic ? 'مواصفات ودليل كود النظام (PRD / Flow)' : 'System Specs & Flows (PRD)'}</span>
        </button>
      </div>

      {showDocs ? (
        /* VISUAL SPECIFICATION VIEW */
        <SystemDocs isArabic={isArabic} />
      ) : (
        /* EDIT SYSTEM SETUP AND PARAMETERS */
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="settings-layout-grid">
          
          {/* Column 1: Store info editing (7 Cols) */}
          <form onSubmit={handleSaveStoreInfo} className="lg:col-span-7 p-6 rounded-3xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl space-y-5">
            <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase border-b border-gray-800 pb-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              {isArabic ? 'تهيئة بيانات الكاشير والمحل والضريبة' : 'Business metadata & tax multipliers'}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Store Name */}
              <div className="space-y-1">
                <label className="text-gray-400 font-bold block">{isArabic ? 'اسم المحل التجاري' : 'Retailer Store Name'}</label>
                <input 
                  type="text" required
                  value={storeName} onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-gray-400 font-bold block">{isArabic ? 'رقم الهاتف للتواصل' : 'Tel Store line'}</label>
                <input 
                  type="text" required
                  value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              {/* Address */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-gray-400 font-bold block">{isArabic ? 'العنوان الجغرافي للمحل المطبوع' : 'Geographical printed address'}</label>
                <input 
                  type="text" required
                  value={address} onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              {/* VAT percentage */}
              <div className="space-y-1">
                <label className="text-gray-400 font-bold block">{isArabic ? 'نسبة ضريبة القيمة المضافة (%)' : 'VAT Percentage (%)'}</label>
                <input 
                  type="number" min="0" max="35" required
                  value={taxRate || ''} onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              {/* Monthly Objective sales */}
              <div className="space-y-1">
                <label className="text-gray-400 font-bold block">{isArabic ? 'هدف المبيعات الشهري المطلوب (ج.م)' : 'Monthly Sales Target EGP'}</label>
                <input 
                  type="number" min="1000" required
                  value={salesTarget || ''} onChange={(e) => setSalesTarget(Number(e.target.value))}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>

              {/* Toggle to bypass role/permissions restrictions on buttons */}
              <div className="space-y-1 md:col-span-2 pt-2 border-t border-gray-800/40 mt-2">
                <label className="flex items-center gap-2.5 text-xs text-indigo-300 font-bold cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={allowAllRoles}
                    onChange={(e) => setAllowAllRoles(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-800 bg-gray-950 text-indigo-600 focus:ring-0 cursor-pointer"
                    id="toggle-allow-all-roles-checkbox"
                  />
                  <span>
                    {isArabic 
                      ? 'تمكين الوصول الكامل وإلغاء قيود الأدوار (السماح لجميع الموظفين بالتحكم بجميع زراير وأقسام البرنامج)' 
                      : 'Bypass role restrictions (Allow all employees to click all buttons and access all sections)'}
                  </span>
                </label>
                <p className="text-[10px] text-gray-500 mr-6 ml-6">
                  {isArabic 
                    ? 'عند تفعيل هذا الخيار، سيتمكن الكاشير والمدير من استخدام كامل ميزات البرنامج والدخول لكافة الأقسام والزراير دون قيود.'
                    : 'When enabled, Cashiers and Managers can view reports, change inventory, add products, and access everything.'}
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md flex items-center gap-1"
              id="save-store-settings-btn"
            >
              <Save className="w-4 h-4" />
              <span>{isArabic ? 'حفظ إعدادات العمل الحالية' : 'Commit Settings'}</span>
            </button>

          </form>

          {/* Column 2: JSON Backup & Role Access Rules (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Backup & Restore database panel */}
            <div className="p-6 rounded-3xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl space-y-4">
              <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase border-b border-gray-800 pb-2">
                <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin-slow" />
                {isArabic ? 'النسخ الاحتياطي واسترجاع البيانات المدمج' : 'Database backup & JSON payload'}
              </h4>
              <p className="text-[11px] text-gray-400 leading-normal">
                {isArabic 
                  ? 'بما أن التطبيق يعمل Offline بالكامل، يمكنك تصدير كود قواعد البيانات أو لصق كود قديم لاسترجاعه في ثانية.' 
                  : 'Since operations run locally, you can export your store database payload or paste back code here.'}
              </p>

              <textarea 
                rows={3}
                placeholder={isArabic ? 'ألصق كود النسخة الاحتياطية هنا للاسترجاع الفوري...' : 'Paste backup code here...'}
                value={backupJSON}
                onChange={(e) => setBackupJSON(e.target.value)}
                className="w-full bg-gray-950 border border-gray-850 rounded-xl p-2.5 text-[10px] font-mono text-emerald-400 placeholder-gray-600 focus:outline-none"
                id="backup-payload-textarea"
              />

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1"
                  id="export-backup-btn"
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>{isArabic ? 'نسخ كود البيانات' : 'Copy JSON Text'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleImportRestore}
                  className="py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1"
                  id="import-backup-btn"
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  <span>{isArabic ? 'استعادة من النص' : 'Restore from Text'}</span>
                </button>
              </div>

              {/* File-based backup/restore */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-800/40">
                <button
                  type="button"
                  onClick={handleDownloadBackupFile}
                  className="py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 text-amber-400 border border-amber-500/20 text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1"
                  id="download-backup-file-btn"
                >
                  <Save className="w-3.5 h-3.5 shrink-0" />
                  <span>{isArabic ? 'تصدير كملف JSON 💾' : 'Export JSON File 💾'}</span>
                </button>
                <label
                  className="py-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/15 text-teal-400 border border-teal-500/20 text-[10px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1 text-center"
                  id="upload-backup-file-label"
                >
                  <Upload className="w-3.5 h-3.5 shrink-0" />
                  <span>{isArabic ? 'استيراد ملف JSON 📂' : 'Import JSON File 📂'}</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </label>
              </div>

              {backupSuccess && (
                <div className="text-[10px] font-bold text-indigo-400 text-center animate-pulse">
                  {isArabic ? '✅ تم نسخ كود قاعدة البيانات بنجاح للحافظة!' : '✅ Database copied to clipboard!'}
                </div>
              )}
            </div>

            {/* Role-based ACL Interactive Matrix */}
            <div className="p-6 rounded-3xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl space-y-4">
              <div className="border-b border-gray-800 pb-2 flex items-center justify-between">
                <h4 className="text-xs font-black text-white flex items-center gap-1.5 uppercase">
                  <ShieldCheck className="w-4 h-4 text-pink-400" />
                  {isArabic ? 'مصفوفة التحكم بصلاحيات الفروع والأقسام' : 'Dynamic Role-Permission Matrix'}
                </h4>
                {currentUser.role !== 'Owner' && (
                  <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold">
                    {isArabic ? 'عرض فقط' : 'Read-Only'}
                  </span>
                )}
              </div>
              
              <p className="text-[10px] text-gray-400 leading-normal">
                {isArabic 
                  ? 'اختر الأدوار المسموح لها بدخول كل قسم من أقسام النظام. (المالك لديه صلاحيات مطلقة دائماً).' 
                  : 'Customize which employee roles are allowed to enter each system page/tab.'}
              </p>

              {allowAllRoles && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <span>
                    {isArabic 
                      ? '⚠️ مصفوفة الصلاحيات معطلة لتفعيلك خيار الوصول الكامل بالأعلى!' 
                      : '⚠️ Permissions bypassed because Allow All Roles is checked above!'}
                  </span>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left rtl:text-right text-[11px]">
                  <thead>
                    <tr className="border-b border-gray-800/85 text-gray-500 font-bold text-[9px] uppercase tracking-wider">
                      <th className="pb-1 px-1">{isArabic ? 'القسم / الصفحة' : 'Section / Tab'}</th>
                      <th className="pb-1 px-1 text-center font-bold text-rose-400">{isArabic ? 'مالك' : 'Owner'}</th>
                      <th className="pb-1 px-1 text-center font-bold text-amber-400">{isArabic ? 'مدير' : 'Mgr'}</th>
                      <th className="pb-1 px-1 text-center font-bold text-emerald-400">{isArabic ? 'كاشير' : 'Cashier'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/20 text-gray-300">
                    {[
                      { id: 'dashboard', ar: 'الرئيسية 📊', en: 'Dashboard 📊' },
                      { id: 'pos', ar: 'الكاشير 🛒', en: 'Sales POS 🛒' },
                      { id: 'returns', ar: 'المرتجعات 🔄', en: 'Returns 🔄' },
                      { id: 'invoices', ar: 'سجل الفواتير 📄', en: 'Invoices 📄' },
                      { id: 'products', ar: 'كتالوج الملابس 👕', en: 'Clothing Catalog 👕' },
                      { id: 'inventory', ar: 'المخزون 📦', en: 'Stock Status 📦' },
                      { id: 'customers', ar: 'سجل العملاء CRM 👥', en: 'Customers CRM 👥' },
                      { id: 'suppliers', ar: 'الموردين 🚛', en: 'Suppliers 🚛' },
                      { id: 'reports', ar: 'التقارير والأرباح 📈', en: 'Reports & Profits 📈' },
                      { id: 'settings', ar: 'إعدادات النظام ⚙️', en: 'System Settings ⚙️' }
                    ].map((tab) => {
                      const allowedRoles = permissions[tab.id] || [];
                      
                      const handleCheckboxChange = (role: UserRole) => {
                        if (currentUser.role !== 'Owner') {
                          alert(isArabic ? 'صلاحية تعديل الصلاحيات مخصصة للمالك فقط!' : 'Only the Owner can customize permissions!');
                          return;
                        }
                        if (role === 'Owner') {
                          alert(isArabic ? 'لا يمكن إلغاء صلاحية المالك لتفادي إغلاق النظام!' : 'Owner cannot be locked out!');
                          return;
                        }
                        
                        let updated: UserRole[];
                        if (allowedRoles.includes(role)) {
                          updated = allowedRoles.filter(r => r !== role);
                        } else {
                          updated = [...allowedRoles, role];
                        }
                        setPermissions({
                          ...permissions,
                          [tab.id]: updated
                        });
                      };

                      return (
                        <tr key={tab.id} className="hover:bg-gray-800/10 transition-colors">
                          <td className="py-2 px-1 font-semibold text-gray-300">
                            {isArabic ? tab.ar : tab.en}
                          </td>
                          {/* Owner Checkbox (always checked & disabled) */}
                          <td className="py-2 px-1 text-center">
                            <input 
                              type="checkbox" 
                              checked={true}
                              disabled={true}
                              className="w-3.5 h-3.5 rounded border-gray-800 bg-gray-950 text-rose-500 focus:ring-0 opacity-50 cursor-not-allowed"
                            />
                          </td>
                          {/* Manager Checkbox */}
                          <td className="py-2 px-1 text-center">
                            <input 
                              type="checkbox" 
                              checked={allowedRoles.includes('Manager')}
                              onChange={() => handleCheckboxChange('Manager')}
                              disabled={currentUser.role !== 'Owner'}
                              className={`w-3.5 h-3.5 rounded border-gray-800 bg-gray-950 text-amber-500 focus:ring-0 ${
                                currentUser.role === 'Owner' ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                              }`}
                            />
                          </td>
                          {/* Cashier Checkbox */}
                          <td className="py-2 px-1 text-center">
                            <input 
                              type="checkbox" 
                              checked={allowedRoles.includes('Cashier')}
                              onChange={() => handleCheckboxChange('Cashier')}
                              disabled={currentUser.role !== 'Owner'}
                              className={`w-3.5 h-3.5 rounded border-gray-800 bg-gray-950 text-emerald-500 focus:ring-0 ${
                                currentUser.role === 'Owner' ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                              }`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {currentUser.role === 'Owner' && (
                <div className="text-[9px] text-gray-500 text-center italic mt-1 font-sans">
                  {isArabic 
                    ? '* تذكر الضغط على زر (حفظ إعدادات العمل) لتثبيت الصلاحيات بشكل دائم.' 
                    : '* Remember to click "Commit Settings" to write changes permanently.'}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* FULL WIDTH SECTION: USER MANAGEMENT & STAFF REGISTRY */}
        <div className="p-6 rounded-3xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl mt-6 space-y-6" id="user-management-section">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-800 pb-3">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>{isArabic ? 'إدارة حسابات المستخدمين وطاقم العمل' : 'Staff Accounts & User Management'}</span>
            </h3>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md px-2 py-0.5 font-bold font-mono">
              {users.length} {isArabic ? 'حساب مسجل' : 'Accounts'}
            </span>
          </div>

          {!allowAllRoles && currentUser.role !== 'Owner' && currentUser.role !== 'Manager' ? (
            /* Cashier restriction message */
            <div className="p-8 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 mx-auto text-amber-400 animate-pulse" />
              <h4 className="text-xs font-bold">{isArabic ? 'صلاحيات وصول محدودة' : 'Restricted Access'}</h4>
              <p className="text-[11px] text-gray-400">
                {isArabic 
                  ? 'عذراً، تقع إدارة وإضافة حسابات الموظفين ضمن صلاحيات المالك والمدير فقط لدواعي الأمان.' 
                  : 'Sorry, user account management is restricted to Owners and Managers only.'}
              </p>
            </div>
          ) : (
            /* Grid for active user directory + adding form */
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              
              {/* Directory List (7 cols) */}
              <div className="xl:col-span-7 space-y-3">
                <span className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider">
                  {isArabic ? 'دليل مستخدمي النظام الحاليين' : 'Active System Users Directory'}
                </span>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {users.map((user) => {
                    const isSelf = user.id === currentUser.id;
                    let roleBadge = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                    if (user.role === 'Manager') roleBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                    if (user.role === 'Cashier') roleBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

                    return (
                      <div 
                        key={user.id} 
                        className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                          user.active 
                            ? 'bg-gray-950/40 border-gray-800 hover:border-gray-700' 
                            : 'bg-gray-950/10 border-gray-900 opacity-60'
                        }`}
                        id={`user-row-${user.username}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img 
                            src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&fit=crop'} 
                            alt={user.name} 
                            className="w-10 h-10 rounded-full object-cover border border-gray-800"
                          />
                          <div className="min-w-0 text-xs">
                            <h5 className="font-extrabold text-white flex items-center gap-1.5">
                              <span className="truncate">{user.name}</span>
                              {isSelf && (
                                <span className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded px-1 text-[8px] py-0.2">
                                  {isArabic ? 'أنت' : 'You'}
                                </span>
                              )}
                            </h5>
                            <span className="text-gray-500 font-mono text-[10px]">@{user.username}</span>
                          </div>
                        </div>

                        {/* Status + actions */}
                        <div className="flex items-center gap-3">
                          <span className={`text-[9px] px-2 py-0.5 rounded border font-extrabold uppercase ${roleBadge}`}>
                            {user.role === 'Owner' && (isArabic ? 'مالك' : 'Owner')}
                            {user.role === 'Manager' && (isArabic ? 'مدير' : 'Manager')}
                            {user.role === 'Cashier' && (isArabic ? 'كاشير' : 'Cashier')}
                          </span>

                          <button
                            onClick={() => handleToggleUserStatus(user.id)}
                            disabled={isSelf}
                            className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                              isSelf 
                                ? 'opacity-30 cursor-not-allowed bg-gray-800 text-gray-500 border-transparent' 
                                : user.active 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                            }`}
                            title={isArabic ? 'تفعيل / تعطيل الحساب' : 'Toggle account active state'}
                          >
                            {user.active ? (
                              <span className="flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">{isArabic ? 'نشط' : 'Active'}</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <UserX className="w-3.5 h-3.5 text-gray-500" />
                                <span className="hidden sm:inline text-gray-500">{isArabic ? 'معطل' : 'Disabled'}</span>
                              </span>
                            )}
                          </button>

                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={isSelf}
                            className={`p-2 rounded-lg border text-rose-400 transition-all ${
                              isSelf 
                                ? 'opacity-30 cursor-not-allowed border-transparent' 
                                : 'bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20'
                            }`}
                            title={isArabic ? 'حذف المستخدم نهائياً' : 'Permanently delete user'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Add form (5 cols) */}
              <form onSubmit={handleAddUser} className="xl:col-span-5 p-5 rounded-2xl bg-gray-950/50 border border-white/5 space-y-4">
                <span className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider">
                  {isArabic ? 'تسجيل مستخدم أو موظف جديد' : 'Register New Staff Member'}
                </span>

                <div className="space-y-3 text-xs">
                  {/* Full name */}
                  <div className="space-y-1">
                    <label className="text-gray-400 font-bold block">{isArabic ? 'الاسم بالكامل' : 'Full Name'}</label>
                    <input 
                      type="text" required
                      value={newUserName} onChange={(e) => setNewUserName(e.target.value)}
                      placeholder={isArabic ? 'مثال: محمد أحمد' : 'e.g. John Doe'}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-1">
                    <label className="text-gray-400 font-bold block">{isArabic ? 'اسم المستخدم (لتسجيل الدخول)' : 'Username (for login)'}</label>
                    <input 
                      type="text" required
                      value={newUserUsername} onChange={(e) => setNewUserUsername(e.target.value)}
                      placeholder={isArabic ? 'مثال: mohamed' : 'e.g. mohamed'}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Role select */}
                  <div className="space-y-1">
                    <label className="text-gray-400 font-bold block">{isArabic ? 'صلاحية و دور الموظف' : 'Staff Role / Authority'}</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Cashier">{isArabic ? 'كاشير (صلاحيات محدودة - بيع فقط)' : 'Cashier (POS Checkout only)'}</option>
                      <option value="Manager">{isArabic ? 'مدير (صلاحيات متوسطة - مخازن وكتالوج)' : 'Manager (Catalog & Stock)'}</option>
                      <option value="Owner">{isArabic ? 'مالك (صلاحيات كاملة مطلقة)' : 'Owner (Full Access)'}</option>
                    </select>
                  </div>

                  {/* Avatar URL */}
                  <div className="space-y-1">
                    <label className="text-gray-400 font-bold block">
                      <span>{isArabic ? 'رابط الصورة الشخصية' : 'Avatar URL'}</span>
                      <span className="text-[10px] text-gray-500 font-normal ml-1 mr-1">({isArabic ? 'اختياري' : 'Optional'})</span>
                    </label>
                    <input 
                      type="url"
                      value={newUserAvatar} onChange={(e) => setNewUserAvatar(e.target.value)}
                      placeholder={isArabic ? 'رابط الصورة الشخصية...' : 'https://images.unsplash.com/...'}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {userActionError && (
                  <p className="text-[10px] text-red-400 font-bold animate-pulse">{userActionError}</p>
                )}
                {userActionSuccess && (
                  <p className="text-[10px] text-emerald-400 font-bold animate-pulse">{userActionSuccess}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isArabic ? 'إضافة الموظف الجديد' : 'Register Member'}</span>
                </button>
              </form>

            </div>
          )}
        </div>

        {/* MOBILE & LAPTOP CONNECTION & PWA INSTALLER */}
        <div className="p-6 rounded-3xl bg-gray-900/35 border border-white/5 backdrop-blur-md shadow-xl mt-6 space-y-6" id="mobile-connection-section">
          <div className="flex items-center gap-2 border-b border-gray-800 pb-3">
            <Smartphone className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-extrabold text-white">
              {isArabic ? 'ربط وتحميل التطبيق على الجوال والكمبيوتر 📱💻' : 'Connect & Install App on Mobile & Laptop 📱💻'}
            </h3>
          </div>

          {/* Link Selector Switcher and Warnings */}
          <div className="flex flex-col gap-3.5 p-4.5 bg-gray-950/40 border border-white/5 rounded-2xl">
            <span className="text-xs font-bold text-indigo-300">
              {isArabic ? 'اختر نوع الرابط لتفادي مشاكل الاتصال والأخطاء:' : 'Select Link Type to avoid connection errors:'}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLinkType('shareable')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  linkType === 'shareable'
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-md'
                    : 'bg-transparent text-gray-400 border-gray-850 hover:text-gray-300'
                }`}
              >
                {isArabic ? 'الرابط العام للمشاركة 🌍' : 'Public Shareable Link 🌍'}
              </button>
              <button
                type="button"
                onClick={() => setLinkType('direct')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  linkType === 'direct'
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-md'
                    : 'bg-transparent text-gray-400 border-gray-850 hover:text-gray-300'
                }`}
              >
                {isArabic ? 'الرابط المباشر للمطور 🛠️' : 'Direct Developer Link 🛠️'}
              </button>
            </div>

            {/* Explanation Warning Box based on linkType */}
            {linkType === 'shareable' ? (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 leading-relaxed space-y-1.5">
                <p className="font-extrabold flex items-center gap-1.5 text-amber-400">
                  <span>⚠️</span>
                  {isArabic ? 'تنبيه تفعيل الرابط العام (Share):' : 'Public Link Action Required:'}
                </p>
                <p className="text-[11px] text-gray-300">
                  {isArabic ? (
                    <>
                      لكي يعمل الرابط العام على هاتفك أو أي جهاز آخر بنجاح، يجب أولاً الضغط على زر <strong className="text-amber-300">"Share" (مشاركة)</strong> في <strong>أعلى يمين شاشة Google AI Studio</strong> بالمتصفح. بدون هذه الخطوة، سيعطيك المتصفح خطأ (404) أو صفحة غير متوفرة عند فتح الرابط العام.
                    </>
                  ) : (
                    <>
                      To make the shareable link load properly, you must first click the <strong className="text-amber-300">"Share"</strong> button on the <strong>top-right corner of Google AI Studio</strong>. Otherwise, it will return a 404/not found error when opened on other devices.
                    </>
                  )}
                </p>
              </div>
            ) : (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 leading-relaxed space-y-1.5">
                <p className="font-extrabold flex items-center gap-1.5 text-emerald-400">
                  <span>💡</span>
                  {isArabic ? 'ميزة الرابط المباشر (Direct):' : 'Direct Developer Link:'}
                </p>
                <p className="text-[11px] text-gray-300">
                  {isArabic ? (
                    <>
                      هذا الرابط يعمل فوراً وبشكل مباشر على متصفحك الحالي. عند مسحه بالهاتف أو فتحه باللابتوب الآخر، قد يطلب منك تسجيل الدخول بحساب Google AI Studio الخاص بك ليفتح معك لوحة التحكم بشكل آمن وفوري كمالك للتطبيق.
                    </>
                  ) : (
                    <>
                      This link runs on your active live development session. When opened on other devices, it will securely prompt you to log into your Google AI Studio owner account to view and interact with the application immediately.
                    </>
                  )}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* QR Code Column (4 cols) */}
            <div className="md:col-span-4 flex flex-col items-center text-center p-5 rounded-2xl bg-gray-950/40 border border-white/5 space-y-3">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                {isArabic ? 'امسح الرمز لفتحه على الهاتف' : 'Scan to open on Mobile'}
              </span>
              <div className="p-3 bg-white rounded-2xl shadow-lg border-2 border-indigo-500/20">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(activeUrl)}`} 
                  alt="POS App QR Code" 
                  className="w-40 h-40 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              {/* Direct Text Link Box */}
              <div className="w-full text-left space-y-1">
                <span className="text-[9px] font-extrabold text-gray-400 block text-center">
                  {isArabic ? 'رابط الموقع المباشر للجوال:' : 'Direct Website URL:'}
                </span>
                <div className="p-2 rounded-lg bg-gray-950/80 border border-white/5 text-[10px] font-mono text-indigo-300 break-all select-all text-center">
                  {activeUrl}
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full py-2 bg-indigo-600/15 hover:bg-indigo-600/25 border border-indigo-500/30 text-indigo-300 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>
                  {copiedLink 
                    ? (isArabic ? 'تم نسخ الرابط! ✅' : 'Copied! ✅') 
                    : (isArabic ? 'نسخ رابط البرنامج المحدد 🔗' : 'Copy Selected Link 🔗')}
                </span>
              </button>
            </div>

            {/* Instruction Column (8 cols) */}
            <div className="md:col-span-8 space-y-4 text-xs font-sans">
              
              {/* Laptop Installation */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-white text-xs border-b border-gray-850 pb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  {isArabic ? 'تحميل وتثبيت التطبيق على اللاب توب / الكمبيوتر 💻' : 'Install on Laptop / Desktop 💻'}
                </h4>
                <div className="p-4 rounded-2xl bg-indigo-950/15 border border-indigo-500/15 space-y-2">
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    {isArabic 
                      ? 'بما أن البرنامج مبني بتقنية الويب المتقدمة (PWA)، يمكنك تثبيته كبرنامج مستقل على اللاب توب الخاص بك بضغطة زر واحدة بدون تحميل ملفات خارجية:'
                      : 'Since the app is built as a PWA, you can install it on your laptop directly through your browser as a standalone app:'}
                  </p>
                  <ol className="list-decimal list-inside text-gray-300 space-y-1.5 text-[11px] leading-relaxed">
                    <li>
                      {isArabic 
                        ? 'افتح هذا الرابط الحالي في متصفح (Google Chrome) أو (Microsoft Edge) على اللاب توب.' 
                        : 'Open this current website in Google Chrome or Microsoft Edge on your laptop.'}
                    </li>
                    <li>
                      {isArabic 
                        ? 'ستلاحظ ظهور أيقونة "شاشة صغيرة وبها سهم للأسفل 📥" أو علامة (⊕) في شريط العنوان بالأعلى (بجوار النجمة والمفضلة).' 
                        : 'Look at the address bar (URL bar) at the top right, you will see an "Install" icon (a computer monitor with an arrow 📥 or a plus ⊕ button).'}
                    </li>
                    <li>
                      {isArabic 
                        ? 'اضغط على الأيقونة ثم اختر "تثبيت" (Install).' 
                        : 'Click on that icon and select "Install".'}
                    </li>
                    <li>
                      {isArabic 
                        ? 'سيفتح البرنامج فوراً في نافذة مستقلة وبدون شريط المتصفح، وسيتم إنشاء أيقونة واختصار للبرنامج على سطح المكتب (Desktop) لفتحه مباشرة في أي وقت!' 
                        : 'The app will launch in its own standalone window and an icon will be added to your desktop/launcher for instant access!'}
                    </li>
                  </ol>

                  {/* Direct New Tab Install Trigger */}
                  <div className="pt-3 border-t border-indigo-500/10">
                    <button
                      type="button"
                      onClick={() => window.open(directUrl, '_blank')}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer animate-pulse"
                    >
                      <span>💻</span>
                      {isArabic 
                        ? 'افتح البرنامج في صفحة مستقلة للتثبيت الآن' 
                        : 'Open App in Full Page to Install Now'}
                    </button>
                    <span className="text-[10px] text-amber-300 block mt-1.5 text-center leading-normal">
                      ⚠️ {isArabic 
                        ? 'ملاحظة هامة جداً: لن يظهر خيار تثبيت البرنامج (⊕ أو 📥) طالما أنك تتصفحه من داخل نافذة المطور الحالية. اضغط على الزر المضيء أعلاه لفتحه في صفحة كاملة ومستقلة، وسيظهر لك زر التثبيت فوراً في شريط العنوان بالمتصفح!'
                        : 'Important Note: The browser install button (⊕ or 📥) is hidden inside this developer frame. Click the glowing button above to open the app in a full standalone page, and the install button will show up instantly in your browser bar!'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Installation */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-white text-xs border-b border-gray-850 pb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {isArabic ? 'خطوات تثبيت التطبيق على الجوال كبرنامج مستقل 📱' : 'Install on Mobile Devices 📱'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Android / Chrome */}
                  <div className="p-4 rounded-2xl bg-gray-950/20 border border-gray-800 space-y-2">
                    <span className="text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider block">
                      {isArabic ? 'هواتف الأندرويد (جوجل كروم) 🤖' : 'Android Phones (Chrome) 🤖'}
                    </span>
                    <ol className="list-decimal list-inside text-gray-300 space-y-1.5 text-[11px] leading-relaxed">
                      <li>{isArabic ? 'امسح الرمز الشريطي بالجانب لفتح التطبيق.' : 'Scan the QR code to open the app.'}</li>
                      <li>{isArabic ? 'اضغط على زر القائمة (النقاط الثلاثة ⠇) بالمتصفح.' : 'Tap the browser menu button (3 dots ⠇).'}</li>
                      <li>{isArabic ? 'اختر "إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق".' : 'Select "Add to Home Screen" or "Install App".'}</li>
                      <li>{isArabic ? 'مبروك! سيعمل الآن كبرنامج كامل وسريع على هاتفك.' : 'Congrats! It will run as a full screen native app.'}</li>
                    </ol>
                  </div>

                  {/* iOS / Safari */}
                  <div className="p-4 rounded-2xl bg-gray-950/20 border border-gray-800 space-y-2">
                    <span className="text-sky-400 font-extrabold text-[10px] uppercase tracking-wider block">
                      {isArabic ? 'هواتف الآيفون (متصفح سفاري) 🍎' : 'iPhones / iOS (Safari) 🍎'}
                    </span>
                    <ol className="list-decimal list-inside text-gray-300 space-y-1.5 text-[11px] leading-relaxed">
                      <li>{isArabic ? 'امسح الرمز الشريطي بكاميرا الهاتف لفتح الرابط.' : 'Scan the QR code with your camera to open Safari.'}</li>
                      <li>{isArabic ? 'اضغط على زر "المشاركة" السفلي في سفاري 📤.' : 'Tap the "Share" button at the bottom navigation bar 📤.'}</li>
                      <li>{isArabic ? 'مرر للأسفل واختر "إضافة إلى الشاشة الرئيسية".' : 'Scroll down and choose "Add to Home Screen".'}</li>
                      <li>{isArabic ? 'سيتوفر البرنامج على سطح هاتفك بكامل ميزاته وبسرعة عالية.' : 'The app is now added on your screen as a standalone tool!'}</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Offline Capability Highlight */}
              <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 text-[10.5px] text-gray-400 leading-relaxed">
                💡 <span className="font-bold text-indigo-300">
                  {isArabic 
                    ? 'تقنية تطبيق الويب التقدمي (PWA) المعتمدة:' 
                    : 'Progressive Web App (PWA) features enabled:'}
                </span>{' '}
                {isArabic 
                  ? 'تم تجهيز البرنامج بملف manifest مدمج ومسجل خدمة (Service Worker) لتخزين الملفات الهيكلية تلقائياً على الأجهزة. هذا يعني سرعة استجابة فائقة، استهلاكاً منخفضاً للإنترنت، ودعماً كاملاً للتشغيل التلقائي.'
                  : 'Engineered with service workers for rapid, offline-capable load speeds and immediate local launches.'}
              </div>
            </div>
          </div>
        </div>
      </>
    )}

    </div>
  );
}
