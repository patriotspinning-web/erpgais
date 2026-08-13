import React, { useState } from 'react';
import {
  PackagePlus,
  PackageMinus,
  Archive,
  FileBarChart,
  Plus,
  Trash2,
  Download,
  Calendar,
  Layers,
  Search,
} from 'lucide-react';
import { CottonReceive, CottonIssue, CottonLotStock } from '../types';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

interface CottonModuleProps {
  subTab: 'receive' | 'issue' | 'stock' | 'reports';
  cottonCountries: string[];
  setCottonCountries: React.Dispatch<React.SetStateAction<string[]>>;
  cottonReceives: CottonReceive[];
  setCottonReceives: React.Dispatch<React.SetStateAction<CottonReceive[]>>;
  cottonIssues: CottonIssue[];
  setCottonIssues: React.Dispatch<React.SetStateAction<CottonIssue[]>>;
  requestAdminAction: (title: string, action: () => void) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const CottonModule: React.FC<CottonModuleProps> = ({
  subTab,
  cottonCountries,
  setCottonCountries,
  cottonReceives,
  setCottonReceives,
  cottonIssues,
  setCottonIssues,
  requestAdminAction,
  showToast,
}) => {
  // Add Country Modal
  const [showAddCountryModal, setShowAddCountryModal] = useState(false);
  const [newCountryName, setNewCountryName] = useState('');

  // Receive Form
  const [receiveForm, setReceiveForm] = useState({
    origin: '',
    supplierName: '',
    consignment: '',
    fiberLength: '',
    lcNo: '',
    idCode: '',
    date: new Date().toISOString().split('T')[0],
    lcQuantity: '',
    actualReceive: '',
    actualReceiveKg: '',
    remarks: '',
  });

  // Issue Form
  const [issueForm, setIssueForm] = useState({
    srNo: '',
    date: new Date().toISOString().split('T')[0],
    origin: '',
    consignment: '',
    processType: 'Ring',
    department: 'Blowroom Line 1',
    baleQty: '',
    weightKg: '',
    remarks: '',
  });

  // Reports Date Selectors
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'receive' | 'issue' | 'ledger' | 'stock'>('daily');
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyPeriod, setMonthlyPeriod] = useState(new Date().toISOString().substring(0, 7));

  // Auto-generate SR No
  const generateSrNo = () => {
    return `SR-C-${new Date().getFullYear()}-${String(cottonIssues.length + 1).padStart(3, '0')}`;
  };

  // Compute Cotton Stock by Consignment Lot
  const getLotStock = (): CottonLotStock[] => {
    const lotMap: Record<string, CottonLotStock> = {};

    cottonReceives.forEach((r) => {
      if (!lotMap[r.consignment]) {
        lotMap[r.consignment] = {
          consignment: r.consignment,
          origin: r.origin,
          supplierName: r.supplierName || '—',
          lcNo: r.lcNo,
          receivedBale: 0,
          receivedKg: 0,
          issuedBale: 0,
          issuedKg: 0,
          balanceBale: 0,
          balanceKg: 0,
          avgKgPerBale: 0,
        };
      }
      lotMap[r.consignment].receivedBale += Number(r.actualReceive);
      lotMap[r.consignment].receivedKg += Number(r.actualReceiveKg);
    });

    cottonIssues.forEach((i) => {
      if (!lotMap[i.consignment]) {
        lotMap[i.consignment] = {
          consignment: i.consignment,
          origin: i.origin,
          supplierName: '—',
          lcNo: '—',
          receivedBale: 0,
          receivedKg: 0,
          issuedBale: 0,
          issuedKg: 0,
          balanceBale: 0,
          balanceKg: 0,
          avgKgPerBale: 0,
        };
      }
      lotMap[i.consignment].issuedBale += Number(i.baleQty);
      lotMap[i.consignment].issuedKg += Number(i.weightKg);
    });

    Object.values(lotMap).forEach((lot) => {
      lot.balanceBale = lot.receivedBale - lot.issuedBale;
      lot.balanceKg = lot.receivedKg - lot.issuedKg;
      lot.avgKgPerBale = lot.receivedBale > 0 ? lot.receivedKg / lot.receivedBale : 0;
    });

    return Object.values(lotMap);
  };

  const lotStockList = getLotStock();
  const availableLots = lotStockList.filter((l) => l.balanceBale > 0);

