/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { ReturnRecord, ReturnItem } from '../../types';
import { Undo2, Plus, Search, Calendar, DollarSign, Package, CheckCircle2, X } from 'lucide-react';

export const ReturnsView: React.FC = () => {
  const { language, returns, returnItems, products, salesInvoices, purchaseInvoices, processReturn } = useStore();
  const isAr = language === 'ar';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [returnType, setReturnType] = useState<'CUSTOMER_RETURN' | 'SUPPLIER_RETURN'>('CUSTOMER_RETURN');
  const [originalInvoiceId, setOriginalInvoiceId] = useState('');
  const [productId, setProductId] = useState(products[0]?.Product_ID || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [unitPrice, setUnitPrice] = useState<number>(100);
  const [reason, setReason] = useState(isAr ? 'عيب مصنعي في السلعة' : 'Défaut de fabrication');

  const selectedProduct = products.find(p => p.Product_ID === productId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || quantity <= 0) return;

    const total = quantity * unitPrice;
    const unitCost = selectedProduct?.Average_Purchase_Cost || unitPrice;

    processReturn(
      {
        Original_Invoice_ID: originalInvoiceId || 'DIRECT_RETURN',
        Return_Type: returnType,
        Customer_ID: returnType === 'CUSTOMER_RETURN' ? 'CUST-000' : '',
        Supplier_ID: returnType === 'SUPPLIER_RETURN' ? 'SUP-001' : '',
        Return_Date: new Date().toISOString(),
        Total_Amount: total,
        Reason: reason,
        Status: 'Completed',
        Created_By: 'المدير'
      },
      [
        {
          Product_ID: productId,
          Quantity: quantity,
          Unit_Price: unitPrice,
          Unit_Cost: unitCost,
          Total: total
        }
      ]
    );

    setIsModalOpen(false);
    alert('تم تسجيل المرتجع وتحديث رصيد المخزون والصندوق بنجاح!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Undo2 className="w-6 h-6 text-amber-400" />
            <span>{isAr ? 'إدارة المرتجعات (بيع وشراء)' : 'Gestion des Retours'}</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            {isAr
              ? `إجمالي المرتجعات: ${returns.length} حركة مسجلة في ورقتي RETURNS و RETURN_ITEMS`
              : `${returns.length} retours enregistrés`}
          </p>
        </div>

        <button
          onClick={() => {
            if (products[0]) {
              setProductId(products[0].Product_ID);
              setUnitPrice(products[0].Current_Selling_Price);
            }
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm shadow"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'تسجيل مرتجع جديد' : 'Nouveau Retour'}</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 text-start">{isAr ? 'رقم المرتجع' : 'Réf'}</th>
                <th className="py-2.5 px-4 text-start">{isAr ? 'نوع المرتجع' : 'Type'}</th>
                <th className="py-2.5 px-4 text-start">{isAr ? 'الفاتورة الأصلية' : 'Facture Originale'}</th>
                <th className="py-2.5 px-4 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="py-2.5 px-4 text-start">{isAr ? 'السبب' : 'Motif'}</th>
                <th className="py-2.5 px-4 text-end">{isAr ? 'المبلغ' : 'Montant'}</th>
                <th className="py-2.5 px-4 text-center">{isAr ? 'الحالة' : 'État'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {returns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    {isAr ? 'لا توجد مرتجعات مسجلة' : 'Aucun retour enregistré'}
                  </td>
                </tr>
              ) : (
                returns.map(ret => (
                  <tr key={ret.Return_ID} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono font-bold text-amber-400">{ret.Return_ID}</td>
                    <td className="py-2.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ret.Return_Type === 'CUSTOMER_RETURN' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {ret.Return_Type === 'CUSTOMER_RETURN' ? (isAr ? 'مرتجع من زبون' : 'Client') : (isAr ? 'مرتجع إلى مورد' : 'Fournisseur')}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-300">{ret.Original_Invoice_ID}</td>
                    <td className="py-2.5 px-4 text-slate-400">{new Date(ret.Return_Date).toLocaleDateString('ar-MA')}</td>
                    <td className="py-2.5 px-4 text-slate-300">{ret.Reason}</td>
                    <td className="py-2.5 px-4 text-end font-mono font-bold text-white">{ret.Total_Amount.toFixed(2)} MAD</td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                        {ret.Status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">{isAr ? 'تسجيل مرتجع سلع' : 'Nouveau Retour'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'نوع المرتجع:' : 'Type:'}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReturnType('CUSTOMER_RETURN');
                      if (selectedProduct) setUnitPrice(selectedProduct.Current_Selling_Price);
                    }}
                    className={`py-2 rounded-xl font-bold border ${returnType === 'CUSTOMER_RETURN' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-950 text-slate-300 border-slate-800'}`}
                  >
                    {isAr ? 'مرتجع مبيعات (من زبون)' : 'Retour Client'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReturnType('SUPPLIER_RETURN');
                      if (selectedProduct) setUnitPrice(selectedProduct.Last_Purchase_Price);
                    }}
                    className={`py-2 rounded-xl font-bold border ${returnType === 'SUPPLIER_RETURN' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-950 text-slate-300 border-slate-800'}`}
                  >
                    {isAr ? 'مرتجع مشتريات (إلى مورد)' : 'Retour Fournisseur'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'المنتج المرتجع:' : 'Article:'}</label>
                <select
                  value={productId}
                  onChange={(e) => {
                    setProductId(e.target.value);
                    const p = products.find(prod => prod.Product_ID === e.target.value);
                    if (p) setUnitPrice(returnType === 'CUSTOMER_RETURN' ? p.Current_Selling_Price : p.Last_Purchase_Price);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {products.map(p => (
                    <option key={p.Product_ID} value={p.Product_ID}>
                      {p.Product_Name_AR} ({p.Internal_Reference})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">{isAr ? 'الكمية المرتجعة:' : 'Quantité:'}</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">{isAr ? 'السعر المتفق عليه (MAD):' : 'Prix:'}</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'سبب الإرجاع:' : 'Motif du retour:'}</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="عيب مصنعي، تبديل مقاس، إلغاء طلب..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
                  {isAr ? 'تأكيد المرتجع واستعادة المخزون' : 'Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
