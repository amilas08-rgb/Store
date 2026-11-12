/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  FileBarChart2,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  DollarSign,
  Package,
  Receipt,
  Truck,
  Users,
  Layers,
  Loader2,
  FileText,
  Search,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Clock
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

type ReportTab = 'overview' | 'sales' | 'purchases' | 'inventory' | 'customers' | 'expenses';
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export const ReportsView: React.FC = () => {
  const {
    language,
    salesInvoices,
    salesItems,
    purchaseInvoices,
    purchaseItems,
    expenses,
    products,
    customers,
    suppliers,
    storeSettings
  } = useStore();

  const isAr = language === 'ar';
  const reportContainerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [dateFilter, setDateFilter] = useState<DateFilter>('month');
  const [customStartDate, setCustomStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  );
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Helper date filter
  const isDateInRange = (dateStr: string) => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    const now = new Date();

    if (dateFilter === 'all') return true;
    if (dateFilter === 'today') {
      const today = now.toISOString().slice(0, 10);
      return dateStr.startsWith(today);
    }
    if (dateFilter === 'week') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
      return date >= oneWeekAgo && date <= now;
    }
    if (dateFilter === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return date >= startOfMonth && date <= now;
    }
    if (dateFilter === 'year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return date >= startOfYear && date <= now;
    }
    if (dateFilter === 'custom') {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    }
    return true;
  };

  // Filtered Datasets
  const filteredSalesInvoices = salesInvoices.filter(inv => isDateInRange(inv.Invoice_Date || inv.Created_At));
  const filteredPurchases = purchaseInvoices.filter(inv => isDateInRange(inv.Invoice_Date || inv.Created_At));
  const filteredExpenses = expenses.filter(exp => isDateInRange(exp.Expense_Date || exp.Created_At));

  // KPIs
  const totalRevenue = filteredSalesInvoices.reduce((a, b) => a + (b.Total || 0), 0);
  const totalPurchasesAmount = filteredPurchases.reduce((a, b) => a + (b.Total || 0), 0);
  const totalExpensesAmount = filteredExpenses.reduce((a, b) => a + (b.Amount || 0), 0);

  // COGS for filtered sales
  const filteredSalesIds = new Set(filteredSalesInvoices.map(s => s.Sales_Invoice_ID));
  const relevantSalesItems = salesItems.filter(it => filteredSalesIds.has(it.Sales_Invoice_ID));
  const totalCOGS = relevantSalesItems.reduce((a, b) => a + (b.Quantity * (b.Purchase_Cost_At_Sale || 0)), 0);
  const grossProfit = totalRevenue - totalCOGS;
  const netProfit = grossProfit - totalExpensesAmount;

  // Inventory valuation
  const inventoryCostValuation = products.reduce((acc, p) => acc + (p.Current_Stock * (p.Average_Purchase_Cost || p.Last_Purchase_Price || 0)), 0);
  const inventoryRetailValuation = products.reduce((acc, p) => acc + (p.Current_Stock * (p.Current_Selling_Price || 0)), 0);
  const potentialInventoryProfit = Math.max(0, inventoryRetailValuation - inventoryCostValuation);

  // Customer total debts
  const totalCustomerDebts = customers.reduce((acc, c) => acc + Math.max(0, c.Current_Balance || 0), 0);
  // Supplier total debts
  const totalSupplierDebts = suppliers.reduce((acc, s) => acc + Math.max(0, s.Current_Balance || 0), 0);

  // CSV Exporter
  const exportToCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = async () => {
    if (!reportContainerRef.current) return;
    setIsExportingPDF(true);

    try {
      const element = reportContainerRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: document.documentElement.classList.contains('light') ? '#ffffff' : '#0f172a'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgWidth = 194;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 8, 10, imgWidth, Math.min(pdfHeight - 20, imgHeight));
      pdf.save(`Rapport_${activeTab}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err: any) {
      console.error('PDF export error:', err);
      alert(isAr ? 'حدث خطأ أثناء تصدير التقرير' : 'Erreur export PDF');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportCSV = () => {
    const dateTag = new Date().toISOString().slice(0, 10);
    if (activeTab === 'sales') {
      const headers = ['رقم الفاتورة', 'التاريخ', 'الزبون', 'طريقة الدفع', 'المجموع', 'المدفوع', 'الباقي', 'الحالة'];
      const rows = filteredSalesInvoices.map(s => [
        s.Invoice_Number,
        s.Invoice_Date || s.Created_At,
        customers.find(c => c.Customer_ID === s.Customer_ID)?.Customer_Name || s.Customer_ID,
        s.Payment_Method,
        s.Total,
        s.Paid_Amount,
        s.Remaining_Amount,
        s.Status
      ]);
      exportToCSV(`Rapport_Ventes_${dateTag}`, headers, rows);
    } else if (activeTab === 'purchases') {
      const headers = ['رقم الفاتورة', 'المورد', 'سند المورد', 'التاريخ', 'المجموع', 'المدفوع', 'الباقي', 'الحالة'];
      const rows = filteredPurchases.map(p => [
        p.Invoice_Number,
        suppliers.find(s => s.Supplier_ID === p.Supplier_ID)?.Supplier_Name || p.Supplier_ID,
        p.Supplier_Invoice_Number || '-',
        p.Invoice_Date || p.Created_At,
        p.Total,
        p.Paid_Amount,
        p.Remaining_Amount,
        p.Status
      ]);
      exportToCSV(`Rapport_Achats_${dateTag}`, headers, rows);
    } else if (activeTab === 'inventory') {
      const headers = ['المرجع', 'اسم المنتج', 'المخزون', 'الحد الأدنى', 'متوسط التكلفة', 'سعر البيع', 'قيمة المخزون'];
      const rows = products.map(p => [
        p.Internal_Reference,
        p.Product_Name_AR,
        p.Current_Stock,
        p.Minimum_Stock,
        p.Average_Purchase_Cost,
        p.Current_Selling_Price,
        (p.Current_Stock * (p.Average_Purchase_Cost || p.Last_Purchase_Price || 0)).toFixed(2)
      ]);
      exportToCSV(`Rapport_Stock_${dateTag}`, headers, rows);
    } else if (activeTab === 'customers') {
      const headers = ['العميل', 'الهاتف', 'المدينة', 'الدين الحالي'];
      const rows = customers.map(c => [
        c.Customer_Name,
        c.Phone,
        c.City,
        c.Current_Balance
      ]);
      exportToCSV(`Rapport_Clients_Dettes_${dateTag}`, headers, rows);
    } else {
      const headers = ['رقم النفقة', 'التاريخ', 'الفئة', 'البيان', 'المبلغ', 'طريقة الدفع'];
      const rows = filteredExpenses.map(e => [
        e.Expense_Number,
        e.Expense_Date || e.Created_At,
        e.Category,
        e.Description,
        e.Amount,
        e.Payment_Method
      ]);
      exportToCSV(`Rapport_Depenses_${dateTag}`, headers, rows);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <FileBarChart2 className="w-6 h-6 text-amber-400" />
            <span>{isAr ? 'مركز التقارير المحاسبية والإحصائيات المفصلة' : 'Rapports Financiers & Statistiques'}</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            {isAr
              ? 'تحليل شامل للمبيعات، المشتريات، حركة المخزون، ديون الزبائن، والمصاريف التشغيلية'
              : 'Analyse détaillée des ventes, achats, stocks et créances'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all"
          >
            {isExportingPDF ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{isAr ? 'جاري إنشاء PDF...' : 'Création PDF...'}</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                <span>{isAr ? 'تصدير التقرير PDF' : 'Télécharger PDF'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 shadow transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'تصدير Excel / CSV' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Date Filter & Tab Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800/80 pb-3 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{isAr ? 'النظرة المالية العامة (P&L)' : 'Vue Générale'}</span>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'sales'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>{isAr ? 'تقرير المبيعات التفصيلي' : 'Ventes Détaillées'}</span>
          </button>

          <button
            onClick={() => setActiveTab('purchases')}
            className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'purchases'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>{isAr ? 'تقرير المشتريات والتوريد' : 'Achats & Fournisseurs'}</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'inventory'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>{isAr ? 'تقرير تقييم المخزون' : 'Valorisation Stock'}</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'customers'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>{isAr ? 'ديون وأرصدة الزبائن' : 'Créances Clients'}</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
              activeTab === 'expenses'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>{isAr ? 'تقرير المصاريف والتشغيل' : 'Charges & Dépenses'}</span>
          </button>
        </div>

        {/* Date Filters Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-semibold me-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{isAr ? 'الفترة:' : 'Période:'}</span>
            </span>

            {(['today', 'week', 'month', 'year', 'all', 'custom'] as DateFilter[]).map(df => (
              <button
                key={df}
                onClick={() => setDateFilter(df)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  dateFilter === df
                    ? 'bg-slate-100 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                {df === 'today' && (isAr ? 'اليوم' : "Aujourd'hui")}
                {df === 'week' && (isAr ? 'هذا الأسبوع' : 'Cette semaine')}
                {df === 'month' && (isAr ? 'هذا الشهر' : 'Ce mois')}
                {df === 'year' && (isAr ? 'هذا العام' : 'Cette année')}
                {df === 'all' && (isAr ? 'كامل السجل' : 'Tout')}
                {df === 'custom' && (isAr ? 'فترة مخصصة' : 'Personnalisée')}
              </button>
            ))}
          </div>

          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
              />
              <span className="text-slate-500 font-mono">→</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
              />
            </div>
          )}
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div ref={reportContainerRef} className="space-y-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
        {/* Report Top Header */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
          <div>
            <h1 className="text-base font-black text-white">{storeSettings.Store_Name}</h1>
            <p className="text-[11px] text-amber-400">{storeSettings.Commercial_Name} - {storeSettings.City}</p>
          </div>
          <div className="text-end">
            <span className="text-slate-400 block font-mono">{new Date().toLocaleString('ar-MA')}</span>
            <span className="font-semibold text-emerald-400">
              {activeTab === 'overview' && (isAr ? 'التقرير المالي التنفيذي' : 'Bilan Financier')}
              {activeTab === 'sales' && (isAr ? 'تقرير المبيعات التفصيلي' : 'Rapport Ventes')}
              {activeTab === 'purchases' && (isAr ? 'تقرير المشتريات والتوريد' : 'Rapport Achats')}
              {activeTab === 'inventory' && (isAr ? 'تقرير تقييم المخزون' : 'Rapport Stock')}
              {activeTab === 'customers' && (isAr ? 'كشف ديون الزبائن' : 'Créances')}
              {activeTab === 'expenses' && (isAr ? 'تقرير المصاريف' : 'Dépenses')}
            </span>
          </div>
        </div>

        {/* Tab 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow">
                <span className="text-xs text-slate-400 block">{isAr ? 'إجمالي المبيعات (CA):' : 'Chiffre d’Affaires:'}</span>
                <span className="text-xl font-black text-white font-mono mt-1 block">{totalRevenue.toFixed(2)} MAD</span>
                <p className="text-[11px] text-slate-500 mt-1">{filteredSalesInvoices.length} {isAr ? 'فاتورة بيع' : 'factures'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow">
                <span className="text-xs text-slate-400 block">{isAr ? 'إجمالي المشتريات والتوريد:' : 'Total Achats:'}</span>
                <span className="text-xl font-black text-slate-200 font-mono mt-1 block">{totalPurchasesAmount.toFixed(2)} MAD</span>
                <p className="text-[11px] text-slate-500 mt-1">{filteredPurchases.length} {isAr ? 'فاتورة شراء' : 'factures'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow">
                <span className="text-xs text-slate-400 block">{isAr ? 'إجمالي المصاريف والتشغيل:' : 'Charges d’Exploitation:'}</span>
                <span className="text-xl font-black text-rose-400 font-mono mt-1 block">{totalExpensesAmount.toFixed(2)} MAD</span>
                <p className="text-[11px] text-slate-500 mt-1">{filteredExpenses.length} {isAr ? 'سند نفقة' : 'dépenses'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow">
                <span className="text-xs text-slate-400 block">{isAr ? 'صافي الأرباح المحققة:' : 'Résultat Net Réel:'}</span>
                <span className="text-xl font-black text-emerald-400 font-mono mt-1 block">{netProfit.toFixed(2)} MAD</span>
                <p className="text-[11px] text-emerald-400/80 mt-1">{isAr ? 'بعد خصم التكلفة والمصاريف' : 'Bénéfice net'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow">
                <span className="text-xs text-slate-400 block">{isAr ? 'تقييم المخزون الحالي (سعر الشراء):' : 'Valeur Stock Coût:'}</span>
                <span className="text-lg font-black text-amber-400 font-mono mt-1 block">{inventoryCostValuation.toFixed(2)} MAD</span>
                <p className="text-[11px] text-slate-500 mt-1">{products.length} {isAr ? 'صنف مسجل' : 'articles'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow">
                <span className="text-xs text-slate-400 block">{isAr ? 'ديون الزبائن بذمة المحل (Créances):' : 'Total Dettes Clients:'}</span>
                <span className="text-lg font-black text-cyan-400 font-mono mt-1 block">{totalCustomerDebts.toFixed(2)} MAD</span>
                <p className="text-[11px] text-slate-500 mt-1">{customers.filter(c => c.Current_Balance > 0).length} {isAr ? 'زبائن عليهم ديون' : 'clients débiteurs'}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow">
                <span className="text-xs text-slate-400 block">{isAr ? 'المتبقي للموردين (Dettes Fournisseurs):' : 'Dettes Fournisseurs:'}</span>
                <span className="text-lg font-black text-rose-400 font-mono mt-1 block">{totalSupplierDebts.toFixed(2)} MAD</span>
                <p className="text-[11px] text-slate-500 mt-1">{suppliers.filter(s => s.Current_Balance > 0).length} {isAr ? 'موردين ينتظرون الأداء' : 'fournisseurs'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: DETAILED SALES */}
        {activeTab === 'sales' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
              <h3 className="font-bold text-white text-sm">
                {isAr ? 'جدول المبيعات التفصيلي مع تفاصيل الأصناف والأرباح' : 'Détail des Ventes'}
              </h3>
              <span className="font-mono text-amber-400 font-bold">
                {isAr ? 'المجموع:' : 'Total:'} {totalRevenue.toFixed(2)} MAD
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 text-start">{isAr ? 'رقم الفاتورة' : 'N° Facture'}</th>
                    <th className="py-2.5 px-4 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="py-2.5 px-4 text-start">{isAr ? 'الزبون' : 'Client'}</th>
                    <th className="py-2.5 px-4 text-start">{isAr ? 'طريقة الدفع' : 'Paiement'}</th>
                    <th className="py-2.5 px-4 text-end">{isAr ? 'المجموع' : 'Total'}</th>
                    <th className="py-2.5 px-4 text-end">{isAr ? 'المدفوع' : 'Payé'}</th>
                    <th className="py-2.5 px-4 text-end">{isAr ? 'الباقي' : 'Reste'}</th>
                    <th className="py-2.5 px-4 text-center">{isAr ? 'الحالة' : 'État'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSalesInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        {isAr ? 'لا توجد فواتير بيع في الفترة المحددة' : 'Aucune vente trouvée'}
                      </td>
                    </tr>
                  ) : (
                    filteredSalesInvoices.map(inv => {
                      const cust = customers.find(c => c.Customer_ID === inv.Customer_ID);
                      return (
                        <tr key={inv.Sales_Invoice_ID} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-mono font-bold text-amber-400">{inv.Invoice_Number}</td>
                          <td className="py-2.5 px-4 text-slate-400">{new Date(inv.Invoice_Date || inv.Created_At).toLocaleDateString('ar-MA')}</td>
                          <td className="py-2.5 px-4 font-medium text-slate-200">{cust?.Customer_Name || 'زبون عادي'}</td>
                          <td className="py-2.5 px-4 text-slate-300">{inv.Payment_Method}</td>
                          <td className="py-2.5 px-4 text-end font-mono font-bold text-white">{inv.Total.toFixed(2)} MAD</td>
                          <td className="py-2.5 px-4 text-end font-mono text-emerald-400">{inv.Paid_Amount.toFixed(2)} MAD</td>
                          <td className="py-2.5 px-4 text-end font-mono text-rose-400">{inv.Remaining_Amount > 0 ? `${inv.Remaining_Amount.toFixed(2)} MAD` : '-'}</td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                              {inv.Status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: DETAILED PURCHASES */}
        {activeTab === 'purchases' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
              <h3 className="font-bold text-white text-sm">
                {isAr ? 'جدول المشتريات والتوريد مع بيانات الموردين' : 'Détail des Achats'}
              </h3>
              <span className="font-mono text-amber-400 font-bold">
                {isAr ? 'المجموع:' : 'Total:'} {totalPurchasesAmount.toFixed(2)} MAD
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 text-start">{isAr ? 'رقم الفاتورة' : 'N° Facture'}</th>
                    <th className="py-2.5 px-4 text-start">{isAr ? 'المورد' : 'Fournisseur'}</th>
                    <th className="py-2.5 px-4 text-start">{isAr ? 'سند المورد' : 'Réf BL'}</th>
                    <th className="py-2.5 px-4 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="py-2.5 px-4 text-end">{isAr ? 'المجموع' : 'Total'}</th>
                    <th className="py-2.5 px-4 text-end">{isAr ? 'المدفوع' : 'Payé'}</th>
                    <th className="py-2.5 px-4 text-end">{isAr ? 'الباقي للمورد' : 'Reste'}</th>
                    <th className="py-2.5 px-4 text-center">{isAr ? 'الحالة' : 'État'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredPurchases.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500">
                        {isAr ? 'لا توجد فواتير شراء في الفترة المحددة' : 'Aucun achat trouvé'}
                      </td>
                    </tr>
                  ) : (
                    filteredPurchases.map(p => {
                      const supp = suppliers.find(s => s.Supplier_ID === p.Supplier_ID);
                      return (
                        <tr key={p.Purchase_Invoice_ID} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-mono font-bold text-amber-400">{p.Invoice_Number}</td>
                          <td className="py-2.5 px-4 font-medium text-slate-200">{supp?.Supplier_Name || p.Supplier_ID}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-400">{p.Supplier_Invoice_Number || '-'}</td>
                          <td className="py-2.5 px-4 text-slate-400">{new Date(p.Invoice_Date || p.Created_At).toLocaleDateString('ar-MA')}</td>
                          <td className="py-2.5 px-4 text-end font-mono font-bold text-white">{p.Total.toFixed(2)} MAD</td>
                          <td className="py-2.5 px-4 text-end font-mono text-emerald-400">{p.Paid_Amount.toFixed(2)} MAD</td>
                          <td className="py-2.5 px-4 text-end font-mono text-rose-400">{p.Remaining_Amount > 0 ? `${p.Remaining_Amount.toFixed(2)} MAD` : '-'}</td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                              {p.Status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: INVENTORY & VALUATION */}
        {activeTab === 'inventory' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
              <h3 className="font-bold text-white text-sm">
                {isAr ? 'جدول تقييم المخزون الحالي وهامش الربح المتوقع' : 'Inventaire & Valorisation'}
              </h3>
              <span className="font-mono text-emerald-400 font-bold">
                {isAr ? 'قيمة المخزون الإجمالية:' : 'Valeur Totale:'} {inventoryCostValuation.toFixed(2)} MAD
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 text-start">{isAr ? 'المرجع' : 'Référence'}</th>
                    <th className="py-2.5 px-4 text-start">{isAr ? 'اسم المنتج' : 'Article'}</th>
                    <th className="py-2.5 px-4 text-center">{isAr ? 'المخزون الحالي' : 'Stock'}</th>
                    <th className="py-2.5 px-4 text-center">{isAr ? 'الحد الأدنى' : 'Min'}</th>
                    <th className="py-2.5 px-4 text-end">{isAr ? 'متوسط التكلفة' : 'Coût Moyen'}</th>
                    <th className="py-2.5 px-4 text-end">{isAr ? 'سعر البيع' : 'Prix Vente'}</th>
                    <th className="py-2.5 px-4 text-end">{isAr ? 'إجمالي قيمة المخزون' : 'Valeur Stock'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        {isAr ? 'لا توجد منتجات مسجلة' : 'Aucun produit'}
                      </td>
                    </tr>
                  ) : (
                    products.map(p => {
                      const cost = p.Average_Purchase_Cost || p.Last_Purchase_Price || 0;
                      const val = p.Current_Stock * cost;
                      const isLow = p.Current_Stock <= p.Minimum_Stock;
                      return (
                        <tr key={p.Product_ID} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-mono font-medium text-amber-400">{p.Internal_Reference}</td>
                          <td className="py-2.5 px-4 font-semibold text-slate-200">{p.Product_Name_AR}</td>
                          <td className="py-2.5 px-4 text-center font-mono font-bold">
                            <span className={isLow ? 'text-rose-400' : 'text-slate-200'}>
                              {p.Current_Stock} {p.Unit}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-slate-500">{p.Minimum_Stock}</td>
                          <td className="py-2.5 px-4 text-end font-mono text-slate-300">{cost.toFixed(2)} MAD</td>
                          <td className="py-2.5 px-4 text-end font-mono font-bold text-white">{p.Current_Selling_Price.toFixed(2)} MAD</td>
                          <td className="py-2.5 px-4 text-end font-mono font-bold text-amber-400">{val.toFixed(2)} MAD</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: CUSTOMER DEBTS */}
        {activeTab === 'customers' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
              <h3 className="font-bold text-white text-sm">
                {isAr ? 'كشف ديون الزبائن والأرصدة غير المسددة' : 'Créances Clients'}
              </h3>
              <span className="font-mono text-rose-400 font-bold">
                {isAr ? 'إجمالي الديون بذمة الزبائن:' : 'Total Dû:'} {totalCustomerDebts.toFixed(2)} MAD
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 text-start">{isAr ? 'اسم الزبون' : 'Client'}</th>
                    <th className="py-2.5 px-4 text-start">{isAr ? 'رقم الهاتف' : 'Téléphone'}</th>
                    <th className="py-2.5 px-4 text-start">{isAr ? 'المدينة' : 'Ville'}</th>
                    <th className="py-2.5 px-4 text-end">{isAr ? 'الرصيد المدين (الدين)' : 'Solde Débiteur'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {customers.filter(c => c.Current_Balance > 0).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-emerald-400 font-semibold">
                        {isAr ? 'ممتاز! لا توجد ديون مستحقة على الزبائن حالياً.' : 'Aucune dette client.'}
                      </td>
                    </tr>
                  ) : (
                    customers.filter(c => c.Current_Balance > 0).map(c => (
                      <tr key={c.Customer_ID} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-bold text-white">{c.Customer_Name}</td>
                        <td className="py-2.5 px-4 font-mono text-slate-300">{c.Phone || '-'}</td>
                        <td className="py-2.5 px-4 text-slate-400">{c.City || '-'}</td>
                        <td className="py-2.5 px-4 text-end font-mono font-black text-rose-400 text-sm">
                          {c.Current_Balance.toFixed(2)} MAD
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: EXPENSES */}
        {activeTab === 'expenses' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center text-xs">
              <h3 className="font-bold text-white text-sm">
                {isAr ? 'سجل المصاريف والنفقات التشغيلية التفصيلي' : 'Dépenses d’Exploitation'}
              </h3>
              <span className="font-mono text-rose-400 font-bold">
                {isAr ? 'إجمالي المصاريف:' : 'Total Charges:'} {totalExpensesAmount.toFixed(2)} MAD
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 text-start">{isAr ? 'رقم السند' : 'N°'}</th>
                    <th className="py-2.5 px-4 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="py-2.5 px-4 text-start">{isAr ? 'الفئة' : 'Catégorie'}</th>
                    <th className="py-2.5 px-4 text-start">{isAr ? 'البيان' : 'Description'}</th>
                    <th className="py-2.5 px-4 text-start">{isAr ? 'طريقة الدفع' : 'Paiement'}</th>
                    <th className="py-2.5 px-4 text-end">{isAr ? 'المبلغ' : 'Montant'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        {isAr ? 'لا توجد مصاريف مسجلة في هذه الفترة' : 'Aucune dépense trouvée'}
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map(exp => (
                      <tr key={exp.Expense_ID} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-mono font-bold text-amber-400">{exp.Expense_Number}</td>
                        <td className="py-2.5 px-4 text-slate-400">{new Date(exp.Expense_Date || exp.Created_At).toLocaleDateString('ar-MA')}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-200">{exp.Category}</td>
                        <td className="py-2.5 px-4 text-slate-300">{exp.Description}</td>
                        <td className="py-2.5 px-4 text-slate-400">{exp.Payment_Method}</td>
                        <td className="py-2.5 px-4 text-end font-mono font-bold text-rose-400">-{exp.Amount.toFixed(2)} MAD</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