  // Auto calculation of weight when bale quantity changes in Issue Form
  const handleIssueBaleChange = (bales: string) => {
    const baleVal = Number(bales) || 0;
    const selectedLot = lotStockList.find((l) => l.consignment === issueForm.consignment);
    const avgKg = selectedLot && selectedLot.receivedBale > 0 ? selectedLot.receivedKg / selectedLot.receivedBale : 226.8;
    const computedKg = Math.round(baleVal * avgKg * 100) / 100;

    setIssueForm((prev) => ({
      ...prev,
      baleQty: bales,
      weightKg: computedKg ? String(computedKg) : '',
    }));
  };

  const handleConsignmentSelect = (consignment: string) => {
    const selectedLot = lotStockList.find((l) => l.consignment === consignment);
    const baleVal = Number(issueForm.baleQty) || 0;
    const avgKg = selectedLot && selectedLot.receivedBale > 0 ? selectedLot.receivedKg / selectedLot.receivedBale : 226.8;
    const computedKg = Math.round(baleVal * avgKg * 100) / 100;

    setIssueForm((prev) => ({
      ...prev,
      consignment,
      origin: selectedLot ? selectedLot.origin : prev.origin,
      weightKg: computedKg ? String(computedKg) : prev.weightKg,
    }));
  };

