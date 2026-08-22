import React, { useState, useMemo } from 'react';
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
  Printer,
  Search,
} from 'lucide-react';
import { WasteReceive, WasteIssue, WasteCategoryStock } from '../types';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { triggerAppPrint } from '../utils/printUtils';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { isDateInRange } from '../utils/dateUtils';

interface WastageModuleProps {
  subTab: 'receive' | 'issue' | 'stock' | 'reports';
  wasteCategories: string[];
  setWasteCategories: React.Dispatch<React.SetStateAction<string[]>>;
  wasteReceives: WasteReceive[];
  setWasteReceives: React.Dispatch<React.SetStateAction<WasteReceive[]>>;
  wasteIssues: WasteIssue[];
  setWasteIssues: React.Dispatch<React.SetStateAction<WasteIssue[]>>;
  requestAdminAction: (title: string, action: () => void) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const WastageModule: React.FC<WastageModuleProps> = ({
  subTab,
  wasteCategories,
  setWasteCategories,
  wasteReceives,
  setWasteReceives,
  wasteIssues,
  setWasteIssues,
  requestAdminAction,
  showToast,
}) => {
  // Modal for new category
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Receive Form
  const [receiveForm, setReceiveForm] = useState({
    category: '',
    receiveFrom: 'Ring',
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    weightKg: '',
    bales: '',
    receivedBy: 'Store Officer',
    remarks: '',
  });

  // Issue Form
  const [issueForm, setIssueForm] = useState({
    srNo: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    issueTo: 'Sales',
    issueType: 'Sale',
    quantity: '',
    weightKg: '',
    bales: '',
    issuedBy: 'Store Officer',
    remarks: '',
  });

  // Filter States
  const [receiveStartDate, setReceiveStartDate] = useState('');
  const [receiveEndDate, setReceiveEndDate] = useState('');
  const [receiveSearch, setReceiveSearch] = useState('');

  const [issueStartDate, setIssueStartDate] = useState('');
  const [issueEndDate, setIssueEndDate] = useState('');
  const [issueSearch, setIssueSearch] = useState('');

  // Reports
  const [reportType, setReportType] = useState<'daily' | 'monthly' | 'range' | 'category' | 'ledger'>('daily');
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().split('T')[0]);
  const [monthlyPeriod, setMonthlyPeriod] = useState(new Date().toISOString().substring(0, 7));
  const [rangeStartDate, setRangeStartDate] = useState('');
  const [rangeEndDate, setRangeEndDate] = useState('');

  const generateSrNo = () => {
    return `SR-W-${new Date().getFullYear()}-${String(wasteIssues.length + 1).padStart(3, '0')}`;
  };

  // Filtered Waste Receives
  const filteredWasteReceives = useMemo(() => {
    return wasteReceives.filter((r) => {
      const matchesDate = isDateInRange(r.date, receiveStartDate, receiveEndDate);
      const matchesQuery =
        !receiveSearch ||
        r.category.toLowerCase().includes(receiveSearch.toLowerCase()) ||
        r.receiveFrom.toLowerCase().includes(receiveSearch.toLowerCase()) ||
        (r.remarks && r.remarks.toLowerCase().includes(receiveSearch.toLowerCase()));
      return matchesDate && matchesQuery;
    });
  }, [wasteReceives, receiveStartDate, receiveEndDate, receiveSearch]);

  // Filtered Waste Issues
  const filteredWasteIssues = useMemo(() => {
    return wasteIssues.filter((i) => {
      const matchesDate = isDateInRange(i.date, issueStartDate, issueEndDate);
      const matchesQuery =
        !issueSearch ||
        i.srNo.toLowerCase().includes(issueSearch.toLowerCase()) ||
        i.category.toLowerCase().includes(issueSearch.toLowerCase()) ||
        i.issueTo.toLowerCase().includes(issueSearch.toLowerCase()) ||
        (i.remarks && i.remarks.toLowerCase().includes(issueSearch.toLowerCase()));
      return matchesDate && matchesQuery;
    });
  }, [wasteIssues, issueStartDate, issueEndDate, issueSearch]);

