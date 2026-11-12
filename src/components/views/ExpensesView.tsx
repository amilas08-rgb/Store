/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Expense } from '../../types';
import {
  BadgeDollarSign,
  Plus,
  Search,
  Filter,
  DollarSign,
  Calendar,
  Tag,
  Paperclip,
  CheckCircle2,
  X
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { language, expenses, recordExpense, bankAccounts, activeCashSession } = useStore();
  const isAr = language === 'ar';

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [category, setCategory] = useState('كراء المحل (Loyer)');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank' | 'Cheque'>('Cash');
  const [bankId, setBankId] = useState(bankAccounts[0]?.Bank_ID || '');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const expenseCategories = [
    { ar: 'كراء المحل', fr: 'Loyer Commercial' },
    { ar: 'الكهرباء والماء', fr: 'Électricité & Eau' },
    { ar: 'الهاتف والإنترنت', fr: 'Téléphone & Internet' },
    { ar: 'الأجور والرواتب', fr: 'Salaires' },
    { ar: 'النقل والشحن', fr: 'Transport & Livraison' },
    { ar: 'صيانة وتجهيزات', fr: 'Maintenance & Réparations' },
    { ar: 'لوازم ومستلزمات مكتبية', fr: 'Fournitures de Bureau' },
    { ar: 'مصاريف ضريبية وجبائية', fr: 'Taxes & Impôts' },
    { ar: 'مصاريف أخرى متنوعة', fr: 'Divers' }
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('يرجى إدخال مبلغ صحيح');
      return;
    }

    recordExpense({
      Category: category,
      Description: description,
      Amount: amount,
      Payment_Method: paymentMethod,
      Bank_ID: paymentMethod === 'Bank' ? bankId : '',
      Supplier_ID: '',
      Expense_Date: expenseDate,
      Attachment_URL: attachmentUrl,
      User_ID: 'USR-001'
    });

    setIsAddOpen(false);
    setDescription('');
    setAmount(0);
  };

  const totalExpensesAmount = expenses.reduce((acc, exp) => acc + (exp.Amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <BadgeDollarSign className="w-6 h-6 text-amber-400" />
            <span>{isAr ? 'مصاريف ونفقات المحل التشغيلية' : 'Dépenses & Charges'}</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            {isAr
              ? `إجمالي المصاريف: ${totalExpensesAmount.toFixed(2)} MAD مسجلة في ورقة EXPENSES`
              : `Total charges: ${totalExpensesAmount.toFixed(2)} MAD`}
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm shadow"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'تسجيل مصروف جديد' : 'Nouvelle Dépense'}</span>
        </button>
      </div>

      {/* Expenses Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 text-start">{isAr ? 'رقم السند' : 'N° Réf'}</th>
                <th className="py-2.5 px-4 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="py-2.5 px-4 text-start">{isAr ? 'التصنيف' : 'Catégorie'}</th>
                <th className="py-2.5 px-4 text-start">{isAr ? 'البيان / الوصف' : 'Description'}</th>
                <th className="py-2.5 px-4 text-start">{isAr ? 'طريقة السداد' : 'Paiement'}</th>
                <th className="py-2.5 px-4 text-end">{isAr ? 'المبلغ' : 'Montant'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    {isAr ? 'لم تسجل أي مصاريف بعد' : 'Aucune dépense enregistrée'}
                  </td>
                </tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp.Expense_ID} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-mono font-bold text-amber-400">{exp.Expense_Number}</td>
                    <td className="py-2.5 px-4 text-slate-400">{new Date(exp.Expense_Date).toLocaleDateString('ar-MA')}</td>
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

      {/* ADD EXPENSE MODAL */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">{isAr ? 'تسجيل مصروف تشغيلي' : 'Enregistrer une Charge'}</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'تصنيف المصروف:' : 'Catégorie:'}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {expenseCategories.map(cat => (
                    <option key={cat.ar} value={isAr ? cat.ar : cat.fr}>
                      {isAr ? cat.ar : cat.fr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'المبلغ (MAD):' : 'Montant:'}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold text-base"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'طريقة السداد:' : 'Mode de Paiement:'}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cash')}
                    className={`py-2 rounded-xl font-bold border ${paymentMethod === 'Cash' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-950 text-slate-300 border-slate-800'}`}
                  >
                    {isAr ? 'نقداً من الصندوق' : 'Espèces (Caisse)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Bank')}
                    className={`py-2 rounded-xl font-bold border ${paymentMethod === 'Bank' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-950 text-slate-300 border-slate-800'}`}
                  >
                    {isAr ? 'حساب بنكي' : 'Compte Bancaire'}
                  </button>
                </div>
              </div>

              {paymentMethod === 'Bank' && (
                <div>
                  <label className="text-slate-400 block mb-1">{isAr ? 'اختر الحساب البنكي:' : 'Compte:'}</label>
                  <select
                    value={bankId}
                    onChange={(e) => setBankId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    {bankAccounts.map(b => (
                      <option key={b.Bank_ID} value={b.Bank_ID}>
                        {b.Bank_Name} ({b.Current_Balance} MAD)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'البيان والتفاصيل:' : 'Description:'}</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="فاتورة كهرباء شهر نوفمبر"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'التاريخ:' : 'Date:'}</label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setIsAddOpen(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button type="submit" className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
                  {isAr ? 'تسجيل المصروف' : 'Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
