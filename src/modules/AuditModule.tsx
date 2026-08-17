import React, { useState } from 'react';
import {
  ShieldCheck,
  Award,
  Calendar,
  AlertTriangle,
  Search,
  Plus,
  Filter,
  FileCheck,
  Edit3,
  Trash2,
  CheckCircle,
  Clock,
  Download,
  FileSpreadsheet,
  Building2,
  FileText,
  X,
  ExternalLink,
  Sparkles,
  RefreshCw,
  Printer,
} from 'lucide-react';
import { uploadFileToSupabaseStorage } from '../lib/supabase';
import { AuditItem, AuditStandard, AuditStatus } from '../types';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { triggerAppPrint } from '../utils/printUtils';

interface AuditModuleProps {
  auditItems: AuditItem[];
  setAuditItems: React.Dispatch<React.SetStateAction<AuditItem[]>>;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const AuditModule: React.FC<AuditModuleProps> = ({
  auditItems,
  setAuditItems,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStandard, setSelectedStandard] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<AuditItem | null>(null);
  const [viewCertificateModal, setViewCertificateModal] = useState<AuditItem | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<AuditItem, 'id'>>({
    standard: 'GOTS',
    certificateNo: '',
    certifyingBody: '',
    issueDate: '',
    expiryDate: '',
    status: 'Valid',
    auditDate: '',
    auditorName: '',
    scope: '',
    scoreGrade: '',
    documentRef: '',
    remarks: '',
  });

  const standardsList: AuditStandard[] = ['GOTS', 'OCS', 'ISO', 'BCI', 'OEKO-TEX', 'HIGG', 'Other'];
  const statusList: AuditStatus[] = ['Valid', 'Expiring Soon', 'Audit Scheduled', 'Pending Renewal', 'Expired'];

  // Handlers
  const handleOpenModal = (item?: AuditItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        standard: item.standard,
        certificateNo: item.certificateNo,
        certifyingBody: item.certifyingBody,
        issueDate: item.issueDate,
        expiryDate: item.expiryDate,
        status: item.status,
        auditDate: item.auditDate,
        auditorName: item.auditorName,
        scope: item.scope,
        scoreGrade: item.scoreGrade,
        documentRef: item.documentRef || '',
        remarks: item.remarks,
      });
    } else {
      setEditingItem(null);
      setFormData({
        standard: 'GOTS',
        certificateNo: `GOTS-PATRIOT-${Math.floor(1000 + Math.random() * 9000)}`,
        certifyingBody: 'Control Union Certifications',
        issueDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Valid',
        auditDate: new Date().toISOString().split('T')[0],
        auditorName: 'Lead ISO & GOTS Auditor',
        scope: '100% Organic & Sustainable Cotton Spinning Operations',
        scoreGrade: 'Grade A - Fully Compliant',
        documentRef: 'CERT-DOC-2026.pdf',
        remarks: 'Surveillance audit completed with zero non-conformities.',
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.certificateNo || !formData.certifyingBody) {
      showToast('error', 'Validation Error', 'Please enter Certificate Number and Certifying Body.');
      return;
    }

    if (editingItem) {
      setAuditItems((prev) =>
        prev.map((item) => (item.id === editingItem.id ? { ...formData, id: item.id } : item))
      );
      showToast('success', 'Audit Record Updated', `Certificate ${formData.certificateNo} updated successfully.`);
    } else {
      const newItem: AuditItem = {
        ...formData,
        id: Date.now(),
      };
      setAuditItems((prev) => [newItem, ...prev]);
      showToast('success', 'Audit Record Added', `New ${formData.standard} audit certificate registered.`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteItem = (id: number, certNo: string) => {
    if (confirm(`Are you sure you want to delete Audit Certificate #${certNo}?`)) {
      setAuditItems((prev) => prev.filter((item) => item.id !== id));
      showToast('info', 'Record Deleted', `Audit certificate #${certNo} removed.`);
    }
  };

  // Filters
  const filteredItems = auditItems.filter((item) => {
    const matchesSearch =
      item.certificateNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.certifyingBody.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.auditorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.scope.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.remarks.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStandard = selectedStandard === 'All' || item.standard === selectedStandard;
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;

    return matchesSearch && matchesStandard && matchesStatus;
  });

  // KPI Calculations
  const totalCertificates = auditItems.length;
  const validCount = auditItems.filter((i) => i.status === 'Valid').length;
  const expiringSoonCount = auditItems.filter((i) => i.status === 'Expiring Soon').length;
  const scheduledCount = auditItems.filter((i) => i.status === 'Audit Scheduled' || i.status === 'Pending Renewal').length;

  const handleExportPDF = () => {
    const headers = ['Standard', 'Cert No', 'Certifying Body', 'Expiry Date', 'Status', 'Auditor', 'Score'];
    const rows = filteredItems.map((item) => [
      item.standard,
      item.certificateNo,
      item.certifyingBody,
      item.expiryDate,
      item.status,
      item.auditorName,
      item.scoreGrade,
    ]);
    exportToPDF('Patriot Spinning Mills - Audit & Compliance Register', headers, rows, 'Audit_Compliance_Report', 'landscape');
    showToast('success', 'PDF Exported', 'Audit & Compliance report exported to PDF.');
  };

  const handleExportExcel = () => {
    const exportData = filteredItems.map((item) => ({
      Standard: item.standard,
      'Certificate No': item.certificateNo,
      'Certifying Body': item.certifyingBody,
      'Issue Date': item.issueDate,
      'Expiry Date': item.expiryDate,
      Status: item.status,
      'Audit Date': item.auditDate,
      Auditor: item.auditorName,
      Scope: item.scope,
      'Grade / Score': item.scoreGrade,
      Remarks: item.remarks,
    }));
    exportToExcel(exportData, 'Audit_Compliance_Register');
    showToast('success', 'Excel Exported', 'Audit register exported to Excel.');
  };

  const getStatusBadgeClass = (status: AuditStatus) => {
    switch (status) {
      case 'Valid':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300';
      case 'Expiring Soon':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300';
      case 'Audit Scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300';
      case 'Pending Renewal':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300';
      case 'Expired':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300';
    }
  };

  const getStandardBadgeClass = (standard: AuditStandard) => {
    switch (standard) {
      case 'GOTS':
        return 'bg-emerald-600 text-white';
      case 'OCS':
        return 'bg-teal-600 text-white';
      case 'ISO':
        return 'bg-indigo-600 text-white';
      case 'BCI':
        return 'bg-amber-600 text-white';
      case 'OEKO-TEX':
        return 'bg-sky-600 text-white';
      case 'HIGG':
        return 'bg-purple-600 text-white';
      default:
        return 'bg-slate-600 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Standard Badges */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Audit & Compliance Management
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300">
                  Certified Mill
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Global Standards Management: GOTS, OCS, ISO 9001/14001, BCI, OEKO-TEX & Factory Audits
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => triggerAppPrint()}
              className="no-print px-3.5 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
              title="Print Audit & Compliance Register"
            >
              <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Print
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition"
            >
              <Plus className="w-4 h-4" /> Add Audit Certificate
            </button>
            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
            >
              <Download className="w-4 h-4" /> PDF Report
            </button>
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
            >
              <FileSpreadsheet className="w-4 h-4" /> Export Excel
            </button>
          </div>
        </div>

        {/* Global Standards Quick Pills */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-2">
            <Award className="w-3.5 h-3.5 text-emerald-500" /> Key Standards:
          </span>
          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
            🌱 GOTS (Organic)
          </span>
          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1">
            🌿 OCS 100 & Blended
          </span>
          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
            ⚙️ ISO 9001 / 14001 / 45001
          </span>
          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
            🧶 BCI Better Cotton
          </span>
          <span className="px-3 py-1 rounded-lg text-xs font-bold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 flex items-center gap-1">
            🛡️ OEKO-TEX Class 1
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Certifications</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalCertificates}</h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">100% Tracked & Audited</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Valid Certificates</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{validCount}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Active Compliance</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Expiring Soon (&lt;60d)</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{expiringSoonCount}</h3>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-1">Renewal Priority</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Scheduled Audits</p>
            <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{scheduledCount}</h3>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">Surveillance Inspections</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search certificate, body, auditor, scope..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Standard Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>
          {['All', ...standardsList].map((std) => (
            <button
              key={std}
              onClick={() => setSelectedStandard(std)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedStandard === std
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {std}
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <div className="w-full md:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full md:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">All Statuses</option>
            {statusList.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Main Certificates Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Standard & Cert No</th>
                <th className="py-3.5 px-4">Certifying Body</th>
                <th className="py-3.5 px-4">Validity Dates</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Auditor & Score</th>
                <th className="py-3.5 px-4">Audit Scope</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs text-slate-800 dark:text-slate-200 font-medium">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 dark:text-slate-500">
                    <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No audit certificate records found matching search filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition">
                    
                    {/* Standard & Cert No */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${getStandardBadgeClass(item.standard)}`}>
                          {item.standard}
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {item.certificateNo}
                        </span>
                      </div>
                    </td>

                    {/* Certifying Body */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {item.certifyingBody}
                      </div>
                    </td>

                    {/* Validity Dates */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="text-slate-600 dark:text-slate-400">Issued: {item.issueDate}</div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">Expires: {item.expiryDate}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${getStatusBadgeClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Auditor & Score */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{item.scoreGrade}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{item.auditorName}</div>
                    </td>

                    {/* Scope */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="line-clamp-2 text-[11px] text-slate-600 dark:text-slate-300" title={item.scope}>
                        {item.scope}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewCertificateModal(item)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 rounded-lg transition"
                          title="View Certificate Details Card"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition"
                          title="Edit Audit Record"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.certificateNo)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-lg transition"
                          title="Delete Certificate Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW CERTIFICATE DETAILS MODAL CARD */}
      {viewCertificateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setViewCertificateModal(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-300 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow">
                <Award className="w-8 h-8" />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${getStandardBadgeClass(viewCertificateModal.standard)}`}>
                {viewCertificateModal.standard} CERTIFICATE
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-white mt-2">
                {viewCertificateModal.certificateNo}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Issued by {viewCertificateModal.certifyingBody}
              </p>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 font-bold">Certification Status:</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getStatusBadgeClass(viewCertificateModal.status)}`}>
                  {viewCertificateModal.status}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 font-bold">Issue Date:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{viewCertificateModal.issueDate}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 font-bold">Expiration Date:</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{viewCertificateModal.expiryDate}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 font-bold">Last Audit Date:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{viewCertificateModal.auditDate}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 font-bold">Auditor Name:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{viewCertificateModal.auditorName}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                <span className="text-slate-500 font-bold">Grade / Result:</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">{viewCertificateModal.scoreGrade}</span>
              </div>
              <div>
                <span className="text-slate-500 font-bold block mb-1">Audit Scope:</span>
                <p className="bg-slate-50 dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 leading-relaxed">
                  {viewCertificateModal.scope}
                </p>
              </div>
              {viewCertificateModal.remarks && (
                <div>
                  <span className="text-slate-500 font-bold block mb-1">Auditor Remarks:</span>
                  <p className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 rounded-xl border border-amber-200 dark:border-amber-800">
                    {viewCertificateModal.remarks}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setViewCertificateModal(null)}
                className="px-4 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition"
              >
                Close Certificate View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE / EDIT MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-6 relative my-8">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {editingItem ? 'Edit Audit Certificate Record' : 'Register New Audit Certificate'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fill in standard certification & compliance audit details for Patriot Spinning Mills
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveItem} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Standard <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.standard}
                    onChange={(e) => setFormData({ ...formData, standard: e.target.value as AuditStandard })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    {standardsList.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Certificate Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.certificateNo}
                    onChange={(e) => setFormData({ ...formData, certificateNo: e.target.value })}
                    placeholder="e.g. GOTS-CU-884912"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Certifying Body <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.certifyingBody}
                    onChange={(e) => setFormData({ ...formData, certifyingBody: e.target.value })}
                    placeholder="e.g. Control Union, SGS, TÜV SÜD"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Compliance Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as AuditStatus })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    {statusList.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Issue Date
                  </label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Audit Date
                  </label>
                  <input
                    type="date"
                    value={formData.auditDate}
                    onChange={(e) => setFormData({ ...formData, auditDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Auditor Name / Team
                  </label>
                  <input
                    type="text"
                    value={formData.auditorName}
                    onChange={(e) => setFormData({ ...formData, auditorName: e.target.value })}
                    placeholder="e.g. Lead Auditor A. Rahman"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Score / Result Grade
                  </label>
                  <input
                    type="text"
                    value={formData.scoreGrade}
                    onChange={(e) => setFormData({ ...formData, scoreGrade: e.target.value })}
                    placeholder="e.g. Grade A - 100% Compliant"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Document Ref / Upload to Supabase Storage
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.documentRef}
                      onChange={(e) => setFormData({ ...formData, documentRef: e.target.value })}
                      placeholder="e.g. GOTS_CERT_2026.pdf"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                    <label className="cursor-pointer px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center shrink-0 shadow">
                      Upload
                      <input
                        type="file"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            showToast('info', 'Uploading File', `Uploading ${file.name} to Supabase storage...`);
                            const url = await uploadFileToSupabaseStorage(file, 'certificates');
                            if (url) {
                              setFormData((prev) => ({ ...prev, documentRef: url }));
                              showToast('success', 'Upload Complete', 'File uploaded to Supabase Storage!');
                            } else {
                              setFormData((prev) => ({ ...prev, documentRef: file.name }));
                              showToast('info', 'File Referenced', `${file.name} attached.`);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Scope of Certification
                </label>
                <textarea
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                  rows={2}
                  placeholder="e.g. Processing of Organic Cotton Yarn (Carded & Combed) - 100% Organic"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Audit Remarks & Observations
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={2}
                  placeholder="Enter audit observations, findings, or next action items"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition"
                >
                  {editingItem ? 'Save Changes' : 'Register Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
