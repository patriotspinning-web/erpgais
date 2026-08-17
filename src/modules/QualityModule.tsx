import React, { useState } from 'react';
import {
  Microscope,
  Plus,
  Edit3,
  Trash2,
  Download,
  Search,
  Printer,
} from 'lucide-react';
import { HVIReport, UsterReport } from '../types';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { triggerAppPrint } from '../utils/printUtils';
import { UsterModule } from './UsterModule';

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

  // Filtered lists
  const filteredHVI = hviReports.filter((h) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return h.consignment.toLowerCase().includes(q) || h.colorGrade.toLowerCase().includes(q);
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
                onClick={() => triggerAppPrint()}
                className="no-print px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 font-bold rounded-xl text-xs flex items-center gap-1 transition"
                title="Print HVI Reports"
              >
                <Printer className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> Print
              </button>
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
        <UsterModule
          usterReports={usterReports}
          setUsterReports={setUsterReports}
          requestAdminAction={requestAdminAction}
          showToast={showToast}
        />
      )}
    </div>
  );
};
