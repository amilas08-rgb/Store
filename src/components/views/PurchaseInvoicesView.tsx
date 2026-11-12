/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { PurchaseInvoice, PurchaseItem, Product } from '../../types';
import { PurchaseInvoicePrintModal } from '../common/PurchaseInvoicePrintModal';
import {
  Truck,
  Plus,
  Search,
  Eye,
  Calendar,
  DollarSign,
  Package,
  Trash2,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Edit,
  Printer,
  Save,
  Download,
  CreditCard
} from 'lucide-react';

export const PurchaseInvoicesView: React.FC = () => {
  const {
    language,
    purchaseInvoices,
    purchaseItems,
    suppliers,
    products,
    executePurchaseInvoice,
    editPurchaseInvoice,
    deletePurchaseInvoice,
    addPurchasePayment,
    bankAccounts
  } = useStore();

  const isAr = language === 'ar';

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<PurchaseInvoice | null>(null);
  const [printInvoice, setPrintInvoice] = useState<{ invoice: PurchaseInvoice; items: PurchaseItem[] } | null>(null);
  const [editingInvoice, setEditingInvoice] = useState<PurchaseInvoice | null>(null);
  const [editItems, setEditItems] = useState<PurchaseItem[]>([]);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Supplier Payment Settlement State
  const [settleInvoice, setSettleInvoice] = useState<PurchaseInvoice | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleMethod, setSettleMethod] = useState<'Cash' | 'Card' | 'Bank_Transfer' | 'Cheque'>('Bank_Transfer');
  const [settleBankId, setSettleBankId] = useState<string>('');
  const [isSubmittingSettle, setIsSubmittingSettle] = useState<boolean>(false);

  // New Purchase Invoice Form State
  const [supplierId, setSupplierId] = useState(suppliers[0]?.Supplier_ID || '');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [transportCost, setTransportCost] = useState(0);
  const [otherExpenses, setOtherExpenses] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Bank_Transfer' | 'Cheque' | 'Credit'>('Bank_Transfer');
  const [paidAmount, setPaidAmount] = useState(0);

  // Invoice Items Line Editor
  interface FormItem {
    productId: string;
    productName: string;
    supplierReference: string;
    quantity: number;
    unitPrice: number;
    discount: number;
  }

  const [invoiceItems, setInvoiceItems] = useState<FormItem[]>([
    {
      productId: products[0]?.Product_ID || '',
      productName: products[0]?.Product_Name_AR || '',
      supplierReference: '',
      quantity: 10,
      unitPrice: products[0]?.Last_Purchase_Price || 100,
      discount: 0
    }
  ]);

  const handleAddItemRow = () => {
    const defaultProd = products[0];
    setInvoiceItems(prev => [
      ...prev,
      {
        productId: defaultProd?.Product_ID || '',
        productName: defaultProd?.Product_Name_AR || '',
        supplierReference: '',
        quantity: 5,
        unitPrice: defaultProd?.Last_Purchase_Price || 50,
        discount: 0
      }
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    setInvoiceItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateItemRow = (index: number, fields: Partial<FormItem>) => {
    setInvoiceItems(prev => {
      const next = [...prev];
      next[index] = { ...next[index], ...fields };
      if (fields.productId) {
        const p = products.find(prod => prod.Product_ID === fields.productId);
        if (p) {
          next[index].productName = p.Product_Name_AR;
          next[index].unitPrice = p.Last_Purchase_Price || 0;
        }
      }
      return next;
    });
  };

  const subtotal = invoiceItems.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
  const itemsDiscount = invoiceItems.reduce((acc, it) => acc + (it.discount || 0), 0);
  const netSubtotal = Math.max(0, subtotal - itemsDiscount);
  const grandTotal = netSubtotal + transportCost + otherExpenses;
  const remainingAmount = Math.max(0, grandTotal - paidAmount);

  const handleOpenNew = () => {
    setSupplierId(suppliers[0]?.Supplier_ID || '');
    setSupplierInvoiceNumber('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setTransportCost(0);
    setOtherExpenses(0);
    setPaidAmount(0);
    setInvoiceItems([
      {
        productId: products[0]?.Product_ID || '',
        productName: products[0]?.Product_Name_AR || '',
        supplierReference: '',
        quantity: 10,
        unitPrice: products[0]?.Last_Purchase_Price || 100,
        discount: 0
      }
    ]);
    setIsEditorOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      alert(isAr ? 'يرجى اختيار المورد' : 'Veuillez sélectionner le fournisseur');
      return;
    }
    if (invoiceItems.length === 0) {
      alert(isAr ? 'يجب إضافة بند واحد على الأقل في فاتورة الشراء' : 'Ajoutez au moins un article');
      return;
    }

    const payload = {
      Supplier_ID: supplierId,
      Supplier_Invoice_Number: supplierInvoiceNumber || `BL-${Date.now().toString().slice(-4)}`,
      Invoice_Date: invoiceDate,
      Receiving_Date: new Date().toISOString(),
      Subtotal: subtotal,
      Discount: itemsDiscount,
      Tax: 0,
      Transport_Cost: transportCost,
      Other_Expenses: otherExpenses,
      Total: grandTotal,
      Paid_Amount: paidAmount,
      Remaining_Amount: remainingAmount,
      Payment_Method: paymentMethod,
      Status: remainingAmount === 0 ? ('Paid' as const) : ('Partially_Paid' as const),
      Created_By: 'مدير المشتريات',
      Approved_At: new Date().toISOString()
    };

    const itemsPayload = invoiceItems.map(it => {
      const allocatedFreight = grandTotal > 0 && subtotal > 0 ? ((it.quantity * it.unitPrice) / subtotal) * (transportCost + otherExpenses) : 0;
      const unitCost = it.unitPrice + (allocatedFreight / Math.max(1, it.quantity));

      return {
        Product_ID: it.productId,
        Supplier_Reference: it.supplierReference,
        Quantity: it.quantity,
        Unit_Price: it.unitPrice,
        Discount: it.discount,
        Tax: 0,
        Total: (it.quantity * it.unitPrice) - it.discount,
        Unit_Cost: Math.round(unitCost * 100) / 100
      };
    });

    await executePurchaseInvoice(payload, itemsPayload as any);
    setIsEditorOpen(false);
  };

  const getSupplierName = (id: string) => {
    const s = suppliers.find(supp => supp.Supplier_ID === id);
    return s ? s.Supplier_Name : id;
  };

  const getInvoiceItems = (id: string): PurchaseItem[] => {
    return purchaseItems.filter(it => it.Purchase_Invoice_ID === id);
  };

  const handleOpenEdit = (inv: PurchaseInvoice) => {
    const items = getInvoiceItems(inv.Purchase_Invoice_ID);
    setEditingInvoice({ ...inv });
    setEditItems(items.map(it => ({ ...it })));
  };

  const handleSaveEdit = async () => {
    if (!editingInvoice) return;

    const sub = editItems.reduce((acc, it) => acc + (it.Quantity * it.Unit_Price), 0);
    const disc = editItems.reduce((acc, it) => acc + (it.Discount || 0), 0);
    const tot = Math.max(0, sub - disc + (editingInvoice.Transport_Cost || 0) + (editingInvoice.Other_Expenses || 0));
    const paid = Math.min(editingInvoice.Paid_Amount, tot);
    const rem = Math.max(0, tot - paid);

    const updatedInv: Partial<PurchaseInvoice> = {
      Supplier_ID: editingInvoice.Supplier_ID,
      Supplier_Invoice_Number: editingInvoice.Supplier_Invoice_Number,
      Invoice_Date: editingInvoice.Invoice_Date,
      Subtotal: sub,
      Discount: disc,
      Total: tot,
      Paid_Amount: paid,
      Remaining_Amount: rem,
      Status: rem === 0 ? 'Paid' : 'Partially_Paid'
    };

    try {
      await editPurchaseInvoice(editingInvoice.Purchase_Invoice_ID, updatedInv, editItems);
      setEditingInvoice(null);
    } catch (err: any) {
      alert(err.message || 'فشل حفظ التعديلات');
    }
  };

  const handleOpenSettle = (inv: PurchaseInvoice) => {
    setSettleInvoice(inv);
    setSettleAmount(inv.Remaining_Amount > 0 ? inv.Remaining_Amount : inv.Total);
    setSettleMethod(inv.Payment_Method !== 'Credit' ? (inv.Payment_Method as any) : 'Bank_Transfer');
    setSettleBankId(bankAccounts[0]?.Bank_ID || '');
  };

  const handleConfirmSettle = async () => {
    if (!settleInvoice || settleAmount <= 0) {
      alert(isAr ? 'يرجى إدخال مبلغ صحيح' : 'Veuillez saisir un montant valide');
      return;
    }
    setIsSubmittingSettle(true);
    try {
      await addPurchasePayment(settleInvoice.Purchase_Invoice_ID, settleAmount, settleMethod, settleBankId || undefined);
      setSettleInvoice(null);
    } catch (err: any) {
      alert(err.message || 'فشل تسجيل الأداء');
    } finally {
      setIsSubmittingSettle(false);
    }
  };

  const handleDelete = async (inv: PurchaseInvoice) => {
    const confirmMsg = isAr
      ? `هل أنت متأكد من حذف فاتورة الشراء ${inv.Invoice_Number}؟\nسيتم خصم الكميات المستلمة من المخزن ومزامنة Google Sheets تلقائياً.`
      : `Voulez-vous supprimer le bon d'achat ${inv.Invoice_Number} ? Les stocks seront mis à jour.`;

    if (!window.confirm(confirmMsg)) return;

    setIsDeleting(inv.Purchase_Invoice_ID);
    try {
      await deletePurchaseInvoice(inv.Purchase_Invoice_ID);
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
            <Truck className="w-6 h-6 text-amber-400" />
            <span>{isAr ? 'فواتير الشراء والتوريد (Achats)' : "Factures d'Achat & Approvisionnement"}</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            {isAr
              ? `إجمالي فواتير التوريد: ${purchaseInvoices.length} مسجلة ومزامنة تلقائياً مع Google Sheets`
              : `${purchaseInvoices.length} factures d'achat synchronisées avec Google Sheets`}
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'تسجيل فاتورة شراء جديدة' : 'Nouvelle Facture Achat'}</span>
        </button>
      </div>

      {/* Invoices List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'رقم الفاتورة' : 'N° Facture'}</th>
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'المورد' : 'Fournisseur'}</th>
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'رقم سند المورد' : 'N° BL Fournisseur'}</th>
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="py-3 px-4 text-end font-semibold">{isAr ? 'إجمالي الفاتورة' : 'Total'}</th>
                <th className="py-3 px-4 text-end font-semibold">{isAr ? 'المبلغ المؤدى' : 'Payé'}</th>
                <th className="py-3 px-4 text-end font-semibold">{isAr ? 'المتبقي للمورد' : 'Reste'}</th>
                <th className="py-3 px-4 text-center font-semibold">{isAr ? 'الحالة' : 'État'}</th>
                <th className="py-3 px-4 text-end font-semibold">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {purchaseInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <Truck className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
                    <p>{isAr ? 'لا توجد فواتير شراء مسجلة بعد' : "Aucune facture d'achat pour le moment."}</p>
                  </td>
                </tr>
              ) : (
                purchaseInvoices.map(inv => (
                  <tr key={inv.Purchase_Invoice_ID} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {inv.Invoice_Number}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">
                      {getSupplierName(inv.Supplier_ID)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {inv.Supplier_Invoice_Number || '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {new Date(inv.Invoice_Date || inv.Created_At).toLocaleDateString('ar-MA')}
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
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {inv.Status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Record Payment to Supplier */}
                        <button
                          onClick={() => handleOpenSettle(inv)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            inv.Remaining_Amount > 0
                              ? 'text-amber-400 hover:text-emerald-400 hover:bg-slate-800 animate-pulse'
                              : 'text-slate-500 hover:text-emerald-400 hover:bg-slate-800'
                          }`}
                          title={isAr ? 'أداء دفعة للمورد' : 'Régler le fournisseur'}
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
                            const items = getInvoiceItems(inv.Purchase_Invoice_ID);
                            setPrintInvoice({ invoice: inv, items });
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                          title={isAr ? 'طباعة وتصدير PDF' : 'Imprimer / Export PDF'}
                        >
                          <Printer className="w-4 h-4" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleOpenEdit(inv)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
                          title={isAr ? 'تعديل الفاتورة' : 'Modifier'}
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(inv)}
                          disabled={isDeleting === inv.Purchase_Invoice_ID}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors disabled:opacity-50"
                          title={isAr ? 'حذف الفاتورة' : 'Supprimer'}
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

      {/* EDIT MODAL */}
      {editingInvoice && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Edit className="w-5 h-5 text-cyan-400" />
                  <span>{isAr ? 'تعديل فاتورة الشراء والتوريد' : "Modifier la Facture d'Achat"}</span>
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">{isAr ? 'المورد' : 'Fournisseur'}</label>
                  <select
                    value={editingInvoice.Supplier_ID}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, Supplier_ID: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  >
                    {suppliers.map(s => (
                      <option key={s.Supplier_ID} value={s.Supplier_ID}>{s.Supplier_Name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">{isAr ? 'رقم سند المورد' : 'N° BL Fournisseur'}</label>
                  <input
                    type="text"
                    value={editingInvoice.Supplier_Invoice_Number || ''}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, Supplier_Invoice_Number: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">{isAr ? 'المبلغ المؤدى للمورد' : 'Payé'}</label>
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
                  <span className="font-bold text-slate-300">{isAr ? 'الأصناف المستلمة والأسعار' : 'Articles'}</span>
                  <span className="text-[11px] text-slate-500">
                    {isAr ? 'يتم تعديل أرصدة المستودع تلقائياً' : 'Mise à jour automatique du stock'}
                  </span>
                </div>

                <div className="divide-y divide-slate-800">
                  {editItems.map((item, idx) => (
                    <div key={item.Purchase_Item_ID} className="p-3 bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex-1 w-full sm:w-auto">
                        <span className="font-semibold text-white block">
                          {products.find(p => p.Product_ID === item.Product_ID)?.Product_Name_AR || item.Product_ID}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.Supplier_Reference || item.Product_ID}</span>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="flex items-center gap-1.5">
                          <label className="text-slate-500 text-[11px]">{isAr ? 'الكمية:' : 'Qté:'}</label>
                          <input
                            type="number"
                            min="1"
                            value={item.Quantity}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 1;
                              setEditItems(prev => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], Quantity: newQty, Total: newQty * next[idx].Unit_Price };
                                return next;
                              });
                            }}
                            className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-center font-mono text-white"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <label className="text-slate-500 text-[11px]">{isAr ? 'سعر الشراء:' : 'P.U:'}</label>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={item.Unit_Price}
                            onChange={(e) => {
                              const newP = parseFloat(e.target.value) || 0;
                              setEditItems(prev => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], Unit_Price: newP, Unit_Cost: newP, Total: next[idx].Quantity * newP };
                                return next;
                              });
                            }}
                            className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-end font-mono text-white"
                          />
                        </div>

                        <span className="font-bold text-amber-400 font-mono min-w-[70px] text-end">
                          {item.Total.toFixed(2)} MAD
                        </span>
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
                <span>{isAr ? 'حفظ التعديلات ومزامنة Google Sheets' : 'Enregistrer'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE PURCHASE INVOICE MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <span>{isAr ? 'فاتورة شراء واستلام بضاعة جديدة' : 'Nouvelle Réception Marchandise'}</span>
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">{isAr ? 'المورد *' : 'Fournisseur *'}</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  >
                    {suppliers.map(s => (
                      <option key={s.Supplier_ID} value={s.Supplier_ID}>
                        {s.Supplier_Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">{isAr ? 'رقم فاتورة المورد' : 'N° Facture Fournisseur'}</label>
                  <input
                    type="text"
                    value={supplierInvoiceNumber}
                    onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                    placeholder="FAC-SUP-1234"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">{isAr ? 'تاريخ الفاتورة' : 'Date Facture'}</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">{isAr ? 'طريقة الأداء' : 'Paiement'}</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  >
                    <option value="Bank_Transfer">{isAr ? 'تحويل بنكي (Virement)' : 'Virement'}</option>
                    <option value="Cheque">{isAr ? 'شيك (Chèque)' : 'Chèque'}</option>
                    <option value="Cash">{isAr ? 'نقداً (Espèces)' : 'Espèces'}</option>
                    <option value="Credit">{isAr ? 'آجل / كريدي (Crédit)' : 'Crédit'}</option>
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-3 bg-slate-950 border-b border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-slate-300">{isAr ? 'قائمة المنتجات المشتراة' : 'Articles Achetés'}</span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إضافة سطر منتج' : 'Ajouter un article'}</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-800">
                  {invoiceItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-900 flex flex-wrap md:flex-nowrap items-center gap-3">
                      <div className="flex-1 min-w-[200px]">
                        <label className="text-[11px] text-slate-500 block mb-0.5">{isAr ? 'المنتج' : 'Article'}</label>
                        <select
                          value={item.productId}
                          onChange={(e) => updateItemRow(idx, { productId: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200"
                        >
                          {products.map(p => (
                            <option key={p.Product_ID} value={p.Product_ID}>
                              {p.Product_Name_AR} ({p.Internal_Reference})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-28">
                        <label className="text-[11px] text-slate-500 block mb-0.5">{isAr ? 'مرجع المورد' : 'Réf Fournisseur'}</label>
                        <input
                          type="text"
                          value={item.supplierReference}
                          onChange={(e) => updateItemRow(idx, { supplierReference: e.target.value })}
                          placeholder="REF-123"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200 font-mono"
                        />
                      </div>

                      <div className="w-20">
                        <label className="text-[11px] text-slate-500 block mb-0.5">{isAr ? 'الكمية' : 'Quantité'}</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItemRow(idx, { quantity: parseInt(e.target.value) || 1 })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-center font-mono text-slate-200"
                        />
                      </div>

                      <div className="w-24">
                        <label className="text-[11px] text-slate-500 block mb-0.5">{isAr ? 'سعر الوحدة' : 'Prix Achat'}</label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={item.unitPrice}
                          onChange={(e) => updateItemRow(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-end font-mono text-slate-200"
                        />
                      </div>

                      <div className="w-24 text-end">
                        <label className="text-[11px] text-slate-500 block mb-0.5">{isAr ? 'المجموع' : 'Total'}</label>
                        <span className="font-bold text-amber-400 font-mono block py-1.5">
                          {(item.quantity * item.unitPrice).toFixed(2)} MAD
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors mt-4 md:mt-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extras and Totals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="font-bold text-slate-300 block">{isAr ? 'تكاليف إضافية للتوريد والنقل' : 'Frais de transport & annexe'}</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1">{isAr ? 'تكلفة النقل / الشحن' : 'Frais Transport'}</label>
                      <input
                        type="number"
                        min="0"
                        value={transportCost}
                        onChange={(e) => setTransportCost(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">{isAr ? 'مصاريف أخرى' : 'Autres Frais'}</label>
                      <input
                        type="number"
                        min="0"
                        value={otherExpenses}
                        onChange={(e) => setOtherExpenses(parseFloat(e.target.value) || 0)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>{isAr ? 'المجموع الصافي للبضاعة:' : 'Sous-total:'}</span>
                    <span>{subtotal.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-amber-400 pt-2 border-t border-slate-800">
                    <span>{isAr ? 'الإجمالي الكلي للفاتورة:' : 'TOTAL:'}</span>
                    <span>{grandTotal.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-300">{isAr ? 'المبلغ المؤدى:' : 'Payé:'}</span>
                    <input
                      type="number"
                      min="0"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                      className="w-28 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-end text-emerald-400 font-bold"
                    />
                  </div>
                  <div className="flex justify-between text-rose-400 font-bold">
                    <span>{isAr ? 'المتبقي للمورد:' : 'Reste dû:'}</span>
                    <span>{remainingAmount.toFixed(2)} MAD</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg"
                >
                  {isAr ? 'تأكيد واستلام الفاتورة وتحديث المخزون' : 'Valider la réception'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILS MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Truck className="w-5 h-5 text-amber-400" />
                  <span>{isAr ? 'تفاصيل سند الشراء والتوريد' : "Détails du Bon d'Achat"}</span>
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
                  <span className="text-slate-500 block">{isAr ? 'المورد' : 'Fournisseur'}</span>
                  <span className="font-bold text-white">{getSupplierName(selectedInvoice.Supplier_ID)}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">{isAr ? 'التاريخ' : 'Date'}</span>
                  <span className="font-mono text-slate-300">
                    {new Date(selectedInvoice.Invoice_Date || selectedInvoice.Created_At).toLocaleDateString('ar-MA')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">{isAr ? 'رقم سند المورد' : 'N° Réf BL'}</span>
                  <span className="font-mono text-slate-300">{selectedInvoice.Supplier_Invoice_Number || '-'}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-500 block">{isAr ? 'المجموع' : 'Total'}</span>
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
                      <th className="py-2 px-3 text-end">{isAr ? 'سعر الشراء' : 'Prix Achat'}</th>
                      <th className="py-2 px-3 text-end">{isAr ? 'المجموع' : 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {getInvoiceItems(selectedInvoice.Purchase_Invoice_ID).map(item => (
                      <tr key={item.Purchase_Item_ID} className="hover:bg-slate-800/30">
                        <td className="py-2 px-3 font-medium text-slate-200">
                          {products.find(p => p.Product_ID === item.Product_ID)?.Product_Name_AR || item.Product_ID}
                        </td>
                        <td className="py-2 px-3 text-center font-mono">{item.Quantity}</td>
                        <td className="py-2 px-3 text-end font-mono">{item.Unit_Price.toFixed(2)} MAD</td>
                        <td className="py-2 px-3 text-end font-mono font-bold text-white">{item.Total.toFixed(2)} MAD</td>
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
                    handleOpenSettle(inv);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow transition-all"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>{isAr ? `أداء دفعة للمورد (${selectedInvoice.Remaining_Amount.toFixed(2)} MAD متبقية)` : 'Régler le fournisseur'}</span>
                </button>
              ) : <div />}

              <button
                onClick={() => {
                  const items = getInvoiceItems(selectedInvoice.Purchase_Invoice_ID);
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

      {/* SUPPLIER PAYMENT SETTLEMENT MODAL */}
      {settleInvoice && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    {isAr ? 'أداء دفعة لمورد (فاتورة شراء)' : 'Règlement Fournisseur'}
                  </h3>
                  <p className="text-xs text-amber-400 font-mono">{settleInvoice.Invoice_Number}</p>
                </div>
              </div>
              <button
                onClick={() => setSettleInvoice(null)}
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
                  <span className="font-bold text-white text-xs">{settleInvoice.Total.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">{isAr ? 'المدفوع سابقاً' : 'Déjà Payé'}</span>
                  <span className="font-bold text-emerald-400 text-xs">{settleInvoice.Paid_Amount.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">{isAr ? 'المتبقي الحالي' : 'Reste Dû'}</span>
                  <span className="font-bold text-rose-400 text-xs">{settleInvoice.Remaining_Amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Amount input */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  {isAr ? 'مبلغ الأداء للمورد (MAD) *' : 'Montant du Règlement (MAD) *'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.1"
                    step="0.1"
                    max={settleInvoice.Remaining_Amount > 0 ? settleInvoice.Remaining_Amount : settleInvoice.Total}
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-emerald-400 font-mono font-bold text-base focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setSettleAmount(settleInvoice.Remaining_Amount > 0 ? settleInvoice.Remaining_Amount : settleInvoice.Total)}
                    className="absolute end-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                  >
                    {isAr ? 'كامل الباقي' : 'Totalité'}
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">
                  {isAr ? 'طريقة الأداء' : 'Mode de Règlement'}
                </label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                >
                  <option value="Bank_Transfer">{isAr ? 'تحويل بنكي (Virement Bancaire)' : 'Virement Bancaire'}</option>
                  <option value="Cheque">{isAr ? 'شيك (Chèque)' : 'Chèque'}</option>
                  <option value="Cash">{isAr ? 'نقداً (Espèces)' : 'Espèces'}</option>
                  <option value="Card">{isAr ? 'بطاقة بنكية (Carte Bancaire)' : 'Carte Bancaire'}</option>
                </select>
              </div>

              {/* Bank selector if applicable */}
              {(settleMethod === 'Bank_Transfer' || settleMethod === 'Card') && (
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">
                    {isAr ? 'الحساب البنكي المسحوب منه' : 'Compte Bancaire'}
                  </label>
                  {bankAccounts.length === 0 ? (
                    <p className="text-amber-400 text-[11px] p-2 bg-amber-500/10 rounded-lg">
                      {isAr ? 'لم يتم إضافة حسابات بنكية بعد في قسم الحسابات البنكية' : 'Aucun compte bancaire configuré'}
                    </p>
                  ) : (
                    <select
                      value={settleBankId}
                      onChange={(e) => setSettleBankId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    >
                      {bankAccounts.map(b => (
                        <option key={b.Bank_ID} value={b.Bank_ID}>
                          {b.Bank_Name} ({b.Account_Number || 'حساب رئيسي'}) - رصيد: {b.Current_Balance.toFixed(2)} MAD
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Live Preview of Remaining Debt */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] flex justify-between items-center">
                <span className="text-slate-400">{isAr ? 'المتبقي بذمة المورد بعد الأداء:' : 'Reste dû après paiement:'}</span>
                <span className="font-mono font-bold text-white">
                  {Math.max(0, (settleInvoice.Remaining_Amount > 0 ? settleInvoice.Remaining_Amount : settleInvoice.Total) - settleAmount).toFixed(2)} MAD
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end gap-2 bg-slate-950/40">
              <button
                type="button"
                onClick={() => setSettleInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                type="button"
                disabled={isSubmittingSettle}
                onClick={handleConfirmSettle}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isAr ? 'تأكيد وحفظ الأداء في Google Sheets' : 'Valider le paiement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT & PDF MODAL */}
      {printInvoice && (
        <PurchaseInvoicePrintModal
          invoice={printInvoice.invoice}
          items={printInvoice.items}
          onClose={() => setPrintInvoice(null)}
        />
      )}
    </div>
  );
};