  // Compute Category Stock Balance
  const getCategoryStock = (): WasteCategoryStock[] => {
    const catMap: Record<string, WasteCategoryStock> = {};

    wasteReceives.forEach((r) => {
      if (!catMap[r.category]) {
        catMap[r.category] = {
          category: r.category,
          receiveFrom: r.receiveFrom,
          receivedQty: 0,
          receivedKg: 0,
          receivedBales: 0,
          issuedQty: 0,
          issuedKg: 0,
          issuedBales: 0,
          balanceQty: 0,
          balanceKg: 0,
          balanceBales: 0,
        };
      }
      catMap[r.category].receivedQty += Number(r.quantity || 0);
      catMap[r.category].receivedKg += Number(r.weightKg || r.quantity || 0);
      catMap[r.category].receivedBales += Number(r.bales || 0);
    });

    wasteIssues.forEach((i) => {
      if (!catMap[i.category]) {
        catMap[i.category] = {
          category: i.category,
          receiveFrom: '—',
          receivedQty: 0,
          receivedKg: 0,
          receivedBales: 0,
          issuedQty: 0,
          issuedKg: 0,
          issuedBales: 0,
          balanceQty: 0,
          balanceKg: 0,
          balanceBales: 0,
        };
      }
      catMap[i.category].issuedQty += Number(i.quantity || 0);
      catMap[i.category].issuedKg += Number(i.weightKg || i.quantity || 0);
      catMap[i.category].issuedBales += Number(i.bales || 0);
    });

    Object.values(catMap).forEach((c) => {
      c.balanceQty = c.receivedQty - c.issuedQty;
      c.balanceKg = c.receivedKg - c.issuedKg;
      c.balanceBales = c.receivedBales - c.issuedBales;
    });

    return Object.values(catMap);
  };

  const categoryStockList = getCategoryStock();
  const availableCategories = categoryStockList.filter((c) => c.balanceKg > 0 || c.balanceQty > 0);

