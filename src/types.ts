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
  | 'sample-management';

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
  | 'card_sliver'
  | 'b_drawing'
  | 'f_drawing'
  | 'simplex_roving'
  | 'ring_yarn'
  | 'finished_yarn';

export interface UsterReport {
  id: number;
  stage?: UsterStage; // Stage: Card Sliver, B Drawing, F Drawing, Simplex Roving, Ring Yarn, Finished Yarn
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
export type AuditStandard = 'GOTS' | 'OCS' | 'ISO' | 'BCI' | 'OEKO-TEX' | 'HIGG' | 'Other';
export type AuditStatus = 'Valid' | 'Expiring Soon' | 'Expired' | 'Audit Scheduled' | 'Pending Renewal';

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

// --- TOAST ---
export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}
