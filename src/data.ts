import { JournalEntry, JournalLine, SavedJournal } from './types';

// Helper to generate IDs
export const generateId = () => Math.random().toString(36).substr(2, 9);

// Chart of Accounts (دليل الحسابات)
export const chartOfAccounts = [
  { code: '1101', name: 'الصندوق - النقدية بالخزينة الرئيسية' },
  { code: '1102', name: 'البنك الأهلي المصري - حساب جاري' },
  { code: '1103', name: 'بنك مصر - حساب العمليات' },
  { code: '1201', name: 'العملاء - شركة بالم هيلز للتطوير' },
  { code: '1202', name: 'العملاء - أوراسكوم للإنشاءات' },
  { code: '1203', name: 'العملاء - شركة طلعت مصطفى' },
  { code: '1301', name: 'عهد الموظفين - عهدة المهندس أحمد السعيد' },
  { code: '1302', name: 'سلف الموظفين - سلفيات العاملين' },
  { code: '1401', name: 'مخازن المواد الخام - أسمنت وحديد' },
  { code: '1501', name: 'الأصول الثابتة - آلات ومعدات موقع' },
  { code: '1502', name: 'الأصول الثابتة - سيارات نقل ثقيل' },
  { code: '2101', name: 'الموردين - شركة السويس للأسمنت' },
  { code: '2102', name: 'الموردين - حديد عز الدخيلة' },
  { code: '2103', name: 'الموردين - شركة مقاولات الباطن (سعد الدين)' },
  { code: '2104', name: 'الموردين - أولاد فوزي للرمل والزلط' },
  { code: '2201', name: 'مصلحة الضرائب - ضريبة القيمة المضافة' },
  { code: '2202', name: 'مصلحة الضرائب - ضريبة كسب العمل' },
  { code: '3101', name: 'إيرادات نشاط المقاولات والتطوير' },
  { code: '3102', name: 'إيرادات تشغيل معدات للغير' },
  { code: '4101', name: 'تكاليف النشاط - أجور ومرتبات عمال الموقع' },
  { code: '4102', name: 'تكاليف النشاط - شراء أسمنت وحديد تسليح' },
  { code: '4103', name: 'تكاليف النشاط - إيجار لودر وحفارات' },
  { code: '4201', name: 'مصروفات عمومية وإدارية - كهرباء ومياه' },
  { code: '4202', name: 'مصروفات عمومية وإدارية - إيجار مقر الشركة الرئيسية' },
];

// Cost Centers (مراكز التكلفة)
export const costCenters = [
  'مشروع ذا كورد - العاصمة الإدارية',
  'مشروع أبراج العلمين الجديدة - المرحلة الثانية',
  'مشروع كمبوند بادية - أكتوبر',
  'مشروع نفق الشهيد أحمد حمدي 2',
  'الفرع الرئيسي - الإدارة العامة للشركة',
  'ورش الصيانة والمعدات المركزية',
];

// Branches (الفروع)
export const branches = [
  'فرع القاهرة الكبرى',
  'فرع الإسكندرية والساحل',
  'فرع الدلتا والقناة',
  'فرع الصعيد والوجه القبلي',
];

// Currencies (العملات)
export const currencies = [
  { code: 'EGP', symbol: 'ج.م', name: 'الجنيه المصري' },
  { code: 'USD', symbol: '$', name: 'الدولار الأمريكي' },
  { code: 'EUR', symbol: '€', name: 'اليورو' },
  { code: 'SAR', symbol: 'ر.س', name: 'الريال السعودي' },
];

// Sample Initial Attachments
export const initialAttachments = [
  {
    id: 'att-1',
    name: 'فاتورة_شراء_أسمنت_رقم_2044.png',
    url: 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=150&auto=format&fit=crop&q=60',
    size: '1.2 MB'
  },
  {
    id: 'att-2',
    name: 'سند_صرف_خزينة_موقع_العلمين.jpg',
    url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=150&auto=format&fit=crop&q=60',
    size: '720 KB'
  }
];

