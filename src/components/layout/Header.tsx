/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Globe,
  Sun,
  Moon,
  LogOut,
  Wallet,
  Store,
  Menu,
  User,
  ShieldCheck
} from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const {
    language,
    setLanguage,
    theme,
    toggleTheme,
    storeSettings,
    authUser,
    logout,
    activeCashSession,
    setActiveView
  } = useStore();

  const isAr = language === 'ar';

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-40 select-none transition-colors">
      {/* Brand & Mobile menu button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="القائمة"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          {storeSettings.Logo_URL ? (
            <img
              src={storeSettings.Logo_URL}
              alt="Logo"
              className="w-9 h-9 rounded-lg object-cover ring-2 ring-amber-500/30 group-hover:ring-amber-500 transition-all"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Store className="w-5 h-5 text-slate-950" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-sm md:text-base text-slate-100 group-hover:text-amber-400 transition-colors">
                {storeSettings.Store_Name}
              </h1>
            </div>
            <p className="text-[11px] text-slate-400 hidden md:block">
              {storeSettings.Commercial_Name}
            </p>
          </div>
        </div>
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Cash Register status pill */}
        <button
          onClick={() => setActiveView('cash')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            activeCashSession
              ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 hover:bg-emerald-900/40'
              : 'bg-rose-950/40 border-rose-500/30 text-rose-400 hover:bg-rose-900/40'
          }`}
          title={isAr ? 'حالة الصندوق والوردية' : 'État de la Caisse'}
        >
          <Wallet className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {activeCashSession
              ? `${isAr ? 'الوردية مفتوحة' : 'Caisse Ouverte'}`
              : `${isAr ? 'الوردية مغلقة' : 'Caisse Fermée'}`}
          </span>
          {activeCashSession && (
            <span className="font-mono text-emerald-300">
              {activeCashSession.Opening_Balance} د.م
            </span>
          )}
        </button>

        {/* Light / Dark Mode Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700 transition-colors"
          title={theme === 'dark' ? (isAr ? 'تفعيل النمط الفاتح' : 'Passer au mode clair') : (isAr ? 'تفعيل النمط الداكن' : 'Passer au mode sombre')}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
        </button>

        {/* Language switch */}
        <button
          onClick={() => setLanguage(language === 'ar' ? 'fr' : 'ar')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
          title="Changer de langue / تغيير اللغة"
        >
          <Globe className="w-3.5 h-3.5 text-amber-400" />
          <span>{language === 'ar' ? 'Français' : 'العربية'}</span>
        </button>

        {/* Logged in User Profile & Logout */}
        {authUser && (
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 ps-2.5 pe-1.5 py-1 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-[11px]">
              {authUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden xl:block text-start leading-tight">
              <span className="text-xs text-slate-200 font-semibold block max-w-[110px] truncate">
                {authUser.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {authUser.role}
              </span>
            </div>
            <button
              onClick={logout}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition-colors"
              title={isAr ? 'تسجيل الخروج' : 'Déconnexion'}
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
