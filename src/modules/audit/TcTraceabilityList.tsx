import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Layers,
  FileSpreadsheet,
  Download,
  Calendar,
  Building2,
  Globe,
  ArrowRight,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Eye,
  Plus,
} from 'lucide-react';
import {
  CertifiedCottonReceive,
  CertifiedCottonUsage,
  AuditStandard,
} from '../../types';
import { AUDIT_STANDARDS_LIST, STANDARD_COLORS } from '../../data/auditSeedData';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

interface TcTraceabilityListProps {
  receives: CertifiedCottonReceive[];
  usages: CertifiedCottonUsage[];
  onViewTcTraceability: (tcNumber: string) => void;
  onOpenUsageModal?: (tcNumber?: string) => void;
  selectedStandardFilter?: string;
}

export const TcTraceabilityList: React.FC<TcTraceabilityListProps> = ({
  receives,
  usages,
  onViewTcTraceability,
  onOpenUsageModal,
  selectedStandardFilter = 'All',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [standardFilter, setStandardFilter] = useState<string>(selectedStandardFilter);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Available' | 'Low' | 'Exhausted'>('All');

  // Compute TC Summary Matrix
  const tcMatrix = useMemo(() => {
    // Unique TCs from receives
    const tcMap = new Map<string, {
      tcNumber: string;
      standard: AuditStandard;
      supplierName: string;
      countryOfOrigin: string;
      lotNo: string;
      baleCount: number;
      receiveDate: string;
      tcIssueDate: string;
      tcValidityDate?: string;
      invoiceChallanNo: string;
      receiveQtyKg: number;
      usedQtyKg: number;
      yarnProducedKg: number;
      wastageKg: number;
      balanceKg: number;
      usedPct: number;
      wastagePct: number;
      yieldPct: number;
      buyers: string[];
      usageCount: number;
      status: 'Available' | 'Low' | 'Exhausted';
    }>();

    receives.forEach((r) => {
      if (!tcMap.has(r.tcNumber)) {
        tcMap.set(r.tcNumber, {
          tcNumber: r.tcNumber,
          standard: r.standard,
          supplierName: r.supplierName,
          countryOfOrigin: r.countryOfOrigin,
          lotNo: r.lotNo,
          baleCount: r.baleCount,
          receiveDate: r.receiveDate,
          tcIssueDate: r.tcIssueDate,
          tcValidityDate: r.tcValidityDate,
          invoiceChallanNo: r.invoiceChallanNo,
          receiveQtyKg: r.quantityKg,
          usedQtyKg: 0,
          yarnProducedKg: 0,
          wastageKg: 0,
          balanceKg: r.quantityKg,
          usedPct: 0,
          wastagePct: 0,
          yieldPct: 0,
          buyers: [],
          usageCount: 0,
          status: 'Available',
        });
      } else {
        const existing = tcMap.get(r.tcNumber)!;
        existing.receiveQtyKg += r.quantityKg;
        existing.baleCount += r.baleCount;
      }
    });

    // Populate usages
    usages.forEach((u) => {
      const tc = tcMap.get(u.tcNumber);
      if (tc) {
        tc.usedQtyKg += u.cottonUsedKg;
        tc.yarnProducedKg += u.yarnProducedKg;
        tc.wastageKg += u.wastageKg;
        tc.usageCount += 1;
        if (!tc.buyers.includes(u.buyerName)) {
          tc.buyers.push(u.buyerName);
        }
      }
    });

    // Recalculate balances & statuses
    const list = Array.from(tcMap.values()).map((tc) => {
      const bal = Math.max(0, tc.receiveQtyKg - tc.usedQtyKg);
      const usedPct = tc.receiveQtyKg > 0 ? (tc.usedQtyKg / tc.receiveQtyKg) * 100 : 0;
      const wastagePct = tc.usedQtyKg > 0 ? (tc.wastageKg / tc.usedQtyKg) * 100 : 0;
      const yieldPct = tc.usedQtyKg > 0 ? (tc.yarnProducedKg / tc.usedQtyKg) * 100 : 0;

      let status: 'Available' | 'Low' | 'Exhausted' = 'Available';
      if (bal <= 0) {
        status = 'Exhausted';
      } else if (bal <= 1000 || usedPct >= 90) {
        status = 'Low';
      }

      return {
        ...tc,
        balanceKg: bal,
        usedPct,
        wastagePct,
        yieldPct,
        status,
      };
    });

    return list;
  }, [receives, usages]);

  // Filtered TC Matrix
  const filtered = useMemo(() => {
    return tcMatrix.filter((item) => {
      const matchStd = standardFilter === 'All' || item.standard === standardFilter;
      const matchStatus = statusFilter === 'All' || item.status === statusFilter;
      const matchSearch =
        searchTerm === '' ||
        item.tcNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lotNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.countryOfOrigin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.buyers.some((b) => b.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchStd && matchStatus && matchSearch;
    });
  }, [tcMatrix, standardFilter, statusFilter, searchTerm]);

  // Totals for filtered
  const totalReceiveKg = filtered.reduce((s, i) => s + i.receiveQtyKg, 0);
  const totalUsedKg = filtered.reduce((s, i) => s + i.usedQtyKg, 0);
  const totalYarnKg = filtered.reduce((s, i) => s + i.yarnProducedKg, 0);
  const totalBalanceKg = filtered.reduce((s, i) => s + i.balanceKg, 0);
  const totalWastageKg = filtered.reduce((s, i) => s + i.wastageKg, 0);
  const avgWastagePct = totalUsedKg > 0 ? (totalWastageKg / totalUsedKg) * 100 : 0;

  // Exports
  const handleExportExcel = () => {
    const data = filtered.map((t, idx) => ({
      'SL': idx + 1,
      'Standard': t.standard,
      'TC Number': t.tcNumber,
      'Supplier': t.supplierName,
      'Origin': t.countryOfOrigin,
      'Lot No': t.lotNo,
      'Received Qty (KG)': t.receiveQtyKg,
      'Cotton Used (KG)': t.usedQtyKg,
      'Balance Available (KG)': t.balanceKg,
      'Used %': `${t.usedPct.toFixed(1)}%`,
      'Yarn Output (KG)': t.yarnProducedKg,
      'Wastage (KG)': t.wastageKg,
      'Wastage %': `${t.wastagePct.toFixed(1)}%`,
      'Status': t.status,
      'Allocated Buyers': t.buyers.join(', '),
      'TC Issue Date': t.tcIssueDate,
      'TC Validity': t.tcValidityDate || 'N/A',
    }));
    exportToExcel(data, `TC_Traceability_Ledger_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    const headers = ['Std', 'TC Number', 'Supplier', 'Lot', 'Rec (KG)', 'Used (KG)', 'Bal (KG)', 'Used %', 'Yarn (KG)', 'Status'];
    const rows = filtered.map((t) => [
      t.standard,
      t.tcNumber,
      t.supplierName,
      t.lotNo,
      t.receiveQtyKg.toLocaleString(),
      t.usedQtyKg.toLocaleString(),
      t.balanceKg.toLocaleString(),
      `${t.usedPct.toFixed(1)}%`,
      t.yarnProducedKg.toLocaleString(),
      t.status,
    ]);
    exportToPDF(
      'TC-wise Certified Cotton Traceability & Balance Sheet',
      headers,
      rows,
      `TC_Traceability_Report_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              TC-wise Cotton Traceability & Stock Balance Control
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Complete Transaction Certificate mass-balance ledger: Receive Qty vs. Used Qty vs. Available Balance & Yarn Conversion.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Export Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
            >
              <Download className="w-4 h-4 text-rose-600" />
              Export PDF
            </button>
            {onOpenUsageModal && (
              <button
                onClick={() => onOpenUsageModal()}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
              >
                <Layers className="w-4 h-4" />
                + Record Usage
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search TC Number, Supplier, Lot, Buyer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <select
              value={standardFilter}
              onChange={(e) => setStandardFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
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
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="All">All Stock Statuses</option>
              <option value="Available">Available Stock</option>
              <option value="Low">Low Balance (&lt; 15%)</option>
              <option value="Exhausted">Fully Exhausted (100%)</option>
            </select>
          </div>
        </div>

        {/* 4 Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Total TC Inward</div>
            <div className="text-base font-black text-slate-900 dark:text-white font-mono">
              {totalReceiveKg.toLocaleString()} <span className="text-xs font-normal">KG</span>
            </div>
            <div className="text-[10px] text-slate-400">{filtered.length} TCs in view</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Total Cotton Used</div>
            <div className="text-base font-black text-sky-600 dark:text-sky-400 font-mono">
              {totalUsedKg.toLocaleString()} <span className="text-xs font-normal">KG</span>
            </div>
            <div className="text-[10px] text-sky-600 font-bold">
              {totalReceiveKg > 0 ? ((totalUsedKg / totalReceiveKg) * 100).toFixed(1) : 0}% Consumed
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="text-[10px] text-slate-500 uppercase font-bold">Total Yarn Produced</div>
            <div className="text-base font-black text-purple-600 dark:text-purple-400 font-mono">
              {totalYarnKg.toLocaleString()} <span className="text-xs font-normal">KG</span>
            </div>
            <div className="text-[10px] text-rose-500 font-medium">
              Waste: {totalWastageKg.toLocaleString()} KG ({avgWastagePct.toFixed(1)}%)
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/40">
            <div className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-bold">Available Balance</div>
            <div className="text-base font-black text-emerald-700 dark:text-emerald-300 font-mono">
              {totalBalanceKg.toLocaleString()} <span className="text-xs font-normal">KG</span>
            </div>
            <div className="text-[10px] text-emerald-600 font-bold">
              Ready for Allocation
            </div>
          </div>
        </div>
      </div>

      {/* TC Traceability Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Standard & TC Number</th>
                <th className="px-4 py-3">Supplier & Origin</th>
                <th className="px-4 py-3">Lot No</th>
                <th className="px-4 py-3 text-right">Received (KG)</th>
                <th className="px-4 py-3 text-right">Used (KG)</th>
                <th className="px-4 py-3 text-right">Available Balance (KG)</th>
                <th className="px-4 py-3">Consumption Meter</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Allocated Buyers</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-400">
                    No Transaction Certificates found for this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const color = STANDARD_COLORS[item.standard] || STANDARD_COLORS.Other;
                  return (
                    <tr
                      key={item.tcNumber}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition cursor-pointer"
                      onClick={() => onViewTcTraceability(item.tcNumber)}
                    >
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-lg text-[11px] font-black ${color.badge} mr-1.5`}>
                          {item.standard}
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white hover:text-emerald-600">
                          {item.tcNumber}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Issued: {item.tcIssueDate} {item.tcValidityDate ? `| Valid: ${item.tcValidityDate}` : ''}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{item.supplierName}</div>
                        <div className="text-[11px] text-slate-500">{item.countryOfOrigin}</div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{item.lotNo}</span>
                        <div className="text-[10px] text-slate-400">{item.baleCount} Bales</div>
                      </td>

                      <td className="px-4 py-3 text-right font-black font-mono text-slate-900 dark:text-white">
                        {item.receiveQtyKg.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-right font-black font-mono text-sky-600 dark:text-sky-400">
                        {item.usedQtyKg.toLocaleString()}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div
                          className={`font-black font-mono text-sm ${
                            item.balanceKg > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {item.balanceKg.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400">KG Left</div>
                      </td>

                      <td className="px-4 py-3 min-w-[130px]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 mb-1">
                          <span>{item.usedPct.toFixed(0)}% Used</span>
                          <span>{item.balanceKg.toLocaleString()} KG</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden flex">
                          <div
                            className="bg-sky-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(100, item.usedPct)}%` }}
                          />
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {item.status === 'Available' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            Available
                          </span>
                        )}
                        {item.status === 'Low' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                            <AlertTriangle className="w-3 h-3" />
                            Low Stock
                          </span>
                        )}
                        {item.status === 'Exhausted' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                            Exhausted (100%)
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {item.buyers.length > 0 ? (
                          <div className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                            {item.buyers.slice(0, 2).join(', ')}
                            {item.buyers.length > 2 && ` +${item.buyers.length - 2} more`}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">No buyer assigned</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onViewTcTraceability(item.tcNumber)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-100 transition"
                            title="Open Deep-Dive Traceability Sheet"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Traceability
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
    </div>
  );
};
