/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useStore } from '../../context/StoreContext';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Scale,
  Receipt,
  Truck,
  BadgeDollarSign,
  Package,
  Layers
} from 'lucide-react';

export const ProfitsView: React.FC = () => {
  const {
    language,
    salesInvoices,
    salesItems,
    purchaseInvoices,
    expenses,
    products,
    customers,
    suppliers
  } = useStore();

  const isAr = language === 'ar';

  // 1. Turnover / Revenue (CA)
  const totalTurnover = salesInvoices.reduce((acc, inv) => acc + (inv.Total || 0), 0);

  // 2. Cost of Goods Sold (COGS)
  const totalCOGS = salesItems.reduce((acc, it) => acc + (it.Quantity * (it.Purchase_Cost_At_Sale || 0)), 0);

  // 3. Gross Profit
  const grossProfit = totalTurnover - totalCOGS;
  const grossMarginPercent = totalTurnover > 0 ? (grossProfit / totalTurnover) * 100 : 0;

  // 4. Operating Expenses
  const totalOperatingExpenses = expenses.reduce((acc, exp) => acc + (exp.Amount || 0), 0);

  // 5. Net Profit
  const netProfit = grossProfit - totalOperatingExpenses;
  const netMarginPercent = totalTurnover > 0 ? (netProfit / totalTurnover) * 100 : 0;

  // 6. Balance Sheet Highlights
  const stockAssetValue = products.reduce((acc, p) => acc + (p.Current_Stock * (p.Average_Purchase_Cost || p.Last_Purchase_Price || 0)), 0);
  const totalCustomerReceivables = customers.reduce((acc, c) => acc + (c.Current_Balance || 0), 0);
  const totalSupplierPayables = suppliers.reduce((acc, s) => acc + (s.Current_Balance || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-emerald-400" />
          <span>{isAr ? 'المحرك المالي وتحليل الأرباح الحقيقية' : 'Moteur Financier & Analyse de Rentabilité'}</span>
        </h2>
        <p className="text-xs md:text-sm text-slate-400">
          {isAr
            ? 'المعادلة المحاسبية المعتمدة: صافي الربح = رقم المعاملات - تكلفة البضاعة المباعة (COGS) - المصاريف العامة'
            : 'Formule comptable: Résultat Net = Chiffre d’Affaires - Coût d’Achat Vendu - Charges d’Exploitation'}
        </p>
      </div>

      {/* Main Income Statement Cascade */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <Scale className="w-5 h-5 text-amber-400" />
          <span>{isAr ? 'جدول حسابات النتائج (Compte de Résultat)' : 'Compte de Résultat'}</span>
        </h3>

        <div className="space-y-3 text-xs">
          {/* Revenue */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-200 text-sm block">
                {isAr ? '(+) رقم المعاملات الإجمالي (Chiffre d’Affaires - CA)' : '(+) Chiffre d’Affaires (Ventes)'}
              </span>
              <span className="text-slate-500">{isAr ? 'إجمالي المبيعات المحققة لجميع الزبائن' : 'Total des ventes'}</span>
            </div>
            <span className="text-lg font-black text-white font-mono">{totalTurnover.toFixed(2)} MAD</span>
          </div>

          {/* COGS */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-rose-300">
            <div>
              <span className="font-bold text-sm block">
                {isAr ? '(-) تكلفة البضاعة المباعة (Coût d’Achat des Marchandises Vendues)' : '(-) Coût d’Achat des Ventes (COGS)'}
              </span>
              <span className="text-slate-500">{isAr ? 'التكلفة التاريخية الدقيقة للسلع التي خرجت من المخزن وقت بيعها' : 'Prix d’achat moyen pondéré'}</span>
            </div>
            <span className="text-lg font-black font-mono">-{totalCOGS.toFixed(2)} MAD</span>
          </div>

          {/* Gross Margin */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-amber-300">
            <div>
              <span className="font-bold text-sm block">
                {isAr ? '(=) هامش الربح الإجمالي (Marge Brute)' : '(=) Marge Brute Globale'}
              </span>
              <span className="text-amber-400/70">{isAr ? `نسبة الهامش التجاري: ${grossMarginPercent.toFixed(1)}%` : `Taux de marge: ${grossMarginPercent.toFixed(1)}%`}</span>
            </div>
            <span className="text-xl font-black font-mono">{grossProfit.toFixed(2)} MAD</span>
          </div>

          {/* Operating Expenses */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-rose-300">
            <div>
              <span className="font-bold text-sm block">
                {isAr ? '(-) المصاريف التشغيلية والنفقات العامة (Charges d’Exploitation)' : '(-) Charges d’Exploitation (Frais Généraux)'}
              </span>
              <span className="text-slate-500">{isAr ? 'الكراء، الكهرباء، الرواتب، النقل، الاتصالات، الصيانة' : 'Loyer, salaires, énergie, transport'}</span>
            </div>
            <span className="text-lg font-black font-mono">-{totalOperatingExpenses.toFixed(2)} MAD</span>
          </div>

          {/* NET PROFIT */}
          <div className={`p-5 rounded-2xl border flex items-center justify-between shadow-lg ${
            netProfit >= 0
              ? 'bg-gradient-to-r from-emerald-950 to-slate-950 border-emerald-500/50 text-emerald-400'
              : 'bg-gradient-to-r from-rose-950 to-slate-950 border-rose-500/50 text-rose-400'
          }`}>
            <div>
              <span className="font-black text-base md:text-lg block">
                {isAr ? '(=) صافي الربح الفعلي للمحل (Résultat Net)' : '(=) RÉSULTAT NET RÉEL'}
              </span>
              <span className="text-xs opacity-80">
                {isAr ? `معدل المردودية الصافي: ${netMarginPercent.toFixed(1)}% من رقم المعاملات` : `Rentabilité nette: ${netMarginPercent.toFixed(1)}%`}
              </span>
            </div>
            <div className="text-end font-mono">
              <span className="text-2xl md:text-3xl font-black block">{netProfit.toFixed(2)}</span>
              <span className="text-xs font-semibold">MAD</span>
            </div>
          </div>
        </div>
      </div>

      {/* Balance Sheet Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-xs text-slate-400 block">{isAr ? 'قيمة أصول البضاعة في المخزن:' : 'Stock en Magasin:'}</span>
          <span className="text-xl font-black text-white font-mono mt-1 block">{stockAssetValue.toFixed(2)} MAD</span>
          <p className="text-[11px] text-slate-500 mt-1">{isAr ? 'محسوبة بمتوسط تكلفة الشراء PAMP' : 'Coût d’achat'}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-xs text-slate-400 block">{isAr ? 'الذمم المدينة (ديون بذمة الزبائن):' : 'Créances Clients:'}</span>
          <span className="text-xl font-black text-amber-400 font-mono mt-1 block">{totalCustomerReceivables.toFixed(2)} MAD</span>
          <p className="text-[11px] text-slate-500 mt-1">{isAr ? 'مبالغ سيتم تحصيلها مستقبلاً' : 'À encaisser'}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-xs text-slate-400 block">{isAr ? 'الذمم الدائنة (مستحقات واجبة للموردين):' : 'Dettes Fournisseurs:'}</span>
          <span className="text-xl font-black text-rose-400 font-mono mt-1 block">{totalSupplierPayables.toFixed(2)} MAD</span>
          <p className="text-[11px] text-slate-500 mt-1">{isAr ? 'فواتير شراء آجلة واجبة السداد' : 'À régler'}</p>
        </div>
      </div>
    </div>
  );
};
