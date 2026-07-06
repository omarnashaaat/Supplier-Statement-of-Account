import React, { useState } from 'react';
import { 
  X, Search, Check, Folder, HelpCircle, ShieldAlert, Layers, 
  Percent, Truck, ClipboardList, Wallet, Landmark, Plus, 
  Printer, Download, ArrowLeft, Send, ArrowRight, User, FileText 
} from 'lucide-react';
import { chartOfAccounts, costCenters, branches, formatCurrency, tafqeet, generateId } from '../data';
import { JournalEntry, JournalLine, SavedJournal } from '../types';

interface DepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  department: 'accounts' | 'banks' | 'suppliers' | 'customers' | 'assets' | 'taxes' | 'lcs' | 'warehouses' | 'approvals';
  activeEntry?: JournalEntry;
  savedJournals?: SavedJournal[];
  setSavedJournals?: React.Dispatch<React.SetStateAction<SavedJournal[]>>;
}

export default function DepartmentModal({ 
  isOpen, 
  onClose, 
  department,
  activeEntry,
  savedJournals = [],
  setSavedJournals 
}: DepartmentModalProps) {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState('');

  // --- Suppliers Dynamic Management States ---
  const [selectedSupplierCode, setSelectedSupplierCode] = useState<string | null>(null);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentSource, setPaymentSource] = useState('1101');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  const getDepartmentTitle = () => {
    switch (department) {
      case 'accounts': return 'دليل الحسابات الشامل (Chart of Accounts)';
      case 'banks': return 'الحسابات البنكية والنقدية النشطة';
      case 'suppliers': return 'سجل الموردين ومستحقاتهم وتفاصيل الحساب';
      case 'customers': return 'سجل العملاء ودفعات الحجز والتعاقد';
      case 'assets': return 'سجل الأصول الثابتة وإهلاك آلات الموقع';
      case 'taxes': return 'إدارة الضرائب والمقررات الضريبية والنسب';
      case 'lcs': return 'الاعتمادات المستندية وعقود الاستيراد';
      case 'warehouses': return 'إدارة المخازن المركزية وكميات البناء';
      case 'approvals': return 'سير العمل والاعتمادات المحاسبية المنظمة';
    }
  };

  // --- Suppliers Static Data with opening balances ---
  const suppliers = [
    { code: '2101', name: 'شركة السويس للأسمنت', type: 'أسمنت ومواد بناء جافة', phone: '02-3304192', initialBalance: 0, status: 'مستحق الدفع' },
    { code: '2102', name: 'شركة حديد عز الدخيلة', type: 'حديد تسليح عالي المقاومة', phone: '19088', initialBalance: 3200000, status: 'مؤجل بالاتفاق' },
    { code: '2103', name: 'سعد الدين للمقاولات العمومية', type: 'مقاول باطن - أعمال حفر وبناء', phone: '011-2234051', initialBalance: 650000, status: 'تحت المراجعة الفنية' },
    { code: '2104', name: 'أولاد فوزي للرمل والزلط', type: 'رمل زرد ومواد ركام ومحاجر', phone: '010-9948522', initialBalance: 45000, status: 'مستحق الدفع' }
  ];

  // Helper to extract transactions for a supplier
  const getSupplierTransactions = (code: string) => {
    const txs: { date: string; entryNo: string; notes: string; debit: number; credit: number }[] = [];
    
    // Aggregate from both current workspace (if savedJournals is empty or as an active) and all saved ones
    const allEntries = [...savedJournals.map(sj => sj.entry)];
    
    if (activeEntry) {
      const exists = allEntries.some(e => e.entryNo === activeEntry.entryNo);
      if (!exists) {
        allEntries.push(activeEntry);
      }
    }

    allEntries.forEach(entry => {
      entry.lines.forEach(line => {
        if (line.accountCode === code) {
          txs.push({
            date: entry.date,
            entryNo: entry.entryNo,
            notes: line.notes || entry.notes || 'توريدات وتسويات',
            debit: Number(line.debit) || 0,
            credit: Number(line.credit) || 0,
          });
        }
      });
    });

    // Sort ascending by date
    return txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Helper to calculate total dynamic balance
  const calculateSupplierBalance = (sup: typeof suppliers[0]) => {
    const txs = getSupplierTransactions(sup.code);
    const totalDebits = txs.reduce((sum, t) => sum + t.debit, 0);
    const totalCredits = txs.reduce((sum, t) => sum + t.credit, 0);
    return sup.initialBalance + totalCredits - totalDebits;
  };

  // Handle Recording of Advance Payment
  const handleAddAdvancePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      alert('الرجاء إدخال مبلغ دفع صالح أكبر من الصفر');
      return;
    }

    const supplier = suppliers.find(s => s.code === selectedSupplierCode);
    if (!supplier || !setSavedJournals) return;

    const sourceAccountName = chartOfAccounts.find(a => a.code === paymentSource)?.name || 'الخزينة الرئيسية';
    const notes = paymentNotes || `سداد دفعة تحت الحساب للمورد ${supplier.name} - خصماً من ${sourceAccountName}`;

    // Create a real double-entry balanced transaction
    const newEntryNo = `JV-PAY-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEntry: JournalEntry = {
      id: generateId(),
      entryNo: newEntryNo,
      date: paymentDate,
      currency: 'EGP',
      notes: notes,
      status: 'approved',
      attachments: [],
      lines: [
        {
          id: generateId(),
          debit: Number(paymentAmount),
          credit: 0,
          accountCode: supplier.code,
          accountName: `الموردين - ${supplier.name}`,
          costCenter: 'الفرع الرئيسي - الإدارة العامة للشركة',
          branch: 'فرع القاهرة الكبرى',
          notes: notes,
          isApproved: true,
        },
        {
          id: generateId(),
          debit: 0,
          credit: Number(paymentAmount),
          accountCode: paymentSource,
          accountName: sourceAccountName,
          costCenter: 'الفرع الرئيسي - الإدارة العامة للشركة',
          branch: 'فرع القاهرة الكبرى',
          notes: `صرف دفعة للمورد ${supplier.name} بموجب مستند صرف رقم ${newEntryNo}`,
          isApproved: true,
        }
      ]
    };

    const newSavedJournal: SavedJournal = {
      id: generateId(),
      name: `دفعة تحت الحساب - ${supplier.name}`,
      updatedAt: new Date().toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      entry: newEntry
    };

    setSavedJournals(prev => [newSavedJournal, ...prev]);

    // Reset payment states
    setPaymentAmount('');
    setPaymentNotes('');
    setIsAddingPayment(false);
  };

  // Export Detailed Statement to CSV
  const exportStatementToCSV = (supplier: typeof suppliers[0], ledgerLines: any[]) => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // UTF-8 BOM
    csvContent += `كشف حساب تفصيلي للمورد: ,${supplier.name}\n`;
    csvContent += `كود الحساب: ,${supplier.code}\n`;
    csvContent += `التاريخ: ,${new Date().toLocaleDateString('ar-EG')}\n\n`;
    csvContent += "التاريخ,رقم القيد / المستند,البيان التفصيلي,حركة مدينة (سداد / دفعة),حركة دائنة (فاتورة / توريد),الرصيد الجاري المستحق\n";
    
    // Opening balance row
    csvContent += `الرصيد الافتتاحي,,---,,${supplier.initialBalance},${supplier.initialBalance}\n`;

    ledgerLines.forEach(line => {
      csvContent += `${line.date},${line.entryNo},${line.notes},${line.debit},${line.credit},${line.runningBalance}\n`;
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `كشف_حساب_${supplier.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      
      {/* Dynamic CSS Print Overrides to print ONLY the supplier statement when requested */}
      {selectedSupplierCode && (
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-supplier-statement, #printable-supplier-statement * {
              visibility: visible;
            }
            #printable-supplier-statement {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 1.5rem !important;
              margin: 0 !important;
              background: white !important;
              color: black !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}} />
      )}

      <div className={`bg-white rounded-2xl w-full ${selectedSupplierCode ? 'max-w-4xl' : 'max-w-3xl'} shadow-2xl border border-slate-100 flex flex-col max-h-[85vh] no-print`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-800">
              {selectedSupplierCode 
                ? `كشف الحساب التفصيلي للشركة: ${suppliers.find(s => s.code === selectedSupplierCode)?.name}`
                : getDepartmentTitle()
              }
            </h3>
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
          
          {/* SEARCH BAR (for lists, hidden in statement views) */}
          {!selectedSupplierCode && ['accounts', 'suppliers', 'customers', 'assets', 'warehouses'].includes(department) && (
            <div className="relative mb-4">
              <Search className="absolute right-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث بالاسم أو الكود..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          )}

          {/* Accounts Chart View */}
          {department === 'accounts' && (
            <div className="space-y-4">
              <div className="text-[11px] text-slate-400 font-medium mb-2">دليل الحسابات المنظم للشركة طبقاً للنظام المحاسبي المصري الموحد:</div>
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 text-center w-24">كود الحساب</th>
                      <th className="p-2.5">اسم الحساب في الدفتر</th>
                      <th className="p-2.5 text-center w-28">طبيعة الحساب</th>
                      <th className="p-2.5">التبويب المالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {chartOfAccounts
                      .filter(acc => acc.code.includes(searchQuery) || acc.name.includes(searchQuery))
                      .map((acc) => {
                        const isDebit = ['1', '4'].includes(acc.code[0]); // 1 (Assets) and 4 (Expenses) are debit by nature
                        return (
                          <tr key={acc.code} className="hover:bg-slate-50/50">
                            <td className="p-2.5 text-center font-mono font-bold text-slate-500 bg-slate-50/30">{acc.code}</td>
                            <td className="p-2.5 font-bold text-slate-700">{acc.name}</td>
                            <td className="p-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isDebit ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                                {isDebit ? 'مدين بطبيعته' : 'دائن بطبيعته'}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-400">
                              {acc.code.startsWith('1') ? 'أصول وممتلكات' : 
                               acc.code.startsWith('2') ? 'خصوم والتزامات' : 
                               acc.code.startsWith('3') ? 'إيرادات وحقوق ملكية' : 'مصروفات وتكاليف'}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Banks View */}
          {department === 'banks' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-indigo-50 to-white shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Landmark className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-bold text-slate-800 text-xs">البنك الأهلي المصري</h4>
                  </div>
                  <span className="text-[10px] text-slate-400 block mb-1">حساب العمليات رقم: 104-209-1148</span>
                  <span className="text-sm font-black text-slate-900 block font-mono">1,450,000.00 ج.م</span>
                  <span className="inline-block mt-3 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold">الحساب الرئيسي</span>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-blue-50 to-white shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Landmark className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold text-slate-800 text-xs">بنك مصر</h4>
                  </div>
                  <span className="text-[10px] text-slate-400 block mb-1">حساب جاري رقم: 302-115-4081</span>
                  <span className="text-sm font-black text-slate-900 block font-mono">920,000.00 ج.م</span>
                  <span className="inline-block mt-3 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px] font-bold">حساب الاعتمادات</span>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-emerald-50 to-white shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-5 h-5 text-emerald-600" />
                    <h4 className="font-bold text-slate-800 text-xs">الخزينة الرئيسية (الصندوق)</h4>
                  </div>
                  <span className="text-[10px] text-slate-400 block mb-1">خزينة الإدارة المالية المركزية</span>
                  <span className="text-sm font-black text-slate-900 block font-mono">315,400.00 ج.م</span>
                  <span className="inline-block mt-3 px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-[9px] font-bold">سيولة نقدية فورية</span>
                </div>
              </div>

              <div className="mt-6 border border-slate-200 rounded-xl p-4 bg-slate-50">
                <h5 className="font-bold text-slate-700 text-xs mb-2">شروط صرف النقدية بالخزينة:</h5>
                <ul className="list-disc list-inside space-y-1.5 text-slate-500 text-[11px] leading-relaxed">
                  <li>لا يتم صرف أي مبالغ تتجاوز 10,000 ج.م من الصندوق دون تصديق مكتوب من المراجع المالي واعتماد المدير العام.</li>
                  <li>تُسوى عهد المهندسين إسبوعياً بموجب فواتير ضريبية نظامية مدبسة بتقرير المصاريف.</li>
                  <li>تُعامل التحويلات البنكية عبر قنوات البنك الأهلي المصري كخيار دفع رئيسي لشركائنا من موردي المواد الخام.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Suppliers Dynamic List and Subviews */}
          {department === 'suppliers' && (
            <div className="space-y-4">
              
              {/* BACK & SUB-HEADER SWITCHER */}
              {selectedSupplierCode && (
                <div className="flex items-center justify-between border-b pb-4 mb-4">
                  <button 
                    onClick={() => {
                      setSelectedSupplierCode(null);
                      setIsAddingPayment(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>رجوع لقائمة الموردين</span>
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsAddingPayment(!isAddingPayment)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isAddingPayment 
                          ? 'bg-slate-800 text-white hover:bg-slate-700' 
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      <span>{isAddingPayment ? 'عرض كشف الحساب' : 'إضافة دفعة تحت الحساب'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* VIEW 1: ADVANCE PAYMENT UNDER ACCOUNT FORM */}
              {selectedSupplierCode && isAddingPayment && (
                <div className="max-w-xl mx-auto border border-slate-200 rounded-xl p-5 bg-slate-50">
                  <div className="flex items-center gap-2 border-b pb-3 mb-4">
                    <Wallet className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-bold text-slate-800 text-xs">إضافة دفعة مالية تحت الحساب (سداد مقدم)</h4>
                  </div>

                  <form onSubmit={handleAddAdvancePayment} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-500 font-bold mb-1">المورد المستلم للدفعة:</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={suppliers.find(s => s.code === selectedSupplierCode)?.name || ''}
                        className="w-full p-2.5 border border-slate-200 bg-slate-100 rounded-lg font-bold text-slate-700"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">المبلغ المطلوب صرفه (ج.م):</label>
                        <input 
                          type="number" 
                          required
                          min="1"
                          placeholder="مثال: 50000"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-lg font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 font-bold mb-1">طريقة السداد / الحساب الدائن:</label>
                        <select
                          value={paymentSource}
                          onChange={(e) => setPaymentSource(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-lg bg-white"
                        >
                          <option value="1101">الصندوق - النقدية بالخزينة الرئيسية</option>
                          <option value="1102">البنك الأهلي المصري - حساب جاري</option>
                          <option value="1103">بنك مصر - حساب العمليات</option>
                        </select>
                      </div>
                    </div>

                    {/* Live Arabic Tafqeet translation */}
                    {Number(paymentAmount) > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-[10px] text-amber-900 italic font-medium leading-relaxed">
                        <span className="font-bold text-amber-950 block not-italic mb-0.5">التفقيط المالي التلقائي:</span>
                        {tafqeet(Number(paymentAmount))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-500 font-bold mb-1">تاريخ المعاملة والصرف:</label>
                        <input 
                          type="date" 
                          required
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-lg font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 font-bold mb-1">البيان التفصيلي (سند الصرف):</label>
                        <input 
                          type="text" 
                          placeholder="سداد دفعة تحت الحساب بخصوص توريدات المستقبل"
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                          className="w-full p-2.5 border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t flex justify-end">
                      <button
                        type="submit"
                        className="flex items-center gap-1.5 px-6 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-lg shadow-md transition-all"
                      >
                        <Send className="w-4 h-4" />
                        <span>اعتماد وصرف الدفعة المعتمدة</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* VIEW 2: DETAILED STATEMENT VIEW (PRINT-FRIENDLY & LEDGER) */}
              {selectedSupplierCode && !isAddingPayment && (
                <div>
                  {/* Ledger Actions Top bar */}
                  <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border mb-4 text-xs font-bold">
                    <span className="text-slate-500">خيارات مطابقة وتصدير كشف الحساب المالي الموحد:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const activeSup = suppliers.find(s => s.code === selectedSupplierCode);
                          if (activeSup) {
                            const txs = getSupplierTransactions(activeSup.code);
                            let currRun = activeSup.initialBalance;
                            const lines = txs.map(t => {
                              currRun = currRun + t.credit - t.debit;
                              return { ...t, runningBalance: currRun };
                            });
                            exportStatementToCSV(activeSup, lines);
                          }
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تصدير Excel (CSV)</span>
                      </button>

                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-all"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>طباعة كشف حساب A4</span>
                      </button>
                    </div>
                  </div>

                  {/* Printable Area Wrapper */}
                  {(() => {
                    const activeSup = suppliers.find(s => s.code === selectedSupplierCode);
                    if (!activeSup) return null;

                    const txs = getSupplierTransactions(activeSup.code);
                    const totalDebits = txs.reduce((sum, t) => sum + t.debit, 0);
                    const totalCredits = txs.reduce((sum, t) => sum + t.credit, 0);
                    const finalBalance = activeSup.initialBalance + totalCredits - totalDebits;

                    let currentRunning = activeSup.initialBalance;
                    const ledgerLines = txs.map(tx => {
                      currentRunning = currentRunning + tx.credit - tx.debit;
                      return {
                        ...tx,
                        runningBalance: currentRunning
                      };
                    });

                    return (
                      <div id="printable-supplier-statement" className="bg-white p-6 border rounded-2xl shadow-sm text-slate-800">
                        {/* Printable corporate header (visible during print) */}
                        <div className="hidden print:flex justify-between items-start border-b-2 border-slate-300 pb-4 mb-6 text-right">
                          <div>
                            <h1 className="text-lg font-black text-slate-900">شركة الأهرام للمقاولات والتعمير</h1>
                            <p className="text-[10px] text-slate-500 mt-0.5">جمهورية مصر العربية | قسم الحسابات المركزية للموردين</p>
                            <p className="text-[9px] text-slate-400 mt-0.5">تلفون: 02-3304192 | البريد المالي: suppliers@al-ahram.eg</p>
                          </div>
                          
                          <div className="text-center font-sans font-black text-amber-750 border-2 border-amber-600 px-3 py-1 rounded">
                            الأهرام للأعمار
                          </div>
                        </div>

                        {/* Document Title inside printer paper */}
                        <div className="text-center mb-6">
                          <h2 className="text-sm font-black text-slate-800 bg-slate-100 px-4 py-1.5 rounded-lg inline-block border">
                            كشف حساب مورد تفصيلي (Detailed Supplier Statement)
                          </h2>
                          <p className="text-[10px] text-slate-400 mt-1 print:block hidden">مستخرج تلقائياً من نظام دفاتر قيد اليومية العامة الموحدة</p>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-[11px] bg-slate-50 p-4 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-slate-400 block mb-0.5">اسم المورد والشركة:</span>
                            <span className="font-bold text-slate-700">{activeSup.name}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-0.5">كود الحساب المعتمد:</span>
                            <span className="font-bold text-slate-700 font-mono text-xs">{activeSup.code}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-0.5">النوع والتخصص:</span>
                            <span className="font-bold text-indigo-700">{activeSup.type}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-0.5">تاريخ استخراج الكشف:</span>
                            <span className="font-bold text-slate-700 font-mono">
                              {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                          </div>
                        </div>

                        {/* Statement Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
                          <div className="border border-slate-150 p-3 rounded-xl bg-slate-50/50">
                            <span className="text-[10px] text-slate-400 font-bold block mb-1">الرصيد الافتتاحي:</span>
                            <span className="text-xs font-black text-slate-800 font-mono">{formatCurrency(activeSup.initialBalance)}</span>
                          </div>

                          <div className="border border-slate-150 p-3 rounded-xl bg-blue-50/20">
                            <span className="text-[10px] text-blue-500 font-bold block mb-1">إجمالي المدفوعات (المدين):</span>
                            <span className="text-xs font-black text-blue-700 font-mono">{formatCurrency(totalDebits)}</span>
                          </div>

                          <div className="border border-slate-150 p-3 rounded-xl bg-rose-50/20">
                            <span className="text-[10px] text-rose-500 font-bold block mb-1">إجمالي التوريدات (الدائن):</span>
                            <span className="text-xs font-black text-rose-700 font-mono">{formatCurrency(totalCredits)}</span>
                          </div>

                          <div className={`border p-3 rounded-xl ${finalBalance >= 0 ? 'bg-emerald-50/30 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200'}`}>
                            <span className="text-[10px] font-bold block mb-1">الرصيد الجاري المستحق:</span>
                            <span className="text-xs font-black font-mono">{formatCurrency(Math.abs(finalBalance))}</span>
                            <span className="block text-[8px] font-bold mt-0.5">
                              {finalBalance > 0 ? 'رصيد دائن مستحق للمورد (له)' : finalBalance < 0 ? 'رصيد مدين مدفوع مقدماً (دفعة تحت حساب)' : 'حساب مصفى ومطابق'}
                            </span>
                          </div>
                        </div>

                        {/* Detailed Statement Table */}
                        <div className="border rounded-xl overflow-hidden mb-6 text-xs">
                          <table className="w-full text-right">
                            <thead className="bg-slate-100 text-slate-700 font-bold border-b">
                              <tr>
                                <th className="p-2.5">التاريخ</th>
                                <th className="p-2.5 text-center">رقم القيد</th>
                                <th className="p-2.5">البيان التفصيلي للحركة</th>
                                <th className="p-2.5 text-center w-28 bg-blue-50/20">مدين (سداد دفعة)</th>
                                <th className="p-2.5 text-center w-28 bg-rose-50/20">دائن (فاتورة توريد)</th>
                                <th className="p-2.5 text-center w-32 bg-slate-50">الرصيد الجاري</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y font-sans">
                              {/* Opening Balance Ledger row */}
                              <tr className="bg-slate-50/50 italic font-medium">
                                <td className="p-2.5 text-slate-400 font-mono">---</td>
                                <td className="p-2.5 text-center text-slate-400 font-mono">---</td>
                                <td className="p-2.5 text-slate-500">الرصيد الافتتاحي المقيد بسجلات الشركة</td>
                                <td className="p-2.5 text-center text-slate-300">-</td>
                                <td className="p-2.5 text-center text-rose-550 font-mono">{formatCurrency(activeSup.initialBalance)}</td>
                                <td className="p-2.5 text-center font-bold text-slate-600 font-mono">{formatCurrency(activeSup.initialBalance)}</td>
                              </tr>

                              {ledgerLines.length > 0 ? (
                                ledgerLines.map((line, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50/40">
                                    <td className="p-2.5 font-mono text-slate-500">{line.date}</td>
                                    <td className="p-2.5 text-center font-bold text-indigo-600 font-mono">{line.entryNo}</td>
                                    <td className="p-2.5 text-slate-700 font-medium">{line.notes}</td>
                                    <td className="p-2.5 text-center text-blue-600 font-bold font-mono bg-blue-50/5">
                                      {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                                    </td>
                                    <td className="p-2.5 text-center text-red-500 font-bold font-mono bg-red-50/5">
                                      {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                                    </td>
                                    <td className={`p-2.5 text-center font-bold font-mono bg-slate-50/20 ${line.runningBalance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                      {formatCurrency(Math.abs(line.runningBalance))}
                                      <span className="text-[8px] font-bold block">
                                        {line.runningBalance > 0 ? 'دائن للمورد' : line.runningBalance < 0 ? 'دفعة مقدمة' : 'متطابق'}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan={6} className="p-6 text-center text-slate-400">
                                    لا توجد حركات قيود معتمدة مسجلة لهذا المورد حتى تاريخه.
                                  </td>
                                </tr>
                              )}

                              {/* Detailed statement totals */}
                              <tr className="bg-slate-100 font-black text-slate-800 border-t-2">
                                <td colSpan={3} className="p-3 text-center">إجمالي حركة الحساب الجاري ومطابقة الرصيد</td>
                                <td className="p-3 text-center text-blue-700 font-mono">{formatCurrency(totalDebits)}</td>
                                <td className="p-3 text-center text-red-700 font-mono">{formatCurrency(totalCredits)}</td>
                                <td className="p-3 text-center bg-slate-200 text-slate-900 font-mono">
                                  {formatCurrency(Math.abs(finalBalance))}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Signature Boxes (print friendly) */}
                        <div className="hidden print:grid grid-cols-3 gap-6 text-center mt-12 text-[10px] pt-6 border-t">
                          <div>
                            <span className="text-slate-400 block mb-10">إعداد ومطابقة (محاسب الموردين):</span>
                            <div className="border-b w-32 mx-auto mb-1" />
                            <span className="font-bold text-slate-600">أدمن الحسابات</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-10">مراجعة وتصديق (المراجع الداخلي):</span>
                            <div className="border-b w-32 mx-auto mb-1" />
                            <span className="font-bold text-slate-600">توقيع المراجعة والرقابة</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-10">الاعتماد المالي النهائي:</span>
                            <div className="border-b w-32 mx-auto mb-1" />
                            <span className="font-bold text-slate-600">توقيع المدير المالي للشركة</span>
                          </div>
                        </div>

                        {/* Stamp and Print Log info */}
                        <div className="hidden print:flex justify-between items-center mt-12 pt-4 border-t text-[8px] text-slate-400 font-mono">
                          <span>تم استخراج هذه المطابقة آلياً بتاريخ: {new Date().toLocaleDateString('ar-EG')}</span>
                          <span>صفحة 1 من 1</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* VIEW 3: DIRECTORY LIST OF ALL SUPPLIERS (DYNAMIC BALANCES) */}
              {!selectedSupplierCode && (
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-right">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">المورد / كود الحساب</th>
                        <th className="p-2.5">نوع التوريدات والمواد</th>
                        <th className="p-2.5 text-center">الرصيد الدائن المستحق</th>
                        <th className="p-2.5">رقم الاتصال</th>
                        <th className="p-2.5">حالة المطابقة</th>
                        <th className="p-2.5 text-center w-56">العمليات والتقارير</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {suppliers
                        .filter(sup => sup.name.includes(searchQuery) || sup.type.includes(searchQuery) || sup.code.includes(searchQuery))
                        .map((sup, idx) => {
                          const currentBalance = calculateSupplierBalance(sup);
                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5">
                                <span className="font-bold text-slate-700 block">{sup.name}</span>
                                <span className="text-[10px] text-slate-400 font-mono block mt-0.5">كود: {sup.code}</span>
                              </td>
                              <td className="p-2.5 text-slate-500">{sup.type}</td>
                              <td className={`p-2.5 text-center font-mono font-bold ${currentBalance > 0 ? 'text-rose-600 bg-red-50/10' : currentBalance < 0 ? 'text-emerald-600 bg-emerald-50/10' : 'text-slate-500'}`}>
                                {formatCurrency(Math.abs(currentBalance))}
                                <span className="block text-[8px] font-bold text-slate-400 mt-0.5">
                                  {currentBalance > 0 ? 'رصيد دائن مستحق' : currentBalance < 0 ? 'مدفوع مقدماً (له)' : 'مطابق ومصفى'}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-400 font-mono">{sup.phone}</td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  currentBalance > 0 ? 'bg-orange-55 text-orange-700' :
                                  currentBalance < 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {currentBalance > 0 ? 'مستحق السداد' : currentBalance < 0 ? 'دفعة مقدمة تحت الحساب' : 'مطابق تماماً'}
                                </span>
                              </td>
                              <td className="p-2.5 text-center">
                                <div className="flex justify-center gap-1.5 font-bold">
                                  <button
                                    onClick={() => {
                                      setSelectedSupplierCode(sup.code);
                                      setIsAddingPayment(false);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-all"
                                    title="عرض كشف الحساب بالتفاصيل"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>كشف حساب تفصيلي</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedSupplierCode(sup.code);
                                      setIsAddingPayment(true);
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-all"
                                    title="إضافة دفعة تحت الحساب للمورد"
                                  >
                                    <Wallet className="w-3.5 h-3.5" />
                                    <span>دفعة تحت الحساب</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

          {/* Customers list */}
          {department === 'customers' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">اسم العميل / الجهة المالكة</th>
                      <th className="p-2.5">المشروع القائم</th>
                      <th className="p-2.5 text-center">إجمالي قيمة التعاقد</th>
                      <th className="p-2.5 text-center">المستخلصات المعتمدة</th>
                      <th className="p-2.5">الرصيد المدين المتبقي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { name: 'شركة بالم هيلز للتطوير العقاري', project: 'مشروع كمبوند بادية - أكتوبر', contract: '12,000,000 ج.م', approval: '85%', balance: '1,800,000 ج.م' },
                      { name: 'أوراسكوم للإنشاءات المحدودة', project: 'مشروع نفق أحمد حمدي 2', contract: '45,000,000 ج.م', approval: '92%', balance: '3,600,000 ج.م' },
                      { name: 'مجموعة طلعت مصطفى القابضة', project: 'مشروع العاصمة الإدارية - سيليا', contract: '28,500,000 ج.م', approval: '78%', balance: '6,270,000 ج.م' }
                    ]
                      .filter(cust => cust.name.includes(searchQuery) || cust.project.includes(searchQuery))
                      .map((cust, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-700">{cust.name}</td>
                          <td className="p-2.5 text-indigo-600 font-medium">{cust.project}</td>
                          <td className="p-2.5 text-center font-mono text-slate-600">{cust.contract}</td>
                          <td className="p-2.5 text-center">
                            <div className="flex items-center gap-1.5 justify-center">
                              <span className="font-mono font-bold text-slate-700">{cust.approval}</span>
                              <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full" style={{ width: cust.approval }} />
                              </div>
                            </div>
                          </td>
                          <td className="p-2.5 font-mono font-bold text-emerald-600 bg-emerald-50/20 text-center">{cust.balance}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Fixed Assets list */}
          {department === 'assets' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">الأصل الثابت / الآلة</th>
                      <th className="p-2.5">تاريخ الشراء</th>
                      <th className="p-2.5 text-center">تكلفة الشراء الأصلية</th>
                      <th className="p-2.5 text-center">مجمع الإهلاك المتراكم</th>
                      <th className="p-2.5">الموقع الحالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {[
                      { name: 'سيارة نقل ثقيل مرسيدس اكتروس', date: '2024-03-12', cost: '4,500,000 ج.م', depr: '900,000 ج.م', location: 'مشروع أبراج العلمين' },
                      { name: 'لودر كاتر بيلر 966H ثقيل', date: '2023-01-15', cost: '3,800,000 ج.م', depr: '1,140,000 ج.م', location: 'موقع العاصمة الإدارية' },
                      { name: 'خلاطة خرسانية مركزية 120م3', date: '2024-06-01', cost: '6,200,000 ج.م', depr: '310,000 ج.م', location: 'ورشة المعدات المركزية' }
                    ]
                      .filter(ast => ast.name.includes(searchQuery) || ast.location.includes(searchQuery))
                      .map((ast, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-700 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>{ast.name}</span>
                          </td>
                          <td className="p-2.5 text-slate-400 font-mono">{ast.date}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-slate-600">{ast.cost}</td>
                          <td className="p-2.5 text-center font-mono text-rose-500">{ast.depr}</td>
                          <td className="p-2.5 text-slate-500 font-medium">{ast.location}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Taxes View */}
          {department === 'taxes' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-700 text-xs">ضريبة القيمة المضافة</span>
                    <Percent className="w-4 h-4 text-indigo-500" />
                  </div>
                  <span className="text-xl font-black text-indigo-700 block mb-1">14 %</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">تُضاف على الفواتير الصادرة للعملاء وتستحق لمصلحة الضرائب المصرية إسبوعياً أو شهرياً طبقاً للمقرر.</p>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-700 text-xs">ضريبة الأرباح التجارية</span>
                    <Percent className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-xl font-black text-emerald-700 block mb-1">1 %</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">تُخصم من المنبع تحت حساب الضريبة على فواتير الموردين ومقاولي الباطن التي تزيد قيمتها عن 300 جنيه.</p>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-700 text-xs">ضريبة كسب العمل</span>
                    <Percent className="w-4 h-4 text-rose-500" />
                  </div>
                  <span className="text-xl font-black text-rose-700 block mb-1">شرائح تصاعدية</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed">تُستقطع شهرياً من رواتب الموظفين والمهندسين والعمال وتورد للمأمورية المختصة وفقاً لقانون الدخل المصري.</p>
                </div>
              </div>

              <div className="mt-4 border border-slate-200 rounded-xl p-4 bg-yellow-50/50 border-yellow-200 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-yellow-800 leading-relaxed">
                  <span className="font-bold block mb-1">تنبيه الموقف الضريبي للمنشأة:</span>
                  معدل الالتزام الضريبي لعام 2026 ممتاز. يرجى دائماً إرفاق الفواتير الإلكترونية الضريبية الموثقة بـ QR Code لضمان أحقية المنشأة في خصم واسترداد ضريبة المدخلات بشكل قانوني سليم.
                </div>
              </div>
            </div>
          )}

          {/* LCs View */}
          {department === 'lcs' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                  <span className="font-bold text-slate-700 text-xs">اعتماد مستندي رقم LC-9042 - بنك مصر</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-400 block">المورد الأجنبي:</span>
                    <span className="font-bold text-slate-800">SANY Heavy Machinery (الصين)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">القيمة الإجمالية:</span>
                    <span className="font-bold text-indigo-700 font-mono">240,000 USD</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">البضاعة المشحونة:</span>
                    <span className="font-bold text-slate-800">حفارات ومعدات دق خوازيق</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">تاريخ انتهاء الشحن:</span>
                    <span className="font-bold text-slate-800 font-mono">2026-08-15</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-[11px] text-slate-400 font-medium">
                لا توجد اعتمادات مستندية أخرى نشطة في الوقت الحالي. لفتح اعتماد مستندي جديد، يرجى التنسيق مع إدارة البنوك والاعتمادات بالشركة الأم.
              </div>
            </div>
          )}

          {/* Warehouses list */}
          {department === 'warehouses' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">اسم المستودع / المخزن</th>
                      <th className="p-2.5">المادة المخزنة</th>
                      <th className="p-2.5 text-center">الرصيد الفعلي الحالي</th>
                      <th className="p-2.5 text-center">سعة المخزن الكلية</th>
                      <th className="p-2.5">أمين المخزن المسئول</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {[
                      { name: 'مخزن رصيف أبراج العلمين', material: 'أسمنت مقاوم للأملاح والخرسانة', qty: '420 طن', max: '1,000 طن', keeper: 'أ. جابر عبد الرحيم' },
                      { name: 'مستودع السويس المركزي', material: 'حديد تسليح مقاس 12, 16 مم', qty: '80 طن', max: '250 طن', keeper: 'المهندس مصطفى كامل' },
                      { name: 'موقع ذا كورد - ساحة الرمل والسن', material: 'رمل ناعم وزلط ومواد ركام', qty: '1,200 م3', max: '2,000 م3', keeper: 'أ. محمود أبو اليزيد' }
                    ]
                      .filter(wh => wh.name.includes(searchQuery) || wh.material.includes(searchQuery))
                      .map((wh, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-bold text-slate-700">{wh.name}</td>
                          <td className="p-2.5 text-slate-500">{wh.material}</td>
                          <td className="p-2.5 text-center font-mono font-bold text-slate-800 bg-slate-50">{wh.qty}</td>
                          <td className="p-2.5 text-center font-mono text-slate-400">{wh.max}</td>
                          <td className="p-2.5 text-slate-500">{wh.keeper}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Approvals view */}
          {department === 'approvals' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 text-xs leading-relaxed space-y-4">
                <h4 className="font-bold text-slate-800 flex items-center gap-1 border-b pb-2">
                  <ClipboardList className="w-4.5 h-4.5 text-indigo-600" />
                  <span>دورة اعتماد وترحيل قيود اليومية بالشركة:</span>
                </h4>
                
                <div className="relative border-r-2 border-indigo-200 pr-5 mr-3 space-y-6">
                  <div className="relative">
                    <div className="absolute -right-[27px] top-0 w-3 h-3 bg-indigo-600 rounded-full border-2 border-white" />
                    <span className="font-bold text-indigo-700 block text-[11px]">المرحلة الأولى: إعداد القيد وتدقيق التوازن</span>
                    <p className="text-slate-500 mt-1">يقوم مدخل البيانات (أدمن الحسابات) بتركيب القيد المحاسبي والتأكد لحظياً من تساؤل إجمالي المدين مع إجمالي الدائن (فرق التوازن = 0.00 ج.م).</p>
                  </div>

                  <div className="relative">
                    <div className="absolute -right-[27px] top-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                    <span className="font-bold text-blue-700 block text-[11px]">المرحلة الثانية: المراجعة المالية والمطابقة</span>
                    <p className="text-slate-500 mt-1">يقوم المراجع المالي بفحص الحسابات المدينة والدائنة المدخلة ومراكز التكلفة ومراجعة المرفقات الإلكترونية كالفواتير الضريبية وسندات الصرف.</p>
                  </div>

                  <div className="relative">
                    <div className="absolute -right-[27px] top-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                    <span className="font-bold text-emerald-700 block text-[11px]">المرحلة الثالثة: الاعتماد النهائي والترحيل التلقائي</span>
                    <p className="text-slate-500 mt-1">يقوم رئيس الحسابات أو المدير المالي بترحيل القيد (Status: Posted)، وبذلك يتم إدراج الأرصدة تلقائياً في ميزان المراجعة ودفتر الأستاذ والتقارير المالية النهائية.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 text-xs font-bold rounded-lg transition-all"
          >
            <span>أغلق النافذة</span>
          </button>
        </div>

      </div>
    </div>
  );
}
