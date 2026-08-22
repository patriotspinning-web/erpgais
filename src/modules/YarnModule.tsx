import React, { useState, useMemo } from 'react';
import {
  PackagePlus,
  PackageMinus,
  Archive,
  Trash2,
  Download,
  CheckCircle2,
  Printer,
  Search,
} from 'lucide-react';
import { YarnReceive, YarnIssue, YarnStock } from '../types';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { triggerAppPrint } from '../utils/printUtils';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { isDateInRange } from '../utils/dateUtils';

interface YarnModuleProps {
  subTab: 'receive' | 'issue' | 'stock';
  yarnReceives: YarnReceive[];
  setYarnReceives: React.Dispatch<React.SetStateAction<YarnReceive[]>>;
  yarnIssues: YarnIssue[];
  setYarnIssues: React.Dispatch<React.SetStateAction<YarnIssue[]>>;
  requestAdminAction: (title: string, action: () => void) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const YarnModule: React.FC<YarnModuleProps> = ({
  subTab,
  yarnReceives,
  setYarnReceives,
  yarnIssues,
  setYarnIssues,
  requestAdminAction,
  showToast,
}) => {
  // Receive Form
  const [receiveForm, setReceiveForm] = useState({
    count: '30/1 Combed Hosiery',
    lotNo: '',
    process: 'Ring' as 'Ring' | 'Rotor',
    mixingRatio: '100% Cotton (US-Pima)',
    quantity: '',
    bags: '',
    date: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  // Issue Form
  const [issueForm, setIssueForm] = useState({
    count: '30/1 Combed Hosiery',
    lotNo: '',
    process: 'Ring' as 'Ring' | 'Rotor',
    issueTo: '',
    quantity: '',
    bags: '',
    date: new Date().toISOString().split('T')[0],
    remarks: '',
  });

  // Filter States
  const [receiveStartDate, setReceiveStartDate] = useState('');
  const [receiveEndDate, setReceiveEndDate] = useState('');
  const [receiveSearch, setReceiveSearch] = useState('');

  const [issueStartDate, setIssueStartDate] = useState('');
  const [issueEndDate, setIssueEndDate] = useState('');
  const [issueSearch, setIssueSearch] = useState('');

  // Filtered Receives
  const filteredYarnReceives = useMemo(() => {
    return yarnReceives.filter((r) => {
      const matchesDate = isDateInRange(r.date, receiveStartDate, receiveEndDate);
      const matchesQuery =
        !receiveSearch ||
        r.count.toLowerCase().includes(receiveSearch.toLowerCase()) ||
        r.lotNo.toLowerCase().includes(receiveSearch.toLowerCase()) ||
        r.process.toLowerCase().includes(receiveSearch.toLowerCase()) ||
        (r.mixingRatio && r.mixingRatio.toLowerCase().includes(receiveSearch.toLowerCase()));
      return matchesDate && matchesQuery;
    });
  }, [yarnReceives, receiveStartDate, receiveEndDate, receiveSearch]);

  // Filtered Issues
  const filteredYarnIssues = useMemo(() => {
    return yarnIssues.filter((i) => {
      const matchesDate = isDateInRange(i.date, issueStartDate, issueEndDate);
      const matchesQuery =
        !issueSearch ||
        i.buyer.toLowerCase().includes(issueSearch.toLowerCase()) ||
        i.count.toLowerCase().includes(issueSearch.toLowerCase()) ||
        (i.remarks && i.remarks.toLowerCase().includes(issueSearch.toLowerCase()));
      return matchesDate && matchesQuery;
    });
  }, [yarnIssues, issueStartDate, issueEndDate, issueSearch]);

  // Calculate Yarn Stock
  const getYarnStockList = (): YarnStock[] => {
    const stockMap: Record<string, YarnStock> = {};

    yarnReceives.forEach((r) => {
      const key = `${r.count}___${r.process}`;
      if (!stockMap[key]) {
        stockMap[key] = {
          count: r.count,
          process: r.process,
          receivedKg: 0,
          issuedKg: 0,
          balanceKg: 0,
        };
      }
      stockMap[key].receivedKg += Number(r.quantity);
    });

    yarnIssues.forEach((i) => {
      const key = `${i.count}___${i.process}`;
      if (!stockMap[key]) {
        stockMap[key] = {
          count: i.count,
          process: i.process,
          receivedKg: 0,
          issuedKg: 0,
          balanceKg: 0,
        };
      }
      stockMap[key].issuedKg += Number(i.quantity);
    });

    Object.values(stockMap).forEach((s) => {
      s.balanceKg = s.receivedKg - s.issuedKg;
    });

    return Object.values(stockMap);
  };

  const yarnStockList = getYarnStockList();
  const availableYarn = yarnStockList.filter((s) => s.balanceKg > 0);

  // Submit Receive
  const handleSaveReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveForm.count || !receiveForm.quantity) {
      showToast('error', 'Missing Information', 'Yarn Count and Quantity are required');
      return;
    }

    const newRec: YarnReceive = {
      id: Date.now(),
      date: receiveForm.date,
      count: receiveForm.count,
      lotNo: receiveForm.lotNo || `LOT-${receiveForm.process[0]}-${Date.now().toString().slice(-4)}`,
      process: receiveForm.process,
      mixingRatio: receiveForm.mixingRatio || '100% Cotton',
      quantity: Number(receiveForm.quantity),
      bags: Number(receiveForm.bags) || Math.round(Number(receiveForm.quantity) / 45),
      remarks: receiveForm.remarks,
    };

    setYarnReceives((prev) => [...prev, newRec]);
    showToast('success', 'Yarn Received', `Received ${newRec.quantity} kg of ${newRec.count}`);

    setReceiveForm({
      count: '30/1 Combed Hosiery',
      lotNo: '',
      process: 'Ring',
      mixingRatio: '100% Cotton (US-Pima)',
      quantity: '',
      bags: '',
      date: new Date().toISOString().split('T')[0],
      remarks: '',
    });
  };

  // Submit Issue
  const handleSaveIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.count || !issueForm.quantity || !issueForm.issueTo) {
      showToast('error', 'Missing Information', 'Count, Customer name, and Quantity are required');
      return;
    }

