/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Customer } from '../../types';
import {
  UserCheck,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Edit2,
  X,
  FileText,
  Eye,
  Calendar,
  CreditCard,
  Building,
  Receipt
} from 'lucide-react';

export const CustomersView: React.FC = () => {
  const { language, customers, salesInvoices, saveCustomer } = useStore();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with_balance' | 'settled'>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Partial<Customer> | null>(null);
  const [statementCustomer, setStatementCustomer] = useState<Customer | null>(null);

  // Compute metrics per customer
  const customerStats = useMemo(() => {
    const statsMap: Record<string, { turnover: number; paid: number; invoicesCount: number }> = {};

    customers.forEach(c => {
      statsMap[c.Customer_ID] = { turnover: 0, paid: 0, invoicesCount: 0 };
    });

    salesInvoices.forEach(inv => {
      if (inv.Status !== 'Cancelled') {
        const custId = inv.Customer_ID || 'CUST-000';
        if (!statsMap[custId]) {
          statsMap[custId] = { turnover: 0, paid: 0, invoicesCount: 0 };
        }
        statsMap[custId].turnover += (Number(inv.Total) || 0);
        statsMap[custId].paid += (Number(inv.Paid_Amount) || 0);
        statsMap[custId].invoicesCount += 1;
      }
    });

    return statsMap;
  }, [customers, salesInvoices]);

  // Overall totals
  const overallTotals = useMemo(() => {
    let totalTurnover = 0;
    let totalDues = 0;
    let totalPaid = 0;

    customers.forEach(c => {
      const stats = customerStats[c.Customer_ID] || { turnover: 0, paid: 0, invoicesCount: 0 };
      totalTurnover += stats.turnover;
      totalPaid += stats.paid;
      totalDues += (Number(c.Current_Balance) || 0);
    });

    return {
      totalCustomers: customers.length,
      totalTurnover,
      totalDues,
      totalPaid
    };
  }, [customers, customerStats]);

  // Filtered list
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        c.Customer_Name.toLowerCase().includes(q) ||
        (c.Phone && c.Phone.toLowerCase().includes(q)) ||
        (c.City && c.City.toLowerCase().includes(q)) ||
        (c.Customer_ID && c.Customer_ID.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      const balance = Number(c.Current_Balance) || 0;
      if (filterType === 'with_balance') return balance > 0;
      if (filterType === 'settled') return balance <= 0;
      return true;
    });
  }, [customers, searchQuery, filterType]);

  const handleOpenAdd = () => {
    setEditingCustomer({
      Customer_Name: '',
      Phone: '',
      Email: '',
      Address: '',
      City: 'أسفي',
      Notes: '',
      Opening_Balance: 0,
      Current_Balance: 0
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer({ ...c });
    setIsEditorOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer?.Customer_Name?.trim()) {
      alert(isAr ? 'يرجى إدخال اسم العميل' : 'Veuillez saisir le nom du client');
      return;
    }
    saveCustomer(editingCustomer);
    setIsEditorOpen(false);
    setEditingCustomer(null);
  };

  // Invoices for the currently inspected customer
  const customerInvoices = useMemo(() => {
    if (!statementCustomer) return [];
    return salesInvoices
      .filter(inv => inv.Customer_ID === statementCustomer.Customer_ID)
      .sort((a, b) => new Date(b.Invoice_Date || b.Created_At).getTime() - new Date(a.Invoice_Date || a.Created_At).getTime());
  }, [statementCustomer, salesInvoices]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-amber-400" />
            <span>{isAr ? 'دليل العملاء والحسابات المدينة' : 'Gestion des Clients'}</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            {isAr
              ? `عرض شامل لجميع بيانات العملاء، المستحقات والديون، ورقم الأعمال التراكمي (${customers.length} عميل)`
              : `Tableau complet des clients, créances et chiffres d'affaires (${customers.length} clients)`}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إضافة عميل جديد' : 'Nouveau Client'}</span>
        </button>
      </div>

      {/* KPI Overview Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">{isAr ? 'إجمالي العملاء' : 'Total Clients'}</span>
            <UserCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl md:text-2xl font-black text-white font-mono">
            {overallTotals.totalCustomers}
          </div>
          <span className="text-[10px] text-slate-500">{isAr ? 'مسجلين في قاعدة البيانات' : 'Clients enregistrés'}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">{isAr ? 'رقم الأعمال الإجمالي' : 'Chiffre d’Affaires'}</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl md:text-2xl font-black text-emerald-400 font-mono">
            {overallTotals.totalTurnover.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs">MAD</span>
          </div>
          <span className="text-[10px] text-slate-500">{isAr ? 'إجمالي المبيعات للعملاء' : 'Total ventes clients'}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">{isAr ? 'إجمالي المستحقات (ديون)' : 'Créances Dues'}</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className={`text-xl md:text-2xl font-black font-mono ${overallTotals.totalDues > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            {overallTotals.totalDues.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs">MAD</span>
          </div>
          <span className="text-[10px] text-rose-400/80">{isAr ? 'مبالغ بذمة العملاء لم تُسدد' : 'Soldes à recouvrer'}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">{isAr ? 'إجمالي المدفوعات المحصلة' : 'Total Encaissé'}</span>
            <CheckCircle2 className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl md:text-2xl font-black text-teal-400 font-mono">
            {overallTotals.totalPaid.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs">MAD</span>
          </div>
          <span className="text-[10px] text-slate-500">{isAr ? 'تم تحصيلها في الصندوق / البنك' : 'Encaissés au comptant'}</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث باسم العميل، الهاتف، المدينة، أو الكود...' : 'Recherche par nom, tél, ville...'}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl ps-9 pe-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 self-start md:self-auto text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              filterType === 'all'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {isAr ? 'جميع العملاء' : 'Tous'} ({customers.length})
          </button>
          <button
            onClick={() => setFilterType('with_balance')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1 ${
              filterType === 'with_balance'
                ? 'bg-rose-500 text-white'
                : 'bg-slate-800 text-rose-400 hover:bg-slate-700'
            }`}
          >
            <span>{isAr ? 'عليهم مستحقات' : 'Avec Solde Dû'}</span>
            <span className="px-1.5 py-0.2 rounded-full bg-rose-950 text-[10px]">
              {customers.filter(c => (Number(c.Current_Balance) || 0) > 0).length}
            </span>
          </button>
          <button
            onClick={() => setFilterType('settled')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              filterType === 'settled'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
            }`}
          >
            {isAr ? 'حساب خالص' : 'Soldés'}
          </button>
        </div>
      </div>

      {/* COMPREHENSIVE CUSTOMERS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-3 text-start">{isAr ? 'كود العميل' : 'ID'}</th>
                <th className="py-3 px-4 text-start">{isAr ? 'اسم العميل الكامل' : 'Nom du Client'}</th>
                <th className="py-3 px-3 text-start">{isAr ? 'الهاتف' : 'Téléphone'}</th>
                <th className="py-3 px-3 text-start">{isAr ? 'المدينة والعنوان' : 'Ville & Adresse'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'الفواتير' : 'Factures'}</th>
                <th className="py-3 px-4 text-end text-emerald-400">{isAr ? 'رقم الأعمال (MAD)' : 'Chiffre d’Affaires'}</th>
                <th className="py-3 px-3 text-end">{isAr ? 'المسدد (MAD)' : 'Encaissé'}</th>
                <th className="py-3 px-4 text-end text-rose-400">{isAr ? 'المستحقات (MAD)' : 'Solde Dû'}</th>
                <th className="py-3 px-3 text-start">{isAr ? 'ملاحظات' : 'Notes'}</th>
                <th className="py-3 px-3 text-center">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    {isAr ? 'لا يوجد عملاء مطابقين لمعايير البحث' : 'Aucun client trouvé.'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => {
                  const stats = customerStats[c.Customer_ID] || { turnover: 0, paid: 0, invoicesCount: 0 };
                  const balance = Number(c.Current_Balance) || 0;
                  const isCounter = c.Customer_ID === 'CUST-000';

                  return (
                    <tr
                      key={c.Customer_ID}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Customer ID */}
                      <td className="py-3 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {c.Customer_ID}
                      </td>

                      {/* Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{c.Customer_Name}</span>
                          {isCounter && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 whitespace-nowrap">
                              {isAr ? 'عميل كونتوار' : 'Comptoir'}
                            </span>
                          )}
                        </div>
                        {c.Email && c.Email !== '-' && (
                          <span className="text-[10px] text-slate-500 block truncate max-w-[160px]">{c.Email}</span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3 px-3 font-mono whitespace-nowrap text-slate-300">
                        {c.Phone && c.Phone !== '-' ? (
                          <a href={`tel:${c.Phone}`} className="hover:text-amber-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{c.Phone}</span>
                          </a>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>

                      {/* Address & City */}
                      <td className="py-3 px-3 text-slate-300">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="font-medium">{c.City || 'أسفي'}</span>
                        </div>
                        {c.Address && c.Address !== '-' && (
                          <span className="text-[10px] text-slate-500 block truncate max-w-[160px]">{c.Address}</span>
                        )}
                      </td>

                      {/* Invoices Count with quick click to view */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setStatementCustomer(c)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                          title={isAr ? 'عرض فواتير العميل' : 'Voir factures'}
                        >
                          <Receipt className="w-3 h-3 text-amber-400" />
                          <span>{stats.invoicesCount}</span>
                        </button>
                      </td>

                      {/* Turnover (رقم الأعمال) */}
                      <td className="py-3 px-4 text-end font-mono font-bold text-emerald-400 text-sm whitespace-nowrap">
                        {stats.turnover.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Total Paid */}
                      <td className="py-3 px-3 text-end font-mono text-slate-300 whitespace-nowrap">
                        {stats.paid.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Dues / Outstandings (المستحقات) */}
                      <td className="py-3 px-4 text-end whitespace-nowrap">
                        {balance > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono font-bold text-xs">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>{balance.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[11px]">
                            <CheckCircle2 className="w-3 h-3 shrink-0" />
                            <span>0.00</span>
                          </span>
                        )}
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-3 text-slate-400 text-[11px] max-w-[120px] truncate">
                        {c.Notes || '-'}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setStatementCustomer(c)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title={isAr ? 'كشف حساب وفواتير العميل' : 'Relevé de compte'}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          {!isCounter && (
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                              title={isAr ? 'تعديل بيانات العميل' : 'Modifier'}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMER INVOICES STATEMENT MODAL */}
      {statementCustomer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl space-y-4 text-xs animate-in fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-base">
                    {isAr ? 'كشف حساب وفواتير العميل:' : 'Relevé du Client:'} {statementCustomer.Customer_Name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {statementCustomer.Customer_ID} • {statementCustomer.Phone || (isAr ? 'بدون هاتف' : 'Pas de tél')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStatementCustomer(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick customer balance banner */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">{isAr ? 'رقم الأعمال الإجمالي' : 'Total CA'}</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {(customerStats[statementCustomer.Customer_ID]?.turnover || 0).toFixed(2)} MAD
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">{isAr ? 'إجمالي المسدد' : 'Total Encaissé'}</span>
                <span className="font-bold text-teal-400 text-sm">
                  {(customerStats[statementCustomer.Customer_ID]?.paid || 0).toFixed(2)} MAD
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">{isAr ? 'المستحقات المتبقية' : 'Solde Restant'}</span>
                <span className={`font-bold text-sm ${statementCustomer.Current_Balance > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {statementCustomer.Current_Balance.toFixed(2)} MAD
                </span>
              </div>
            </div>

            {/* Invoices list table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden max-h-80 overflow-y-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 text-start">{isAr ? 'رقم الفاتورة' : 'N° Facture'}</th>
                    <th className="py-2.5 px-3 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                    <th className="py-2.5 px-3 text-end">{isAr ? 'المبلغ الإجمالي' : 'Total'}</th>
                    <th className="py-2.5 px-3 text-end">{isAr ? 'المدفوع' : 'Payé'}</th>
                    <th className="py-2.5 px-3 text-end">{isAr ? 'المتبقي (المستحق)' : 'Reste'}</th>
                    <th className="py-2.5 px-3 text-center">{isAr ? 'الحالة' : 'État'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {customerInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                        {isAr ? 'لا توجد فواتير مبيعات مسجلة لهذا العميل بعد.' : 'Aucune facture pour ce client.'}
                      </td>
                    </tr>
                  ) : (
                    customerInvoices.map(inv => (
                      <tr key={inv.Sales_Invoice_ID} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-white">{inv.Invoice_Number}</td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          {new Date(inv.Invoice_Date || inv.Created_At).toLocaleDateString('ar-MA')}
                        </td>
                        <td className="py-2.5 px-3 text-end text-emerald-400 font-bold">
                          {inv.Total.toFixed(2)} MAD
                        </td>
                        <td className="py-2.5 px-3 text-end text-teal-400">
                          {inv.Paid_Amount.toFixed(2)} MAD
                        </td>
                        <td className="py-2.5 px-3 text-end text-rose-400 font-bold">
                          {inv.Remaining_Amount.toFixed(2)} MAD
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.Status === 'Paid'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : inv.Status === 'Partially_Paid'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {inv.Status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setStatementCustomer(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT CUSTOMER MODAL */}
      {isEditorOpen && editingCustomer && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs animate-in fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">
                {editingCustomer.Customer_ID ? (isAr ? 'تعديل بيانات العميل' : 'Modifier Client') : (isAr ? 'إضافة عميل جديد' : 'Nouveau Client')}
              </h3>
              <button onClick={() => setIsEditorOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">{isAr ? 'اسم العميل الكامل *' : 'Nom du client *'}</label>
                <input
                  type="text"
                  required
                  value={editingCustomer.Customer_Name || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, Customer_Name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  placeholder="محمد بناني"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">{isAr ? 'الهاتف' : 'Téléphone'}</label>
                  <input
                    type="text"
                    value={editingCustomer.Phone || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, Phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    placeholder="0612345678"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">{isAr ? 'المدينة' : 'Ville'}</label>
                  <input
                    type="text"
                    value={editingCustomer.City || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, City: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="أسفي"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input
                    type="email"
                    value={editingCustomer.Email || ''}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, Email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    placeholder="client@email.com"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">{isAr ? 'الرصيد الافتتاحي (MAD)' : 'Solde Initial'}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingCustomer.Opening_Balance || 0}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, Opening_Balance: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'العنوان' : 'Adresse'}</label>
                <input
                  type="text"
                  value={editingCustomer.Address || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, Address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  placeholder="شارع الحسن الثاني، أسفي"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'ملاحظات' : 'Notes'}</label>
                <textarea
                  rows={2}
                  value={editingCustomer.Notes || ''}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, Notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  placeholder="ملاحظات حول سداد العميل..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                >
                  {isAr ? 'حفظ العميل' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
