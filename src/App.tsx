import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Plus, 
  Trash2, 
  Copy, 
  RotateCcw, 
  Sparkles, 
  Download, 
  Upload, 
  Save, 
  Eye, 
  Calendar, 
  Check, 
  Edit3, 
  Layers, 
  User, 
  HelpCircle, 
  FileSpreadsheet, 
  Info, 
  Image as ImageIcon,
  Search,
  ArrowLeftRight,
  X,
  AlertTriangle,
  Moon,
  Sun,
  Clock,
  ExternalLink,
  ChevronRight,
  Database,
  Building,
  Percent
} from 'lucide-react';

import { JournalEntry, JournalLine, SavedJournal, SystemConfig } from './types';
import { 
  generateId, 
  chartOfAccounts, 
  costCenters, 
  branches, 
  currencies, 
  initialJournalEntry, 
  initialSavedJournals, 
  formatCurrency, 
  tafqeet 
} from './data';

// Modular Sub-components
import ReportModal from './components/ReportModal';
import DepartmentModal from './components/DepartmentModal';
import PrintVoucher from './components/PrintVoucher';

export default function App() {
  // --- STATE SYSTEM ---
  const [activeEntry, setActiveEntry] = useState<JournalEntry>(() => {
    const saved = localStorage.getItem('active_journal_entry');
    return saved ? JSON.parse(saved) : initialJournalEntry;
  });

  const [savedJournals, setSavedJournals] = useState<SavedJournal[]>(() => {
    const saved = localStorage.getItem('saved_journals_list');
    return saved ? JSON.parse(saved) : initialSavedJournals;
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('system_dark_mode') === 'true';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');
  
  // Realtime clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Search Filters for Search panel
  const [filterEntryNo, setFilterEntryNo] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterCostCenter, setFilterCostCenter] = useState('');

  // Modals controllers
  const [activeReport, setActiveReport] = useState<'journal' | 'ledger' | 'trial' | 'income' | 'balance' | 'cashflow' | null>(null);
  const [activeDepartment, setActiveDepartment] = useState<'accounts' | 'banks' | 'suppliers' | 'customers' | 'assets' | 'taxes' | 'lcs' | 'warehouses' | 'approvals' | null>(null);
  const [showPrintVoucher, setShowPrintVoucher] = useState(false);

  // Toast System
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // --- PERSISTENCE & TIMERS ---
  useEffect(() => {
    localStorage.setItem('active_journal_entry', JSON.stringify(activeEntry));
  }, [activeEntry]);

  useEffect(() => {
    localStorage.setItem('saved_journals_list', JSON.stringify(savedJournals));
  }, [savedJournals]);

  useEffect(() => {
    localStorage.setItem('system_dark_mode', darkMode.toString());
  }, [darkMode]);

  // Live Clock Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // --- CALCULATIONS ---
  const totalDebit = activeEntry.lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = activeEntry.lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference === 0;

  // --- ACTIONS SYSTEM ---

  // Handle line item cell updates
  const handleUpdateLine = (id: string, field: keyof JournalLine, value: any) => {
    setActiveEntry(prev => {
      const updatedLines = prev.lines.map(line => {
        if (line.id === id) {
          const updated = { ...line, [field]: value };
          // If debit changes to > 0, make credit 0 (standard helper)
          if (field === 'debit' && Number(value) > 0) {
            updated.credit = 0;
          }
          // If credit changes to > 0, make debit 0
          if (field === 'credit' && Number(value) > 0) {
            updated.debit = 0;
          }
          // Autofill accountName when accountCode changes
          if (field === 'accountCode') {
            const matchedAcc = chartOfAccounts.find(a => a.code === value);
            if (matchedAcc) {
              updated.accountName = matchedAcc.name;
            }
          }
          return updated;
        }
        return line;
      });

      // Recalculate status
      const sumD = updatedLines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
      const sumC = updatedLines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
      const balanced = sumD === sumC;

      return {
        ...prev,
        lines: updatedLines,
        status: balanced ? 'balanced' : 'draft'
      };
    });
  };

  // Add new blank row
  const handleAddRow = () => {
    const defaultCode = chartOfAccounts[0].code;
    const defaultName = chartOfAccounts[0].name;
    const newLine: JournalLine = {
      id: generateId(),
      debit: 0,
      credit: 0,
      accountCode: defaultCode,
      accountName: defaultName,
      costCenter: costCenters[0],
      branch: branches[0],
      notes: activeEntry.lines.length > 0 ? activeEntry.lines[activeEntry.lines.length - 1].notes : 'شرح قيد اليومية',
      isApproved: true,
    };

    setActiveEntry(prev => ({
      ...prev,
      lines: [...prev.lines, newLine]
    }));
    showToast('تمت إضافة سطر قيد جديد بنجاح', 'success');
  };

  // Delete line row
  const handleDeleteRow = (id: string) => {
    if (activeEntry.lines.length <= 2) {
      showToast('يجب وجود سطرين محاسبيين على الأقل في قيد اليومية لتصحيح القيد المزدوج', 'error');
      return;
    }
    setActiveEntry(prev => ({
      ...prev,
      lines: prev.lines.filter(l => l.id !== id)
    }));
    showToast('تم حذف السطر بنجاح', 'info');
  };

  // Duplicate line row
  const handleDuplicateRow = (id: string) => {
    const rowToCopy = activeEntry.lines.find(r => r.id === id);
    if (rowToCopy) {
      const newLine: JournalLine = {
        ...rowToCopy,
        id: generateId(),
        isApproved: true,
      };
      const index = activeEntry.lines.findIndex(r => r.id === id);
      const updatedLines = [...activeEntry.lines];
      updatedLines.splice(index + 1, 0, newLine);

      setActiveEntry(prev => ({
        ...prev,
        lines: updatedLines
      }));
      showToast('تم نسخ وتكرار السطر المحاسبي', 'success');
    }
  };

  // Toggle approve single row
  const handleToggleApproveLine = (id: string) => {
    setActiveEntry(prev => ({
      ...prev,
      lines: prev.lines.map(l => {
        if (l.id === id) {
          return { ...l, isApproved: !l.isApproved };
        }
        return l;
      })
    }));
    showToast('تم تعديل حالة اعتماد البند الفرعي', 'info');
  };

  // Clear/Reset current active entry
  const handleResetEntry = () => {
    const blankEntry: JournalEntry = {
      id: 'jv-active',
      entryNo: `JV-2026/00${savedJournals.length + 15}`,
      date: new Date().toISOString().split('T')[0],
      currency: 'EGP',
      notes: '',
      status: 'draft',
      attachments: [],
      lines: [
        {
          id: generateId(),
          debit: 0,
          credit: 0,
          accountCode: chartOfAccounts[0].code,
          accountName: chartOfAccounts[0].name,
          costCenter: costCenters[0],
          branch: branches[0],
          notes: 'شرح القيد - سطر 1',
          isApproved: true,
        },
        {
          id: generateId(),
          debit: 0,
          credit: 0,
          accountCode: chartOfAccounts[1].code,
          accountName: chartOfAccounts[1].name,
          costCenter: costCenters[0],
          branch: branches[0],
          notes: 'شرح القيد - سطر 2',
          isApproved: true,
        }
      ]
    };
    setActiveEntry(blankEntry);
    showToast('تم تفريغ نموذج إدخال القيد وتوليد رقم جديد', 'info');
  };

  // Save current active entry to Saved history list
  const handleSaveJournal = () => {
    if (!isBalanced) {
      showToast('لا يمكن حفظ قيد غير متوازن! إجمالي المدين يجب أن يساوي الدائن.', 'error');
      return;
    }

    const currentNotes = activeEntry.notes || `قيد يومية تسوية رقم ${activeEntry.entryNo}`;
    const matchedIndex = savedJournals.findIndex(sj => sj.entry.entryNo === activeEntry.entryNo);

    if (matchedIndex > -1) {
      // Overwrite/update existing
      const updated = [...savedJournals];
      updated[matchedIndex] = {
        id: updated[matchedIndex].id,
        name: currentNotes.substring(0, 30),
        updatedAt: new Date().toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        entry: { ...activeEntry, status: 'approved' }
      };
      setSavedJournals(updated);
      showToast('تم تحديث القيد المحفوظ بنجاح في السجلات', 'success');
    } else {
      // Save as new
      const newSaved: SavedJournal = {
        id: generateId(),
        name: currentNotes.substring(0, 30) || 'قيد تسوية مواد بناء جديدة',
        updatedAt: new Date().toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        entry: { ...activeEntry, status: 'approved' }
      };
      setSavedJournals([newSaved, ...savedJournals]);
      showToast('تم حفظ واعتماد القيد بنجاح وترحيله للأستاذ', 'success');
    }
  };

  // Load a historic saved entry into active workspace
  const handleSelectSavedJournal = (sj: SavedJournal) => {
    setActiveEntry(sj.entry);
    setActiveTab('editor');
    showToast(`تم تحميل القيد رقم ${sj.entry.entryNo} للمراجعة`, 'success');
  };

  // Delete a historic saved entry
  const handleDeleteSavedJournal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedJournals(prev => prev.filter(sj => sj.id !== id));
    showToast('تم حذف القيد من السجلات المحفوظة', 'info');
  };

  // File picker / attachments upload simulator
  const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file: any) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            const newAttachment = {
              id: 'att-' + generateId(),
              name: file.name,
              url: event.target.result as string,
              size: (file.size / 1024).toFixed(0) + ' KB'
            };
            setActiveEntry(prev => ({
              ...prev,
              attachments: [...prev.attachments, newAttachment]
            }));
          }
        };
        reader.readAsDataURL(file);
      });
      showToast('تم تحميل المرفق المحاسبي بنجاح', 'success');
    }
  };

  // Remove single attachment
  const handleRemoveAttachment = (id: string) => {
    setActiveEntry(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.id !== id)
    }));
    showToast('تم إزالة المرفق', 'info');
  };

  // Simulated Excel Import (loads a balanced demo entry)
  const handleExcelImport = () => {
    const demoLines: JournalLine[] = [
      {
        id: generateId(),
        debit: 85000,
        credit: 0,
        accountCode: '4102',
        accountName: 'تكاليف النشاط - شراء أسمنت وحديد تسليح',
        costCenter: 'مشروع كمبوند بادية - أكتوبر',
        branch: 'فرع الجيزة',
        notes: 'مستورد من إكسل - توريد أسمنت تشطيبات',
        isApproved: true,
      },
      {
        id: generateId(),
        debit: 0,
        credit: 85000,
        accountCode: '2101',
        accountName: 'الموردين - شركة السويس للأسمنت',
        costCenter: 'الفرع الرئيسي - الإدارة العامة للشركة',
        branch: 'فرع القاهرة الكبرى',
        notes: 'مستورد من إكسل - دفعة الأسمنت المورد',
        isApproved: true,
      }
    ];

    setActiveEntry(prev => ({
      ...prev,
      entryNo: 'JV-IMP-' + Math.floor(100 + Math.random() * 900),
      lines: demoLines,
      status: 'balanced',
      notes: 'قيد مستورد بالكامل من كشف إكسل الموردين الخارجي (تمت مطابقته وتوازنه تلقائياً).'
    }));
    showToast('تم استيراد القيد المتوازن بنجاح من ملف Excel وعرضه بالخلايا', 'success');
  };

  // Simulated Excel CSV Export download
  const handleExcelExport = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // UTF-8 BOM
    csvContent += "رقم الحساب,اسم الحساب,مدين,دائن,مركز التكلفة,الفرع,البيان التفصيلي\n";
    activeEntry.lines.forEach(line => {
      csvContent += `${line.accountCode},${line.accountName},${line.debit},${line.credit},${line.costCenter},${line.branch},${line.notes}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `قيد_يومية_${activeEntry.entryNo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير قيد اليومية الحالي بتنسيق Excel بنجاح', 'success');
  };

  // Historical items filtered by search parameters
  const filteredSavedJournals = savedJournals.filter(sj => {
    const matchNo = filterEntryNo ? sj.entry.entryNo.includes(filterEntryNo) : true;
    const matchAcc = filterAccount ? sj.entry.lines.some(l => l.accountName.includes(filterAccount) || l.accountCode.includes(filterAccount)) : true;
    const matchDate = filterDate ? sj.entry.date.includes(filterDate) : true;
    const matchCost = filterCostCenter ? sj.entry.lines.some(l => l.costCenter.includes(filterCostCenter)) : true;
    
    // general top search bar
    const matchGeneral = searchQuery ? (
      sj.entry.entryNo.includes(searchQuery) || 
      sj.entry.notes.includes(searchQuery) ||
      sj.entry.lines.some(l => l.accountName.includes(searchQuery))
    ) : true;

    return matchNo && matchAcc && matchDate && matchCost && matchGeneral;
  });

  return (
    <div className={`min-h-screen font-sans ${darkMode ? 'bg-slate-950 text-slate-100 dark-theme' : 'bg-[#eef2f6] text-slate-800'}`}>
      
      {/* Toast Alert Banner */}
      {toast && (
        <div className="fixed top-5 left-5 z-50 flex items-center gap-2 p-3.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xl border border-slate-700 animate-bounce">
          <span className={`w-2 h-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'}`} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Primary Layout Wrapper */}
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto pb-32">
        
        {/* --- DYNAMIC HEADER CARD --- */}
        <div className={`rounded-2xl p-4 sm:p-5 mb-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          
          {/* Logo & System Identity */}
          <div className="flex items-center gap-4 text-right">
            {/* Egyptian Flag Graphic */}
            <div className="w-14 h-10 shrink-0 relative overflow-hidden rounded-md shadow-md border border-slate-200 flex flex-col justify-between">
              <div className="h-1/3 bg-[#FF0000] w-full" />
              <div className="h-1/3 bg-white w-full flex items-center justify-center relative">
                {/* Simulated Golden Eagle */}
                <div className="w-2.5 h-2 bg-[#C5A059] rounded-sm" />
              </div>
              <div className="h-1/3 bg-black w-full" />
            </div>

            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span className={darkMode ? 'text-white' : 'text-slate-900'}>نظام قيد اليومية - مصر</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">النسخة الفنية</span>
              </h1>
              <p className={`text-[11px] ${darkMode ? 'text-slate-450' : 'text-slate-500'} mt-0.5`}>
                الإدارة المالية الذكية للأعمال والشركات المتكاملة
              </p>
            </div>
          </div>

          {/* Center Quick Mode Toggle */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Switcher */}
            <button 
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all shadow-sm ${
                darkMode 
                  ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' 
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{darkMode ? 'دعم الوضع النهاري' : 'دعم الوضع الليلي'}</span>
            </button>
          </div>

          {/* Right Header Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetEntry}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 text-white hover:bg-slate-700 text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>إضافة قيد جديد</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('history');
                showToast('تم فتح محرك البحث والتصفية للقيود التاريخية', 'info');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all ${
                activeTab === 'history'
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Search className="w-4 h-4 text-indigo-500" />
              <span>بحث متقدم</span>
            </button>
          </div>

        </div>

        {/* --- SUB-HEADER STATUS STRIP --- */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-amber-900 font-bold shadow-sm animate-pulse">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-amber-550 rounded-full shrink-0" />
            <span>نموذج إدخال قيد اليومية (الفعلي) - {isBalanced ? 'متوازن' : 'غير متوازن ومسودة مؤقتة'}</span>
          </div>
          <div className="text-[10px] text-amber-800 font-medium">
            تنبيه: يتم تحديث ميزان المراجعة والأرصدة بالدفاتر فور الضغط على "حفظ وترحيل القيد" في قائمة العمليات.
          </div>
        </div>

        {/* --- MAIN DASHBOARD BODY GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT/CENTER WORKSPACE (FORM & INPUTS) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Form Table Box */}
            <div className={`rounded-2xl border shadow-sm overflow-hidden ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              
              {/* Box Header Controls */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isBalanced ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`} />
                  <span className="text-xs font-bold text-slate-700">قيد يومي رقم: {activeEntry.entryNo}</span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Currency Picker */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-bold">العملة:</span>
                    <select
                      value={activeEntry.currency}
                      onChange={(e) => setActiveEntry({ ...activeEntry, currency: e.target.value })}
                      className="text-xs p-1 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {currencies.map(c => (
                        <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Input */}
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-bold">التاريخ:</span>
                    <input
                      type="date"
                      value={activeEntry.date}
                      onChange={(e) => setActiveEntry({ ...activeEntry, date: e.target.value })}
                      className="text-xs p-1 rounded border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* TABLE FORM AREA */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className={`border-b ${darkMode ? 'bg-slate-850 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    <tr>
                      <th className="p-3 text-center w-12">الصف</th>
                      <th className="p-3 w-40">رقم / كود الحساب</th>
                      <th className="p-3 w-44 text-center">مدين (DR)</th>
                      <th className="p-3 w-44 text-center">دائن (CR)</th>
                      <th className="p-3">مركز التكلفة</th>
                      <th className="p-3">البيان / الوصف للسطر</th>
                      <th className="p-3 text-center w-40">خيارات السطر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activeEntry.lines.map((line, idx) => (
                      <tr key={line.id || idx} className="hover:bg-slate-50/40">
                        
                        {/* 1. Row index number */}
                        <td className="p-3 text-center font-bold font-mono text-slate-400 bg-slate-50/20">{idx + 1}</td>
                        
                        {/* 2. Account selection code dropdown */}
                        <td className="p-3">
                          <select
                            value={line.accountCode}
                            onChange={(e) => handleUpdateLine(line.id, 'accountCode', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500/20 font-sans"
                          >
                            {chartOfAccounts.map(acc => (
                              <option key={acc.code} value={acc.code}>{acc.code} - {acc.name.substring(0, 30)}</option>
                            ))}
                          </select>
                        </td>

                        {/* 3. Debit input (مدين) */}
                        <td className="p-3">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              placeholder="0.00"
                              value={line.debit || ''}
                              onChange={(e) => handleUpdateLine(line.id, 'debit', parseFloat(e.target.value) || 0)}
                              className="w-full p-1.5 pr-8 border border-slate-200 rounded-lg text-left font-mono font-bold text-blue-700 bg-blue-50/10 focus:ring-2 focus:ring-blue-500/20"
                            />
                            <span className="absolute right-2 top-2 text-[10px] font-bold text-blue-500">ج.م</span>
                          </div>
                        </td>

                        {/* 4. Credit input (دائن) */}
                        <td className="p-3">
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              placeholder="0.00"
                              value={line.credit || ''}
                              onChange={(e) => handleUpdateLine(line.id, 'credit', parseFloat(e.target.value) || 0)}
                              className="w-full p-1.5 pr-8 border border-slate-200 rounded-lg text-left font-mono font-bold text-red-600 bg-red-50/10 focus:ring-2 focus:ring-red-500/20"
                            />
                            <span className="absolute right-2 top-2 text-[10px] font-bold text-red-500">ج.م</span>
                          </div>
                        </td>

                        {/* 5. Cost Center dropdown */}
                        <td className="p-3">
                          <select
                            value={line.costCenter}
                            onChange={(e) => handleUpdateLine(line.id, 'costCenter', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded-lg text-xs"
                          >
                            {costCenters.map(cc => (
                              <option key={cc} value={cc}>{cc}</option>
                            ))}
                          </select>
                        </td>

                        {/* 6. Notes text */}
                        <td className="p-3">
                          <input
                            type="text"
                            placeholder="اكتب شرح البند الفرعي المحاسبي..."
                            value={line.notes}
                            onChange={(e) => handleUpdateLine(line.id, 'notes', e.target.value)}
                            className="w-full p-1.5 border border-slate-200 rounded-lg text-xs"
                          />
                        </td>

                        {/* 7. Action controllers on single line (Approved, Delete, Duplicate) */}
                        <td className="p-3">
                          <div className="flex items-center gap-1 justify-center">
                            
                            {/* Approve check badge */}
                            <button
                              type="button"
                              onClick={() => handleToggleApproveLine(line.id)}
                              title="اعتماد السطر المحاسبي فرعياً"
                              className={`p-1 rounded transition-all ${
                                line.isApproved 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>

                            {/* Duplicate */}
                            <button
                              type="button"
                              onClick={() => handleDuplicateRow(line.id)}
                              title="تكرار السطر"
                              className="p-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded transition-all"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(line.id)}
                              title="حذف السطر"
                              className="p-1 bg-rose-50 text-rose-650 hover:bg-rose-100 rounded transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>

                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Row controller */}
              <div className="p-4 border-t border-slate-150 bg-slate-50/20">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة بند فرعي (سطر حساب جديد)</span>
                </button>
              </div>

            </div>

            {/* ATTACHMENTS & GENERAL REMARKS BLOCK */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 1. Multiple Attachments Upload Box */}
              <div className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-500" />
                    <span>رفع المرفقات الإلكترونية للقيد (الفواتير والمستندات)</span>
                  </h4>
                  
                  {/* Drag drop area */}
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50/50 transition-all relative">
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf"
                      onChange={handleAttachmentUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-7 h-7 text-indigo-500 mx-auto mb-2" />
                    <span className="block text-xs font-bold text-slate-700 mb-1">اسحب وأفلت المرفقات هنا أو تصفح الملفات</span>
                    <span className="block text-[10px] text-slate-400">يدعم صيغ الصور وPDF والملفات الضريبية</span>
                  </div>
                </div>

                {/* Thumbnails preview list */}
                {activeEntry.attachments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="block text-[10px] text-slate-400 font-bold mb-2">المرفقات المدرجة ({activeEntry.attachments.length}):</span>
                    <div className="grid grid-cols-2 gap-2">
                      {activeEntry.attachments.map(att => (
                        <div key={att.id} className="p-2 border border-slate-150 rounded-xl bg-slate-50 flex items-center justify-between gap-2 text-[10px]">
                          <div className="flex items-center gap-2 truncate">
                            {/* Mini image thumbnail */}
                            <img src={att.url} className="w-8 h-8 rounded object-cover shrink-0 border border-slate-200" referrerPolicy="no-referrer" />
                            <div className="truncate text-right">
                              <span className="block font-bold text-slate-700 truncate" title={att.name}>{att.name}</span>
                              <span className="block text-slate-450 font-mono">{att.size}</span>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleRemoveAttachment(att.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 2. General Notes Text Area */}
              <div className={`p-5 rounded-2xl border shadow-sm ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-500" />
                  <span>إضافة ملاحظات القيد والبيان العام للتسوية</span>
                </h4>
                
                <textarea
                  placeholder="اكتب شرحاً وافياً ومختصراً يوضح طبيعة هذا القيد المحاسبي لأرشفته ومراجعته من قبل المدير المالي والمراجعين..."
                  rows={4}
                  value={activeEntry.notes}
                  onChange={(e) => setActiveEntry({ ...activeEntry, notes: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />

                <p className="text-[10px] text-slate-400 mt-2 italic leading-relaxed">
                  * نصيحة: يفضل كتابة رقم المستخلص أو رقم الفاتورة أو الجهة المستلمة بوضوح في الملاحظات لسهولة استدعائها بالبحث.
                </p>
              </div>

            </div>

            {/* TAB EDITOR VS HISTORICAL HISTORY VIEWER */}
            {activeTab === 'history' && (
              <div className={`p-5 rounded-2xl border shadow-sm ${
                darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                
                <div className="flex items-center justify-between border-b pb-3 mb-4">
                  <span className="font-bold text-xs text-slate-700">محرك البحث واستعراض القيود السابقة في السجلات</span>
                  <button 
                    onClick={() => {
                      setFilterEntryNo('');
                      setFilterAccount('');
                      setFilterDate('');
                      setFilterCostCenter('');
                    }}
                    className="text-[10px] text-indigo-600 font-bold hover:underline"
                  >
                    تفريغ فلاتر البحث
                  </button>
                </div>

                {/* Sub Filters Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">رقم القيد:</label>
                    <input
                      type="text"
                      placeholder="JV-2026/0010"
                      value={filterEntryNo}
                      onChange={(e) => setFilterEntryNo(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">اسم/كود الحساب:</label>
                    <input
                      type="text"
                      placeholder="البنك الأهلي..."
                      value={filterAccount}
                      onChange={(e) => setFilterAccount(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">تاريخ القيد:</label>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 font-bold mb-1">مركز التكلفة:</label>
                    <select
                      value={filterCostCenter}
                      onChange={(e) => setFilterCostCenter(e.target.value)}
                      className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="">كل مراكز التكلفة</option>
                      {costCenters.map(cc => <option key={cc} value={cc}>{cc}</option>)}
                    </select>
                  </div>
                </div>

                {/* Grid of filtered items */}
                <div className="space-y-2">
                  {filteredSavedJournals.length > 0 ? (
                    filteredSavedJournals.map(sj => (
                      <div
                        key={sj.id}
                        onClick={() => handleSelectSavedJournal(sj)}
                        className="p-3 border border-slate-150 rounded-xl hover:bg-slate-50 transition-all cursor-pointer flex justify-between items-center text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-indigo-700 font-mono text-sm">{sj.entry.entryNo}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({sj.entry.date})</span>
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                              {sj.entry.status === 'approved' ? 'معتمد ومرحل' : 'متوازن'}
                            </span>
                          </div>
                          <p className="text-slate-500 font-medium truncate max-w-lg">{sj.entry.notes || 'لا توجد ملاحظات عامة للقيد'}</p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-left font-mono">
                            <span className="block font-bold text-slate-700">
                              {formatCurrency(sj.entry.lines.reduce((sum, l) => sum + l.debit, 0))}
                            </span>
                            <span className="block text-[10px] text-slate-400">إجمالي مدين/دائن</span>
                          </div>

                          <button
                            onClick={(e) => handleDeleteSavedJournal(sj.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded bg-slate-50 hover:bg-slate-100"
                            title="حذف القيد"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-slate-400 font-medium">
                      لا توجد قيود يومية سابقة تطابق خيارات فلاتر البحث الحالية.
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

          {/* RIGHT SIDEBAR (SUMMARY, PROGRESS MEETERS, ACTION CONTROLS) */}
          <div className="space-y-6">
            
            {/* 1. Date widget, user credentials, pulse indicator */}
            <div className={`p-4 rounded-2xl border shadow-sm ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>الوقت المالي الحالي</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">المنطقة الزمنية: القاهرة (UTC+03)</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-center mb-4">
                <div className="bg-emerald-50 border border-emerald-100 p-2 rounded-xl">
                  <span className="block text-[10px] text-emerald-700 font-bold">التاريخ الفعلي</span>
                  <span className="text-xs font-black text-emerald-900 font-mono">
                    {currentTime.toLocaleDateString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric' })}
                  </span>
                </div>
                <div className="bg-blue-50 border border-blue-100 p-2 rounded-xl">
                  <span className="block text-[10px] text-blue-700 font-bold">ساعة الخادم</span>
                  <span className="text-xs font-black text-blue-900 font-mono">
                    {currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* User Identity widget */}
              <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Pulsing indicator */}
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <div>
                    <span className="block text-[10px] text-slate-400 font-bold leading-none">اسم المحاسب النشط:</span>
                    <span className="block text-xs font-bold text-slate-700 mt-1">أدمن الحسابات - مصر</span>
                  </div>
                </div>

                <div className="text-left">
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">مالية عمومية</span>
                </div>
              </div>
            </div>

            {/* 2. LIVE TOTALS CARD (Debit, Credit, Balance Difference) */}
            <div className={`p-5 rounded-2xl border shadow-sm ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5 border-b pb-2">
                <Database className="w-4.5 h-4.5 text-indigo-500" />
                <span>ملخص التوازن الفعلي للقيد (Real-time Totals)</span>
              </h4>

              <div className="space-y-2.5">
                
                {/* Total Debit */}
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] text-blue-600 font-bold">إجمالي المدين (Total Debit)</span>
                    <span className="block text-sm font-black text-blue-900 font-mono mt-0.5">
                      {formatCurrency(totalDebit, activeEntry.currency)}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs font-mono">
                    DR
                  </div>
                </div>

                {/* Total Credit */}
                <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="block text-[10px] text-rose-600 font-bold">إجمالي الدائن (Total Credit)</span>
                    <span className="block text-sm font-black text-rose-900 font-mono mt-0.5">
                      {formatCurrency(totalCredit, activeEntry.currency)}
                    </span>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 font-bold text-xs font-mono">
                    CR
                  </div>
                </div>

                {/* Difference */}
                <div className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  isBalanced 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                    : 'bg-amber-50 border-amber-200 text-amber-800 animate-pulse'
                }`}>
                  <div>
                    <span className="block text-[10px] font-bold">فرق التوازن الحالي</span>
                    <span className="block text-sm font-black font-mono mt-0.5">
                      {formatCurrency(difference, activeEntry.currency)}
                    </span>
                  </div>
                  
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                    isBalanced ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                  }`}>
                    {isBalanced ? 'متوازن' : 'غير متوازن'}
                  </span>
                </div>

              </div>
            </div>

            {/* 3. SYSTEM ALERTS PANEL */}
            <div className={`p-4 rounded-2xl border shadow-sm ${
              isBalanced 
                ? 'bg-emerald-50/40 border-emerald-100 text-emerald-900' 
                : 'bg-rose-50 border-rose-200 text-rose-900 animate-pulse'
            }`}>
              <h5 className="font-bold text-xs mb-1.5 flex items-center gap-1.5">
                <AlertTriangle className={`w-4.5 h-4.5 ${isBalanced ? 'text-emerald-600' : 'text-rose-600'}`} />
                <span>تنبيهات المدقق الآلي بالنظام (System Alerts)</span>
              </h5>
              
              <p className="text-[11px] leading-relaxed">
                {isBalanced 
                  ? 'أمورك طيبة ومستقرة! فرق التوازن مساوٍ للصفر تماماً (0.00 ج.م). يمكنك الآن ترحيل القيد المحاسبي وحفظه للأرشيف بأمان.' 
                  : 'تنبيه عاجل: إجمالي المبالغ المدينة لا تساوي المبالغ الدائنة. يجب مطابقة وتوازن الطرفين للحفاظ على دقة التسويات ودفاتر الأستاذ.'
                }
              </p>

              {/* Tafqeet translation of current entry amount */}
              {totalDebit > 0 && isBalanced && (
                <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] leading-relaxed text-slate-500">
                  <span className="font-bold block text-slate-700">تفقيط المبلغ الإجمالي بالعربية:</span>
                  <span className="italic">{tafqeet(totalDebit)}</span>
                </div>
              )}
            </div>

            {/* 4. FINANCIAL REPORTS AVAILABILITY BLOCK (Progress indicators) */}
            <div className={`p-5 rounded-2xl border shadow-sm ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5 border-b pb-2">
                <Layers className="w-4.5 h-4.5 text-indigo-500" />
                <span>التقارير المحاسبية المحدثة لحظياً</span>
              </h4>

              <div className="space-y-3">
                
                {/* 1. Daily Journal */}
                <div 
                  onClick={() => setActiveReport('journal')}
                  className="group cursor-pointer p-1 rounded-lg hover:bg-slate-50 transition-all"
                >
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-slate-700 group-hover:text-indigo-600">تقرير قيود اليومية اليومية</span>
                    <span className="text-emerald-600 font-mono">جاهز بنسبة 100%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-550" style={{ width: '100%' }} />
                  </div>
                </div>

                {/* 2. General Ledger */}
                <div 
                  onClick={() => setActiveReport('ledger')}
                  className="group cursor-pointer p-1 rounded-lg hover:bg-slate-50 transition-all"
                >
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-slate-700 group-hover:text-indigo-600">تقرير دفتر الأستاذ العام</span>
                    <span className="text-indigo-600 font-mono">جاهز بنسبة 85%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-550 h-full rounded-full transition-all duration-550" style={{ width: '85%' }} />
                  </div>
                </div>

                {/* 3. Trial Balance */}
                <div 
                  onClick={() => setActiveReport('trial')}
                  className="group cursor-pointer p-1 rounded-lg hover:bg-slate-50 transition-all"
                >
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-slate-700 group-hover:text-indigo-600">تقرير ميزان المراجعة والأرصدة</span>
                    <span className="text-emerald-600 font-mono">جاهز بنسبة 100%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-550" style={{ width: '100%' }} />
                  </div>
                </div>

                {/* 4. Income Statement */}
                <div 
                  onClick={() => setActiveReport('income')}
                  className="group cursor-pointer p-1 rounded-lg hover:bg-slate-50 transition-all"
                >
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-slate-700 group-hover:text-indigo-600">تقرير قائمة الدخل (الأرباح)</span>
                    <span className="text-emerald-600 font-mono">جاهز بنسبة 100%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-550" style={{ width: '100%' }} />
                  </div>
                </div>

                {/* 5. Balance Sheet */}
                <div 
                  onClick={() => setActiveReport('balance')}
                  className="group cursor-pointer p-1 rounded-lg hover:bg-slate-50 transition-all"
                >
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-slate-700 group-hover:text-indigo-600">تقرير الميزانية العمومية والمركز</span>
                    <span className="text-emerald-600 font-mono">جاهز بنسبة 100%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-550" style={{ width: '100%' }} />
                  </div>
                </div>

                {/* 6. Cash Flow */}
                <div 
                  onClick={() => setActiveReport('cashflow')}
                  className="group cursor-pointer p-1 rounded-lg hover:bg-slate-50 transition-all"
                >
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-slate-700 group-hover:text-indigo-600">تقرير قائمة التدفقات النقدية</span>
                    <span className="text-emerald-600 font-mono">جاهز بنسبة 100%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-550" style={{ width: '100%' }} />
                  </div>
                </div>

              </div>
            </div>

            {/* 5. EXPORT AND PRINT TOOLBOX */}
            <div className={`p-5 rounded-2xl border shadow-sm ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5 border-b pb-2">
                <Download className="w-4.5 h-4.5 text-indigo-500" />
                <span>العمليات والترحيل (Import & Export)</span>
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                
                {/* Excel Import */}
                <button
                  onClick={handleExcelImport}
                  className="flex items-center justify-center gap-1 p-2.5 bg-indigo-550 text-indigo-700 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>استيراد Excel</span>
                </button>

                {/* Excel Export */}
                <button
                  onClick={handleExcelExport}
                  className="flex items-center justify-center gap-1 p-2.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition-all"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>تصدير Excel</span>
                </button>

                {/* A4 Print Voucher Preview */}
                <button
                  onClick={() => setShowPrintVoucher(true)}
                  className="col-span-2 flex items-center justify-center gap-1.5 p-2.5 bg-slate-800 text-white hover:bg-slate-700 rounded-xl transition-all"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  <span>طباعة احترافية على صفحة A4 واحدة</span>
                </button>

                {/* SAVE AND POST MAIN BUTTON */}
                <button
                  onClick={handleSaveJournal}
                  className={`col-span-2 mt-2 flex items-center justify-center gap-1.5 p-3 rounded-xl transition-all font-black text-xs ${
                    isBalanced
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-md'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                  disabled={!isBalanced}
                >
                  <Save className="w-4.5 h-4.5" />
                  <span>اعتماد وحفظ وترحيل القيد للدفاتر</span>
                </button>

              </div>
            </div>

          </div>

        </div>

        {/* --- BOTTOM GLASS NAVIGATION DOCK --- */}
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 max-w-full px-4 no-print">
          <div className="bg-slate-900/90 hover:bg-slate-900 backdrop-blur-md rounded-2xl p-2.5 shadow-2xl border border-slate-700 flex items-center gap-2 overflow-x-auto max-w-[95vw] scrollbar-none">
            
            <div className="flex items-center gap-1 border-l border-slate-700 pl-2 shrink-0">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-slate-400 font-bold">دليل الأقسام</span>
            </div>

            {[
              { id: 'accounts', label: 'الحسابات', icon: <Layers className="w-4 h-4" /> },
              { id: 'banks', label: 'البنوك', icon: <Building className="w-4 h-4" /> },
              { id: 'suppliers', label: 'الموردين', icon: <User className="w-4 h-4" /> },
              { id: 'customers', label: 'العملاء', icon: <User className="w-4 h-4" /> },
              { id: 'assets', label: 'الأصول الثابتة', icon: <Plus className="w-4 h-4" /> },
              { id: 'taxes', label: 'الضرائب', icon: <Percent className="w-4 h-4" /> },
              { id: 'lcs', label: 'الاعتمادات المستندية', icon: <ExternalLink className="w-4 h-4" /> },
              { id: 'warehouses', label: 'المخازن', icon: <Database className="w-4 h-4" /> },
              { id: 'approvals', label: 'الاعتمادات المحاسبية', icon: <Check className="w-4 h-4" /> },
            ].map(dept => (
              <button
                key={dept.id}
                onClick={() => {
                  setActiveDepartment(dept.id as any);
                  showToast(`تم فتح سجل إدارة ${dept.label}`, 'info');
                }}
                className="flex flex-col items-center gap-1 px-3 py-1 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-all shrink-0"
              >
                {dept.icon}
                <span className="text-[10px] font-bold leading-none">{dept.label}</span>
              </button>
            ))}

          </div>
        </div>

      </div>

      {/* --- ALL MODALS ATTACHMENTS --- */}

      {/* 1. Report Modal */}
      {activeReport && (
        <ReportModal
          isOpen={true}
          onClose={() => setActiveReport(null)}
          reportType={activeReport}
          activeEntry={activeEntry}
          savedJournals={savedJournals}
        />
      )}

      {/* 2. Department Drawer Modal */}
      {activeDepartment && (
        <DepartmentModal
          isOpen={true}
          onClose={() => setActiveDepartment(null)}
          department={activeDepartment}
          activeEntry={activeEntry}
          savedJournals={savedJournals}
          setSavedJournals={setSavedJournals}
        />
      )}

      {/* 3. A4 Print Voucher Sheet */}
      {showPrintVoucher && (
        <PrintVoucher
          isOpen={true}
          onClose={() => setShowPrintVoucher(false)}
          entry={activeEntry}
        />
      )}

    </div>
  );
}
