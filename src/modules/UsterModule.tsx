import React, { useState, useMemo } from 'react';
import {
  TestTube,
  Plus,
  Edit3,
  Trash2,
  Download,
  Search,
  Printer,
  Sparkles,
  Layers,
  CheckCircle2,
  Activity,
  Calculator,
  Filter,
  FileText,
} from 'lucide-react';
import { UsterReport, UsterStage } from '../types';
import { exportToExcel, exportUsterPDFReport, USTER_ORDERED_STAGES } from '../utils/exportUtils';
import { triggerAppPrint } from '../utils/printUtils';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { isDateInRange } from '../utils/dateUtils';

interface UsterModuleProps {
  usterReports: UsterReport[];
  setUsterReports: React.Dispatch<React.SetStateAction<UsterReport[]>>;
  requestAdminAction: (title: string, action: () => void) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  initialStage?: UsterStage | 'all';
}

export const USTER_STAGES: {
  key: UsterStage | 'all';
  labelEn: string;
  subTitle: string;
  shortLabel: string;
  category: 'sliver_roving' | 'yarn' | 'all';
  prefix: string;
  badgeColor: string;
}[] = [
  {
    key: 'finished_yarn',
    labelEn: 'Finished Yarn Test',
    subTitle: 'Autoconer Package',
    shortLabel: 'Finished Yarn',
    category: 'yarn',
    prefix: 'UT-FIN',
    badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300 dark:border-rose-700',
  },
  {
    key: 'rotor_yarn',
    labelEn: 'Rotor Yarn Test',
    subTitle: 'Rotor Package',
    shortLabel: 'Rotor Yarn',
    category: 'yarn',
    prefix: 'UT-RTR',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300 dark:border-orange-700',
  },
  {
    key: 'ring_yarn',
    labelEn: 'Ring Yarn Test',
    subTitle: 'Ring Frame Cop',
    shortLabel: 'Ring Yarn',
    category: 'yarn',
    prefix: 'UT-RNG',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
  },
  {
    key: 'simplex_roving',
    labelEn: 'Simplex Roving Test',
    subTitle: 'Speed Frame',
    shortLabel: 'Simplex Roving',
    category: 'sliver_roving',
    prefix: 'UT-SMP',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300 dark:border-purple-700',
  },
  {
    key: 'f_drawing',
    labelEn: 'F. Drawing Test',
    subTitle: 'Finisher Drawing Auto-Leveler',
    shortLabel: 'F. Drawing',
    category: 'sliver_roving',
    prefix: 'UT-FDR',
    badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-300 dark:border-indigo-700',
  },
  {
    key: 'b_drawing',
    labelEn: 'B Drawing Test',
    subTitle: 'Breaker Drawing',
    shortLabel: 'B Drawing',
    category: 'sliver_roving',
    prefix: 'UT-BDR',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700',
  },
  {
    key: 'card_sliver',
    labelEn: 'Carding Sliver Test',
    subTitle: 'Card Sliver',
    shortLabel: 'Carding',
    category: 'sliver_roving',
    prefix: 'UT-CRD',
    badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700',
  },
  {
    key: 'all',
    labelEn: 'All Stages Overview',
    subTitle: 'Sequential Process Flow (1 to 7)',
    shortLabel: 'All Stages',
    category: 'all',
    prefix: 'UT',
    badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  },
];

