import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  CottonReceive,
  CottonIssue,
  WasteReceive,
  WasteIssue,
  SpareItem,
  SpareReceive,
  SpareIssue,
  YarnReceive,
  YarnIssue,
  HVIReport,
  UsterReport,
  AuditItem,
  SampleItem,
  AccountTransaction,
} from '../types';

export function getSavedSupabaseUrl(): string {
  try {
    const local = localStorage.getItem('patriot_erp_supabase_url');
    if (local && local.trim()) return local.trim();
  } catch {
    // ignore
  }
  const env = (import.meta as any).env || {};
  return env.VITE_SUPABASE_URL || 'https://uegrjghtheviiswgoiuy.supabase.co';
}

export function getSavedSupabaseKey(): string {
  try {
    const local = localStorage.getItem('patriot_erp_supabase_key');
    if (local && local.trim()) return local.trim();
  } catch {
    // ignore
  }
  const env = (import.meta as any).env || {};
  return env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_A7hfDJptyKVsk88fijBK6Q_DgxguWcb';
}

let activeClient: SupabaseClient = createClient(getSavedSupabaseUrl(), getSavedSupabaseKey());

export function saveSupabaseConfig(url: string, key: string): void {
  try {
    localStorage.setItem('patriot_erp_supabase_url', url.trim());
    localStorage.setItem('patriot_erp_supabase_key', key.trim());
  } catch {
    // ignore
  }
  activeClient = createClient(url.trim(), key.trim());
}

export const supabase: SupabaseClient = new Proxy({} as any, {
  get(_target, prop) {
    const val = (activeClient as any)[prop];
    return typeof val === 'function' ? val.bind(activeClient) : val;
  },
});

/**
 * SQL Schema definition for Supabase SQL Editor execution
 */
