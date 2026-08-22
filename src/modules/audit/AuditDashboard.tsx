import React, { useState } from 'react';
import {
  ShieldCheck,
  Award,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Package,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  FileText,
  Building2,
  Users,
  Percent,
  Plus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  CertifiedCottonReceive,
  CertifiedCottonUsage,
  AuditRecord,
  CertificationRecord,
  AuditStandard,
} from '../../types';
import { AUDIT_STANDARDS_LIST, STANDARD_COLORS } from '../../data/auditSeedData';

interface AuditDashboardProps {
  receives: CertifiedCottonReceive[];
  usages: CertifiedCottonUsage[];
  audits: AuditRecord[];
  certificates: CertificationRecord[];
  onNavigateTab: (tab: string) => void;
  onOpenReceiveModal: () => void;
  onOpenUsageModal: () => void;
  onOpenAuditModal: () => void;
  onOpenCertModal: () => void;
  onSelectStandardFilter: (std: string) => void;
}

export const AuditDashboard: React.FC<AuditDashboardProps> = ({
  receives,
  usages,
  audits,
  certificates,
  onNavigateTab,
  onOpenReceiveModal,
  onOpenUsageModal,
  onOpenAuditModal,
  onOpenCertModal,
  onSelectStandardFilter,
}) => {
  const [selectedStd, setSelectedStd] = useState<string>('All');

  // Filtered dataset
  const filteredReceives = selectedStd === 'All' ? receives : receives.filter((r) => r.standard === selectedStd);
  const filteredUsages = selectedStd === 'All' ? usages : usages.filter((u) => u.standard === selectedStd);
  const filteredAudits = selectedStd === 'All' ? audits : audits.filter((a) => a.standard === selectedStd);
  const filteredCerts = selectedStd === 'All' ? certificates : certificates.filter((c) => c.standard === selectedStd);

  // Aggregations
  const totalReceivedKg = filteredReceives.reduce((sum, r) => sum + (r.quantityKg || 0), 0);
  const totalUsedKg = filteredUsages.reduce((sum, u) => sum + (u.cottonUsedKg || 0), 0);
  const totalYarnProducedKg = filteredUsages.reduce((sum, u) => sum + (u.yarnProducedKg || 0), 0);
  const totalWastageKg = filteredUsages.reduce((sum, u) => sum + (u.wastageKg || 0), 0);
  const avgWastagePct = totalUsedKg > 0 ? (totalWastageKg / totalUsedKg) * 100 : 0;
  const availableCottonBalanceKg = Math.max(0, totalReceivedKg - totalUsedKg);
  const conversionRate = totalUsedKg > 0 ? (totalYarnProducedKg / totalUsedKg) * 100 : 0;

  // Unique TCs count
  const allTcs = Array.from(new Set(filteredReceives.map((r) => r.tcNumber)));
  const tcBalances = allTcs.map((tc) => {
    const rec = filteredReceives.filter((r) => r.tcNumber === tc).reduce((sum, r) => sum + r.quantityKg, 0);
    const used = filteredUsages.filter((u) => u.tcNumber === tc).reduce((sum, u) => sum + u.cottonUsedKg, 0);
    return { tc, rec, used, bal: rec - used };
  });

  const activeTcs = tcBalances.filter((t) => t.bal > 0).length;
  const exhaustedTcs = tcBalances.filter((t) => t.bal <= 0).length;
  const lowTcs = tcBalances.filter((t) => t.bal > 0 && t.bal <= 1000).length;

  // Certificates aggregation
  const activeCerts = filteredCerts.filter((c) => c.status === 'Valid').length;
  const expiringCerts = filteredCerts.filter((c) => c.status === 'Expiring Soon').length;
  const expiredCerts = filteredCerts.filter((c) => c.status === 'Expired').length;

  // Audits aggregation
  const upcomingAudits = filteredAudits.filter((a) => a.status === 'Upcoming').length;
  const completedAudits = filteredAudits.filter((a) => a.status === 'Completed').length;
  const pendingCapa = filteredAudits.filter(
    (a) => a.capaStatus === 'Pending' || a.capaStatus === 'In Progress' || a.status === 'Corrective Action Pending'
  ).length;

  // Smart Alerts
  const alerts: { type: 'warning' | 'danger' | 'info'; title: string; desc: string; tab: string }[] = [];

  certificates.forEach((c) => {
    if (c.status === 'Expiring Soon') {
      alerts.push({
        type: 'warning',
        title: `${c.standard} Scope Certificate Expiring Soon`,
        desc: `Certificate #${c.certificateNo} expires on ${c.validUntil}. Please submit renewal dossier to ${c.certifyingBody}.`,
        tab: 'certificates',
      });
    } else if (c.status === 'Expired') {
      alerts.push({
        type: 'danger',
        title: `${c.standard} Certificate Expired`,
        desc: `Certificate #${c.certificateNo} expired on ${c.validUntil}. Action required immediately!`,
        tab: 'certificates',
      });
    }
  });

  audits.forEach((a) => {
    if (a.status === 'Upcoming') {
      alerts.push({
        type: 'info',
        title: `Upcoming ${a.standard} ${a.auditType}`,
        desc: `Audit by ${a.certifyingBody} scheduled on ${a.auditDate}. Ensure TC registers and segregation logs are ready.`,
        tab: 'audits',
      });
    }
    if (a.capaStatus === 'Pending' || a.capaStatus === 'In Progress') {
      alerts.push({
        type: 'warning',
        title: `Pending CAPA for ${a.standard} Audit`,
        desc: `NC: ${a.nonConformity || 'Corrective action'} resolution is currently ${a.capaStatus}.`,
        tab: 'audits',
      });
    }
  });

  tcBalances.forEach((t) => {
    if (t.bal > 0 && t.bal <= 1000) {
      alerts.push({
        type: 'warning',
        title: `Low Cotton Balance in ${t.tc}`,
        desc: `Only ${t.bal.toLocaleString()} KG remaining out of ${t.rec.toLocaleString()} KG received.`,
        tab: 'tc-traceability',
      });
    }
  });

  return (
    <div className="space-y-6">
      {/* Top Standard Switcher Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mr-1">
            Standard:
          </span>
          <button
            onClick={() => {
              setSelectedStd('All');
              onSelectStandardFilter('All');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedStd === 'All'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Standards ({receives.length} TCs)
          </button>

          {AUDIT_STANDARDS_LIST.map((std) => {
            const count = receives.filter((r) => r.standard === std).length;
            const certCount = certificates.filter((c) => c.standard === std).length;
            const isSelected = selectedStd === std;
            const color = STANDARD_COLORS[std] || STANDARD_COLORS.Other;

            return (
              <button
                key={std}
                onClick={() => {
                  setSelectedStd(std);
                  onSelectStandardFilter(std);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : `${color.bg} ${color.text} hover:opacity-80 border ${color.border}`
                }`}
              >
                <span>{std}</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-black/10 dark:bg-white/10 rounded-full font-mono">
                  {count} TCs
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenReceiveModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            + Receive Certified Cotton (TC)
          </button>
          <button
            onClick={onOpenUsageModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            <Layers className="w-4 h-4" />
            + Record Cotton Usage
          </button>
        </div>
      </div>

      {/* Smart Alerts Section */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {alerts.slice(0, 3).map((alert, idx) => (
            <div
              key={idx}
              onClick={() => onNavigateTab(alert.tab)}
              className={`p-3.5 rounded-2xl border cursor-pointer transition hover:shadow-md flex items-start gap-3 ${
                alert.type === 'danger'
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
                  : alert.type === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
                  : 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/60 text-sky-900 dark:text-sky-200'
              }`}
            >
              <div
                className={`p-2 rounded-xl flex-shrink-0 ${
                  alert.type === 'danger'
                    ? 'bg-rose-200 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300'
                    : alert.type === 'warning'
                    ? 'bg-amber-200 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                    : 'bg-sky-200 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold truncate">{alert.title}</h4>
                  <ArrowRight className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
                </div>
                <p className="text-[11px] opacity-90 mt-0.5 line-clamp-2">{alert.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4 Main Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Cotton Received */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Certified Cotton Received</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalReceivedKg.toLocaleString()} <span className="text-sm font-normal text-slate-500">KG</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 pt-2">
            <span>{filteredReceives.length} Receives across {allTcs.length} TCs</span>
            <span className="font-bold text-emerald-600">{((totalReceivedKg / 1000) || 0).toFixed(1)} MT</span>
          </div>
        </div>

        {/* Card 2: Cotton Used / Consumed */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Cotton Used</span>
            <div className="p-2 bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {totalUsedKg.toLocaleString()} <span className="text-sm font-normal text-slate-500">KG</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 pt-2">
            <span>{filteredUsages.length} Production Batches</span>
            <span className="font-bold text-sky-600">
              {totalReceivedKg > 0 ? ((totalUsedKg / totalReceivedKg) * 100).toFixed(1) : 0}% Utilized
            </span>
          </div>
        </div>

        {/* Card 3: Yarn Output & Wastage */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Yarn Output & Wastage</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {totalYarnProducedKg.toLocaleString()} <span className="text-sm font-normal text-slate-500">KG Yarn</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 pt-2">
            <span className="text-rose-600 dark:text-rose-400 font-medium">
              Waste: {totalWastageKg.toLocaleString()} KG ({avgWastagePct.toFixed(1)}%)
            </span>
            <span className="font-bold text-purple-600">{conversionRate.toFixed(1)}% Yield</span>
          </div>
        </div>

        {/* Card 4: Available Cotton Balance */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Available Cotton Balance</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {availableCottonBalanceKg.toLocaleString()} <span className="text-sm font-normal text-slate-500">KG</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 pt-2">
            <span>{activeTcs} Active TCs with stock</span>
            <span className="font-bold text-emerald-600">Ready for Spin</span>
          </div>
        </div>
      </div>

      {/* 2-Column Section: TC Stock & Conversion Analytics + Standard Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Standard-wise Breakdown Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              Standard-wise Stock, Production & Conversion Matrix
            </h3>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold flex items-center gap-1"
            >
              View Detailed Reports <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {AUDIT_STANDARDS_LIST.filter((std) => std !== 'Other').map((std) => {
              const stdReceives = receives.filter((r) => r.standard === std);
              const stdUsages = usages.filter((u) => u.standard === std);
              const stdRecKg = stdReceives.reduce((sum, r) => sum + r.quantityKg, 0);
              const stdUsedKg = stdUsages.reduce((sum, u) => sum + u.cottonUsedKg, 0);
              const stdYarnKg = stdUsages.reduce((sum, u) => sum + u.yarnProducedKg, 0);
              const stdWasteKg = stdUsages.reduce((sum, u) => sum + u.wastageKg, 0);
              const stdWastePct = stdUsedKg > 0 ? (stdWasteKg / stdUsedKg) * 100 : 0;
              const stdBalKg = Math.max(0, stdRecKg - stdUsedKg);
              const progressPct = stdRecKg > 0 ? Math.min(100, (stdUsedKg / stdRecKg) * 100) : 0;
              const color = STANDARD_COLORS[std] || STANDARD_COLORS.Other;
              const stdCerts = certificates.filter((c) => c.standard === std);

              return (
                <div
                  key={std}
                  className={`p-4 rounded-2xl border ${color.border} ${color.bg} transition hover:shadow-md relative overflow-hidden`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${color.badge}`}>
                        {std} Standard
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {stdReceives.length} TCs | {stdCerts.length} Scope Certs
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      {progressPct.toFixed(0)}% Used
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2 overflow-hidden mb-3">
                    <div
                      className="bg-emerald-600 dark:bg-emerald-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>

                  {/* Key Numbers Grid */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl border border-black/5 dark:border-white/5">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Received</div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                        {stdRecKg.toLocaleString()}
                      </div>
                      <div className="text-[9px] text-slate-400">KG</div>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl border border-black/5 dark:border-white/5">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Yarn Output</div>
                      <div className="font-bold text-purple-600 dark:text-purple-400 font-mono">
                        {stdYarnKg.toLocaleString()}
                      </div>
                      <div className="text-[9px] text-slate-400">({stdWastePct.toFixed(1)}% Waste)</div>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-800/80 p-2 rounded-xl border border-black/5 dark:border-white/5">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Balance</div>
                      <div className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                        {stdBalKg.toLocaleString()}
                      </div>
                      <div className="text-[9px] text-slate-400">KG Avail.</div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 dark:text-slate-400">
                      Next Prod. Capacity: <strong className="text-slate-800 dark:text-slate-200">~{Math.round(stdBalKg * 0.91).toLocaleString()} KG Yarn</strong>
                    </span>
                    <button
                      onClick={() => {
                        setSelectedStd(std);
                        onNavigateTab('tc-traceability');
                      }}
                      className="text-emerald-700 dark:text-emerald-400 font-bold hover:underline"
                    >
                      Track TCs →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Compliance & Audit Summary Panel */}
        <div className="space-y-4">
          {/* Certificate Health Box */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Scope Certificates Status
              </h3>
              <button
                onClick={onOpenCertModal}
                className="text-xs text-emerald-600 font-semibold hover:underline"
              >
                + Add Cert
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">{activeCerts}</div>
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">Valid Active</div>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-xl">
                <div className="text-xl font-bold text-amber-700 dark:text-amber-400 font-mono">{expiringCerts}</div>
                <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">Expiring Soon</div>
              </div>
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-xl">
                <div className="text-xl font-bold text-rose-700 dark:text-rose-400 font-mono">{expiredCerts}</div>
                <div className="text-[11px] text-rose-800 dark:text-rose-300 font-medium">Expired</div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Licenses:</div>
              {certificates.slice(0, 3).map((cert) => (
                <div
                  key={cert.id}
                  onClick={() => onNavigateTab('certificates')}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs cursor-pointer transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{cert.standard}</span>
                    <span className="text-[11px] text-slate-500 font-mono truncate max-w-[120px]">
                      {cert.certificateNo}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      cert.status === 'Valid'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                    }`}
                  >
                    Exp: {cert.validUntil}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Audit & CAPA Box */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-600" />
                Audit & CAPA Oversight
              </h3>
              <button
                onClick={onOpenAuditModal}
                className="text-xs text-sky-600 font-semibold hover:underline"
              >
                + Schedule
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 rounded-xl">
                <div className="text-xl font-bold text-sky-700 dark:text-sky-400 font-mono">{upcomingAudits}</div>
                <div className="text-[11px] text-sky-800 dark:text-sky-300 font-medium">Upcoming</div>
              </div>
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-xl">
                <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">{completedAudits}</div>
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">Completed</div>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 rounded-xl">
                <div className="text-xl font-bold text-amber-700 dark:text-amber-400 font-mono">{pendingCapa}</div>
                <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">Pending CAPA</div>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700">
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Recent / Next Audits:</div>
              {audits.slice(0, 3).map((aud) => (
                <div
                  key={aud.id}
                  onClick={() => onNavigateTab('audits')}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs cursor-pointer transition"
                >
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">
                      {aud.standard} - {aud.auditType}
                    </div>
                    <div className="text-[10px] text-slate-500">{aud.certifyingBody}</div>
                  </div>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      aud.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                        : 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300'
                    }`}
                  >
                    {aud.auditDate}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
