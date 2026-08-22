import React, { useState } from 'react';
import {
  ShieldCheck,
  Package,
  Layers,
  Award,
  Calendar,
  FileText,
  LayoutDashboard,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Filter,
} from 'lucide-react';
import {
  CertifiedCottonReceive,
  CertifiedCottonUsage,
  AuditRecord,
  CertificationRecord,
  AuditItem,
} from '../types';
import { AuditDashboard } from './audit/AuditDashboard';
import { CertifiedReceiveList } from './audit/CertifiedReceiveList';
import { TcTraceabilityList } from './audit/TcTraceabilityList';
import { CertifiedUsageList } from './audit/CertifiedUsageList';
import { AuditScheduleList } from './audit/AuditScheduleList';
import { CertificateList } from './audit/CertificateList';
import { AuditReportsHub } from './audit/AuditReportsHub';
import { TcTraceabilityModal } from './audit/TcTraceabilityModal';
import { AUDIT_STANDARDS_LIST, STANDARD_COLORS } from '../data/auditSeedData';

interface AuditModuleProps {
  subTab?: string;
  auditItems?: AuditItem[];
  setAuditItems?: React.Dispatch<React.SetStateAction<AuditItem[]>>;
  certifiedCottonReceives: CertifiedCottonReceive[];
  setCertifiedCottonReceives: React.Dispatch<React.SetStateAction<CertifiedCottonReceive[]>>;
  certifiedCottonUsages: CertifiedCottonUsage[];
  setCertifiedCottonUsages: React.Dispatch<React.SetStateAction<CertifiedCottonUsage[]>>;
  auditRecords: AuditRecord[];
  setAuditRecords: React.Dispatch<React.SetStateAction<AuditRecord[]>>;
  certificationRecords: CertificationRecord[];
  setCertificationRecords: React.Dispatch<React.SetStateAction<CertificationRecord[]>>;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  requestAdminAction?: (title: string, action: () => void) => void;
}

