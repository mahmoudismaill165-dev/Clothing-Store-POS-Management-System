import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { INITIAL_USERS } from '../data';
import { Shield, Lock, User as UserIcon, Shirt, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  isArabic: boolean;
  theme: 'light' | 'dark';
  users?: User[];
}

export default function Login({ onLoginSuccess, isArabic, theme, users = [] }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | 'all'>('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const activeUsers = users && users.length > 0 ? users : INITIAL_USERS;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const foundUser = activeUsers.find(
        u => u.username.toLowerCase() === username.trim().toLowerCase() && u.active
      );

      if (foundUser) {
        // Any password works for demonstration/simulation, but can check "123"
        onLoginSuccess(foundUser);
      } else {
        setError(
          isArabic 
            ? 'اسم المستخدم غير صحيح! جرب "owner" أو "manager" أو "cashier"' 
            : 'Invalid username! Try "owner", "manager", or "cashier"'
        );
        setLoading(false);
      }
    }, 800);
  };

  const handleQuickLogin = (user: User) => {
    setLoading(true);
    setTimeout(() => {
      onLoginSuccess(user);
    }, 500);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${
      isDark ? 'bg-[#0A0A0C] text-[#E4E4E7]' : 'bg-[#F4F4F5] text-[#18181B]'
    }`} id="login-screen-root">
      
      {/* Background blobs for premium depth */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-rose-600/5 rounded-full blur-3xl animate-pulse pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-600/5 rounded-3xl border border-white/5 shadow-lg mb-4">
            <Shirt className="w-10 h-10 text-indigo-500 animate-bounce" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            {isArabic ? 'نظام الصقر لإدارة الملابس' : 'Al-Saqr Apparel POS'}
          </h1>
          <p className="text-xs text-gray-400 mt-2 tracking-widest uppercase">
            {isArabic ? 'بوابة الموظفين ونقاط البيع الذكية' : 'Smart Retail & POS Gateway'}
          </p>
        </div>

        {/* Main Glass Panel */}
        <div className={`p-8 rounded-3xl shadow-2xl transition-all duration-300 ${
          isDark 
            ? 'bg-[#18181B]/60 backdrop-blur-xl border border-white/5' 
            : 'bg-white/90 backdrop-blur-xl border border-gray-200/60 shadow-gray-200/50'
        }`}>
          
          <h2 className="text-xl font-bold mb-6 text-center flex items-center justify-center gap-2">
            <Shield className="w-5 h-5 text-indigo-400" />
            {isArabic ? 'تسجيل الدخول للنظام' : 'Access Control Login'}
          </h2>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs text-center"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 block">
                {isArabic ? 'اسم المستخدم' : 'Username'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input 
                  type="text"
                  required
                  placeholder={isArabic ? 'مثال: owner, manager, cashier' : 'e.g., owner, manager, cashier'}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                    isDark 
                      ? 'bg-gray-900/60 border border-gray-700 text-white placeholder-gray-500' 
                      : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  id="login-username-input"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 block">
                {isArabic ? 'كلمة المرور' : 'Password'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                    isDark 
                      ? 'bg-gray-900/60 border border-gray-700 text-white placeholder-gray-500' 
                      : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400'
                  }`}
                  id="login-password-input"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 focus:outline-none shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                loading ? 'opacity-80 cursor-wait' : ''
              }`}
              id="login-submit-button"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isArabic ? 'دخول النظام الفوري' : 'Enter POS Workspace'}</span>
                  <ArrowRight className={`w-4 h-4 ${isArabic ? 'rotate-180' : ''}`} />
                </>
              )}
            </button>
          </form>

          {/* Quick profile select bypass (highly helpful for fast testing!) */}
          <div className="mt-8 border-t border-gray-800 pt-6">
            <span className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase block text-center mb-4">
              {isArabic ? 'الدخول السريع كمسؤول للنظام لسهولة التجربة' : 'QUICK STAFF BYPASS FOR CONVENIENT TESTING'}
            </span>
            <div className="grid grid-cols-3 gap-3">
              {activeUsers.map((user) => {
                let badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
                if (user.role === 'Manager') badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                if (user.role === 'Cashier') badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';

                return (
                  <button
                    key={user.id}
                    onClick={() => handleQuickLogin(user)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-200 group relative overflow-hidden cursor-pointer ${
                      isDark 
                        ? 'bg-gray-900/30 hover:bg-gray-800/40 border-gray-800 hover:border-gray-700' 
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300'
                    }`}
                    id={`quick-login-${user.username}`}
                  >
                    <img 
                      src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&fit=crop'} 
                      alt={user.name} 
                      className="w-10 h-10 rounded-full object-cover mb-2 ring-2 ring-indigo-500/20 group-hover:ring-indigo-500/50 transition-all"
                    />
                    <span className="text-xs font-bold truncate w-full">
                      {user.name.split(' ')[0]}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full border mt-1 font-semibold ${badgeColor}`}>
                      {user.role === 'Owner' && (isArabic ? 'مالك' : 'Owner')}
                      {user.role === 'Manager' && (isArabic ? 'مدير' : 'Manager')}
                      {user.role === 'Cashier' && (isArabic ? 'كاشير' : 'Cashier')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer Credit */}
        <p className="text-center text-[10px] text-gray-500 mt-6 font-mono">
          Apparel Store Management & POS System v2.6.4 • Secured Local Session
        </p>

      </motion.div>
    </div>
  );
}
