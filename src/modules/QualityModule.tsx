import React, { useState } from 'react';
import {
  Microscope,
  TestTube,
  Plus,
  Edit3,
  Trash2,
  Download,
  Search,
} from 'lucide-react';
import { HVIReport, UsterReport } from '../types';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

interface QualityModuleProps {
  subTab: 'hvi' | 'uster';
  hviReports: HVIReport[];
  setHviReports: React.Dispatch<React.SetStateAction<HVIReport[]>>;
  usterReports: UsterReport[];
  setUsterReports: React.Dispatch<React.SetStateAction<UsterReport[]>>;
  requestAdminAction: (title: string, action: () => void) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const QualityModule: React.FC<QualityModuleProps> = ({
  subTab,
  hviReports,
  setHviReports,
  usterReports,
  setUsterReports,
  requestAdminAction,
  showToast,
}) => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showHVIModal, setShowHVIModal] = useState(false);
  const [editingHVI, setEditingHVI] = useState<HVIReport | null>(null);
  const [hviForm, setHviForm] = useState({
    testDate: new Date().toISOString().split('T')[0],
    consignment: 'BR-2026-001',
    mic: '4.2',
    uhml: '28.8',
    ui: '83.5',
    strength: '30.5',
    elongation: '6.8',
    sfi: '7.0',
    moisture: '7.5',
    rd: '78.5',
    yellowness: '8.4',
    colorGrade: '31-3',
    trashCnt: '18',
    trashAr: '0.25',
    sci: '138',
    remarks: '',
  });

  const [showUsterModal, setShowUsterModal] = useState(false);
  const [editingUster, setEditingUster] = useState<UsterReport | null>(null);
  const [usterForm, setUsterForm] = useState({
    testDate: new Date().toISOString().split('T')[0],
    lotNo: 'LOT-CH-3001',
    count: '30/1 Combed Hosiery',
    process: 'Ring' as 'Ring' | 'Rotor',
    machine: 'Ring Frame # 08',
    unevenness: '9.8',
    cvm: '12.4',
    thinPlaces: '2',
    thickPlaces: '18',
    neps: '38',
    ipi: '58',
    hairiness: '5.2',
    csp: '2650',
    remarks: '',
  });

  // Filtered lists
  const filteredHVI = hviReports.filter((h) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return h.consignment.toLowerCase().includes(q) || h.colorGrade.toLowerCase().includes(q);
  });

  const filteredUster = usterReports.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.lotNo.toLowerCase().includes(q) ||
      u.count.toLowerCase().includes(q) ||
      u.machine.toLowerCase().includes(q)
    );
  });

  // Open HVI modal
  const handleOpenAddHVI = () => {
    setEditingHVI(null);
    setHviForm({
      testDate: new Date().toISOString().split('T')[0],
      consignment: 'BR-2026-001',
      mic: '4.2',
      uhml: '28.8',
      ui: '83.5',
      strength: '30.5',
      elongation: '6.8',
      sfi: '7.0',
      moisture: '7.5',
      rd: '78.5',
      yellowness: '8.4',
      colorGrade: '31-3',
      trashCnt: '18',
      trashAr: '0.25',
      sci: '138',
      remarks: '',
    });
    setShowHVIModal(true);
  };

  const handleOpenEditHVI = (h: HVIReport) => {
    setEditingHVI(h);
    setHviForm({
      testDate: h.testDate,
      consignment: h.consignment,
      mic: String(h.mic),
      uhml: String(h.uhml),
      ui: String(h.ui),
      strength: String(h.strength),
      elongation: String(h.elongation),
      sfi: String(h.sfi),
      moisture: String(h.moisture),
      rd: String(h.rd),
      yellowness: String(h.yellowness),
      colorGrade: h.colorGrade,
      trashCnt: String(h.trashCnt),
      trashAr: String(h.trashAr),
      sci: String(h.sci),
      remarks: h.remarks,
    });
    setShowHVIModal(true);
  };

  // Open Uster modal
  const handleOpenAddUster = () => {
    setEditingUster(null);
    setUsterForm({
      testDate: new Date().toISOString().split('T')[0],
      lotNo: 'LOT-CH-3001',
      count: '30/1 Combed Hosiery',
      process: 'Ring',
      machine: 'Ring Frame # 08',
      unevenness: '9.8',
      cvm: '12.4',
      thinPlaces: '2',
      thickPlaces: '18',
      neps: '38',
      ipi: '58',
      hairiness: '5.2',
      csp: '2650',
      remarks: '',
    });
    setShowUsterModal(true);
  };

  const handleOpenEditUster = (u: UsterReport) => {
    setEditingUster(u);
    setUsterForm({
      testDate: u.testDate,
      lotNo: u.lotNo,
      count: u.count,
      process: u.process,
      machine: u.machine,
      unevenness: String(u.unevenness),
      cvm: String(u.cvm),
      thinPlaces: String(u.thinPlaces),
      thickPlaces: String(u.thickPlaces),
      neps: String(u.neps),
      ipi: String(u.ipi),
      hairiness: String(u.hairiness),
      csp: String(u.csp),
      remarks: u.remarks,
    });
    setShowUsterModal(true);
  };

  // Submit HVI
  const handleSaveHVI = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hviForm.consignment || !hviForm.mic) {
      showToast('error', 'Missing Parameters', 'Consignment and Micronaire are required');
      return;
    }

    if (editingHVI) {
      setHviReports((prev) =>
        prev.map((h) =>
          h.id === editingHVI.id
            ? {
                ...h,
                testDate: hviForm.testDate,
                consignment: hviForm.consignment,
                mic: Number(hviForm.mic),
                uhml: Number(hviForm.uhml),
                ui: Number(hviForm.ui),
                strength: Number(hviForm.strength),
                elongation: Number(hviForm.elongation),
                sfi: Number(hviForm.sfi),
                moisture: Number(hviForm.moisture),
                rd: Number(hviForm.rd),
                yellowness: Number(hviForm.yellowness),
                colorGrade: hviForm.colorGrade,
                trashCnt: Number(hviForm.trashCnt),
                trashAr: Number(hviForm.trashAr),
                sci: Number(hviForm.sci),
                remarks: hviForm.remarks,
              }
            : h
        )
      );
      showToast('success', 'HVI Updated', `Updated report for ${hviForm.consignment}`);
    } else {
      const newHVI: HVIReport = {
        id: Date.now(),
        testDate: hviForm.testDate,
        consignment: hviForm.consignment,
        mic: Number(hviForm.mic),
        uhml: Number(hviForm.uhml),
        ui: Number(hviForm.ui),
        strength: Number(hviForm.strength),
        elongation: Number(hviForm.elongation),
        sfi: Number(hviForm.sfi),
        moisture: Number(hviForm.moisture),
        rd: Number(hviForm.rd),
        yellowness: Number(hviForm.yellowness),
        colorGrade: hviForm.colorGrade,
        trashCnt: Number(hviForm.trashCnt),
        trashAr: Number(hviForm.trashAr),
        sci: Number(hviForm.sci),
        remarks: hviForm.remarks,
      };
      setHviReports((prev) => [...prev, newHVI]);
      showToast('success', 'HVI Saved', `Added new HVI quality report for ${newHVI.consignment}`);
    }

    setShowHVIModal(false);
  };

  // Submit Uster
  const handleSaveUster = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usterForm.count || !usterForm.cvm) {
      showToast('error', 'Missing Parameters', 'Count and CVm% are required');
      return;
    }

    const thin = Number(usterForm.thinPlaces) || 0;
    const thick = Number(usterForm.thickPlaces) || 0;
    const neps = Number(usterForm.neps) || 0;
    const computedIpi = Number(usterForm.ipi) || thin + thick + neps;

    if (editingUster) {
      setUsterReports((prev) =>
        prev.map((u) =>
          u.id === editingUster.id
            ? {
                ...u,
                testDate: usterForm.testDate,
                lotNo: usterForm.lotNo,
                count: usterForm.count,
                process: usterForm.process,
                machine: usterForm.machine,
                unevenness: Number(usterForm.unevenness),
                cvm: Number(usterForm.cvm),
                thinPlaces: thin,
                thickPlaces: thick,
                neps: neps,
                ipi: computedIpi,
                hairiness: Number(usterForm.hairiness),
                csp: Number(usterForm.csp),
                remarks: usterForm.remarks,
              }
            : u
        )
      );
      showToast('success', 'Uster Updated', `Updated Uster report for ${usterForm.count}`);
    } else {
      const newUster: UsterReport = {
        id: Date.now(),
        testDate: usterForm.testDate,
        lotNo: usterForm.lotNo,
        count: usterForm.count,
        process: usterForm.process,
        machine: usterForm.machine,
        unevenness: Number(usterForm.unevenness),
        cvm: Number(usterForm.cvm),
        thinPlaces: thin,
        thickPlaces: thick,
        neps: neps,
        ipi: computedIpi,
        hairiness: Number(usterForm.hairiness),
        csp: Number(usterForm.csp),
        remarks: usterForm.remarks,
      };
      setUsterReports((prev) => [...prev, newUster]);
      showToast('success', 'Uster Saved', `Added Uster report for ${newUster.count}`);
    }

    setShowUsterModal(false);
  };

  // EXPORTS
  const exportHVIExcel = () => {
    exportToExcel(hviReports, 'HVI_Quality_Test_Reports');
    showToast('success', 'Excel Exported', 'Downloaded HVI Test Reports (.xlsx)');
  };

  const exportHVIPDF = () => {
    const headers = ['Date', 'Consignment', 'MIC', 'UHML', 'UI%', 'STR', 'Moist%', 'Rd', '+b', 'Trash Cnt', 'Trash Ar%', 'SCI'];
    const rows = hviReports.map((h) => [
      h.testDate,
      h.consignment,
      h.mic,
      h.uhml,
      h.ui,
      h.strength,
      `${h.moisture}%`,
      h.rd,
      h.yellowness,
      h.trashCnt,
      `${h.trashAr}%`,
      h.sci,
    ]);
    exportToPDF('High Volume Instrument (HVI) Fiber Test Reports', headers, rows, 'HVI_Test_Reports', 'landscape');
    showToast('success', 'PDF Exported', 'Downloaded HVI Test Reports (.pdf)');
  };

  const exportUsterExcel = () => {
    exportToExcel(usterReports, 'Uster_Yarn_Quality_Reports');
    showToast('success', 'Excel Exported', 'Downloaded Uster Test Reports (.xlsx)');
  };

  const exportUsterPDF = () => {
    const headers = ['Date', 'Lot', 'Count', 'Process', 'U%', 'CVm%', 'Thin', 'Thick', 'Neps', 'IPI', 'CSP'];
    const rows = usterReports.map((u) => [
      u.testDate,
      u.lotNo,
      u.count,
      u.process,
      u.unevenness,
      u.cvm,
      u.thinPlaces,
      u.thickPlaces,
      u.neps,
      u.ipi,
      u.csp,
    ]);
    exportToPDF('Uster Yarn Evenness & Quality Test Reports', headers, rows, 'Uster_Test_Reports', 'landscape');
    showToast('success', 'PDF Exported', 'Downloaded Uster Test Reports (.pdf)');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* ==================== SUB-TAB 1: HVI TEST REPORTS ==================== */}
      {subTab === 'hvi' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl flex items-center justify-center">
                <Microscope className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  High Volume Instrument (HVI) Fiber Test Reports
                </h1>
                <p className="text-xs text-slate-500">
                  Fiber Micronaire, Length, Uniformity, Strength, and Spinning Index (SCI)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleOpenAddHVI}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Record HVI Test
              </button>
            </div>
          </div>

          {/* Search & Export Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search consignment..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={exportHVIExcel}
                className="px-3 py-1.5 bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Excel
              </button>
              <button
                onClick={exportHVIPDF}
                className="px-3 py-1.5 bg-purple-100 text-purple-700 font-bold rounded-xl text-xs flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>

          {/* HVI Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Consignment</th>
                    <th className="px-3 py-3 text-right">MIC</th>
                    <th className="px-3 py-3 text-right">UHML</th>
                    <th className="px-3 py-3 text-right">UI%</th>
                    <th className="px-3 py-3 text-right">STR</th>
                    <th className="px-3 py-3 text-right">Elong</th>
                    <th className="px-3 py-3 text-right">SFI</th>
                    <th className="px-3 py-3 text-right">Moist%</th>
                    <th className="px-3 py-3 text-right">Rd</th>
                    <th className="px-3 py-3 text-right">+b</th>
                    <th className="px-3 py-3 text-right">Trash Cnt</th>
                    <th className="px-3 py-3 text-right">Trash Area</th>
                    <th className="px-3 py-3 text-right">SCI</th>
                    <th className="px-3 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {filteredHVI.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="px-4 py-8 text-center text-slate-400">
                        No HVI test reports found.
                      </td>
                    </tr>
                  ) : (
                    filteredHVI.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition font-mono">
                        <td className="px-3 py-3 text-slate-600">{h.testDate}</td>
                        <td className="px-3 py-3 font-bold text-purple-600 dark:text-purple-400">
                          {h.consignment}
                        </td>
                        <td className="px-3 py-3 text-right font-bold">{h.mic}</td>
                        <td className="px-3 py-3 text-right">{h.uhml}</td>
                        <td className="px-3 py-3 text-right">{h.ui}%</td>
                        <td className="px-3 py-3 text-right font-bold text-slate-900 dark:text-white">
                          {h.strength}
                        </td>
                        <td className="px-3 py-3 text-right">{h.elongation}%</td>
                        <td className="px-3 py-3 text-right">{h.sfi}%</td>
                        <td className="px-3 py-3 text-right font-bold text-sky-600 dark:text-sky-400">{h.moisture}%</td>
                        <td className="px-3 py-3 text-right">{h.rd}</td>
                        <td className="px-3 py-3 text-right">{h.yellowness}</td>
                        <td className="px-3 py-3 text-right font-bold">{h.trashCnt}</td>
                        <td className="px-3 py-3 text-right">{h.trashAr}%</td>
                        <td className="px-3 py-3 text-right font-black text-purple-600 dark:text-purple-400 text-xs">
                          {h.sci}
                        </td>
                        <td className="px-3 py-3 text-center flex items-center justify-center gap-1 font-sans">
                          <button
                            onClick={() => handleOpenEditHVI(h)}
                            className="p-1 rounded text-blue-600 hover:bg-blue-50"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              requestAdminAction(`Delete HVI Report (${h.consignment})`, () => {
                                setHviReports((prev) => prev.filter((item) => item.id !== h.id));
                                showToast('info', 'Deleted', `Removed HVI test report ${h.consignment}`);
                              })
                            }
                            className="p-1 rounded text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 2: USTER TEST REPORTS ==================== */}
      {subTab === 'uster' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl flex items-center justify-center">
                <TestTube className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Uster Yarn Evenness & Imperfection (IPI) Test Reports
                </h1>
                <p className="text-xs text-slate-500">
                  Testing U%, CVm%, Thin/Thick/Neps (IPI), Hairiness (H), and CSP
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenAddUster}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs shadow transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Record Uster Test
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search count or lot..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={exportUsterExcel}
                className="px-3 py-1.5 bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Excel
              </button>
              <button
                onClick={exportUsterPDF}
                className="px-3 py-1.5 bg-purple-100 text-purple-700 font-bold rounded-xl text-xs flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-3 py-3">Date</th>
                    <th className="px-3 py-3">Lot No</th>
                    <th className="px-3 py-3">Count</th>
                    <th className="px-3 py-3">Process</th>
                    <th className="px-3 py-3 text-right">U%</th>
                    <th className="px-3 py-3 text-right">CVm%</th>
                    <th className="px-3 py-3 text-right">Thin (-50%)</th>
                    <th className="px-3 py-3 text-right">Thick (+50%)</th>
                    <th className="px-3 py-3 text-right">Neps (+200%)</th>
                    <th className="px-3 py-3 text-right">Total IPI</th>
                    <th className="px-3 py-3 text-right">Hairiness</th>
                    <th className="px-3 py-3 text-right">CSP</th>
                    <th className="px-3 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {filteredUster.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="px-4 py-8 text-center text-slate-400">
                        No Uster test reports recorded.
                      </td>
                    </tr>
                  ) : (
                    filteredUster.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition font-mono">
                        <td className="px-3 py-3 text-slate-600">{u.testDate}</td>
                        <td className="px-3 py-3 font-bold text-slate-900 dark:text-white">{u.lotNo}</td>
                        <td className="px-3 py-3 font-sans font-bold text-purple-600 dark:text-purple-400">
                          {u.count}
                        </td>
                        <td className="px-3 py-3 font-sans">{u.process}</td>
                        <td className="px-3 py-3 text-right">{u.unevenness}%</td>
                        <td className="px-3 py-3 text-right font-bold">{u.cvm}%</td>
                        <td className="px-3 py-3 text-right">{u.thinPlaces}</td>
                        <td className="px-3 py-3 text-right">{u.thickPlaces}</td>
                        <td className="px-3 py-3 text-right">{u.neps}</td>
                        <td className="px-3 py-3 text-right font-bold text-rose-600 dark:text-rose-400">
                          {u.ipi}
                        </td>
                        <td className="px-3 py-3 text-right">{u.hairiness}</td>
                        <td className="px-3 py-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                          {u.csp}
                        </td>
                        <td className="px-3 py-3 text-center flex items-center justify-center gap-1 font-sans">
                          <button
                            onClick={() => handleOpenEditUster(u)}
                            className="p-1 rounded text-blue-600 hover:bg-blue-50"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              requestAdminAction(`Delete Uster Report (${u.count})`, () => {
                                setUsterReports((prev) => prev.filter((item) => item.id !== u.id));
                                showToast('info', 'Deleted', `Removed Uster test report for ${u.count}`);
                              })
                            }
                            className="p-1 rounded text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal for HVI Test Form */}
      {showHVIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl p-6 border border-slate-200 dark:border-slate-700 overflow-y-auto max-h-[90vh]">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              {editingHVI ? 'Edit HVI Test Report' : 'Record New HVI Test Report'}
            </h3>

            <form onSubmit={handleSaveHVI} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Test Date *</label>
                  <input
                    type="date"
                    value={hviForm.testDate}
                    onChange={(e) => setHviForm({ ...hviForm, testDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Consignment Lot *</label>
                  <input
                    type="text"
                    value={hviForm.consignment}
                    onChange={(e) => setHviForm({ ...hviForm, consignment: e.target.value })}
                    required
                    placeholder="e.g. BR-2026-001"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Micronaire (MIC) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={hviForm.mic}
                    onChange={(e) => setHviForm({ ...hviForm, mic: e.target.value })}
                    required
                    placeholder="e.g. 4.2"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">UHML (mm/in) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={hviForm.uhml}
                    onChange={(e) => setHviForm({ ...hviForm, uhml: e.target.value })}
                    required
                    placeholder="e.g. 28.8"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Uniformity UI% *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={hviForm.ui}
                    onChange={(e) => setHviForm({ ...hviForm, ui: e.target.value })}
                    required
                    placeholder="e.g. 83.5"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Strength (g/tex) *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={hviForm.strength}
                    onChange={(e) => setHviForm({ ...hviForm, strength: e.target.value })}
                    required
                    placeholder="e.g. 30.5"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Elongation %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={hviForm.elongation}
                    onChange={(e) => setHviForm({ ...hviForm, elongation: e.target.value })}
                    placeholder="e.g. 6.8"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Short Fiber Index (SFI)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={hviForm.sfi}
                    onChange={(e) => setHviForm({ ...hviForm, sfi: e.target.value })}
                    placeholder="e.g. 7.0"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Reflectance Rd</label>
                  <input
                    type="number"
                    step="0.1"
                    value={hviForm.rd}
                    onChange={(e) => setHviForm({ ...hviForm, rd: e.target.value })}
                    placeholder="e.g. 78.5"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Yellowness +b</label>
                  <input
                    type="number"
                    step="0.1"
                    value={hviForm.yellowness}
                    onChange={(e) => setHviForm({ ...hviForm, yellowness: e.target.value })}
                    placeholder="e.g. 8.4"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Spinning Index (SCI)</label>
                  <input
                    type="number"
                    value={hviForm.sci}
                    onChange={(e) => setHviForm({ ...hviForm, sci: e.target.value })}
                    placeholder="e.g. 138"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700 font-bold text-purple-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowHVIModal(false)}
                  className="flex-1 py-2 text-xs border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs bg-purple-600 text-white font-bold rounded-xl shadow"
                >
                  Save HVI Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal for Uster Test Form */}
      {showUsterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl p-6 border border-slate-200 dark:border-slate-700 overflow-y-auto max-h-[90vh]">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              {editingUster ? 'Edit Uster Report' : 'Record New Uster Test Report'}
            </h3>

            <form onSubmit={handleSaveUster} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Test Date *</label>
                  <input
                    type="date"
                    value={usterForm.testDate}
                    onChange={(e) => setUsterForm({ ...usterForm, testDate: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Yarn Count *</label>
                  <input
                    type="text"
                    value={usterForm.count}
                    onChange={(e) => setUsterForm({ ...usterForm, count: e.target.value })}
                    required
                    placeholder="e.g. 30/1 Combed Hosiery"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Lot Number</label>
                  <input
                    type="text"
                    value={usterForm.lotNo}
                    onChange={(e) => setUsterForm({ ...usterForm, lotNo: e.target.value })}
                    placeholder="e.g. LOT-CH-3001"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Process</label>
                  <select
                    value={usterForm.process}
                    onChange={(e) => setUsterForm({ ...usterForm, process: e.target.value as 'Ring' | 'Rotor' })}
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700"
                  >
                    <option value="Ring">Ring</option>
                    <option value="Rotor">Rotor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Machine No</label>
                  <input
                    type="text"
                    value={usterForm.machine}
                    onChange={(e) => setUsterForm({ ...usterForm, machine: e.target.value })}
                    placeholder="e.g. Ring Frame # 08"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Unevenness U%</label>
                  <input
                    type="number"
                    step="0.01"
                    value={usterForm.unevenness}
                    onChange={(e) => setUsterForm({ ...usterForm, unevenness: e.target.value })}
                    placeholder="e.g. 9.8"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">CVm % *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={usterForm.cvm}
                    onChange={(e) => setUsterForm({ ...usterForm, cvm: e.target.value })}
                    required
                    placeholder="e.g. 12.4"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Hairiness (H)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={usterForm.hairiness}
                    onChange={(e) => setUsterForm({ ...usterForm, hairiness: e.target.value })}
                    placeholder="e.g. 5.2"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Thin (-50%)</label>
                  <input
                    type="number"
                    value={usterForm.thinPlaces}
                    onChange={(e) => {
                      const val = e.target.value;
                      const thin = Number(val) || 0;
                      const thick = Number(usterForm.thickPlaces) || 0;
                      const neps = Number(usterForm.neps) || 0;
                      setUsterForm((prev) => ({
                        ...prev,
                        thinPlaces: val,
                        ipi: String(thin + thick + neps),
                      }));
                    }}
                    placeholder="e.g. 2"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Thick (+50%)</label>
                  <input
                    type="number"
                    value={usterForm.thickPlaces}
                    onChange={(e) => {
                      const val = e.target.value;
                      const thin = Number(usterForm.thinPlaces) || 0;
                      const thick = Number(val) || 0;
                      const neps = Number(usterForm.neps) || 0;
                      setUsterForm((prev) => ({
                        ...prev,
                        thickPlaces: val,
                        ipi: String(thin + thick + neps),
                      }));
                    }}
                    placeholder="e.g. 18"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Neps (+200%)</label>
                  <input
                    type="number"
                    value={usterForm.neps}
                    onChange={(e) => {
                      const val = e.target.value;
                      const thin = Number(usterForm.thinPlaces) || 0;
                      const thick = Number(usterForm.thickPlaces) || 0;
                      const neps = Number(val) || 0;
                      setUsterForm((prev) => ({
                        ...prev,
                        neps: val,
                        ipi: String(thin + thick + neps),
                      }));
                    }}
                    placeholder="e.g. 38"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 flex items-center justify-between">
                    <span>Total IPI</span>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-normal">
                      (Auto = Thin + Thick + Neps)
                    </span>
                  </label>
                  <input
                    type="number"
                    value={
                      usterForm.ipi ||
                      String(
                        (Number(usterForm.thinPlaces) || 0) +
                          (Number(usterForm.thickPlaces) || 0) +
                          (Number(usterForm.neps) || 0)
                      )
                    }
                    onChange={(e) => setUsterForm({ ...usterForm, ipi: e.target.value })}
                    placeholder="e.g. 58"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700 font-bold text-rose-600 dark:text-rose-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">CSP Strength</label>
                  <input
                    type="number"
                    value={usterForm.csp}
                    onChange={(e) => setUsterForm({ ...usterForm, csp: e.target.value })}
                    placeholder="e.g. 2650"
                    className="w-full px-3 py-2 text-xs border rounded-xl bg-white dark:bg-slate-700 font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUsterModal(false)}
                  className="flex-1 py-2 text-xs border rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs bg-purple-600 text-white font-bold rounded-xl shadow"
                >
                  Save Uster Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
