/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { SalesInvoice, SalesItem } from '../../types';
import { InvoicePrintModal } from '../common/InvoicePrintModal';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  Printer,
  Calendar,
  DollarSign,
  User,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  X,
  Edit,
  Trash2,
  Plus,
  Save,
  Download
} from 'lucide-react';

export const SalesInvoicesView: React.FC = () => {
  const {
    language,
    salesInvoices,
    salesItems,
    customers,
    products,
    setActiveView,
    editSaleInvoice,
    deleteSaleInvoice,
    addSalePayment,
    bankAccounts
  } = useStore();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoice | null>(null);
  const [printInvoice, setPrintInvoice] = useState<{ invoice: SalesInvoice; items: SalesItem[] } | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<SalesInvoice | null>(null);
  const [editItems, setEditItems] = useState<SalesItem[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Payment Settlement State
  const [paymentInvoice, setPaymentInvoice] = useState<SalesInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Bank_Transfer' | 'Cheque'>('Cash');
  const [paymentBankId, setPaymentBankId] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);

  const filteredInvoices = salesInvoices.filter(inv => {
    if (statusFilter !== 'ALL' && inv.Status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = inv.Invoice_Number.toLowerCase().includes(q);
      const customer = customers.find(c => c.Customer_ID === inv.Customer_ID);
      const matchCust = customer && customer.Customer_Name.toLowerCase().includes(q);
      return matchNum || matchCust;
    }
    return true;
  });

  const getCustomerName = (id: string) => {
    const c = customers.find(cust => cust.Customer_ID === id);
    return c ? c.Customer_Name : (isAr ? 'زبون عادي' : 'Client Comptoir');
  };

  const getInvoiceItems = (id: string): SalesItem[] => {
    return salesItems.filter(it => it.Sales_Invoice_ID === id);
  };

  const handleOpenEdit = (inv: SalesInvoice) => {
    const items = getInvoiceItems(inv.Sales_Invoice_ID);
    setEditingInvoice({ ...inv });
    setEditItems(items.map(it => ({ ...it })));
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    setEditItems(prev => {
      const next = [...prev];
      const it = next[index];
      const validQty = Math.max(1, newQty);
      const sub = validQty * it.Unit_Price;
      const total = Math.max(0, sub - (it.Discount || 0));
      const grossProfit = total - (validQty * (it.Purchase_Cost_At_Sale || 0));
      next[index] = {
        ...it,
        Quantity: validQty,
        Total: total,
        Gross_Profit: grossProfit
      };
      return next;
    });
  };

  const handleUpdateItemPrice = (index: number, newPrice: number) => {
    setEditItems(prev => {
      const next = [...prev];
      const it = next[index];
      const sub = it.Quantity * newPrice;
      const total = Math.max(0, sub - (it.Discount || 0));
      const grossProfit = total - (it.Quantity * (it.Purchase_Cost_At_Sale || 0));
      next[index] = {
        ...it,
        Unit_Price: newPrice,
        Total: total,
        Gross_Profit: grossProfit
      };
      return next;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (editItems.length <= 1) {
      alert(isAr ? 'لا يمكن حذف جميع البنود، يجب أن تحتوي الفاتورة على بند واحد على الأقل' : 'Une facture doit contenir au moins un article');
      return;
    }
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveEdit = async () => {
    if (!editingInvoice) return;

    const subtotal = editItems.reduce((acc, it) => acc + (it.Quantity * it.Unit_Price), 0);
    const discount = editItems.reduce((acc, it) => acc + (it.Discount || 0), 0) + (editingInvoice.Discount || 0);
    const total = Math.max(0, subtotal - (editingInvoice.Discount || 0));
    const paid = Math.min(editingInvoice.Paid_Amount, total);
    const remaining = Math.max(0, total - paid);

    const updatedInv: Partial<SalesInvoice> = {
      Customer_ID: editingInvoice.Customer_ID,
      Payment_Method: editingInvoice.Payment_Method,
      Invoice_Date: editingInvoice.Invoice_Date,
      Subtotal: subtotal,
      Discount: editingInvoice.Discount,
      Total: total,
      Paid_Amount: paid,
      Remaining_Amount: remaining,
      Status: remaining === 0 ? 'Paid' : 'Partially_Paid'
    };

    try {
      await editSaleInvoice(editingInvoice.Sales_Invoice_ID, updatedInv, editItems);
      setEditingInvoice(null);
    } catch (err: any) {
      alert(err.message || 'فشل حفظ التعديلات');
    }
  };

  const handleOpenPayment = (inv: SalesInvoice) => {
    setPaymentInvoice(inv);
    setPaymentAmount(inv.Remaining_Amount > 0 ? inv.Remaining_Amount : inv.Total);
    setPaymentMethod(inv.Payment_Method !== 'Credit' ? (inv.Payment_Method as any) : 'Cash');
    setPaymentBankId(bankAccounts[0]?.Bank_ID || '');
  };

  const handleConfirmPayment = async () => {
    if (!paymentInvoice || paymentAmount <= 0) {
      alert(isAr ? 'يرجى إدخال مبلغ صحيح' : 'Veuillez saisir un montant valide');
      return;
    }
    setIsSubmittingPayment(true);
    try {
      await addSalePayment(paymentInvoice.Sales_Invoice_ID, paymentAmount, paymentMethod, paymentBankId || undefined);
      setPaymentInvoice(null);
    } catch (err: any) {
      alert(err.message || 'فشل تسجيل الأداء');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleDelete = async (inv: SalesInvoice) => {
    const confirmMsg = isAr
      ? `هل أنت متأكد من حذف فاتورة البيع ${inv.Invoice_Number}؟\nسيتم استرجاع الكميات المباعة للمخزن وتحديث Google Sheets تلقائياً.`
      : `Voulez-vous vraiment supprimer la facture ${inv.Invoice_Number} ? Les stocks seront réintégrés.`;

    if (!window.confirm(confirmMsg)) return;

    setIsDeleting(inv.Sales_Invoice_ID);
    try {
      await deleteSaleInvoice(inv.Sales_Invoice_ID);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-amber-400" />
            <span>{isAr ? 'فواتير البيع والمبيعات' : 'Factures de Vente'}</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            {isAr
              ? `إجمالي الفواتير: ${salesInvoices.length} فاتورة مسجلة ومزامنة تلقائياً مع Google Sheets`
              : `${salesInvoices.length} factures synchronisées avec Google Sheets`}
          </p>
        </div>

        <button
          onClick={() => setActiveView('pos')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'فاتورة بيع جديدة (POS)' : 'Nouvelle Vente'}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'بحث برقم الفاتورة أو اسم الزبون...' : 'Recherche par numéro, client...'}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl ps-9 pe-3 py-2 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none w-full md:w-auto"
        >
          <option value="ALL">{isAr ? 'جميع الحالات' : 'Tous les états'}</option>
          <option value="Paid">{isAr ? 'مدفوعة بالكامل' : 'Payée'}</option>
          <option value="Partially_Paid">{isAr ? 'دفع جزئي (باقي بذمة الزبون)' : 'Partiellement Payée'}</option>
          <option value="Returned">{isAr ? 'مرتجعة' : 'Retournée'}</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'رقم الفاتورة' : 'N° Facture'}</th>
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'الزبون' : 'Client'}</th>
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'طريقة الأداء' : 'Paiement'}</th>
                <th className="py-3 px-4 text-end font-semibold">{isAr ? 'المجموع' : 'Total'}</th>
                <th className="py-3 px-4 text-end font-semibold">{isAr ? 'المدفوع' : 'Payé'}</th>
                <th className="py-3 px-4 text-end font-semibold">{isAr ? 'الباقي' : 'Reste'}</th>
                <th className="py-3 px-4 text-center font-semibold">{isAr ? 'الحالة' : 'État'}</th>
                <th className="py-3 px-4 text-end font-semibold">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Receipt className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p>{isAr ? 'لا توجد فواتير مطابقة' : 'Aucune facture trouvée'}</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.Sales_Invoice_ID} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {inv.Invoice_Number}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">
                      {getCustomerName(inv.Customer_ID)}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(inv.Invoice_Date || inv.Created_At).toLocaleDateString('ar-MA')}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {inv.Payment_Method}
                    </td>
                    <td className="py-3 px-4 text-end font-mono font-bold text-white">
                      {inv.Total.toFixed(2)} MAD
                    </td>
                    <td className="py-3 px-4 text-end font-mono text-emerald-400">
                      {inv.Paid_Amount.toFixed(2)} MAD
                    </td>
                    <td className="py-3 px-4 text-end font-mono text-rose-400">
                      {inv.Remaining_Amount > 0 ? `${inv.Remaining_Amount.toFixed(2)} MAD` : '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.Status === 'Paid'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : inv.Status === 'Partially_Paid'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {inv.Status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Record Payment */}
                        <button
                          onClick={() => handleOpenPayment(inv)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            inv.Remaining_Amount > 0
                              ? 'text-amber-400 hover:text-emerald-400 hover:bg-slate-800 animate-pulse'
                              : 'text-slate-500 hover:text-emerald-400 hover:bg-slate-800'
                          }`}
                          title={isAr ? 'تسجيل أداء / دفعة' : 'Encaisser / Règlement'}
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>

                        {/* View Details */}
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title={isAr ? 'عرض التفاصيل' : 'Détails'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Print & PDF */}
                        <button
                          onClick={() => {
                            const items = getInvoiceItems(inv.Sales_Invoice_ID);
                            setPrintInvoice({ invoice: inv, items });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                          title={isAr ? 'طباعة وتصدير PDF' : 'Imprimer / Export PDF'}
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Edit Invoice */}
                        <button
                          onClick={() => handleOpenEdit(inv)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                          title={isAr ? 'تعديل الفاتورة' : 'Modifier la Facture'}
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete Invoice */}
                        <button
                          onClick={() => handleDelete(inv)}
                          disabled={isDeleting === inv.Sales_Invoice_ID}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors disabled:opacity-50"
                          title={isAr ? 'حذف الفاتورة واسترجاع المخزون' : 'Supprimer'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT INVOICE MODAL */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Edit className="w-5 h-5 text-cyan-400" />
                  <span>{isAr ? 'تعديل فاتورة البيع' : 'Modifier la Facture'}</span>
                </h3>
                <p className="text-xs text-amber-400 font-mono mt-0.5">{editingInvoice.Invoice_Number}</p>
              </div>
              <button
                onClick={() => setEditingInvoice(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Top Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">{isAr ? 'الزبون' : 'Client'}</label>
                  <select
                    value={editingInvoice.Customer_ID}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, Customer_ID: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  >
                    {customers.map(c => (
                      <option key={c.Customer_ID} value={c.Customer_ID}>{c.Customer_Name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">{isAr ? 'طريقة الأداء' : 'Paiement'}</label>
                  <select
                    value={editingInvoice.Payment_Method}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, Payment_Method: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  >
                    <option value="Cash">{isAr ? 'نقداً (Espèces)' : 'Espèces'}</option>
                    <option value="Card">{isAr ? 'بطاقة بنكية (Carte)' : 'Carte Bancaire'}</option>
                    <option value="Bank_Transfer">{isAr ? 'تحويل بنكي (Virement)' : 'Virement'}</option>
                    <option value="Cheque">{isAr ? 'شيك (Chèque)' : 'Chèque'}</option>
                    <option value="Credit">{isAr ? 'كريدي / أجل (Crédit)' : 'Crédit'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">{isAr ? 'المبلغ المؤدى (MAD)' : 'Montant Réglé'}</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editingInvoice.Paid_Amount}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, Paid_Amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Items editor */}
              <div className="border border-slate-800 rounded-xl overflow-hidden mt-4">
                <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-slate-300">{isAr ? 'بنود الفاتورة والكميات' : 'Articles'}</span>
                  <span className="text-[11px] text-slate-500">
                    {isAr ? 'يتم تعديل المخزون تلقائياً وفق الفارق' : 'Stock ajusté selon les quantités'}
                  </span>
                </div>

                <div className="divide-y divide-slate-800">
                  {editItems.map((item, idx) => (
                    <div key={item.Sales_Item_ID} className="p-3 bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex-1 w-full sm:w-auto">
                        <span className="font-semibold text-white block">{item.Product_Reference}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.Product_ID}</span>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex items-center gap-1.5">
                          <label className="text-slate-500 text-[11px]">{isAr ? 'الكمية:' : 'Qté:'}</label>
                          <input
                            type="number"
                            min="1"
                            value={item.Quantity}
                            onChange={(e) => handleUpdateItemQty(idx, parseInt(e.target.value) || 1)}
                            className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono text-white"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <label className="text-slate-500 text-[11px]">{isAr ? 'السعر:' : 'P.U:'}</label>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.Unit_Price}
                            onChange={(e) => handleUpdateItemPrice(idx, parseFloat(e.target.value) || 0)}
                            className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-end font-mono text-white"
                          />
                        </div>

                        <span className="font-bold text-amber-400 font-mono min-w-[70px] text-end">
                          {item.Total.toFixed(2)} MAD
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-500 hover:text-rose-400"
                          title="حذف البند"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900">
              <button
                onClick={() => setEditingInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow"
              >
                <Save className="w-4 h-4" />
                <span>{isAr ? 'حفظ التعديلات ومزامنة Google Sheets' : 'Enregistrer les modifications'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE DETAILS MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-amber-400" />
                  <span>{isAr ? 'تفاصيل فاتورة البيع' : 'Détail de la Facture'}</span>
                </h3>
                <p className="text-xs text-amber-400 font-mono mt-0.5">{selectedInvoice.Invoice_Number}</p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">{isAr ? 'الزبون' : 'Client'}</span>
                  <span className="font-bold text-white">{getCustomerName(selectedInvoice.Customer_ID)}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">{isAr ? 'التاريخ' : 'Date'}</span>
                  <span className="font-mono text-slate-300">
                    {new Date(selectedInvoice.Invoice_Date || selectedInvoice.Created_At).toLocaleDateString('ar-MA')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">{isAr ? 'طريقة الأداء' : 'Paiement'}</span>
                  <span className="font-semibold text-slate-300">{selectedInvoice.Payment_Method}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">{isAr ? 'المجموع الصافي' : 'Total Net'}</span>
                  <span className="font-bold text-amber-400 font-mono text-base">{selectedInvoice.Total.toFixed(2)} MAD</span>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-start">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3 text-start">{isAr ? 'المنتج' : 'Article'}</th>
                      <th className="py-2 px-3 text-center">{isAr ? 'الكمية' : 'Qté'}</th>
                      <th className="py-2 px-3 text-end">{isAr ? 'سعر البيع' : 'P.U'}</th>
                      <th className="py-2 px-3 text-end">{isAr ? 'تكلفة الشراء' : 'Coût Achat'}</th>
                      <th className="py-2 px-3 text-end">{isAr ? 'المجموع' : 'Total'}</th>
                      <th className="py-2 px-3 text-end">{isAr ? 'الربح المحقق' : 'Marge'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {getInvoiceItems(selectedInvoice.Sales_Invoice_ID).map(item => (
                      <tr key={item.Sales_Item_ID} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-medium text-slate-200">{item.Product_Reference}</td>
                        <td className="py-2 px-3 text-center font-mono">{item.Quantity}</td>
                        <td className="py-2 px-3 text-end font-mono">{item.Unit_Price.toFixed(2)} MAD</td>
                        <td className="py-2 px-3 text-end font-mono text-slate-400">{item.Purchase_Cost_At_Sale.toFixed(2)} MAD</td>
                        <td className="py-2 px-3 text-end font-mono font-bold text-white">{item.Total.toFixed(2)} MAD</td>
                        <td className="py-2 px-3 text-end font-mono font-bold text-emerald-400">+{item.Gross_Profit.toFixed(2)} MAD</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-between items-center gap-3">
              {selectedInvoice.Remaining_Amount > 0 ? (
                <button
                  onClick={() => {
                    const inv = selectedInvoice;
                    setSelectedInvoice(null);
                    handleOpenPayment(inv);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition-all"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>{isAr ? `تسجيل أداء دفعة (${selectedInvoice.Remaining_Amount.toFixed(2)} MAD متبقية)` : 'Encaisser un règlement'}</span>
                </button>
              ) : <div />}

              <button
                onClick={() => {
                  const items = getInvoiceItems(selectedInvoice.Sales_Invoice_ID);
                  setSelectedInvoice(null);
                  setPrintInvoice({ invoice: selectedInvoice, items });
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow"
              >
                <Printer className="w-4 h-4" />
                <span>{isAr ? 'طباعة / تصدير PDF' : 'Imprimer / Export PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT SETTLEMENT MODAL */}
      {paymentInvoice && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {isAr ? 'تسجيل أداء / دفعة لفاتورة بيع' : 'Encaisser un Paiement'}
                  </h3>
                  <p className="text-xs text-amber-400 font-mono">{paymentInvoice.Invoice_Number}</p>
                </div>
              </div>
              <button
                onClick={() => setPaymentInvoice(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px]">{isAr ? 'الإجمالي' : 'Total'}</span>
                  <span className="font-bold text-white text-xs">{paymentInvoice.Total.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">{isAr ? 'المدفوع سابقاً' : 'Déjà Payé'}</span>
                  <span className="font-bold text-emerald-400 text-xs">{paymentInvoice.Paid_Amount.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">{isAr ? 'المتبقي الحالي' : 'Reste Dû'}</span>
                  <span className="font-bold text-rose-400 text-xs">{paymentInvoice.Remaining_Amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  {isAr ? 'مبلغ الدفعة المستلمة (MAD) *' : 'Montant Réglé (MAD) *'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    max={paymentInvoice.Remaining_Amount > 0 ? paymentInvoice.Remaining_Amount : paymentInvoice.Total}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-emerald-400 font-mono font-bold text-base focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(paymentInvoice.Remaining_Amount > 0 ? paymentInvoice.Remaining_Amount : paymentInvoice.Total)}
                    className="absolute end-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                  >
                    {isAr ? 'كامل الباقي' : 'Totalité'}
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  {isAr ? 'طريقة الأداء' : 'Mode de Paiement'}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                >
                  <option value="Cash">{isAr ? 'نقداً (Espèces)' : 'Espèces'}</option>
                  <option value="Card">{isAr ? 'بطاقة بنكية (Carte Bancaire)' : 'Carte Bancaire'}</option>
                  <option value="Bank_Transfer">{isAr ? 'تحويل بنكي (Virement)' : 'Virement Bancaire'}</option>
                  <option value="Cheque">{isAr ? 'شيك (Chèque)' : 'Chèque'}</option>
                </select>
              </div>

              {/* Bank selector if applicable */}
              {(paymentMethod === 'Bank_Transfer' || paymentMethod === 'Card') && (
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">
                    {isAr ? 'الحساب البنكي المستقبل' : 'Compte Bancaire'}
                  </label>
                  {bankAccounts.length === 0 ? (
                    <p className="text-amber-400 text-[11px] p-2 bg-amber-500/10 rounded-lg">
                      {isAr ? 'لم يتم إضافة حسابات بنكية بعد في قسم الحسابات البنكية' : 'Aucun compte bancaire configuré'}
                    </p>
                  ) : (
                    <select
                      value={paymentBankId}
                      onChange={(e) => setPaymentBankId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    >
                      {bankAccounts.map(b => (
                        <option key={b.Bank_ID} value={b.Bank_ID}>
                          {b.Bank_Name} ({b.Account_Number || 'حساب رئيسي'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Live Preview of Remaining Debt */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] flex justify-between items-center">
                <span className="text-slate-400">{isAr ? 'المتبقي بعد هذه الدفعة:' : 'Reste après paiement:'}</span>
                <span className="font-mono font-bold text-white">
                  {Math.max(0, (paymentInvoice.Remaining_Amount > 0 ? paymentInvoice.Remaining_Amount : paymentInvoice.Total) - paymentAmount).toFixed(2)} MAD
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-950/40">
              <button
                type="button"
                onClick={() => setPaymentInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="button"
                disabled={isSubmittingPayment}
                onClick={handleConfirmPayment}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'تأكيد وحفظ الدفعة في Google Sheets' : 'Valider le paiement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT & PDF MODAL */}
      {printInvoice && (
        <InvoicePrintModal
          invoice={printInvoice.invoice}
          items={printInvoice.items}
          onClose={() => setPrintInvoice(null)}
        />
      )}
    </div>
  );
};
