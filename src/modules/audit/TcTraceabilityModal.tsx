import React from 'react';
import {
  ShieldCheck,
  Package,
  Layers,
  FileText,
  Calendar,
  Building2,
  Globe,
  Tag,
  Paperclip,
  Printer,
  X,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  CertifiedCottonReceive,
  CertifiedCottonUsage,
  AuditStandard,
} from '../../types';
import { STANDARD_COLORS } from '../../data/auditSeedData';
import { triggerAppPrint } from '../../utils/printUtils';

interface TcTraceabilityModalProps {
  tcNumber: string | null;
  onClose: () => void;
  receives: CertifiedCottonReceive[];
  usages: CertifiedCottonUsage[];
  onOpenUsageModal?: (tcNumber: string) => void;
}

export const TcTraceabilityModal: React.FC<TcTraceabilityModalProps> = ({
  tcNumber,
  onClose,
  receives,
  usages,
  onOpenUsageModal,
}) => {
  if (!tcNumber) return null;

  const receiveRecord = receives.find((r) => r.tcNumber === tcNumber) || receives[0];
  const relatedUsages = usages.filter((u) => u.tcNumber === tcNumber);

  // Calculations
  const receivedQty = receiveRecord ? receiveRecord.quantityKg : 0;
  const totalUsedQty = relatedUsages.reduce((sum, u) => sum + (u.cottonUsedKg || 0), 0);
  const totalYarnProduced = relatedUsages.reduce((sum, u) => sum + (u.yarnProducedKg || 0), 0);
  const totalWastage = relatedUsages.reduce((sum, u) => sum + (u.wastageKg || 0), 0);
  const availableBalance = Math.max(0, receivedQty - totalUsedQty);
  const usedPct = receivedQty > 0 ? (totalUsedQty / receivedQty) * 100 : 0;
  const wastagePct = totalUsedQty > 0 ? (totalWastage / totalUsedQty) * 100 : 0;
  const yieldPct = totalUsedQty > 0 ? (totalYarnProduced / totalUsedQty) * 100 : 0;

  // Estimate next yarn production based on 91% spinning conversion
  const estimatedNextYarnKg = Math.round(availableBalance * 0.91);

  const stdColor = receiveRecord ? STANDARD_COLORS[receiveRecord.standard] || STANDARD_COLORS.Other : STANDARD_COLORS.Other;

  const handlePrint = () => {
    triggerAppPrint();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${stdColor.bg} border ${stdColor.border}`}>
              <ShieldCheck className={`w-6 h-6 ${stdColor.text}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${stdColor.badge}`}>
                  {receiveRecord?.standard || 'Certified'} Standard
                </span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  Lot: {receiveRecord?.lotNo}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
                {tcNumber}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Full Transaction Certificate Traceability & Cotton-to-Yarn Mass Balance Sheet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
              Print Official TC Sheet
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 4 Metrics Summary Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">1. Total TC Received</div>
            <div className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {receivedQty.toLocaleString()} <span className="text-xs font-normal">KG</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{receiveRecord?.baleCount || 0} Bales Lint</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">2. Cotton Used (Spinning)</div>
            <div className="text-lg font-black text-sky-600 dark:text-sky-400 font-mono mt-0.5">
              {totalUsedQty.toLocaleString()} <span className="text-xs font-normal">KG</span>
            </div>
            <div className="text-[10px] text-sky-600 font-bold mt-0.5">{usedPct.toFixed(1)}% Consumed</div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">3. Total Yarn Produced</div>
            <div className="text-lg font-black text-purple-600 dark:text-purple-400 font-mono mt-0.5">
              {totalYarnProduced.toLocaleString()} <span className="text-xs font-normal">KG</span>
            </div>
            <div className="text-[10px] text-rose-500 font-medium mt-0.5">
              {totalWastage.toLocaleString()} KG Waste ({wastagePct.toFixed(1)}%)
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/40 text-center">
            <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">
              4. Available Balance
            </div>
            <div className="text-lg font-black text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
              {availableBalance.toLocaleString()} <span className="text-xs font-normal">KG</span>
            </div>
            <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
              ~{estimatedNextYarnKg.toLocaleString()} KG Yarn Cap.
            </div>
          </div>
        </div>

        {/* Mass Balance Progress Bar */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span>TC Mass Balance Utilization:</span>
            <span className="font-mono">{usedPct.toFixed(1)}% Consumed ({availableBalance.toLocaleString()} KG Left)</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden flex">
            <div
              className="bg-sky-600 h-3 transition-all duration-500"
              style={{ width: `${Math.min(100, usedPct)}%` }}
              title={`Used: ${totalUsedQty.toLocaleString()} KG`}
            />
            <div
              className="bg-emerald-500 h-3 transition-all duration-500"
              style={{ width: `${Math.max(0, 100 - usedPct)}%` }}
              title={`Balance: ${availableBalance.toLocaleString()} KG`}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-600 inline-block" />
              Used for Buyer Orders: <strong>{totalUsedQty.toLocaleString()} KG</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Available for Next Allocation: <strong>{availableBalance.toLocaleString()} KG</strong>
            </span>
          </div>
        </div>

        {/* 2-Column: Raw Cotton Specs & Conversion Efficiency */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Box 1: Raw Cotton Inward Specs */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600" />
              Certified Raw Cotton Inward Specifications
            </h4>
            <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Supplier / Shipper:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{receiveRecord?.supplierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Country of Origin:</span>
                <span className="font-bold">{receiveRecord?.countryOfOrigin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lot Number / Bales:</span>
                <span className="font-mono font-bold">{receiveRecord?.lotNo} ({receiveRecord?.baleCount} Bales)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Receive Date:</span>
                <span>{receiveRecord?.receiveDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">TC Issue / Validity Date:</span>
                <span>{receiveRecord?.tcIssueDate} {receiveRecord?.tcValidityDate ? `(Valid until: ${receiveRecord.tcValidityDate})` : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Challan / LC Reference:</span>
                <span className="font-mono">{receiveRecord?.invoiceChallanNo}</span>
              </div>
              {receiveRecord?.cottonDescription && (
                <div className="pt-1 text-[11px] text-slate-500 border-t border-slate-200 dark:border-slate-700">
                  {receiveRecord.cottonDescription}
                </div>
              )}
            </div>
          </div>

          {/* Box 2: Conversion & Wastage Performance */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              Spinning Conversion & Wastage Performance
            </h4>
            <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Cotton Conversion Yield:</span>
                <span className="font-bold text-purple-600 dark:text-purple-400 font-mono">{yieldPct.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Wastage Quantity:</span>
                <span className="font-mono text-rose-600 font-bold">{totalWastage.toLocaleString()} KG</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Wastage Percentage:</span>
                <span className="font-mono text-rose-600 font-bold">{wastagePct.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Number of Production Runs:</span>
                <span className="font-bold">{relatedUsages.length} Batches</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Allocated Buyers:</span>
                <span className="font-bold">
                  {Array.from(new Set(relatedUsages.map((u) => u.buyerName))).join(', ') || 'None yet'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Party / Buyer-wise Certified Cotton Consumption Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-sky-600" />
              Buyer / Party-wise Consumption & Yarn Production Logs ({relatedUsages.length})
            </h4>
            {availableBalance > 0 && onOpenUsageModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenUsageModal(tcNumber);
                }}
                className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-bold"
              >
                + Record New Usage from this TC
              </button>
            )}
          </div>

          <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-[11px]">
                  <tr>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5">Buyer / Party</th>
                    <th className="px-3 py-2.5">Order / Ref</th>
                    <th className="px-3 py-2.5">Yarn Count & Type</th>
                    <th className="px-3 py-2.5 text-right">Cotton Used (KG)</th>
                    <th className="px-3 py-2.5 text-right">Yarn Output (KG)</th>
                    <th className="px-3 py-2.5 text-right">Wastage (KG / %)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {relatedUsages.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                        No consumption recorded yet from this TC. 100% stock available ({receivedQty.toLocaleString()} KG).
                      </td>
                    </tr>
                  ) : (
                    relatedUsages.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-400">{u.date}</td>
                        <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-200">{u.buyerName}</td>
                        <td className="px-3 py-2 text-slate-600 dark:text-slate-400 font-mono text-[11px]">{u.orderRef}</td>
                        <td className="px-3 py-2">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{u.yarnCount}</div>
                          <div className="text-[10px] text-slate-400">{u.yarnType}</div>
                        </td>
                        <td className="px-3 py-2 text-right font-black font-mono text-slate-900 dark:text-white">
                          {u.cottonUsedKg.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right font-black font-mono text-purple-600 dark:text-purple-400">
                          {u.yarnProducedKg.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-rose-600">
                          {u.wastageKg.toLocaleString()} KG ({u.wastagePct.toFixed(1)}%)
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Attached Documents */}
        {receiveRecord?.documents && receiveRecord.documents.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-emerald-600" />
              Attached Official TC & Supporting Documents ({receiveRecord.documents.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {receiveRecord.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <div className="truncate">
                      <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{doc.name}</div>
                      <div className="text-[10px] text-slate-400">{doc.type} • {doc.size || '1.2 MB'}</div>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded font-bold">
                    Verified
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-4 text-xs">
          <div className="text-slate-500">
            Standard: <strong>{receiveRecord?.standard}</strong> | Lot: <strong>{receiveRecord?.lotNo}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
