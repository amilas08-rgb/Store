/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Lock,
  Mail,
  Key,
  Store,
  LogIn,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Database,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const {
    storeSettings,
    language,
    setLanguage,
    adminEmail,
    adminPassword,
    loginWithCredentials,
    spreadsheetTitle,
    spreadsheetId
  } = useStore();

  const isAr = language === 'ar';
  const [email, setEmail] = useState(adminEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await loginWithCredentials(email, password);
      if (!res.success) {
        setErrorMessage(res.message || (isAr ? 'فشل تسجيل الدخول. تأكد من البريد والرقم السري.' : 'Échec de connexion'));
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ في النظام');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdminFill = () => {
    setEmail(adminEmail);
    setPassword(adminPassword);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 relative select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 start-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 end-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Language Switcher Top Corner */}
      <div className="absolute top-6 end-6 z-20">
        <button
          onClick={() => setLanguage(language === 'ar' ? 'fr' : 'ar')}
          className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-medium transition-colors"
        >
          {language === 'ar' ? 'Français' : 'العربية'}
        </button>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          {storeSettings.Logo_URL ? (
            <img
              src={storeSettings.Logo_URL}
              alt="Logo"
              className="w-20 h-20 mx-auto rounded-2xl object-cover ring-4 ring-amber-500/20 shadow-2xl mb-4"
            />
          ) : (
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black shadow-xl shadow-amber-500/20 mb-4">
              <Store className="w-9 h-9" />
            </div>
          )}
          <h1 className="text-2xl font-black text-white tracking-tight">{storeSettings.Store_Name}</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">{storeSettings.Commercial_Name}</p>

          {/* Database link status indicator */}
          {spreadsheetId && (
            <div className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[11px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isAr ? 'قاعدة البيانات مرتبطة وجاهزة:' : 'DB Connectée:'}</span>
              <span className="font-bold max-w-[120px] truncate">{spreadsheetTitle}</span>
            </div>
          )}
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-7 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">
                {isAr ? 'تسجيل الدخول للنظام' : 'Connexion Sécurisée'}
              </h2>
            </div>
            <span className="text-[10px] text-slate-500 font-mono uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              POS & ERP
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p>{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">
                {isAr ? 'البريد الإلكتروني' : 'Adresse Email'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@store.ma"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl ps-10 pe-3.5 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-slate-300 font-semibold block">
                  {isAr ? 'الرقم السري (PIN / Password)' : 'Mot de Passe / PIN'}
                </label>
              </div>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl ps-10 pe-11 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors font-mono tracking-wider"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Quick pre-fill button for testing/demo */}
            <div className="pt-1 flex justify-between items-center">
              <button
                type="button"
                onClick={handleQuickAdminFill}
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
              >
                <Sparkles className="w-3 h-3" />
                <span>{isAr ? 'ملء بيانات المدير تلقائياً' : 'Remplir compte admin'}</span>
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>
                {isLoading
                  ? (isAr ? 'جاري فتح نافذة تأكيد Google...' : 'Connexion en cours...')
                  : (isAr ? 'تسجيل الدخول وتأكيد الربط مع Google' : 'Connexion & Liaison Google')}
              </span>
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800 text-center space-y-1.5">
            <p className="text-[11px] text-amber-400/90 font-medium">
              {isAr
                ? '⚡ عند الضغط ستظهر نافذة Google لتأكيد الربط المباشر مع ملف قاعدة البيانات والمزامنة الفورية.'
                : 'Une fenêtre Google apparaîtra pour confirmer la liaison directe avec Google Sheets.'}
            </p>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {isAr
                ? 'يبقى ملف قاعدة البيانات مسجلاً دائماً في التطبيق إلا إذا غيّره الإدمن من الإعدادات.'
                : 'La base de données reste enregistrée en permanence sauf modification par l’administrateur.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