// Initial Balanced Journal Entry (from first screenshot)
export const initialJournalEntry: JournalEntry = {
  id: 'jv-active',
  entryNo: 'JV-2026/0014',
  date: '2026-06-21',
  currency: 'EGP',
  notes: 'قيد تسوية شراء مواد بناء (أسمنت تسليح وحديد) لموقع مشروع أبراج العلمين وموقع العاصمة الإدارية بالتنسيق مع الحسابات المركزية.',
  status: 'balanced',
  attachments: [...initialAttachments],
  lines: [
    {
      id: generateId(),
      debit: 150000,
      credit: 0,
      accountCode: '4102',
      accountName: 'تكاليف النشاط - شراء أسمنت وحديد تسليح',
      costCenter: 'مشروع أبراج العلمين الجديدة - المرحلة الثانية',
      branch: 'فرع الإسكندرية والساحل',
      notes: 'شراء كمية 50 طن أسمنت بورتلاندي لموقع العلمين',
      isApproved: true,
    },
    {
      id: generateId(),
      debit: 0,
      credit: 150000,
      accountCode: '2101',
      accountName: 'الموردين - شركة السويس للأسمنت',
      costCenter: 'الفرع الرئيسي - الإدارة العامة للشركة',
      branch: 'فرع القاهرة الكبرى',
      notes: 'قيمة فاتورة شركة السويس رقم 2044 الآجلة',
      isApproved: true,
    },
    {
      id: generateId(),
      debit: 45000,
      credit: 0,
      accountCode: '4101',
      accountName: 'تكاليف النشاط - أجور ومرتبات عمال الموقع',
      costCenter: 'مشروع ذا كورد - العاصمة الإدارية',
      branch: 'فرع القاهرة الكبرى',
      notes: 'صرف دفعة تحت الحساب لعمال صب الخرسانة بالأسبوع الثالث',
      isApproved: true,
    },
    {
      id: generateId(),
      debit: 0,
      credit: 45000,
      accountCode: '1101',
      accountName: 'الصندوق - النقدية بالخزينة الرئيسية',
      costCenter: 'الفرع الرئيسي - الإدارة العامة للشركة',
      branch: 'فرع القاهرة الكبرى',
      notes: 'صرف نقدي بموجب سند صرف رقم 482 عهدة م. أحمد السعيد',
      isApproved: true,
    }
  ]
};

// Historical Saved Entries (for Search/Filter and templates)
export const initialSavedJournals: SavedJournal[] = [
  {
    id: 'sj-1',
    name: 'قيد تسوية أسمنت العلمين',
    updatedAt: '2026-06-21 11:43',
    entry: { ...initialJournalEntry }
  },
  {
    id: 'sj-2',
    name: 'قيد رواتب موظفي الإدارة - مايو 2026',
    updatedAt: '2026-05-31 16:30',
    entry: {
      id: 'jv-saved-2',
      entryNo: 'JV-2026/0010',
      date: '2026-05-31',
      currency: 'EGP',
      notes: 'قيد إثبات وصرف رواتب موظفي وعاملي الإدارة المركزية والمهندسين لشهر مايو 2026.',
      status: 'approved',
      attachments: [],
      lines: [
        {
          id: generateId(),
          debit: 120000,
          credit: 0,
          accountCode: '4101',
          accountName: 'تكاليف النشاط - أجور ومرتبات عمال الموقع',
          costCenter: 'الفرع الرئيسي - الإدارة العامة للشركة',
          branch: 'فرع القاهرة الكبرى',
          notes: 'رواتب مهندسي المواقع لشهر مايو',
          isApproved: true,
        },
        {
          id: generateId(),
          debit: 0,
          credit: 120000,
          accountCode: '1102',
          accountName: 'البنك الأهلي المصري - حساب جاري',
          costCenter: 'الفرع الرئيسي - الإدارة العامة للشركة',
          branch: 'فرع القاهرة الكبرى',
          notes: 'تحويل بنكي لرواتب المهندسين - البنك الأهلي',
          isApproved: true,
        }
      ]
    }
  },
  {
    id: 'sj-3',
    name: 'إثبات دفعة عملاء كمبوند بادية',
    updatedAt: '2026-06-15 09:15',
    entry: {
      id: 'jv-saved-3',
      entryNo: 'JV-2026/0012',
      date: '2026-06-15',
      currency: 'EGP',
      notes: 'إثبات تحصيل دفعة الحجز الأولى من العميل بالم هيلز بخصوص مستخلص رقم 4.',
      status: 'approved',
      attachments: [],
      lines: [
        {
          id: generateId(),
          debit: 500000,
          credit: 0,
          accountCode: '1102',
          accountName: 'البنك الأهلي المصري - حساب جاري',
          costCenter: 'الفرع الرئيسي - الإدارة العامة للشركة',
          branch: 'فرع القاهرة الكبرى',
          notes: 'تحصيل شيك بالم هيلز في البنك الأهلي',
          isApproved: true,
        },
        {
          id: generateId(),
          debit: 0,
          credit: 500000,
          accountCode: '3101',
          accountName: 'إيرادات نشاط المقاولات والتطوير',
          costCenter: 'مشروع كمبوند بادية - أكتوبر',
          branch: 'فرع الجيزة',
          notes: 'مستخلص صب خرسانة رقم 4 - بالم هيلز',
          isApproved: true,
        }
      ]
    }
  }
];