export const AuditModule: React.FC<AuditModuleProps> = ({
  subTab = 'dashboard',
  certifiedCottonReceives,
  setCertifiedCottonReceives,
  certifiedCottonUsages,
  setCertifiedCottonUsages,
  auditRecords,
  setAuditRecords,
  certificationRecords,
  setCertificationRecords,
  showToast,
  requestAdminAction,
}) => {
  // Normalize subTab
  const getInitialTab = () => {
    if (subTab === 'receives' || subTab === 'receive') return 'receives';
    if (subTab === 'traceability' || subTab === 'trace') return 'traceability';
    if (subTab === 'usages' || subTab === 'usage' || subTab === 'production') return 'usages';
    if (subTab === 'schedule' || subTab === 'audits') return 'schedule';
    if (subTab === 'certificates' || subTab === 'certs') return 'certificates';
    if (subTab === 'reports') return 'reports';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab());
  const [selectedStandard, setSelectedStandard] = useState<string>('All');

  // Traceability Modal State (can be opened from any tab)
  const [traceabilityTc, setTraceabilityTc] = useState<string | null>(null);

  // Quick action modal triggers
  const [openReceiveModal, setOpenReceiveModal] = useState(false);
  const [openUsageModal, setOpenUsageModal] = useState(false);
  const [openAuditModal, setOpenAuditModal] = useState(false);
  const [openCertModal, setOpenCertModal] = useState(false);

  const handleNavigateTab = (tab: string) => {
    setActiveTab(tab);
  };

  const handleViewTraceability = (tcNumber: string) => {
    setTraceabilityTc(tcNumber);
  };

  const handleQuickReceive = () => {
    setActiveTab('receives');
    setOpenReceiveModal(true);
  };

  const handleQuickUsage = () => {
    setActiveTab('usages');
    setOpenUsageModal(true);
  };

  const handleQuickScheduleAudit = () => {
    setActiveTab('schedule');
    setOpenAuditModal(true);
  };

  const handleQuickAddCert = () => {
    setActiveTab('certificates');
    setOpenCertModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Standard Filter Pill Bar */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            Standard View:
          </span>
          <button
            onClick={() => setSelectedStandard('All')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              selectedStandard === 'All'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Standards
          </button>
          {AUDIT_STANDARDS_LIST.map((std) => {
            const isSel = selectedStandard === std;
            const color = STANDARD_COLORS[std] || STANDARD_COLORS.Other;
            return (
              <button
                key={std}
                onClick={() => setSelectedStandard(std)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                  isSel
                    ? `${color.badge} border-current shadow-sm scale-105`
                    : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                }`}
              >
                {std}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-slate-400 font-mono hidden md:block">
          Patriot Mill • Certified Traceability Suite
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Dashboard Overview
        </button>

        <button
          onClick={() => setActiveTab('receives')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'receives'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Package className="w-4 h-4" />
          Certified Cotton Receive (TC)
        </button>

        <button
          onClick={() => setActiveTab('traceability')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'traceability'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          TC Traceability & Stock
        </button>

        <button
          onClick={() => setActiveTab('usages')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'usages'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Layers className="w-4 h-4" />
          Cotton Usage & Yarn Output
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'schedule'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Audit & CAPA Tracker
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'certificates'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Award className="w-4 h-4" />
          Scope Certificates
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'reports'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          Official Reports Hub (10)
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'dashboard' && (
        <AuditDashboard
          receives={certifiedCottonReceives}
          usages={certifiedCottonUsages}
          audits={auditRecords}
          certificates={certificationRecords}
          onNavigateTab={handleNavigateTab}
          onOpenReceiveModal={handleQuickReceive}
          onOpenUsageModal={handleQuickUsage}
          onOpenAuditModal={handleQuickScheduleAudit}
          onOpenCertModal={handleQuickAddCert}
          onViewTcTraceability={handleViewTraceability}
          selectedStandard={selectedStandard}
          setSelectedStandard={setSelectedStandard}
        />
      )}

      {activeTab === 'receives' && (
        <CertifiedReceiveList
          receives={certifiedCottonReceives}
          setReceives={setCertifiedCottonReceives}
          showToast={showToast}
          requestAdminAction={requestAdminAction}
          onViewTcTraceability={handleViewTraceability}
          isModalOpenExternal={openReceiveModal}
          setIsModalOpenExternal={setOpenReceiveModal}
          selectedStandardFilter={selectedStandard}
        />
      )}

      {activeTab === 'traceability' && (
        <TcTraceabilityList
          receives={certifiedCottonReceives}
          usages={certifiedCottonUsages}
          onViewTcDetails={handleViewTraceability}
          selectedStandardFilter={selectedStandard}
        />
      )}

      {activeTab === 'usages' && (
        <CertifiedUsageList
          usages={certifiedCottonUsages}
          setUsages={setCertifiedCottonUsages}
          receives={certifiedCottonReceives}
          showToast={showToast}
          requestAdminAction={requestAdminAction}
          onViewTcTraceability={handleViewTraceability}
          isModalOpenExternal={openUsageModal}
          setIsModalOpenExternal={setOpenUsageModal}
          selectedStandardFilter={selectedStandard}
        />
      )}

      {activeTab === 'schedule' && (
        <AuditScheduleList
          audits={auditRecords}
          setAudits={setAuditRecords}
          showToast={showToast}
          requestAdminAction={requestAdminAction}
          isModalOpenExternal={openAuditModal}
          setIsModalOpenExternal={setOpenAuditModal}
          selectedStandardFilter={selectedStandard}
        />
      )}

      {activeTab === 'certificates' && (
        <CertificateList
          certificates={certificationRecords}
          setCertificates={setCertificationRecords}
          showToast={showToast}
          requestAdminAction={requestAdminAction}
          isModalOpenExternal={openCertModal}
          setIsModalOpenExternal={setOpenCertModal}
          selectedStandardFilter={selectedStandard}
        />
      )}

      {activeTab === 'reports' && (
        <AuditReportsHub
          receives={certifiedCottonReceives}
          usages={certifiedCottonUsages}
          audits={auditRecords}
          certificates={certificationRecords}
          onViewTcTraceability={handleViewTraceability}
        />
      )}

      {/* Global Traceability Modal */}
      {traceabilityTc && (
        <TcTraceabilityModal
          tcNumber={traceabilityTc}
          receives={certifiedCottonReceives}
          usages={certifiedCottonUsages}
          onClose={() => setTraceabilityTc(null)}
        />
      )}
    </div>
  );
};
