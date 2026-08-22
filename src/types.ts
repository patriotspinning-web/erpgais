export type Role = 'Store Manager' | 'Super Admin' | 'Quality Officer';

export interface User {
  name: string;
  email: string;
  role: Role;
}

export type ModuleType =
  | 'dashboard'
  | 'cotton-receive'
  | 'cotton-issue'
  | 'cotton-stock'
  | 'cotton-reports'
  | 'waste-receive'
  | 'waste-issue'
  | 'waste-stock'
  | 'waste-reports'
  | 'spare-items'
  | 'spare-receive'
  | 'spare-issue'
  | 'spare-stock'
  | 'spare-reports'
  | 'yarn-receive'
  | 'yarn-issue'
  | 'yarn-stock'
  | 'hvi-reports'
  | 'uster-reports'
  | 'audit-compliance'
  | 'audit-dashboard'
  | 'audit-receives'
  | 'audit-traceability'
  | 'audit-usages'
  | 'audit-schedule'
  | 'audit-certificates'
  | 'audit-reports'
  | 'sample-management'
  | 'accounts-dashboard'
  | 'accounts-receive'
  | 'accounts-expense'
  | 'accounts-daily-summary'
  | 'accounts-monthly-summary'
  | 'accounts-reports'
  | 'accounts-vouchers'
  | 'accounts-income'
  | 'accounts-ledger';

// --- COTTON ---
export interface CottonReceive {
  id: number;
  date: string;
  origin: string;
  supplierName?: string;
  consignment: string;
  fiberLength: string;
  lcNo: string;
  idCode: string;
  lcQuantity: number; // Bales
  actualReceive: number; // Bales
  actualReceiveKg: number; // Kg
  remarks: string;
}

export interface CottonIssue {
  id: number;
  srNo: string;
  date: string;
  origin: string;
  consignment: string;
  processType: string; // Ring, Rotor, Blend
  department: string;
  baleQty: number;
  weightKg: number;
  remarks: string;
}

export interface CottonLotStock {
  consignment: string;
  origin: string;
  supplierName?: string;
  lcNo: string;
  receivedBale: number;
  receivedKg: number;
  issuedBale: number;
  issuedKg: number;
  balanceBale: number;
  balanceKg: number;
  avgKgPerBale: number;
}

// --- WASTAGE ---
export interface WasteReceive {
  id: number;
  date: string;
  category: string;
  receiveFrom: string; // Ring, Rotor, Party, Willow M/C
  quantity: number; // Total Quantity
  weightKg: number; // Total Weight (Kg)
  bales: number; // Number of Bales
  receivedBy: string;
  remarks: string;
}

export interface WasteIssue {
  id: number;
  srNo: string;
  date: string;
  category: string;
  issueTo: string; // Sales, Ring, Rotor, Willow M/C
  issueType: string; // Sale, Reprocess, Disposal, Transfer
  quantity: number; // Total Quantity
  weightKg: number; // Total Weight (Kg)
  bales: number; // Number of Bales
  issuedBy: string;
  remarks: string;
}

export interface WasteCategoryStock {
  category: string;
  receiveFrom: string;
  receivedQty: number;
  receivedKg: number;
  receivedBales: number;
  issuedQty: number;
  issuedKg: number;
  issuedBales: number;
  balanceQty: number;
  balanceKg: number;
  balanceBales: number;
}

// --- SPARE PARTS ---
export type SpareSource = 'Maintenance Import' | 'Local Spare Parts' | 'Electrical Import';

export interface SpareItem {
  id: number;
  name: string;
  partNumber: string;
  section: string;
  source: SpareSource;
  openingStock: number;
  currentStock: number;
  minStock?: number;
  unit: string;
  location?: string;
}

export interface SpareReceive {
  id: number;
  itemId: number;
  mrrNo: string;
  date: string;
  quantity: number;
  unit?: string;
  receivedBy?: string;
  remarks: string;
}

export interface SpareIssue {
  id: number;
  itemId: number;
  srNo: string;
  date: string;
  quantity: number;
  unit?: string;
  issueTo: string;
  issuedBy?: string;
  remarks: string;
}

// --- YARN ---
export interface YarnReceive {
  id: number;
  date: string;
  count: string;
  lotNo: string;
  process: 'Ring' | 'Rotor';
  mixingRatio?: string; // Mixing Ratio (e.g. Cotton 100%, Cotton 80%/Viscose 20%)
  quantity: number; // Kg
  bags: number;
  remarks: string;
}

export interface YarnIssue {
  id: number;
  date: string;
  count: string;
  lotNo: string;
  process: 'Ring' | 'Rotor';
  issueTo: string;
  quantity: number; // Kg
  bags: number;
  remarks: string;
}