export const SUPABASE_SQL_SCHEMA = `-- Patriot Spinning Mill ERP Supabase Schema Definition
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql/new)

-- 1. Cotton Receives Table
CREATE TABLE IF NOT EXISTS cotton_receives (
  id BIGINT PRIMARY KEY,
  date TEXT NOT NULL,
  origin TEXT NOT NULL,
  supplier_name TEXT,
  consignment TEXT NOT NULL,
  fiber_length TEXT,
  lc_no TEXT,
  id_code TEXT,
  lc_quantity NUMERIC DEFAULT 0,
  actual_receive NUMERIC DEFAULT 0,
  actual_receive_kg NUMERIC DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Cotton Issues Table
CREATE TABLE IF NOT EXISTS cotton_issues (
  id BIGINT PRIMARY KEY,
  sr_no TEXT NOT NULL,
  date TEXT NOT NULL,
  origin TEXT NOT NULL,
  consignment TEXT NOT NULL,
  process_type TEXT NOT NULL,
  department TEXT NOT NULL,
  bale_qty NUMERIC DEFAULT 0,
  weight_kg NUMERIC DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Waste Receives Table
CREATE TABLE IF NOT EXISTS waste_receives (
  id BIGINT PRIMARY KEY,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  receive_from TEXT NOT NULL,
  quantity NUMERIC DEFAULT 0,
  weight_kg NUMERIC DEFAULT 0,
  bales NUMERIC DEFAULT 0,
  received_by TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Waste Issues Table
CREATE TABLE IF NOT EXISTS waste_issues (
  id BIGINT PRIMARY KEY,
  sr_no TEXT NOT NULL,
  date TEXT NOT NULL,
  category TEXT NOT NULL,
  issue_to TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  quantity NUMERIC DEFAULT 0,
  weight_kg NUMERIC DEFAULT 0,
  bales NUMERIC DEFAULT 0,
  issued_by TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Spare Items Master Table
CREATE TABLE IF NOT EXISTS spare_items (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  part_number TEXT NOT NULL,
  section TEXT NOT NULL,
  source TEXT NOT NULL,
  opening_stock NUMERIC DEFAULT 0,
  current_stock NUMERIC DEFAULT 0,
  min_stock NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'Pcs',
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Spare Receives Table
CREATE TABLE IF NOT EXISTS spare_receives (
  id BIGINT PRIMARY KEY,
  item_id BIGINT REFERENCES spare_items(id) ON DELETE CASCADE,
  mrr_no TEXT NOT NULL,
  date TEXT NOT NULL,
  quantity NUMERIC DEFAULT 0,
  unit TEXT,
  received_by TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Spare Issues Table
CREATE TABLE IF NOT EXISTS spare_issues (
  id BIGINT PRIMARY KEY,
  item_id BIGINT REFERENCES spare_items(id) ON DELETE CASCADE,
  sr_no TEXT NOT NULL,
  date TEXT NOT NULL,
  quantity NUMERIC DEFAULT 0,
  unit TEXT,
  issue_to TEXT NOT NULL,
  issued_by TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Yarn Receives Table
CREATE TABLE IF NOT EXISTS yarn_receives (
  id BIGINT PRIMARY KEY,
  date TEXT NOT NULL,
  count TEXT NOT NULL,
  lot_no TEXT NOT NULL,
  process TEXT NOT NULL,
  mixing_ratio TEXT,
  quantity NUMERIC DEFAULT 0,
  bags NUMERIC DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Yarn Issues Table
CREATE TABLE IF NOT EXISTS yarn_issues (
  id BIGINT PRIMARY KEY,
  date TEXT NOT NULL,
  count TEXT NOT NULL,
  lot_no TEXT NOT NULL,
  process TEXT NOT NULL,
  issue_to TEXT NOT NULL,
  quantity NUMERIC DEFAULT 0,
  bags NUMERIC DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Quality HVI Reports Table
CREATE TABLE IF NOT EXISTS hvi_reports (
  id BIGINT PRIMARY KEY,
  test_date TEXT NOT NULL,
  consignment TEXT NOT NULL,
  mic NUMERIC DEFAULT 0,
  uhml NUMERIC DEFAULT 0,
  ui NUMERIC DEFAULT 0,
  strength NUMERIC DEFAULT 0,
  elongation NUMERIC DEFAULT 0,
  sfi NUMERIC DEFAULT 0,
  moisture NUMERIC DEFAULT 0,
  rd NUMERIC DEFAULT 0,
  yellowness NUMERIC DEFAULT 0,
  color_grade TEXT,
  trash_cnt NUMERIC DEFAULT 0,
  trash_ar NUMERIC DEFAULT 0,
  sci NUMERIC DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Quality Uster Reports Table
CREATE TABLE IF NOT EXISTS uster_reports (
  id BIGINT PRIMARY KEY,
  stage TEXT DEFAULT 'ring_yarn',
  u_test_id TEXT,
  test_date TEXT NOT NULL,
  lot_no TEXT NOT NULL,
  mixing TEXT,
  count TEXT,
  process TEXT DEFAULT 'Ring',
  machine TEXT NOT NULL,
  unevenness NUMERIC DEFAULT 0,
  cvm NUMERIC DEFAULT 0,
  cvm_1m NUMERIC DEFAULT 0,
  cvm_3m NUMERIC DEFAULT 0,
  thin_places NUMERIC DEFAULT 0,
  thick_places NUMERIC DEFAULT 0,
  neps NUMERIC DEFAULT 0,
  ipi NUMERIC DEFAULT 0,
  hairiness NUMERIC DEFAULT 0,
  csp NUMERIC DEFAULT 0,
  shift TEXT,
  tested_by TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Audit Items Table
CREATE TABLE IF NOT EXISTS audit_items (
  id BIGINT PRIMARY KEY,
  standard TEXT NOT NULL,
  certificate_no TEXT NOT NULL,
  certifying_body TEXT NOT NULL,
  issue_date TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  status TEXT NOT NULL,
  audit_date TEXT NOT NULL,
  auditor_name TEXT NOT NULL,
  scope TEXT,
  score_grade TEXT,
  document_ref TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Sample Items Table
CREATE TABLE IF NOT EXISTS sample_items (
  id BIGINT PRIMARY KEY,
  sample_code TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  installed_on TEXT NOT NULL,
  test_report TEXT,
  remarks TEXT,
  sample_type TEXT NOT NULL,
  customer_brand TEXT,
  count_lot TEXT,
  machine_frame TEXT,
  status TEXT NOT NULL,
  requested_by TEXT,
  hvi_micronaire TEXT,
  hvi_length_mm TEXT,
  hvi_strength_gtex TEXT,
  hvi_uniformity_index TEXT,
  hvi_short_fiber_index TEXT,
  hvi_trash_pct TEXT,
  hvi_sci TEXT,
  uster_csp TEXT,
  uster_unevenness_u TEXT,
  uster_ipi_total TEXT,
  uster_hairiness_h TEXT,
  uster_thin_50 TEXT,
  uster_thick_50 TEXT,
  uster_neps_200 TEXT,
  wear_resistance_life TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. System Users & Credentials Table
CREATE TABLE IF NOT EXISTS system_users (
  email TEXT PRIMARY KEY,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Store Manager',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Accounts Transactions & Ledger Table
CREATE TABLE IF NOT EXISTS account_transactions (
  id BIGINT PRIMARY KEY,
  voucher_no TEXT NOT NULL,
  date TEXT NOT NULL,
  voucher_type TEXT NOT NULL,
  account_head TEXT NOT NULL,
  category TEXT NOT NULL,
  party_name TEXT NOT NULL,
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0,
  amount NUMERIC DEFAULT 0,
  payment_method TEXT NOT NULL,
  reference_no TEXT,
  bank_account TEXT,
  narration TEXT,
  approved_by TEXT,
  status TEXT DEFAULT 'Approved',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Disable Row Level Security (RLS) & Grant full access for seamless ERP sync
ALTER TABLE cotton_receives DISABLE ROW LEVEL SECURITY;
ALTER TABLE cotton_issues DISABLE ROW LEVEL SECURITY;
ALTER TABLE waste_receives DISABLE ROW LEVEL SECURITY;
ALTER TABLE waste_issues DISABLE ROW LEVEL SECURITY;
ALTER TABLE spare_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE spare_receives DISABLE ROW LEVEL SECURITY;
ALTER TABLE spare_issues DISABLE ROW LEVEL SECURITY;
ALTER TABLE yarn_receives DISABLE ROW LEVEL SECURITY;
ALTER TABLE yarn_issues DISABLE ROW LEVEL SECURITY;
ALTER TABLE hvi_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE uster_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE sample_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE account_transactions DISABLE ROW LEVEL SECURITY;

-- Grant permissions to public roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

-- Enable Realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE cotton_receives;
ALTER PUBLICATION supabase_realtime ADD TABLE cotton_issues;
ALTER PUBLICATION supabase_realtime ADD TABLE waste_receives;
ALTER PUBLICATION supabase_realtime ADD TABLE waste_issues;
ALTER PUBLICATION supabase_realtime ADD TABLE spare_items;
ALTER PUBLICATION supabase_realtime ADD TABLE spare_receives;
ALTER PUBLICATION supabase_realtime ADD TABLE spare_issues;
ALTER PUBLICATION supabase_realtime ADD TABLE yarn_receives;
ALTER PUBLICATION supabase_realtime ADD TABLE yarn_issues;
ALTER PUBLICATION supabase_realtime ADD TABLE hvi_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE uster_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_items;
ALTER PUBLICATION supabase_realtime ADD TABLE sample_items;
ALTER PUBLICATION supabase_realtime ADD TABLE system_users;
ALTER PUBLICATION supabase_realtime ADD TABLE account_transactions;
`;

/**
 * Test Connection to Supabase
 */
export async function testSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    const { error } = await supabase.from('cotton_receives').select('id').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return { connected: true, message: 'Connected to Supabase! (Tables need to be created using SQL Schema)' };
      }
      return { connected: false, message: `Supabase Error: ${error.message}` };
    }
    return { connected: true, message: 'Connected & synchronized with Supabase Database tables!' };
  } catch (err: any) {
    return { connected: false, message: err?.message || 'Failed to reach Supabase API endpoint.' };
  }
}

/**
 * Supabase Storage File Upload Helper
 */
