import { SavedStatement, StatementConfig, StatementHeader, StatementRow } from './types';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Default Configuration
export const defaultConfig: StatementConfig = {
  themeColor: 'classic-gray',
  tableStyle: 'grid',
  fontSize: 'base',
  showCompanyHeader: true,
  showStatementNo: true,
  showDateRange: true,
  showTotalQuantity: true,
  showGrandTotal: true,
  visibleColumns: {
    date: true,
    rawMaterial: true,
    quantity: true,
    price: true,
    total: true,
    costCenter: true,
    notes: true,
  },
};

// Default Header (Islam Abu Salib template)
export const defaultHeader: StatementHeader = {
  title: 'كشف حساب المورد',
  supplierName: 'اسلام ابو صليب',
  rawMaterialType: 'رمل',
  companyName: 'شركة سامكون للإستثمار العقارى والتعمير',
  logoText: 'الإدارة المالية',
  statementNo: 'STA-2026-0012',
  dateFrom: '2026-06-26',
  dateTo: '2026-06-30',
  phone: '',
  address: '',
  additionalNotes: 'برجاء مراجعة الحساب والتوقيع بالاعتماد في نهاية الكشف لتسوية المستحقات.',
  hasSignatures: true,
  signatures: ['توقيع المستلم', 'المراجع المالي', 'اعتماد الإدارة'],
};

// Default Rows (User's Exact Example)
export const defaultRows: StatementRow[] = [
  {
    id: generateId(),
    date: '2026-06-26',
    rawMaterial: 'رمل',
    quantity: 60.00,
    price: 195.00,
    total: 11700.00,
    costCenter: 'مشروع ذا كورد',
    notes: '',
  },
  {
    id: generateId(),
    date: '2026-06-26',
    rawMaterial: 'رمل',
    quantity: 60.00,
    price: 195.00,
    total: 11700.00,
    costCenter: 'مشروع ذا كورد',
    notes: '',
  },
  {
    id: generateId(),
    date: '2026-06-27',
    rawMaterial: 'رمل',
    quantity: 60.00,
    price: 195.00,
    total: 11700.00,
    costCenter: 'مشروع ذا كورد',
    notes: '',
  },
  {
    id: generateId(),
    date: '2026-06-27',
    rawMaterial: 'رمل',
    quantity: 60.00,
    price: 195.00,
    total: 11700.00,
    costCenter: 'مشروع ذا كورد',
    notes: '',
  },
  {
    id: generateId(),
    date: '2026-06-28',
    rawMaterial: 'رمل',
    quantity: 60.00,
    price: 195.00,
    total: 11700.00,
    costCenter: 'مشروع ذا كورد',
    notes: '',
  },
  {
    id: generateId(),
    date: '2026-06-29',
    rawMaterial: 'رمل',
    quantity: 60.00,
    price: 195.00,
    total: 11700.00,
    costCenter: 'مشروع ذا كورد',
    notes: '',
  },
  {
    id: generateId(),
    date: '2026-06-29',
    rawMaterial: 'رمل',
    quantity: 60.00,
    price: 195.00,
    total: 11700.00,
    costCenter: 'مشروع ذا كورد',
    notes: '',
  },
  {
    id: generateId(),
    date: '2026-06-30',
    rawMaterial: 'رمل',
    quantity: 60.00,
    price: 195.00,
    total: 11700.00,
    costCenter: 'مشروع ذا كورد',
    notes: '',
  },
];