export interface YarnStock {
  count: string;
  process: 'Ring' | 'Rotor';
  receivedKg: number;
  issuedKg: number;
  balanceKg: number;
}

// --- QUALITY ---
export interface HVIReport {
  id: number;
  testDate: string;
  consignment: string;
  mic: number; // Micronaire
  uhml: number; // Upper Half Mean Length (in/mm)
  ui: number; // Uniformity Index (%)
  strength: number; // Strength (g/tex)
  elongation: number; // Elongation (%)
  sfi: number; // Short Fiber Index (%)
  moisture: number; // Moisture (%)
  rd: number; // Reflectance
  yellowness: number; // +b
  colorGrade: string;
  trashCnt: number; // Trash Count
  trashAr: number; // Trash Area (%)
  sci: number; // Spinning Consistency Index
  remarks: string;
}

export type UsterStage =
  | 'finished_yarn'
  | 'rotor_yarn'
  | 'ring_yarn'
  | 'simplex_roving'
  | 'f_drawing'
  | 'b_drawing'
  | 'card_sliver';

export interface UsterReport {
  id: number;
  stage?: UsterStage; // Stage: Finished Yarn, Rotor Yarn, Ring Yarn, Simplex Roving, F Drawing, B Drawing, Card Sliver
  uTestId?: string; // U Test ID (e.g. UT-CRD-001, UT-RNG-001)
  testDate: string;
  lotNo: string; // Lot
  mixing?: string; // Mixing / Blend composition
  machine: string; // Machine No
  count?: string; // A. Count (for Ring Yarn & Finished Yarn)
  csp?: number; // Count Strength Product (for Ring Yarn & Finished Yarn)
  unevenness: number; // U%
  cvm: number; // CVm%
  cvm1m?: number; // CVm 1m (for Card Sliver to Simplex Roving)
  cvm3m?: number; // CVm 3m (for Card Sliver to Simplex Roving)
  thinPlaces?: number; // Thin (-50%/km)
  thickPlaces?: number; // Thick (+50%/km)
  neps?: number; // Neps (+200%/km)
  ipi?: number; // Total Imperfection Index (Auto calculated = Thin + Thick + Neps)
  hairiness?: number; // Hairiness H
  process?: 'Ring' | 'Rotor';
  shift?: 'A' | 'B' | 'C' | 'General';
  testedBy?: string;
  remarks: string;
}

// --- AUDIT & COMPLIANCE ---
export type AuditStandard = 'GRS' | 'GOTS' | 'OCS' | 'BCI' | 'ISO' | 'OEKO-TEX' | 'HIGG' | 'Other';
export type AuditStatus = 'Valid' | 'Expiring Soon' | 'Expired' | 'Audit Scheduled' | 'Pending Renewal';

export type ComplianceDocType =
  | 'Transaction Certificate (TC)'
  | 'Scope Certificate'
  | 'Invoice / Challan'
  | 'Packing List'
  | 'Audit Report'
  | 'CAPA Report'
  | 'Test Report'
  | 'Other';

export interface ComplianceDocument {
  id: string;
  name: string;
  type: ComplianceDocType;
  size?: string;
  date: string;
  url?: string;
  notes?: string;
}

export interface CertifiedCottonReceive {
  id: number;
  standard: AuditStandard;
  supplierName: string;
  countryOfOrigin: string;
  cottonDescription: string;
  lotNo: string;
  baleCount: number;
  quantityKg: number;
  receiveDate: string;
  purchaseRef: string;
  tcNumber: string;
  tcQuantityKg: number;
  tcIssueDate: string;
  tcValidityDate?: string;
  invoiceChallanNo: string;
  remarks: string;
  documents?: ComplianceDocument[];
}

export interface CertifiedCottonUsage {
  id: number;
  date: string;
  standard: AuditStandard;
  tcNumber: string;
  lotNo: string;
  buyerName: string;
  orderRef: string;
  yarnCount: string;
  yarnType: string;
  cottonUsedKg: number;
  yarnProducedKg: number;
  wastageKg: number; // cottonUsedKg - yarnProducedKg
  wastagePct: number; // (wastageKg / cottonUsedKg) * 100
  remarks: string;
}

export type AuditType =
  | 'Initial Certification'
  | 'Annual Surveillance'
  | 'Renewal Audit'
  | 'Unannounced Audit'
  | 'Internal Factory Audit'
  | 'Buyer / Customer Audit'
  | 'Environmental / Social';

export type AuditStatusState =
  | 'Upcoming'
  | 'Completed'
  | 'Under Review'
  | 'Corrective Action Pending'
  | 'Closed';

export type CapaStatus = 'Pending' | 'In Progress' | 'Submitted' | 'Verified & Closed' | 'N/A';

