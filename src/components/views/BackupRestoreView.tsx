/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { History, Download, Upload, ShieldCheck, Database, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

export const BackupRestoreView: React.FC = () => {
  const {
    language,
    products,
    suppliers,
    customers,
    salesInvoices,
    salesItems,
    purchaseInvoices,
    purchaseItems,
    expenses,
    cashSessions,
    auditLogs,
    storeSettings
  } = useStore();

  const isAr = language === 'ar';
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  // Export full JSON database
  const handleExportBackup = () => {
    const backupData = {
      backupDate: new Date().toISOString(),
      storeName: storeSettings.Store_Name,
      version: '1.0.0',
      data: {
        STORE_SETTINGS: storeSettings,
        PRODUCTS: products,
        SUPPLIERS: suppliers,
        CUSTOMERS: customers,
        SALES_INVOICES: salesInvoices,
        SALES_ITEMS: salesItems,
        PURCHASE_INVOICES: purchaseInvoices,
        PURCHASE_ITEMS: purchaseItems,
        EXPENSES: expenses,
        CASH_SESSIONS: cashSessions,
        AUDIT_LOGS: auditLogs
      }
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `STOREFLOW_BACKUP_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.data || !json.data.PRODUCTS) {
          alert('ملف النسخة الاحتياطية غير صالح أو تالف');
          return;
        }

        if (confirm('تنبيه: هل أنت متأكد من استعادة هذه النسخة الاحتياطية؟ سيتم تحديث الجداول بالسجلات المسترجعة.')) {
          // Restore to localStorage
          if (json.data.PRODUCTS) localStorage.setItem('storeflow_products', JSON.stringify(json.data.PRODUCTS));
          if (json.data.SALES_INVOICES) localStorage.setItem('storeflow_sales', JSON.stringify(json.data.SALES_INVOICES));
          if (json.data.SUPPLIERS) localStorage.setItem('storeflow_suppliers', JSON.stringify(json.data.SUPPLIERS));
          if (json.data.CUSTOMERS) localStorage.setItem('storeflow_customers', JSON.stringify(json.data.CUSTOMERS));
          if (json.data.EXPENSES) localStorage.setItem('storeflow_expenses', JSON.stringify(json.data.EXPENSES));

          setRestoreStatus('تمت الاستعادة بنجاح! سيتم تحديث الصفحة لتطبيق البيانات.');
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (err: any) {
        alert(`خطأ في قراءة الملف: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
          <History className="w-6 h-6 text-amber-400" />
          <span>{isAr ? 'النسخ الاحتياطي والاستعادة (Backup & Restore)' : 'Sauvegarde & Restauration'}</span>
        </h2>
        <p className="text-xs md:text-sm text-slate-400">
          {isAr
            ? 'تصدير لقطة كاملة لجميع جداول النظام وسجلات المحل لضمان الأمان وعدم فقدان البيانات'
            : 'Sauvegardez l’intégralité de vos données en toute sécurité'}
        </p>
      </div>

      {restoreStatus && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{restoreStatus}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* EXPORT BACKUP */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">
                {isAr ? 'تصدير نسخة احتياطية كاملة' : 'Exporter une Sauvegarde'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed my-3">
              {isAr
                ? 'تحميل ملف JSON كامل يحتوي على جميع الجداول (المنتجات، المبيعات، المشتريات، الموردين، الزبائن، وسجل التدقيق) مع تاريخ ووقت محدد.'
                : 'Téléchargez une archive complète au format JSON.'}
            </p>
          </div>

          <button
            onClick={handleExportBackup}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>{isAr ? 'تحميل ملف النسخة الاحتياطية (JSON)' : 'Télécharger la Sauvegarde'}</span>
          </button>
        </div>

        {/* RESTORE BACKUP */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-base">
                {isAr ? 'استعادة نسخة احتياطية سابقة' : 'Restaurer une Sauvegarde'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed my-3">
              {isAr
                ? 'استرجاع ملف نسخة احتياطية تم تصديره مسبقاً. سيطلب النظام تأكيدك قبل تطبيق أي استبدال للبيانات.'
                : 'Importez un fichier de sauvegarde précédemment téléchargé.'}
            </p>
          </div>

          <label className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 cursor-pointer transition-all">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'اختيار ملف الاستعادة (JSON)' : 'Sélectionner le fichier JSON'}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileRestore}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
};
