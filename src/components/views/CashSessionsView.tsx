/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { CashSession, CashTransaction } from '../../types';
import {
  Wallet,
  Play,
  Square,
  ArrowDownCircle,
  ArrowUpCircle,
  DollarSign,
  History,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X
} from 'lucide-react';

export const CashSessionsView: React.FC = () => {
  const {
    language,
    cashSessions,
    activeCashSession,
    cashTransactions,
    openCashSession,
    closeCashSession,
    recordCashTransaction
  } = useStore();

  const isAr = language === 'ar';

  const [openModal, setOpenModal] = useState(false);
  const [openingBalanceInput, setOpeningBalanceInput] = useState<number>(1000);

  const [closeModal, setCloseModal] = useState(false);
  const [countedBalanceInput, setCountedBalanceInput] = useState<number>(0);

  const [manualTxModal, setManualTxModal] = useState(false);
  const [txType, setTxType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  const [txAmount, setTxAmount] = useState<number>(100);
  const [txDescription, setTxDescription] = useState('');

  // Active Session calculations
  const sessionSales = activeCashSession
    ? cashTransactions
        .filter(t => t.Session_ID === activeCashSession.Session_ID && t.Transaction_Type === 'SALE')
        .reduce((a, b) => a + b.Amount, 0)
    : 0;

  const sessionExpenses = activeCashSession
    ? cashTransactions
        .filter(t => t.Session_ID === activeCashSession.Session_ID && t.Transaction_Type === 'EXPENSE')
        .reduce((a, b) => a + b.Amount, 0)
    : 0;

  const sessionDeposits = activeCashSession
    ? cashTransactions
        .filter(t => t.Session_ID === activeCashSession.Session_ID && t.Transaction_Type === 'DEPOSIT')
        .reduce((a, b) => a + b.Amount, 0)
    : 0;

  const sessionWithdrawals = activeCashSession
    ? cashTransactions
        .filter(t => t.Session_ID === activeCashSession.Session_ID && t.Transaction_Type === 'WITHDRAWAL')
        .reduce((a, b) => a + b.Amount, 0)
    : 0;

  const theoreticalBalance = activeCashSession
    ? activeCashSession.Opening_Balance + sessionSales + sessionDeposits - sessionExpenses - sessionWithdrawals
    : 0;

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    openCashSession(openingBalanceInput);
    setOpenModal(false);
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    closeCashSession(countedBalanceInput);
    setCloseModal(false);
  };

  const handleManualTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDescription) {
      alert('يرجى كتابة سبب العملية');
      return;
    }
    recordCashTransaction(txType, txAmount, txDescription);
    setManualTxModal(false);
    setTxDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Wallet className="w-6 h-6 text-amber-400" />
            <span>{isAr ? 'إدارة الصندوق وورديات الكاشير' : 'Caisse & Sessions de Vente'}</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            {isAr
              ? 'مراقبة الرصيد النظري والفعلي وفروقات الصندوق في ورقتي CASH_SESSIONS و CASH_TRANSACTIONS'
              : 'Suivi de la caisse, écarts et mouvements de liquidités'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeCashSession ? (
            <>
              <button
                onClick={() => setManualTxModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
              >
                <span>{isAr ? 'إيداع / سحب يدوي' : 'Mouvement Espèces'}</span>
              </button>
              <button
                onClick={() => {
                  setCountedBalanceInput(Math.round(theoreticalBalance));
                  setCloseModal(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs md:text-sm shadow"
              >
                <Square className="w-4 h-4" />
                <span>{isAr ? 'إغلاق الوردية وجرد الصندوق' : 'Clôturer la Caisse'}</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setOpenModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs md:text-sm shadow-lg shadow-emerald-500/20"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>{isAr ? 'فتح وردية صندوق جديدة' : 'Ouvrir la Caisse'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ACTIVE SESSION DASHBOARD */}
      {activeCashSession ? (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {isAr ? 'جلسة الصندوق مفتوحة ونشطة' : 'Session Active'}
              </span>
              <h3 className="text-lg font-bold text-white mt-2">
                {isAr ? `مسؤول الوردية: ${activeCashSession.Opened_By}` : `Caissier: ${activeCashSession.Opened_By}`}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {isAr ? 'وقت الفتح:' : 'Ouverte à:'} {new Date(activeCashSession.Opened_At).toLocaleString('ar-MA')}
              </p>
            </div>

            <div className="text-start sm:text-end">
              <span className="text-xs text-slate-400 block">{isAr ? 'الرصيد النظري المتوقع في الدرج:' : 'Solde Théorique:'}</span>
              <span className="text-3xl font-black text-amber-400 font-mono">
                {theoreticalBalance.toFixed(2)} <span className="text-sm">MAD</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block mb-1">{isAr ? 'رصيد البداية (Fond de Caisse):' : 'Fond initial:'}</span>
              <span className="text-lg font-bold text-white font-mono">{activeCashSession.Opening_Balance.toFixed(2)} MAD</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block mb-1">{isAr ? 'مقبوضات المبيعات نقداً:' : 'Ventes Espèces:'}</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">+{sessionSales.toFixed(2)} MAD</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block mb-1">{isAr ? 'مدفوعات ومصاريف نقدية:' : 'Dépenses Espèces:'}</span>
              <span className="text-lg font-bold text-rose-400 font-mono">-{sessionExpenses.toFixed(2)} MAD</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block mb-1">{isAr ? 'صافي الإيداعات / السحوبات:' : 'Dépôts/Retraits:'}</span>
              <span className="text-lg font-bold text-slate-200 font-mono">{(sessionDeposits - sessionWithdrawals).toFixed(2)} MAD</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <Wallet className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="font-bold text-white text-base">
            {isAr ? 'لا توجد وردية صندوق مفتوحة حالياً' : 'Aucune session de caisse active'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {isAr
              ? 'لبدء استقبال عمليات البيع النقدي وتسجيل المقبوضات بدقة، يرجى فتح الوردية وتحديد رصيد البداية.'
              : 'Ouvrez une session avec le fond de caisse initial pour commencer les ventes.'}
          </p>
          <button
            onClick={() => setOpenModal(true)}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow"
          >
            {isAr ? 'فتح الصندوق الآن' : 'Ouvrir la Caisse'}
          </button>
        </div>
      )}

      {/* SESSIONS HISTORY */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            <span>{isAr ? 'سجل جلسات الصندوق السابقة' : 'Historique des Sessions de Caisse'}</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-4 text-start">{isAr ? 'معرف الجلسة' : 'Session'}</th>
                <th className="py-2.5 px-4 text-start">{isAr ? 'المسؤول' : 'Caissier'}</th>
                <th className="py-2.5 px-4 text-start">{isAr ? 'وقت الفتح' : 'Ouverture'}</th>
                <th className="py-2.5 px-4 text-end">{isAr ? 'رصيد البداية' : 'Fond'}</th>
                <th className="py-2.5 px-4 text-end">{isAr ? 'الرصيد النظري' : 'Théorique'}</th>
                <th className="py-2.5 px-4 text-end">{isAr ? 'الرصيد الفعلي بعد الجرد' : 'Compté'}</th>
                <th className="py-2.5 px-4 text-end">{isAr ? 'الفارق' : 'Écart'}</th>
                <th className="py-2.5 px-4 text-center">{isAr ? 'الحالة' : 'État'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {cashSessions.map(session => (
                <tr key={session.Session_ID} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-mono font-bold text-amber-400">{session.Session_ID}</td>
                  <td className="py-2.5 px-4 font-medium text-slate-200">{session.Opened_By}</td>
                  <td className="py-2.5 px-4 text-slate-400">{new Date(session.Opened_At).toLocaleDateString('ar-MA')}</td>
                  <td className="py-2.5 px-4 text-end font-mono text-slate-300">{session.Opening_Balance.toFixed(2)} MAD</td>
                  <td className="py-2.5 px-4 text-end font-mono text-slate-300">{session.Expected_Balance ? session.Expected_Balance.toFixed(2) : '-'} MAD</td>
                  <td className="py-2.5 px-4 text-end font-mono font-bold text-white">{session.Closing_Balance ? session.Closing_Balance.toFixed(2) : '-'} MAD</td>
                  <td className="py-2.5 px-4 text-end font-mono font-bold">
                    {session.Status === 'Closed' ? (
                      <span className={session.Difference >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {session.Difference >= 0 ? `+${session.Difference.toFixed(2)}` : session.Difference.toFixed(2)} MAD
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      session.Status === 'Open' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {session.Status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* OPEN SESSION MODAL */}
      {openModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-white text-base">{isAr ? 'فتح وردية صندوق جديدة' : 'Ouverture de Caisse'}</h3>
            <form onSubmit={handleOpenShift} className="space-y-4">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">{isAr ? 'رصيد الصرف الافتتاحي (MAD):' : 'Fond de caisse (MAD):'}</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={openingBalanceInput}
                  onChange={(e) => setOpeningBalanceInput(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold text-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setOpenModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold">
                  {isAr ? 'تأكيد الفتح' : 'Ouvrir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLOSE SESSION MODAL */}
      {closeModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-white text-base">{isAr ? 'إغلاق الوردية وجرد النقدية' : 'Clôture de Caisse'}</h3>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <span className="text-slate-400 block">{isAr ? 'الرصيد النظري المتوقع:' : 'Théorique attendu:'}</span>
              <span className="text-2xl font-black text-amber-400 font-mono">{theoreticalBalance.toFixed(2)} MAD</span>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-4">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">{isAr ? 'المبلغ الفعلي المعدود في الدرج:' : 'Montant Réel Compté:'}</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={countedBalanceInput}
                  onChange={(e) => setCountedBalanceInput(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold text-lg"
                />
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">{isAr ? 'الفارق الناتج:' : 'Écart:'}</span>
                <span className={`font-mono font-bold text-sm ${countedBalanceInput - theoreticalBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {(countedBalanceInput - theoreticalBalance).toFixed(2)} MAD
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setCloseModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold">
                  {isAr ? 'إغلاق الوردية نهائياً' : 'Clôturer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL TX MODAL */}
      {manualTxModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-white text-base">{isAr ? 'حركة نقدية يدوية في الصندوق' : 'Mouvement Espèces'}</h3>
            <form onSubmit={handleManualTx} className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'نوع الحركة:' : 'Type:'}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTxType('DEPOSIT')}
                    className={`py-2 rounded-lg font-bold border ${txType === 'DEPOSIT' ? 'bg-emerald-500 text-slate-950 border-emerald-500' : 'bg-slate-950 text-slate-300 border-slate-800'}`}
                  >
                    {isAr ? 'إيداع نقدية' : 'Dépôt'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('WITHDRAWAL')}
                    className={`py-2 rounded-lg font-bold border ${txType === 'WITHDRAWAL' ? 'bg-rose-500 text-white border-rose-500' : 'bg-slate-950 text-slate-300 border-slate-800'}`}
                  >
                    {isAr ? 'سحب نقدية' : 'Retrait'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'المبلغ (MAD):' : 'Montant:'}</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'السبب / البيان:' : 'Motif:'}</label>
                <input
                  type="text"
                  required
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  placeholder={isAr ? 'مثال: تغذية الصندوق بمصروف نثريات' : 'Motif...'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setManualTxModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300">
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button type="submit" className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold">
                  {isAr ? 'تسجيل الحركة' : 'Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
