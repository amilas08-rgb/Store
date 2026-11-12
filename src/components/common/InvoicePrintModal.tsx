/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { SalesInvoice, SalesItem } from '../../types';
import { useStore } from '../../context/StoreContext';
import { Printer, X, Download, Loader2, FileText, CheckCircle2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface InvoicePrintModalProps {
  invoice: SalesInvoice;
  items: SalesItem[];
  onClose: () => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({ invoice, items, onClose }) => {
  const { storeSettings, customers, language } = useStore();
  const [printFormat, setPrintFormat] = useState<'ticket' | 'a4' | 'a5'>('ticket');
  const [isExporting, setIsExporting] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  const isAr = language === 'ar';
  const customer = customers.find(c => c.Customer_ID === invoice.Customer_ID);

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

      if (printFormat === 'ticket') {
        const ticketWidth = 80;
        const ticketHeight = Math.max(120, (canvas.height * ticketWidth) / canvas.width);
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [ticketWidth, ticketHeight + 10]
        });
        pdf.addImage(imgData, 'PNG', 0, 5, ticketWidth, ticketHeight);
        pdf.save(`Ticket_${invoice.Invoice_Number}.pdf`);
      } else if (printFormat === 'a5') {
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a5'
        });
        const pdfWidth = 148;
        const pdfHeight = 210;
        const imgWidth = 138;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 5, 8, imgWidth, Math.min(pdfHeight - 16, imgHeight));
        pdf.save(`Facture_A5_${invoice.Invoice_Number}.pdf`);
      } else {
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
        pdf.save(`Facture_A4_${invoice.Invoice_Number}.pdf`);
      }
    } catch (err: any) {
      console.error('PDF export error:', err);
      alert(isAr ? 'حدث خطأ أثناء إنشاء ملف PDF' : "Erreur lors de la génération du PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header (hidden in print) */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100">
                {isAr ? 'معاينة وطباعة وتصدير الفاتورة' : 'Aperçu & Export Facture'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">{invoice.Invoice_Number}</p>
            </div>
          </div>

          {/* Format selector */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-800 p-1 rounded-lg flex items-center gap-1 text-xs">
              <button
                onClick={() => setPrintFormat('ticket')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  printFormat === 'ticket' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                Ticket 80mm
              </button>
              <button
                onClick={() => setPrintFormat('a4')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  printFormat === 'a4' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                A4
              </button>
              <button
                onClick={() => setPrintFormat('a5')}
                className={`px-3 py-1 rounded font-medium transition-colors ${
                  printFormat === 'a5' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                }`}
              >
                A5
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50 flex justify-center">
          {printFormat === 'ticket' ? (
            /* Thermal Receipt 80mm format */
            <div
              ref={printableRef}
              className="w-[320px] bg-white text-slate-900 p-5 rounded shadow-lg text-xs leading-relaxed font-mono"
            >
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                {storeSettings.Logo_URL && (
                  <img
                    src={storeSettings.Logo_URL}
                    alt="Logo"
                    className="w-14 h-14 mx-auto mb-2 object-contain"
                  />
                )}
                <h2 className="font-bold text-sm tracking-wide">{storeSettings.Store_Name}</h2>
                <p className="text-[10px] text-slate-600">{storeSettings.Commercial_Name}</p>
                <p className="text-[10px] text-slate-600">{storeSettings.Address}</p>
                <p className="text-[10px] text-slate-600">{storeSettings.Phone}</p>
                {storeSettings.Tax_ID && (
                  <p className="text-[9px] text-slate-500 mt-1">{storeSettings.Tax_ID}</p>
                )}
              </div>

              <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'رقم الفاتورة:' : 'N° Facture:'}</span>
                  <span className="font-bold">{invoice.Invoice_Number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'التاريخ:' : 'Date:'}</span>
                  <span>{new Date(invoice.Invoice_Date || invoice.Created_At).toLocaleDateString('ar-MA')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'الزبون:' : 'Client:'}</span>
                  <span className="font-medium">{customer?.Customer_Name || 'زبون عادي'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isAr ? 'طريقة الأداء:' : 'Paiement:'}</span>
                  <span>{invoice.Payment_Method}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="py-3 border-b border-dashed border-slate-300">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="text-start pb-1 font-normal">{isAr ? 'الصنف' : 'Article'}</th>
                      <th className="text-center pb-1 font-normal">{isAr ? 'الكمية' : 'Qté'}</th>
                      <th className="text-end pb-1 font-normal">{isAr ? 'السعر' : 'P.U'}</th>
                      <th className="text-end pb-1 font-normal">{isAr ? 'المجموع' : 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, i) => (
                      <tr key={i} className="py-1">
                        <td className="py-1 font-sans text-[11px] leading-tight">
                          <div>{item.Product_Reference}</div>
                        </td>
                        <td className="text-center py-1">{item.Quantity}</td>
                        <td className="text-end py-1">{item.Unit_Price.toFixed(2)}</td>
                        <td className="text-end py-1 font-semibold">{item.Total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>{isAr ? 'المجموع الفرعي:' : 'Sous-total:'}</span>
                  <span>{invoice.Subtotal.toFixed(2)} MAD</span>
                </div>
                {invoice.Discount > 0 && (
                  <div className="flex justify-between text-rose-600">
                    <span>{isAr ? 'الخصم:' : 'Remise:'}</span>
                    <span>-{invoice.Discount.toFixed(2)} MAD</span>
                  </div>
                )}
                {invoice.Tax > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>{isAr ? 'الضريبة TVA:' : 'TVA:'}</span>
                    <span>+{invoice.Tax.toFixed(2)} MAD</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-200">
                  <span>{isAr ? 'الإجمالي الصافي:' : 'TOTAL NET:'}</span>
                  <span>{invoice.Total.toFixed(2)} MAD</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1">
                  <span>{isAr ? 'المبلغ المؤدى:' : 'Payé:'}</span>
                  <span>{invoice.Paid_Amount.toFixed(2)} MAD</span>
                </div>
                {invoice.Remaining_Amount > 0 && (
                  <div className="flex justify-between text-rose-700 font-bold">
                    <span>{isAr ? 'الباقي بذمة الزبون:' : 'Reste dû:'}</span>
                    <span>{invoice.Remaining_Amount.toFixed(2)} MAD</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center pt-3 text-[10px] text-slate-500 space-y-1 font-sans">
                <p>{storeSettings.Invoice_Footer}</p>
                <p className="text-[9px] text-slate-400">{storeSettings.Invoice_Conditions}</p>
              </div>
            </div>
          ) : (
            /* A4 / A5 Invoice format */
            <div
              ref={printableRef}
              className={`bg-white text-slate-900 p-8 rounded shadow-lg ${printFormat === 'a4' ? 'w-[560px]' : 'w-[450px]'} text-xs leading-relaxed`}
            >
              <div className="flex justify-between items-start pb-6 border-b border-slate-200">
                <div>
                  <h2 className="text-xl font-black text-slate-950">{storeSettings.Store_Name}</h2>
                  <p className="text-slate-600 font-medium">{storeSettings.Commercial_Name}</p>
                  <p className="text-slate-500 text-[11px]">{storeSettings.Address} - {storeSettings.City}</p>
                  <p className="text-slate-500 text-[11px]">Tél: {storeSettings.Phone} | {storeSettings.Email}</p>
                  <p className="text-slate-500 text-[10px] mt-1 font-mono">{storeSettings.Tax_ID}</p>
                </div>
                <div className="text-end">
                  <span className="inline-block px-3 py-1 rounded bg-slate-950 text-white font-bold text-sm tracking-wider uppercase">
                    {isAr ? 'فاتورة بيع' : 'FACTURE DE VENTE'}
                  </span>
                  <p className="font-mono font-bold text-slate-800 mt-2">{invoice.Invoice_Number}</p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(invoice.Invoice_Date || invoice.Created_At).toLocaleDateString('ar-MA')}
                  </p>
                </div>
              </div>

              <div className="my-5 p-3 rounded-lg bg-slate-50 border border-slate-200 flex justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? 'بيانات الزبون' : 'CLIENT'}</span>
                  <p className="font-bold text-slate-900 text-sm">{customer?.Customer_Name || 'زبون عادي'}</p>
                  <p className="text-slate-600 text-[11px]">{customer?.Phone !== '-' ? customer?.Phone : ''}</p>
                  <p className="text-slate-600 text-[11px]">{customer?.Address !== '-' ? customer?.Address : ''}</p>
                </div>
                <div className="text-end">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? 'طريقة الأداء' : 'PAIEMENT'}</span>
                  <p className="font-semibold text-slate-800">{invoice.Payment_Method}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {invoice.Status}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs mb-6">
                <thead>
                  <tr className="bg-slate-100 border-y border-slate-200 text-slate-700">
                    <th className="py-2 px-3 text-start">{isAr ? 'الصنف / المرجع' : 'Désignation'}</th>
                    <th className="py-2 px-3 text-center">{isAr ? 'الكمية' : 'Quantité'}</th>
                    <th className="py-2 px-3 text-end">{isAr ? 'سعر الوحدة' : 'Prix Unitaire'}</th>
                    <th className="py-2 px-3 text-end">{isAr ? 'الخصم' : 'Remise'}</th>
                    <th className="py-2 px-3 text-end">{isAr ? 'المجموع صافي' : 'Total Net'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-medium">{it.Product_Reference}</td>
                      <td className="py-2.5 px-3 text-center">{it.Quantity}</td>
                      <td className="py-2.5 px-3 text-end">{it.Unit_Price.toFixed(2)} MAD</td>
                      <td className="py-2.5 px-3 text-end">{it.Discount ? it.Discount.toFixed(2) : '-'}</td>
                      <td className="py-2.5 px-3 text-end font-bold">{it.Total.toFixed(2)} MAD</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div className="flex justify-end">
                <div className="w-60 space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-600">{isAr ? 'المجموع دون احتساب الضريبة:' : 'Sous-total HT:'}</span>
                    <span>{invoice.Subtotal.toFixed(2)} MAD</span>
                  </div>
                  {invoice.Discount > 0 && (
                    <div className="flex justify-between text-rose-600 py-1 border-b border-slate-100">
                      <span>{isAr ? 'خصم تجاري:' : 'Remise:'}</span>
                      <span>-{invoice.Discount.toFixed(2)} MAD</span>
                    </div>
                  )}
                  {invoice.Tax > 0 && (
                    <div className="flex justify-between text-slate-600 py-1 border-b border-slate-100">
                      <span>{isAr ? 'ضريبة القيمة المضافة TVA:' : 'TVA:'}</span>
                      <span>+{invoice.Tax.toFixed(2)} MAD</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black py-2 border-y-2 border-slate-900 bg-slate-50 px-2">
                    <span>{isAr ? 'الإجمالي الصافي للواجب أداؤه:' : 'NET À PAYER:'}</span>
                    <span className="text-slate-950">{invoice.Total.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between py-1 text-slate-700">
                    <span>{isAr ? 'المبلغ المؤدى فعلياً:' : 'Montant Réglé:'}</span>
                    <span>{invoice.Paid_Amount.toFixed(2)} MAD</span>
                  </div>
                </div>
              </div>

              {/* Conditions & Footer */}
              <div className="mt-8 pt-4 border-t border-slate-200 text-[11px] text-slate-500">
                <p className="font-semibold text-slate-700 mb-1">{isAr ? 'شروط البيع والضمان:' : 'Conditions de Vente:'}</p>
                <p className="text-[10px] leading-relaxed">{storeSettings.Invoice_Conditions}</p>
                <p className="text-center font-bold text-slate-800 mt-4">{storeSettings.Invoice_Footer}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls (hidden in print) */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between no-print">
          <p className="text-xs text-slate-400">
            {isAr ? 'تصدير كملف PDF عالي الجودة أو طباعة مباشرة' : 'Exportez en PDF haute définition ou imprimez'}
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
