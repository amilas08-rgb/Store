/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { PurchaseInvoice, PurchaseItem } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Printer, X, Download, Loader2, Truck, CheckCircle2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface PurchaseInvoicePrintModalProps {
  invoice: PurchaseInvoice;
  items: PurchaseItem[];
  onClose: () => void;
}

export const PurchaseInvoicePrintModal: React.FC<PurchaseInvoicePrintModalProps> = ({ invoice, items, onClose }) => {
  const { storeSettings, suppliers, products, language } = useStore();
  const [isExporting, setIsExporting] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  const isAr = language === 'ar';
  const supplier = suppliers.find(s => s.Supplier_ID === invoice.Supplier_ID);

  const getProductName = (id: string) => {
    const p = products.find(prod => prod.Product_ID === id);
    return p ? p.Product_Name_AR : id;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!printableRef.current) return;
    setIsExporting(true);

    try {
      const element = printableRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pdfWidth = 210;
      const pdfHeight = 297;
      const imgWidth = 194;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 8, 10, imgWidth, Math.min(pdfHeight - 20, imgHeight));
      pdf.save(`Bon_Achat_${invoice.Invoice_Number}.pdf`);
    } catch (err: any) {
      console.error('PDF export error:', err);
      alert(isAr ? 'حدث خطأ أثناء إنشاء ملف PDF' : 'Erreur lors de la génération du PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100">
                {isAr ? 'معاينة وطباعة وتصدير فاتورة الشراء' : "Aperçu & Export Bon d'Achat"}
              </h3>
              <p className="text-xs text-slate-400 font-mono">{invoice.Invoice_Number}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Purchase Voucher */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50 flex justify-center">
          <div
            ref={printableRef}
            className="bg-white text-slate-900 p-8 rounded shadow-lg w-[600px] text-xs leading-relaxed font-sans"
          >
            {/* Header */}
            <div className="flex justify-between items-start pb-6 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-black text-slate-950">{storeSettings.Store_Name}</h2>
                <p className="text-slate-600 font-medium">{storeSettings.Commercial_Name}</p>
                <p className="text-slate-500 text-[11px]">{storeSettings.Address} - {storeSettings.City}</p>
                <p className="text-slate-500 text-[11px]">Tél: {storeSettings.Phone}</p>
                <p className="text-slate-500 text-[10px] mt-1 font-mono">{storeSettings.Tax_ID}</p>
              </div>
              <div className="text-end">
                <span className="inline-block px-3 py-1 rounded bg-amber-500 text-slate-950 font-black text-sm tracking-wider uppercase">
                  {isAr ? 'سند استلام وتوريد بضاعة' : "BON DE RÉCEPTION & ACHAT"}
                </span>
                <p className="font-mono font-bold text-slate-800 mt-2">{invoice.Invoice_Number}</p>
                <p className="text-[11px] text-slate-500">
                  {new Date(invoice.Invoice_Date || invoice.Created_At).toLocaleDateString('ar-MA')}
                </p>
                {invoice.Supplier_Invoice_Number && (
                  <p className="text-[10px] text-slate-600 font-mono">
                    {isAr ? 'رقم فاتورة المورد: ' : 'N° Réf Fournisseur: '} {invoice.Supplier_Invoice_Number}
                  </p>
                )}
              </div>
            </div>

            {/* Supplier Information */}
            <div className="my-5 p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? 'بيانات المورد' : 'FOURNISSEUR'}</span>
                <p className="font-bold text-slate-900 text-sm">{supplier?.Supplier_Name || invoice.Supplier_ID}</p>
                <p className="text-slate-600 text-[11px]">{supplier?.Phone}</p>
                <p className="text-slate-600 text-[11px]">{supplier?.Address} - {supplier?.City}</p>
                {supplier?.Tax_ID && <p className="text-slate-500 text-[10px] font-mono">{supplier.Tax_ID}</p>}
              </div>
              <div className="text-end">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? 'طريقة الأداء والحالة' : 'PAIEMENT'}</span>
                <p className="font-semibold text-slate-800">{invoice.Payment_Method}</p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                  invoice.Status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {invoice.Status}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-xs mb-6">
              <thead>
                <tr className="bg-slate-100 border-y border-slate-200 text-slate-700">
                  <th className="py-2.5 px-3 text-start">{isAr ? 'الصنف / البضاعة' : 'Article'}</th>
                  <th className="py-2.5 px-3 text-start">{isAr ? 'مرجع المورد' : 'Réf Fourn.'}</th>
                  <th className="py-2.5 px-3 text-center">{isAr ? 'الكمية' : 'Quantité'}</th>
                  <th className="py-2.5 px-3 text-end">{isAr ? 'سعر الشراء' : 'Prix Achat'}</th>
                  <th className="py-2.5 px-3 text-end">{isAr ? 'التكلفة الإجمالية' : 'Total'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{getProductName(it.Product_ID)}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{it.Supplier_Reference || '-'}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">{it.Quantity}</td>
                    <td className="py-2.5 px-3 text-end font-mono">{it.Unit_Price.toFixed(2)} MAD</td>
                    <td className="py-2.5 px-3 text-end font-mono font-bold">{it.Total.toFixed(2)} MAD</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-600">{isAr ? 'المجموع الفرعي للبضاعة:' : 'Sous-total:'}</span>
                  <span className="font-mono">{invoice.Subtotal.toFixed(2)} MAD</span>
                </div>
                {invoice.Discount > 0 && (
                  <div className="flex justify-between text-rose-600 py-1 border-b border-slate-100">
                    <span>{isAr ? 'الخصم الممنوح:' : 'Remise:'}</span>
                    <span className="font-mono">-{invoice.Discount.toFixed(2)} MAD</span>
                  </div>
                )}
                {invoice.Transport_Cost > 0 && (
                  <div className="flex justify-between text-slate-600 py-1 border-b border-slate-100">
                    <span>{isAr ? 'تكلفة النقل والشحن:' : 'Transport:'}</span>
                    <span className="font-mono">+{invoice.Transport_Cost.toFixed(2)} MAD</span>
                  </div>
                )}
                {invoice.Other_Expenses > 0 && (
                  <div className="flex justify-between text-slate-600 py-1 border-b border-slate-100">
                    <span>{isAr ? 'مصاريف تفريغ وملحقة:' : 'Autres Frais:'}</span>
                    <span className="font-mono">+{invoice.Other_Expenses.toFixed(2)} MAD</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black py-2 border-y-2 border-slate-900 bg-slate-50 px-2">
                  <span>{isAr ? 'إجمالي فاتورة الشراء:' : 'TOTAL ACHAT:'}</span>
                  <span className="font-mono text-slate-950">{invoice.Total.toFixed(2)} MAD</span>
                </div>
                <div className="flex justify-between py-1 text-slate-700">
                  <span>{isAr ? 'المبلغ المؤدى للمورد:' : 'Montant Réglé:'}</span>
                  <span className="font-mono">{invoice.Paid_Amount.toFixed(2)} MAD</span>
                </div>
                {invoice.Remaining_Amount > 0 && (
                  <div className="flex justify-between py-1 font-bold text-rose-700">
                    <span>{isAr ? 'المتبقي في ذمة المحل:' : 'Reste dû:'}</span>
                    <span className="font-mono">{invoice.Remaining_Amount.toFixed(2)} MAD</span>
                  </div>
                )}
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 text-center text-slate-600 text-xs">
              <div>
                <p className="font-bold text-slate-800 mb-10">{isAr ? 'توقيع ومصادقة المورد' : 'Signature Fournisseur'}</p>
                <div className="w-32 border-b border-dashed border-slate-400 mx-auto"></div>
              </div>
              <div>
                <p className="font-bold text-slate-800 mb-10">{isAr ? 'توقيع مسؤول المستودع والاستلام' : 'Visa Réception Magasin'}</p>
                <div className="w-32 border-b border-dashed border-slate-400 mx-auto"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer controls */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between no-print">
          <p className="text-xs text-slate-400">
            {isAr ? 'تصدير سند الاستلام كـ PDF أو طباعة مباشرة' : "Exportez le bon d'achat en PDF"}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              {isAr ? 'إغلاق' : 'Fermer'}
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isAr ? 'جاري إنشاء PDF...' : 'Création PDF...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{isAr ? 'تصدير PDF (Télécharger)' : 'Télécharger PDF'}</span>
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? 'طباعة مباشرة' : 'Imprimer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