    const key = `${issueForm.count}___${issueForm.process}`;
    const stock = yarnStockList.find((s) => `${s.count}___${s.process}` === key);
    const qtyNum = Number(issueForm.quantity);

    if (stock && qtyNum > stock.balanceKg) {
      showToast('error', 'Insufficient Stock', `Only ${Math.round(stock.balanceKg)} kg available for ${issueForm.count}`);
      return;
    }

    const newIssue: YarnIssue = {
      id: Date.now(),
      date: issueForm.date,
      count: issueForm.count,
      lotNo: issueForm.lotNo || 'LOT-DELIVERY',
      process: issueForm.process,
      issueTo: issueForm.issueTo,
      quantity: qtyNum,
      bags: Number(issueForm.bags) || Math.round(qtyNum / 45),
      remarks: issueForm.remarks,
    };

    setYarnIssues((prev) => [...prev, newIssue]);
    showToast('success', 'Yarn Delivered', `Delivered ${newIssue.quantity} kg to ${newIssue.issueTo}`);

    setIssueForm({
      count: '30/1 Combed Hosiery',
      lotNo: '',
      process: 'Ring',
      issueTo: '',
      quantity: '',
      bags: '',
      date: new Date().toISOString().split('T')[0],
      remarks: '',
    });
  };

  // EXPORTS
  const exportStockExcel = () => {
    const exportData = yarnStockList.map((s) => ({
      'Yarn Count': s.count,
      Process: s.process,
      'Received (Kg)': s.receivedKg,
      'Issued (Kg)': s.issuedKg,
      'Balance (Kg)': s.balanceKg,
      Status: s.balanceKg > 0 ? 'Active Stock' : 'Out of Stock',
    }));
    exportToExcel(exportData, 'Finished_Yarn_Stock_Report');
    showToast('success', 'Excel Exported', 'Downloaded Yarn Stock Report (.xlsx)');
  };

  const exportStockPDF = () => {
    const headers = ['Yarn Count', 'Process', 'Received (Kg)', 'Issued (Kg)', 'Balance (Kg)', 'Status'];
    const rows = yarnStockList.map((s) => [
      s.count,
      s.process,
      Math.round(s.receivedKg).toLocaleString(),
      Math.round(s.issuedKg).toLocaleString(),
      Math.round(s.balanceKg).toLocaleString(),
      s.balanceKg > 0 ? 'Active Stock' : 'Out of Stock',
    ]);
    exportToPDF('Finished Yarn Live Stock Report', headers, rows, 'Yarn_Stock_Report', 'portrait');
    showToast('success', 'PDF Exported', 'Downloaded Yarn Stock Report (.pdf)');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* ==================== SUB-TAB 1: YARN RECEIVE ==================== */}
      {subTab === 'receive' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 text-sky-600 rounded-xl flex items-center justify-center">
                <PackagePlus className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Yarn Production Receive Entry
                </h1>
                <p className="text-xs text-slate-500">
                  Receive Ring and Rotor finished yarn production into store
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <form onSubmit={handleSaveReceive} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Yarn Count & Specification *
                  </label>
                  <input
                    type="text"
                    value={receiveForm.count}
                    onChange={(e) => setReceiveForm({ ...receiveForm, count: e.target.value })}
                    required
                    placeholder="e.g. 30/1 Combed Hosiery"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lot Number
                  </label>
                  <input
                    type="text"
                    value={receiveForm.lotNo}
                    onChange={(e) => setReceiveForm({ ...receiveForm, lotNo: e.target.value })}
                    placeholder="e.g. LOT-CH-3001"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Spinning Process *
                  </label>
                  <select
                    value={receiveForm.process}
                    onChange={(e) => setReceiveForm({ ...receiveForm, process: e.target.value as 'Ring' | 'Rotor' })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                  >
                    <option value="Ring">Ring Spinning</option>
                    <option value="Rotor">Rotor OE Spinning</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mixing Ratio
                  </label>
                  <input
                    type="text"
                    value={receiveForm.mixingRatio}
                    onChange={(e) => setReceiveForm({ ...receiveForm, mixingRatio: e.target.value })}
                    placeholder="e.g. 100% Cotton / 65:35 PC"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 font-medium"
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity (Net Kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={receiveForm.quantity}
                    onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })}
                    required
                    min="1"
                    placeholder="e.g. 1000"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 font-bold text-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bag Count
                  </label>
                  <input
                    type="number"
                    value={receiveForm.bags}
                    onChange={(e) => setReceiveForm({ ...receiveForm, bags: e.target.value })}
                    placeholder="Auto or e.g. 22"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Quality Grade
                </label>
                <input
                  type="text"
                  value={receiveForm.remarks}
                  onChange={(e) => setReceiveForm({ ...receiveForm, remarks: e.target.value })}
                  placeholder="e.g. Combed Grade A, Autocone Spliced"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <PackagePlus className="w-4 h-4" /> Save Yarn Receive & Add to Store Stock
              </button>
            </form>
          </div>

          {/* Yarn Receive Log Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm space-y-4 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Yarn Receive Log ({yarnReceives.length})
                </h3>
                <p className="text-xs text-slate-500">Filter by timeframe or search by count/lot</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={receiveSearch}
                    onChange={(e) => setReceiveSearch(e.target.value)}
                    placeholder="Search Count / Lot..."
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 w-44 sm:w-56"
                  />
                </div>
                <button
                  onClick={() => triggerAppPrint()}
                  className="no-print px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                  title="Print Yarn Receive Log"
                >
                  <Printer className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Print Log
                </button>
              </div>
            </div>

            <DateRangeFilter
              startDate={receiveStartDate}
              endDate={receiveEndDate}
              onStartDateChange={setReceiveStartDate}
              onEndDateChange={setReceiveEndDate}
              totalCount={yarnReceives.length}
              filteredCount={filteredYarnReceives.length}
              label="Filter Yarn Receive by Date Range"
              accentColor="sky"
            />

            <div className="overflow-x-auto max-h-[400px] border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Yarn Count</th>
                    <th className="px-4 py-3">Lot No</th>
                    <th className="px-4 py-3">Process</th>
                    <th className="px-4 py-3">Mixing Ratio</th>
                    <th className="px-4 py-3 text-right">Bags</th>
                    <th className="px-4 py-3 text-right">Weight (Kg)</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {filteredYarnReceives.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                        No yarn receives match the selected date range / search query.
                      </td>
                    </tr>
                  ) : (
                    [...filteredYarnReceives].reverse().map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                        <td className="px-4 py-3 font-mono">{r.date}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {r.count}
                        </td>
                        <td className="px-4 py-3 font-mono text-sky-600">{r.lotNo}</td>
                        <td className="px-4 py-3">{r.process}</td>
                        <td className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-300">{r.mixingRatio || '100% Cotton'}</td>
                        <td className="px-4 py-3 text-right font-mono">{r.bags}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-sky-600 dark:text-sky-400">
                          {Math.round(r.quantity).toLocaleString()} kg
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              requestAdminAction(`Delete Yarn Receive (${r.count})`, () => {
                                setYarnReceives((prev) => prev.filter((item) => item.id !== r.id));
                                showToast('info', 'Deleted', `Removed yarn receive ${r.count}`);
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

      {/* ==================== SUB-TAB 2: YARN ISSUE ==================== */}
      {subTab === 'issue' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 text-sky-600 rounded-xl flex items-center justify-center">
                <PackageMinus className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Yarn Delivery & Issue to Buyers
                </h1>
                <p className="text-xs text-slate-500">
                  Deliver finished yarn to buyers with bag and weight verification
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <form onSubmit={handleSaveIssue} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Yarn Count (In Stock) *
                  </label>
                  <select
                    value={issueForm.count}
                    onChange={(e) => setIssueForm({ ...issueForm, count: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                  >
                    <option value="">Select Available Count...</option>
                    {availableYarn.map((y) => (
                      <option key={`${y.count}_${y.process}`} value={y.count}>
                        {y.count} ({y.process}) — Avail: {Math.round(y.balanceKg)} kg
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Customer / Buyer Name *
                  </label>
                  <input
                    type="text"
                    value={issueForm.issueTo}
                    onChange={(e) => setIssueForm({ ...issueForm, issueTo: e.target.value })}
                    required
                    placeholder="e.g. Apex Spinning Mills Ltd"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Process *
                  </label>
                  <select
                    value={issueForm.process}
                    onChange={(e) => setIssueForm({ ...issueForm, process: e.target.value as 'Ring' | 'Rotor' })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="Ring">Ring Spinning</option>
                    <option value="Rotor">Rotor OE Spinning</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Delivery Date *
                  </label>
                  <input
                    type="date"
                    value={issueForm.date}
                    onChange={(e) => setIssueForm({ ...issueForm, date: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity (Kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={issueForm.quantity}
                    onChange={(e) => setIssueForm({ ...issueForm, quantity: e.target.value })}
                    required
                    min="1"
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 font-bold text-sky-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Bag Count
                  </label>
                  <input
                    type="number"
                    value={issueForm.bags}
                    onChange={(e) => setIssueForm({ ...issueForm, bags: e.target.value })}
                    placeholder="e.g. 11"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Challan / Vehicle Details
                </label>
                <input
                  type="text"
                  value={issueForm.remarks}
                  onChange={(e) => setIssueForm({ ...issueForm, remarks: e.target.value })}
                  placeholder="e.g. Challan # 8820, Covered Van Metro-TA-12-88"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <PackageMinus className="w-4 h-4" /> Save Delivery & Deduct Yarn Stock
              </button>
            </form>
          </div>

          {/* Yarn Issue Log Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm space-y-4 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Yarn Issue & Delivery Log ({yarnIssues.length})
                </h3>
                <p className="text-xs text-slate-500">Filter deliveries by date timeframe or search by buyer/count</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={issueSearch}
                    onChange={(e) => setIssueSearch(e.target.value)}
                    placeholder="Search Buyer / Count / Vehicle..."
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500 w-44 sm:w-56"
                  />
                </div>
                <button
                  onClick={() => triggerAppPrint()}
                  className="no-print px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                  title="Print Yarn Issue Log"
                >
                  <Printer className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Print Log
                </button>
              </div>
            </div>

            <DateRangeFilter
              startDate={issueStartDate}
              endDate={issueEndDate}
              onStartDateChange={setIssueStartDate}
              onEndDateChange={setIssueEndDate}
              totalCount={yarnIssues.length}
              filteredCount={filteredYarnIssues.length}
              label="Filter Yarn Deliveries by Date Range"
              accentColor="sky"
            />

            <div className="overflow-x-auto max-h-[400px] border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Buyer / Party</th>
                    <th className="px-4 py-3">Count</th>
                    <th className="px-4 py-3">Process</th>
                    <th className="px-4 py-3 text-right">Bags</th>
                    <th className="px-4 py-3 text-right">Weight (Kg)</th>
                    <th className="px-4 py-3">Remarks / Vehicle</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {filteredYarnIssues.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                        No yarn issues match the selected date range / search query.
                      </td>
                    </tr>
                  ) : (
                    [...filteredYarnIssues].reverse().map((i) => (
                      <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                        <td className="px-4 py-3 font-mono">{i.date}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{i.buyer}</td>
                        <td className="px-4 py-3 font-bold text-sky-600 dark:text-sky-400">{i.count}</td>
                        <td className="px-4 py-3">{i.process}</td>
                        <td className="px-4 py-3 text-right font-mono">{i.bags || '—'}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          {Math.round(i.quantity).toLocaleString()} kg
                        </td>
                        <td className="px-4 py-3 text-slate-500 truncate max-w-[150px]">{i.remarks || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              requestAdminAction(`Delete Yarn Delivery (${i.buyer} - ${i.count})`, () => {
                                setYarnIssues((prev) => prev.filter((item) => item.id !== i.id));
                                showToast('info', 'Deleted', `Removed delivery to ${i.buyer}`);
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

      {/* ==================== SUB-TAB 3: YARN STOCK ==================== */}
      {subTab === 'stock' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-100 dark:bg-sky-900/30 text-sky-600 rounded-xl flex items-center justify-center">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Finished Yarn Live Stock Status
                </h1>
                <p className="text-xs text-slate-500">Count-wise finished yarn inventory balance</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerAppPrint()}
                className="no-print px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                title="Print Yarn Stock Report"
              >
                <Printer className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" /> Print Stock
              </button>
              <button
                onClick={exportStockExcel}
                className="px-3 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" /> Excel Export
              </button>
              <button
                onClick={exportStockPDF}
                className="px-3 py-2 bg-sky-100 text-sky-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
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
                    <th className="px-4 py-3">Yarn Count & Specification</th>
                    <th className="px-4 py-3">Process</th>
                    <th className="px-4 py-3 text-right">Received (Kg)</th>
                    <th className="px-4 py-3 text-right">Issued (Kg)</th>
                    <th className="px-4 py-3 text-right">Balance (Kg)</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {yarnStockList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        No yarn stock records available.
                      </td>
                    </tr>
                  ) : (
                    yarnStockList.map((s) => (
                      <tr
                        key={`${s.count}_${s.process}`}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition"
                      >
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {s.count}
                        </td>
                        <td className="px-4 py-3">{s.process}</td>
                        <td className="px-4 py-3 text-right font-mono">{Math.round(s.receivedKg).toLocaleString()} kg</td>
                        <td className="px-4 py-3 text-right font-mono">{Math.round(s.issuedKg).toLocaleString()} kg</td>
                        <td className="px-4 py-3 text-right font-mono font-extrabold text-sky-600 dark:text-sky-400 text-sm">
                          {Math.round(s.balanceKg).toLocaleString()} kg
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              s.balanceKg > 0
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
                            }`}
                          >
                            {s.balanceKg > 0 ? 'AVAILABLE' : 'OUT OF STOCK'}
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
    </div>
  );
};