export interface AuditRecord {
  id: number;
  standard: AuditStandard;
  auditType: AuditType;
  certifyingBody: string;
  auditorName: string;
  auditDate: string;
  auditPeriod: string;
  status: AuditStatusState;
  findings: string;
  nonConformity?: string;
  ncLevel?: 'None' | 'Minor' | 'Major' | 'Critical';
  correctiveAction?: string;
  capaStatus: CapaStatus;
  nextAuditDueDate: string;
  scoreGrade?: string;
  remarks: string;
  documents?: ComplianceDocument[];
}

export type CertificateStatus = 'Valid' | 'Expiring Soon' | 'Expired' | 'Suspended' | 'In Application';

export interface CertificationRecord {
  id: number;
  standard: AuditStandard;
  certificateNo: string;
  certifyingBody: string;
  scope: string;
  issueDate: string;
  validFrom: string;
  validUntil: string;
  status: CertificateStatus;
  licenseNo?: string;
  contactPerson?: string;
  remarks: string;
  documents?: ComplianceDocument[];
}

export interface AuditItem {
  id: number;
  standard: AuditStandard;
  certificateNo: string;
  certifyingBody: string;
  issueDate: string;
  expiryDate: string;
  status: AuditStatus;
  auditDate: string;
  auditorName: string;
  scope: string;
  scoreGrade: string;
  documentRef?: string;
  remarks: string;
  // Extended fields
  auditType?: string;
  nonConformity?: string;
  correctiveAction?: string;
  capaStatus?: string;
  nextAuditDueDate?: string;
}

// --- SAMPLE MANAGEMENT ---
export type SampleType = 'Spare Parts' | 'Accessories' | 'Cotton Sample' | 'Yarn Sample' | 'Sliver / Roving' | 'Waste / Blend';
export type SampleStatus = 'Pending Testing' | 'Under Evaluation' | 'Approved' | 'Rejected' | 'Delivered to Client';

export interface SampleItem {
  id: number;
  sampleCode: string;
  itemName: string;
  quantity: string;
  installedOn: string; // Date installed on test frame / machine / delivered
  testReport: string; // Test report reference or quality summary
  remarks: string;
  sampleType: SampleType;
  customerBrand: string;
  countLot: string;
  machineFrame: string;
  status: SampleStatus;
  requestedBy: string;

  // HVI Cotton Parameters
  hviMicronaire?: string;
  hviLengthMm?: string;
  hviStrengthGtex?: string;
  hviUniformityIndex?: string;
  hviShortFiberIndex?: string;
  hviTrashPct?: string;
  hviSCI?: string;

  // Uster & Mechanical Performance Parameters (Spare Parts / Accessories / Yarn)
  usterCsp?: string;
  usterUnevennessU?: string;
  usterIpiTotal?: string;
  usterHairinessH?: string;
  usterThin50?: string;
  usterThick50?: string;
  usterNeps200?: string;
  wearResistanceLife?: string;
}

// --- ACCOUNTS & FACTORY CASH MANAGEMENT ---
export type AccountVoucherType = 'Payment' | 'Receipt' | 'Journal' | 'Contra' | 'Receive' | 'Expense';
export type AccountCategory =
  | 'Income'
  | 'Expense'
  | 'Asset'
  | 'Liability'
  | 'Equity'
  | string;
export type PaymentMethod =
  | 'Cash'
  | 'Bank Cheque'
  | 'L/C / Bank TT'
  | 'BEFTN / RTGS'
  | 'Mobile Banking'
  | 'Adjusted / Journal'
  | string;

export interface AccountTransaction {
  id: number;
  voucherNo: string; // e.g. RV-2026-001, PV-2026-001
  date: string; // YYYY-MM-DD
  voucherType: AccountVoucherType; // 'Receipt' | 'Payment' | 'Receive' | 'Expense'
  accountHead?: string; // e.g. Head Office Fund, Wastage Sale, Salary, Maintenance
  category: string; // Income Category or Expense Category
  partyName: string; // Receive From / Source OR Paid To / Supplier
  debit: number; // Expense Amount (Debit / খরচ)
  credit: number; // Receive Amount (Credit / জমা)
  amount: number; // Amount in BDT
  paymentMethod?: PaymentMethod;
  referenceNo?: string; // Cheque No, MR No, Challan No, Money Receipt No
  bankAccount?: string; // e.g. Factory Cash in Hand, Bank
  narration: string; // Description
  remarks?: string; // Additional Remarks
  approvedBy?: string;
  status?: 'Approved' | 'Pending' | 'Draft';
}

export interface AccountHead {
  id: number;
  code: string;
  name: string;
  category: AccountCategory;
  balance: number;
  description?: string;
}

// --- TOAST ---
export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}
