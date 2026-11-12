/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, SupplierProductReference } from '../../types';
import {
  Package,
  Plus,
  Search,
  Filter,
  Barcode,
  ExternalLink,
  Edit2,
  Trash2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  History,
  Layers,
  Tag,
  CheckCircle2,
  X,
  Truck,
  Eye,
  Info,
  ArrowRightLeft
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const {
    language,
    products,
    categories,
    suppliers,
    supplierProductReferences,
    stockMovements,
    salesItems,
    purchaseItems,
    priceHistory,
    saveProduct,
    deleteProduct,
    setActiveView
  } = useStore();

  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');

  // Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [supplierRefInput, setSupplierRefInput] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');

  // Product Details Relational Modal
  const [inspectProduct, setInspectProduct] = useState<Product | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'references' | 'purchases' | 'sales' | 'movements' | 'prices'>('overview');

  // Filtered list
  const filteredProducts = products.filter(p => {
    if (selectedCategory !== 'ALL' && p.Category_ID !== selectedCategory) return false;
    if (stockFilter === 'LOW' && (p.Current_Stock > p.Minimum_Stock || p.Current_Stock <= 0)) return false;
    if (stockFilter === 'OUT' && p.Current_Stock > 0) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.Product_Name_AR.toLowerCase().includes(q) || (p.Product_Name_FR && p.Product_Name_FR.toLowerCase().includes(q));
      const matchRef = p.Internal_Reference.toLowerCase().includes(q) ||
        (p.Original_Reference && p.Original_Reference.toLowerCase().includes(q)) ||
        (p.Alternative_Reference && p.Alternative_Reference.toLowerCase().includes(q)) ||
        (p.Barcode && p.Barcode.toLowerCase().includes(q));
      return matchName || matchRef;
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingProduct({
      Product_Name_AR: '',
      Product_Name_FR: '',
      Category_ID: categories[0]?.Category_ID || 'CAT-001',
      Brand: '',
      Unit: 'قطعة (Pièce)',
      Barcode: '',
      Original_Reference: '',
      Alternative_Reference: '',
      First_Purchase_Price: 0,
      Last_Purchase_Price: 0,
      Average_Purchase_Cost: 0,
      Profit_Type: 'Percentage',
      Profit_Value: 25,
      Current_Selling_Price: 0,
      Current_Stock: 0,
      Minimum_Stock: 5,
      Image_URL: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
      Active: true
    });
    setSupplierRefInput('');
    setSelectedSupplierId(suppliers[0]?.Supplier_ID || '');
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    const suppRef = supplierProductReferences.find(s => s.Product_ID === p.Product_ID);
    setSupplierRefInput(suppRef?.Supplier_Reference || '');
    setSelectedSupplierId(suppRef?.Supplier_ID || p.Last_Supplier_ID || suppliers[0]?.Supplier_ID || '');
    setIsEditorOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.Product_Name_AR?.trim()) {
      alert('يرجى إدخال اسم المنتج بالعربية');
      return;
    }

    saveProduct(editingProduct, supplierRefInput.trim() || undefined, selectedSupplierId || undefined);
    setIsEditorOpen(false);
    setEditingProduct(null);
  };

  // Live price calculations in modal
  const purchaseCost = Number(editingProduct?.Average_Purchase_Cost) || Number(editingProduct?.Last_Purchase_Price) || 0;
  const profitType = editingProduct?.Profit_Type || 'Percentage';
  const profitValue = Number(editingProduct?.Profit_Value) || 0;
  const suggestedPrice = profitType === 'Percentage'
    ? purchaseCost * (1 + profitValue / 100)
    : purchaseCost + profitValue;
  const currentSellingPrice = Number(editingProduct?.Current_Selling_Price) || suggestedPrice;
  const unitProfit = currentSellingPrice - purchaseCost;
  const profitMarginPercent = purchaseCost > 0 ? (unitProfit / purchaseCost) * 100 : 0;
  const isBelowCost = currentSellingPrice < purchaseCost;

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-400" />
            <span>{isAr ? 'دليل المنتجات والمراجع المتعددة' : 'Catalogue des Produits'}</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            {isAr
              ? `إجمالي المنتجات: ${products.length} صنف مسجل في ورقة PRODUCTS`
              : `${products.length} articles enregistrés dans PRODUCTS`}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs md:text-sm font-black shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إضافة منتج جديد' : 'Nouveau Produit'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 w-full gap-2 items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالاسم، المرجع الداخلي MAG، المرجع الأصلي، الباركود...' : 'Rechercher par nom, référence MAG, code-barres...'}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl ps-9 pe-3 py-2 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">{isAr ? 'جميع التصنيفات' : 'Toutes Catégories'}</option>
            {categories.map(c => (
              <option key={c.Category_ID} value={c.Category_ID}>
                {isAr ? c.Category_Name_AR : c.Category_Name_FR}
              </option>
            ))}
          </select>

          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
          >
            <option value="ALL">{isAr ? 'كل الحالات' : 'Tous les stocks'}</option>
            <option value="LOW">{isAr ? 'مخزون منخفض' : 'Stock bas'}</option>
            <option value="OUT">{isAr ? 'نافذ من المخزون' : 'Épuisé'}</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'المنتج / الصورة' : 'Article'}</th>
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'المراجع (داخلي/أصلي)' : 'Références'}</th>
                <th className="py-3 px-4 text-start font-semibold">{isAr ? 'الباركود' : 'Code-barres'}</th>
                <th className="py-3 px-4 text-center font-semibold">{isAr ? 'المخزون' : 'Stock'}</th>
                <th className="py-3 px-4 text-end font-semibold">{isAr ? 'تكلفة الشراء' : 'Coût Achat'}</th>
                <th className="py-3 px-4 text-end font-semibold">{isAr ? 'سعر البيع' : 'Prix Vente'}</th>
                <th className="py-3 px-4 text-center font-semibold">{isAr ? 'هامش الربح' : 'Marge'}</th>
                <th className="py-3 px-4 text-end font-semibold">{isAr ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProducts.map(p => {
                const cost = p.Average_Purchase_Cost || p.Last_Purchase_Price || 0;
                const profit = p.Current_Selling_Price - cost;
                const marginPct = cost > 0 ? (profit / cost) * 100 : 0;
                const isLow = p.Current_Stock <= p.Minimum_Stock;

                return (
                  <tr key={p.Product_ID} className="hover:bg-slate-800/40 transition-colors">
                    {/* Name & Photo */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.Image_URL || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80'}
                          alt={p.Product_Name_AR}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-950 border border-slate-800 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-slate-100">{p.Product_Name_AR}</p>
                          <p className="text-[11px] text-slate-400">{p.Product_Name_FR || p.Brand}</p>
                        </div>
                      </div>
                    </td>

                    {/* Multi References */}
                    <td className="py-3 px-4 font-mono">
                      <div className="text-amber-400 font-bold">{p.Internal_Reference}</div>
                      {p.Original_Reference && (
                        <div className="text-[10px] text-slate-400">ORG: {p.Original_Reference}</div>
                      )}
                    </td>

                    {/* Barcode */}
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {p.Barcode ? (
                        <span className="flex items-center gap-1">
                          <Barcode className="w-3.5 h-3.5 text-slate-500" />
                          <span>{p.Barcode}</span>
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        p.Current_Stock <= 0
                          ? 'bg-rose-500/20 text-rose-400'
                          : isLow
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {p.Current_Stock}
                      </span>
                    </td>

                    {/* Purchase Cost */}
                    <td className="py-3 px-4 text-end font-mono text-slate-300">
                      {cost.toFixed(2)} MAD
                    </td>

                    {/* Selling Price */}
                    <td className="py-3 px-4 text-end font-mono font-bold text-slate-100">
                      {p.Current_Selling_Price.toFixed(2)} MAD
                    </td>

                    {/* Profit Margin */}
                    <td className="py-3 px-4 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        profit >= 0 ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
                      }`}>
                        +{marginPct.toFixed(1)}% ({profit.toFixed(1)} DH)
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setInspectProduct(p);
                            setDetailTab('overview');
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800"
                          title={isAr ? 'عرض التفاصيل والعلاقات' : 'Détails'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                          title={isAr ? 'تعديل' : 'Modifier'}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`هل أنت متأكد من حذف المنتج: ${p.Product_Name_AR}؟`)) {
                              deleteProduct(p.Product_ID);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                          title={isAr ? 'حذف' : 'Supprimer'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT / CREATE PRODUCT MODAL WITH PRICE ENGINE */}
      {isEditorOpen && editingProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                <span>{editingProduct.Product_ID ? (isAr ? 'تعديل بيانات المنتج' : 'Modifier le Produit') : (isAr ? 'إضافة منتج جديد' : 'Nouveau Produit')}</span>
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Product Identity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">{isAr ? 'اسم المنتج (بالعربية) *' : 'Nom (Arabe) *'}</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.Product_Name_AR || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, Product_Name_AR: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                    placeholder="مثال: شاحن سريع Anker 65W GaN"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">{isAr ? 'اسم المنتج (بالفرنسية)' : 'Nom (Français)'}</label>
                  <input
                    type="text"
                    value={editingProduct.Product_Name_FR || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, Product_Name_FR: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500 text-xs"
                    placeholder="Chargeur Rapide Anker 65W GaN"
                  />
                </div>
              </div>

              {/* Multi References Engine (Section 8.1) */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h4 className="font-bold text-amber-400 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  <span>{isAr ? 'نظام المراجع المتعددة (Multi-References)' : 'Système Multi-Références'}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">{isAr ? 'المرجع الأصلي للمنتج' : 'Réf. Originale'}</label>
                    <input
                      type="text"
                      value={editingProduct.Original_Reference || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, Original_Reference: e.target.value })}
                      placeholder="ORG-456"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">{isAr ? 'مرجع بديل / تجاري' : 'Réf. Alternative'}</label>
                    <input
                      type="text"
                      value={editingProduct.Alternative_Reference || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, Alternative_Reference: e.target.value })}
                      placeholder="ALT-987"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">{isAr ? 'الباركود (Barcode)' : 'Code-barres'}</label>
                    <input
                      type="text"
                      value={editingProduct.Barcode || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, Barcode: e.target.value })}
                      placeholder="EAN-13 / UPC"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="text-slate-400 block mb-1">{isAr ? 'المورد الأساسي' : 'Fournisseur'}</label>
                    <select
                      value={selectedSupplierId}
                      onChange={(e) => setSelectedSupplierId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      <option value="">{isAr ? 'اختر مورد...' : 'Sélectionner...'}</option>
                      {suppliers.map(s => (
                        <option key={s.Supplier_ID} value={s.Supplier_ID}>
                          {s.Supplier_Name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">{isAr ? 'مرجع لدى هذا المورد' : 'Réf. chez Fournisseur'}</label>
                    <input
                      type="text"
                      value={supplierRefInput}
                      onChange={(e) => setSupplierRefInput(e.target.value)}
                      placeholder="A-789"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Price Engine Section (Section 9) */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                <h4 className="font-bold text-amber-400 flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  <span>{isAr ? 'محرك الأسعار وحساب هامش الربح' : 'Moteur de Prix & Calcul de Marge'}</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-slate-400 block mb-1">{isAr ? 'تكلفة الشراء المعتمدة (MAD)' : 'Coût d’Achat (MAD)'}</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editingProduct.Average_Purchase_Cost || editingProduct.Last_Purchase_Price || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 0;
                        setEditingProduct({
                          ...editingProduct,
                          Last_Purchase_Price: val,
                          Average_Purchase_Cost: val
                        });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">{isAr ? 'نوع هامش الربح' : 'Type de Marge'}</label>
                    <select
                      value={editingProduct.Profit_Type || 'Percentage'}
                      onChange={(e) => setEditingProduct({ ...editingProduct, Profit_Type: e.target.value as any })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                    >
                      <option value="Percentage">{isAr ? 'نسبة مئوية (%)' : 'Pourcentage (%)'}</option>
                      <option value="Fixed">{isAr ? 'مبلغ ثابت (MAD)' : 'Montant Fixe (MAD)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">{isAr ? 'قيمة الهامش' : 'Valeur Marge'}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editingProduct.Profit_Value || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, Profit_Value: Number(e.target.value) || 0 })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-200"
                    />
                  </div>
                </div>

                {/* Live Margin Calculation Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">{isAr ? 'سعر البيع المقترح:' : 'Prix Suggéré:'}</span>
                    <span className="font-bold text-amber-400 font-mono">{suggestedPrice.toFixed(2)} MAD</span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">{isAr ? 'سعر البيع الفعلي:' : 'Prix Réel:'}</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editingProduct.Current_Selling_Price || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, Current_Selling_Price: Number(e.target.value) || 0 })}
                      className="w-full bg-transparent font-bold text-white font-mono focus:outline-none"
                    />
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">{isAr ? 'الربح للقطعة:' : 'Bénéfice/U:'}</span>
                    <span className={`font-bold font-mono ${unitProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {unitProfit.toFixed(2)} MAD
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 block">{isAr ? 'نسبة الربح:' : 'Marge %:'}</span>
                    <span className={`font-bold font-mono ${profitMarginPercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {profitMarginPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {isBelowCost && (
                  <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 flex items-center gap-2 text-rose-300">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{isAr ? 'تنبيه: سعر البيع المحدد أقل من تكلفة الشراء (بيع بخسارة)!' : 'Attention: Vente à perte!'}</span>
                  </div>
                )}
              </div>

              {/* Stock and Image */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">{isAr ? 'المخزون الحالي' : 'Stock Actuel'}</label>
                  <input
                    type="number"
                    value={editingProduct.Current_Stock || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, Current_Stock: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">{isAr ? 'الحد الأدنى للتنبيه' : 'Alerte Seuil'}</label>
                  <input
                    type="number"
                    value={editingProduct.Minimum_Stock || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, Minimum_Stock: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">{isAr ? 'رابط الصورة (URL)' : 'URL Image'}</label>
                  <input
                    type="text"
                    value={editingProduct.Image_URL || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, Image_URL: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                >
                  {isAr ? 'حفظ ومزامنة المنتج' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRODUCT RELATIONAL DETAILS MODAL (Section 5) */}
      {inspectProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={inspectProduct.Image_URL || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&auto=format&fit=crop&q=80'}
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover border border-slate-700"
                />
                <div>
                  <h3 className="font-bold text-white text-base">{inspectProduct.Product_Name_AR}</h3>
                  <p className="text-xs text-amber-400 font-mono">{inspectProduct.Internal_Reference}</p>
                </div>
              </div>
              <button
                onClick={() => setInspectProduct(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Relational Tabs */}
            <div className="px-4 border-b border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
              {[
                { id: 'overview', label: isAr ? 'نظرة عامة' : 'Aperçu' },
                { id: 'references', label: isAr ? 'المراجع والموردون' : 'Fournisseurs' },
                { id: 'movements', label: isAr ? 'حركات المخزون' : 'Mouvements' },
                { id: 'prices', label: isAr ? 'سجل تغير الأسعار' : 'Historique Prix' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setDetailTab(t.id as any)}
                  className={`py-3 px-3 font-semibold border-b-2 whitespace-nowrap transition-colors ${
                    detailTab === t.id
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6 text-xs">
              {detailTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block">{isAr ? 'المخزون الحالي' : 'Stock'}</span>
                      <span className="text-lg font-bold text-white font-mono">{inspectProduct.Current_Stock}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block">{isAr ? 'سعر الشراء الأخير' : 'Dernier Achat'}</span>
                      <span className="text-lg font-bold text-slate-200 font-mono">{inspectProduct.Last_Purchase_Price.toFixed(2)} MAD</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block">{isAr ? 'متوسط التكلفة' : 'Coût Moyen'}</span>
                      <span className="text-lg font-bold text-slate-200 font-mono">{inspectProduct.Average_Purchase_Cost.toFixed(2)} MAD</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-500 block">{isAr ? 'سعر البيع' : 'Prix Vente'}</span>
                      <span className="text-lg font-bold text-amber-400 font-mono">{inspectProduct.Current_Selling_Price.toFixed(2)} MAD</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <h5 className="font-bold text-slate-200">{isAr ? 'الوصف والملاحظات:' : 'Description:'}</h5>
                    <p className="text-slate-400 leading-relaxed">{inspectProduct.Description || (isAr ? 'لا يوجد وصف إضافي' : 'Aucune description')}</p>
                  </div>
                </div>
              )}

              {detailTab === 'references' && (
                <div className="space-y-4">
                  <h5 className="font-bold text-slate-200">{isAr ? 'مراجع هذا المنتج لدى الموردين:' : 'Références Fournisseurs:'}</h5>
                  {supplierProductReferences.filter(r => r.Product_ID === inspectProduct.Product_ID).length === 0 ? (
                    <p className="text-slate-500">{isAr ? 'لا توجد مراجع موردين مسجلة بعد' : 'Aucune référence'}</p>
                  ) : (
                    <div className="space-y-2">
                      {supplierProductReferences.filter(r => r.Product_ID === inspectProduct.Product_ID).map(ref => (
                        <div key={ref.ID} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center">
                          <div>
                            <span className="font-mono font-bold text-amber-400">{ref.Supplier_Reference}</span>
                            <span className="text-slate-400 ms-2">({suppliers.find(s => s.Supplier_ID === ref.Supplier_ID)?.Supplier_Name || ref.Supplier_ID})</span>
                          </div>
                          <span className="text-slate-400 font-mono">{ref.Last_Purchase_Price} MAD</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setInspectProduct(null);
                      setActiveView('suppliers');
                    }}
                    className="w-full mt-3 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/15 to-emerald-500/15 hover:from-amber-500/25 hover:to-emerald-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                    <span>{isAr ? 'فتح أداة مقارنة المنتجات حسب أفضل ثمن شراء' : 'Comparer les prix d’achat des fournisseurs'}</span>
                  </button>
                </div>
              )}

              {detailTab === 'movements' && (
                <div className="space-y-2">
                  <h5 className="font-bold text-slate-200 mb-2">{isAr ? 'سجل حركات المخزون المرتبطة:' : 'Mouvements:'}</h5>
                  {stockMovements.filter(m => m.Product_ID === inspectProduct.Product_ID).map(m => (
                    <div key={m.Movement_ID} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center text-[11px]">
                      <div>
                        <span className={`px-2 py-0.5 rounded font-bold me-2 ${m.Movement_Type === 'IN' ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                          {m.Movement_Type}
                        </span>
                        <span className="text-slate-300">{m.Notes}</span>
                      </div>
                      <div className="font-mono text-slate-400">
                        {m.Quantity_In > 0 ? `+${m.Quantity_In}` : `-${m.Quantity_Out}`} | رصيد: {m.Balance_After}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {detailTab === 'prices' && (
                <div className="space-y-2">
                  <h5 className="font-bold text-slate-200 mb-2">{isAr ? 'تاريخ تغيرات الأسعار وهامش الربح:' : 'Historique des Prix:'}</h5>
                  {priceHistory.filter(h => h.Product_ID === inspectProduct.Product_ID).map(h => (
                    <div key={h.Price_ID} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">{new Date(h.Effective_Date).toLocaleDateString('ar-MA')}</span>
                      <span className="font-mono text-slate-300">شراء: {h.Purchase_Price} MAD</span>
                      <span className="font-mono font-bold text-amber-400">بيع: {h.Selling_Price} MAD</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