  // Submit Receive
  const handleSaveReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveForm.origin || !receiveForm.consignment || !receiveForm.actualReceive) {
      showToast('error', 'Missing Information', 'Please fill in Origin, Consignment, and Receive Quantity');
      return;
    }

    const newRec: CottonReceive = {
      id: Date.now(),
      date: receiveForm.date,
      origin: receiveForm.origin,
      supplierName: receiveForm.supplierName || '—',
      consignment: receiveForm.consignment,
      fiberLength: receiveForm.fiberLength || '1-3/32"',
      lcNo: receiveForm.lcNo || '—',
      idCode: receiveForm.idCode || '—',
      lcQuantity: Number(receiveForm.lcQuantity) || Number(receiveForm.actualReceive),
      actualReceive: Number(receiveForm.actualReceive),
      actualReceiveKg: Number(receiveForm.actualReceiveKg) || Number(receiveForm.actualReceive) * 226.8,
      remarks: receiveForm.remarks,
    };

    setCottonReceives((prev) => [...prev, newRec]);
    showToast('success', 'Cotton Received', `Received ${newRec.actualReceive} bales for consignment ${newRec.consignment}`);

    setReceiveForm({
      origin: '',
      supplierName: '',
      consignment: '',
      fiberLength: '',
      lcNo: '',
      idCode: '',
      date: new Date().toISOString().split('T')[0],
      lcQuantity: '',
      actualReceive: '',
      actualReceiveKg: '',
      remarks: '',
    });
  };

  // Submit Issue
  const handleSaveIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.consignment || !issueForm.baleQty) {
      showToast('error', 'Missing Information', 'Please select Consignment and enter Bale Quantity');
      return;
    }

    const selectedLot = lotStockList.find((l) => l.consignment === issueForm.consignment);
    const baleQtyNum = Number(issueForm.baleQty);

    if (selectedLot && baleQtyNum > selectedLot.balanceBale) {
      showToast('error', 'Insufficient Stock', `Lot ${selectedLot.consignment} has only ${selectedLot.balanceBale} bales in stock`);
      return;
    }

    const newIssue: CottonIssue = {
      id: Date.now(),
      srNo: issueForm.srNo || generateSrNo(),
      date: issueForm.date,
      origin: issueForm.origin || (selectedLot?.origin || 'Brazil'),
      consignment: issueForm.consignment,
      processType: issueForm.processType,
      department: issueForm.department,
      baleQty: baleQtyNum,
      weightKg: Number(issueForm.weightKg) || baleQtyNum * 226.8,
      remarks: issueForm.remarks,
    };

    setCottonIssues((prev) => [...prev, newIssue]);
    showToast('success', 'Cotton Issued', `Issued ${newIssue.baleQty} bales (${newIssue.weightKg} kg) to ${newIssue.department}`);

    setIssueForm({
      srNo: '',
      date: new Date().toISOString().split('T')[0],
      origin: '',
      consignment: '',
      processType: 'Ring',
      department: 'Blowroom Line 1',
      baleQty: '',
      weightKg: '',
      remarks: '',
    });
  };

  // Add Country
  const handleAddCountry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountryName.trim()) return;
    if (cottonCountries.includes(newCountryName.trim())) {
      showToast('info', 'Already Exists', 'Country is already in the list');
      return;
    }
    setCottonCountries((prev) => [...prev, newCountryName.trim()]);
    showToast('success', 'Country Added', `Added ${newCountryName} to cotton origin list`);
    setNewCountryName('');
    setShowAddCountryModal(false);
  };

  // EXPORTS FOR COTTON
  const exportStockExcel = () => {
    const exportData = lotStockList.map((l) => ({
      Consignment: l.consignment,
      Origin: l.origin,
      Supplier: l.supplierName || '—',
      'LC No': l.lcNo,
      'Received Bales': l.receivedBale,
      'Received Weight (Kg)': l.receivedKg,
      'Issued Bales': l.issuedBale,
      'Issued Weight (Kg)': l.issuedKg,
      'Balance Bales': l.balanceBale,
      'Balance Weight (Kg)': l.balanceKg,
      'Avg Weight/Bale (Kg)': Math.round(l.avgKgPerBale * 100) / 100,
      Status: l.balanceBale > 0 ? 'Active' : 'Exhausted',
    }));
    exportToExcel(exportData, 'Cotton_Stock_Report');
    showToast('success', 'Excel Exported', 'Downloaded Cotton Stock Report (.xlsx)');
  };

  const exportStockPDF = () => {
    const headers = ['Consignment', 'Origin', 'Supplier', 'Rec Bales', 'Rec Kg', 'Iss Bales', 'Iss Kg', 'Bal Bales', 'Bal Kg', 'Avg Kg/Bale'];
    const rows = lotStockList.map((l) => [
      l.consignment,
      l.origin,
      l.supplierName || '—',
      l.receivedBale,
      Math.round(l.receivedKg).toLocaleString(),
      l.issuedBale,
      Math.round(l.issuedKg).toLocaleString(),
      l.balanceBale,
      Math.round(l.balanceKg).toLocaleString(),
      (Math.round(l.avgKgPerBale * 10) / 10).toFixed(1),
    ]);
    exportToPDF('Cotton Lot-wise Stock Balance Report', headers, rows, 'Cotton_Stock_Report', 'landscape');
    showToast('success', 'PDF Exported', 'Downloaded Cotton Stock Report (.pdf)');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* ==================== SUB-TAB 1: COTTON RECEIVE ==================== */}
      {subTab === 'receive' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl flex items-center justify-center">
                <PackagePlus className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Cotton Receive Entry
                </h1>
                <p className="text-xs text-slate-500">
                  Stock automatically added on save · 26 origin countries supported
                </p>
              </div>
            </div>
          </div>

          {/* Receive Form */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <form onSubmit={handleSaveReceive} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Country / Origin *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={receiveForm.origin}
                      onChange={(e) => setReceiveForm({ ...receiveForm, origin: e.target.value })}
                      required
                      className="flex-1 px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">Select Origin...</option>
                      {cottonCountries.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowAddCountryModal(true)}
                      className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1 transition shadow-sm"
                      title="Add Custom Country"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Supplier / Trader Name
                  </label>
                  <input
                    type="text"
                    value={receiveForm.supplierName}
                    onChange={(e) => setReceiveForm({ ...receiveForm, supplierName: e.target.value })}
                    placeholder="e.g. ECOM Agroindustrial Corp"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Consignment No / Lot ID *
                  </label>
                  <input
                    type="text"
                    value={receiveForm.consignment}
                    onChange={(e) => setReceiveForm({ ...receiveForm, consignment: e.target.value })}
                    required
                    placeholder="e.g. BR-2026-005"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fiber Staple Length
                  </label>
                  <input
                    type="text"
                    value={receiveForm.fiberLength}
                    onChange={(e) => setReceiveForm({ ...receiveForm, fiberLength: e.target.value })}
                    placeholder="e.g. 1-3/32 inch"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    L/C Number
                  </label>
                  <input
                    type="text"
                    value={receiveForm.lcNo}
                    onChange={(e) => setReceiveForm({ ...receiveForm, lcNo: e.target.value })}
                    placeholder="e.g. LC-88492"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    I D Code
                  </label>
                  <input
                    type="text"
                    value={receiveForm.idCode}
                    onChange={(e) => setReceiveForm({ ...receiveForm, idCode: e.target.value })}
                    placeholder="e.g. BR-A1"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Received Date *
                  </label>
                  <input
                    type="date"
                    value={receiveForm.date}
                    onChange={(e) => setReceiveForm({ ...receiveForm, date: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Actual Receive (Bales) *
                  </label>
                  <input
                    type="number"
                    value={receiveForm.actualReceive}
                    onChange={(e) => {
                      const bales = e.target.value;
                      const kg = bales ? String(Math.round(Number(bales) * 226.8)) : '';
                      setReceiveForm({ ...receiveForm, actualReceive: bales, actualReceiveKg: kg });
                    }}
                    required
                    min="1"
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 font-bold text-amber-600 dark:text-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Actual Net Weight (Kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={receiveForm.actualReceiveKg}
                    onChange={(e) => setReceiveForm({ ...receiveForm, actualReceiveKg: e.target.value })}
                    required
                    placeholder="Auto-calculated (e.g. 113400)"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Notes
                </label>
                <input
                  type="text"
                  value={receiveForm.remarks}
                  onChange={(e) => setReceiveForm({ ...receiveForm, remarks: e.target.value })}
                  placeholder="e.g. Warehouse A, Bay 3 storage"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <PackagePlus className="w-4 h-4" /> Save Cotton Receive & Add to Live Stock
              </button>
            </form>
          </div>

          {/* Receive History Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Cotton Receive Log ({cottonReceives.length})
              </h3>
            </div>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Origin</th>
                    <th className="px-4 py-3">Supplier Name</th>
                    <th className="px-4 py-3">Consignment</th>
                    <th className="px-4 py-3">Staple</th>
                    <th className="px-4 py-3">L/C No</th>
                    <th className="px-4 py-3 text-right">Bales</th>
                    <th className="px-4 py-3 text-right">Weight (Kg)</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {cottonReceives.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                        No cotton receive entries recorded yet.
                      </td>
                    </tr>
                  ) : (
                    [...cottonReceives].reverse().map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                        <td className="px-4 py-3 font-mono">{r.date}</td>
                        <td className="px-4 py-3 font-semibold">{r.origin}</td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{r.supplierName || '—'}</td>
                        <td className="px-4 py-3 font-mono text-amber-600 dark:text-amber-400 font-bold">
                          {r.consignment}
                        </td>
                        <td className="px-4 py-3">{r.fiberLength}</td>
                        <td className="px-4 py-3 font-mono">{r.lcNo}</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                          {r.actualReceive}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                          {Math.round(r.actualReceiveKg).toLocaleString()} kg
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              requestAdminAction(`Delete Cotton Receive (${r.consignment})`, () => {
                                setCottonReceives((prev) => prev.filter((item) => item.id !== r.id));
                                showToast('info', 'Deleted', `Removed cotton receive ${r.consignment}`);
                              })
                            }
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                            title="Delete Record (Admin)"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* ==================== SUB-TAB 2: ISSUE COTTON ==================== */}
      {subTab === 'issue' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl flex items-center justify-center">
                <PackageMinus className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Issue Cotton (Mixing / Blowroom)
                </h1>
                <p className="text-xs text-slate-500">
                  Deducts stock directly from selected consignment lot average weight
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <form onSubmit={handleSaveIssue} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Store Requisition / Challan No *
                  </label>
                  <input
                    type="text"
                    value={issueForm.srNo}
                    onChange={(e) => setIssueForm({ ...issueForm, srNo: e.target.value })}
                    placeholder={generateSrNo()}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    value={issueForm.date}
                    onChange={(e) => setIssueForm({ ...issueForm, date: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Consignment Lot (In Stock) *
                  </label>
                  <select
                    value={issueForm.consignment}
                    onChange={(e) => handleConsignmentSelect(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  >
                    <option value="">Select Active Lot...</option>
                    {availableLots.map((lot) => (
                      <option key={lot.consignment} value={lot.consignment}>
                        {lot.consignment} ({lot.origin}) — Available: {lot.balanceBale} Bales ({Math.round(lot.balanceKg)} kg)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Process / Spinning Line *
                  </label>
                  <select
                    value={issueForm.processType}
                    onChange={(e) => setIssueForm({ ...issueForm, processType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Ring">Ring Spinning</option>
                    <option value="Rotor">Rotor OE Spinning</option>
                    <option value="Blend">Cotton Blend / Combed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Department / Line *
                  </label>
                  <input
                    type="text"
                    value={issueForm.department}
                    onChange={(e) => setIssueForm({ ...issueForm, department: e.target.value })}
                    required
                    placeholder="e.g. Blowroom Line 1"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bale Quantity to Issue *
                  </label>
                  <input
                    type="number"
                    value={issueForm.baleQty}
                    onChange={(e) => handleIssueBaleChange(e.target.value)}
                    required
                    min="1"
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 font-bold text-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Issued Weight (Kg) [Auto Calculated]
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={issueForm.weightKg}
                    onChange={(e) => setIssueForm({ ...issueForm, weightKg: e.target.value })}
                    placeholder="Auto Calculated from Lot Avg"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Purpose
                </label>
                <input
                  type="text"
                  value={issueForm.remarks}
                  onChange={(e) => setIssueForm({ ...issueForm, remarks: e.target.value })}
                  placeholder="e.g. Mixing for 30/1 Combed Hosiery Lot CH-3001"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <PackageMinus className="w-4 h-4" /> Save Cotton Issue & Deduct Stock
              </button>
            </form>
          </div>

          {/* Issue History Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Cotton Issue History ({cottonIssues.length})
              </h3>
            </div>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">S R / Challan No</th>
                    <th className="px-4 py-3">Consignment</th>
                    <th className="px-4 py-3">Process</th>
                    <th className="px-4 py-3">Department</th>
                    <th className="px-4 py-3 text-right">Bales</th>
                    <th className="px-4 py-3 text-right">Weight (Kg)</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {cottonIssues.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                        No cotton issues recorded yet.
                      </td>
                    </tr>
                  ) : (
                    [...cottonIssues].reverse().map((i) => (
                      <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                        <td className="px-4 py-3 font-mono">{i.date}</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                          {i.srNo}
                        </td>
                        <td className="px-4 py-3 font-mono text-amber-600 dark:text-amber-400 font-bold">
                          {i.consignment}
                        </td>
                        <td className="px-4 py-3">{i.processType}</td>
                        <td className="px-4 py-3">{i.department}</td>
                        <td className="px-4 py-3 text-right font-bold">{i.baleQty}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                          {Math.round(i.weightKg).toLocaleString()} kg
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              requestAdminAction(`Delete Cotton Issue (${i.srNo})`, () => {
                                setCottonIssues((prev) => prev.filter((item) => item.id !== i.id));
                                showToast('info', 'Deleted', `Removed cotton issue ${i.srNo}`);
                              })
                            }
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                            title="Delete Record (Admin)"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* ==================== SUB-TAB 3: COTTON STOCK ==================== */}
      {subTab === 'stock' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl flex items-center justify-center">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Cotton Live Stock Status
                </h1>
                <p className="text-xs text-slate-500">Lot-wise stock balance, average weights, and status</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={exportStockExcel}
                className="px-3 py-2 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" /> Excel Export
              </button>
              <button
                onClick={exportStockPDF}
                className="px-3 py-2 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" /> PDF Export
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Consignment Lot</th>
                    <th className="px-4 py-3">Country / Origin</th>
                    <th className="px-4 py-3">Supplier Name</th>
                    <th className="px-4 py-3">L/C No</th>
                    <th className="px-4 py-3 text-right">Rec Bales</th>
                    <th className="px-4 py-3 text-right">Rec Weight</th>
                    <th className="px-4 py-3 text-right">Iss Bales</th>
                    <th className="px-4 py-3 text-right">Iss Weight</th>
                    <th className="px-4 py-3 text-right">Bal Bales</th>
                    <th className="px-4 py-3 text-right">Bal Weight</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {lotStockList.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-slate-400">
                        No cotton lots registered in system.
                      </td>
                    </tr>
                  ) : (
                    lotStockList.map((lot) => (
                      <tr key={lot.consignment} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                        <td className="px-4 py-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                          {lot.consignment}
                        </td>
                        <td className="px-4 py-3 font-semibold">{lot.origin}</td>
                        <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{lot.supplierName || '—'}</td>
                        <td className="px-4 py-3 font-mono">{lot.lcNo}</td>
                        <td className="px-4 py-3 text-right font-medium">{lot.receivedBale}</td>
                        <td className="px-4 py-3 text-right font-mono">{Math.round(lot.receivedKg).toLocaleString()} kg</td>
                        <td className="px-4 py-3 text-right font-medium">{lot.issuedBale}</td>
                        <td className="px-4 py-3 text-right font-mono">{Math.round(lot.issuedKg).toLocaleString()} kg</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white text-sm">
                          {lot.balanceBale}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-extrabold text-amber-600 dark:text-amber-400">
                          {Math.round(lot.balanceKg).toLocaleString()} kg
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              lot.balanceBale > 0
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
                            }`}
                          >
                            {lot.balanceBale > 0 ? 'ACTIVE LOT' : 'EXHAUSTED'}
                          </span>
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

      {/* ==================== SUB-TAB 4: COTTON REPORTS ==================== */}
      {subTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl flex items-center justify-center">
                  <FileBarChart className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    Cotton Inventory Reports
                  </h1>
                  <p className="text-xs text-slate-500">Daily, Monthly, Ledger, and Lot Summaries</p>
                </div>
              </div>

              {/* Report Sub-selector */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl">
                {(['daily', 'monthly', 'receive', 'issue', 'ledger', 'stock'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setReportType(mode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                      reportType === mode
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Daily Report */}
          {reportType === 'daily' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Select Daily Report Date:
                  </label>
                  <input
                    type="date"
                    value={dailyDate}
                    onChange={(e) => setDailyDate(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 font-bold"
                  />
                </div>

                <button
                  onClick={() => {
                    const dailyRec = cottonReceives.filter((r) => r.date === dailyDate);
                    const dailyIss = cottonIssues.filter((i) => i.date === dailyDate);
                    exportToExcel(
                      [
                        ...dailyRec.map((r) => ({ Type: 'RECEIVE', ...r })),
                        ...dailyIss.map((i) => ({ Type: 'ISSUE', ...i })),
                      ],
                      `Cotton_Daily_${dailyDate}`
                    );
                    showToast('success', 'Excel Exported', `Downloaded Daily Report for ${dailyDate}`);
                  }}
                  className="px-3 py-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold rounded-xl text-xs flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Export Excel
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Total Received ({dailyDate})</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {cottonReceives.filter((r) => r.date === dailyDate).reduce((s, r) => s + r.actualReceive, 0)}{' '}
                    <span className="text-xs font-normal text-slate-500">Bales</span>
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-900/50">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Total Issued ({dailyDate})</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {cottonIssues.filter((i) => i.date === dailyDate).reduce((s, i) => s + i.baleQty, 0)}{' '}
                    <span className="text-xs font-normal text-slate-500">Bales</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Report */}
          {reportType === 'monthly' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Select Month:
                  </label>
                  <input
                    type="month"
                    value={monthlyPeriod}
                    onChange={(e) => setMonthlyPeriod(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                  <p className="text-xs font-bold text-slate-500">Monthly Received ({monthlyPeriod})</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {cottonReceives
                      .filter((r) => r.date.startsWith(monthlyPeriod))
                      .reduce((s, r) => s + r.actualReceive, 0)}{' '}
                    Bales
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-600">
                  <p className="text-xs font-bold text-slate-500">Monthly Issued ({monthlyPeriod})</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                    {cottonIssues
                      .filter((i) => i.date.startsWith(monthlyPeriod))
                      .reduce((s, i) => s + i.baleQty, 0)}{' '}
                    Bales
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Receive / Issue / Ledger / Stock Exports */}
          {(reportType === 'receive' || reportType === 'issue' || reportType === 'ledger' || reportType === 'stock') && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize">
                  Cotton {reportType} Export
                </h3>
                <p className="text-xs text-slate-500">
                  Export complete dataset for cotton {reportType} records
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (reportType === 'receive') exportToExcel(cottonReceives, 'Cotton_Receive_Full');
                    if (reportType === 'issue') exportToExcel(cottonIssues, 'Cotton_Issue_Full');
                    if (reportType === 'stock') exportStockExcel();
                    showToast('success', 'Exported', `Exported ${reportType} data`);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow transition"
                >
                  Download Excel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Country Modal */}
      {showAddCountryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Add New Cotton Country / Origin
            </h3>
            <form onSubmit={handleAddCountry} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Country Name *
                </label>
                <input
                  type="text"
                  value={newCountryName}
                  onChange={(e) => setNewCountryName(e.target.value)}
                  required
                  autoFocus
                  placeholder="e.g. Paraguay"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCountryModal(false)}
                  className="flex-1 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl shadow"
                >
                  Save Country
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
