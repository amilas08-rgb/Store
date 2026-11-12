/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { BankAccount, BankTransaction } from '../../types';
import {
  Landmark,
  Plus,
  ArrowRightLeft,
  DollarSign,
  CheckCircle2,
  X,
  Edit,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Save,
  CreditCard
} from 'lucide-react';

export const BankAccountsView: React.FC = () => {
  const {
    language,
    bankAccounts,
    bankTransactions,
    saveBankAccount,
    deleteBankAccount,
    saveBankTransaction,
    deleteBankTransaction
  } = useStore();
  const isAr = language === 'ar';

  // Bank Account Modal states
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  // Bank Transaction Modal states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<BankTransaction | null>(null);
  const [txBankId, setTxBankId] = useState(bankAccounts[0]?.Bank_ID || '');
  const [txType, setTxType] = useState<'DEPOSIT' | 'WITHDRAWAL' | 'SALE' | 'PURCHASE' | 'EXPENSE'>('DEPOSIT');
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txDesc, setTxDesc] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));

  const totalBankBalance = bankAccounts.reduce((acc, b) => acc + (b.Current_Balance || 0), 0);

  // Bank Account Handlers
  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    setBankName('');
    setAccountNumber('');
    setOpeningBalance(0);
    setIsAddAccountOpen(true);
  };

  const handleOpenEditAccount = (b: BankAccount) => {
    setEditingAccount(b);
    setBankName(b.Bank_Name);
    setAccountNumber(b.Account_Number);
    setOpeningBalance(b.Opening_Balance);
    setIsAddAccountOpen(true);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber) return;

    if (editingAccount) {
      saveBankAccount({
        Bank_ID: editingAccount.Bank_ID,
        Bank_Name: bankName,
        Account_Number: accountNumber,
        Opening_Balance: openingBalance,
        Current_Balance: editingAccount.Current_Balance,
        Active: true
      });
    } else {
      saveBankAccount({
        Bank_Name: bankName,
        Account_Number: accountNumber,
        Opening_Balance: openingBalance,
        Current_Balance: openingBalance,
        Active: true
      });
    }

    setIsAddAccountOpen(false);
    setEditingAccount(null);
  };

  const handleDeleteAccount = (b: BankAccount) => {
    const ok = window.confirm(
      isAr
        ? `هل أنت متأكد من حذف الحساب البنكي "${b.Bank_Name}"؟`
        : `Voulez-vous supprimer le compte bancaire "${b.Bank_Name}" ?`
    );
    if (ok) {
      deleteBankAccount(b.Bank_ID);
    }
  };

  // Transaction Handlers
  const handleOpenAddTx = () => {
    setEditingTx(null);
    setTxBankId(bankAccounts[0]?.Bank_ID || '');
    setTxType('DEPOSIT');
    setTxAmount(0);
    setTxDesc('');
    setTxDate(new Date().toISOString().slice(0, 10));
    setIsTxModalOpen(true);
  };

  const handleOpenEditTx = (tx: BankTransaction) => {
    setEditingTx(tx);
    setTxBankId(tx.Bank_ID);
    setTxType(tx.Transaction_Type);
    setTxAmount(tx.Amount);
    setTxDesc(tx.Description);
    setTxDate(tx.Date ? tx.Date.slice(0, 10) : new Date().toISOString().slice(0, 10));
    setIsTxModalOpen(true);
  };

  const handleSaveTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (txAmount <= 0) {
      alert(isAr ? 'يرجى إدخال مبلغ صحيح أكبر من الصفر' : 'Montant invalide');
      return;
    }

    if (editingTx) {
      // Revert previous and apply new
      deleteBankTransaction(editingTx.Bank_Transaction_ID);
      saveBankTransaction({
        Bank_Transaction_ID: editingTx.Bank_Transaction_ID,
        Bank_ID: txBankId,
        Transaction_Type: txType,
        Amount: txAmount,
        Description: txDesc,
        Date: new Date(txDate).toISOString()
      });
    } else {
      saveBankTransaction({
        Bank_ID: txBankId,
        Transaction_Type: txType,
        Amount: txAmount,
        Description: txDesc || (txType === 'DEPOSIT' ? 'إيداع بنكي' : 'سحب بنكي'),
        Date: new Date(txDate).toISOString()
      });
    }

    setIsTxModalOpen(false);
    setEditingTx(null);
  };

  const handleDeleteTx = (tx: BankTransaction) => {
    const ok = window.confirm(
      isAr
        ? `هل تريد حذف الحركة البنكية بمبلغ ${tx.Amount} MAD؟ سيتم تعديل رصيد الحساب تلقائياً.`
        : `Supprimer cette transaction bancaire de ${tx.Amount} MAD ?`
    );
    if (ok) {
      deleteBankTransaction(tx.Bank_Transaction_ID);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Landmark className="w-6 h-6 text-amber-400" />
            <span>{isAr ? 'الحسابات والعمليات البنكية' : 'Comptes & Transactions Bancaires'}</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            {isAr
              ? `إجمالي السيولة البنكية: ${totalBankBalance.toFixed(2)} MAD عبر ${bankAccounts.length} حسابات مسجلة`
              : `Total liquidités bancaires: ${totalBankBalance.toFixed(2)} MAD`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenAddTx}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs md:text-sm border border-slate-700 shadow transition-all"
          >
            <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'تسجيل حركة / تحويل' : 'Nouvelle Transaction'}</span>
          </button>

          <button
            onClick={handleOpenAddAccount}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm shadow-lg shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'إضافة حساب بنكي جديد' : 'Nouveau Compte'}</span>
          </button>
        </div>
      </div>

      {/* Accounts Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bankAccounts.map(b => (
          <div key={b.Bank_ID} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 relative group">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-white text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  <span>{b.Bank_Name}</span>
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-1">{b.Account_Number}</p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleOpenEditAccount(b)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title={isAr ? 'تعديل الحساب' : 'Modifier'}
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDeleteAccount(b)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title={isAr ? 'حذف الحساب' : 'Supprimer'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400">{isAr ? 'الرصيد الفعلي الحالي:' : 'Solde Actuel:'}</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {b.Current_Balance.toFixed(2)} MAD
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-white text-sm">
            {isAr ? 'سجل العمليات والتحويلات البنكية' : 'Mouvements Bancaires'}
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {bankTransactions.length} {isAr ? 'حركات مسجلة' : 'transactions'}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                <th className="py-2.5 px-4 text-start">{isAr ? 'الحساب البنكي' : 'Compte'}</th>
                <th className="py-2.5 px-4 text-start">{isAr ? 'النوع' : 'Type'}</th>
                <th className="py-2.5 px-4 text-start">{isAr ? 'البيان' : 'Description'}</th>
                <th className="py-2.5 px-4 text-end">{isAr ? 'المبلغ' : 'Montant'}</th>
                <th className="py-2.5 px-4 text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bankTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    {isAr ? 'لا توجد حركات بنكية مسجلة بعد' : 'Aucune transaction bancaire'}
                  </td>
                </tr>
              ) : (
                bankTransactions.map(tx => {
                  const isPositive = tx.Transaction_Type === 'DEPOSIT' || tx.Transaction_Type === 'SALE';
                  const account = bankAccounts.find(b => b.Bank_ID === tx.Bank_ID);
                  return (
                    <tr key={tx.Bank_Transaction_ID} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 text-slate-400">
                        {new Date(tx.Date).toLocaleDateString('ar-MA')}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-200">
                        {account?.Bank_Name || tx.Bank_ID}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPositive
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}>
                          {tx.Transaction_Type}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-300">
                        {tx.Description}
                      </td>
                      <td className={`py-2.5 px-4 text-end font-mono font-bold ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {isPositive ? '+' : '-'}{tx.Amount.toFixed(2)} MAD
                      </td>
                      <td className="py-2.5 px-4 text-end">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditTx(tx)}
                            className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
                            title={isAr ? 'تعديل الحركة' : 'Modifier'}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTx(tx)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                            title={isAr ? 'حذف الحركة' : 'Supprimer'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* ADD / EDIT BANK ACCOUNT MODAL */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">
                {editingAccount
                  ? (isAr ? 'تعديل بيانات الحساب البنكي' : 'Modifier Compte Bancaire')
                  : (isAr ? 'إضافة حساب بنكي جديد' : 'Nouveau Compte Bancaire')}
              </h3>
              <button onClick={() => setIsAddAccountOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveAccount} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'اسم البنك:' : 'Nom de la banque:'}</label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Attijariwafa Bank / BMCE / CIH..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'رقم الحساب (RIB):' : 'Numéro de compte (RIB):'}</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="007 780 0001234567890123 45"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'الرصيد الافتتاحي (MAD):' : 'Solde d’ouverture:'}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddAccountOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  {isAr ? 'حفظ الحساب' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT TRANSACTION MODAL */}
      {isTxModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">
                {editingTx
                  ? (isAr ? 'تعديل الحركة البنكية' : 'Modifier Transaction')
                  : (isAr ? 'تسجيل حركة بنكية جديدة' : 'Nouvelle Transaction')}
              </h3>
              <button onClick={() => setIsTxModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTx} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'الحساب البنكي:' : 'Compte Bancaire:'}</label>
                <select
                  value={txBankId}
                  onChange={(e) => setTxBankId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  {bankAccounts.map(b => (
                    <option key={b.Bank_ID} value={b.Bank_ID}>{b.Bank_Name} ({b.Current_Balance} MAD)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'نوع الحركة:' : 'Type:'}</label>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="DEPOSIT">{isAr ? 'إيداع نقدي / تحويل وارد (+)' : 'Dépôt (+)'}</option>
                  <option value="WITHDRAWAL">{isAr ? 'سحب نقدي / تحويل صادر (-)' : 'Retrait (-)'}</option>
                  <option value="EXPENSE">{isAr ? 'اقتطاع مصاريف بنكية (-)' : 'Frais Bancaires (-)'}</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'المبلغ (MAD):' : 'Montant:'}</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.01"
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-base font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'التاريخ:' : 'Date:'}</label>
                <input
                  type="date"
                  required
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'البيان والتفاصيل:' : 'Description:'}</label>
                <input
                  type="text"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  placeholder="سبب الحركة أو رقم التحويل..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  {isAr ? 'حفظ الحركة' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
