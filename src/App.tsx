import React, { useState, useEffect, useRef } from 'react';
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
  Layout, 
  Eye, 
  Settings, 
  Calendar, 
  DollarSign, 
  FileText, 
  Check, 
  Edit3, 
  Layers, 
  User, 
  CheckCircle,
  HelpCircle,
  TrendingUp,
  Share2,
  FileSpreadsheet,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  StatementRow, 
  StatementHeader, 
  StatementConfig, 
  SavedStatement 
} from './types';
import { 
  defaultConfig, 
  defaultHeader, 
  defaultRows, 
  templates, 
  formatCurrency, 
  tafqeet 
} from './data';

export default function App() {
  // State for the active statement (using lazy state initialization from localStorage for robustness)
  const [header, setHeader] = useState<StatementHeader>(() => {
    const saved = localStorage.getItem('current_statement_header');
    return saved ? JSON.parse(saved) : defaultHeader;
  });
  const [rows, setRows] = useState<StatementRow[]>(() => {
    const saved = localStorage.getItem('current_statement_rows');
    return saved ? JSON.parse(saved) : defaultRows;
  });
  const [config, setConfig] = useState<StatementConfig>(() => {
    const saved = localStorage.getItem('current_statement_config');
    return saved ? JSON.parse(saved) : defaultConfig;
  });
  const [activeSavedId, setActiveSavedId] = useState<string | null>(() => {
    return localStorage.getItem('current_statement_active_id') || null;
  });
  
  // Local storage lists
  const [savedStatements, setSavedStatements] = useState<SavedStatement[]>([]);
  const [currentSaveName, setCurrentSaveName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'design' | 'manage'>('editor');
  const [showGuide, setShowGuide] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Load saved statements on startup
  useEffect(() => {
    const saved = localStorage.getItem('supplier_statements');
    if (saved) {
      try {
        setSavedStatements(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load statements from local storage', e);
      }
    }
  }, []);

  // Auto-save active state to local storage on any change
  useEffect(() => {
    localStorage.setItem('current_statement_header', JSON.stringify(header));
  }, [header]);

  useEffect(() => {
    localStorage.setItem('current_statement_rows', JSON.stringify(rows));
  }, [rows]);

  useEffect(() => {
    localStorage.setItem('current_statement_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    if (activeSavedId) {
      localStorage.setItem('current_statement_active_id', activeSavedId);
    } else {
      localStorage.removeItem('current_statement_active_id');
    }
  }, [activeSavedId]);

  // Automatically update the savedStatements list if editing a loaded statement!
  useEffect(() => {
    if (!activeSavedId) return;
    
    setSavedStatements(prev => {
      const existing = prev.find(s => s.id === activeSavedId);
      if (!existing) return prev;
      
      // Compare to prevent infinite rendering loops
      if (
        JSON.stringify(existing.header) === JSON.stringify(header) &&
        JSON.stringify(existing.rows) === JSON.stringify(rows) &&
        JSON.stringify(existing.config) === JSON.stringify(config)
      ) {
        return prev;
      }
      
      const updated = prev.map(s => {
        if (s.id === activeSavedId) {
          return {
            ...s,
            header,
            rows,
            config,
            updatedAt: new Date().toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' })
          };
        }
        return s;
      });
      
      localStorage.setItem('supplier_statements', JSON.stringify(updated));
      return updated;
    });
  }, [header, rows, config, activeSavedId]);

  // Toast notifier
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Calculations
  const totalQuantity = rows.reduce((sum, row) => sum + (row.quantity || 0), 0);
  const grandTotal = rows.reduce((sum, row) => sum + ((row.quantity || 0) * (row.price || 0)), 0);

  // Handle single cell update
  const handleUpdateRow = (id: string, field: keyof StatementRow, value: any) => {
    setRows(prevRows => prevRows.map(row => {
      if (row.id === id) {
        const updatedRow = { ...row, [field]: value };
        if (field === 'quantity' || field === 'price') {
          updatedRow.total = (Number(updatedRow.quantity) || 0) * (Number(updatedRow.price) || 0);
        }
        return updatedRow;
      }
      return row;
    }));
  };

  // Add new blank row
  const handleAddRow = () => {
    const newRow: StatementRow = {
      id: Math.random().toString(36).substr(2, 9),
      date: rows.length > 0 ? rows[rows.length - 1].date : new Date().toISOString().split('T')[0],
      rawMaterial: header.rawMaterialType || '',
      quantity: 0,
      price: rows.length > 0 ? rows[rows.length - 1].price : 0,
      total: 0,
      costCenter: rows.length > 0 ? rows[rows.length - 1].costCenter : '',
      notes: '',
    };
    setRows([...rows, newRow]);
    showToast('تمت إضافة سطر جديد بنجاح', 'success');
  };

  // Duplicate a row
  const handleDuplicateRow = (id: string) => {
    const rowToCopy = rows.find(r => r.id === id);
    if (rowToCopy) {
      const newRow: StatementRow = {
        ...rowToCopy,
        id: Math.random().toString(36).substr(2, 9),
      };
      const index = rows.findIndex(r => r.id === id);
      const updatedRows = [...rows];
      updatedRows.splice(index + 1, 0, newRow);
      setRows(updatedRows);
      showToast('تم تكرار السطر بنجاح', 'info');
    }
  };

  // Delete a row
  const handleDeleteRow = (id: string) => {
    if (rows.length <= 1) {
      showToast('يجب أن يحتوي الكشف على سطر واحد على الأقل', 'error');
      return;
    }
    if (window.confirm('هل أنت متأكد من حذف هذا السطر؟')) {
      setRows(rows.filter(row => row.id !== id));
      showToast('تم حذف السطر بنجاح', 'info');
    }
  };

  // Load a template
  const handleLoadTemplate = (templateIndex: number) => {
    const t = templates[templateIndex];
    setHeader({ ...t.header });
    setRows(t.rows.map(r => ({ ...r, id: Math.random().toString(36).substr(2, 9) })));
    setConfig({ ...t.config });
    setActiveSavedId(null);
    showToast(`تم تحميل نموذج: ${t.name}`, 'success');
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Reset to empty
  const handleReset = () => {
    if (window.confirm('هل أنت متأكد من إعادة تعيين جميع البيانات؟ سيتم مسح الجدول الحالي.')) {
      setHeader({
        ...defaultHeader,
        supplierName: '',
        rawMaterialType: '',
        statementNo: 'STA-' + new Date().getFullYear() + '-0001',
        dateFrom: '',
        dateTo: '',
      });
      setRows([{
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split('T')[0],
        rawMaterial: '',
        quantity: 0,
        price: 0,
        total: 0,
        costCenter: '',
        notes: '',
      }]);
      setActiveSavedId(null);
      showToast('تمت إعادة ضبط الكشف بنجاح', 'info');
    }
  };

  // Save statement to LocalStorage list
  const handleSaveToLocalStorage = () => {
    if (!currentSaveName.trim()) {
      showToast('برجاء إدخال اسم لحفظ الكشف', 'error');
      return;
    }

    const newId = Math.random().toString(36).substr(2, 9);
    const newSaved: SavedStatement = {
      id: newId,
      name: currentSaveName,
      updatedAt: new Date().toLocaleDateString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      header,
      rows,
      config,
    };

    const updatedList = [newSaved, ...savedStatements];
    setSavedStatements(updatedList);
    localStorage.setItem('supplier_statements', JSON.stringify(updatedList));
    setActiveSavedId(newId);
    setShowSaveModal(false);
    setCurrentSaveName('');
    showToast('تم حفظ الكشف بنجاح في القائمة الخاصة بك وبدء الحفظ التلقائي', 'success');
  };

  // Load a saved statement
  const handleLoadSaved = (saved: SavedStatement) => {
    setHeader(saved.header);
    setRows(saved.rows);
    setConfig(saved.config);
    setActiveSavedId(saved.id);
    showToast(`تم استرجاع الكشف وتفعيل الحفظ التلقائي: ${saved.name}`, 'success');
  };

  // Delete a saved statement
  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من حذف هذا الكشف المحفوظ؟')) {
      const updated = savedStatements.filter(s => s.id !== id);
      setSavedStatements(updated);
      localStorage.setItem('supplier_statements', JSON.stringify(updated));
      if (activeSavedId === id) {
        setActiveSavedId(null);
      }
      showToast('تم حذف الكشف المحفوظ بنجاح', 'info');
    }
  };

  // Export as JSON file
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ header, rows, config }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `كشف_حساب_${header.supplierName || 'مورد'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('تم تصدير ملف الكشف بنجاح', 'success');
  };

  // Import from JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed.header && parsed.rows) {
            setHeader(parsed.header);
            setRows(parsed.rows);
            if (parsed.config) setConfig(parsed.config);
            setActiveSavedId(null);
            showToast('تم استيراد الكشف بنجاح وملء البيانات', 'success');
          } else {
            showToast('تنسيق الملف غير صالح، يرجى اختيار ملف كشف صحيح', 'error');
          }
        } catch (err) {
          showToast('حدث خطأ أثناء قراءة الملف', 'error');
        }
      };
    }
  };

  // Apply visual theme background/borders
  const getThemeClasses = () => {
    switch (config.themeColor) {
      case 'royal-blue':
        return {
          headerBg: 'bg-blue-900 text-white border-blue-900',
          footerBg: 'bg-blue-50 text-blue-900',
          border: 'border-blue-200',
          textAccent: 'text-blue-900',
          badge: 'bg-blue-100 text-blue-800',
          tableHeader: 'bg-blue-800 text-white',
          tableTotal: 'bg-blue-50',
          inputActive: 'focus:border-blue-500 focus:ring-blue-500',
          accentBorder: 'border-t-4 border-t-blue-800',
        };
      case 'emerald-green':
        return {
          headerBg: 'bg-emerald-800 text-white border-emerald-800',
          footerBg: 'bg-emerald-50 text-emerald-900',
          border: 'border-emerald-200',
          textAccent: 'text-emerald-800',
          badge: 'bg-emerald-100 text-emerald-800',
          tableHeader: 'bg-emerald-800 text-white',
          tableTotal: 'bg-emerald-50',
          inputActive: 'focus:border-emerald-500 focus:ring-emerald-500',
          accentBorder: 'border-t-4 border-t-emerald-800',
        };
      case 'amber-gold':
        return {
          headerBg: 'bg-amber-800 text-white border-amber-800',
          footerBg: 'bg-amber-50 text-amber-900',
          border: 'border-amber-200',
          textAccent: 'text-amber-800',
          badge: 'bg-amber-100 text-amber-800',
          tableHeader: 'bg-amber-800 text-white',
          tableTotal: 'bg-amber-50',
          inputActive: 'focus:border-amber-500 focus:ring-amber-500',
          accentBorder: 'border-t-4 border-t-amber-800',
        };
      case 'high-density':
        return {
          headerBg: 'bg-slate-900 text-white border-slate-900',
          footerBg: 'bg-slate-50 text-slate-900',
          border: 'border-slate-900',
          textAccent: 'text-slate-900',
          badge: 'bg-slate-900 text-white',
          tableHeader: 'bg-slate-900 text-white',
          tableTotal: 'bg-slate-100',
          inputActive: 'focus:border-slate-900 focus:ring-slate-900',
          accentBorder: 'border-t-4 border-t-slate-900',
        };
      case 'minimal-dark':
        return {
          headerBg: 'bg-gray-950 text-white border-gray-950',
          footerBg: 'bg-gray-100 text-gray-950',
          border: 'border-gray-300',
          textAccent: 'text-gray-950',
          badge: 'bg-gray-100 text-gray-900',
          tableHeader: 'bg-gray-900 text-white',
          tableTotal: 'bg-gray-100',
          inputActive: 'focus:border-gray-900 focus:ring-gray-900',
          accentBorder: 'border-t-4 border-t-gray-900',
        };
      case 'classic-gray':
      default:
        return {
          headerBg: 'bg-gray-200 text-gray-800 border-gray-400',
          footerBg: 'bg-gray-100 text-gray-800',
          border: 'border-gray-300',
          textAccent: 'text-gray-800',
          badge: 'bg-gray-100 text-gray-800',
          tableHeader: 'bg-gray-200 text-gray-800',
          tableTotal: 'bg-gray-100',
          inputActive: 'focus:border-gray-400 focus:ring-gray-400',
          accentBorder: 'border-t-4 border-t-gray-400',
        };
    }
  };

  const theme = getThemeClasses();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none antialiased">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 border bg-white max-w-md w-[90%]"
            style={{
              borderColor: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#f43f5e' : '#3b82f6',
            }}
          >
            <div className={`w-3 h-3 rounded-full ${
              toast.type === 'success' ? 'bg-emerald-500' : toast.type === 'error' ? 'bg-rose-500' : 'bg-blue-500'
            }`} />
            <p className="text-sm font-semibold text-slate-800 text-right flex-1">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Top Header - HIDDEN DURING PRINT */}
      <header className="no-print bg-slate-900 text-white shadow-md border-b border-slate-800 shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-inner">
              <Printer className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">مُنشئ كشوفات الحسابات المميّزة (A4)</h1>
              <p className="text-xs text-slate-400">صمم، احسب واطبع كشف حساب المورد بجودة احترافية</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLoadTemplate(0)}
              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all"
              title="إعادة الكشف لبيانات صورة المستخدم الأصلية"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة النموذج الأصلي (إسلام رمل)</span>
            </button>

            <button
              onClick={() => setShowGuide(!showGuide)}
              className="text-xs bg-indigo-950 hover:bg-indigo-900 text-indigo-200 border border-indigo-800/80 px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>دليل الطباعة</span>
            </button>
          </div>
        </div>
      </header>

      {/* Guide Block - HIDDEN DURING PRINT */}
      <AnimatePresence>
        {showGuide && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="no-print bg-indigo-50 border-b border-indigo-100 shrink-0 overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-indigo-950">
              <div className="flex gap-3">
                <div className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold">١</div>
                <div>
                  <h4 className="font-bold mb-1">املأ البيانات والجدول</h4>
                  <p className="text-xs text-indigo-800 leading-relaxed">أدخل اسم المورد، ونوع الخام، وحدد الفترة الزمنية. استخدم زر الإضافة وتكرار الأسطر لإدخال بيانات الكشف بالكامل وبسرعة.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold">٢</div>
                <div>
                  <h4 className="font-bold mb-1">اختر التنسيق واللون المميز</h4>
                  <p className="text-xs text-indigo-800 leading-relaxed">اختر لوناً مميزاً للمؤسسة (الأزرق الملكي، الزمردي، إلخ)، وحدد عرض الأعمدة وإمكانية تفعيل تفقيط الحساب والتوقيعات بالأسفل.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold">٣</div>
                <div>
                  <h4 className="font-bold mb-1">اطبع بشكل ممتاز A4</h4>
                  <p className="text-xs text-indigo-800 leading-relaxed">انقر فوق زر <b>"طباعة الكشف A4"</b>. في نافذة الطباعة، تأكد من إخفاء "العناوين وتذييل الصفحة" وتفعيل خيار "رسومات الخلفية" لضمان خروج الألوان والخطوط بالشكل الممتاز المطلوب.</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace Layout */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6 overflow-x-hidden">
        
        {/* LEFT PANEL: Dynamic Controls - HIDDEN DURING PRINT */}
        <section className="no-print w-full lg:w-[45%] flex flex-col gap-5 shrink-0">
          
          {/* Quick templates Selector */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>اختر نموذجاً مسبقاً للبدء السريع:</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {templates.map((tpl, i) => (
                <button
                  key={i}
                  onClick={() => handleLoadTemplate(i)}
                  className="p-2.5 rounded-lg border border-slate-200 text-right hover:border-indigo-500 hover:bg-slate-50 transition-all flex items-center gap-2 group text-xs font-semibold"
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">{tpl.icon}</span>
                  <div className="overflow-hidden">
                    <p className="truncate text-slate-800">{tpl.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{tpl.header.supplierName}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Save State Status Bar */}
          <div className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold shadow-sm transition-all duration-300 ${
            activeSavedId 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${activeSavedId ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
              {activeSavedId ? (
                <span>
                  كشف نشط للتعديل التلقائي: <span className="font-extrabold text-emerald-950">{(savedStatements.find(s => s.id === activeSavedId)?.name || 'كشف محفوظ')}</span>
                </span>
              ) : (
                <span>مسودة جديدة نشطة (تُحفظ تلقائياً في المتصفح)</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] text-slate-400 font-normal">تم الحفظ</span>
            </div>
          </div>

          {/* Controls Tabs */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
            <div className="flex border-b border-slate-100 bg-slate-50/80 p-1">
              <button
                onClick={() => setActiveTab('editor')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'editor' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>البيانات والجدول</span>
              </button>
              <button
                onClick={() => setActiveTab('design')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'design' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
                <span>تنسيق وستايل الطباعة</span>
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'manage' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>كشوفاتك المحفوظة</span>
              </button>
            </div>

            <div className="p-5 max-h-[620px] overflow-y-auto">
              {/* TAB 1: Editor */}
              {activeTab === 'editor' && (
                <div className="space-y-5">
                  {/* Header Form */}
                  <div>
                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      <span>بيانات رأس الكشف الأساسية</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">اسم المؤسسة (المصدرة للكشف)</label>
                        <input
                          type="text"
                          value={header.companyName}
                          onChange={e => setHeader({ ...header, companyName: e.target.value })}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">عنوان الكشف الرئيسي</label>
                        <input
                          type="text"
                          value={header.title}
                          onChange={e => setHeader({ ...header, title: e.target.value })}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">رقم الكشف</label>
                        <input
                          type="text"
                          value={header.statementNo}
                          onChange={e => setHeader({ ...header, statementNo: e.target.value })}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">اسم المورد</label>
                        <input
                          type="text"
                          value={header.supplierName}
                          onChange={e => setHeader({ ...header, supplierName: e.target.value })}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">نوع الخام الرئيسي</label>
                        <input
                          type="text"
                          value={header.rawMaterialType}
                          onChange={e => setHeader({ ...header, rawMaterialType: e.target.value })}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">الفترة من</label>
                        <input
                          type="date"
                          value={header.dateFrom}
                          onChange={e => setHeader({ ...header, dateFrom: e.target.value })}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">الفترة إلى</label>
                        <input
                          type="date"
                          value={header.dateTo}
                          onChange={e => setHeader({ ...header, dateTo: e.target.value })}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Table Rows Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        <span>بنود جدول الكشف ({rows.length})</span>
                      </h4>
                      <button
                        onClick={handleAddRow}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة سطر</span>
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 mb-3">يمكنك تعديل القيم مباشرة من الحقول التالية. الإجماليات تُحسب تلقائياً بضرب الكمية بسعر الخام.</p>

                    <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                      {rows.map((row, index) => (
                        <div 
                          key={row.id} 
                          className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 relative flex flex-col gap-2 group transition-all"
                        >
                          {/* Row Indicator & Actions */}
                          <div className="flex items-center justify-between border-b border-slate-200/60 pb-1.5">
                            <span className="text-[11px] font-bold text-slate-400">سطر رقم {index + 1}</span>
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleDuplicateRow(row.id)}
                                className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                                title="تكرار السطر"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteRow(row.id)}
                                className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-all"
                                title="حذف السطر"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Data Fields */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <div>
                              <label className="block text-[10px] text-slate-400 mb-0.5">التاريخ</label>
                              <input
                                type="date"
                                value={row.date}
                                onChange={e => handleUpdateRow(row.id, 'date', e.target.value)}
                                className="w-full text-xs p-1 border border-slate-200 rounded-md bg-white"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400 mb-0.5">نوع الخام</label>
                              <input
                                type="text"
                                value={row.rawMaterial}
                                onChange={e => handleUpdateRow(row.id, 'rawMaterial', e.target.value)}
                                className="w-full text-xs p-1 border border-slate-200 rounded-md bg-white"
                                placeholder="رمل، أسمنت، إلخ"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400 mb-0.5">الكمية</label>
                              <input
                                type="number"
                                value={row.quantity || ''}
                                onChange={e => handleUpdateRow(row.id, 'quantity', Number(e.target.value))}
                                className="w-full text-xs p-1 border border-slate-200 rounded-md bg-white font-mono"
                                placeholder="60.00"
                                step="any"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] text-slate-400 mb-0.5">السعر</label>
                              <input
                                type="number"
                                value={row.price || ''}
                                onChange={e => handleUpdateRow(row.id, 'price', Number(e.target.value))}
                                className="w-full text-xs p-1 border border-slate-200 rounded-md bg-white font-mono"
                                placeholder="195.00"
                                step="any"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-[10px] text-slate-400 mb-0.5">مركز التكلفة</label>
                              <input
                                type="text"
                                value={row.costCenter}
                                onChange={e => handleUpdateRow(row.id, 'costCenter', e.target.value)}
                                className="w-full text-xs p-1 border border-slate-200 rounded-md bg-white"
                                placeholder="مثل: مشروع ذا كورد"
                              />
                            </div>
                            <div className="col-span-2">
                              <label className="block text-[10px] text-slate-400 mb-0.5">ملاحظات البند</label>
                              <input
                                type="text"
                                value={row.notes}
                                onChange={e => handleUpdateRow(row.id, 'notes', e.target.value)}
                                className="w-full text-xs p-1 border border-slate-200 rounded-md bg-white"
                                placeholder="ملاحظات اختيارية"
                              />
                            </div>
                          </div>

                          {/* Computed Total Badge */}
                          <div className="text-[10px] text-right font-mono font-bold text-slate-500 mt-1">
                            الإجمالي الفرعي: <span className="text-emerald-600">{formatCurrency((row.quantity || 0) * (row.price || 0))}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Design and Layout customization */}
              {activeTab === 'design' && (
                <div className="space-y-5">
                  {/* Theme Select */}
                  <div>
                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">اللون المميّز للمؤسسة</h4>
                    <p className="text-[10px] text-slate-400 mb-3">اختر هوية لونية أنيقة تناسب نشاطك لتلوين الترويسة والخطوط.</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setConfig({ ...config, themeColor: 'classic-gray' })}
                        className={`p-2.5 rounded-lg border text-xs text-right flex items-center justify-between ${
                          config.themeColor === 'classic-gray' ? 'border-gray-500 bg-gray-50 text-gray-900 font-bold' : 'border-slate-200'
                        }`}
                      >
                        <span>الرمادي الكلاسيكي (مثل الصورة)</span>
                        <span className="w-4 h-4 rounded-full bg-gray-300 border border-gray-400 shrink-0" />
                      </button>
                      
                      <button
                        onClick={() => setConfig({ ...config, themeColor: 'royal-blue' })}
                        className={`p-2.5 rounded-lg border text-xs text-right flex items-center justify-between ${
                          config.themeColor === 'royal-blue' ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold' : 'border-slate-200'
                        }`}
                      >
                        <span>الأزرق الملكي الفاخر</span>
                        <span className="w-4 h-4 rounded-full bg-blue-800 border border-blue-950 shrink-0" />
                      </button>

                      <button
                        onClick={() => setConfig({ ...config, themeColor: 'emerald-green' })}
                        className={`p-2.5 rounded-lg border text-xs text-right flex items-center justify-between ${
                          config.themeColor === 'emerald-green' ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold' : 'border-slate-200'
                        }`}
                      >
                        <span>الأخضر الزمردي</span>
                        <span className="w-4 h-4 rounded-full bg-emerald-700 border border-emerald-900 shrink-0" />
                      </button>

                      <button
                        onClick={() => setConfig({ ...config, themeColor: 'amber-gold' })}
                        className={`p-2.5 rounded-lg border text-xs text-right flex items-center justify-between ${
                          config.themeColor === 'amber-gold' ? 'border-amber-500 bg-amber-50 text-amber-900 font-bold' : 'border-slate-200'
                        }`}
                      >
                        <span>الذهبي العنبري الدافئ</span>
                        <span className="w-4 h-4 rounded-full bg-amber-600 border border-amber-800 shrink-0" />
                      </button>

                      <button
                        onClick={() => setConfig({ ...config, themeColor: 'high-density' })}
                        className={`p-2.5 rounded-lg border text-xs text-right flex items-center justify-between ${
                          config.themeColor === 'high-density' ? 'border-slate-900 bg-slate-100 text-slate-900 font-bold' : 'border-slate-200'
                        }`}
                      >
                        <span>تنسيق عالي الكثافة (High Density)</span>
                        <span className="w-4 h-4 rounded bg-slate-950 border border-slate-950 shrink-0" />
                      </button>

                      <button
                        onClick={() => setConfig({ ...config, themeColor: 'minimal-dark' })}
                        className={`p-2.5 rounded-lg border text-xs text-right flex items-center justify-between ${
                          config.themeColor === 'minimal-dark' ? 'border-slate-800 bg-slate-50 text-slate-900 font-bold' : 'border-slate-200'
                        }`}
                      >
                        <span>الأسود والأبيض البسيط</span>
                        <span className="w-4 h-4 rounded-full bg-slate-950 border border-slate-900 shrink-0" />
                      </button>
                    </div>
                  </div>

                  {/* Table Styling Option */}
                  <div>
                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">طريقة رسم الجدول</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setConfig({ ...config, tableStyle: 'grid' })}
                        className={`p-2 text-xs rounded-lg border ${config.tableStyle === 'grid' ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold' : 'bg-white border-slate-200'}`}
                      >
                        شبكة كاملة (Grid)
                      </button>
                      <button
                        onClick={() => setConfig({ ...config, tableStyle: 'clean' })}
                        className={`p-2 text-xs rounded-lg border ${config.tableStyle === 'clean' ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold' : 'bg-white border-slate-200'}`}
                      >
                        خطوط أفقية فقط
                      </button>
                      <button
                        onClick={() => setConfig({ ...config, tableStyle: 'striped' })}
                        className={`p-2 text-xs rounded-lg border ${config.tableStyle === 'striped' ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold' : 'bg-white border-slate-200'}`}
                      >
                        أسطر ملونة (Stripes)
                      </button>
                    </div>
                  </div>

                  {/* Fonts Sizes Option */}
                  <div>
                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">حجم خط الطباعة</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setConfig({ ...config, fontSize: 'sm' })}
                        className={`p-2 text-xs rounded-lg border ${config.fontSize === 'sm' ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold' : 'bg-white border-slate-200'}`}
                      >
                        صغير (مثالي للمقالات الطويلة)
                      </button>
                      <button
                        onClick={() => setConfig({ ...config, fontSize: 'base' })}
                        className={`p-2 text-xs rounded-lg border ${config.fontSize === 'base' ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold' : 'bg-white border-slate-200'}`}
                      >
                        افتراضي (A4 متوازن)
                      </button>
                      <button
                        onClick={() => setConfig({ ...config, fontSize: 'lg' })}
                        className={`p-2 text-xs rounded-lg border ${config.fontSize === 'lg' ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-bold' : 'bg-white border-slate-200'}`}
                      >
                        كبير وبارز
                      </button>
                    </div>
                  </div>

                  {/* Columns Visibility */}
                  <div>
                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">التحكم في أعمدة الجدول المعروضة</h4>
                    <p className="text-[10px] text-slate-400 mb-2">حدد الأعمدة التي ترغب بظهورها في الكشف المطبوع.</p>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {Object.keys(config.visibleColumns).map((colKey) => {
                        const arabicName: Record<string, string> = {
                          date: 'التاريخ',
                          rawMaterial: 'نوع الخام',
                          quantity: 'الكمية',
                          price: 'السعر',
                          total: 'الإجمالي',
                          costCenter: 'مركز التكلفة',
                          notes: 'ملاحظات',
                        };
                        return (
                          <label key={colKey} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={(config.visibleColumns as any)[colKey]}
                              onChange={(e) => setConfig({
                                ...config,
                                visibleColumns: {
                                  ...config.visibleColumns,
                                  [colKey]: e.target.checked,
                                }
                              })}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <span>{arabicName[colKey]}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Signatures & Footer Note */}
                  <div>
                    <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">تذييل الصفحة والتوقيعات</h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="hasSignatures"
                          checked={header.hasSignatures}
                          onChange={e => setHeader({ ...header, hasSignatures: e.target.checked })}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                        <label htmlFor="hasSignatures" className="text-xs font-bold text-slate-700 cursor-pointer">عرض خانات التوقيعات أسفل الكشف</label>
                      </div>

                      {header.hasSignatures && (
                        <div>
                          <label className="block text-[10px] text-slate-400 mb-1">عناوين التوقيعات (مفصولة بفاصلة)</label>
                          <input
                            type="text"
                            value={header.signatures.join('، ')}
                            onChange={e => setHeader({ 
                              ...header, 
                              signatures: e.target.value.split(/[،,]/).map(s => s.trim()).filter(Boolean)
                            })}
                            className="w-full text-xs p-2 border border-slate-200 rounded-lg"
                            placeholder="توقيع المستلم، الحسابات، الإدارة"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">ملاحظة أسفل الكشف (شروط / تنبيهات)</label>
                        <textarea
                          value={header.additionalNotes}
                          onChange={e => setHeader({ ...header, additionalNotes: e.target.value })}
                          rows={2}
                          className="w-full text-xs p-2 border border-slate-200 rounded-lg resize-none"
                          placeholder="ملاحظات تظهر قبل التوقيعات مباشرة..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Saved & Manage */}
              {activeTab === 'manage' && (
                <div className="space-y-4">
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-indigo-950 leading-relaxed">
                      يتم حفظ كشوفاتك في ذاكرة المتصفح المحلية لتتمكن من الرجوع إليها والتعديل عليها لاحقاً أو طباعتها من جديد.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSaveModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all flex-1 justify-center"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>حفظ الكشف الحالي في القائمة</span>
                    </button>
                  </div>

                  <hr className="border-slate-100" />

                  <h4 className="text-xs font-bold text-slate-600 mb-2">قائمة الكشوفات المحفوظة ({savedStatements.length})</h4>
                  
                  {savedStatements.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      لا يوجد أي كشوفات محفوظة حالياً. انقر على الزر بالأعلى لحفظ كشفك الأول.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {savedStatements.map((saved) => (
                        <div
                          key={saved.id}
                          onClick={() => handleLoadSaved(saved)}
                          className="p-3 border border-slate-200 rounded-lg bg-white hover:border-indigo-500 cursor-pointer transition-all flex items-center justify-between group"
                        >
                          <div className="text-right overflow-hidden">
                            <h5 className="text-xs font-bold text-slate-800 truncate">{saved.name}</h5>
                            <p className="text-[10px] text-slate-400 mt-0.5">آخر تعديل: {saved.updatedAt}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">{saved.header.supplierName} • {saved.rows.length} بنود</p>
                          </div>
                          <button
                            onClick={(e) => handleDeleteSaved(saved.id, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            title="حذف من المحفوظات"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <hr className="border-slate-100" />

                  {/* Export / Import File Buttons */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-600">نسخ احتياطي خارجي</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={handleExportJSON}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 border border-slate-200 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>تصدير كملف JSON</span>
                      </button>

                      <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 border border-slate-200 transition-all cursor-pointer text-center">
                        <Upload className="w-3.5 h-3.5" />
                        <span>استيراد ملف JSON</span>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportJSON}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Footer inside card */}
            <div className="border-t border-slate-100 p-4 bg-slate-50/50 flex gap-2 justify-between">
              <button
                onClick={handlePrint}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-sm shadow-emerald-600/10 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الكشف (A4)</span>
              </button>

              <button
                onClick={handleReset}
                className="text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-bold px-3 py-2.5 rounded-lg flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>بدء كشف فارغ</span>
              </button>
            </div>
          </div>
        </section>

        {/* RIGHT PANEL: Live Printable A4 Page Preview */}
        <section className="w-full lg:flex-1 flex flex-col items-center overflow-x-auto min-h-[500px]">
          {/* Quick info above live preview */}
          <div className="no-print w-full max-w-[210mm] mb-3 flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1.5 font-semibold text-indigo-600">
              <Eye className="w-4 h-4" />
              <span>معاينة ورقة A4 التفاعلية (سيتم طباعتها هكذا تماماً)</span>
            </span>
            <span className="text-[10px] text-slate-400">التحديث تلقائي ولحظي</span>
          </div>

          {/* THE PHYSICAL A4 PAPER REPRESENTATION */}
          <div 
            id="a4-print-area"
            className={`print-page bg-white w-full max-w-[210mm] min-h-[297mm] p-8 md:p-12 shadow-2xl flex flex-col justify-between text-slate-950 select-text relative transition-all ${
              config.themeColor === 'high-density' ? 'border-[12px] border-slate-900 ring-4 ring-offset-4 ring-slate-950/10' : 'border border-slate-200 rounded-lg'
            }`}
            style={{
              fontSize: config.fontSize === 'sm' ? '0.85rem' : config.fontSize === 'lg' ? '1.1rem' : '0.95rem',
              boxSizing: 'border-box',
            }}
          >
            {/* Top accent border bar */}
            <div className={`absolute top-0 left-0 right-0 h-2 rounded-t-lg no-print ${
              config.themeColor === 'classic-gray' ? 'bg-gray-300' :
              config.themeColor === 'royal-blue' ? 'bg-blue-800' :
              config.themeColor === 'emerald-green' ? 'bg-emerald-700' :
              config.themeColor === 'amber-gold' ? 'bg-amber-600' : 'bg-slate-950'
            }`} />

            {/* Watermark/Background stamp (High Density Theme) */}
            {config.themeColor === 'high-density' && (
              <div className="absolute inset-0 opacity-[0.035] pointer-events-none flex items-center justify-center overflow-hidden">
                <div className="text-[100px] font-black border-[12px] border-slate-950 p-8 rotate-12 tracking-widest select-none uppercase text-center leading-tight">
                  {header.rawMaterialType ? header.rawMaterialType : 'SUPPLIER'}
                </div>
              </div>
            )}

            {/* Inner Content Wrapper */}
            <div className="w-full flex-1 flex flex-col">
              
              {/* Header Box (Logo / Company details) */}
              {config.showCompanyHeader && (
                config.themeColor === 'high-density' ? (
                  <div className="flex flex-col sm:flex-row items-center justify-between border-b-4 border-slate-900 pb-5 mb-6 gap-4">
                    <div className="text-right">
                      <h2 className="text-3xl font-black text-slate-900 leading-none">{header.companyName || 'شركة سامكون للإستثمار العقارى والتعمير'}</h2>
                      <p className="text-xs text-slate-500 mt-2">الإدارة المالية</p>
                    </div>
                    
                    {/* Visual Premium Stamp-like logo placeholder (Geometric cross/star frame) */}
                    <div className="w-16 h-16 bg-slate-900 flex items-center justify-center rounded-sm shrink-0 shadow-md">
                      <div className="border-2 border-white w-12 h-12 flex items-center justify-center">
                        <div className="text-white text-base font-black tracking-tighter">{header.logoText ? header.logoText.slice(0, 3) : 'H-D'}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-slate-200 pb-5 mb-6 gap-4">
                    <div className="text-right">
                      <h2 className={`text-lg font-extrabold tracking-tight ${theme.textAccent}`}>{header.companyName || 'شركة سامكون للإستثمار العقارى والتعمير'}</h2>
                      <p className="text-[11px] text-slate-500 mt-1">الإدارة المالية</p>
                    </div>
                    
                    {/* Visual Premium Stamp-like logo placeholder */}
                    <div className={`px-4 py-2.5 rounded-lg border-2 ${theme.border} flex flex-col items-center justify-center bg-slate-50/60 min-w-[120px]`}>
                      <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">شعار الشركة</span>
                      <span className={`text-xs font-black mt-0.5 ${theme.textAccent}`}>{header.logoText || 'الإدارة المالية'}</span>
                    </div>
                  </div>
                )
              )}

              {/* Document Main Heading Title (Centered & Distinguished) */}
              <div className={`w-full py-3 px-6 rounded-xl border-2 text-center shadow-sm mb-6 ${
                config.themeColor === 'high-density' ? 'border-4 border-slate-900 bg-slate-100 text-slate-900' : theme.headerBg
              }`}>
                <h2 className="text-lg md:text-xl font-extrabold tracking-wide">
                  {header.title} {header.supplierName ? `/ ${header.supplierName}` : ''} {header.rawMaterialType ? `( ${header.rawMaterialType} )` : ''}
                </h2>
              </div>

              {/* Statement details bar (Dates, numbers) */}
              {config.themeColor === 'high-density' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-3.5 gap-x-6 pb-6 mb-6 text-xs text-slate-900 border-b-2 border-slate-900">
                  <div className="flex gap-2 items-end">
                    <span className="font-bold text-slate-800 shrink-0">اسم المورد:</span>
                    <div className="border-b border-dotted border-slate-400 w-full pb-0.5 font-black text-slate-900 text-right">{header.supplierName || '—'}</div>
                  </div>
                  <div className="flex gap-2 items-end">
                    <span className="font-bold text-slate-800 shrink-0">نوع الخام:</span>
                    <div className="border-b border-dotted border-slate-400 w-full pb-0.5 font-bold text-slate-900 text-right">{header.rawMaterialType || '—'}</div>
                  </div>
                  {config.showStatementNo && (
                    <div className="flex gap-2 items-end">
                      <span className="font-bold text-slate-800 shrink-0">رقم الكشف:</span>
                      <div className="border-b border-dotted border-slate-400 w-full pb-0.5 font-mono font-bold text-slate-900 text-right">{header.statementNo || '—'}</div>
                    </div>
                  )}
                  {config.showDateRange && (
                    <div className="flex gap-2 items-end">
                      <span className="font-bold text-slate-800 shrink-0">الفترة الزمنية:</span>
                      <div className="border-b border-dotted border-slate-400 w-full pb-0.5 font-bold text-slate-900 text-right">
                        {header.dateFrom ? `من ${header.dateFrom}` : ''} {header.dateTo ? `إلى ${header.dateTo}` : ''}
                        {!header.dateFrom && !header.dateTo ? 'كامل المدة' : ''}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50/80 p-4 rounded-xl border border-slate-100 mb-6 text-xs text-slate-800">
                  <div>
                    <span className="text-slate-400 block font-bold mb-0.5">اسم المورد:</span>
                    <span className="font-extrabold text-slate-900">{header.supplierName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold mb-0.5">نوع الخام:</span>
                    <span className="font-extrabold text-slate-900">{header.rawMaterialType || '—'}</span>
                  </div>
                  {config.showStatementNo && (
                    <div>
                      <span className="text-slate-400 block font-bold mb-0.5">رقم الكشف:</span>
                      <span className="font-mono font-bold text-slate-900">{header.statementNo || '—'}</span>
                    </div>
                  )}
                  {config.showDateRange && (
                    <div>
                      <span className="text-slate-400 block font-bold mb-0.5">فترة الكشف:</span>
                      <span className="font-bold text-slate-900">
                        {header.dateFrom ? `من ${header.dateFrom}` : ''} {header.dateTo ? `إلى ${header.dateTo}` : ''}
                        {!header.dateFrom && !header.dateTo ? 'كامل المدة' : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* TABLE AREA */}
              <div className="w-full overflow-x-auto mb-6">
                <table className={`w-full text-right border-collapse ${
                  config.tableStyle === 'grid' ? 'border border-slate-300' : 'border-b border-slate-200'
                }`}>
                  <thead>
                    <tr className={`border-b border-slate-300 text-xs font-bold ${theme.tableHeader}`}>
                      {config.visibleColumns.date && <th className="p-2.5 border border-slate-300">التاريخ</th>}
                      {config.visibleColumns.rawMaterial && <th className="p-2.5 border border-slate-300">نوع الخام</th>}
                      {config.visibleColumns.quantity && <th className="p-2.5 border border-slate-300 text-left">الكمية</th>}
                      {config.visibleColumns.price && <th className="p-2.5 border border-slate-300 text-left">السعر</th>}
                      {config.visibleColumns.total && <th className="p-2.5 border border-slate-300 text-left">الإجمالي</th>}
                      {config.visibleColumns.costCenter && <th className="p-2.5 border border-slate-300">مركز التكلفة</th>}
                      {config.visibleColumns.notes && <th className="p-2.5 border border-slate-300">ملاحظات</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => {
                      const rowTotal = (row.quantity || 0) * (row.price || 0);
                      return (
                        <tr 
                          key={row.id} 
                          className={`text-xs border-b border-slate-200 transition-colors ${
                            config.tableStyle === 'striped' && index % 2 === 1 ? 'bg-slate-50/80' : ''
                          }`}
                        >
                          {config.visibleColumns.date && (
                            <td className={`p-2.5 ${config.tableStyle === 'grid' ? 'border border-slate-200' : ''} text-slate-600 font-mono whitespace-nowrap`}>
                              {row.date || '—'}
                            </td>
                          )}
                          {config.visibleColumns.rawMaterial && (
                            <td className={`p-2.5 ${config.tableStyle === 'grid' ? 'border border-slate-200' : ''} text-slate-800`}>
                              {row.rawMaterial || '—'}
                            </td>
                          )}
                          {config.visibleColumns.quantity && (
                            <td className={`p-2.5 ${config.tableStyle === 'grid' ? 'border border-slate-200' : ''} text-left font-mono text-slate-800`}>
                              {(row.quantity || 0).toFixed(2)}
                            </td>
                          )}
                          {config.visibleColumns.price && (
                            <td className={`p-2.5 ${config.tableStyle === 'grid' ? 'border border-slate-200' : ''} text-left font-mono text-slate-800`}>
                              {formatCurrency(row.price || 0)}
                            </td>
                          )}
                          {config.visibleColumns.total && (
                            <td className={`p-2.5 ${config.tableStyle === 'grid' ? 'border border-slate-200' : ''} text-left font-mono font-bold text-slate-900`}>
                              {formatCurrency(rowTotal)}
                            </td>
                          )}
                          {config.visibleColumns.costCenter && (
                            <td className={`p-2.5 ${config.tableStyle === 'grid' ? 'border border-slate-200' : ''} font-medium text-slate-800`}>
                              {row.costCenter || '—'}
                            </td>
                          )}
                          {config.visibleColumns.notes && (
                            <td className={`p-2.5 ${config.tableStyle === 'grid' ? 'border border-slate-200' : ''} text-slate-500`}>
                              {row.notes || '—'}
                            </td>
                          )}
                        </tr>
                      );
                    })}

                    {/* General empty rows just to visually balance like the original image if user has very few rows */}
                    {rows.length < 10 && Array.from({ length: Math.max(0, 5 - rows.length) }).map((_, emptyIdx) => (
                      <tr key={`empty-${emptyIdx}`} className="h-8 border-b border-slate-200/50">
                        {config.visibleColumns.date && <td className={`p-2.5 ${config.tableStyle === 'grid' ? 'border border-slate-200' : ''}`} />}
                        {config.visibleColumns.rawMaterial && <td className={`p-2.5 ${config.tableStyle === 'grid' ? 'border border-slate-200' : ''}`} />}
                        {config.visibleColumns.quantity && <td className={`p-2.5 ${config.tableStyle === 'grid' ? 'border border-slate-200' : ''}`} />}
                        {config.visibleColumns.price && <td className={`p-2.5 ${config.tableStyle === 'grid' ? 'border border-slate-200' : ''}`} />}
                        {config.visibleColumns.total && <td className={`p-2.5 ${config.tableStyle === 'grid' ? 'border border-slate-200' : ''}`} />}
                        {config.visibleColumns.costCenter && <td className={`p-2.5 ${config.tableStyle === 'grid' ? 'border border-slate-200' : ''}`} />}
                        {config.visibleColumns.notes && <td className={`p-2.5 ${config.tableStyle === 'grid' ? 'border border-slate-200' : ''}`} />}
                      </tr>
                    ))}

                    {/* Total Sum Row */}
                    <tr className="font-extrabold bg-slate-100 border-t-2 border-slate-300">
                      {/* Raw Material and Date span containing "إجمالي عام" label */}
                      <td 
                        colSpan={(config.visibleColumns.rawMaterial ? 1 : 0) + (config.visibleColumns.date ? 1 : 0)} 
                        className={`p-3 text-center text-xs text-slate-900 font-black ${config.tableStyle === 'grid' ? 'border border-slate-300' : ''}`}
                      >
                        اجمالي عام
                      </td>

                      {/* Total Quantity */}
                      {config.visibleColumns.quantity && (
                        <td className={`p-3 text-left font-mono text-slate-900 ${config.tableStyle === 'grid' ? 'border border-slate-300' : ''}`}>
                          {config.showTotalQuantity ? totalQuantity.toFixed(2) : '—'}
                        </td>
                      )}

                      {/* Price header placeholder */}
                      {config.visibleColumns.price && <td className={`p-3 ${config.tableStyle === 'grid' ? 'border border-slate-300' : ''}`} />}

                      {/* Grand Total Value */}
                      {config.visibleColumns.total && (
                        <td className={`p-3 text-left font-mono text-sm text-slate-900 ${config.tableStyle === 'grid' ? 'border border-slate-300' : ''}`}>
                          {config.showGrandTotal ? formatCurrency(grandTotal) : '—'}
                        </td>
                      )}

                      {/* Cost Center / Notes columns span */}
                      {config.visibleColumns.costCenter && <td className={`p-3 ${config.tableStyle === 'grid' ? 'border border-slate-300' : ''}`} />}
                      {config.visibleColumns.notes && <td className={`p-3 ${config.tableStyle === 'grid' ? 'border border-slate-300' : ''}`} />}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Dynamic tafqeet line */}
              {config.showGrandTotal && (
                <div className="mb-6 p-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-right">
                  <span className="font-extrabold text-slate-500">تفقيط المبلغ الإجمالي:</span>
                  <span className={`mr-2 font-bold ${theme.textAccent}`}>{tafqeet(grandTotal)}</span>
                </div>
              )}

              {/* Additional custom notes */}
              {header.additionalNotes && (
                <div className="mb-6 text-[11px] text-slate-500 leading-relaxed text-right border-r-2 border-slate-200 pr-3">
                  <p>{header.additionalNotes}</p>
                </div>
              )}

            </div>

            {/* Bottom Signature Boxes */}
            {header.hasSignatures && header.signatures.length > 0 && (
              <div className="border-t border-slate-100 pt-8 mt-4">
                <div className="flex flex-row justify-between items-center gap-6">
                  {header.signatures.map((sig, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <span className="text-xs font-bold text-slate-600 mb-2">{sig}</span>
                      {config.themeColor === 'high-density' ? (
                        <div className="w-36 h-14 bg-slate-50/50 border-2 border-slate-900 rounded-sm relative flex items-center justify-center select-none shadow-sm">
                          <span className="text-sm font-mono text-slate-300/80 italic tracking-wider font-extrabold rotate-3">APPROVED</span>
                          <span className="absolute -top-2.5 right-3 text-[9px] text-slate-950 font-black bg-white px-1.5 py-0.5 border border-slate-900 rounded-sm">اعتماد الختم</span>
                        </div>
                      ) : (
                        <div className="w-full border-b border-dashed border-slate-300 mt-4" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Watermark/Footer Date Stamp */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-3 mt-4">
              <span>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</span>
              <span>مُنشئ كشوفات الحسابات المميّزة | ورق قياسي A4</span>
              <span>صفحة ١ من ١</span>
            </div>
          </div>
        </section>

      </main>

      {/* Save to Local List Modal (HIDDEN DURING PRINT) */}
      <AnimatePresence>
        {showSaveModal && (
          <div className="no-print fixed inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl border border-slate-200 shadow-2xl p-6 max-w-md w-full text-right"
            >
              <h3 className="text-sm font-bold text-slate-800 mb-2">حفظ كشف الحساب في المتصفح</h3>
              <p className="text-xs text-slate-400 mb-4">أدخل اسماً مميزاً للكشف حتى يمكنك تمييزه في قائمتك لاحقاً (مثال: كشف رمل إسلام - يونيو ٢٠٢٦).</p>
              
              <input
                type="text"
                placeholder="اسم الكشف للتخزين"
                value={currentSaveName}
                onChange={e => setCurrentSaveName(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                autoFocus
              />

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveToLocalStorage}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-indigo-600/10"
                >
                  حفظ وتخزين
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer info (HIDDEN DURING PRINT) */}
      <footer className="no-print bg-slate-900 border-t border-slate-800 text-slate-500 text-center py-4 text-xs shrink-0">
        <p className="max-w-7xl mx-auto px-4">
          صنع بمثالية لتنسيق ورق الطباعة المعتمد A4. تذكر ضبط إعدادات متصفحك عند طباعة الكشف لإلغاء الرؤوس والتذييلات التلقائية وتفعيل خيار طباعة رسومات الخلفية لطباعة متميزة.
        </p>
      </footer>
    </div>
  );
}
