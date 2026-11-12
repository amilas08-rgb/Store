/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  TrendingUp,
  DollarSign,
  Package,
  ShoppingCart,
  AlertTriangle,
  AlertOctagon,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Clock,
  CheckCircle2,
  Receipt,
  Truck,
  PlusCircle,
  Database,
  Layers,
  Bell,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldAlert,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const {
    language,
    products,
    suppliers,
    salesInvoices,
    purchaseInvoices,
    expenses,
    activeCashSession,
    setActiveView,
    syncNow,
    syncStatus,
    lastSyncTime,
    spreadsheetTitle,
    spreadsheetUrl
  } = useStore();

  const isAr = language === 'ar';

  // Notification system local states
  const [isNotificationExpanded, setIsNotificationExpanded] = useState(true);
  const [notificationFilter, setNotificationFilter] = useState<'ALL' | 'OUT' | 'LOW'>('ALL');
  const [restockSuccessModal, setRestockSuccessModal] = useState<string | null>(null);

  // Financial calculations
  const totalSalesRevenue = salesInvoices.reduce((acc, inv) => acc + (inv.Total || 0), 0);
  const totalPurchases = purchaseInvoices.reduce((acc, inv) => acc + (inv.Total || 0), 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + (exp.Amount || 0), 0);

  // Gross profit calculation
  const estimatedGrossProfit = totalSalesRevenue > 0 ? (totalSalesRevenue * 0.28) : 0;
  const netProfit = estimatedGrossProfit - totalExpenses;

  // Inventory valuation
  const totalStockItems = products.reduce((acc, p) => acc + (p.Current_Stock || 0), 0);
  const stockCostValue = products.reduce((acc, p) => acc + ((p.Current_Stock || 0) * (p.Average_Purchase_Cost || p.Last_Purchase_Price || 0)), 0);
  const stockRetailValue = products.reduce((acc, p) => acc + ((p.Current_Stock || 0) * (p.Current_Selling_Price || 0)), 0);

  // Low stock products calculation (Current_Stock <= Minimum_Stock)
  const lowStockProducts = products.filter(p => p.Current_Stock <= p.Minimum_Stock);
  const outOfStockCount = lowStockProducts.filter(p => p.Current_Stock <= 0).length;
  const criticalLowCount = lowStockProducts.filter(p => p.Current_Stock > 0).length;
  const totalDeficitUnits = lowStockProducts.reduce((acc, p) => acc + Math.max(0, p.Minimum_Stock - p.Current_Stock), 0);
  const estimatedRestockBudget = lowStockProducts.reduce((acc, p) => {
    const deficit = Math.max(0, p.Minimum_Stock - p.Current_Stock);
    const unitCost = p.Average_Purchase_Cost || p.Last_Purchase_Price || 0;
    return acc + (deficit * unitCost);
  }, 0);

  // Filtered notifications
  const displayedAlertProducts = lowStockProducts.filter(p => {
    if (notificationFilter === 'OUT') return p.Current_Stock <= 0;
    if (notificationFilter === 'LOW') return p.Current_Stock > 0;
    return true;
  });

  // Today's sales
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = salesInvoices.filter(inv => (inv.Invoice_Date || inv.Created_At).startsWith(todayStr));
  const todayRevenue = todaySales.reduce((acc, inv) => acc + (inv.Total || 0), 0);

  const getSupplierInfo = (supplierId: string) => {
    return suppliers.find(s => s.Supplier_ID === supplierId);
  };

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white">
            {isAr ? 'لوحة التحكم والنشاط التجاري' : 'Tableau de Bord Commercial'}
          </h2>
          <div className="flex items-center gap-2 text-xs md:text-sm text-slate-400 mt-0.5">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-medium">{spreadsheetTitle}</span>
            </span>
            <span>•</span>
            <span className="text-slate-500 font-mono text-xs">
              {isAr ? `آخر مزامنة: ${lastSyncTime || 'الآن'}` : `Synchro: ${lastSyncTime || 'Maintenant'}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveView('pos')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs md:text-sm font-black shadow-lg shadow-amber-500/20 transition-all"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{isAr ? 'نقطة البيع (POS)' : 'Nouvelle Vente'}</span>
          </button>

          <button
            onClick={() => setActiveView('purchases')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
          >
            <Truck className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'فاتورة شراء' : 'Nouvel Achat'}</span>
          </button>

          <button
            onClick={() => setActiveView('products')}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'إضافة منتج' : 'Nouveau Produit'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VISUAL NOTIFICATION SYSTEM FOR PRODUCTS BELOW MINIMUM THRESHOLD (GOOGLE SHEETS) */}
      {/* ========================================================================= */}
      {lowStockProducts.length > 0 ? (
        <div className="relative rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-amber-950/30 border-2 border-rose-500/40 shadow-2xl overflow-hidden transition-all">
          {/* Animated Glow Border Top */}
          <div className="h-1.5 w-full bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 animate-pulse" />

          {/* Notification Header Banner */}
          <div className="p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rose-500/20">
            <div className="flex items-start md:items-center gap-3.5">
              {/* Alert Pulsing Bell Icon */}
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
                  <Bell className="w-6 h-6 animate-bounce" />
                </div>
                <span className="absolute -top-1 -end-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[9px] font-bold text-white items-center justify-center font-mono">
                    !
                  </span>
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                    <span>{isAr ? 'نظام التنبيهات الذكي: عجز وانخفاض المخزون' : 'Alerte Seuil de Réapprovisionnement'}</span>
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono">
                    {lowStockProducts.length} {isAr ? 'منتجات تحتاج تدخلاً' : 'articles critiques'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="text-slate-400">
                    {isAr
                      ? 'تم رصد منتجات تجاوزت الحد الأدنى للمخزون استناداً إلى البيانات المحدثة من ورقة'
                      : 'Produits sous le seuil minimum synchronisés depuis'}
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                    <Database className="w-3 h-3 text-emerald-400" />
                    Google Sheets (PRODUCTS)
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Metrics & Controls */}
            <div className="flex items-center gap-2 flex-wrap self-end md:self-auto">
              {/* Quick sync button */}
              <button
                onClick={syncNow}
                disabled={syncStatus === 'syncing'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shadow transition-colors"
                title={isAr ? 'تحديث فوري للمخزون من Google Sheets' : 'Recharger depuis Google Sheets'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin text-amber-400' : 'text-emerald-400'}`} />
                <span className="hidden sm:inline">{isAr ? 'تحديث المخزون' : 'Actualiser'}</span>
              </button>

              {/* Bulk order button */}
              <button
                onClick={() => setActiveView('purchases')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-md transition-all"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>{isAr ? 'إصدار سند شراء مجمع' : 'Commande Groupée'}</span>
              </button>

              {/* Collapse/Expand Toggle */}
              <button
                onClick={() => setIsNotificationExpanded(prev => !prev)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition-colors"
                title={isNotificationExpanded ? (isAr ? 'طي التنبيه' : 'Réduire') : (isAr ? 'توسيع التنبيه' : 'Déplier')}
              >
                {isNotificationExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Expandable Notification Content */}
          {isNotificationExpanded && (
            <div className="p-4 md:p-5 space-y-4">
              {/* Filter Pills & Budget Indicator */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 overflow-x-auto">
                  <span className="text-slate-400 font-semibold">{isAr ? 'تصفية التنبيهات:' : 'Filtrer:'}</span>
                  <button
                    onClick={() => setNotificationFilter('ALL')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                      notificationFilter === 'ALL'
                        ? 'bg-rose-500 text-white'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {isAr ? 'الكل' : 'Tous'} ({lowStockProducts.length})
                  </button>
                  <button
                    onClick={() => setNotificationFilter('OUT')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                      notificationFilter === 'OUT'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800/80 text-rose-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>{isAr ? 'نافذ تماماً (0 قطع)' : 'En Rupture'}</span> ({outOfStockCount})
                  </button>
                  <button
                    onClick={() => setNotificationFilter('LOW')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 ${
                      notificationFilter === 'LOW'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800/80 text-amber-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>{isAr ? 'تحت الحد الأدنى' : 'Stock Bas'}</span> ({criticalLowCount})
                  </button>
                </div>

                {/* Restock Budget Hint */}
                <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 px-3 py-1.5 rounded-xl self-start sm:self-auto font-mono text-[11px]">
                  <span className="text-slate-400">{isAr ? 'الميزانية التقديرية لسد العجز:' : 'Budget réappro estimé:'}</span>
                  <span className="font-bold text-amber-400">~{estimatedRestockBudget.toFixed(2)} MAD</span>
                  <span className="text-slate-500">({totalDeficitUnits} {isAr ? 'قطعة' : 'u'})</span>
                </div>
              </div>

              {/* Product Cards Grid with Progress Bars */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {displayedAlertProducts.map(prod => {
                  const isOutOfStock = prod.Current_Stock <= 0;
                  const deficit = Math.max(0, prod.Minimum_Stock - prod.Current_Stock);
                  const supplier = getSupplierInfo(prod.Last_Supplier_ID || prod.First_Supplier_ID);
                  const percentage = prod.Minimum_Stock > 0
                    ? Math.min(100, Math.round((prod.Current_Stock / prod.Minimum_Stock) * 100))
                    : 0;

                  return (
                    <div
                      key={prod.Product_ID}
                      className={`relative bg-slate-950/90 rounded-xl p-3.5 border transition-all flex flex-col justify-between group ${
                        isOutOfStock
                          ? 'border-rose-500/50 shadow-md shadow-rose-950/40 hover:border-rose-400'
                          : 'border-amber-500/40 hover:border-amber-400'
                      }`}
                    >
                      {/* Top Row: Thumbnail + Identity */}
                      <div>
                        <div className="flex items-start gap-3">
                          <div className="relative w-14 h-14 rounded-xl bg-slate-900 overflow-hidden shrink-0 border border-slate-800">
                            <img
                              src={prod.Image_URL || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&auto=format&fit=crop&q=80'}
                              alt={prod.Product_Name_AR}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {isOutOfStock ? (
                              <span className="absolute inset-0 bg-rose-950/80 backdrop-blur-[1px] flex items-center justify-center text-[10px] font-black text-rose-200">
                                {isAr ? '0 قطع' : 'Épuisé'}
                              </span>
                            ) : null}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[10px] font-mono font-bold text-amber-400">
                                {prod.Internal_Reference}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                isOutOfStock
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}>
                                {isOutOfStock ? (isAr ? 'نافذ تماماً' : 'Rupture') : (isAr ? 'مخزون حرج' : 'Seuil atteint')}
                              </span>
                            </div>

                            <h4 className="text-xs font-bold text-slate-100 truncate mt-0.5" title={prod.Product_Name_AR}>
                              {isAr ? prod.Product_Name_AR : (prod.Product_Name_FR || prod.Product_Name_AR)}
                            </h4>

                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {supplier ? `${isAr ? 'المورد:' : 'Fourn:'} ${supplier.Supplier_Name}` : `${isAr ? 'الصنف:' : 'Réf:'} ${prod.Original_Reference || 'عام'}`}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar & Deficit Info */}
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-400">
                              {isAr ? 'المتوفر الآن:' : 'Actuel:'}{' '}
                              <strong className={isOutOfStock ? 'text-rose-400' : 'text-amber-400'}>
                                {prod.Current_Stock}
                              </strong>{' '}
                              / {prod.Minimum_Stock}
                            </span>
                            <span className="text-rose-400 font-bold">
                              {isAr ? `عجز: ${deficit} ${prod.Unit}` : `Manque: ${deficit}`}
                            </span>
                          </div>

                          {/* Progress Track */}
                          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isOutOfStock ? 'bg-rose-600 w-0' : 'bg-gradient-to-r from-rose-500 to-amber-500'
                              }`}
                              style={{ width: `${Math.max(percentage, isOutOfStock ? 0 : 8)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Bottom Actions Row */}
                      <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-xs">
                        <div className="text-[11px]">
                          <span className="text-slate-500 block text-[9px]">{isAr ? 'سعر الشراء المعتمد:' : 'Coût d’achat:'}</span>
                          <span className="font-mono text-slate-300 font-bold">
                            {(prod.Average_Purchase_Cost || prod.Last_Purchase_Price || 0).toFixed(2)} MAD
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setActiveView('purchases')}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 font-bold text-[11px] transition-colors"
                            title={isAr ? 'إنشاء طلب شراء فوري لهذا المنتج' : 'Réapprovisionner'}
                          >
                            <Truck className="w-3 h-3" />
                            <span>{isAr ? 'طلب توريد' : 'Commander'}</span>
                          </button>

                          <button
                            onClick={() => setActiveView('products')}
                            className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-white transition-colors"
                            title={isAr ? 'عرض بطاقة المنتج' : 'Voir Fiche'}
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Inventory Healthy State Banner */
        <div className="rounded-2xl bg-slate-900/80 border border-emerald-500/30 p-4 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{isAr ? 'المخزون سليم ومطابق للحدود الدنيا' : 'Niveaux de Stock Conformes'}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400">
                  Google Sheets Synced
                </span>
              </h4>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'لا توجد حالياً أي منتجات تحت حد الطلب الأدنى. جميع الكميات تغطي حركة المبيعات.'
                  : 'Tous les articles sont au-dessus de leur seuil de réapprovisionnement.'}
              </p>
            </div>
          </div>

          <button
            onClick={syncNow}
            disabled={syncStatus === 'syncing'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline">{isAr ? 'فحص الآن' : 'Vérifier'}</span>
          </button>
        </div>
      )}


      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CA / Sales Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'رقم المعاملات (CA)' : "Chiffre d'Affaires"}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {totalSalesRevenue.toFixed(2)} <span className="text-xs text-slate-400">MAD</span>
          </div>
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{isAr ? `مبيعات اليوم: ${todayRevenue.toFixed(2)} MAD` : `Aujourd'hui: ${todayRevenue.toFixed(2)} MAD`}</span>
          </div>
        </div>

        {/* Real Net Profit Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'صافي الأرباح المحققة' : 'Bénéfice Net Réel'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {netProfit.toFixed(2)} <span className="text-xs text-slate-400">MAD</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {isAr ? `هامش الربح الإجمالي: ~${estimatedGrossProfit.toFixed(2)} MAD` : `Marge brute: ~${estimatedGrossProfit.toFixed(2)} MAD`}
          </p>
        </div>

        {/* Inventory Value Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'قيمة بضاعة المخزون' : 'Valeur du Stock'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {stockCostValue.toFixed(2)} <span className="text-xs text-slate-400">MAD</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {isAr ? `${totalStockItems} قطعة متوفرة في المحل` : `${totalStockItems} pièces en stock`}
          </p>
        </div>

        {/* Cash Register / Drawer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400">
              {isAr ? 'سيولة الصندوق (Caisse)' : 'Trésorerie Caisse'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {activeCashSession ? activeCashSession.Opening_Balance.toFixed(2) : '0.00'}{' '}
            <span className="text-xs text-slate-400">MAD</span>
          </div>
          <div className="mt-2 text-xs flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${activeCashSession ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span className={activeCashSession ? 'text-emerald-400' : 'text-rose-400'}>
              {activeCashSession ? (isAr ? 'الوردية جارية' : 'Caisse ouverte') : (isAr ? 'الوردية مغلقة' : 'Fermée')}
            </span>
          </div>
        </div>
      </div>

      {/* Middle row: Low stock alerts & Recent Sales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Alerts (1 col) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="font-bold text-white text-sm">
                {isAr ? 'تنبيهات انخفاض المخزون' : 'Alertes Stock Faible'}
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 font-mono">
              {lowStockProducts.length}
            </span>
          </div>

          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400 opacity-60" />
              <p>{isAr ? 'جميع مستويات المخزون ممتازة' : 'Tous les stocks sont à niveau.'}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {lowStockProducts.slice(0, 5).map(prod => (
                <div
                  key={prod.Product_ID}
                  onClick={() => setActiveView('inventory')}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between hover:border-rose-500/40 cursor-pointer transition-colors"
                >
                  <div className="truncate me-2">
                    <p className="text-xs font-bold text-slate-200 truncate">{prod.Product_Name_AR}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{prod.Internal_Reference}</p>
                  </div>
                  <div className="text-end shrink-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400">
                      {prod.Current_Stock} / {prod.Minimum_Stock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Invoices (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-white text-sm">
                {isAr ? 'أحدث فواتير البيع المسجلة' : 'Dernières Ventes'}
              </h3>
            </div>
            <button
              onClick={() => setActiveView('sales')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              {isAr ? 'عرض الكل' : 'Voir tout'}
            </button>
          </div>

          {salesInvoices.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
              <p>{isAr ? 'لم تسجل أي فواتير بيع بعد. ابدأ بيع أول فاتورة من نقطة البيع POS' : 'Aucune facture de vente pour le moment.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-2 text-start">{isAr ? 'رقم الفاتورة' : 'N° Facture'}</th>
                    <th className="pb-2 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="pb-2 text-start">{isAr ? 'طريقة الأداء' : 'Paiement'}</th>
                    <th className="pb-2 text-end">{isAr ? 'المجموع' : 'Total'}</th>
                    <th className="pb-2 text-end">{isAr ? 'الحالة' : 'État'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {salesInvoices.slice(0, 6).map(inv => (
                    <tr key={inv.Sales_Invoice_ID} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 font-mono font-bold text-slate-200">{inv.Invoice_Number}</td>
                      <td className="py-2.5 text-slate-400">
                        {new Date(inv.Invoice_Date || inv.Created_At).toLocaleDateString('ar-MA')}
                      </td>
                      <td className="py-2.5 text-slate-300">{inv.Payment_Method}</td>
                      <td className="py-2.5 text-end font-bold text-amber-400 font-mono">
                        {inv.Total.toFixed(2)} MAD
                      </td>
                      <td className="py-2.5 text-end">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                          {inv.Status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
