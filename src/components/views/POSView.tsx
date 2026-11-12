/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product, Customer, SalesInvoice, SalesItem } from '../../types';
import { InvoicePrintModal } from '../common/InvoicePrintModal';
import {
  Barcode,
  Search,
  Camera,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  User,
  CreditCard,
  Banknote,
  Receipt,
  Printer,
  AlertTriangle,
  CheckCircle2,
  X,
  Package
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  grossProfit: number;
}

export const POSView: React.FC = () => {
  const {
    language,
    products,
    customers,
    activeCashSession,
    openCashSession,
    executeSaleInvoice,
    findProductByAnyCode
  } = useStore();

  const isAr = language === 'ar';

  // Barcode quick scan state & keyboard wedge listener
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('CUST-000');
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [includeTax, setIncludeTax] = useState<boolean>(false);
  const [taxRate, setTaxRate] = useState<number>(20); // 20% TVA in Morocco

  // Payment Modal state
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Bank_Transfer' | 'Cheque' | 'Mixed' | 'Credit'>('Cash');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Completed Invoice to Print
  const [completedInvoice, setCompletedInvoice] = useState<{
    invoice: SalesInvoice;
    items: SalesItem[];
  } | null>(null);

  // Camera scanner modal
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  // Auto-focus barcode input on mount and after scans
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Keyboard wedge listener: detects USB & Bluetooth scanners sending rapid characters followed by Enter
  useEffect(() => {
    let buffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is currently typing in an input other than barcodeInput
      const activeElement = document.activeElement;
      if (
        activeElement &&
        activeElement.tagName === 'INPUT' &&
        activeElement !== barcodeInputRef.current
      ) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      if (e.key === 'Enter') {
        if (buffer.length > 2) {
          handleScannedCode(buffer.trim());
          buffer = '';
          e.preventDefault();
        }
      } else if (e.key.length === 1) {
        // Fast typing buffer (barcode scanners output characters in < 30ms)
        if (timeDiff > 100) {
          buffer = e.key;
        } else {
          buffer += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products]);

  // Handle scanned or typed code
  const handleScannedCode = (code: string) => {
    const found = findProductByAnyCode(code);
    if (found) {
      addToCart(found);
      setBarcodeInput('');
    } else {
      alert(`لم يتم العثور على أي منتج يطابق الكود: ${code}`);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      handleScannedCode(barcodeInput.trim());
    }
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.Product_ID === product.Product_ID);
      const unitPrice = product.Current_Selling_Price;
      const unitCost = product.Average_Purchase_Cost || product.Last_Purchase_Price || 0;

      if (existingIndex !== -1) {
        const next = [...prev];
        const item = next[existingIndex];
        const newQty = item.quantity + 1;
        const total = (newQty * item.unitPrice) - item.discount;
        const grossProfit = total - (newQty * unitCost);

        next[existingIndex] = {
          ...item,
          quantity: newQty,
          total: Math.max(0, total),
          grossProfit
        };
        return next;
      }

      const total = unitPrice;
      const grossProfit = total - unitCost;
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice,
          discount: 0,
          total,
          grossProfit
        }
      ];
    });

    barcodeInputRef.current?.focus();
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.Product_ID === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const unitCost = item.product.Average_Purchase_Cost || item.product.Last_Purchase_Price || 0;
            const total = (newQty * item.unitPrice) - item.discount;
            const grossProfit = total - (newQty * unitCost);
            return {
              ...item,
              quantity: newQty,
              total: Math.max(0, total),
              grossProfit
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.Product_ID !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setOverallDiscount(0);
    setCashGiven(0);
  };

  // Calculations
  const subtotal = cart.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
  const itemsDiscount = cart.reduce((acc, it) => acc + (it.discount || 0), 0);
  const totalDiscount = itemsDiscount + (overallDiscount || 0);
  const discountedSubtotal = Math.max(0, subtotal - totalDiscount);
  const taxAmount = includeTax ? (discountedSubtotal * taxRate) / 100 : 0;
  const netTotal = discountedSubtotal + taxAmount;
  const cashChange = cashGiven > netTotal ? cashGiven - netTotal : 0;

  // Open Checkout Modal
  const handleProceedToPayment = () => {
    if (cart.length === 0) return;
    setCashGiven(Math.ceil(netTotal));
    setShowPaymentModal(true);
  };

  // Finalize Sale
  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    try {
      const paidAmount = paymentMethod === 'Credit' ? 0 : Math.min(cashGiven || netTotal, netTotal);
      const remainingAmount = Math.max(0, netTotal - paidAmount);

      const invoicePayload = {
        Customer_ID: selectedCustomer,
        Invoice_Date: new Date().toISOString(),
        Subtotal: subtotal,
        Discount: totalDiscount,
        Tax: taxAmount,
        Total: netTotal,
        Paid_Amount: paidAmount,
        Remaining_Amount: remainingAmount,
        Payment_Method: paymentMethod,
        Status: remainingAmount === 0 ? ('Paid' as const) : ('Partially_Paid' as const),
        Created_By: 'الكاشير',
        Approved_At: new Date().toISOString()
      };

      const itemsPayload = cart.map(item => ({
        Product_ID: item.product.Product_ID,
        Product_Reference: item.product.Product_Name_AR,
        Quantity: item.quantity,
        Unit_Price: item.unitPrice,
        Purchase_Cost_At_Sale: item.product.Average_Purchase_Cost || item.product.Last_Purchase_Price || 0,
        Discount: item.discount,
        Tax: 0,
        Total: item.total,
        GrossProfit: item.grossProfit
      }));

      const createdInvoice = await executeSaleInvoice(invoicePayload, itemsPayload as any);

      // Setup for printing
      setCompletedInvoice({
        invoice: createdInvoice,
        items: itemsPayload as any
      });

      setShowPaymentModal(false);
      clearCart();
    } catch (e: any) {
      alert(`حدث خطأ أثناء حفظ الفاتورة: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter products catalog
  const filteredProducts = products.filter(p => {
    if (!p.Active) return false;
    if (selectedCategory !== 'ALL' && p.Category_ID !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.Product_Name_AR.toLowerCase().includes(q) || p.Product_Name_FR.toLowerCase().includes(q);
      const matchRef = p.Internal_Reference.toLowerCase().includes(q) || (p.Barcode && p.Barcode.toLowerCase().includes(q));
      return matchName || matchRef;
    }
    return true;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-5rem)]">
      {/* LEFT / CENTER: Products Grid & Quick Scan Bar */}
      <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Top Scan & Search Bar */}
        <div className="p-3 md:p-4 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center gap-2">
          {/* Barcode scanner input */}
          <form onSubmit={handleBarcodeSubmit} className="relative flex-1 min-w-[200px]">
            <Barcode className="w-5 h-5 text-amber-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder={isAr ? 'مسح الباركود (USB / Bluetooth / Scanner)...' : 'Scanner Code-barres...'}
              className="w-full bg-slate-950 border border-amber-500/40 rounded-xl ps-10 pe-16 py-2.5 text-xs md:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono font-medium shadow-inner"
            />
            <span className="absolute end-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 hidden sm:inline">
              ENTER
            </span>
          </form>

          {/* Search by Name */}
          <div className="relative min-w-[140px] md:min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالاسم...' : 'Recherche...'}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl ps-9 pe-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-slate-500"
            />
          </div>

          {/* Camera Scanner Button */}
          <button
            onClick={() => setShowCameraScanner(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow"
            title={isAr ? 'مسح عبر الكاميرا' : 'Scanner Caméra'}
          >
            <Camera className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">{isAr ? 'كاميرا' : 'Caméra'}</span>
          </button>
        </div>

        {/* Categories Pills */}
        <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
            }`}
          >
            {isAr ? 'الكل' : 'Tous'} ({products.length})
          </button>
          {['CAT-001', 'CAT-002', 'CAT-003', 'CAT-004'].map(catId => (
            <button
              key={catId}
              onClick={() => setSelectedCategory(catId)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                selectedCategory === catId
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
              }`}
            >
              {catId === 'CAT-001' ? (isAr ? 'إلكترونيات' : 'Électronique') :
               catId === 'CAT-002' ? (isAr ? 'مكتبية' : 'Bureau') :
               catId === 'CAT-003' ? (isAr ? 'قطع غيار' : 'Pièces') : (isAr ? 'استهلاكية' : 'Consommables')}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
          {filteredProducts.map(product => {
            const isOutOfStock = product.Current_Stock <= 0;
            const isLowStock = product.Current_Stock > 0 && product.Current_Stock <= product.Minimum_Stock;

            return (
              <div
                key={product.Product_ID}
                onClick={() => !isOutOfStock && addToCart(product)}
                className={`group bg-slate-950 border rounded-xl p-2.5 flex flex-col justify-between transition-all select-none ${
                  isOutOfStock
                    ? 'border-rose-950/60 opacity-60 cursor-not-allowed'
                    : 'border-slate-800 hover:border-amber-500/60 hover:shadow-lg hover:shadow-amber-500/5 cursor-pointer active:scale-95'
                }`}
              >
                <div>
                  {/* Image */}
                  <div className="relative w-full h-24 rounded-lg bg-slate-900 overflow-hidden mb-2">
                    <img
                      src={product.Image_URL || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&auto=format&fit=crop&q=80'}
                      alt={product.Product_Name_AR}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {isLowStock && (
                      <span className="absolute top-1 start-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-slate-950 shadow">
                        {isAr ? 'منخفض' : 'Bas'}
                      </span>
                    )}
                    {isOutOfStock && (
                      <span className="absolute top-1 start-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-600 text-white shadow">
                        {isAr ? 'نفذ' : 'Épuisé'}
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs font-bold text-slate-100 line-clamp-2 leading-tight group-hover:text-amber-400 transition-colors">
                    {isAr ? product.Product_Name_AR : (product.Product_Name_FR || product.Product_Name_AR)}
                  </h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {product.Internal_Reference}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-amber-400">
                      {product.Current_Selling_Price.toFixed(2)}
                    </span>
                    <span className="text-[9px] text-slate-400 ms-0.5">MAD</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {product.Current_Stock} {isAr ? 'قطعة' : 'u'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Live POS Cart & Checkout */}
      <div className="w-full lg:w-96 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shrink-0">
        {/* Cart Header */}
        <div className="p-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-slate-100 text-sm">
              {isAr ? 'سلة المشتريات' : 'Panier en cours'}
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-mono font-bold">
              {cart.reduce((a, b) => a + b.quantity, 0)}
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-[11px] text-rose-400 hover:text-rose-300 font-medium"
            >
              {isAr ? 'إفراغ السلة' : 'Vider'}
            </button>
          )}
        </div>

        {/* Customer Selector */}
        <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between text-xs mb-1 text-slate-400">
            <span>{isAr ? 'الزبون (Client):' : 'Client:'}</span>
            {selectedCustomer !== 'CUST-000' && (
              <span className="text-[10px] text-amber-400 font-bold">
                {isAr ? 'حساب خاص' : 'Compte'}
              </span>
            )}
          </div>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
          >
            {customers.map(c => (
              <option key={c.Customer_ID} value={c.Customer_ID}>
                {c.Customer_Name} {c.Current_Balance > 0 ? `(دين: ${c.Current_Balance} MAD)` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Package className="w-12 h-12 mb-2 opacity-30 text-slate-400" />
              <p className="text-xs font-medium">
                {isAr ? 'السلة فارغة. قم بمسح الباركود أو اضغط على أي منتج لإضافته' : 'Panier vide. Scannez un code ou sélectionnez un produit.'}
              </p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.product.Product_ID}
                className="bg-slate-950 border border-slate-800/90 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-sm"
              >
                <div className="flex-1 truncate">
                  <h5 className="text-xs font-bold text-slate-200 truncate">
                    {item.product.Product_Name_AR}
                  </h5>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span>{item.unitPrice.toFixed(2)} MAD</span>
                    <span>×</span>
                    <span className="font-bold text-slate-300">{item.quantity}</span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.product.Product_ID, -1)}
                    className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-mono font-bold text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.Product_ID, 1)}
                    className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Line Total */}
                <div className="text-end min-w-[65px] shrink-0">
                  <div className="text-xs font-bold text-amber-400">
                    {item.total.toFixed(2)}
                  </div>
                  <button
                    onClick={() => removeItem(item.product.Product_ID)}
                    className="text-[10px] text-slate-500 hover:text-rose-400"
                  >
                    <Trash2 className="w-3 h-3 inline" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Summary & Checkout Action */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-2">
          {/* Discount & Tax toggles */}
          <div className="flex items-center justify-between gap-2 text-xs pt-1">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">{isAr ? 'خصم:' : 'Remise:'}</span>
              <input
                type="number"
                min="0"
                value={overallDiscount || ''}
                onChange={(e) => setOverallDiscount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-amber-400 font-mono text-center focus:outline-none"
              />
              <span className="text-slate-500">MAD</span>
            </div>

            <label className="flex items-center gap-1 text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTax}
                onChange={(e) => setIncludeTax(e.target.checked)}
                className="rounded accent-amber-500"
              />
              <span>TVA (20%)</span>
            </label>
          </div>

          <div className="space-y-1 text-xs pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-slate-400">
              <span>{isAr ? 'المجموع الفرعي:' : 'Sous-total:'}</span>
              <span>{subtotal.toFixed(2)} MAD</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-rose-400">
                <span>{isAr ? 'الخصم:' : 'Remise:'}</span>
                <span>-{totalDiscount.toFixed(2)} MAD</span>
              </div>
            )}
            {includeTax && (
              <div className="flex justify-between text-slate-400">
                <span>{isAr ? 'الضريبة TVA (20%):' : 'TVA (20%):'}</span>
                <span>+{taxAmount.toFixed(2)} MAD</span>
              </div>
            )}
            <div className="flex justify-between text-base font-black text-white pt-1 border-t border-slate-800">
              <span>{isAr ? 'الإجمالي الصافي:' : 'Total Net:'}</span>
              <span className="text-amber-400 text-lg font-mono">
                {netTotal.toFixed(2)} <span className="text-xs">MAD</span>
              </span>
            </div>
          </div>

          <button
            onClick={handleProceedToPayment}
            disabled={cart.length === 0}
            className="w-full mt-2 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm tracking-wide shadow-lg shadow-amber-500/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Banknote className="w-5 h-5" />
            <span>{isAr ? 'تأكيد ودفع الفاتورة (F10)' : 'Valider & Encaisser'}</span>
          </button>
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <span>{isAr ? 'تسديد الفاتورة والدفع' : 'Encaissement'}</span>
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Display */}
            <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 text-center">
              <span className="text-xs text-slate-400 block">{isAr ? 'المبلغ المطلوب أداؤه:' : 'Montant à payer:'}</span>
              <span className="text-3xl font-black text-amber-400 font-mono">
                {netTotal.toFixed(2)} <span className="text-sm">MAD</span>
              </span>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-medium block">
                {isAr ? 'طريقة الأداء:' : 'Mode de Paiement:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Cash', label: isAr ? 'نقداً (Cash)' : 'Espèces' },
                  { id: 'Card', label: isAr ? 'بطاقة بنكية' : 'Carte' },
                  { id: 'Bank_Transfer', label: isAr ? 'تحويل' : 'Virement' },
                  { id: 'Cheque', label: isAr ? 'شيك' : 'Chèque' },
                  { id: 'Credit', label: isAr ? 'على الحساب (آجل)' : 'À crédit' },
                  { id: 'Mixed', label: isAr ? 'أداء مختلط' : 'Mixte' }
                ].map(m => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      paymentMethod === m.id
                        ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold shadow'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Given & Change Calculation (if Cash or Mixed) */}
            {(paymentMethod === 'Cash' || paymentMethod === 'Mixed') && (
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-slate-300 font-medium">
                    {isAr ? 'المبلغ المسلم من الزبون:' : 'Montant Reçu:'}
                  </label>
                  <input
                    type="number"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(Number(e.target.value) || 0)}
                    className="w-28 bg-slate-900 border border-amber-500/50 rounded-lg px-2.5 py-1 text-sm text-end font-mono font-bold text-amber-400 focus:outline-none"
                  />
                </div>

                {/* Quick cash denomination buttons */}
                <div className="flex gap-1.5 justify-end">
                  {[50, 100, 200, 500].map(val => (
                    <button
                      key={val}
                      onClick={() => setCashGiven(val)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 font-mono"
                    >
                      {val} DH
                    </button>
                  ))}
                  <button
                    onClick={() => setCashGiven(Math.ceil(netTotal))}
                    className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold"
                  >
                    {isAr ? 'مطابق' : 'Exact'}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400">{isAr ? 'الباقي المرجع للزبون (الصرف):' : 'Monnaie à rendre:'}</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {cashChange.toFixed(2)} MAD
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                {isAr ? 'إلغاء' : 'Annuler'}
              </button>
              <button
                onClick={handleCompleteSale}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs md:text-sm shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>{isAr ? 'جاري تسجيل الفاتورة...' : 'Enregistrement...'}</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isAr ? 'تأكيد وطباعة الفاتورة' : 'Valider & Imprimer'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INVOICE PRINT MODAL */}
      {completedInvoice && (
        <InvoicePrintModal
          invoice={completedInvoice.invoice}
          items={completedInvoice.items}
          onClose={() => setCompletedInvoice(null)}
        />
      )}

      {/* CAMERA SCANNER MODAL */}
      {showCameraScanner && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 text-center space-y-4">
            <h3 className="font-bold text-slate-100 text-sm">
              {isAr ? 'مسح الباركود عبر الكاميرا' : 'Scanner Caméra'}
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'وجه كاميرا هاتفك أو حاسوبك نحو كود الباركود أو الـ QR الخاص بالمنتج'
                : 'Scannez le code-barres avec votre caméra.'}
            </p>
            <div className="w-full h-48 bg-slate-950 rounded-xl flex items-center justify-center border border-slate-800 text-slate-600 text-xs font-mono">
              [ Camera Feed Preview ]
            </div>
            <button
              onClick={() => setShowCameraScanner(false)}
              className="w-full py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              {isAr ? 'إغلاق الكاميرا' : 'Fermer'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
