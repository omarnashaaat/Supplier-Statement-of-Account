export interface JournalLine {
  id: string;
  debit: number;   // مدين
  credit: number;  // دائن
  accountCode: string; // رقم الحساب
  accountName: string; // اسم الحساب
  costCenter: string;  // مركز التكلفة
  branch: string;      // الفرع / المشروع
  notes: string;       // البيان / الوصف
  isApproved?: boolean; // اعتماد السطر
}

export interface JournalEntry {
  id: string;
  entryNo: string;     // رقم القيد
  date: string;        // تاريخ القيد
  currency: string;    // العملة
  notes: string;       // ملاحظات عامة
  status: 'draft' | 'balanced' | 'approved' | 'posted';
  attachments: { id: string; name: string; url: string; size: string }[];
  lines: JournalLine[];
}

export interface SystemConfig {
  darkMode: boolean;
  companyName: string;
  logoType: 'default' | 'custom' | 'none';
  logoUrl: string;
}

export interface SavedJournal {
  id: string;
  name: string;
  updatedAt: string;
  entry: JournalEntry;
}
