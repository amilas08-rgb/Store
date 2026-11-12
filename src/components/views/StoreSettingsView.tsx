/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  Settings,
  Save,
  CheckCircle2,
  Store,
  FileText,
  Key,
  Mail,
  ShieldCheck,
  Database,
  ExternalLink,
  Lock
} from 'lucide-react';

export const StoreSettingsView: React.FC = () => {
  const {
    language,
    storeSettings,
    updateStoreSettings,
    adminEmail,
    adminPassword,
    updateAdminCredentials,
    spreadsheetId,
    spreadsheetTitle,
    spreadsheetUrl,
    setActiveView
  } = useStore();

  const isAr = language === 'ar';

  const [formData, setFormData] = useState(storeSettings);
  const [emailInput, setEmailInput] = useState(adminEmail);
  const [passwordInput, setPasswordInput] = useState(adminPassword);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreSettings(formData);
    updateAdminCredentials(emailInput, passwordInput);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-amber-400" />
            <span>{isAr ? 'إعدادات وهوية المحل وبيانات الدخول' : 'Paramètres du Magasin & Sécurité'}</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            {isAr
              ? 'تخصيص بيانات الفواتير، بيانات الدخول بالبريد والرقم السري، وملف قاعدة البيانات'
              : 'Informations légales, identifiants de connexion et base de données'}
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" />
            <span>{isAr ? 'تم حفظ التعديلات بنجاح!' : 'Enregistré avec succès!'}</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 text-xs">
        {/* Section 0: Admin Login Credentials */}
        <div className="space-y-3 p-4 rounded-xl bg-slate-950/70 border border-amber-500/30">
          <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2 pb-1">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'بيانات تسجيل الدخول لحساب المدير (Email & Password)' : 'Identifiants de Connexion Admin'}</span>
          </h3>
          <p className="text-[11px] text-slate-400">
            {isAr
              ? 'حدد البريد الإلكتروني والرقم السري الذي يُطلب عند فتح التطبيق للدخول والربط المباشر بقاعدة البيانات.'
              : 'Configurez l’adresse email et le mot de passe pour la connexion de l’administrateur.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAr ? 'البريد الإلكتروني لتسجيل الدخول:' : 'Email de connexion:'}</span>
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>{isAr ? 'الرقم السري للولوج (Password / PIN):' : 'Mot de passe:'}</span>
              </label>
              <input
                type="text"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section: Permanent Database Status */}
        <div className="space-y-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>{isAr ? 'ملف قاعدة بيانات Google Sheets المسجل' : 'Base de Données Google Sheets'}</span>
            </h3>
            <button
              type="button"
              onClick={() => setActiveView('database')}
              className="text-[11px] text-amber-400 hover:underline"
            >
              {isAr ? 'إدارة وتغيير الملف' : 'Gérer'}
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            {isAr
              ? 'يبقى ملف قاعدة البيانات هذا مسجلاً ودائماً في التطبيق تلقائياً، ولا يتم فكه إلا إذا قام المدير بتغييره يدوياً.'
              : 'Ce fichier Google Sheets reste enregistré de façon permanente dans l’application.'}
          </p>
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-200 block text-xs">{spreadsheetTitle}</span>
              <span className="text-[10px] text-slate-500 font-mono">{spreadsheetId || 'لم يتم الربط بعد'}</span>
            </div>
            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                <span>Google Sheets</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Section 1: Identity */}
        <div className="space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
            <Store className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'الهوية التجارية للمحل' : 'Identité Commerciale'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">{isAr ? 'اسم المحل (بالعربية):' : 'Nom du Magasin:'}</label>
              <input
                type="text"
                required
                value={formData.Store_Name}
                onChange={(e) => setFormData({ ...formData, Store_Name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-slate-300 font-semibold block mb-1">{isAr ? 'الاسم التجاري القانوني (Société / Raison):' : 'Raison Sociale:'}</label>
              <input
                type="text"
                required
                value={formData.Commercial_Name}
                onChange={(e) => setFormData({ ...formData, Commercial_Name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block mb-1">{isAr ? 'رابط الشعار (Logo URL):' : 'URL du Logo:'}</label>
              <input
                type="text"
                value={formData.Logo_URL}
                onChange={(e) => setFormData({ ...formData, Logo_URL: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">{isAr ? 'العملة المعتمدة:' : 'Devise:'}</label>
              <input
                type="text"
                disabled
                value="MAD (درهم مغربي)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-400 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Location */}
        <div className="space-y-3 pt-2">
          <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
            <span>{isAr ? 'العنوان وبيانات الاتصال' : 'Coordonnées'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">{isAr ? 'الهاتف:' : 'Téléphone:'}</label>
              <input
                type="text"
                value={formData.Phone}
                onChange={(e) => setFormData({ ...formData, Phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">{isAr ? 'البريد الإلكتروني للمحل:' : 'Email Magasin:'}</label>
              <input
                type="email"
                value={formData.Email}
                onChange={(e) => setFormData({ ...formData, Email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">{isAr ? 'المدينة:' : 'Ville:'}</label>
              <input
                type="text"
                value={formData.City}
                onChange={(e) => setFormData({ ...formData, City: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">{isAr ? 'العنوان الجغرافي الكامل:' : 'Adresse complète:'}</label>
            <input
              type="text"
              value={formData.Address}
              onChange={(e) => setFormData({ ...formData, Address: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>
        </div>

        {/* Section 3: Tax & Legal */}
        <div className="space-y-3 pt-2">
          <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
            <span>{isAr ? 'البيانات الجبائية والضريبية المغربية' : 'Informations Fiscales'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block mb-1">{isAr ? 'المعرفات (IF / ICE / RC):' : 'IF / ICE / RC:'}</label>
              <input
                type="text"
                value={formData.Tax_ID}
                onChange={(e) => setFormData({ ...formData, Tax_ID: e.target.value })}
                placeholder="IF: 45892104 | ICE: 002341982000045 | RC: 89412"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">{isAr ? 'الرخص والضمان الاجتماعي (Patente / CNSS):' : 'Patente / CNSS:'}</label>
              <input
                type="text"
                value={formData.Legal_Info}
                onChange={(e) => setFormData({ ...formData, Legal_Info: e.target.value })}
                placeholder="Patente: 289410 - CNSS: 9812401"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px]"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Invoice Footer & Conditions */}
        <div className="space-y-3 pt-2">
          <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-slate-800 pb-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'نصوص الفواتير وشروط الضمان المطبوعة' : 'Textes de Facturation'}</span>
          </h3>

          <div>
            <label className="text-slate-400 block mb-1">{isAr ? 'شروط البيع والضمان (Conditions):' : 'Conditions de vente:'}</label>
            <textarea
              rows={2}
              value={formData.Invoice_Conditions}
              onChange={(e) => setFormData({ ...formData, Invoice_Conditions: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white leading-relaxed"
            />
          </div>

          <div>
            <label className="text-slate-400 block mb-1">{isAr ? 'تذييل الفاتورة الترحيبي (Footer):' : 'Pied de page:'}</label>
            <input
              type="text"
              value={formData.Invoice_Footer}
              onChange={(e) => setFormData({ ...formData, Invoice_Footer: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-800">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
          >
            <Save className="w-4 h-4" />
            <span>{isAr ? 'حفظ إعدادات وبيانات الدخول' : 'Enregistrer'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