export const UsterModule: React.FC<UsterModuleProps> = ({
  usterReports,
  setUsterReports,
  requestAdminAction,
  showToast,
  initialStage = 'all',
}) => {
  const [selectedStage, setSelectedStage] = useState<UsterStage | 'all'>(initialStage);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLotFilter, setSelectedLotFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<UsterReport | null>(null);

  // Form State
  const [formStage, setFormStage] = useState<UsterStage>('card_sliver');
  const [formData, setFormData] = useState({
    uTestId: '',
    testDate: new Date().toISOString().split('T')[0],
    machine: '',
    lotNo: '',
    mixing: '',
    shift: 'A' as 'A' | 'B' | 'C' | 'General',
    testedBy: '',
    remarks: '',

    // Card to Simplex parameters
    unevenness: '',
    cvm: '',
    cvm1m: '',
    cvm3m: '',

    // Ring & Finished Yarn parameters
    count: '',
    csp: '',
    thinPlaces: '',
    thickPlaces: '',
    neps: '',
    ipi: '', // Auto computed
    hairiness: '',
  });

  // Calculate distinct lot numbers for filtering
  const distinctLots = useMemo(() => {
    const lots = new Set<string>();
    usterReports.forEach((r) => {
      if (r.lotNo) lots.add(r.lotNo);
    });
    return Array.from(lots);
  }, [usterReports]);

  // Date-filtered all reports (for Full PDF export across all stages)
  const dateFilteredAllReports = useMemo(() => {
    return usterReports.filter((r) => isDateInRange(r.testDate, startDate, endDate));
  }, [usterReports, startDate, endDate]);

  // Filtered reports for active stage & search
  const filteredReports = useMemo(() => {
    return usterReports.filter((r) => {
      // Date filter
      if (!isDateInRange(r.testDate, startDate, endDate)) {
        return false;
      }

      // Stage filter
      if (selectedStage !== 'all') {
        const itemStage = r.stage || (r.count ? 'ring_yarn' : 'card_sliver');
        if (itemStage !== selectedStage) return false;
      }

      // Lot filter
      if (selectedLotFilter !== 'ALL' && r.lotNo !== selectedLotFilter) {
        return false;
      }

      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const testId = (r.uTestId || `UT-${r.id}`).toLowerCase();
        const lot = (r.lotNo || '').toLowerCase();
        const machine = (r.machine || '').toLowerCase();
        const mixing = (r.mixing || '').toLowerCase();
        const count = (r.count || '').toLowerCase();
        const remarks = (r.remarks || '').toLowerCase();
        return (
          testId.includes(q) ||
          lot.includes(q) ||
          machine.includes(q) ||
          mixing.includes(q) ||
          count.includes(q) ||
          remarks.includes(q)
        );
      }

      return true;
    });
  }, [usterReports, selectedStage, selectedLotFilter, searchQuery, startDate, endDate]);

  // Statistics calculation for the active stage
  const stageStats = useMemo(() => {
    const records = filteredReports;
    const count = records.length;
    if (count === 0) {
      return {
        count: 0,
        avgU: 0,
        avgCvm: 0,
        avgCvm1m: 0,
        avgCvm3m: 0,
        avgCsp: 0,
        avgIpi: 0,
        avgThin: 0,
        avgThick: 0,
        avgNeps: 0,
      };
    }

    let sumU = 0;
    let sumCvm = 0;
    let sumCvm1m = 0;
    let sumCvm3m = 0;
    let sumCsp = 0;
    let sumIpi = 0;
    let sumThin = 0;
    let sumThick = 0;
    let sumNeps = 0;
    let countCvm1m = 0;
    let countCvm3m = 0;
    let countCsp = 0;
    let countIpi = 0;

    records.forEach((r) => {
      sumU += Number(r.unevenness || 0);
      sumCvm += Number(r.cvm || 0);

      if (r.cvm1m !== undefined && r.cvm1m !== null) {
        sumCvm1m += Number(r.cvm1m);
        countCvm1m++;
      }
      if (r.cvm3m !== undefined && r.cvm3m !== null) {
        sumCvm3m += Number(r.cvm3m);
        countCvm3m++;
      }
      if (r.csp) {
        sumCsp += Number(r.csp);
        countCsp++;
      }
      if (r.ipi !== undefined && r.ipi !== null) {
        sumIpi += Number(r.ipi);
        countIpi++;
      }
      if (r.thinPlaces !== undefined) sumThin += Number(r.thinPlaces);
      if (r.thickPlaces !== undefined) sumThick += Number(r.thickPlaces);
      if (r.neps !== undefined) sumNeps += Number(r.neps);
    });

    return {
      count,
      avgU: (sumU / count).toFixed(2),
      avgCvm: (sumCvm / count).toFixed(2),
      avgCvm1m: countCvm1m ? (sumCvm1m / countCvm1m).toFixed(2) : '0.00',
      avgCvm3m: countCvm3m ? (sumCvm3m / countCvm3m).toFixed(2) : '0.00',
      avgCsp: countCsp ? Math.round(sumCsp / countCsp) : 0,
      avgIpi: countIpi ? Math.round(sumIpi / countIpi) : 0,
      avgThin: count ? (sumThin / count).toFixed(1) : '0',
      avgThick: count ? (sumThick / count).toFixed(1) : '0',
      avgNeps: count ? (sumNeps / count).toFixed(1) : '0',
    };
  }, [filteredReports]);

  // Helper to generate U Test ID
  const generateTestId = (targetStage: UsterStage) => {
    const stageConfig = USTER_STAGES.find((s) => s.key === targetStage);
    const prefix = stageConfig ? stageConfig.prefix : 'UT';
    const rand = Math.floor(100 + Math.random() * 900);
    return `${prefix}-${rand}`;
  };

  // Helper: Open Modal for Add
  const handleOpenAdd = (targetStage?: UsterStage) => {
    const st = targetStage || (selectedStage === 'all' ? 'card_sliver' : selectedStage);
    setEditingItem(null);
    setFormStage(st);

    const newTestId = generateTestId(st);

    // Provide stage-appropriate initial values with blank remarks for manual entry
    if (st === 'card_sliver') {
      setFormData({
        uTestId: newTestId,
        testDate: new Date().toISOString().split('T')[0],
        machine: 'Carding M/C # 01',
        lotNo: 'LOT-CH-3001',
        mixing: 'Cotton 100% (US Memphis)',
        shift: 'A',
        testedBy: 'Quality Officer',
        remarks: '',
        unevenness: '2.80',
        cvm: '3.60',
        cvm1m: '1.40',
        cvm3m: '1.15',
        count: '',
        csp: '',
        thinPlaces: '',
        thickPlaces: '',
        neps: '',
        ipi: '',
        hairiness: '',
      });
    } else if (st === 'b_drawing') {
      setFormData({
        uTestId: newTestId,
        testDate: new Date().toISOString().split('T')[0],
        machine: 'B/Drawing # 01',
        lotNo: 'LOT-CH-3001',
        mixing: 'Cotton 100% (US Memphis)',
        shift: 'A',
        testedBy: 'Quality Officer',
        remarks: '',
        unevenness: '2.20',
        cvm: '2.80',
        cvm1m: '1.15',
        cvm3m: '0.92',
        count: '',
        csp: '',
        thinPlaces: '',
        thickPlaces: '',
        neps: '',
        ipi: '',
        hairiness: '',
      });
    } else if (st === 'f_drawing') {
      setFormData({
        uTestId: newTestId,
        testDate: new Date().toISOString().split('T')[0],
        machine: 'F/Drawing # 01 (Trutzschler)',
        lotNo: 'LOT-CH-3001',
        mixing: 'Cotton 100% (US Memphis)',
        shift: 'A',
        testedBy: 'Quality Officer',
        remarks: '',
        unevenness: '1.85',
        cvm: '2.35',
        cvm1m: '0.95',
        cvm3m: '0.78',
        count: '',
        csp: '',
        thinPlaces: '',
        thickPlaces: '',
        neps: '',
        ipi: '',
        hairiness: '',
      });
    } else if (st === 'simplex_roving') {
      setFormData({
        uTestId: newTestId,
        testDate: new Date().toISOString().split('T')[0],
        machine: 'Simplex Frame # 02',
        lotNo: 'LOT-CH-3001',
        mixing: 'Cotton 100% (US Memphis)',
        shift: 'A',
        testedBy: 'Quality Officer',
        remarks: '',
        unevenness: '3.40',
        cvm: '4.35',
        cvm1m: '1.70',
        cvm3m: '1.40',
        count: '',
        csp: '',
        thinPlaces: '',
        thickPlaces: '',
        neps: '',
        ipi: '',
        hairiness: '',
      });
    } else if (st === 'rotor_yarn') {
      const thin = 0;
      const thick = 8;
      const neps = 15;
      setFormData({
        uTestId: newTestId,
        testDate: new Date().toISOString().split('T')[0],
        machine: 'Schlafhorst Autocoro OE # 01',
        lotNo: 'LOT-OE-1601',
        mixing: 'Cotton 100% (Carded Blend)',
        shift: 'A',
        testedBy: 'Quality Officer',
        remarks: '',
        unevenness: '11.50',
        cvm: '14.60',
        cvm1m: '',
        cvm3m: '',
        count: '16/1 OE Rotor (Package)',
        csp: '1850',
        thinPlaces: String(thin),
        thickPlaces: String(thick),
        neps: String(neps),
        ipi: String(thin + thick + neps),
        hairiness: '4.2',
      });
    } else if (st === 'ring_yarn') {
      const thin = 2;
      const thick = 18;
      const neps = 35;
      setFormData({
        uTestId: newTestId,
        testDate: new Date().toISOString().split('T')[0],
        machine: 'Ring Frame # 08',
        lotNo: 'LOT-CH-3001',
        mixing: 'Cotton 100% (US Memphis)',
        shift: 'A',
        testedBy: 'Quality Officer',
        remarks: '',
        unevenness: '9.80',
        cvm: '12.40',
        cvm1m: '',
        cvm3m: '',
        count: '30/1 Combed Hosiery',
        csp: '2680',
        thinPlaces: String(thin),
        thickPlaces: String(thick),
        neps: String(neps),
        ipi: String(thin + thick + neps),
        hairiness: '5.2',
      });
    } else {
      // finished_yarn
      const thin = 1;
      const thick = 14;
      const neps = 30;
      setFormData({
        uTestId: newTestId,
        testDate: new Date().toISOString().split('T')[0],
        machine: 'Murata QPRO Autoconer # 01',
        lotNo: 'LOT-CH-3001',
        mixing: 'Cotton 100% (US Memphis)',
        shift: 'A',
        testedBy: 'Quality Officer',
        remarks: '',
        unevenness: '9.50',
        cvm: '12.10',
        cvm1m: '',
        cvm3m: '',
        count: '30/1 Combed Hosiery (Cone)',
        csp: '2720',
        thinPlaces: String(thin),
        thickPlaces: String(thick),
        neps: String(neps),
        ipi: String(thin + thick + neps),
        hairiness: '4.8',
      });
    }

    setShowModal(true);
  };

  // Helper: Open Modal for Edit
  const handleOpenEdit = (item: UsterReport) => {
    const st: UsterStage = item.stage || (item.count ? 'ring_yarn' : 'card_sliver');
    setEditingItem(item);
    setFormStage(st);

    const thin = item.thinPlaces ?? 0;
    const thick = item.thickPlaces ?? 0;
    const neps = item.neps ?? 0;
    const computedIpi = item.ipi ?? thin + thick + neps;

    setFormData({
      uTestId: item.uTestId || `UT-${item.id}`,
      testDate: item.testDate,
      machine: item.machine,
      lotNo: item.lotNo,
      mixing: item.mixing || '',
      shift: (item.shift as any) || 'A',
      testedBy: item.testedBy || '',
      remarks: item.remarks || '',
      unevenness: String(item.unevenness ?? ''),
      cvm: String(item.cvm ?? ''),
      cvm1m: item.cvm1m !== undefined && item.cvm1m !== null ? String(item.cvm1m) : '',
      cvm3m: item.cvm3m !== undefined && item.cvm3m !== null ? String(item.cvm3m) : '',
      count: item.count || '',
      csp: item.csp ? String(item.csp) : '',
      thinPlaces: item.thinPlaces !== undefined ? String(item.thinPlaces) : '',
      thickPlaces: item.thickPlaces !== undefined ? String(item.thickPlaces) : '',
      neps: item.neps !== undefined ? String(item.neps) : '',
      ipi: String(computedIpi),
      hairiness: item.hairiness !== undefined ? String(item.hairiness) : '',
    });

    setShowModal(true);
  };

  // Auto calculate IPI whenever thin, thick, or neps change
  const handleYarnImperfectionChange = (field: 'thin' | 'thick' | 'neps', value: string) => {
    setFormData((prev) => {
      const thinVal = field === 'thin' ? Number(value) || 0 : Number(prev.thinPlaces) || 0;
      const thickVal = field === 'thick' ? Number(value) || 0 : Number(prev.thickPlaces) || 0;
      const nepsVal = field === 'neps' ? Number(value) || 0 : Number(prev.neps) || 0;
      const autoIpi = thinVal + thickVal + nepsVal;

      return {
        ...prev,
        [field === 'thin' ? 'thinPlaces' : field === 'thick' ? 'thickPlaces' : 'neps']: value,
        ipi: String(autoIpi),
      };
    });
  };

  // Submit Handler
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.machine.trim()) {
      showToast('error', 'Missing Machine No', 'Please specify the Machine Number.');
      return;
    }
    if (!formData.lotNo.trim()) {
      showToast('error', 'Missing Lot Number', 'Please enter the Lot Number.');
      return;
    }
    if (!formData.cvm.trim()) {
      showToast('error', 'Missing CVm%', 'Coefficient of Variation (CVm%) is required.');
      return;
    }

    const isYarnStage = formStage === 'ring_yarn' || formStage === 'finished_yarn';

    if (isYarnStage && !formData.count.trim()) {
      showToast('error', 'Missing Yarn Count', 'A. Count (Actual Count) is required for Ring/Finished Yarn test.');
      return;
    }

    const thin = Number(formData.thinPlaces) || 0;
    const thick = Number(formData.thickPlaces) || 0;
    const neps = Number(formData.neps) || 0;
    const calculatedIpi = thin + thick + neps;

    const payload: UsterReport = {
      id: editingItem ? editingItem.id : Date.now(),
      stage: formStage,
      uTestId: formData.uTestId.trim() || generateTestId(formStage),
      testDate: formData.testDate,
      machine: formData.machine.trim(),
      lotNo: formData.lotNo.trim(),
      mixing: formData.mixing.trim(),
      shift: formData.shift,
      testedBy: formData.testedBy.trim(),
      remarks: formData.remarks.trim(),
      unevenness: Number(formData.unevenness) || 0,
      cvm: Number(formData.cvm) || 0,
      cvm1m: formData.cvm1m ? Number(formData.cvm1m) : undefined,
      cvm3m: formData.cvm3m ? Number(formData.cvm3m) : undefined,
      count: isYarnStage ? formData.count.trim() : undefined,
      csp: formData.csp ? Number(formData.csp) : undefined,
      thinPlaces: isYarnStage ? thin : undefined,
      thickPlaces: isYarnStage ? thick : undefined,
      neps: isYarnStage ? neps : undefined,
      ipi: isYarnStage ? calculatedIpi : undefined,
      hairiness: formData.hairiness ? Number(formData.hairiness) : undefined,
    };

    if (editingItem) {
      setUsterReports((prev) => prev.map((item) => (item.id === editingItem.id ? payload : item)));
      showToast('success', 'Uster Test Updated', `Successfully updated test report ${payload.uTestId}`);
    } else {
      setUsterReports((prev) => [payload, ...prev]);
      showToast('success', 'Uster Test Recorded', `Added new test report ${payload.uTestId} for ${payload.lotNo}`);
    }

    setShowModal(false);
  };

  // Stage Config for Active Stage
  const activeStageConfig = USTER_STAGES.find((s) => s.key === selectedStage) || USTER_STAGES[0];
  const isSliverOrRoving =
    selectedStage === 'card_sliver' ||
    selectedStage === 'b_drawing' ||
    selectedStage === 'f_drawing' ||
    selectedStage === 'simplex_roving';
  const isYarnStage =
    selectedStage === 'finished_yarn' ||
    selectedStage === 'rotor_yarn' ||
    selectedStage === 'ring_yarn';

  // Export handlers
  const handleExportExcel = () => {
    const stageTitle = activeStageConfig.labelEn.replace(/\s+/g, '_');
    exportToExcel(filteredReports, `Uster_${stageTitle}_Reports`);
    showToast('success', 'Excel Exported', `Downloaded ${activeStageConfig.labelEn} reports (.xlsx)`);
  };

  const handleExportPDF = () => {
    exportUsterPDFReport(dateFilteredAllReports, selectedStage, selectedLotFilter);
    showToast('success', 'PDF Exported', `Downloaded ${activeStageConfig.labelEn} official report (.pdf)`);
  };

  const handleExportFullPDF = () => {
    exportUsterPDFReport(dateFilteredAllReports, 'all', selectedLotFilter);
    showToast(
      'success',
      'Full PDF Exported',
      'Downloaded Complete 7-Stage Process Quality Report (Finished Yarn to Carding)'
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-800/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 border border-purple-400/30 rounded-full text-purple-300 text-xs font-semibold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Textile Quality Control • Uster Testing Laboratory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <TestTube className="w-8 h-8 text-purple-400" />
              Uster Test Module
            </h1>
            <p className="text-sm text-purple-200/80 leading-relaxed">
              Complete sequential process quality monitoring:{' '}
              <strong>1. Finished Yarn (Autoconer)</strong> &rarr;{' '}
              <strong>2. Rotor Yarn (Rotor Package)</strong> &rarr;{' '}
              <strong>3. Ring Yarn (Ring Cop)</strong> &rarr;{' '}
              <strong>4. Simplex Roving (Speed Frame)</strong> &rarr;{' '}
              <strong>5. F. Drawing (Finisher Drawing)</strong> &rarr;{' '}
              <strong>6. B Drawing (Breaker Drawing)</strong> &rarr;{' '}
              <strong>7. Carding Sliver (Card Sliver)</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => handleExportFullPDF()}
              className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-rose-600/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              title="Download Complete 7-Stage Process Flow PDF (Finished Yarn -> Rotor -> Ring -> Simplex -> F. Drawing -> B Drawing -> Carding)"
            >
              <FileText className="w-4 h-4 text-white" />
              <span>Export Full PDF (All 7 Stages)</span>
            </button>
            <button
              onClick={() => handleOpenAdd()}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Record New Uster Test</span>
            </button>
            <button
              onClick={() => triggerAppPrint()}
              className="no-print px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 backdrop-blur-md transition cursor-pointer"
              title="Print Active Stage Report"
            >
              <Printer className="w-4 h-4 text-purple-300" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Stage Sub-Navigation Tabs */}
        <div className="mt-8 pt-6 border-t border-purple-700/40">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-purple-500/30">
            {USTER_STAGES.map((st) => {
              const isActive = selectedStage === st.key;
              return (
                <button
                  key={st.key}
                  onClick={() => setSelectedStage(st.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-white text-purple-950 shadow-md shadow-black/20 scale-[1.02]'
                      : 'bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 border border-purple-700/40 hover:text-white'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-purple-600' : 'bg-purple-400'}`} />
                  <span>{st.shortLabel}</span>
                  <span className="text-[10px] opacity-75 font-normal">({st.subTitle})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stage Summary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Tests
            </span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{stageStats.count}</div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {activeStageConfig.shortLabel} Records
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Average U%
            </span>
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {stageStats.avgU}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Unevenness %</div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Average CVm%
            </span>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
            {stageStats.avgCvm}%
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Variation Mass %</div>
        </div>

        {/* Stage-adaptive metrics */}
        {isSliverOrRoving ? (
          <>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Avg CVm 1m
                </span>
                <Calculator className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {stageStats.avgCvm1m}%
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">1-Meter Cut CVm</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Avg CVm 3m
                </span>
                <Calculator className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-2xl font-black text-sky-600 dark:text-sky-400">
                {stageStats.avgCvm3m}%
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">3-Meter Cut CVm</div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Stage Status
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                In Tolerance
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Auto-Leveling Verified
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Avg Total IPI
                </span>
                <Sparkles className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {stageStats.avgIpi}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Thin + Thick + Neps
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Avg CSP
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {stageStats.avgCsp || '—'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Strength Product
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Thin / Thk / Nep
                </span>
                <Calculator className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-base font-bold text-slate-800 dark:text-slate-200 truncate">
                {stageStats.avgThin} / {stageStats.avgThick} / {stageStats.avgNeps}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Avg per km (IPI Breakdown)
              </div>
            </div>
          </>
        )}
      </div>

      {/* Action and Filter Control Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by U Test ID, Lot, Machine, Mixing, Count..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            {/* Lot Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <select
                value={selectedLotFilter}
                onChange={(e) => setSelectedLotFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white outline-none cursor-pointer"
              >
                <option value="ALL">All Lots ({distinctLots.length})</option>
                {distinctLots.map((lot) => (
                  <option key={lot} value={lot}>
                    {lot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Exports & Quick Stage Add */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportExcel}
              className="px-3 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Download Excel Sheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Download Official PDF Report"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => handleOpenAdd()}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add {activeStageConfig.shortLabel} Test</span>
            </button>
          </div>
        </div>

        <DateRangeFilter
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          totalCount={usterReports.length}
          filteredCount={filteredReports.length}
          label={`Filter ${activeStageConfig.labelEn} by Test Date`}
          accentColor="purple"
        />
      </div>

      {/* Main Uster Test Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">
              {activeStageConfig.labelEn} Register
            </h2>
            <span className="text-xs text-slate-500 font-medium">({activeStageConfig.subTitle})</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold">
              {filteredReports.length} {filteredReports.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            {isSliverOrRoving && <span>Parameters: U%, CVm%, CVm 1m, CVm 3m</span>}
            {isYarnStage && <span>Parameters: A. Count, CSP, U%, CVm%, Thin, Thick, Neps, IPI</span>}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100/75 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-3">U Test ID</th>
                {selectedStage === 'all' && <th className="px-3.5 py-3">Stage</th>}
                <th className="px-3.5 py-3">Date / Shift</th>
                <th className="px-3.5 py-3">Machine No</th>
                <th className="px-3.5 py-3">Lot No</th>
                <th className="px-3.5 py-3">Mixing / Blend</th>

                {/* Conditional Headers for Sliver vs Yarn */}
                {(isYarnStage || selectedStage === 'all') && (
                  <>
                    <th className="px-3.5 py-3">A. Count</th>
                    <th className="px-3.5 py-3 text-right">CSP</th>
                  </>
                )}

                <th className="px-3.5 py-3 text-right">U%</th>
                <th className="px-3.5 py-3 text-right">CVm%</th>

                {(isSliverOrRoving || selectedStage === 'all') && (
                  <>
                    <th className="px-3.5 py-3 text-right">CVm 1m</th>
                    <th className="px-3.5 py-3 text-right">CVm 3m</th>
                  </>
                )}

                {(isYarnStage || selectedStage === 'all') && (
                  <>
                    <th className="px-3.5 py-3 text-right">Thin (-50%)</th>
                    <th className="px-3.5 py-3 text-right">Thick (+50%)</th>
                    <th className="px-3.5 py-3 text-right">Neps (+200%)</th>
                    <th className="px-3.5 py-3 text-right text-rose-600 dark:text-rose-400">
                      Total IPI (Auto)
                    </th>
                  </>
                )}

                <th className="px-3.5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-4 py-12 text-center text-slate-400">
                    <TestTube className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      No Uster test records found for {activeStageConfig.labelEn}.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click "+ Add {activeStageConfig.shortLabel} Test" above to log a new laboratory test.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => {
                  const stageMeta = USTER_STAGES.find((s) => s.key === r.stage) || USTER_STAGES[0];
                  const thin = r.thinPlaces ?? 0;
                  const thick = r.thickPlaces ?? 0;
                  const neps = r.neps ?? 0;
                  const calculatedIpi = r.ipi !== undefined ? r.ipi : thin + thick + neps;
                  const isRecordYarn = r.stage === 'ring_yarn' || r.stage === 'finished_yarn' || !!r.count;

                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group"
                    >
                      <td className="px-3.5 py-3 font-mono font-bold text-purple-700 dark:text-purple-300 whitespace-nowrap">
                        {r.uTestId || `UT-${r.id}`}
                      </td>

                      {selectedStage === 'all' && (
                        <td className="px-3.5 py-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${stageMeta.badgeColor}`}
                          >
                            {stageMeta.shortLabel}
                          </span>
                        </td>
                      )}

                      <td className="px-3.5 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono">
                        <div>{r.testDate}</div>
                        {r.shift && (
                          <div className="text-[10px] text-slate-400">Shift {r.shift}</div>
                        )}
                      </td>

                      <td className="px-3.5 py-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                        {r.machine}
                      </td>

                      <td className="px-3.5 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {r.lotNo}
                      </td>

                      <td className="px-3.5 py-3 max-w-xs truncate" title={r.mixing}>
                        {r.mixing || '—'}
                      </td>

                      {/* Yarn specific cells */}
                      {(isYarnStage || selectedStage === 'all') && (
                        <>
                          <td className="px-3.5 py-3 font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                            {r.count || (isRecordYarn ? '—' : 'N/A')}
                          </td>
                          <td className="px-3.5 py-3 text-right font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            {r.csp ? r.csp : '—'}
                          </td>
                        </>
                      )}

                      <td className="px-3.5 py-3 text-right font-bold font-mono text-purple-700 dark:text-purple-300">
                        {r.unevenness !== undefined ? `${r.unevenness}%` : '—'}
                      </td>

                      <td className="px-3.5 py-3 text-right font-black font-mono text-indigo-700 dark:text-indigo-300">
                        {r.cvm !== undefined ? `${r.cvm}%` : '—'}
                      </td>

                      {/* Sliver / Roving cut length cells */}
                      {(isSliverOrRoving || selectedStage === 'all') && (
                        <>
                          <td className="px-3.5 py-3 text-right font-mono text-blue-600 dark:text-blue-400">
                            {r.cvm1m !== undefined && r.cvm1m !== null ? `${r.cvm1m}%` : '—'}
                          </td>
                          <td className="px-3.5 py-3 text-right font-mono text-sky-600 dark:text-sky-400">
                            {r.cvm3m !== undefined && r.cvm3m !== null ? `${r.cvm3m}%` : '—'}
                          </td>
                        </>
                      )}

                      {/* Yarn IPI breakdown cells */}
                      {(isYarnStage || selectedStage === 'all') && (
                        <>
                          <td className="px-3.5 py-3 text-right font-mono">
                            {isRecordYarn ? thin : '—'}
                          </td>
                          <td className="px-3.5 py-3 text-right font-mono">
                            {isRecordYarn ? thick : '—'}
                          </td>
                          <td className="px-3.5 py-3 text-right font-mono">
                            {isRecordYarn ? neps : '—'}
                          </td>
                          <td className="px-3.5 py-3 text-right font-black font-mono text-rose-600 dark:text-rose-400">
                            {isRecordYarn ? calculatedIpi : '—'}
                          </td>
                        </>
                      )}

                      <td className="px-3.5 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition cursor-pointer"
                            title="Edit Uster Test"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              requestAdminAction(`Delete Uster Report (${r.uTestId || r.lotNo})`, () => {
                                setUsterReports((prev) => prev.filter((item) => item.id !== r.id));
                                showToast('info', 'Deleted', `Removed test record ${r.uTestId || r.lotNo}`);
                              })
                            }
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition cursor-pointer"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          STAGE-AWARE ADD / EDIT MODAL
         ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-purple-900 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <TestTube className="w-5 h-5 text-purple-400" />
                  <span>
                    {editingItem ? 'Edit Uster Test Record' : 'Record New Uster Test'}
                  </span>
                </h3>
                <p className="text-xs text-purple-200/80 mt-0.5">
                  Patriot Spinning Mills • Quality Assurance & Testing Lab
                </p>
              </div>

              {/* Stage Selector Pills inside Modal */}
              <div className="flex items-center gap-1 bg-black/30 p-1 rounded-xl border border-white/10">
                {USTER_STAGES.filter((s) => s.key !== 'all').map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => {
                      setFormStage(st.key as UsterStage);
                      if (!editingItem) {
                        setFormData((prev) => ({
                          ...prev,
                          uTestId: generateTestId(st.key as UsterStage),
                        }));
                      }
                    }}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                      formStage === st.key
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-purple-200 hover:text-white'
                    }`}
                  >
                    {st.shortLabel}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Basic Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    U Test ID *
                  </label>
                  <input
                    type="text"
                    value={formData.uTestId}
                    onChange={(e) => setFormData({ ...formData, uTestId: e.target.value })}
                    required
                    placeholder="e.g. UT-CRD-101"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 font-mono font-bold text-purple-600 dark:text-purple-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Test Date *
                  </label>
                  <input
                    type="date"
                    value={formData.testDate}
                    onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Shift
                  </label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 cursor-pointer"
                  >
                    <option value="A">Shift A (Morning)</option>
                    <option value="B">Shift B (Evening)</option>
                    <option value="C">Shift C (Night)</option>
                    <option value="General">General Shift</option>
                  </select>
                </div>
              </div>

              {/* Machine, Lot, and Mixing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Machine No *
                  </label>
                  <input
                    type="text"
                    value={formData.machine}
                    onChange={(e) => setFormData({ ...formData, machine: e.target.value })}
                    required
                    placeholder={
                      formStage === 'card_sliver'
                        ? 'e.g. Carding M/C # 04'
                        : formStage === 'b_drawing'
                        ? 'e.g. B/Drawing # 01'
                        : formStage === 'f_drawing'
                        ? 'e.g. F/Drawing # 02'
                        : formStage === 'simplex_roving'
                        ? 'e.g. Simplex Frame # 03'
                        : formStage === 'ring_yarn'
                        ? 'e.g. Ring Frame # 14'
                        : 'e.g. Autoconer # 01'
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lot Number *
                  </label>
                  <input
                    type="text"
                    value={formData.lotNo}
                    onChange={(e) => setFormData({ ...formData, lotNo: e.target.value })}
                    required
                    placeholder="e.g. LOT-CH-3001"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mixing / Blend *
                  </label>
                  <input
                    type="text"
                    value={formData.mixing}
                    onChange={(e) => setFormData({ ...formData, mixing: e.target.value })}
                    placeholder="e.g. Cotton 100% US Memphis"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700"
                  />
                </div>
              </div>

              {/* STAGE 1-4: CARD TO SIMPLEX SPECIFIC INPUTS */}
              {(formStage === 'card_sliver' ||
                formStage === 'b_drawing' ||
                formStage === 'f_drawing' ||
                formStage === 'simplex_roving') && (
                <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-extrabold text-amber-900 dark:text-amber-300">
                    <span>Card to Simplex Parameters</span>
                    <span className="text-[10px] font-normal text-amber-700 dark:text-amber-400">
                      Machine No • Lot • Mixing • U% • CVm% • CVm 1m • CVm 3m
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        U% (Unevenness)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.unevenness}
                        onChange={(e) => setFormData({ ...formData, unevenness: e.target.value })}
                        placeholder="e.g. 2.85"
                        className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 font-bold font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        CVm% *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.cvm}
                        onChange={(e) => setFormData({ ...formData, cvm: e.target.value })}
                        required
                        placeholder="e.g. 3.65"
                        className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 font-black font-mono text-purple-600 dark:text-purple-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        CVm 1m (1 Meter)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.cvm1m}
                        onChange={(e) => setFormData({ ...formData, cvm1m: e.target.value })}
                        placeholder="e.g. 1.42"
                        className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 font-mono text-blue-600 dark:text-blue-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        CVm 3m (3 Meter)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.cvm3m}
                        onChange={(e) => setFormData({ ...formData, cvm3m: e.target.value })}
                        placeholder="e.g. 1.15"
                        className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 font-mono text-sky-600 dark:text-sky-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STAGE 5-7: RING, ROTOR & FINISHED YARN SPECIFIC INPUTS */}
              {(formStage === 'ring_yarn' || formStage === 'rotor_yarn' || formStage === 'finished_yarn') && (
                <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-extrabold text-purple-900 dark:text-purple-300">
                    <span>Yarn Package Parameters</span>
                    <span className="text-[10px] font-normal text-purple-700 dark:text-purple-400">
                      A. Count • CSP • U% • CVm% • Thin • Thick • Neps • Automatic IPI
                    </span>
                  </div>

                  {/* Count, CSP, U%, CVm% */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        A. Count (Actual Count) *
                      </label>
                      <input
                        type="text"
                        value={formData.count}
                        onChange={(e) => setFormData({ ...formData, count: e.target.value })}
                        required
                        placeholder="e.g. 30/1 Combed Hosiery"
                        className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        CSP (Strength Product)
                      </label>
                      <input
                        type="number"
                        value={formData.csp}
                        onChange={(e) => setFormData({ ...formData, csp: e.target.value })}
                        placeholder="e.g. 2680"
                        className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 font-mono font-bold text-emerald-600 dark:text-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        U% (Unevenness)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.unevenness}
                        onChange={(e) => setFormData({ ...formData, unevenness: e.target.value })}
                        placeholder="e.g. 9.85"
                        className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        CVm% *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.cvm}
                        onChange={(e) => setFormData({ ...formData, cvm: e.target.value })}
                        required
                        placeholder="e.g. 12.40"
                        className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 font-mono font-bold text-indigo-600 dark:text-indigo-400"
                      />
                    </div>
                  </div>

                  {/* Thin, Thick, Neps, and Auto IPI Calculation */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-purple-200 dark:border-purple-800/40">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Thin (-50%/km)
                      </label>
                      <input
                        type="number"
                        value={formData.thinPlaces}
                        onChange={(e) => handleYarnImperfectionChange('thin', e.target.value)}
                        placeholder="e.g. 2"
                        className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Thick (+50%/km)
                      </label>
                      <input
                        type="number"
                        value={formData.thickPlaces}
                        onChange={(e) => handleYarnImperfectionChange('thick', e.target.value)}
                        placeholder="e.g. 18"
                        className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        Neps (+200%/km)
                      </label>
                      <input
                        type="number"
                        value={formData.neps}
                        onChange={(e) => handleYarnImperfectionChange('neps', e.target.value)}
                        placeholder="e.g. 38"
                        className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 font-mono"
                      />
                    </div>

                    {/* AUTOMATIC CALCULATED IPI DISPLAY */}
                    <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 p-2.5 rounded-xl">
                      <div className="flex items-center justify-between text-[11px] font-bold text-rose-700 dark:text-rose-300">
                        <span>Total IPI</span>
                        <span className="text-[10px] text-rose-500 font-normal">Auto = Thin+Thk+Nep</span>
                      </div>
                      <div className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono mt-0.5">
                        {formData.ipi ||
                          (Number(formData.thinPlaces) || 0) +
                            (Number(formData.thickPlaces) || 0) +
                            (Number(formData.neps) || 0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tested By & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tested By / Lab Officer
                  </label>
                  <input
                    type="text"
                    value={formData.testedBy}
                    onChange={(e) => setFormData({ ...formData, testedBy: e.target.value })}
                    placeholder="e.g. Engr. M. Rahman"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Remarks / Quality Notes
                  </label>
                  <input
                    type="text"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="e.g. Within 5% Uster standard"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  {editingItem ? 'Update Test Report' : 'Save Uster Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