  // Submit Receive
  const handleSaveReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveForm.category || !receiveForm.quantity) {
      showToast('error', 'Missing Information', 'Please select Category and enter Quantity');
      return;
    }

    const qty = Number(receiveForm.quantity || 0);
    const weight = receiveForm.weightKg ? Number(receiveForm.weightKg) : qty;
    const bales = Number(receiveForm.bales || 0);

    const newRec: WasteReceive = {
      id: Date.now(),
      date: receiveForm.date,
      category: receiveForm.category,
      receiveFrom: receiveForm.receiveFrom,
      quantity: qty,
      weightKg: weight,
      bales: bales,
      receivedBy: receiveForm.receivedBy,
      remarks: receiveForm.remarks,
    };

    setWasteReceives((prev) => [...prev, newRec]);
    showToast('success', 'Wastage Received', `Received ${qty} Qty (${weight} kg, ${bales} Bales) of ${newRec.category}`);

    setReceiveForm({
      category: '',
      receiveFrom: 'Ring',
      date: new Date().toISOString().split('T')[0],
      quantity: '',
      weightKg: '',
      bales: '',
      receivedBy: 'Store Officer',
      remarks: '',
    });
  };

  // Submit Issue
  const handleSaveIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.category || !issueForm.quantity) {
      showToast('error', 'Missing Information', 'Please select Category and enter Quantity');
      return;
    }

    const catStock = categoryStockList.find((c) => c.category === issueForm.category);
    const issueQty = Number(issueForm.quantity || 0);
    const issueWeight = issueForm.weightKg ? Number(issueForm.weightKg) : issueQty;
    const issueBales = Number(issueForm.bales || 0);

    if (catStock && issueWeight > catStock.balanceKg && issueQty > catStock.balanceQty) {
      showToast('error', 'Insufficient Stock', `Category ${catStock.category} has only ${Math.round(catStock.balanceKg)} kg in stock`);
      return;
    }

    const newIssue: WasteIssue = {
      id: Date.now(),
      srNo: issueForm.srNo || generateSrNo(),
      date: issueForm.date,
      category: issueForm.category,
      issueTo: issueForm.issueTo,
      issueType: issueForm.issueType,
      quantity: issueQty,
      weightKg: issueWeight,
      bales: issueBales,
      issuedBy: issueForm.issuedBy,
      remarks: issueForm.remarks,
    };

    setWasteIssues((prev) => [...prev, newIssue]);
    showToast('success', 'Wastage Issued', `Issued ${newIssue.quantity} Qty (${issueWeight} kg, ${issueBales} Bales) of ${newIssue.category}`);

    setIssueForm({
      srNo: '',
      date: new Date().toISOString().split('T')[0],
      category: '',
      issueTo: 'Sales',
      issueType: 'Sale',
      quantity: '',
      weightKg: '',
      bales: '',
      issuedBy: 'Store Officer',
      remarks: '',
    });
  };

  // Add Custom Category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    if (wasteCategories.includes(newCatName.trim())) {
      showToast('info', 'Already Exists', 'Category already in list');
      return;
    }

    setWasteCategories((prev) => [...prev, newCatName.trim()]);
    showToast('success', 'Category Added', `Added ${newCatName} to wastage list`);
    setNewCatName('');
    setShowAddCatModal(false);
  };

  // EXPORTS
  const exportStockExcel = () => {
    const exportData = categoryStockList.map((c) => ({
      Category: c.category,
      Source: c.receiveFrom,
      'Received Qty': c.receivedQty,
      'Received (Kg)': c.receivedKg,
      'Received Bales': c.receivedBales,
      'Issued Qty': c.issuedQty,
      'Issued (Kg)': c.issuedKg,
      'Issued Bales': c.issuedBales,
      'Balance Qty': c.balanceQty,
      'Balance (Kg)': c.balanceKg,
      'Balance Bales': c.balanceBales,
      Status: c.balanceKg > 0 || c.balanceQty > 0 ? 'Active' : 'Exhausted',
    }));
    exportToExcel(exportData, 'Wastage_Stock_Report');
    showToast('success', 'Excel Exported', 'Downloaded Wastage Stock Report (.xlsx)');
  };

  const exportStockPDF = () => {
    const headers = ['Category', 'Source', 'Rec Qty', 'Rec Kg', 'Rec Bales', 'Iss Qty', 'Iss Kg', 'Iss Bales', 'Bal Kg', 'Bal Bales', 'Status'];
    const rows = categoryStockList.map((c) => [
      c.category,
      c.receiveFrom,
      Math.round(c.receivedQty).toLocaleString(),
      Math.round(c.receivedKg).toLocaleString(),
      c.receivedBales,
      Math.round(c.issuedQty).toLocaleString(),
      Math.round(c.issuedKg).toLocaleString(),
      c.issuedBales,
      Math.round(c.balanceKg).toLocaleString(),
      c.balanceBales,
      c.balanceKg > 0 || c.balanceQty > 0 ? 'Active' : 'Exhausted',
    ]);
    exportToPDF('Wastage Live Stock Report', headers, rows, 'Wastage_Stock_Report', 'landscape');
    showToast('success', 'PDF Exported', 'Downloaded Wastage Stock Report (.pdf)');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* ==================== SUB-TAB 1: WASTAGE RECEIVE ==================== */}
      {subTab === 'receive' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl flex items-center justify-center">
                <PackagePlus className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Wastage Receive Entry
                </h1>
                <p className="text-xs text-slate-500">
                  Receive mill waste from Ring, Rotor, Willow, or Party (20 default categories)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <form onSubmit={handleSaveReceive} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Wastage Category *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={receiveForm.category}
                      onChange={(e) => setReceiveForm({ ...receiveForm, category: e.target.value })}
                      required
                      className="flex-1 px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                    >
                      <option value="">Select Category...</option>
                      {wasteCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowAddCatModal(true)}
                      className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-sm"
                      title="Add Custom Category"
                    >
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Receive From (Source) *
                  </label>
                  <select
                    value={receiveForm.receiveFrom}
                    onChange={(e) => setReceiveForm({ ...receiveForm, receiveFrom: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Ring">Ring Section</option>
                    <option value="Rotor">Rotor Section</option>
                    <option value="Willow M/C">Willow M/C</option>
                    <option value="Party">Party / Vendor</option>
                  </select>
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity (Total Qty) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={receiveForm.quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setReceiveForm((prev) => ({
                        ...prev,
                        quantity: val,
                        weightKg: prev.weightKg ? prev.weightKg : val,
                      }));
                    }}
                    required
                    min="0.1"
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 font-bold text-rose-600 dark:text-rose-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={receiveForm.weightKg}
                    onChange={(e) => setReceiveForm({ ...receiveForm, weightKg: e.target.value })}
                    required
                    min="0.1"
                    placeholder="e.g. 500"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Number of Bales (No. of Bales)
                  </label>
                  <input
                    type="number"
                    value={receiveForm.bales}
                    onChange={(e) => setReceiveForm({ ...receiveForm, bales: e.target.value })}
                    placeholder="e.g. 5"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Received By *
                  </label>
                  <input
                    type="text"
                    value={receiveForm.receivedBy}
                    onChange={(e) => setReceiveForm({ ...receiveForm, receivedBy: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks
                </label>
                <input
                  type="text"
                  value={receiveForm.remarks}
                  onChange={(e) => setReceiveForm({ ...receiveForm, remarks: e.target.value })}
                  placeholder="e.g. Shift A collection"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <PackagePlus className="w-4 h-4" /> Save Wastage Receive & Add to Stock
              </button>
            </form>
          </div>

          {/* Wastage Receive Log Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm space-y-4 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Wastage Receive Log ({wasteReceives.length})
                </h3>
                <p className="text-xs text-slate-500">Filter by timeframe or search by category / source</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={receiveSearch}
                    onChange={(e) => setReceiveSearch(e.target.value)}
                    placeholder="Search Category / Source..."
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 w-44 sm:w-56"
                  />
                </div>
                <button
                  onClick={() => triggerAppPrint()}
                  className="no-print px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                  title="Print Wastage Receive Log"
                >
                  <Printer className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Print Log
                </button>
              </div>
            </div>

            <DateRangeFilter
              startDate={receiveStartDate}
              endDate={receiveEndDate}
              onStartDateChange={setReceiveStartDate}
              onEndDateChange={setReceiveEndDate}
              totalCount={wasteReceives.length}
              filteredCount={filteredWasteReceives.length}
              label="Filter Wastage Receive by Date Range"
              accentColor="rose"
            />

            <div className="overflow-x-auto max-h-[400px] border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3 text-right">Weight (kg)</th>
                    <th className="px-4 py-3 text-right">No. of Bales</th>
                    <th className="px-4 py-3">Received By</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {filteredWasteReceives.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                        No wastage receive entries match the selected date range / query.
                      </td>
                    </tr>
                  ) : (
                    [...filteredWasteReceives].reverse().map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                        <td className="px-4 py-3 font-mono">{r.date}</td>
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {r.category}
                        </td>
                        <td className="px-4 py-3">{r.receiveFrom}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          {Math.round(r.quantity).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {Math.round(r.weightKg || r.quantity).toLocaleString()} kg
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                          {r.bales || '—'}
                        </td>
                        <td className="px-4 py-3">{r.receivedBy}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              requestAdminAction(`Delete Wastage Receive (${r.category})`, () => {
                                setWasteReceives((prev) => prev.filter((item) => item.id !== r.id));
                                showToast('info', 'Deleted', `Removed wastage receive for ${r.category}`);
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

      {/* ==================== SUB-TAB 2: WASTAGE ISSUE ==================== */}
      {subTab === 'issue' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl flex items-center justify-center">
                <PackageMinus className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Wastage Issue (Challan / Re-use)
                </h1>
                <p className="text-xs text-slate-500">
                  Issue wastage for sale, reprocessing, or disposal with auto S R / Challan No
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <form onSubmit={handleSaveIssue} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    S R / Challan No *
                  </label>
                  <input
                    type="text"
                    value={issueForm.srNo}
                    onChange={(e) => setIssueForm({ ...issueForm, srNo: e.target.value })}
                    placeholder={generateSrNo()}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 font-mono"
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Wastage Category (In Stock) *
                  </label>
                  <select
                    value={issueForm.category}
                    onChange={(e) => setIssueForm({ ...issueForm, category: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                  >
                    <option value="">Select Category...</option>
                    {availableCategories.map((cat) => (
                      <option key={cat.category} value={cat.category}>
                        {cat.category} — Avail: {Math.round(cat.balanceKg)} kg ({cat.balanceBales} Bales)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Issue Purpose / Type *
                  </label>
                  <select
                    value={issueForm.issueType}
                    onChange={(e) => setIssueForm({ ...issueForm, issueType: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Sale">External Sale</option>
                    <option value="Reprocess">Reprocess in Mill</option>
                    <option value="Disposal">Disposal</option>
                    <option value="Transfer">Inter-department Transfer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Issue Destination / Party *
                  </label>
                  <input
                    type="text"
                    value={issueForm.issueTo}
                    onChange={(e) => setIssueForm({ ...issueForm, issueTo: e.target.value })}
                    required
                    placeholder="e.g. M/S Rahman Traders"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Issue Quantity (Total Qty) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={issueForm.quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setIssueForm((prev) => ({
                        ...prev,
                        quantity: val,
                        weightKg: prev.weightKg ? prev.weightKg : val,
                      }));
                    }}
                    required
                    min="0.1"
                    placeholder="e.g. 200"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 font-bold text-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={issueForm.weightKg}
                    onChange={(e) => setIssueForm({ ...issueForm, weightKg: e.target.value })}
                    required
                    min="0.1"
                    placeholder="e.g. 200"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Number of Bales (No. of Bales)
                  </label>
                  <input
                    type="number"
                    value={issueForm.bales}
                    onChange={(e) => setIssueForm({ ...issueForm, bales: e.target.value })}
                    placeholder="e.g. 3"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 font-bold text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Issued By *
                  </label>
                  <input
                    type="text"
                    value={issueForm.issuedBy}
                    onChange={(e) => setIssueForm({ ...issueForm, issuedBy: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Gate Pass Details
                </label>
                <input
                  type="text"
                  value={issueForm.remarks}
                  onChange={(e) => setIssueForm({ ...issueForm, remarks: e.target.value })}
                  placeholder="e.g. Truck No Dhaka Metro TA-14-102"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <PackageMinus className="w-4 h-4" /> Save Wastage Issue & Deduct Stock
              </button>
            </form>
          </div>

          {/* Wastage Issue Log Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm space-y-4 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Wastage Issue History ({wasteIssues.length})
                </h3>
                <p className="text-xs text-slate-500">Filter issues by date range or search by SR / category / destination</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={issueSearch}
                    onChange={(e) => setIssueSearch(e.target.value)}
                    placeholder="Search SR / Category / Buyer..."
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 w-44 sm:w-56"
                  />
                </div>
                <button
                  onClick={() => triggerAppPrint()}
                  className="no-print px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                  title="Print Wastage Issue History"
                >
                  <Printer className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Print Log
                </button>
              </div>
            </div>

            <DateRangeFilter
              startDate={issueStartDate}
              endDate={issueEndDate}
              onStartDateChange={setIssueStartDate}
              onEndDateChange={setIssueEndDate}
              totalCount={wasteIssues.length}
              filteredCount={filteredWasteIssues.length}
              label="Filter Wastage Issues by Date Range"
              accentColor="rose"
            />

            <div className="overflow-x-auto max-h-[400px] border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">S R / Challan</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Destination</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3 text-right">Weight (kg)</th>
                    <th className="px-4 py-3 text-right">No. of Bales</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {filteredWasteIssues.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                        No wastage issue entries match the selected date range / query.
                      </td>
                    </tr>
                  ) : (
                    [...filteredWasteIssues].reverse().map((i) => (
                      <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                        <td className="px-4 py-3 font-mono">{i.date}</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">
                          {i.srNo}
                        </td>
                        <td className="px-4 py-3 font-bold">{i.category}</td>
                        <td className="px-4 py-3">{i.issueType}</td>
                        <td className="px-4 py-3">{i.issueTo}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          {Math.round(i.quantity).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {Math.round(i.weightKg || i.quantity).toLocaleString()} kg
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                          {i.bales || '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              requestAdminAction(`Delete Wastage Issue (${i.srNo})`, () => {
                                setWasteIssues((prev) => prev.filter((item) => item.id !== i.id));
                                showToast('info', 'Deleted', `Removed wastage issue ${i.srNo}`);
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

      {/* ==================== SUB-TAB 3: WASTAGE STOCK ==================== */}
      {subTab === 'stock' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl flex items-center justify-center">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Wastage Live Stock Balance
                </h1>
                <p className="text-xs text-slate-500">Category-wise mill waste on hand</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerAppPrint()}
                className="no-print px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                title="Print Wastage Live Stock Balance"
              >
                <Printer className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Print Stock
              </button>
              <button
                onClick={exportStockExcel}
                className="px-3 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" /> Excel Export
              </button>
              <button
                onClick={exportStockPDF}
                className="px-3 py-2 bg-rose-100 text-rose-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
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
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3 text-right">Rec Qty</th>
                    <th className="px-4 py-3 text-right">Rec Weight</th>
                    <th className="px-4 py-3 text-right">Rec Bales</th>
                    <th className="px-4 py-3 text-right">Iss Weight</th>
                    <th className="px-4 py-3 text-right">Iss Bales</th>
                    <th className="px-4 py-3 text-right">Bal Weight</th>
                    <th className="px-4 py-3 text-right">Bal Bales</th>
                    <th className="px-4 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {categoryStockList.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                        No wastage records available.
                      </td>
                    </tr>
                  ) : (
                    categoryStockList.map((c) => (
                      <tr key={c.category} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {c.category}
                        </td>
                        <td className="px-4 py-3">{c.receiveFrom}</td>
                        <td className="px-4 py-3 text-right font-mono">{Math.round(c.receivedQty).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right font-mono font-medium">{Math.round(c.receivedKg).toLocaleString()} kg</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-500">{c.receivedBales}</td>
                        <td className="px-4 py-3 text-right font-mono font-medium">{Math.round(c.issuedKg).toLocaleString()} kg</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-500">{c.issuedBales}</td>
                        <td className="px-4 py-3 text-right font-mono font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                          {Math.round(c.balanceKg).toLocaleString()} kg
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                          {c.balanceBales}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              c.balanceKg > 0 || c.balanceQty > 0
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-700'
                            }`}
                          >
                            {c.balanceKg > 0 || c.balanceQty > 0 ? 'AVAILABLE' : 'EMPTY'}
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

      {/* ==================== SUB-TAB 4: WASTAGE REPORTS ==================== */}
      {subTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-xl flex items-center justify-center">
                  <FileBarChart className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    Wastage Inventory Reports
                  </h1>
                  <p className="text-xs text-slate-500">Daily, Monthly, and Category-wise exports</p>
                </div>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl">
                {(['daily', 'monthly', 'range', 'category', 'ledger'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setReportType(mode)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                      reportType === mode
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                    }`}
                  >
                    {mode === 'range' ? 'Date Range' : mode}
                  </button>
                ))}
              </div>
            </div>

            {reportType === 'daily' && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center gap-4">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Date:</label>
                <input
                  type="date"
                  value={dailyDate}
                  onChange={(e) => setDailyDate(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            )}

            {reportType === 'monthly' && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center gap-4">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Month:</label>
                <input
                  type="month"
                  value={monthlyPeriod}
                  onChange={(e) => setMonthlyPeriod(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            )}

            {reportType === 'range' && (
              <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <DateRangeFilter
                  startDate={rangeStartDate}
                  endDate={rangeEndDate}
                  onStartDateChange={setRangeStartDate}
                  onEndDateChange={setRangeEndDate}
                  totalCount={wasteReceives.length + wasteIssues.length}
                  filteredCount={
                    wasteReceives.filter((r) => isDateInRange(r.date, rangeStartDate, rangeEndDate)).length +
                    wasteIssues.filter((i) => isDateInRange(i.date, rangeStartDate, rangeEndDate)).length
                  }
                  label="Filter Report Records by Custom Date Range"
                  accentColor="rose"
                />
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize">
                Wastage {reportType === 'range' ? 'Date Range' : reportType} Report Export
              </h3>
              <p className="text-xs text-slate-500">
                Download formatted Excel report for wastage {reportType === 'range' ? 'date range' : reportType} data
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => triggerAppPrint()}
                className="no-print px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs shadow transition flex items-center gap-1.5"
                title="Print Wastage Report"
              >
                <Printer className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> Print
              </button>
              <button
                onClick={() => {
                  if (reportType === 'daily') exportToExcel(wasteReceives.filter((r) => r.date === dailyDate), `Waste_Daily_${dailyDate}`);
                  if (reportType === 'monthly') exportToExcel(wasteReceives.filter((r) => r.date.startsWith(monthlyPeriod)), `Waste_Monthly_${monthlyPeriod}`);
                  if (reportType === 'range') {
                    const rangeRec = wasteReceives.filter((r) => isDateInRange(r.date, rangeStartDate, rangeEndDate));
                    const rangeIss = wasteIssues.filter((i) => isDateInRange(i.date, rangeStartDate, rangeEndDate));
                    exportToExcel([...rangeRec, ...rangeIss], `Waste_Range_${rangeStartDate || 'all'}_to_${rangeEndDate || 'all'}`);
                  }
                  if (reportType === 'category') exportStockExcel();
                  if (reportType === 'ledger') exportToExcel([...wasteReceives, ...wasteIssues], 'Waste_Ledger_Full');
                  showToast('success', 'Exported', `Exported wastage ${reportType} report`);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow transition"
              >
                Export Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for adding custom category */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Add Custom Wastage Category
            </h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  autoFocus
                  placeholder="e.g. Comber Noil Grade B"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCatModal(false)}
                  className="flex-1 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
