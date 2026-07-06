import React from 'react';
import { X, Printer, Download, FileSpreadsheet, FileText, CheckCircle2 } from 'lucide-react';
import { JournalEntry, SavedJournal } from '../types';
import { formatCurrency } from '../data';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'journal' | 'ledger' | 'trial' | 'income' | 'balance' | 'cashflow';
  activeEntry: JournalEntry;
  savedJournals: SavedJournal[];
}

export default function ReportModal({ isOpen, onClose, reportType, activeEntry, savedJournals }: ReportModalProps) {
  if (!isOpen) return null;

  // Combine all entries to generate dynamic report numbers
  const allEntries = [activeEntry, ...savedJournals.map(j => j.entry)];

  // Helper to get title in Arabic
  const getReportTitle = () => {
    switch (reportType) {
      case 'journal': return 'تقرير قيود اليومية التفصيلي';
      case 'ledger': return 'تقرير دفتر الأستاذ العام';
      case 'trial': return 'تقرير ميزان المراجعة والأرصدة';
      case 'income': return 'تقرير قائمة الدخل (الأرباح والخسائر التقديرية)';
      case 'balance': return 'تقرير الميزانية العمومية (المركز المالي)';
      case 'cashflow': return 'تقرير قائمة التدفقات النقدية';
    }
  };

  // Generate accounts summary for ledger and trial balance
  const accountBalances: { [code: string]: { name: string; debit: number; credit: number } } = {};
  allEntries.forEach(entry => {
    entry.lines.forEach(line => {
      const code = line.accountCode || 'غير محدد';
      const name = line.accountName || 'حساب غير مسمى';
      if (!accountBalances[code]) {
        accountBalances[code] = { name, debit: 0, credit: 0 };
      }
      accountBalances[code].debit += Number(line.debit) || 0;
      accountBalances[code].credit += Number(line.credit) || 0;
    });
  });

  const trialBalanceItems = Object.keys(accountBalances).map(code => {
    const item = accountBalances[code];
    const balance = item.debit - item.credit;
    return {
      code,
      name: item.name,
      debit: item.debit,
      credit: item.credit,
      balanceDebit: balance > 0 ? balance : 0,
      balanceCredit: balance < 0 ? Math.abs(balance) : 0,
    };
  });

  // Calculate totals for Trial Balance
  const totalDebits = trialBalanceItems.reduce((sum, item) => sum + item.debit, 0);
  const totalCredits = trialBalanceItems.reduce((sum, item) => sum + item.credit, 0);
  const totalBalDebits = trialBalanceItems.reduce((sum, item) => sum + item.balanceDebit, 0);
  const totalBalCredits = trialBalanceItems.reduce((sum, item) => sum + item.balanceCredit, 0);

  // Download simple CSV
  const downloadCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // UTF-8 BOM
    csvContent += "الكود,اسم الحساب,مدين,دائن,الرصيد مدين,الرصيد دائن\n";
    trialBalanceItems.forEach(item => {
      csvContent += `${item.code},${item.name},${item.debit},${item.credit},${item.balanceDebit},${item.balanceCredit}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${getReportTitle()}_2026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
            <h3 className="text-base font-bold text-slate-800">{getReportTitle()}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* Top meta */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-slate-50 p-4 rounded-xl text-xs border border-slate-100">
            <div>
              <span className="text-slate-400 block mb-0.5">الجهة المالية:</span>
              <span className="font-bold text-slate-700">شركة الأهرام للمقاولات - الإدارة المركزية</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">الدولة:</span>
              <span className="font-bold text-slate-700">جمهورية مصر العربية</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">الفترة المحاسبية:</span>
              <span className="font-bold text-emerald-600">الفترة الفعلية - الربع الثاني 2026</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">حالة التحديث:</span>
              <span className="font-bold text-blue-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 inline" />
                <span>محدث لحظياً بالقيود</span>
              </span>
            </div>
          </div>

          {/* Render Specific Report Types */}
          {reportType === 'journal' && (
            <div className="space-y-6">
              {allEntries.map((entry, idx) => (
                <div key={entry.id || idx} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-slate-100 p-3 flex justify-between items-center text-xs border-b border-slate-200">
                    <span className="font-bold text-indigo-700">رقم القيد: {entry.entryNo}</span>
                    <span className="text-slate-500">التاريخ: {entry.date}</span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      {entry.status === 'approved' || entry.status === 'posted' ? 'معتمد ومرحل' : 'متوازن'}
                    </span>
                  </div>
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">الكود</th>
                        <th className="p-2.5">الحساب</th>
                        <th className="p-2.5">المدين</th>
                        <th className="p-2.5">الدائن</th>
                        <th className="p-2.5">مركز التكلفة</th>
                        <th className="p-2.5">البيان</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {entry.lines.map((line, lIdx) => (
                        <tr key={line.id || lIdx} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-mono text-slate-500">{line.accountCode}</td>
                          <td className="p-2.5 font-bold text-slate-700">{line.accountName}</td>
                          <td className="p-2.5 text-blue-600 font-bold">{line.debit > 0 ? formatCurrency(line.debit) : '-'}</td>
                          <td className="p-2.5 text-red-500 font-bold">{line.credit > 0 ? formatCurrency(line.credit) : '-'}</td>
                          <td className="p-2.5 text-slate-500">{line.costCenter || 'غير محدد'}</td>
                          <td className="p-2.5 text-slate-400 italic max-w-xs truncate">{line.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {reportType === 'trial' && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th rowSpan={2} className="p-3 border-l border-slate-200 text-center">كود الحساب</th>
                    <th rowSpan={2} className="p-3 border-l border-slate-200">اسم الحساب</th>
                    <th colSpan={2} className="p-2 border-b border-l border-slate-200 text-center bg-slate-50">الحركة الإجمالية</th>
                    <th colSpan={2} className="p-2 text-center bg-slate-50">الأرصدة النهائية</th>
                  </tr>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-2 text-blue-600 text-center border-l border-slate-200">مدين ج.م</th>
                    <th className="p-2 text-red-500 text-center border-l border-slate-200">دائن ج.م</th>
                    <th className="p-2 text-blue-700 text-center border-l border-slate-200">مدين ج.م</th>
                    <th className="p-2 text-red-700 text-center">دائن ج.م</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trialBalanceItems.map((item) => (
                    <tr key={item.code} className="hover:bg-slate-50">
                      <td className="p-2.5 border-l border-slate-100 font-mono font-bold text-center text-slate-500">{item.code}</td>
                      <td className="p-2.5 border-l border-slate-100 font-bold text-slate-700">{item.name}</td>
                      <td className="p-2.5 border-l border-slate-100 text-blue-600 font-mono text-center">{item.debit > 0 ? formatCurrency(item.debit) : '0.00'}</td>
                      <td className="p-2.5 border-l border-slate-100 text-red-500 font-mono text-center">{item.credit > 0 ? formatCurrency(item.credit) : '0.00'}</td>
                      <td className="p-2.5 border-l border-slate-100 text-blue-800 font-bold font-mono text-center bg-emerald-50/20">{item.balanceDebit > 0 ? formatCurrency(item.balanceDebit) : '0.00'}</td>
                      <td className="p-2.5 text-red-800 font-bold font-mono text-center bg-red-50/20">{item.balanceCredit > 0 ? formatCurrency(item.balanceCredit) : '0.00'}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
                    <td colSpan={2} className="p-3 text-center border-l border-slate-200">إجمالي ميزان المراجعة والأرصدة</td>
                    <td className="p-3 text-blue-600 font-mono text-center border-l border-slate-200">{formatCurrency(totalDebits)}</td>
                    <td className="p-3 text-red-500 font-mono text-center border-l border-slate-200">{formatCurrency(totalCredits)}</td>
                    <td className="p-3 text-blue-800 font-mono text-center border-l border-slate-200 bg-emerald-50/40">{formatCurrency(totalBalDebits)}</td>
                    <td className="p-3 text-red-800 font-mono text-center bg-red-50/40">{formatCurrency(totalBalCredits)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'ledger' && (
            <div className="space-y-6">
              {Object.keys(accountBalances).map(code => {
                const info = accountBalances[code];
                const linesMatching = allEntries.flatMap(e => 
                  e.lines.filter(l => l.accountCode === code).map(l => ({ ...l, entryNo: e.entryNo, date: e.date }))
                );
                let runningBalance = 0;

                return (
                  <div key={code} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-100 p-3 flex justify-between items-center text-xs font-bold border-b border-slate-200">
                      <span className="text-indigo-700">حساب الأستاذ: {code} - {info.name}</span>
                      <span className="text-slate-600">إجمالي الأرصدة: مدين {formatCurrency(info.debit)} | دائن {formatCurrency(info.credit)}</span>
                    </div>
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="p-2">التاريخ</th>
                          <th className="p-2">رقم القيد</th>
                          <th className="p-2 text-center">مدين</th>
                          <th className="p-2 text-center">دائن</th>
                          <th className="p-2 text-center">الرصيد الجاري</th>
                          <th className="p-2">البيان</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {linesMatching.map((l, lIdx) => {
                          runningBalance += (l.debit - l.credit);
                          return (
                            <tr key={lIdx} className="hover:bg-slate-50/50">
                              <td className="p-2 font-sans text-slate-500">{l.date}</td>
                              <td className="p-2 font-bold text-indigo-600">{l.entryNo}</td>
                              <td className="p-2 text-center text-blue-600 font-bold">{l.debit > 0 ? formatCurrency(l.debit) : '-'}</td>
                              <td className="p-2 text-center text-red-500 font-bold">{l.credit > 0 ? formatCurrency(l.credit) : '-'}</td>
                              <td className={`p-2 text-center font-bold ${runningBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                {formatCurrency(runningBalance)}
                              </td>
                              <td className="p-2 font-sans text-slate-500">{l.notes}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}

          {reportType === 'income' && (
            <div className="border border-slate-200 rounded-xl overflow-hidden max-w-2xl mx-auto p-4 bg-slate-50">
              <h4 className="text-center font-bold text-slate-800 text-sm mb-4 border-b border-slate-200 pb-2">قائمة الدخل التقديرية - الربع الثاني لعام 2026</h4>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-200 font-bold text-emerald-800 bg-emerald-50 px-2 rounded">
                  <span>إيرادات النشاط والمقاولات (كود 3100)</span>
                  <span>{formatCurrency(allEntries.flatMap(e => e.lines).filter(l => l.accountCode.startsWith('3')).reduce((sum, l) => sum + l.credit - l.debit, 0))}</span>
                </div>
                <div className="flex justify-between items-center py-2 px-2 text-slate-600">
                  <span>يخصم: تكاليف النشاط ومواد البناء (كود 4100)</span>
                  <span>{formatCurrency(allEntries.flatMap(e => e.lines).filter(l => l.accountCode.startsWith('41')).reduce((sum, l) => sum + l.debit - l.credit, 0))}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-200 px-2 text-slate-600">
                  <span>يخصم: مصروفات عمومية وإدارية (كود 4200)</span>
                  <span>{formatCurrency(allEntries.flatMap(e => e.lines).filter(l => l.accountCode.startsWith('42')).reduce((sum, l) => sum + l.debit - l.credit, 0))}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-t-2 border-slate-300 font-bold text-sm text-slate-800 bg-slate-100 px-2 rounded">
                  <span>صافي الأرباح النشاط (قبل الضريبة)</span>
                  <span>
                    {(() => {
                      const rev = allEntries.flatMap(e => e.lines).filter(l => l.accountCode.startsWith('3')).reduce((sum, l) => sum + l.credit - l.debit, 0);
                      const cost = allEntries.flatMap(e => e.lines).filter(l => l.accountCode.startsWith('4')).reduce((sum, l) => sum + l.debit - l.credit, 0);
                      return formatCurrency(rev - cost);
                    })()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {reportType === 'balance' && (
            <div className="border border-slate-200 rounded-xl overflow-hidden max-w-2xl mx-auto p-4 bg-slate-50">
              <h4 className="text-center font-bold text-slate-800 text-sm mb-4 border-b border-slate-200 pb-2">الميزانية العمومية والمركز المالي - يونيو 2026</h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="border border-slate-200 p-3 rounded-lg bg-white">
                  <h5 className="font-bold text-blue-800 mb-2 border-b pb-1">الأصول (Assets)</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>الأصول المتداولة والنقدية</span>
                      <span className="font-bold font-mono">
                        {formatCurrency(allEntries.flatMap(e => e.lines).filter(l => l.accountCode.startsWith('11') || l.accountCode.startsWith('12') || l.accountCode.startsWith('13') || l.accountCode.startsWith('14')).reduce((sum, l) => sum + l.debit - l.credit, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>الأصول الثابتة والآلات</span>
                      <span className="font-bold font-mono">
                        {formatCurrency(allEntries.flatMap(e => e.lines).filter(l => l.accountCode.startsWith('15')).reduce((sum, l) => sum + l.debit - l.credit, 0))}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 p-3 rounded-lg bg-white">
                  <h5 className="font-bold text-red-800 mb-2 border-b pb-1">الالتزامات وحقوق الملكية</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>الموردين وأرصدة دائنة</span>
                      <span className="font-bold font-mono">
                        {formatCurrency(allEntries.flatMap(e => e.lines).filter(l => l.accountCode.startsWith('2')).reduce((sum, l) => sum + l.credit - l.debit, 0))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>حقوق الملكية والأرباح المحتجزة</span>
                      <span className="font-bold font-mono">
                        {formatCurrency(allEntries.flatMap(e => e.lines).filter(l => l.accountCode.startsWith('3')).reduce((sum, l) => sum + l.credit - l.debit, 0) - allEntries.flatMap(e => e.lines).filter(l => l.accountCode.startsWith('4')).reduce((sum, l) => sum + l.debit - l.credit, 0))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-center text-[10px] text-slate-400 mt-4 italic">ملاحظة: البيانات تتأثر تلقائياً بأي اعتماد أو تعديل على قيود اليومية لضمان المطابقة الكاملة للمركز المالي.</p>
            </div>
          )}

          {reportType === 'cashflow' && (
            <div className="border border-slate-200 rounded-xl overflow-hidden max-w-2xl mx-auto p-4 bg-slate-50">
              <h4 className="text-center font-bold text-slate-800 text-sm mb-4 border-b border-slate-200 pb-2">قائمة التدفقات النقدية (الخزينة والبنوك)</h4>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-2 font-bold text-slate-700 bg-slate-100 px-2 rounded">
                  <span>رصيد النقدية وما في حكمها - أول الفترة التقديري</span>
                  <span>1,200,000.00 ج.م</span>
                </div>
                <div className="flex justify-between items-center py-1 px-2 text-emerald-700 font-bold">
                  <span>(+) تدفقات نقدية داخلة من التحصيلات والعملاء</span>
                  <span>
                    {formatCurrency(allEntries.flatMap(e => e.lines).filter(l => (l.accountCode.startsWith('11')) && l.debit > 0).reduce((sum, l) => sum + l.debit, 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 px-2 text-rose-700 font-bold">
                  <span>(-) تدفقات نقدية خارجة للموردين والمصروفات والأجور</span>
                  <span>
                    {formatCurrency(allEntries.flatMap(e => e.lines).filter(l => (l.accountCode.startsWith('11')) && l.credit > 0).reduce((sum, l) => sum + l.credit, 0))}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2.5 border-t-2 border-slate-300 font-bold text-sm text-indigo-800 bg-indigo-50 px-2 rounded">
                  <span>رصيد النقدية وما في حكمها - آخر الفترة</span>
                  <span>
                    {(() => {
                      const net = allEntries.flatMap(e => e.lines).filter(l => l.accountCode.startsWith('11')).reduce((sum, l) => sum + l.debit - l.credit, 0);
                      return formatCurrency(1200000 + net);
                    })()}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-between">
          <button 
            onClick={downloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-550 text-indigo-600 hover:bg-indigo-50 text-xs font-bold rounded-lg border border-indigo-200 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير لملف Excel (CSV)</span>
          </button>
          
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-white hover:bg-slate-700 text-xs font-bold rounded-lg transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة التقرير (A4)</span>
          </button>
        </div>

      </div>
    </div>
  );
}