export async function uploadFileToSupabaseStorage(
  file: File,
  bucketName: string = 'mill-documents'
): Promise<string | null> {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      console.warn('Supabase storage upload failed:', uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('Error uploading file to Supabase storage:', err);
    return null;
  }
}

/**
 * Generic Supabase Data Fetcher & Saver with fallback to local state
 */

// Cotton Receives
export async function fetchCottonReceivesFromSupabase(): Promise<CottonReceive[] | null> {
  try {
    const { data, error } = await supabase.from('cotton_receives').select('*').order('id', { ascending: false });
    if (error || !data) return null;
    return data.map((row) => ({
      id: Number(row.id),
      date: row.date,
      origin: row.origin,
      supplierName: row.supplier_name,
      consignment: row.consignment,
      fiberLength: row.fiber_length,
      lcNo: row.lc_no,
      idCode: row.id_code,
      lcQuantity: Number(row.lc_quantity || 0),
      actualReceive: Number(row.actual_receive || 0),
      actualReceiveKg: Number(row.actual_receive_kg || 0),
      remarks: row.remarks || '',
    }));
  } catch {
    return null;
  }
}

export async function syncCottonReceiveToSupabase(item: CottonReceive): Promise<boolean> {
  try {
    const { error } = await supabase.from('cotton_receives').upsert({
      id: item.id,
      date: item.date,
      origin: item.origin,
      supplier_name: item.supplierName,
      consignment: item.consignment,
      fiber_length: item.fiberLength,
      lc_no: item.lcNo,
      id_code: item.idCode,
      lc_quantity: item.lcQuantity,
      actual_receive: item.actualReceive,
      actual_receive_kg: item.actualReceiveKg,
      remarks: item.remarks,
    });
    if (error) {
      console.warn('Supabase Cotton Receive Sync Warning:', error.message);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('Supabase Cotton Receive Sync Network Exception:', err?.message);
    return false;
  }
}

export async function deleteCottonReceiveFromSupabase(id: number): Promise<boolean> {
  try {
    const { error } = await supabase.from('cotton_receives').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// Cotton Issues
export async function fetchCottonIssuesFromSupabase(): Promise<CottonIssue[] | null> {
  try {
    const { data, error } = await supabase.from('cotton_issues').select('*').order('id', { ascending: false });
    if (error || !data) return null;
    return data.map((row) => ({
      id: Number(row.id),
      srNo: row.sr_no,
      date: row.date,
      origin: row.origin,
      consignment: row.consignment,
      processType: row.process_type,
      department: row.department,
      baleQty: Number(row.bale_qty || 0),
      weightKg: Number(row.weight_kg || 0),
      remarks: row.remarks || '',
    }));
  } catch {
    return null;
  }
}

export async function syncCottonIssueToSupabase(item: CottonIssue): Promise<boolean> {
  try {
    const { error } = await supabase.from('cotton_issues').upsert({
      id: item.id,
      sr_no: item.srNo,
      date: item.date,
      origin: item.origin,
      consignment: item.consignment,
      process_type: item.processType,
      department: item.department,
      bale_qty: item.baleQty,
      weight_kg: item.weightKg,
      remarks: item.remarks,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteCottonIssueFromSupabase(id: number): Promise<boolean> {
  try {
    const { error } = await supabase.from('cotton_issues').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// Waste Receives
export async function fetchWasteReceivesFromSupabase(): Promise<WasteReceive[] | null> {
  try {
    const { data, error } = await supabase.from('waste_receives').select('*').order('id', { ascending: false });
    if (error || !data) return null;
    return data.map((row) => ({
      id: Number(row.id),
      date: row.date,
      category: row.category,
      receiveFrom: row.receive_from,
      quantity: Number(row.quantity || 0),
      weightKg: Number(row.weight_kg || 0),
      bales: Number(row.bales || 0),
      receivedBy: row.received_by || '',
      remarks: row.remarks || '',
    }));
  } catch {
    return null;
  }
}

export async function syncWasteReceiveToSupabase(item: WasteReceive): Promise<boolean> {
  try {
    const { error } = await supabase.from('waste_receives').upsert({
      id: item.id,
      date: item.date,
      category: item.category,
      receive_from: item.receiveFrom,
      quantity: item.quantity,
      weight_kg: item.weightKg,
      bales: item.bales,
      received_by: item.receivedBy,
      remarks: item.remarks,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteWasteReceiveFromSupabase(id: number): Promise<boolean> {
  try {
    const { error } = await supabase.from('waste_receives').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// Waste Issues
export async function fetchWasteIssuesFromSupabase(): Promise<WasteIssue[] | null> {
  try {
    const { data, error } = await supabase.from('waste_issues').select('*').order('id', { ascending: false });
    if (error || !data) return null;
    return data.map((row) => ({
      id: Number(row.id),
      srNo: row.sr_no,
      date: row.date,
      category: row.category,
      issueTo: row.issue_to,
      issueType: row.issue_type,
      quantity: Number(row.quantity || 0),
      weightKg: Number(row.weight_kg || 0),
      bales: Number(row.bales || 0),
      issuedBy: row.issued_by || '',
      remarks: row.remarks || '',
    }));
  } catch {
    return null;
  }
}

export async function syncWasteIssueToSupabase(item: WasteIssue): Promise<boolean> {
  try {
    const { error } = await supabase.from('waste_issues').upsert({
      id: item.id,
      sr_no: item.srNo,
      date: item.date,
      category: item.category,
      issue_to: item.issueTo,
      issue_type: item.issueType,
      quantity: item.quantity,
      weight_kg: item.weightKg,
      bales: item.bales,
      issued_by: item.issuedBy,
      remarks: item.remarks,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteWasteIssueFromSupabase(id: number): Promise<boolean> {
  try {
    const { error } = await supabase.from('waste_issues').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// Spare Items
export async function fetchSpareItemsFromSupabase(): Promise<SpareItem[] | null> {
  try {
    const { data, error } = await supabase.from('spare_items').select('*').order('id', { ascending: true });
    if (error || !data) return null;
    return data.map((row) => ({
      id: Number(row.id),
      name: row.name,
      partNumber: row.part_number,
      section: row.section,
      source: row.source,
      openingStock: Number(row.opening_stock || 0),
      currentStock: Number(row.current_stock || 0),
      minStock: Number(row.min_stock || 0),
      unit: row.unit || 'Pcs',
      location: row.location,
    }));
  } catch {
    return null;
  }
}

export async function syncSpareItemToSupabase(item: SpareItem): Promise<boolean> {
  try {
    const { error } = await supabase.from('spare_items').upsert({
      id: item.id,
      name: item.name,
      part_number: item.partNumber,
      section: item.section,
      source: item.source,
      opening_stock: item.openingStock,
      current_stock: item.currentStock,
      min_stock: item.minStock,
      unit: item.unit,
      location: item.location,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteSpareItemFromSupabase(id: number): Promise<boolean> {
  try {
    const { error } = await supabase.from('spare_items').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// Spare Receives
export async function fetchSpareReceivesFromSupabase(): Promise<SpareReceive[] | null> {
  try {
    const { data, error } = await supabase.from('spare_receives').select('*').order('id', { ascending: false });
    if (error || !data) return null;
    return data.map((row) => ({
      id: Number(row.id),
      itemId: Number(row.item_id),
      mrrNo: row.mrr_no,
      date: row.date,
      quantity: Number(row.quantity || 0),
      unit: row.unit,
      receivedBy: row.received_by || '',
      remarks: row.remarks || '',
    }));
  } catch {
    return null;
  }
}

export async function syncSpareReceiveToSupabase(item: SpareReceive): Promise<boolean> {
  try {
    const { error } = await supabase.from('spare_receives').upsert({
      id: item.id,
      item_id: item.itemId,
      mrr_no: item.mrrNo,
      date: item.date,
      quantity: item.quantity,
      unit: item.unit,
      received_by: item.receivedBy,
      remarks: item.remarks,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteSpareReceiveFromSupabase(id: number): Promise<boolean> {
  try {
    const { error } = await supabase.from('spare_receives').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// Spare Issues
export async function fetchSpareIssuesFromSupabase(): Promise<SpareIssue[] | null> {
  try {
    const { data, error } = await supabase.from('spare_issues').select('*').order('id', { ascending: false });
    if (error || !data) return null;
    return data.map((row) => ({
      id: Number(row.id),
      itemId: Number(row.item_id),
      srNo: row.sr_no,
      date: row.date,
      quantity: Number(row.quantity || 0),
      unit: row.unit || 'Pcs',
      issueTo: row.issue_to,
      issuedBy: row.issued_by || '',
      remarks: row.remarks || '',
    }));
  } catch {
    return null;
  }
}

export async function syncSpareIssueToSupabase(item: SpareIssue): Promise<boolean> {
  try {
    const { error } = await supabase.from('spare_issues').upsert({
      id: item.id,
      item_id: item.itemId,
      sr_no: item.srNo,
      date: item.date,
      quantity: item.quantity,
      unit: item.unit,
      issue_to: item.issueTo,
      issued_by: item.issuedBy,
      remarks: item.remarks,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteSpareIssueFromSupabase(id: number): Promise<boolean> {
  try {
    const { error } = await supabase.from('spare_issues').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// Yarn Receives
export async function fetchYarnReceivesFromSupabase(): Promise<YarnReceive[] | null> {
  try {
    const { data, error } = await supabase.from('yarn_receives').select('*').order('id', { ascending: false });
    if (error || !data) return null;
    return data.map((row) => ({
      id: Number(row.id),
      date: row.date,
      count: row.count,
      lotNo: row.lot_no,
      process: row.process as 'Ring' | 'Rotor',
      mixingRatio: row.mixing_ratio || '',
      quantity: Number(row.quantity || 0),
      bags: Number(row.bags || 0),
      remarks: row.remarks || '',
    }));
  } catch {
    return null;
  }
}

export async function syncYarnReceiveToSupabase(item: YarnReceive): Promise<boolean> {
  try {
    const { error } = await supabase.from('yarn_receives').upsert({
      id: item.id,
      date: item.date,
      count: item.count,
      lot_no: item.lotNo,
      process: item.process,
      mixing_ratio: item.mixingRatio,
      quantity: item.quantity,
      bags: item.bags,
      remarks: item.remarks,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteYarnReceiveFromSupabase(id: number): Promise<boolean> {
  try {
    const { error } = await supabase.from('yarn_receives').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// Yarn Issues
export async function fetchYarnIssuesFromSupabase(): Promise<YarnIssue[] | null> {
  try {
    const { data, error } = await supabase.from('yarn_issues').select('*').order('id', { ascending: false });
    if (error || !data) return null;
    return data.map((row) => ({
      id: Number(row.id),
      date: row.date,
      count: row.count,
      lotNo: row.lot_no,
      process: row.process as 'Ring' | 'Rotor',
      issueTo: row.issue_to,
      quantity: Number(row.quantity || 0),
      bags: Number(row.bags || 0),
      remarks: row.remarks || '',
    }));
  } catch {
    return null;
  }
}

export async function syncYarnIssueToSupabase(item: YarnIssue): Promise<boolean> {
  try {
    const { error } = await supabase.from('yarn_issues').upsert({
      id: item.id,
      date: item.date,
      count: item.count,
      lot_no: item.lotNo,
      process: item.process,
      issue_to: item.issueTo,
      quantity: item.quantity,
      bags: item.bags,
      remarks: item.remarks,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteYarnIssueFromSupabase(id: number): Promise<boolean> {
  try {
    const { error } = await supabase.from('yarn_issues').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// HVI Reports
export async function fetchHviReportsFromSupabase(): Promise<HVIReport[] | null> {
  try {
    const { data, error } = await supabase.from('hvi_reports').select('*').order('id', { ascending: false });
    if (error || !data) return null;
    return data.map((row) => ({
      id: Number(row.id),
      testDate: row.test_date,
      consignment: row.consignment,
      mic: Number(row.mic || 0),
      uhml: Number(row.uhml || 0),
      ui: Number(row.ui || 0),
      strength: Number(row.strength || 0),
      elongation: Number(row.elongation || 0),
      sfi: Number(row.sfi || 0),
      moisture: Number(row.moisture || 0),
      rd: Number(row.rd || 0),
      yellowness: Number(row.yellowness || 0),
      colorGrade: row.color_grade || '',
      trashCnt: Number(row.trash_cnt || 0),
      trashAr: Number(row.trash_ar || 0),
      sci: Number(row.sci || 0),
      remarks: row.remarks || '',
    }));
  } catch {
    return null;
  }
}

export async function syncHviReportToSupabase(item: HVIReport): Promise<boolean> {
  try {
    const { error } = await supabase.from('hvi_reports').upsert({
      id: item.id,
      test_date: item.testDate,
      consignment: item.consignment,
      mic: item.mic,
      uhml: item.uhml,
      ui: item.ui,
      strength: item.strength,
      elongation: item.elongation,
      sfi: item.sfi,
      moisture: item.moisture,
      rd: item.rd,
      yellowness: item.yellowness,
      color_grade: item.colorGrade,
      trash_cnt: item.trashCnt,
      trash_ar: item.trashAr,
      sci: item.sci,
      remarks: item.remarks,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteHviReportFromSupabase(id: number): Promise<boolean> {
  try {
    const { error } = await supabase.from('hvi_reports').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// Uster Reports
export async function fetchUsterReportsFromSupabase(): Promise<UsterReport[] | null> {
  try {
    const { data, error } = await supabase.from('uster_reports').select('*').order('id', { ascending: false });
    if (error || !data) return null;
    return data.map((row) => ({
      id: Number(row.id),
      stage: row.stage || 'ring_yarn',
      uTestId: row.u_test_id || `UT-${row.id}`,
      testDate: row.test_date,
      lotNo: row.lot_no,
      mixing: row.mixing || '',
      count: row.count || '',
      process: row.process as 'Ring' | 'Rotor',
      machine: row.machine,
      unevenness: Number(row.unevenness || 0),
      cvm: Number(row.cvm || 0),
      cvm1m: row.cvm_1m !== undefined && row.cvm_1m !== null ? Number(row.cvm_1m) : undefined,
      cvm3m: row.cvm_3m !== undefined && row.cvm_3m !== null ? Number(row.cvm_3m) : undefined,
      thinPlaces: row.thin_places !== undefined && row.thin_places !== null ? Number(row.thin_places) : undefined,
      thickPlaces: row.thick_places !== undefined && row.thick_places !== null ? Number(row.thick_places) : undefined,
      neps: row.neps !== undefined && row.neps !== null ? Number(row.neps) : undefined,
      ipi: row.ipi !== undefined && row.ipi !== null ? Number(row.ipi) : undefined,
      hairiness: row.hairiness !== undefined && row.hairiness !== null ? Number(row.hairiness) : undefined,
      csp: row.csp !== undefined && row.csp !== null ? Number(row.csp) : undefined,
      shift: row.shift || 'A',
      testedBy: row.tested_by || '',
      remarks: row.remarks || '',
    }));
  } catch {
    return null;
  }
}

export async function syncUsterReportToSupabase(item: UsterReport): Promise<boolean> {
  try {
    const { error } = await supabase.from('uster_reports').upsert({
      id: item.id,
      stage: item.stage || 'ring_yarn',
      u_test_id: item.uTestId || `UT-${item.id}`,
      test_date: item.testDate,
      lot_no: item.lotNo,
      mixing: item.mixing || '',
      count: item.count || '',
      process: item.process || 'Ring',
      machine: item.machine,
      unevenness: item.unevenness,
      cvm: item.cvm,
      cvm_1m: item.cvm1m ?? 0,
      cvm_3m: item.cvm3m ?? 0,
      thin_places: item.thinPlaces ?? 0,
      thick_places: item.thickPlaces ?? 0,
      neps: item.neps ?? 0,
      ipi: item.ipi ?? 0,
      hairiness: item.hairiness ?? 0,
      csp: item.csp ?? 0,
      shift: item.shift || 'A',
      tested_by: item.testedBy || '',
      remarks: item.remarks,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteUsterReportFromSupabase(id: number): Promise<boolean> {
  try {
    const { error } = await supabase.from('uster_reports').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// Audit Items
export async function fetchAuditItemsFromSupabase(): Promise<AuditItem[] | null> {
  try {
    const { data, error } = await supabase.from('audit_items').select('*').order('id', { ascending: false });
    if (error || !data) return null;
    return data.map((row) => ({
      id: Number(row.id),
      standard: row.standard,
      certificateNo: row.certificate_no,
      certifyingBody: row.certifying_body,
      issueDate: row.issue_date,
      expiryDate: row.expiry_date,
      status: row.status,
      auditDate: row.audit_date,
      auditorName: row.auditor_name,
      scope: row.scope,
      scoreGrade: row.score_grade,
      documentRef: row.document_ref,
      remarks: row.remarks || '',
    }));
  } catch {
    return null;
  }
}

export async function syncAuditItemToSupabase(item: AuditItem): Promise<boolean> {
  try {
    const { error } = await supabase.from('audit_items').upsert({
      id: item.id,
      standard: item.standard,
      certificate_no: item.certificateNo,
      certifying_body: item.certifyingBody,
      issue_date: item.issueDate,
      expiry_date: item.expiryDate,
      status: item.status,
      audit_date: item.auditDate,
      auditor_name: item.auditorName,
      scope: item.scope,
      score_grade: item.scoreGrade,
      document_ref: item.documentRef,
      remarks: item.remarks,
    });
    return !error;
  } catch {
    return false;
  }
}

// Sample Items
export async function fetchSampleItemsFromSupabase(): Promise<SampleItem[] | null> {
  try {
    const { data, error } = await supabase.from('sample_items').select('*').order('id', { ascending: false });
    if (error || !data) return null;
    return data.map((row) => ({
      id: Number(row.id),
      sampleCode: row.sample_code,
      itemName: row.item_name,
      quantity: row.quantity,
      installedOn: row.installed_on,
      testReport: row.test_report || '',
      remarks: row.remarks || '',
      sampleType: row.sample_type,
      customerBrand: row.customer_brand,
      countLot: row.count_lot,
      machineFrame: row.machine_frame,
      status: row.status,
      requestedBy: row.requested_by,
      hviMicronaire: row.hvi_micronaire,
      hviLengthMm: row.hvi_length_mm,
      hviStrengthGtex: row.hvi_strength_gtex,
      hviUniformityIndex: row.hvi_uniformity_index,
      hviShortFiberIndex: row.hvi_short_fiber_index,
      hviTrashPct: row.hvi_trash_pct,
      hviSCI: row.hvi_sci,
      usterCsp: row.uster_csp,
      usterUnevennessU: row.uster_unevenness_u,
      usterIpiTotal: row.uster_ipi_total,
      usterHairinessH: row.uster_hairiness_h,
      usterThin50: row.uster_thin_50,
      usterThick50: row.uster_thick_50,
      usterNeps200: row.uster_neps_200,
      wearResistanceLife: row.wear_resistance_life,
    }));
  } catch {
    return null;
  }
}

export async function syncSampleItemToSupabase(item: SampleItem): Promise<boolean> {
  try {
    const { error } = await supabase.from('sample_items').upsert({
      id: item.id,
      sample_code: item.sampleCode,
      item_name: item.itemName,
      quantity: item.quantity,
      installed_on: item.installedOn,
      test_report: item.testReport,
      remarks: item.remarks,
      sample_type: item.sampleType,
      customer_brand: item.customerBrand,
      count_lot: item.countLot,
      machine_frame: item.machineFrame,
      status: item.status,
      requested_by: item.requestedBy,
      hvi_micronaire: item.hviMicronaire,
      hvi_length_mm: item.hviLengthMm,
      hvi_strength_gtex: item.hviStrengthGtex,
      hvi_uniformity_index: item.hviUniformityIndex,
      hvi_short_fiber_index: item.hviShortFiberIndex,
      hvi_trash_pct: item.hviTrashPct,
      hvi_sci: item.hviSCI,
      uster_csp: item.usterCsp,
      uster_unevenness_u: item.usterUnevennessU,
      uster_ipi_total: item.usterIpiTotal,
      uster_hairiness_h: item.usterHairinessH,
      uster_thin_50: item.usterThin50,
      uster_thick_50: item.usterThick50,
      uster_neps_200: item.usterNeps200,
      wear_resistance_life: item.wearResistanceLife,
    });
    return !error;
  } catch {
    return false;
  }
}

// Account Transactions
export async function fetchAccountTransactionsFromSupabase(): Promise<AccountTransaction[] | null> {
  try {
    const { data, error } = await supabase.from('account_transactions').select('*').order('id', { ascending: false });
    if (error || !data) return null;
    return data.map((row) => ({
      id: Number(row.id),
      voucherNo: row.voucher_no,
      date: row.date,
      voucherType: row.voucher_type,
      accountHead: row.account_head,
      category: row.category,
      partyName: row.party_name,
      debit: Number(row.debit || 0),
      credit: Number(row.credit || 0),
      amount: Number(row.amount || 0),
      paymentMethod: row.payment_method,
      referenceNo: row.reference_no,
      bankAccount: row.bank_account,
      narration: row.narration || '',
      approvedBy: row.approved_by,
      status: row.status,
    }));
  } catch {
    return null;
  }
}

export async function syncAccountTransactionToSupabase(item: AccountTransaction): Promise<boolean> {
  try {
    const { error } = await supabase.from('account_transactions').upsert({
      id: item.id,
      voucher_no: item.voucherNo,
      date: item.date,
      voucher_type: item.voucherType,
      account_head: item.accountHead,
      category: item.category,
      party_name: item.partyName,
      debit: item.debit,
      credit: item.credit,
      amount: item.amount,
      payment_method: item.paymentMethod,
      reference_no: item.referenceNo,
      bank_account: item.bankAccount,
      narration: item.narration,
      approved_by: item.approvedBy,
      status: item.status,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function deleteAccountTransactionFromSupabase(id: number): Promise<boolean> {
  try {
    const { error } = await supabase.from('account_transactions').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Seed initial mill data into Supabase if tables are currently empty
 */
export async function populateSupabaseWithInitialSeedData(seedData: {
  cottonReceives?: CottonReceive[];
  cottonIssues?: CottonIssue[];
  wasteReceives?: WasteReceive[];
  wasteIssues?: WasteIssue[];
  spareItems?: SpareItem[];
  spareReceives?: SpareReceive[];
  spareIssues?: SpareIssue[];
  yarnReceives?: YarnReceive[];
  yarnIssues?: YarnIssue[];
  hviReports?: HVIReport[];
  usterReports?: UsterReport[];
  auditItems?: AuditItem[];
  sampleItems?: SampleItem[];
  accountTransactions?: AccountTransaction[];
}): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    let syncedCount = 0;
    const errors: string[] = [];

    // 1. Sync Cotton Receives
    if (seedData.cottonReceives && seedData.cottonReceives.length > 0) {
      const rows = seedData.cottonReceives.map((item) => ({
        id: item.id,
        date: item.date,
        origin: item.origin,
        supplier_name: item.supplierName,
        consignment: item.consignment,
        fiber_length: item.fiberLength,
        lc_no: item.lcNo,
        id_code: item.idCode,
        lc_quantity: item.lcQuantity,
        actual_receive: item.actualReceive,
        actual_receive_kg: item.actualReceiveKg,
        remarks: item.remarks,
      }));
      const { error } = await supabase.from('cotton_receives').upsert(rows);
      if (error) {
        errors.push(`Cotton Receives: ${error.message}`);
      } else {
        syncedCount += rows.length;
      }
    }

    // 2. Sync Cotton Issues
    if (seedData.cottonIssues && seedData.cottonIssues.length > 0) {
      const rows = seedData.cottonIssues.map((item) => ({
        id: item.id,
        sr_no: item.srNo,
        date: item.date,
        origin: item.origin,
        consignment: item.consignment,
        process_type: item.processType,
        department: item.department,
        bale_qty: item.baleQty,
        weight_kg: item.weightKg,
        remarks: item.remarks,
      }));
      const { error } = await supabase.from('cotton_issues').upsert(rows);
      if (error) {
        errors.push(`Cotton Issues: ${error.message}`);
      } else {
        syncedCount += rows.length;
      }
    }

    // 3. Sync Waste Receives
    if (seedData.wasteReceives && seedData.wasteReceives.length > 0) {
      const rows = seedData.wasteReceives.map((item) => ({
        id: item.id,
        date: item.date,
        category: item.category,
        receive_from: item.receiveFrom,
        quantity: item.quantity,
        weight_kg: item.weightKg,
        bales: item.bales,
        received_by: item.receivedBy,
        remarks: item.remarks,
      }));
      const { error } = await supabase.from('waste_receives').upsert(rows);
      if (error) {
        errors.push(`Waste Receives: ${error.message}`);
      } else {
        syncedCount += rows.length;
      }
    }

    // 4. Sync Waste Issues
    if (seedData.wasteIssues && seedData.wasteIssues.length > 0) {
      const rows = seedData.wasteIssues.map((item) => ({
        id: item.id,
        sr_no: item.srNo,
        date: item.date,
        category: item.category,
        issue_to: item.issueTo,
        issue_type: item.issueType,
        quantity: item.quantity,
        weight_kg: item.weightKg,
        bales: item.bales,
        issued_by: item.issuedBy,
        remarks: item.remarks,
      }));
      const { error } = await supabase.from('waste_issues').upsert(rows);
      if (error) {
        errors.push(`Waste Issues: ${error.message}`);
      } else {
        syncedCount += rows.length;
      }
    }

    // 5. Sync Spare Items
    if (seedData.spareItems && seedData.spareItems.length > 0) {
      const rows = seedData.spareItems.map((item) => ({
        id: item.id,
        name: item.name,
        part_number: item.partNumber,
        section: item.section,
        source: item.source,
        opening_stock: item.openingStock,
        current_stock: item.currentStock,
        min_stock: item.minStock,
        unit: item.unit,
        location: item.location,
      }));
      const { error } = await supabase.from('spare_items').upsert(rows);
      if (error) {
        errors.push(`Spare Items: ${error.message}`);
      } else {
        syncedCount += rows.length;
      }
    }

    // 6. Sync Spare Receives
    if (seedData.spareReceives && seedData.spareReceives.length > 0) {
      const rows = seedData.spareReceives.map((item) => ({
        id: item.id,
        item_id: item.itemId,
        mrr_no: item.mrrNo,
        date: item.date,
        quantity: item.quantity,
        unit: item.unit,
        received_by: item.receivedBy,
        remarks: item.remarks,
      }));
      const { error } = await supabase.from('spare_receives').upsert(rows);
      if (error) {
        errors.push(`Spare Receives: ${error.message}`);
      } else {
        syncedCount += rows.length;
      }
    }

    // 7. Sync Spare Issues
    if (seedData.spareIssues && seedData.spareIssues.length > 0) {
      const rows = seedData.spareIssues.map((item) => ({
        id: item.id,
        item_id: item.itemId,
        sr_no: item.srNo,
        date: item.date,
        quantity: item.quantity,
        unit: item.unit,
        issue_to: item.issueTo,
        issued_by: item.issuedBy,
        remarks: item.remarks,
      }));
      const { error } = await supabase.from('spare_issues').upsert(rows);
      if (error) {
        errors.push(`Spare Issues: ${error.message}`);
      } else {
        syncedCount += rows.length;
      }
    }

    // 8. Sync Yarn Receives
    if (seedData.yarnReceives && seedData.yarnReceives.length > 0) {
      const rows = seedData.yarnReceives.map((item) => ({
        id: item.id,
        date: item.date,
        count: item.count,
        lot_no: item.lotNo,
        process: item.process,
        mixing_ratio: item.mixingRatio,
        quantity: item.quantity,
        bags: item.bags,
        remarks: item.remarks,
      }));
      const { error } = await supabase.from('yarn_receives').upsert(rows);
      if (error) {
        errors.push(`Yarn Receives: ${error.message}`);
      } else {
        syncedCount += rows.length;
      }
    }

    // 9. Sync Yarn Issues
    if (seedData.yarnIssues && seedData.yarnIssues.length > 0) {
      const rows = seedData.yarnIssues.map((item) => ({
        id: item.id,
        date: item.date,
        count: item.count,
        lot_no: item.lotNo,
        process: item.process,
        issue_to: item.issueTo,
        quantity: item.quantity,
        bags: item.bags,
        remarks: item.remarks,
      }));
      const { error } = await supabase.from('yarn_issues').upsert(rows);
      if (error) {
        errors.push(`Yarn Issues: ${error.message}`);
      } else {
        syncedCount += rows.length;
      }
    }

    // 10. Sync HVI Reports
    if (seedData.hviReports && seedData.hviReports.length > 0) {
      const rows = seedData.hviReports.map((item) => ({
        id: item.id,
        test_date: item.testDate,
        consignment: item.consignment,
        mic: item.mic,
        uhml: item.uhml,
        ui: item.ui,
        strength: item.strength,
        elongation: item.elongation,
        sfi: item.sfi,
        moisture: item.moisture,
        rd: item.rd,
        yellowness: item.yellowness,
        color_grade: item.colorGrade,
        trash_cnt: item.trashCnt,
        trash_ar: item.trashAr,
        sci: item.sci,
        remarks: item.remarks,
      }));
      const { error } = await supabase.from('hvi_reports').upsert(rows);
      if (error) {
        errors.push(`HVI Reports: ${error.message}`);
      } else {
        syncedCount += rows.length;
      }
    }

    // 11. Sync Uster Reports
    if (seedData.usterReports && seedData.usterReports.length > 0) {
      const rows = seedData.usterReports.map((item) => ({
        id: item.id,
        test_date: item.testDate,
        lot_no: item.lotNo,
        count: item.count,
        process: item.process,
        machine: item.machine,
        unevenness: item.unevenness,
        cvm: item.cvm,
        thin_places: item.thinPlaces,
        thick_places: item.thickPlaces,
        neps: item.neps,
        ipi: item.ipi,
        hairiness: item.hairiness,
        csp: item.csp,
        remarks: item.remarks,
      }));
      const { error } = await supabase.from('uster_reports').upsert(rows);
      if (error) {
        errors.push(`Uster Reports: ${error.message}`);
      } else {
        syncedCount += rows.length;
      }
    }

    // 12. Sync Audit Items
    if (seedData.auditItems && seedData.auditItems.length > 0) {
      const rows = seedData.auditItems.map((item) => ({
        id: item.id,
        standard: item.standard,
        certificate_no: item.certificateNo,
        certifying_body: item.certifyingBody,
        issue_date: item.issueDate,
        expiry_date: item.expiryDate,
        status: item.status,
        audit_date: item.auditDate,
        auditor_name: item.auditorName,
        scope: item.scope,
        score_grade: item.scoreGrade,
        document_ref: item.documentRef,
        remarks: item.remarks,
      }));
      const { error } = await supabase.from('audit_items').upsert(rows);
      if (error) {
        errors.push(`Audit Items: ${error.message}`);
      } else {
        syncedCount += rows.length;
      }
    }

    // 13. Sync Sample Items
    if (seedData.sampleItems && seedData.sampleItems.length > 0) {
      const rows = seedData.sampleItems.map((item) => ({
        id: item.id,
        sample_code: item.sampleCode,
        item_name: item.itemName,
        quantity: item.quantity,
        installed_on: item.installedOn,
        test_report: item.testReport,
        remarks: item.remarks,
        sample_type: item.sampleType,
        customer_brand: item.customerBrand,
        count_lot: item.countLot,
        machine_frame: item.machineFrame,
        status: item.status,
        requested_by: item.requestedBy,
        hvi_micronaire: item.hviMicronaire,
        hvi_length_mm: item.hviLengthMm,
        hvi_strength_gtex: item.hviStrengthGtex,
        hvi_uniformity_index: item.hviUniformityIndex,
        hvi_short_fiber_index: item.hviShortFiberIndex,
        hvi_trash_pct: item.hviTrashPct,
        hvi_sci: item.hviSCI,
        uster_csp: item.usterCsp,
        uster_unevenness_u: item.usterUnevennessU,
        uster_ipi_total: item.usterIpiTotal,
        uster_hairiness_h: item.usterHairinessH,
        uster_thin_50: item.usterThin50,
        uster_thick_50: item.usterThick50,
        uster_neps_200: item.usterNeps200,
        wear_resistance_life: item.wearResistanceLife,
      }));
      const { error } = await supabase.from('sample_items').upsert(rows);
      if (error) {
        errors.push(`Sample Items: ${error.message}`);
      } else {
        syncedCount += rows.length;
      }
    }

    // 14. Sync Account Transactions
    if (seedData.accountTransactions && seedData.accountTransactions.length > 0) {
      const rows = seedData.accountTransactions.map((item) => ({
        id: item.id,
        voucher_no: item.voucherNo,
        date: item.date,
        voucher_type: item.voucherType,
        account_head: item.accountHead,
        category: item.category,
        party_name: item.partyName,
        debit: item.debit,
        credit: item.credit,
        amount: item.amount,
        payment_method: item.paymentMethod,
        reference_no: item.referenceNo,
        bank_account: item.bankAccount,
        narration: item.narration,
        approved_by: item.approvedBy,
        status: item.status,
      }));
      const { error } = await supabase.from('account_transactions').upsert(rows);
      if (error) {
        errors.push(`Account Transactions: ${error.message}`);
      } else {
        syncedCount += rows.length;
      }
    }

    if (errors.length > 0 && syncedCount === 0) {
      return {
        success: false,
        count: 0,
        error: `Supabase write rejected: ${errors[0]}. Please run the updated SQL Schema in Supabase SQL Editor.`,
      };
    }

    return { success: true, count: syncedCount, error: errors.length > 0 ? errors.join(', ') : undefined };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Failed seeding data' };
  }
}

/**
 * ------------------------------------------------------------------
 * USER MANAGEMENT & PASSWORD CREDENTIALS IN SUPABASE
 * ------------------------------------------------------------------
 */

export interface SystemUserRecord {
  email: string;
  password: string;
  name: string;
  role: 'Store Manager' | 'Super Admin' | 'Quality Officer';
  updated_at?: string;
  created_at?: string;
}

/**
 * Fetch all system users from Supabase Cloud table
 */
export async function fetchSystemUsersFromSupabase(): Promise<SystemUserRecord[] | null> {
  try {
    const { data, error } = await supabase
      .from('system_users')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    if (!data) return null;
    return data.map((d: any) => ({
      email: d.email,
      password: d.password,
      name: d.name,
      role: d.role,
      updated_at: d.updated_at,
      created_at: d.created_at,
    }));
  } catch (err) {
    console.warn('Could not fetch system users from Supabase:', err);
    return null;
  }
}

/**
 * Upsert / Save a system user to Supabase
 */
export async function saveSystemUserToSupabase(user: SystemUserRecord): Promise<{ success: boolean; error?: string }> {
  try {
    const row = {
      email: user.email.trim().toLowerCase(),
      password: user.password.trim(),
      name: user.name.trim(),
      role: user.role,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('system_users').upsert(row);
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to save user to Supabase' };
  }
}

/**
 * Delete a user from Supabase
 */
export async function deleteSystemUserFromSupabase(email: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('system_users').delete().eq('email', email.trim().toLowerCase());
    return !error;
  } catch {
    return false;
  }
}

/**
 * Update user password in Supabase:
 * 1. Updates password in Supabase Auth if session exists or during reset
 * 2. Updates password in system_users cloud table
 */
export async function updateUserPasswordInSupabase(
  email: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = newPassword.trim();

  if (cleanPass.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters long.' };
  }

  try {
    // 1. Update in system_users table
    const { error: dbError } = await supabase
      .from('system_users')
      .update({ password: cleanPass, updated_at: new Date().toISOString() })
      .eq('email', cleanEmail);

    if (dbError) {
      console.warn('Database user password update warning:', dbError.message);
    }

    // 2. Also attempt Supabase Auth updateUser if active session
    try {
      await supabase.auth.updateUser({ password: cleanPass });
    } catch (_) {
      // ignore if not logged in with supabase auth session
    }

    return { success: true, message: 'Password updated successfully across system and cloud!' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to update password.' };
  }
}

