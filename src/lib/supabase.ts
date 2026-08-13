import { createClient } from '@supabase/supabase-js';
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
} from '../types';

const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || 'https://zmcuzcabmwmoqcnrmdvj.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_A7hfDJptyKVsk88fijBK6Q_DgxguWcb';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  test_date TEXT NOT NULL,
  lot_no TEXT NOT NULL,
  count TEXT NOT NULL,
  process TEXT NOT NULL,
  machine TEXT NOT NULL,
  unevenness NUMERIC DEFAULT 0,
  cvm NUMERIC DEFAULT 0,
  thin_places NUMERIC DEFAULT 0,
  thick_places NUMERIC DEFAULT 0,
  neps NUMERIC DEFAULT 0,
  ipi NUMERIC DEFAULT 0,
  hairiness NUMERIC DEFAULT 0,
  csp NUMERIC DEFAULT 0,
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

-- Enable Row Level Security (RLS) & Allow Anonymous Access for ERP
ALTER TABLE cotton_receives ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotton_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_receives ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_receives ENABLE ROW LEVEL SECURITY;
ALTER TABLE spare_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE yarn_receives ENABLE ROW LEVEL SECURITY;
ALTER TABLE yarn_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE hvi_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE uster_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_items ENABLE ROW LEVEL SECURITY;

-- Create Open Policies for easy read/write in ERP demo environment
DO $$ 
BEGIN
  CREATE POLICY "Public full access cotton_receives" ON cotton_receives FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Public full access cotton_issues" ON cotton_issues FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Public full access waste_receives" ON waste_receives FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Public full access waste_issues" ON waste_issues FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Public full access spare_items" ON spare_items FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Public full access spare_receives" ON spare_receives FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Public full access spare_issues" ON spare_issues FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Public full access yarn_receives" ON yarn_receives FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Public full access yarn_issues" ON yarn_issues FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Public full access hvi_reports" ON hvi_reports FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Public full access uster_reports" ON uster_reports FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Public full access audit_items" ON audit_items FOR ALL USING (true) WITH CHECK (true);
  CREATE POLICY "Public full access sample_items" ON sample_items FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
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
    return !error;
  } catch {
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

/**
 * Seed initial mill data into Supabase if tables are currently empty
 */
export async function populateSupabaseWithInitialSeedData(seedData: {
  cottonReceives: CottonReceive[];
  cottonIssues: CottonIssue[];
  spareItems: SpareItem[];
  auditItems: AuditItem[];
  sampleItems: SampleItem[];
}): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    let syncedCount = 0;
    
    // Sync Cotton Receives
    for (const item of seedData.cottonReceives) {
      const ok = await syncCottonReceiveToSupabase(item);
      if (ok) syncedCount++;
    }

    // Sync Cotton Issues
    for (const item of seedData.cottonIssues) {
      const ok = await syncCottonIssueToSupabase(item);
      if (ok) syncedCount++;
    }

    // Sync Spare Items
    for (const item of seedData.spareItems) {
      const ok = await syncSpareItemToSupabase(item);
      if (ok) syncedCount++;
    }

    // Sync Audit Items
    for (const item of seedData.auditItems) {
      const ok = await syncAuditItemToSupabase(item);
      if (ok) syncedCount++;
    }

    // Sync Sample Items
    for (const item of seedData.sampleItems) {
      const ok = await syncSampleItemToSupabase(item);
      if (ok) syncedCount++;
    }

    return { success: true, count: syncedCount };
  } catch (err: any) {
    return { success: false, count: 0, error: err?.message || 'Failed seeding data' };
  }
}