// Predefined Templates
export const templates: { name: string; icon: string; header: StatementHeader; rows: StatementRow[]; config: StatementConfig }[] = [
  {
    name: 'كشف حساب إسلام أبو صليب (رمل)',
    icon: '🏗️',
    header: defaultHeader,
    rows: defaultRows,
    config: defaultConfig,
  },
  {
    name: 'كشف توريد أسمنت بورتلاندي',
    icon: '🧱',
    header: {
      title: 'كشف حساب المورد',
      supplierName: 'الشركة العربية للأسمنت',
      rawMaterialType: 'أسمنت بورتلاندي',
      companyName: 'مؤسسة الإنشاءات الفنية للتعمير',
      logoText: 'رؤية معمارية',
      statementNo: 'STA-2026-0045',
      dateFrom: '2026-06-01',
      dateTo: '2026-06-15',
      phone: '01239876543',
      address: 'الجيزة، الشيخ زايد',
      additionalNotes: 'الأسعار شاملة التوصيل والضريبة المطبقة والتحميل بالموقع.',
      hasSignatures: true,
      signatures: ['أمين المستودع', 'المراجع الهندسي', 'المدير المالي'],
    },
    config: {
      ...defaultConfig,
      themeColor: 'royal-blue',
    },
    rows: [
      {
        id: generateId(),
        date: '2026-06-01',
        rawMaterial: 'أسمنت مقاوم',
        quantity: 12.00,
        price: 2100.00,
        total: 25200.00,
        costCenter: 'مشروع فيلا دجلة',
        notes: 'دفعة صب الأساسات',
      },
      {
        id: generateId(),
        date: '2026-06-05',
        rawMaterial: 'أسمنت عادي',
        quantity: 25.00,
        price: 1950.00,
        total: 48750.00,
        costCenter: 'مشروع مول أكتوبر',
        notes: 'توريد تشطيبات',
      },
      {
        id: generateId(),
        date: '2026-06-10',
        rawMaterial: 'أسمنت عادي',
        quantity: 15.00,
        price: 1950.00,
        total: 29250.00,
        costCenter: 'مشروع فيلا دجلة',
        notes: 'توريد حوائط ومباني',
      },
    ],
  },
  {
    name: 'كشف توريد حديد تسليح',
    icon: '⚡',
    header: {
      title: 'بيان توريدات الحديد',
      supplierName: 'حديد عز للتجارة',
      rawMaterialType: 'حديد تسليح',
      companyName: 'سكاي لاين للمقاولات الحديثة',
      logoText: 'SkyLine',
      statementNo: 'STA-2026-0110',
      dateFrom: '2026-06-15',
      dateTo: '2026-06-25',
      phone: '01509988771',
      address: 'القاهرة الجديدة، التجمع الخامس',
      additionalNotes: 'تم الاستلام بوزن البسكول المعتمد للشركة.',
      hasSignatures: true,
      signatures: ['المهندس المنفذ', 'المدير الفني', 'المدير العام'],
    },
    config: {
      ...defaultConfig,
      themeColor: 'amber-gold',
    },
    rows: [
      {
        id: generateId(),
        date: '2026-06-15',
        rawMaterial: 'حديد 16 مم',
        quantity: 5.50,
        price: 38500.00,
        total: 211750.00,
        costCenter: 'مشروع برج النور',
        notes: 'مرحلة صب أعمدة البدروم',
      },
      {
        id: generateId(),
        date: '2026-06-22',
        rawMaterial: 'حديد 12 مم',
        quantity: 4.20,
        price: 38500.00,
        total: 161700.00,
        costCenter: 'مشروع برج النور',
        notes: 'مرحلة سقف البدروم',
      },
    ],
  },
];

// Helper: Format Currencies elegantly in Arabic format (e.g. 11,700.00)
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Helper: Arabic number to Arabic words (Tafqeet)
export function tafqeet(num: number): string {
  if (num === 0) return 'صفر جنيه فقط لا غير';

  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  const thousands = ['', 'ألف', 'ألفان', 'ثلاثة آلاف', 'أربعة آلاف', 'خمسة آلاف', 'ستة آلاف', 'سبعة آلاف', 'ثمانية آلاف', 'تسعة آلاف'];

  let result = '';

  const parts = Math.floor(num).toString().padStart(6, '0').split('');
  
  // Handling standard numbers under 1,000,000
  // Index map for 6-digit: [100k, 10k, 1k, 100, 10, 1]
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
