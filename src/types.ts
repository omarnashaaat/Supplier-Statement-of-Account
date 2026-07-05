export interface StatementRow {
  id: string;
  date: string;
  rawMaterial: string;
  quantity: number;
  price: number;
  total: number;
  costCenter: string;
  notes: string;
}

export interface StatementHeader {
  title: string;
  supplierName: string;
  rawMaterialType: string;
  companyName: string;
  logoText: string;
  statementNo: string;
  dateFrom: string;
  dateTo: string;
  phone: string;
  address: string;
  additionalNotes: string;
  hasSignatures: boolean;
  signatures: string[]; // List of signature titles, e.g. ["توقيع المستلم", "توقيع الحسابات", "توقيع المدير"]
}

export interface StatementConfig {
  themeColor: 'classic-gray' | 'royal-blue' | 'emerald-green' | 'amber-gold' | 'minimal-dark' | 'high-density';
  tableStyle: 'grid' | 'clean' | 'striped';
  fontSize: 'sm' | 'base' | 'lg';
  showCompanyHeader: boolean;
  showStatementNo: boolean;
  showDateRange: boolean;
  showTotalQuantity: boolean;
  showGrandTotal: boolean;
  visibleColumns: {
    date: boolean;
    rawMaterial: boolean;
    quantity: boolean;
    price: boolean;
    total: boolean;
    costCenter: boolean;
    notes: boolean;
  };
}

export interface SavedStatement {
  id: string;
  name: string; // Saved name, e.g., "كشف رمل إسلام - يونيو"
  updatedAt: string;
  header: StatementHeader;
  rows: StatementRow[];
  config: StatementConfig;
}
