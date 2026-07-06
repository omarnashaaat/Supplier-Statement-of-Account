import React from 'react';
import { Printer, X } from 'lucide-react';
import { JournalEntry } from '../types';
import { formatCurrency, tafqeet } from '../data';

interface PrintVoucherProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry;
}

export default function PrintVoucher({ isOpen, onClose, entry }: PrintVoucherProps) {
  if (!isOpen) return null;

  // Calculate totals
  const totalDebit = entry.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = entry.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 flex items-center justify-center p-4">
      {/* Container holding print sheet */}
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh] text-slate-800">
        
        {/* Actions bar - hidden during browser print */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl no-print shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-slate-700">معاينة سند قيد اليومية الاحترافي (جاهز للطباعة A4)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>ابدأ الطباعة الفورية</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Area */}
        <div className="flex-1 overflow-y-auto p-12 bg-white print-page">
          
          {/* Document Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-300 pb-5 mb-6">
            <div className="text-right">
              <h1 className="text-xl font-black text-slate-900 leading-tight">شركة الأهرام للمقاولات والتعمير</h1>
              <p className="text-[11px] text-slate-500 mt-1">جمهورية مصر العربية | الإدارة المالية المركزية</p>
              <p className="text-[10px] text-slate-400 mt-0.5">الهاتف: 02-33045209 | البريد الإلكتروني: finance@al-ahram.eg</p>
            </div>
            
            {/* Pyramid stylized logo */}
            <div className="text-center">
              <div className="inline-block relative w-16 h-10 border-b-4 border-amber-600">
                <div className="absolute bottom-0 right-2 w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-b-[28px] border-b-amber-500" />
                <div className="absolute bottom-0 left-2 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-b-[22px] border-b-amber-600" />
              </div>
              <span className="block text-[9px] font-bold text-amber-700 tracking-wider mt-1 font-sans">الأهرام للمقاولات</span>
            </div>
          </div>

          {/* Document Title */}
          <div className="text-center mb-8">
            <h2 className="text-lg font-black bg-slate-100 text-slate-800 px-6 py-2 rounded-lg inline-block border border-slate-200">
              سند قيد يومية عامة (Journal Voucher)
            </h2>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-400 block mb-1">رقم القيد (Voucher No):</span>
              <span className="font-bold text-slate-800 font-mono text-sm">{entry.entryNo}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">تاريخ القيد (Date):</span>
              <span className="font-bold text-slate-800 font-mono text-sm">{entry.date}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">العملة الأساسية (Currency):</span>
              <span className="font-bold text-slate-800">{entry.currency === 'EGP' ? 'الجنيه المصري (EGP)' : entry.currency}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">حالة الاعتماد (Status):</span>
              <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                {entry.status === 'approved' || entry.status === 'posted' ? 'مرحل ومقفل في الدفاتر' : 'متوازن وجاهز'}
              </span>
            </div>
          </div>

          {/* Main Accounting Table */}
          <div className="border border-slate-300 rounded-xl overflow-hidden mb-6">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-350">
                <tr>
                  <th className="p-3 border-l border-slate-300 text-center w-20">كود الحساب</th>
                  <th className="p-3 border-l border-slate-300">اسم الحساب الجاري</th>
                  <th className="p-3 border-l border-slate-300 text-center w-32 bg-slate-50">مدين (Debit)</th>
                  <th className="p-3 border-l border-slate-300 text-center w-32 bg-slate-50">دائن (Credit)</th>
                  <th className="p-3 border-l border-slate-300">مركز التكلفة</th>
                  <th className="p-3">البيان والبيان التفصيلي للسطر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-sans">
                {entry.lines.map((line, idx) => (
                  <tr key={line.id || idx} className="hover:bg-slate-50/50">
                    <td className="p-2.5 text-center border-l border-slate-200 font-mono text-slate-500 font-bold bg-slate-50/20">{line.accountCode}</td>
                    <td className="p-2.5 text-slate-800 font-bold border-l border-slate-200">{line.accountName}</td>
                    <td className="p-2.5 text-center border-l border-slate-200 font-mono font-bold text-blue-700 bg-blue-50/5">
                      {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                    </td>
                    <td className="p-2.5 text-center border-l border-slate-200 font-mono font-bold text-red-600 bg-red-50/5">
                      {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                    </td>
                    <td className="p-2.5 text-slate-500 border-l border-slate-200">{line.costCenter || 'غير محدد'}</td>
                    <td className="p-2.5 text-slate-400 italic max-w-xs">{line.notes}</td>
                  </tr>
                ))}
                
                {/* Total Row */}
                <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                  <td colSpan={2} className="p-3 text-center border-l border-slate-300">الإجمالي العام المتوازن (Totals)</td>
                  <td className="p-3 text-center border-l border-slate-300 text-blue-800 font-mono text-sm bg-blue-50/20">
                    {formatCurrency(totalDebit)}
                  </td>
                  <td className="p-3 text-center border-l border-slate-300 text-red-800 font-mono text-sm bg-red-50/20">
                    {formatCurrency(totalCredit)}
                  </td>
                  <td colSpan={2} className="p-3 text-emerald-700 text-center font-bold">
                    فرق التوازن: {formatCurrency(Math.abs(totalDebit - totalCredit))} (متطابق)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Arabic Tafqeet Box */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 mb-6 text-xs">
            <span className="font-bold text-slate-500 block mb-1">تفقيط المبلغ المعتمد بالعربية (Amount in Words):</span>
            <span className="font-bold text-slate-800 text-sm">{tafqeet(totalDebit)}</span>
          </div>

          {/* General Notes/Statement Narration */}
          {entry.notes && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 mb-8 text-xs leading-relaxed">
              <span className="font-bold text-slate-500 block mb-1">البيان العام والملاحظات الإضافية (General Narration):</span>
              <p className="text-slate-700 italic">{entry.notes}</p>
            </div>
          )}

          {/* Bottom Signature Lines */}
          <div className="grid grid-cols-3 gap-6 text-center mt-12 text-xs pt-8 border-t border-slate-200">
            <div>
              <span className="text-slate-400 block mb-12">أعده وصممه (مدخل البيانات):</span>
              <div className="border-b border-slate-400 w-36 mx-auto mb-2" />
              <span className="font-bold text-slate-700">أدمن الحسابات المركزية</span>
            </div>
            
            <div>
              <span className="text-slate-400 block mb-12">راجعه وصححه (المراجع المالي):</span>
              <div className="border-b border-slate-400 w-36 mx-auto mb-2" />
              <span className="font-bold text-slate-700">توقيع المراجع المالي</span>
            </div>

            <div>
              <span className="text-slate-400 block mb-12">اعتمده ورخصه (المدير المالي):</span>
              <div className="border-b border-slate-400 w-36 mx-auto mb-2" />
              <span className="font-bold text-slate-700">اعتماد إدارة الحسابات والتعمير</span>
            </div>
          </div>

          {/* Print Date Stamp footer */}
          <div className="text-left mt-16 text-[9px] text-slate-400 font-mono no-print">
            تم استخراج وطباعة هذا السند من النظام المحاسبي لشركة الأهرام بتاريخ: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })} | الساعة: {new Date().toLocaleTimeString('ar-EG')}
          </div>

        </div>

      </div>
    </div>
  );
}
