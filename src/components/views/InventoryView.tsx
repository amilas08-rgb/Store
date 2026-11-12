/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, StockMovement } from '../../types';
import {
  Boxes,
  AlertTriangle,
  History,
  TrendingUp,
  TrendingDown,
  Wrench,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  X,
  Package
} from 'lucide-react';

export const InventoryView: React.FC = () => {
  const {
    language,
    products,
    stockMovements,
    stockAdjustments,
    createStockAdjustment
  } = useStore();

  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'status' | 'movements' | 'adjust' | 'analytics'>('status');
  const [searchQuery, setSearchQuery] = useState('');

  // Adjustment modal state
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.Product_ID || '');
  const [newStockQuantity, setNewStockQuantity] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState(isAr ? 'فارق جرد دوري' : 'Inventaire physique');

  const selectedProduct = products.find(p => p.Product_ID === selectedProductId);

  // Valuation
  const totalItemsCount = products.reduce((acc, p) => acc + (p.Current_Stock || 0), 0);
  const totalCostValue = products.reduce((acc, p) => acc + ((p.Current_Stock || 0) * (p.Average_Purchase_Cost || p.Last_Purchase_Price || 0)), 0);
  const totalRetailValue = products.reduce((acc, p) => acc + ((p.Current_Stock || 0) * (p.Current_Selling_Price || 0)), 0);
  const expectedProfit = totalRetailValue - totalCostValue;

  const lowStockProducts = products.filter(p => p.Current_Stock <= p.Minimum_Stock);

  const handleExecuteAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    createStockAdjustment(selectedProductId, newStockQuantity, adjustmentReason);
    alert('تم تسجيل الحركة وتسوية المخزون بنجاح!');
    setActiveTab('status');
  };

  const filteredProducts = products.filter(p => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.Product_Name_AR.toLowerCase().includes(q) || p.Internal_Reference.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Boxes className="w-6 h-6 text-amber-400" />
            <span>{isAr ? 'إدارة وحركات المخزون (STOCK)' : 'Gestion des Stocks'}</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            {isAr ? 'مستودع واحد مركزي مرتبط بجدول STOCK_MOVEMENTS' : 'Stock unique lié à Google Sheets'}
          </p>
        </div>

        <button
          onClick={() => {
            if (products.length > 0) {
              setSelectedProductId(products[0].Product_ID);
              setNewStockQuantity(products[0].Current_Stock);
            }
            setActiveTab('adjust');
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Wrench className="w-4 h-4" />
          <span>{isAr ? 'تسوية أو جرد مخزني' : 'Ajustement de Stock'}</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-xs text-slate-400 font-semibold">{isAr ? 'إجمالي القطع في المخزن' : 'Pièces en Stock'}</span>
          <div className="text-2xl font-black text-white font-mono mt-1">{totalItemsCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">{products.length} {isAr ? 'صنف مختلف' : 'articles'}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-xs text-slate-400 font-semibold">{isAr ? 'قيمة المخزون بالتكلفة' : 'Valeur au Coût d’Achat'}</span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{totalCostValue.toFixed(2)} MAD</div>
          <p className="text-[11px] text-slate-500 mt-1">{isAr ? 'الأصول الثابتة للبضاعة' : 'Actifs marchands'}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-xs text-slate-400 font-semibold">{isAr ? 'القيمة التقديرية بالبيع' : 'Valeur au Prix de Vente'}</span>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">{totalRetailValue.toFixed(2)} MAD</div>
          <p className="text-[11px] text-slate-500 mt-1">{isAr ? `الربح الكامن: ${expectedProfit.toFixed(2)} MAD` : `Marge latente: ${expectedProfit.toFixed(2)} MAD`}</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <span className="text-xs text-slate-400 font-semibold">{isAr ? 'تنبيهات النفاذ والانخفاض' : 'Alertes de Réappro'}</span>
          <div className="text-2xl font-black text-rose-400 font-mono mt-1">{lowStockProducts.length}</div>
          <p className="text-[11px] text-slate-500 mt-1">{isAr ? 'منتجات تحتاج طلب شراء عاجل' : 'Commandes à passer'}</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('status')}
          className={`pb-3 px-4 text-xs md:text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'status' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {isAr ? 'حالة كميات المخزون' : 'Niveaux de Stock'}
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`pb-3 px-4 text-xs md:text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'movements' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {isAr ? 'سجل حركات المخزون الموثقة' : 'Mouvements'}
        </button>
        <button
          onClick={() => setActiveTab('adjust')}
          className={`pb-3 px-4 text-xs md:text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'adjust' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {isAr ? 'تسوية وجرد المخزون' : 'Ajustement'}
        </button>
      </div>

      {/* TAB 1: STOCK STATUS */}
      {activeTab === 'status' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="relative w-72">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'تصفية المنتجات...' : 'Filtrer...'}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl ps-9 pe-3 py-1.5 text-xs text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 text-start">{isAr ? 'المنتج' : 'Article'}</th>
                  <th className="py-2.5 px-4 text-start">{isAr ? 'المرجع الداخلي' : 'Réf. MAG'}</th>
                  <th className="py-2.5 px-4 text-center">{isAr ? 'المخزون الحالي' : 'Stock Actuel'}</th>
                  <th className="py-2.5 px-4 text-center">{isAr ? 'الحد الأدنى' : 'Seuil Min'}</th>
                  <th className="py-2.5 px-4 text-end">{isAr ? 'تكلفة الوحدة' : 'P.U Coût'}</th>
                  <th className="py-2.5 px-4 text-end">{isAr ? 'إجمالي قيمة المخزون' : 'Valeur Totale'}</th>
                  <th className="py-2.5 px-4 text-center">{isAr ? 'الحالة' : 'État'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProducts.map(p => {
                  const cost = p.Average_Purchase_Cost || p.Last_Purchase_Price || 0;
                  const totalVal = p.Current_Stock * cost;
                  const isLow = p.Current_Stock <= p.Minimum_Stock && p.Current_Stock > 0;
                  const isOut = p.Current_Stock <= 0;

                  return (
                    <tr key={p.Product_ID} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 font-bold text-slate-100">{p.Product_Name_AR}</td>
                      <td className="py-2.5 px-4 font-mono text-amber-400">{p.Internal_Reference}</td>
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-white">{p.Current_Stock} {p.Unit}</td>
                      <td className="py-2.5 px-4 text-center font-mono text-slate-400">{p.Minimum_Stock}</td>
                      <td className="py-2.5 px-4 text-end font-mono text-slate-300">{cost.toFixed(2)} MAD</td>
                      <td className="py-2.5 px-4 text-end font-mono font-bold text-emerald-400">{totalVal.toFixed(2)} MAD</td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isOut ? 'bg-rose-500/20 text-rose-400' : isLow ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {isOut ? (isAr ? 'نفذ المخزون' : 'Épuisé') : isLow ? (isAr ? 'منخفض' : 'Bas') : (isAr ? 'متوفر' : 'Normal')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: STOCK MOVEMENTS */}
      {activeTab === 'movements' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 text-start">{isAr ? 'التاريخ' : 'Date'}</th>
                  <th className="py-2.5 px-4 text-start">{isAr ? 'المنتج' : 'Produit'}</th>
                  <th className="py-2.5 px-4 text-start">{isAr ? 'نوع الحركة' : 'Type'}</th>
                  <th className="py-2.5 px-4 text-center">{isAr ? 'الكمية الواردة' : 'Entrée'}</th>
                  <th className="py-2.5 px-4 text-center">{isAr ? 'الكمية الصادرة' : 'Sortie'}</th>
                  <th className="py-2.5 px-4 text-center">{isAr ? 'الرصيد بعد الحركة' : 'Solde'}</th>
                  <th className="py-2.5 px-4 text-start">{isAr ? 'البيان والملاحظات' : 'Notes'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stockMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      {isAr ? 'لا توجد حركات مخزنية مسجلة بعد' : 'Aucun mouvement'}
                    </td>
                  </tr>
                ) : (
                  stockMovements.map(m => {
                    const prod = products.find(p => p.Product_ID === m.Product_ID);
                    return (
                      <tr key={m.Movement_ID} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 text-slate-400">{new Date(m.Movement_Date).toLocaleDateString('ar-MA')}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-200">{prod?.Product_Name_AR || m.Product_ID}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.Movement_Type === 'IN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {m.Movement_Type}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono text-emerald-400 font-bold">{m.Quantity_In || '-'}</td>
                        <td className="py-2.5 px-4 text-center font-mono text-rose-400 font-bold">{m.Quantity_Out || '-'}</td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-white">{m.Balance_After}</td>
                        <td className="py-2.5 px-4 text-slate-400">{m.Notes}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ADJUSTMENT */}
      {activeTab === 'adjust' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-xl mx-auto space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-400" />
            <span>{isAr ? 'تسوية كميات المخزون وتوثيق الجرد' : 'Ajustement de Stock'}</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {isAr
              ? 'وفقاً لقواعد النظام، يمنع تعديل رصيد المخزون مباشرة دون إنشاء حركة مخزنية رسمية تسجل السبب والمستخدم وتاريخ التسوية في Google Sheets.'
              : 'Toute modification de stock génère un mouvement tracé avec justification.'}
          </p>

          <form onSubmit={handleExecuteAdjustment} className="space-y-4 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">{isAr ? 'اختر المنتج المراد تعديله:' : 'Produit:'}</label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  const p = products.find(prod => prod.Product_ID === e.target.value);
                  if (p) setNewStockQuantity(p.Current_Stock);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs"
              >
                {products.map(p => (
                  <option key={p.Product_ID} value={p.Product_ID}>
                    {p.Product_Name_AR} (المخزون الحالي: {p.Current_Stock})
                  </option>
                ))}
              </select>
            </div>

            {selectedProduct && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">{isAr ? 'الرصيد المسجل حالياً في النظام:' : 'Stock actuel:'}</span>
                <span className="font-mono font-bold text-amber-400 text-base">{selectedProduct.Current_Stock} قطعة</span>
              </div>
            )}

            <div>
              <label className="text-slate-300 font-semibold block mb-1">{isAr ? 'الكمية الفعلية الجديدة بعد الجرد:' : 'Nouvelle quantité:'}</label>
              <input
                type="number"
                min="0"
                required
                value={newStockQuantity}
                onChange={(e) => setNewStockQuantity(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-white font-mono font-bold text-sm"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">{isAr ? 'سبب التسوية (Reason):' : 'Motif de l’ajustement:'}</label>
              <select
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 text-xs"
              >
                <option value="فارق جرد دوري">{isAr ? 'فارق جرد دوري (Inventaire)' : 'Inventaire'}</option>
                <option value="تلف أو كسر بضاعة">{isAr ? 'تلف أو كسر بضاعة (Casse / Perte)' : 'Casse / Perte'}</option>
                <option value="عينة تجارية أو هدية">{isAr ? 'عينة تجارية أو هدية (Échantillon)' : 'Échantillon'}</option>
                <option value="تصحيح خطأ إدخال سابق">{isAr ? 'تصحيح خطأ إدخال سابق' : 'Correction d’erreur'}</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
            >
              {isAr ? 'حفظ وتأكيد تسوية المخزون' : 'Confirmer l’Ajustement'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
