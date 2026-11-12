/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Supplier, Product } from '../../types';
import {
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Building,
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Edit2,
  X,
  FileText,
  Eye,
  Calendar,
  Layers,
  ArrowRightLeft,
  Award,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Filter
} from 'lucide-react';

interface SupplierProductQuote {
  supplierId: string;
  supplierName: string;
  commercialName?: string;
  supplierRef?: string;
  bestPrice: number;
  lastPrice: number;
  lastDate?: string;
  source: 'INVOICE' | 'CATALOG' | 'PRODUCT_RECORD';
  invoicesCount: number;
  totalQtyBought: number;
}

export const SuppliersView: React.FC = () => {
  const {
    language,
    suppliers,
    products,
    purchaseInvoices,
    purchaseItems,
    supplierProductReferences,
    saveSupplier
  } = useStore();

  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'list' | 'compare'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'with_dues' | 'settled'>('all');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Partial<Supplier> | null>(null);
  const [statementSupplier, setStatementSupplier] = useState<Supplier | null>(null);

  // Price comparison states
  const [compareProductId, setCompareProductId] = useState<string>(products[0]?.Product_ID || '');
  const [compareSearch, setCompareSearch] = useState('');

  // Compute turnover and invoices count per supplier
  const supplierStats = useMemo(() => {
    const statsMap: Record<string, { turnover: number; paid: number; invoicesCount: number }> = {};

    suppliers.forEach(s => {
      statsMap[s.Supplier_ID] = { turnover: 0, paid: 0, invoicesCount: 0 };
    });

    purchaseInvoices.forEach(inv => {
      if (inv.Status !== 'Cancelled') {
        const suppId = inv.Supplier_ID;
        if (!statsMap[suppId]) {
          statsMap[suppId] = { turnover: 0, paid: 0, invoicesCount: 0 };
        }
        statsMap[suppId].turnover += (Number(inv.Total) || 0);
        statsMap[suppId].paid += (Number(inv.Paid_Amount) || 0);
        statsMap[suppId].invoicesCount += 1;
      }
    });

    return statsMap;
  }, [suppliers, purchaseInvoices]);

  // Overall totals for suppliers
  const overallTotals = useMemo(() => {
    let totalTurnover = 0;
    let totalDues = 0;
    let totalPaid = 0;

    suppliers.forEach(s => {
      const stats = supplierStats[s.Supplier_ID] || { turnover: 0, paid: 0, invoicesCount: 0 };
      totalTurnover += stats.turnover;
      totalPaid += stats.paid;
      totalDues += (Number(s.Current_Balance) || 0);
    });

    return {
      totalSuppliers: suppliers.length,
      totalTurnover,
      totalDues,
      totalPaid
    };
  }, [suppliers, supplierStats]);

  // Filtered suppliers for table
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch = !q ||
        s.Supplier_Name.toLowerCase().includes(q) ||
        (s.Commercial_Name && s.Commercial_Name.toLowerCase().includes(q)) ||
        (s.Phone && s.Phone.toLowerCase().includes(q)) ||
        (s.City && s.City.toLowerCase().includes(q)) ||
        (s.Tax_ID && s.Tax_ID.toLowerCase().includes(q)) ||
        s.Supplier_ID.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      const dues = Number(s.Current_Balance) || 0;
      if (filterType === 'with_dues') return dues > 0;
      if (filterType === 'settled') return dues <= 0;
      return true;
    });
  }, [suppliers, searchQuery, filterType]);

  const handleOpenAdd = () => {
    setEditingSupplier({
      Supplier_Name: '',
      Commercial_Name: '',
      Phone: '',
      Email: '',
      Address: '',
      City: 'الدار البيضاء',
      Tax_ID: '',
      Notes: '',
      Opening_Balance: 0,
      Current_Balance: 0,
      Active: true
    });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setEditingSupplier({ ...s });
    setIsEditorOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplier?.Supplier_Name?.trim()) {
      alert(isAr ? 'يرجى إدخال اسم المورد' : 'Veuillez saisir le nom du fournisseur');
      return;
    }
    saveSupplier(editingSupplier);
    setIsEditorOpen(false);
    setEditingSupplier(null);
  };

  // Invoices for statement modal
  const supplierInvoices = useMemo(() => {
    if (!statementSupplier) return [];
    return purchaseInvoices
      .filter(inv => inv.Supplier_ID === statementSupplier.Supplier_ID)
      .sort((a, b) => new Date(b.Invoice_Date || b.Created_At).getTime() - new Date(a.Invoice_Date || a.Created_At).getTime());
  }, [statementSupplier, purchaseInvoices]);

  // ==========================================
  // RECALIBRATED PRODUCT PRICE COMPARISON LOGIC
  // ==========================================

  // For any given product, extract and aggregate all supplier offers
  const getProductQuotes = (prodId: string): SupplierProductQuote[] => {
    const prod = products.find(p => p.Product_ID === prodId);
    if (!prod) return [];

    const quotesMap: Record<string, SupplierProductQuote> = {};

    // 1. Check real purchase invoices & items
    purchaseItems.forEach(item => {
      if (item.Product_ID === prodId) {
        const inv = purchaseInvoices.find(i => i.Purchase_Invoice_ID === item.Purchase_Invoice_ID && i.Status !== 'Cancelled');
        if (inv && inv.Supplier_ID) {
          const supp = suppliers.find(s => s.Supplier_ID === inv.Supplier_ID);
          const price = Number(item.Unit_Cost || item.Unit_Price) || 0;
          if (price > 0) {
            const sid = inv.Supplier_ID;
            if (!quotesMap[sid]) {
              quotesMap[sid] = {
                supplierId: sid,
                supplierName: supp?.Supplier_Name || sid,
                commercialName: supp?.Commercial_Name,
                supplierRef: item.Supplier_Reference,
                bestPrice: price,
                lastPrice: price,
                lastDate: inv.Invoice_Date || inv.Created_At,
                source: 'INVOICE',
                invoicesCount: 1,
                totalQtyBought: Number(item.Quantity) || 0
              };
            } else {
              quotesMap[sid].invoicesCount += 1;
              quotesMap[sid].totalQtyBought += (Number(item.Quantity) || 0);
              if (price < quotesMap[sid].bestPrice) {
                quotesMap[sid].bestPrice = price;
              }
              const existingDate = new Date(quotesMap[sid].lastDate || 0).getTime();
              const thisDate = new Date(inv.Invoice_Date || inv.Created_At).getTime();
              if (thisDate >= existingDate) {
                quotesMap[sid].lastPrice = price;
                quotesMap[sid].lastDate = inv.Invoice_Date || inv.Created_At;
              }
            }
          }
        }
      }
    });

    // 2. Check supplier references catalog
    supplierProductReferences.forEach(ref => {
      if (ref.Product_ID === prodId && ref.Last_Purchase_Price > 0) {
        const sid = ref.Supplier_ID;
        const supp = suppliers.find(s => s.Supplier_ID === sid);
        if (!quotesMap[sid]) {
          quotesMap[sid] = {
            supplierId: sid,
            supplierName: supp?.Supplier_Name || sid,
            commercialName: supp?.Commercial_Name,
            supplierRef: ref.Supplier_Reference,
            bestPrice: ref.Last_Purchase_Price,
            lastPrice: ref.Last_Purchase_Price,
            lastDate: ref.Last_Purchase_Date,
            source: 'CATALOG',
            invoicesCount: 0,
            totalQtyBought: 0
          };
        } else {
          if (ref.Last_Purchase_Price < quotesMap[sid].bestPrice) {
            quotesMap[sid].bestPrice = ref.Last_Purchase_Price;
          }
          if (!quotesMap[sid].supplierRef && ref.Supplier_Reference) {
            quotesMap[sid].supplierRef = ref.Supplier_Reference;
          }
        }
      }
    });

    // 3. Check product recorded initial / last supplier
    if (prod.First_Supplier_ID && prod.First_Purchase_Price > 0) {
      const sid = prod.First_Supplier_ID;
      if (!quotesMap[sid]) {
        const supp = suppliers.find(s => s.Supplier_ID === sid);
        quotesMap[sid] = {
          supplierId: sid,
          supplierName: supp?.Supplier_Name || sid,
          commercialName: supp?.Commercial_Name,
          bestPrice: prod.First_Purchase_Price,
          lastPrice: prod.First_Purchase_Price,
          lastDate: prod.Created_At,
          source: 'PRODUCT_RECORD',
          invoicesCount: 0,
          totalQtyBought: 0
        };
      }
    }
    if (prod.Last_Supplier_ID && prod.Last_Purchase_Price > 0) {
      const sid = prod.Last_Supplier_ID;
      const supp = suppliers.find(s => s.Supplier_ID === sid);
      if (!quotesMap[sid]) {
        quotesMap[sid] = {
          supplierId: sid,
          supplierName: supp?.Supplier_Name || sid,
          commercialName: supp?.Commercial_Name,
          bestPrice: prod.Last_Purchase_Price,
          lastPrice: prod.Last_Purchase_Price,
          lastDate: prod.Updated_At,
          source: 'PRODUCT_RECORD',
          invoicesCount: 0,
          totalQtyBought: 0
        };
      } else {
        if (prod.Last_Purchase_Price < quotesMap[sid].bestPrice) {
          quotesMap[sid].bestPrice = prod.Last_Purchase_Price;
        }
      }
    }

    // Sort by bestPrice ascending (lowest price = rank 1 = best price!)
    return Object.values(quotesMap).sort((a, b) => a.bestPrice - b.bestPrice);
  };

  const selectedProduct = useMemo(() => {
    return products.find(p => p.Product_ID === compareProductId) || products[0];
  }, [products, compareProductId]);

  const currentQuotes = useMemo(() => {
    if (!selectedProduct) return [];
    return getProductQuotes(selectedProduct.Product_ID);
  }, [selectedProduct, purchaseItems, purchaseInvoices, supplierProductReferences, suppliers]);

  const bestQuote = currentQuotes[0] || null;
  const worstQuote = currentQuotes.length > 1 ? currentQuotes[currentQuotes.length - 1] : null;

  // Comparison metrics for the selected product
  const comparisonMetrics = useMemo(() => {
    if (!selectedProduct || currentQuotes.length === 0) return null;

    const prices = currentQuotes.map(q => q.bestPrice);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const savings = maxPrice > minPrice ? (maxPrice - minPrice) : 0;
    const savingsPct = maxPrice > 0 ? ((savings / maxPrice) * 100) : 0;

    const currentSell = Number(selectedProduct.Current_Selling_Price) || Number(selectedProduct.Suggested_Selling_Price) || 0;
    const profitAtBest = currentSell > minPrice ? (currentSell - minPrice) : 0;
    const marginAtBest = currentSell > 0 ? ((profitAtBest / currentSell) * 100) : 0;

    return {
      minPrice,
      maxPrice,
      avgPrice,
      savings,
      savingsPct,
      currentSell,
      profitAtBest,
      marginAtBest,
      quotesCount: currentQuotes.length
    };
  }, [selectedProduct, currentQuotes]);

  // Global Products Comparison Summary List
  const globalProductsComparison = useMemo(() => {
    return products.map(prod => {
      const quotes = getProductQuotes(prod.Product_ID);
      const best = quotes[0] || null;
      const worst = quotes.length > 1 ? quotes[quotes.length - 1] : null;
      const bestPrice = best ? best.bestPrice : (prod.First_Purchase_Price || prod.Last_Purchase_Price || 0);
      const maxPrice = worst ? worst.bestPrice : bestPrice;
      const savings = maxPrice > bestPrice ? (maxPrice - bestPrice) : 0;
      const savingsPct = maxPrice > 0 ? ((savings / maxPrice) * 100) : 0;

      return {
        product: prod,
        quotesCount: quotes.length,
        bestSupplierName: best ? best.supplierName : (suppliers.find(s => s.Supplier_ID === prod.Last_Supplier_ID)?.Supplier_Name || '-'),
        bestPrice,
        maxPrice,
        lastPrice: prod.Last_Purchase_Price || bestPrice,
        savings,
        savingsPct,
        sellingPrice: prod.Current_Selling_Price || prod.Suggested_Selling_Price || 0
      };
    }).filter(item => {
      if (!compareSearch.trim()) return true;
      const q = compareSearch.toLowerCase();
      return item.product.Product_Name_AR.toLowerCase().includes(q) ||
        item.product.Internal_Reference.toLowerCase().includes(q) ||
        item.bestSupplierName.toLowerCase().includes(q);
    });
  }, [products, purchaseItems, purchaseInvoices, supplierProductReferences, suppliers, compareSearch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>{isAr ? 'إدارة الموردين ومقارنة الأسعار' : 'Fournisseurs & Comparateur'}</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-400">
            {isAr
              ? `عرض شامل لبيانات الموردين، المستحقات ورقم الأعمال، مع أداة مقارنة المنتجات حسب أفضل ثمن شراء`
              : `Gestion complète des fournisseurs, créances et comparateur des meilleurs prix d’achat`}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إضافة مورد جديد' : 'Nouveau Fournisseur'}</span>
        </button>
      </div>

      {/* KPI Overview Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">{isAr ? 'إجمالي الموردين' : 'Total Fournisseurs'}</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl md:text-2xl font-black text-white font-mono">
            {overallTotals.totalSuppliers}
          </div>
          <span className="text-[10px] text-slate-500">{isAr ? 'شركات وموزعين معتمدين' : 'Fournisseurs enregistrés'}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">{isAr ? 'رقم الأعمال (حجم المشتريات)' : 'Volume d’Achats'}</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl md:text-2xl font-black text-amber-400 font-mono">
            {overallTotals.totalTurnover.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs">MAD</span>
          </div>
          <span className="text-[10px] text-slate-500">{isAr ? 'إجمالي فواتير الشراء' : 'Total factures achats'}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">{isAr ? 'مستحقات الموردين (ديون)' : 'Dettes Fournisseurs'}</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className={`text-xl md:text-2xl font-black font-mono ${overallTotals.totalDues > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            {overallTotals.totalDues.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs">MAD</span>
          </div>
          <span className="text-[10px] text-rose-400/80">{isAr ? 'واجبة السداد للموردين' : 'Soldes à régler'}</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-semibold">{isAr ? 'إجمالي المسدد للموردين' : 'Total Réglé'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl md:text-2xl font-black text-emerald-400 font-mono">
            {overallTotals.totalPaid.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs">MAD</span>
          </div>
          <span className="text-[10px] text-slate-500">{isAr ? 'دفعات مسددة بنكياً ونقداً' : 'Règlements effectués'}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('list')}
          className={`pb-3 px-4 text-xs md:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'list'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>{isAr ? 'جدول الموردين والأرصدة ورقم الأعمال' : 'Liste des Fournisseurs & Soldes'}</span>
        </button>

        <button
          onClick={() => setActiveTab('compare')}
          className={`pb-3 px-4 text-xs md:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'compare'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>{isAr ? 'أداة مقارنة المنتجات حسب أفضل ثمن شراء' : 'Comparateur par Meilleur Prix d’Achat'}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-mono">
            {products.length}
          </span>
        </button>
      </div>

      {/* TAB 1: SUPPLIERS TABLE */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative w-full md:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isAr ? 'بحث بالاسم، الاسم التجاري، الهاتف، المدينة، أو المعرف الضريبي...' : 'Recherche par nom, raison sociale, tél...'}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl ps-9 pe-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-1.5 self-start md:self-auto text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {isAr ? 'جميع الموردين' : 'Tous'} ({suppliers.length})
              </button>
              <button
                onClick={() => setFilterType('with_dues')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1 cursor-pointer ${
                  filterType === 'with_dues'
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-800 text-rose-400 hover:bg-slate-700'
                }`}
              >
                <span>{isAr ? 'لهم مستحقات' : 'Avec Dettes'}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-rose-950 text-[10px]">
                  {suppliers.filter(s => (Number(s.Current_Balance) || 0) > 0).length}
                </span>
              </button>
              <button
                onClick={() => setFilterType('settled')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer ${
                  filterType === 'settled'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
                }`}
              >
                {isAr ? 'حساب خالص' : 'Soldés'}
              </button>
            </div>
          </div>

          {/* COMPREHENSIVE SUPPLIERS TABLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-3 text-start">{isAr ? 'كود المورد' : 'ID'}</th>
                    <th className="py-3 px-4 text-start">{isAr ? 'اسم المورد التجاري' : 'Raison Sociale'}</th>
                    <th className="py-3 px-3 text-start">{isAr ? 'الهاتف والبريد' : 'Contact'}</th>
                    <th className="py-3 px-3 text-start">{isAr ? 'المدينة والعنوان' : 'Ville & Adresse'}</th>
                    <th className="py-3 px-3 text-start">{isAr ? 'المعرف الضريبي (IF/ICE)' : 'ID Fiscal'}</th>
                    <th className="py-3 px-3 text-center">{isAr ? 'الفواتير' : 'Factures'}</th>
                    <th className="py-3 px-4 text-end text-amber-400">{isAr ? 'رقم الأعمال / المشتريات (MAD)' : 'Volume Achats'}</th>
                    <th className="py-3 px-3 text-end">{isAr ? 'المسدد له (MAD)' : 'Payé'}</th>
                    <th className="py-3 px-4 text-end text-rose-400">{isAr ? 'المستحقات له (MAD)' : 'Solde Dû'}</th>
                    <th className="py-3 px-3 text-center">{isAr ? 'الإجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500">
                        {isAr ? 'لا يوجد موردون مطابقين لمعايير البحث' : 'Aucun fournisseur trouvé.'}
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map(s => {
                      const stats = supplierStats[s.Supplier_ID] || { turnover: 0, paid: 0, invoicesCount: 0 };
                      const dues = Number(s.Current_Balance) || 0;

                      return (
                        <tr
                          key={s.Supplier_ID}
                          className="hover:bg-slate-800/40 transition-colors"
                        >
                          {/* ID */}
                          <td className="py-3 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                            {s.Supplier_ID}
                          </td>

                          {/* Name & Commercial Name */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-white text-sm block">{s.Supplier_Name}</span>
                            {s.Commercial_Name && (
                              <span className="text-[11px] text-amber-400 font-medium block">{s.Commercial_Name}</span>
                            )}
                          </td>

                          {/* Phone & Email */}
                          <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                            {s.Phone ? (
                              <a href={`tel:${s.Phone}`} className="hover:text-amber-400 flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                                <span>{s.Phone}</span>
                              </a>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                            {s.Email && (
                              <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">{s.Email}</span>
                            )}
                          </td>

                          {/* City & Address */}
                          <td className="py-3 px-3 text-slate-300">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                              <span className="font-medium">{s.City || 'الدار البيضاء'}</span>
                            </div>
                            {s.Address && (
                              <span className="text-[10px] text-slate-500 block truncate max-w-[150px]">{s.Address}</span>
                            )}
                          </td>

                          {/* Tax ID */}
                          <td className="py-3 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                            {s.Tax_ID || '-'}
                          </td>

                          {/* Invoices Count */}
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => setStatementSupplier(s)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold text-xs inline-flex items-center gap-1 transition-colors cursor-pointer"
                              title={isAr ? 'عرض فواتير الشراء للمورد' : 'Voir factures'}
                            >
                              <ShoppingBag className="w-3 h-3 text-amber-400" />
                              <span>{stats.invoicesCount}</span>
                            </button>
                          </td>

                          {/* Turnover / Purchases (رقم الأعمال للمورد) */}
                          <td className="py-3 px-4 text-end font-mono font-bold text-amber-400 text-sm whitespace-nowrap">
                            {stats.turnover.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Paid Amount */}
                          <td className="py-3 px-3 text-end font-mono text-slate-300 whitespace-nowrap">
                            {stats.paid.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          {/* Dues / المستحقات للمورد */}
                          <td className="py-3 px-4 text-end whitespace-nowrap">
                            {dues > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono font-bold text-xs">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span>{dues.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[11px]">
                                <CheckCircle2 className="w-3 h-3 shrink-0" />
                                <span>0.00</span>
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setStatementSupplier(s)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                                title={isAr ? 'كشف حساب وفواتير المشتريات' : 'Relevé'}
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleOpenEdit(s)}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                                title={isAr ? 'تعديل بيانات المورد' : 'Modifier'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
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
        </div>
      )}

      {/* TAB 2: RECALIBRATED PRODUCT COMPARISON BY BEST PURCHASE PRICE */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          {/* Top explainer & product selection */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Award className="w-6 h-6 text-amber-400" />
                  <span>{isAr ? 'مقارنة المنتجات حسب أفضل ثمن شراء' : 'Comparateur par Meilleur Prix d’Achat'}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  {isAr
                    ? 'يقوم النظام بمسح كافة فواتير الشراء التاريخية، كتالوجات الموردين، وعروض الأسعار لتحديد أقل وأوفر ثمن شراء لكل منتج وحساب هوامش الربح ونسبة التوفير المحققة بدقة.'
                    : 'Analyse toutes les factures d’achat et catalogues pour identifier le prix le plus bas et calculer les économies.'}
                </p>
              </div>

              {/* Product Selector Dropdown */}
              <div className="w-full md:w-80">
                <label className="text-xs text-slate-300 font-bold block mb-1.5">
                  {isAr ? 'اختر المنتج لمعاينة عروض الموردين:' : 'Sélectionner un produit:'}
                </label>
                <select
                  value={compareProductId}
                  onChange={(e) => setCompareProductId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-semibold cursor-pointer"
                >
                  {products.map(p => (
                    <option key={p.Product_ID} value={p.Product_ID}>
                      {p.Product_Name_AR} ({p.Internal_Reference})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Product Hero Overview */}
            {selectedProduct && (
              <div className="space-y-5">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-3">
                    {selectedProduct.Image_URL ? (
                      <img
                        src={selectedProduct.Image_URL}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 font-black text-xl shrink-0">
                        {selectedProduct.Product_Name_AR.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-white text-base">{selectedProduct.Product_Name_AR}</h4>
                        <span className="font-mono text-xs text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          {selectedProduct.Internal_Reference}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isAr ? 'سعر البيع الحالي:' : 'Prix de Vente:'}{' '}
                        <span className="font-mono font-bold text-emerald-400">
                          {(selectedProduct.Current_Selling_Price || selectedProduct.Suggested_Selling_Price || 0).toFixed(2)} MAD
                        </span>
                        {' '}• {isAr ? 'المخزون الحالي:' : 'Stock:'} <span className="font-mono font-bold text-white">{selectedProduct.Current_Stock} {selectedProduct.Unit}</span>
                      </p>
                    </div>
                  </div>

                  {/* Best price winner badge */}
                  {bestQuote && (
                    <div className="p-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-teal-500/15 border border-emerald-500/30 flex items-center gap-3 shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] text-emerald-300 font-bold block uppercase tracking-wide">
                          {isAr ? '🏆 أفضل وأقل ثمن شراء متوفر' : 'Meilleur Prix d’Achat'}
                        </span>
                        <div className="flex items-baseline gap-2">
                          <span className="font-mono font-black text-white text-lg">
                            {bestQuote.bestPrice.toFixed(2)} <span className="text-xs text-emerald-400">MAD</span>
                          </span>
                          <span className="text-xs text-slate-300 font-medium truncate max-w-[130px]">
                            ({bestQuote.supplierName})
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* KPI Metrics Cards for Selected Product */}
                {comparisonMetrics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[11px] mb-1">{isAr ? 'أفضل سعر شراء (الأدنى)' : 'Prix Minimum'}</span>
                      <div className="text-base font-black text-emerald-400 font-mono">
                        {comparisonMetrics.minPrice.toFixed(2)} MAD
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate">{bestQuote?.supplierName}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[11px] mb-1">{isAr ? 'أعلى سعر تم تسجيله' : 'Prix Maximum'}</span>
                      <div className="text-base font-black text-rose-400 font-mono">
                        {comparisonMetrics.maxPrice.toFixed(2)} MAD
                      </div>
                      <span className="text-[10px] text-slate-500 block truncate">{worstQuote?.supplierName || bestQuote?.supplierName}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[11px] mb-1">{isAr ? 'فارق التوفير المحقق' : 'Économie'}</span>
                      <div className="text-base font-black text-amber-400 font-mono">
                        {comparisonMetrics.savings.toFixed(2)} MAD <span className="text-xs text-slate-300">({comparisonMetrics.savingsPct.toFixed(1)}%)</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 block">{isAr ? 'توفير عند الشراء بأفضل سعر' : 'Par rapport au plus cher'}</span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 block text-[11px] mb-1">{isAr ? 'هامش الربح بأفضل سعر' : 'Marge Réalisable'}</span>
                      <div className="text-base font-black text-teal-400 font-mono">
                        {comparisonMetrics.profitAtBest.toFixed(2)} MAD <span className="text-xs text-slate-300">({comparisonMetrics.marginAtBest.toFixed(1)}%)</span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">{isAr ? 'بناءً على سعر البيع الحالي' : 'Selon prix de vente'}</span>
                    </div>
                  </div>
                )}

                {/* Ranked Supplier Quotes Table for Selected Product */}
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                  <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <span className="font-bold text-white text-xs flex items-center gap-2">
                      <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                      <span>{isAr ? 'ترتيب الموردين من الأرخص (الأفضل) إلى الأغلى:' : 'Classement des fournisseurs par prix croissant:'}</span>
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {currentQuotes.length} {isAr ? 'عروض موردين مسجلة' : 'offres'}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-start">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3 text-center w-12">{isAr ? 'الترتيب' : 'Rang'}</th>
                          <th className="py-2.5 px-4 text-start">{isAr ? 'اسم المورد' : 'Fournisseur'}</th>
                          <th className="py-2.5 px-3 text-start">{isAr ? 'مرجع المنتج لديه' : 'Réf. Fournisseur'}</th>
                          <th className="py-2.5 px-3 text-end">{isAr ? 'أفضل ثمن شراء' : 'Meilleur Prix'}</th>
                          <th className="py-2.5 px-3 text-end">{isAr ? 'آخر ثمن شراء' : 'Dernier Prix'}</th>
                          <th className="py-2.5 px-3 text-end">{isAr ? 'الكميات المشتراة' : 'Qté Achetée'}</th>
                          <th className="py-2.5 px-3 text-end">{isAr ? 'آخر تاريخ' : 'Dernière Date'}</th>
                          <th className="py-2.5 px-4 text-center">{isAr ? 'التقييم والتوفير' : 'Évaluation'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-sans">
                        {currentQuotes.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-slate-500">
                              {isAr
                                ? 'لا توجد فواتير أو مراجع شراء مسجلة بعد لهذا المنتج. يمكنك تسجيل فاتورة شراء لربط السعر بالمورد.'
                                : 'Aucune référence d’achat enregistrée pour cet article.'}
                            </td>
                          </tr>
                        ) : (
                          currentQuotes.map((quote, idx) => {
                            const isFirst = idx === 0;
                            const diffFromBest = quote.bestPrice - (bestQuote?.bestPrice || quote.bestPrice);
                            const diffPct = bestQuote && bestQuote.bestPrice > 0 ? (diffFromBest / bestQuote.bestPrice) * 100 : 0;

                            return (
                              <tr
                                key={quote.supplierId}
                                className={`transition-colors ${isFirst ? 'bg-emerald-950/20 hover:bg-emerald-950/30' : 'hover:bg-slate-900/40'}`}
                              >
                                {/* Rank */}
                                <td className="py-3 px-3 text-center">
                                  {isFirst ? (
                                    <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-black text-xs inline-flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                      1
                                    </span>
                                  ) : (
                                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 font-mono text-xs inline-flex items-center justify-center">
                                      {idx + 1}
                                    </span>
                                  )}
                                </td>

                                {/* Supplier Name */}
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-bold text-sm ${isFirst ? 'text-emerald-300' : 'text-white'}`}>
                                      {quote.supplierName}
                                    </span>
                                    {isFirst && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                        {isAr ? 'الأوفر سعراً' : 'Meilleur'}
                                      </span>
                                    )}
                                  </div>
                                  {quote.commercialName && (
                                    <span className="text-[10px] text-slate-400 block">{quote.commercialName}</span>
                                  )}
                                </td>

                                {/* Supplier Reference */}
                                <td className="py-3 px-3 font-mono text-amber-400 text-xs">
                                  {quote.supplierRef || '-'}
                                </td>

                                {/* Best Price */}
                                <td className="py-3 px-3 text-end font-mono font-black text-sm whitespace-nowrap text-white">
                                  {quote.bestPrice.toFixed(2)} MAD
                                </td>

                                {/* Last Price */}
                                <td className="py-3 px-3 text-end font-mono text-slate-300 whitespace-nowrap">
                                  {quote.lastPrice.toFixed(2)} MAD
                                </td>

                                {/* Total Qty */}
                                <td className="py-3 px-3 text-end font-mono text-slate-300 whitespace-nowrap">
                                  {quote.totalQtyBought > 0 ? `${quote.totalQtyBought} ${selectedProduct.Unit}` : '-'}
                                </td>

                                {/* Last Date */}
                                <td className="py-3 px-3 text-end text-slate-400 text-[11px] whitespace-nowrap">
                                  {quote.lastDate ? new Date(quote.lastDate).toLocaleDateString('ar-MA') : '-'}
                                </td>

                                {/* Difference vs Best */}
                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                  {isFirst ? (
                                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-[11px] inline-flex items-center gap-1 border border-emerald-500/30">
                                      <Award className="w-3.5 h-3.5" />
                                      <span>{isAr ? 'أفضل ثمن شراء' : 'Meilleur Prix'}</span>
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 font-mono text-[11px] border border-rose-500/20">
                                      +{diffFromBest.toFixed(2)} MAD (+{diffPct.toFixed(1)}%)
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ALL PRODUCTS BEST PURCHASE PRICE DIRECTORY */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h4 className="font-bold text-white text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <span>{isAr ? 'دليل جميع المنتجات مرتبة حسب أفضل ثمن شراء والمورد الموفر' : 'Catalogue Global: Meilleurs Prix par Produit'}</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAr
                    ? 'جدول مقارنة فوري لجميع الأصناف يحدد أقل سعر شراء مسجل في السوق واسم المورد الأوفر لتعظيم أرباح المحل.'
                    : 'Aperçu comparatif de tous les articles avec le fournisseur le plus économique.'}
                </p>
              </div>

              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={compareSearch}
                  onChange={(e) => setCompareSearch(e.target.value)}
                  placeholder={isAr ? 'بحث بالمنتج أو المورد...' : 'Recherche produit, fournisseur...'}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl ps-9 pe-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-start">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] font-bold uppercase">
                    <tr>
                      <th className="py-3 px-3 text-start">{isAr ? 'المرجع' : 'Réf.'}</th>
                      <th className="py-3 px-4 text-start">{isAr ? 'اسم المنتج' : 'Désignation'}</th>
                      <th className="py-3 px-3 text-start text-emerald-400">{isAr ? 'المورد الأوفر (الأفضل)' : 'Meilleur Fournisseur'}</th>
                      <th className="py-3 px-3 text-end text-emerald-400">{isAr ? 'أفضل ثمن شراء' : 'Meilleur Prix'}</th>
                      <th className="py-3 px-3 text-end">{isAr ? 'آخر سعر مسجل' : 'Dernier Prix'}</th>
                      <th className="py-3 px-3 text-end">{isAr ? 'سعر البيع' : 'Prix Vente'}</th>
                      <th className="py-3 px-3 text-end text-amber-400">{isAr ? 'التوفير المتاح' : 'Économie'}</th>
                      <th className="py-3 px-3 text-center">{isAr ? 'فحص العروض' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {globalProductsComparison.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-500">
                          {isAr ? 'لا توجد منتجات مطابقة للبحث' : 'Aucun produit trouvé'}
                        </td>
                      </tr>
                    ) : (
                      globalProductsComparison.map(row => (
                        <tr
                          key={row.product.Product_ID}
                          className="hover:bg-slate-900/60 transition-colors"
                        >
                          <td className="py-3 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                            {row.product.Internal_Reference}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-white text-sm block">{row.product.Product_Name_AR}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{row.product.Barcode || row.product.Product_ID}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-emerald-400 block">{row.bestSupplierName}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {row.quotesCount} {isAr ? 'موردين مسجلين' : 'fournisseurs'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-end font-mono font-black text-emerald-400 whitespace-nowrap text-sm">
                            {row.bestPrice > 0 ? `${row.bestPrice.toFixed(2)} MAD` : '-'}
                          </td>
                          <td className="py-3 px-3 text-end font-mono text-slate-300 whitespace-nowrap">
                            {row.lastPrice > 0 ? `${row.lastPrice.toFixed(2)} MAD` : '-'}
                          </td>
                          <td className="py-3 px-3 text-end font-mono font-bold text-white whitespace-nowrap">
                            {row.sellingPrice > 0 ? `${row.sellingPrice.toFixed(2)} MAD` : '-'}
                          </td>
                          <td className="py-3 px-3 text-end whitespace-nowrap">
                            {row.savings > 0 ? (
                              <span className="font-mono font-bold text-amber-400 text-[11px]">
                                {row.savings.toFixed(2)} MAD ({row.savingsPct.toFixed(0)}%)
                              </span>
                            ) : (
                              <span className="text-slate-600 text-[11px]">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                setCompareProductId(row.product.Product_ID);
                                window.scrollTo({ top: 300, behavior: 'smooth' });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 font-bold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <span>{isAr ? 'مقارنة الموردين' : 'Comparer'}</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUPPLIER INVOICES STATEMENT MODAL */}
      {statementSupplier && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl p-6 shadow-2xl space-y-4 text-xs animate-in fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-white text-base">
                    {isAr ? 'كشف حساب وفواتير المورد:' : 'Relevé Fournisseur:'} {statementSupplier.Supplier_Name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {statementSupplier.Supplier_ID} • {statementSupplier.Phone || (isAr ? 'بدون هاتف' : 'Pas de tél')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStatementSupplier(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick supplier balance banner */}
            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block">{isAr ? 'رقم الأعمال (إجمالي المشتريات)' : 'Volume Total'}</span>
                <span className="font-bold text-amber-400 text-sm">
                  {(supplierStats[statementSupplier.Supplier_ID]?.turnover || 0).toFixed(2)} MAD
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">{isAr ? 'إجمالي المسدد' : 'Total Réglé'}</span>
                <span className="font-bold text-emerald-400 text-sm">
                  {(supplierStats[statementSupplier.Supplier_ID]?.paid || 0).toFixed(2)} MAD
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">{isAr ? 'مستحقات المورد المتبقية' : 'Solde Dû'}</span>
                <span className={`font-bold text-sm ${statementSupplier.Current_Balance > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {statementSupplier.Current_Balance.toFixed(2)} MAD
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
                  {supplierInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                        {isAr ? 'لا توجد فواتير شراء مسجلة لهذا المورد بعد.' : 'Aucune facture pour ce fournisseur.'}
                      </td>
                    </tr>
                  ) : (
                    supplierInvoices.map(inv => (
                      <tr key={inv.Purchase_Invoice_ID} className="hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-bold text-white">{inv.Invoice_Number}</td>
                        <td className="py-2.5 px-3 text-slate-400 text-[11px]">
                          {new Date(inv.Invoice_Date || inv.Created_At).toLocaleDateString('ar-MA')}
                        </td>
                        <td className="py-2.5 px-3 text-end text-amber-400 font-bold">
                          {inv.Total.toFixed(2)} MAD
                        </td>
                        <td className="py-2.5 px-3 text-end text-emerald-400">
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
                onClick={() => setStatementSupplier(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer"
              >
                {isAr ? 'إغلاق' : 'Fermer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT SUPPLIER MODAL */}
      {isEditorOpen && editingSupplier && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4 text-xs animate-in fade-in">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base">
                {editingSupplier.Supplier_ID ? (isAr ? 'تعديل بيانات المورد' : 'Modifier Fournisseur') : (isAr ? 'إضافة مورد جديد' : 'Nouveau Fournisseur')}
              </h3>
              <button onClick={() => setIsEditorOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">{isAr ? 'اسم المورد التجاري *' : 'Nom Fournisseur *'}</label>
                <input
                  type="text"
                  required
                  value={editingSupplier.Supplier_Name || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, Supplier_Name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  placeholder="شركة النور للتوزيع"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">{isAr ? 'الاسم التجاري / العلامة' : 'Raison Sociale'}</label>
                  <input
                    type="text"
                    value={editingSupplier.Commercial_Name || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, Commercial_Name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="Al Nour Distribution"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">{isAr ? 'المعرف الضريبي (IF / ICE)' : 'ID Fiscal / ICE'}</label>
                  <input
                    type="text"
                    value={editingSupplier.Tax_ID || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, Tax_ID: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    placeholder="ICE: 00123456789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">{isAr ? 'الهاتف' : 'Téléphone'}</label>
                  <input
                    type="text"
                    value={editingSupplier.Phone || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, Phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    placeholder="0522..."
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">{isAr ? 'المدينة' : 'Ville'}</label>
                  <input
                    type="text"
                    value={editingSupplier.City || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, City: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    placeholder="الدار البيضاء"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input
                    type="email"
                    value={editingSupplier.Email || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, Email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    placeholder="contact@supplier.ma"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">{isAr ? 'الرصيد الافتتاحي المستحق (MAD)' : 'Solde Initial'}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSupplier.Opening_Balance || 0}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, Opening_Balance: Number(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'العنوان' : 'Adresse'}</label>
                <input
                  type="text"
                  value={editingSupplier.Address || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, Address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  placeholder="المنطقة الصناعية، الدار البيضاء"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'ملاحظات' : 'Notes'}</label>
                <textarea
                  rows={2}
                  value={editingSupplier.Notes || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, Notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
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
                  {isAr ? 'حفظ المورد' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
