import React, { useState, useMemo } from 'react';
import {
  Layers,
  Search,
  Plus,
  Filter,
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  Tag,
  TrendingUp,
  Percent,
  Edit3,
  Trash2,
  FileText,
  X,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  CertifiedCottonReceive,
  CertifiedCottonUsage,
  AuditStandard,
} from '../../types';
import { AUDIT_STANDARDS_LIST, STANDARD_COLORS } from '../../data/auditSeedData';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

interface CertifiedUsageListProps {
  usages: CertifiedCottonUsage[];
  setUsages: React.Dispatch<React.SetStateAction<CertifiedCottonUsage[]>>;
  receives: CertifiedCottonReceive[];
  onViewTcTraceability: (tcNumber: string) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  requestAdminAction?: (title: string, action: () => void) => void;
  isModalOpenExternal?: boolean;
  setIsModalOpenExternal?: (open: boolean) => void;
  selectedStandardFilter?: string;
  initialTcForNewUsage?: string;
}

export const CertifiedUsageList: React.FC<CertifiedUsageListProps> = ({
  usages,
  setUsages,
  receives,
  onViewTcTraceability,
  showToast,
  requestAdminAction,
  isModalOpenExternal = false,
  setIsModalOpenExternal,
  selectedStandardFilter = 'All',
  initialTcForNewUsage = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [standardFilter, setStandardFilter] = useState<string>(selectedStandardFilter);
  const [buyerFilter, setBuyerFilter] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isModalOpenInternal, setIsModalOpenInternal] = useState(false);
  const isModalOpen = isModalOpenExternal || isModalOpenInternal;

  const setIsModalOpen = (val: boolean) => {
    setIsModalOpenInternal(val);
    if (setIsModalOpenExternal) setIsModalOpenExternal(val);
  };

  const [editingItem, setEditingItem] = useState<CertifiedCottonUsage | null>(null);

  // Form state
  const [formData, setFormData] = useState<Omit<CertifiedCottonUsage, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    standard: 'GRS',
    tcNumber: '',
    lotNo: '',
    buyerName: '',
    orderRef: '',
    yarnCount: '30/1 Ne Combed',
    yarnType: '100% Certified Ring Spun',
    cottonUsedKg: 10000,
    yarnProducedKg: 9100,
    wastageKg: 900,
    wastagePct: 9.0,
    remarks: '',
  });

  // Calculate live available balance for selected TC
  const availableTcBalance = useMemo(() => {
    if (!formData.tcNumber) return 0;
    const totalRec = receives
      .filter((r) => r.tcNumber === formData.tcNumber)
      .reduce((sum, r) => sum + r.quantityKg, 0);

    const totalUsed = usages
      .filter((u) => u.tcNumber === formData.tcNumber && (!editingItem || u.id !== editingItem.id))
      .reduce((sum, u) => sum + u.cottonUsedKg, 0);

    return Math.max(0, totalRec - totalUsed);
  }, [formData.tcNumber, receives, usages, editingItem]);

  const handleOpenModal = (item?: CertifiedCottonUsage, preselectedTc?: string) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        date: item.date,
        standard: item.standard,
        tcNumber: item.tcNumber,
        lotNo: item.lotNo,
        buyerName: item.buyerName,
        orderRef: item.orderRef,
        yarnCount: item.yarnCount,
        yarnType: item.yarnType,
        cottonUsedKg: item.cottonUsedKg,
        yarnProducedKg: item.yarnProducedKg,
        wastageKg: item.wastageKg,
        wastagePct: item.wastagePct,
        remarks: item.remarks || '',
      });
    } else {
      setEditingItem(null);
      const chosenTc = preselectedTc || initialTcForNewUsage || receives[0]?.tcNumber || '';
      const matchedRec = receives.find((r) => r.tcNumber === chosenTc);

      const cottonUsed = 10000;
      const yarnProduced = 9100;
      const wastage = cottonUsed - yarnProduced;
      const wastagePct = Number(((wastage / cottonUsed) * 100).toFixed(2));

      setFormData({
        date: new Date().toISOString().split('T')[0],
        standard: matchedRec ? matchedRec.standard : 'GRS',
        tcNumber: chosenTc,
        lotNo: matchedRec ? matchedRec.lotNo : 'LOT-01',
        buyerName: '',
        orderRef: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        yarnCount: '30/1 Ne Combed Ring Spun',
        yarnType: `${matchedRec ? matchedRec.standard : 'Certified'} Cotton Yarn`,
        cottonUsedKg: cottonUsed,
        yarnProducedKg: yarnProduced,
        wastageKg: wastage,
        wastagePct: wastagePct,
        remarks: 'Production completed as per standard spinning protocol.',
      });
    }
    setIsModalOpen(true);
  };

  const handleTcChange = (selectedTc: string) => {
    const matchedRec = receives.find((r) => r.tcNumber === selectedTc);
    setFormData((prev) => ({
      ...prev,
      tcNumber: selectedTc,
      standard: matchedRec ? matchedRec.standard : prev.standard,
      lotNo: matchedRec ? matchedRec.lotNo : prev.lotNo,
      yarnType: `${matchedRec ? matchedRec.standard : 'Certified'} Cotton Yarn`,
    }));
  };

  const handleCottonOrYarnChange = (cottonKg: number, yarnKg: number) => {
    const wastage = Math.max(0, cottonKg - yarnKg);
    const wastagePct = cottonKg > 0 ? Number(((wastage / cottonKg) * 100).toFixed(2)) : 0;
    setFormData((prev) => ({
      ...prev,
      cottonUsedKg: cottonKg,
      yarnProducedKg: yarnKg,
      wastageKg: wastage,
      wastagePct: wastagePct,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tcNumber || !formData.buyerName || !formData.cottonUsedKg || !formData.yarnProducedKg) {
      showToast('error', 'Required Fields Missing', 'Please fill in TC Number, Buyer, Cotton Used, and Yarn Output.');
      return;
    }

    if (formData.cottonUsedKg > availableTcBalance) {
      if (
        !window.confirm(
          `Warning: Cotton Used (${formData.cottonUsedKg.toLocaleString()} KG) exceeds available TC balance (${availableTcBalance.toLocaleString()} KG). Do you still want to proceed?`
        )
      ) {
        return;
      }
    }

    if (editingItem) {
      setUsages((prev) =>
        prev.map((item) => (item.id === editingItem.id ? { ...formData, id: item.id } : item))
      );
      showToast('success', 'Usage Entry Updated', `Consumption for ${formData.buyerName} updated.`);
    } else {
      const newItem: CertifiedCottonUsage = {
        ...formData,
        id: Date.now(),
      };
      setUsages((prev) => [newItem, ...prev]);
      showToast(
        'success',
        'Cotton Usage Recorded',
        `${formData.cottonUsedKg.toLocaleString()} KG from TC ${formData.tcNumber} allocated to ${formData.buyerName}.`
      );
    }
    setIsModalOpen(false);
  };

  const handleDelete = (item: CertifiedCottonUsage) => {
    const doDelete = () => {
      setUsages((prev) => prev.filter((u) => u.id !== item.id));
      showToast('info', 'Usage Deleted', `Production record for ${item.buyerName} deleted.`);
    };

    if (requestAdminAction) {
      requestAdminAction(`Delete Usage Record (${item.buyerName} - ${item.cottonUsedKg} KG)`, doDelete);
    } else if (window.confirm(`Delete usage record of ${item.cottonUsedKg} KG for ${item.buyerName}?`)) {
      doDelete();
    }
  };

  // Distinct buyers for filter
  const distinctBuyers = useMemo(() => {
    return Array.from(new Set(usages.map((u) => u.buyerName))).filter(Boolean);
  }, [usages]);

  // Filtered usages
  const filtered = useMemo(() => {
    return usages.filter((u) => {
      const matchStd = standardFilter === 'All' || u.standard === standardFilter;
      const matchBuyer = buyerFilter === 'All' || u.buyerName === buyerFilter;
      const matchSearch =
        searchTerm === '' ||
        u.buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.tcNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.orderRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.yarnCount.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.lotNo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDate =
        (!startDate || u.date >= startDate) &&
        (!endDate || u.date <= endDate);

      return matchStd && matchBuyer && matchSearch && matchDate;
    });
  }, [usages, standardFilter, buyerFilter, searchTerm, startDate, endDate]);

  // Summary Metrics
  const totalCottonUsedKg = filtered.reduce((s, u) => s + (u.cottonUsedKg || 0), 0);
  const totalYarnProducedKg = filtered.reduce((s, u) => s + (u.yarnProducedKg || 0), 0);
  const totalWastageKg = filtered.reduce((s, u) => s + (u.wastageKg || 0), 0);
  const avgWastagePct = totalCottonUsedKg > 0 ? (totalWastageKg / totalCottonUsedKg) * 100 : 0;
  const avgYieldPct = totalCottonUsedKg > 0 ? (totalYarnProducedKg / totalCottonUsedKg) * 100 : 0;

  // Exports
  const handleExportExcel = () => {
    const data = filtered.map((u, i) => ({
      'SL': i + 1,
      'Date': u.date,
      'Standard': u.standard,
      'TC Number': u.tcNumber,
      'Lot No': u.lotNo,
      'Buyer / Party': u.buyerName,
      'Order / Ref': u.orderRef,
      'Yarn Count': u.yarnCount,
      'Yarn Type': u.yarnType,
      'Cotton Used (KG)': u.cottonUsedKg,
      'Yarn Output (KG)': u.yarnProducedKg,
      'Wastage (KG)': u.wastageKg,
      'Wastage %': `${u.wastagePct.toFixed(2)}%`,
      'Remarks': u.remarks || '',
    }));
    exportToExcel(data, `Cotton_Usage_Production_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    const headers = ['Date', 'Std', 'TC Number', 'Buyer', 'Yarn Count', 'Cotton Used (KG)', 'Yarn Output (KG)', 'Wastage (KG / %)'];
    const rows = filtered.map((u) => [
      u.date,
      u.standard,
      u.tcNumber,
      u.buyerName,
      u.yarnCount,
      u.cottonUsedKg.toLocaleString(),
      u.yarnProducedKg.toLocaleString(),
      `${u.wastageKg.toLocaleString()} (${u.wastagePct.toFixed(1)}%)`,
    ]);
    exportToPDF(
      'Party/Buyer-wise Certified Cotton Consumption & Production Report',
      headers,
      rows,
      `Cotton_Usage_Report_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Card */}
      <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-600" />
              Buyer-wise Cotton Consumption & Yarn Production Tracking
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track certified raw cotton consumed per buyer order, calculate yarn output, and monitor production wastage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
            >
              <Download className="w-4 h-4 text-rose-600" />
              PDF
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              + Record Cotton Usage
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Buyer, TC Number, Count, Order Ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none"
            />
          </div>

          <div>
            <select
              value={standardFilter}
              onChange={(e) => setStandardFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="All">All Standards</option>
              {AUDIT_STANDARDS_LIST.map((std) => (
                <option key={std} value={std}>
                  {std}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={buyerFilter}
              onChange={(e) => setBuyerFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-none"
            >
              <option value="All">All Buyers</option>
              {distinctBuyers.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-1/2 px-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] focus:ring-2 focus:ring-sky-500 outline-none"
              title="From Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-1/2 px-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] focus:ring-2 focus:ring-sky-500 outline-none"
              title="To Date"
            />
          </div>
        </div>

        {/* 4 Summary KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Total Cotton Used</div>
            <div className="text-base font-black text-sky-600 dark:text-sky-400 font-mono">
              {totalCottonUsedKg.toLocaleString()} <span className="text-xs font-normal">KG</span>
            </div>
            <div className="text-[10px] text-slate-400">{filtered.length} Production entries</div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-950/40 p-3 rounded-xl border border-purple-200 dark:border-purple-800/40">
            <div className="text-[10px] text-purple-700 dark:text-purple-300 uppercase font-bold">Total Yarn Produced</div>
            <div className="text-base font-black text-purple-700 dark:text-purple-300 font-mono">
              {totalYarnProducedKg.toLocaleString()} <span className="text-xs font-normal">KG</span>
            </div>
            <div className="text-[10px] text-purple-600 font-bold">
              {avgYieldPct.toFixed(1)}% Conversion Yield
            </div>
          </div>

          <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-xl border border-rose-200 dark:border-rose-800/40">
            <div className="text-[10px] text-rose-700 dark:text-rose-300 uppercase font-bold">Total Wastage</div>
            <div className="text-base font-black text-rose-700 dark:text-rose-300 font-mono">
              {totalWastageKg.toLocaleString()} <span className="text-xs font-normal">KG</span>
            </div>
            <div className="text-[10px] text-rose-600 font-bold">
              Avg Wastage: {avgWastagePct.toFixed(2)}%
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Unique Buyers</div>
            <div className="text-base font-black text-slate-800 dark:text-slate-200 font-mono">
              {Array.from(new Set(filtered.map((f) => f.buyerName))).length} <span className="text-xs font-normal">Brands</span>
            </div>
            <div className="text-[10px] text-slate-400">Sustainability Orders</div>
          </div>
        </div>
      </div>

      {/* Usages Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Standard</th>
                <th className="px-4 py-3">TC Number & Lot</th>
                <th className="px-4 py-3">Buyer / Party</th>
                <th className="px-4 py-3">Order / Style Ref</th>
                <th className="px-4 py-3">Yarn Count & Type</th>
                <th className="px-4 py-3 text-right">Cotton Used (KG)</th>
                <th className="px-4 py-3 text-right">Yarn Output (KG)</th>
                <th className="px-4 py-3 text-right">Wastage (KG / %)</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    No cotton usage records found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const color = STANDARD_COLORS[item.standard] || STANDARD_COLORS.Other;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {item.date}
                      </td>

                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${color.badge}`}>
                          {item.standard}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div
                          onClick={() => onViewTcTraceability(item.tcNumber)}
                          className="font-bold text-slate-900 dark:text-white font-mono cursor-pointer hover:text-emerald-600 flex items-center gap-1"
                        >
                          {item.tcNumber}
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">Lot: {item.lotNo}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white">{item.buyerName}</div>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {item.orderRef}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{item.yarnCount}</div>
                        <div className="text-[10px] text-slate-400">{item.yarnType}</div>
                      </td>

                      <td className="px-4 py-3 text-right font-black font-mono text-slate-900 dark:text-white">
                        {item.cottonUsedKg.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-right font-black font-mono text-purple-600 dark:text-purple-400">
                        {item.yarnProducedKg.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-right font-mono">
                        <span className="text-rose-600 font-bold">{item.wastageKg.toLocaleString()} KG</span>
                        <div className="text-[10px] text-slate-400">({item.wastagePct.toFixed(1)}%)</div>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onViewTcTraceability(item.tcNumber)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                            title="TC Traceability"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Usage Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-sky-50 dark:bg-sky-950/50 text-sky-600 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingItem ? 'Edit Cotton Usage Entry' : 'Record Cotton Usage & Yarn Production'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Allocate cotton from active Transaction Certificate (TC) to Buyer order and compute wastage.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Select TC dropdown */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Select Source Transaction Certificate (TC) *
                </label>
                <select
                  value={formData.tcNumber}
                  onChange={(e) => handleTcChange(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 outline-none"
                  required
                >
                  <option value="">-- Choose Transaction Certificate --</option>
                  {receives.map((r) => (
                    <option key={r.id} value={r.tcNumber}>
                      [{r.standard}] {r.tcNumber} — {r.supplierName} ({r.quantityKg.toLocaleString()} KG, Lot: {r.lotNo})
                    </option>
                  ))}
                </select>
              </div>

              {/* TC Info Strip */}
              {formData.tcNumber && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300">
                      Standard: {formData.standard}
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">Lot: {formData.lotNo}</span>
                  </div>
                  <div className="font-bold text-emerald-700 dark:text-emerald-300">
                    Available TC Balance: <span className="font-mono text-sm">{availableTcBalance.toLocaleString()} KG</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Production Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                    required
                  />
                </div>

                {/* Buyer / Party Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Buyer / Party Name *
                  </label>
                  <input
                    type="text"
                    value={formData.buyerName}
                    onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                    placeholder="e.g. H&M Sourcing / Inditex / Marks & Spencer"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-sky-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Order / Style Ref */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Order / Style Reference
                  </label>
                  <input
                    type="text"
                    value={formData.orderRef}
                    onChange={(e) => setFormData({ ...formData, orderRef: e.target.value })}
                    placeholder="e.g. PO-HM-8812 / Style: Eco-Tee"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                </div>

                {/* Yarn Count */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Yarn Count *
                  </label>
                  <input
                    type="text"
                    value={formData.yarnCount}
                    onChange={(e) => setFormData({ ...formData, yarnCount: e.target.value })}
                    placeholder="e.g. 30/1 Ne Organic Combed Hosiery"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                    required
                  />
                </div>
              </div>

              {/* Conversion & Wastage Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-purple-600" />
                  Cotton Consumption, Yarn Output & Wastage Calculation
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Cotton Used (KG) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Cotton Used (KG) *
                    </label>
                    <input
                      type="number"
                      value={formData.cottonUsedKg || ''}
                      onChange={(e) =>
                        handleCottonOrYarnChange(Number(e.target.value), formData.yarnProducedKg)
                      }
                      placeholder="e.g. 15000"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-black text-sky-600 focus:ring-2 focus:ring-sky-500 outline-none"
                      required
                    />
                  </div>

                  {/* Yarn Produced (KG) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Yarn Produced (KG) *
                    </label>
                    <input
                      type="number"
                      value={formData.yarnProducedKg || ''}
                      onChange={(e) =>
                        handleCottonOrYarnChange(formData.cottonUsedKg, Number(e.target.value))
                      }
                      placeholder="e.g. 13650"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-black text-purple-600 focus:ring-2 focus:ring-sky-500 outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Auto Calculated Wastage & Yield Display */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-lg text-center">
                    <div className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300">
                      Calculated Wastage
                    </div>
                    <div className="text-sm font-black font-mono text-rose-700 dark:text-rose-300 mt-0.5">
                      {formData.wastageKg.toLocaleString()} KG ({formData.wastagePct.toFixed(2)}%)
                    </div>
                  </div>

                  <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 rounded-lg text-center">
                    <div className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300">
                      Conversion Yield
                    </div>
                    <div className="text-sm font-black font-mono text-purple-700 dark:text-purple-300 mt-0.5">
                      {formData.cottonUsedKg > 0
                        ? ((formData.yarnProducedKg / formData.cottonUsedKg) * 100).toFixed(2)
                        : 0}
                      % Output
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Spindle Line / Test Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Spinning line details, comber noil percentage, or buyer delivery notes..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 outline-none resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 transition"
                >
                  {editingItem ? 'Update Usage' : 'Save Cotton Usage Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
