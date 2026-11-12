/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { TABLE_DEFINITIONS, SCHEMA_VERSION } from '../../services/schema';
import { GoogleSheetsService } from '../../services/googleSheetsApi';
import { APPS_SCRIPT_SOURCE_CODE } from '../../services/appsScriptTemplate';
import {
  Database,
  RefreshCw,
  PlusCircle,
  Link2,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  ExternalLink,
  Code,
  Copy,
  Check,
  ShieldCheck,
  Wrench,
  Search,
  Sparkles,
  Server,
  UploadCloud,
  Layers,
  ArrowUpRight
} from 'lucide-react';

export const DatabaseConnectionView: React.FC = () => {
  const {
    language,
    isGoogleConnected,
    googleUser,
    loginGoogle,
    logoutGoogle,
    spreadsheetId,
    spreadsheetTitle,
    spreadsheetUrl,
    syncStatus,
    lastSyncTime,
    syncError,
    inspectionResult,
    connectSpreadsheet,
    createNewDatabase,
    repairDatabase,
    syncNow,
    pushAllDataToGoogleSheets,
    autoSyncEnabled,
    toggleAutoSync,
    disconnectSpreadsheet,
    storeSettings
  } = useStore();

  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'connect' | 'schema' | 'appsscript'>('connect');
  const [inputSpreadsheet, setInputSpreadsheet] = useState('');
  const [customStoreTitle, setCustomStoreTitle] = useState(storeSettings.Store_Name);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [userSheetsList, setUserSheetsList] = useState<{ id: string; name: string; modifiedTime: string }[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isPushingAll, setIsPushingAll] = useState(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; message: string; counts?: Record<string, number> } | null>(null);

  const handleManualPushAll = async () => {
    setIsPushingAll(true);
    setPushResult(null);
    try {
      const res = await pushAllDataToGoogleSheets();
      setPushResult(res);
    } catch (err: any) {
      setPushResult({ success: false, message: err.message || 'فشلت المزامنة' });
    } finally {
      setIsPushingAll(false);
    }
  };

  // Fetch user's Google Drive spreadsheets if connected
  useEffect(() => {
    if (isGoogleConnected) {
      import('../../services/firebaseAuth').then(async ({ getAccessToken }) => {
        const token = await getAccessToken();
        if (token) {
          GoogleSheetsService.listSpreadsheets(token)
            .then(sheets => setUserSheetsList(sheets))
            .catch(err => console.warn('Could not list drive spreadsheets:', err));
        }
      });
    }
  }, [isGoogleConnected]);

  const handleCreateNew = async () => {
    if (!isGoogleConnected) {
      await loginGoogle();
      return;
    }
    setLoadingAction('create');
    try {
      await createNewDatabase(customStoreTitle);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleConnectExisting = async (idToConnect?: string) => {
    const target = idToConnect || inputSpreadsheet;
    if (!target) return;
    setLoadingAction('connect');
    try {
      await connectSpreadsheet(target);
      setInputSpreadsheet('');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRepair = async () => {
    setLoadingAction('repair');
    try {
      await repairDatabase();
    } finally {
      setLoadingAction(null);
    }
  };

  const copyAppsScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_SOURCE_CODE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const allTables = Object.keys(TABLE_DEFINITIONS);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 end-0 p-8 opacity-10 pointer-events-none">
          <Database className="w-48 h-48 text-emerald-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Database className="w-6 h-6" />
              </span>
              <h2 className="text-xl md:text-2xl font-black text-white">
                {isAr ? 'إدارة وربط قاعدة بيانات Google Sheets' : 'Connexion & Gestion Google Sheets'}
              </h2>
            </div>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isAr
                ? 'يعتمد هذا النظام على Google Sheets كقاعدة البيانات المركزية والوحيدة لجميع العمليات التجارية والمخزنية والمالية بنفس معمارية AppSheet. يمكنك إنشاء ملف جديد تلقائياً أو ربط ملف قائم.'
                : 'Ce système utilise Google Sheets comme base de données centrale unique selon l’architecture AppSheet.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleManualPushAll}
              disabled={!spreadsheetId || isPushingAll || syncStatus === 'syncing'}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 cursor-pointer"
              title={isAr ? 'مزامنة يدوية تتيح للتطبيق تسجيل وتحديث كل العمليات في ملف Google Sheet المتصل' : 'Enregistrer et mettre à jour toutes les opérations dans Google Sheets'}
            >
              <UploadCloud className={`w-4 h-4 ${isPushingAll ? 'animate-bounce' : ''}`} />
              <span>
                {isPushingAll
                  ? (isAr ? 'جاري تسجيل كل العمليات في Google Sheet...' : 'Envoi en cours...')
                  : (isAr ? 'مزامنة يدوية وتسجيل كل العمليات في Google Sheet' : 'Pousser toutes les données vers Sheets')}
              </span>
            </button>

            <button
              onClick={toggleAutoSync}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                autoSyncEnabled
                  ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title={isAr ? 'المزامنة التلقائية الدورية وعقب كل تعديل' : 'Synchro automatique périodique'}
            >
              <span className={`w-2 h-2 rounded-full ${autoSyncEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{autoSyncEnabled ? (isAr ? 'مزامنة تلقائية: مفعلة' : 'Auto-Sync: Actif') : (isAr ? 'مزامنة تلقائية: معطلة' : 'Auto-Sync: Désactivé')}</span>
            </button>

            <button
              onClick={syncNow}
              disabled={!spreadsheetId || syncStatus === 'syncing' || isPushingAll}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all shadow disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span>{isAr ? 'تحديث قراءة البيانات' : 'Actualiser'}</span>
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-6 pt-4 border-t border-slate-700/60 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">{isAr ? 'حساب Google:' : 'Compte Google:'}</span>
            <span className="font-semibold text-white">
              {isGoogleConnected && googleUser ? (googleUser.email || googleUser.displayName) : (isAr ? 'غير مسجل' : 'Non connecté')}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">{isAr ? 'ملف قاعدة البيانات:' : 'Fichier Database:'}</span>
            <span className="font-semibold text-emerald-400 truncate block">
              {spreadsheetId ? spreadsheetTitle : (isAr ? 'لم يتم الربط بعد' : 'Non connecté')}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">{isAr ? 'حالة المزامنة:' : 'État de Synchro:'}</span>
            <span className="font-semibold text-amber-400">
              {syncStatus === 'syncing' ? (isAr ? 'جاري المزامنة...' : 'Synchronisation...') :
               syncStatus === 'synced' ? (isAr ? 'متصل ومتزامن' : 'Connecté & Synchronisé') :
               syncStatus === 'error' ? (isAr ? 'خطأ في الاتصال' : 'Erreur') : (isAr ? 'جاهز' : 'Prêt')}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block">{isAr ? 'آخر مزامنة ناجحة:' : 'Dernière synchro:'}</span>
            <span className="font-mono text-slate-300">
              {lastSyncTime || (isAr ? 'غير متوفر' : 'Aucune')}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('connect')}
          className={`pb-3 px-4 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'connect'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>{isAr ? 'الاتصال والخيارات (Options A & B)' : 'Options de Connexion'}</span>
        </button>

        <button
          onClick={() => setActiveTab('schema')}
          className={`pb-3 px-4 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'schema'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{isAr ? `فحص الجداول الـ 20+ (${allTables.length})` : `Tables & Schéma (${allTables.length})`}</span>
        </button>

        <button
          onClick={() => setActiveTab('appsscript')}
          className={`pb-3 px-4 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'appsscript'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>{isAr ? 'Google Apps Script Backend' : 'Apps Script API'}</span>
        </button>
      </div>

      {/* TAB 1: CONNECT */}
      {activeTab === 'connect' && (
        <div className="space-y-6">
          {/* Active Connected Database Card */}
          {spreadsheetId && (
            <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">{spreadsheetTitle}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Active Database
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {spreadsheetId}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {spreadsheetUrl && (
                  <a
                    href={spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{isAr ? 'فتح في Google Sheets' : 'Ouvrir'}</span>
                  </a>
                )}
                <button
                  onClick={disconnectSpreadsheet}
                  className="px-3 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 text-xs font-semibold border border-rose-500/30"
                >
                  {isAr ? 'قطع الارتباط' : 'Déconnecter'}
                </button>
              </div>
            </div>
          )}

          {/* DEDICATED MANUAL FULL SYNC & PUSH TO GOOGLE SHEETS CARD */}
          {spreadsheetId && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/40 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <UploadCloud className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-white text-base md:text-lg">
                      {isAr ? 'مزامنة يدوية وتحديث شامل لكل العمليات في Google Sheet' : 'Synchronisation Manuelle Complète vers Google Sheets'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    {isAr
                      ? 'تتيح لك هذه الميزة تسجيل وتحديث كل العمليات التي تمت في التطبيق (فواتير المبيعات، فواتير الشراء، المنتجات والأسعار، المخزون، الموردين، العملاء، المصاريف، والعمليات البنكية) وحفظها فوراً داخل ملف Google Sheet المتصل لتكون البيانات متطابقة 100%.'
                      : 'Enregistrez et mettez à jour immédiatement toutes les opérations (ventes, achats, stocks, tiers, dépenses, banques) dans votre feuille Google Sheets.'}
                  </p>
                </div>

                <button
                  onClick={handleManualPushAll}
                  disabled={isPushingAll || syncStatus === 'syncing'}
                  className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-xl shadow-emerald-500/20 active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <UploadCloud className={`w-5 h-5 ${isPushingAll ? 'animate-bounce' : ''}`} />
                  <span>
                    {isPushingAll
                      ? (isAr ? 'جاري تسجيل وتحديث العمليات...' : 'Mise à jour en cours...')
                      : (isAr ? 'تسجيل وتحديث كل العمليات في Google Sheet الآن' : 'Pousser toutes les données')}
                  </span>
                </button>
              </div>

              {/* Push result alert */}
              {pushResult && (
                <div className={`p-4 rounded-xl border text-xs animate-in fade-in space-y-2 ${
                  pushResult.success
                    ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-950/50 border-rose-500/40 text-rose-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>{pushResult.message}</span>
                    </div>
                    {spreadsheetUrl && (
                      <a
                        href={spreadsheetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-500/30"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{isAr ? 'معاينة في Google Sheets' : 'Voir dans Sheets'}</span>
                      </a>
                    )}
                  </div>

                  {pushResult.counts && (
                    <div className="pt-2 border-t border-emerald-500/20 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-mono">
                      <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">{isAr ? 'المنتجات' : 'Produits'}</span>
                        <span className="font-bold text-emerald-400 text-sm">{pushResult.counts.products}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">{isAr ? 'فواتير البيع' : 'Ventes'}</span>
                        <span className="font-bold text-emerald-400 text-sm">{pushResult.counts.salesInvoices}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">{isAr ? 'فواتير الشراء' : 'Achats'}</span>
                        <span className="font-bold text-emerald-400 text-sm">{pushResult.counts.purchaseInvoices}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">{isAr ? 'الموردون والعملاء' : 'Tiers'}</span>
                        <span className="font-bold text-emerald-400 text-sm">{pushResult.counts.suppliers + pushResult.counts.customers}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">{isAr ? 'المصاريف والبنوك' : 'Finances'}</span>
                        <span className="font-bold text-emerald-400 text-sm">{pushResult.counts.expenses + pushResult.counts.bankTransactions}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Option A & Option B side-by-side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* OPTION A: Create New Database */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-amber-500/40 transition-all shadow-lg">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    A
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      {isAr ? 'الخيار أ: إنشاء قاعدة بيانات جديدة' : 'Option A: Créer une Nouvelle Base'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isAr ? 'إنشاء ملف Google Sheets متكامل بجميع الجداول والأعمدة' : 'Génération automatique de toutes les 20+ tables'}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed my-4">
                  {isAr
                    ? 'سيقوم النظام فوراً بإنشاء ملف Google Sheets في حساب Google Drive الخاص بك، ويشمل جميع أوراق العمل المطلوبة (STORE_SETTINGS, PRODUCTS, INVOICES, STOCK, CASH, EXPENSES...) مع رؤوس الأعمدة الملونة والمثبتة وقيم التهيئة الأولية.'
                    : 'Crée un fichier Google Sheets complet dans votre Google Drive avec 20+ feuilles préconfigurées.'}
                </p>

                <div className="space-y-2 mb-4">
                  <label className="text-xs text-slate-400 font-medium block">
                    {isAr ? 'اسم المحل في عنوان الملف:' : 'Nom du magasin:'}
                  </label>
                  <input
                    type="text"
                    value={customStoreTitle}
                    onChange={(e) => setCustomStoreTitle(e.target.value)}
                    placeholder="مثال: متجر الصفوة للإلكترونيات"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                onClick={handleCreateNew}
                disabled={loadingAction === 'create'}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs md:text-sm shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                {loadingAction === 'create' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isAr ? 'جاري بناء وإنشاء 20+ ورقة عمل...' : 'Création en cours...'}</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>{isAr ? 'إنشاء ملف Google Sheets جديد تلقائياً' : 'Créer Automatiquement'}</span>
                  </>
                )}
              </button>
            </div>

            {/* OPTION B: Connect Existing Database */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/40 transition-all shadow-lg">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    B
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">
                      {isAr ? 'الخيار ب: ربط ملف Google Sheets قائم' : 'Option B: Connecter une Base Existante'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isAr ? 'ربط ملف موجود دون حذف أي بيانات سابقة' : 'Connexion et vérification non destructive'}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed my-4">
                  {isAr
                    ? 'أدخل رابط أو معرّف ملف Google Sheets الموجود في حسابك. سيقوم النظام بفحص الأوراق والأعمدة تلقائياً والتأكد من مطابقتها دون المساس بالبيانات القديمة.'
                    : 'Collez l’URL ou l’identifiant de votre feuille Google Sheets existante.'}
                </p>

                <div className="space-y-2 mb-4">
                  <label className="text-xs text-slate-400 font-medium block">
                    {isAr ? 'رابط الملف الكامل أو المعرف (Spreadsheet ID):' : 'URL ou ID de la feuille:'}
                  </label>
                  <input
                    type="text"
                    value={inputSpreadsheet}
                    onChange={(e) => setInputSpreadsheet(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                onClick={() => handleConnectExisting()}
                disabled={loadingAction === 'connect' || !inputSpreadsheet}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs md:text-sm shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {loadingAction === 'connect' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isAr ? 'جاري الفحص والربط...' : 'Vérification...'}</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-4 h-4" />
                    <span>{isAr ? 'فحص وربط الملف الموجود' : 'Connecter & Vérifier'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Select from User's Google Drive */}
          {userSheetsList.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'الملفات المكتشفة في Google Drive الخاص بك' : 'Fichiers détectés dans votre Google Drive'}</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {userSheetsList.slice(0, 6).map((sheet) => (
                  <div
                    key={sheet.id}
                    onClick={() => handleConnectExisting(sheet.id)}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div className="truncate me-2">
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-amber-400 truncate">
                        {sheet.name}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {new Date(sheet.modifiedTime).toLocaleDateString('ar-MA')}
                      </p>
                    </div>
                    <button className="px-2 py-1 rounded bg-slate-800 text-[10px] text-slate-300 group-hover:bg-amber-500 group-hover:text-slate-950 font-bold shrink-0">
                      {isAr ? 'ربط' : 'Lier'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SCHEMA & TABLES INSPECTION */}
      {activeTab === 'schema' && (
        <div className="space-y-5">
          {/* Repair Action bar if missing tables or columns */}
          {inspectionResult && (!inspectionResult.isValid) && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-xs text-amber-200">
                  <p className="font-bold">
                    {isAr ? 'تم اكتشاف أوراق أو أعمدة ناقصة في ملف Google Sheets' : 'Tables ou colonnes manquantes détectées'}
                  </p>
                  <p className="text-amber-300/80">
                    {isAr
                      ? `هناك ${inspectionResult.missingSheets.length} ورقة عمل ناقصة و ${inspectionResult.columnIssues.length} جداول تحتاج إضافة أعمدة جديدة.`
                      : 'Mise à niveau requise.'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleRepair}
                disabled={loadingAction === 'repair'}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shrink-0 shadow"
              >
                <Wrench className="w-4 h-4" />
                <span>{isAr ? 'إصلاح وترقية البنية دون حذف البيانات' : 'Mettre à niveau (Sans perte)'}</span>
              </button>
            </div>
          )}

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">
                  {isAr ? 'قائمة الجداول الـ 20+ وهيكلة الأعمدة' : 'Structure des 20+ Tables & Colonnes'}
                </h3>
                <p className="text-xs text-slate-400">Schema Version: {SCHEMA_VERSION}</p>
              </div>
              <span className="text-xs text-slate-400">
                {allTables.length} {isAr ? 'جدول معتمد' : 'tables'}
              </span>
            </div>

            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-950 text-slate-400 sticky top-0 border-b border-slate-800 z-10">
                  <tr>
                    <th className="py-2.5 px-4 text-start font-semibold">#</th>
                    <th className="py-2.5 px-4 text-start font-semibold">{isAr ? 'اسم الجدول' : 'Nom de Table'}</th>
                    <th className="py-2.5 px-4 text-start font-semibold">{isAr ? 'الوصف' : 'Description'}</th>
                    <th className="py-2.5 px-4 text-start font-semibold">{isAr ? 'عدد الأعمدة' : 'Colonnes'}</th>
                    <th className="py-2.5 px-4 text-start font-semibold">{isAr ? 'الحالة في Sheets' : 'État Sheets'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {allTables.map((tableName, idx) => {
                    const def = TABLE_DEFINITIONS[tableName];
                    const isMissing = inspectionResult?.missingSheets.includes(tableName);
                    const colIssue = inspectionResult?.columnIssues.find(c => c.sheetName === tableName);

                    return (
                      <tr key={tableName} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-4 font-bold font-mono text-amber-400">{tableName}</td>
                        <td className="py-2.5 px-4 text-slate-300">{def.description}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-300">
                          {def.columns.length} {isAr ? 'عمود' : 'cols'}
                        </td>
                        <td className="py-2.5 px-4">
                          {isMissing ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              <AlertTriangle className="w-3 h-3" />
                              {isAr ? 'ورقة ناقصة' : 'Feuille manquante'}
                            </span>
                          ) : colIssue ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              <Wrench className="w-3 h-3" />
                              {isAr ? `${colIssue.missingColumns.length} أعمدة ناقصة` : 'Colonnes manquantes'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              {isAr ? 'مطابق وسليم' : 'Conforme'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: APPS SCRIPT BACKEND CODE */}
      {activeTab === 'appsscript' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Server className="w-5 h-5 text-amber-400" />
                  <span>Google Apps Script Backend API (Code.gs)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr
                    ? 'كود الخادم الرسمي المجهز بـ LockService لقفل المعاملات الحساسة ومنع التضارب ومطابقة فلسفة AppSheet.'
                    : 'Code Apps Script officiel avec LockService pour la concurrence et les transactions atomiques.'}
                </p>
              </div>

              <button
                onClick={copyAppsScript}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition-all"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? (isAr ? 'تم النسخ!' : 'Copié!') : (isAr ? 'نسخ الكود بالكامل' : 'Copier Code.gs')}</span>
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1 mb-4 leading-relaxed">
              <p className="font-bold text-amber-400">{isAr ? 'خطوات النشر على Google Sheets:' : 'Instructions de déploiement:'}</p>
              <ol className="list-decimal list-inside space-y-0.5 text-slate-400">
                <li>{isAr ? 'افتح ملف Google Sheets الخاص بك من الرابط أعلاه.' : 'Ouvrez votre feuille Google Sheets.'}</li>
                <li>{isAr ? 'من القائمة العلوية اضغط على Extensions ثم Apps Script.' : 'Cliquez sur Extensions > Apps Script.'}</li>
                <li>{isAr ? 'احذف الكود الموجود والصق هذا الكود بالكامل في ملف Code.gs.' : 'Collez ce code dans Code.gs.'}</li>
                <li>{isAr ? 'اضغط Deploy > New deployment > اختر Web app > واضبط Access: Anyone with Google Account.' : 'Déployez en Web App.'}</li>
              </ol>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-300 font-mono text-xs overflow-x-auto max-h-[450px] leading-relaxed selection:bg-amber-500 selection:text-slate-950">
              {APPS_SCRIPT_SOURCE_CODE}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