// Helper to format currency values to Arabic Style (e.g., 150,000.00 ج.م)
export function formatCurrency(value: number, currencyCode: string = 'EGP'): string {
  const formatter = new Intl.NumberFormat('ar-EG', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  const symbol = currencyCode === 'EGP' ? 'ج.م' : currencyCode === 'USD' ? '$' : currencyCode === 'EUR' ? '€' : currencyCode;
  return `${formatter.format(value)} ${symbol}`;
}

// Full Tafqeet implementation for converting numbers into elegant Arabic financial narration text
export function tafqeet(num: number): string {
  if (num === 0) return 'صفر جنيه فقط لا غير';

  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  const thousands = ['', 'ألف', 'ألفان', 'ثلاثة آلاف', 'أربعة آلاف', 'خمسة آلاف', 'ستة آلاف', 'سبعة آلاف', 'ثمانية آلاف', 'تسعة آلاف'];

  let result = '';

  const parts = Math.floor(num).toString().padStart(6, '0').split('');
  
  const th100 = parseInt(parts[0]);
  const th10 = parseInt(parts[1]);
  const th1 = parseInt(parts[2]);
  const h100 = parseInt(parts[3]);
  const h10 = parseInt(parts[4]);
  const h1 = parseInt(parts[5]);

  // Thousands part
  let thValue = th100 * 100000 + th10 * 10000 + th1 * 1000;
  if (thValue > 0) {
    if (th100 > 0) {
      result += (th100 === 1 ? 'مائة' : th100 === 2 ? 'مائتان' : ones[th100] + 'مائة');
      if (th10 > 0 || th1 > 0) result += ' و ';
    }
    
    if (th10 === 1) {
      if (th1 === 0) result += 'عشرة';
      else if (th1 === 1) result += 'أحد عشر';
      else if (th1 === 2) result += 'اثنا عشر';
      else result += ones[th1] + ' عشر';
    } else {
      if (th1 > 0) result += ones[th1];
      if (th10 > 0) {
        if (th1 > 0) result += ' و ';
        result += tens[th10];
      }
    }

    if (thValue === 1000) result = 'ألف';
    else if (thValue === 2000) result = 'ألفان';
    else if (thValue >= 3000 && thValue <= 10000) result += ' آلاف';
    else result += ' ألفاً';
  }

  // Hundreds part
  let hValue = h100 * 100 + h10 * 10 + h1;
  if (hValue > 0) {
    if (result !== '') result += ' و ';
    if (h100 > 0) {
      result += (h100 === 1 ? 'مائة' : h100 === 2 ? 'مائتان' : ones[h100] + 'مائة');
      if (h10 > 0 || h1 > 0) result += ' و ';
    }

    if (h10 === 1) {
      if (h1 === 0) result += 'عشرة';
      else if (h1 === 1) result += 'أحد عشر';
      else if (h1 === 2) result += 'اثنا عشر';
      else result += ones[h1] + ' عشر';
    } else {
      if (h1 > 0) result += ones[h1];
      if (h10 > 0) {
        if (h1 > 0) result += ' و ';
        result += tens[h10];
      }
    }
  }

  // Decimal coins (Piastres)
  const cents = Math.round((num - Math.floor(num)) * 100);
  let centsStr = '';
  if (cents > 0) {
    centsStr = ` و ${cents} قرشاً`;
  }

  return `فقط قدره ${result} جنيهًا مصريًا${centsStr} لا غير`;
}
