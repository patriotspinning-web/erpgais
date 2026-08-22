import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  Plus,
  Filter,
  FileSpreadsheet,
  Download,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Edit3,
  Trash2,
  FileText,
  Paperclip,
  Upload,
  X,
  Building2,
  UserCheck,
  AlertCircle,
} from 'lucide-react';
import { AuditRecord, AuditStandard, ComplianceDocument } from '../../types';
import { AUDIT_STANDARDS_LIST, STANDARD_COLORS } from '../../data/auditSeedData';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

interface AuditScheduleListProps {
  audits: AuditRecord[];
  setAudits: React.Dispatch<React.SetStateAction<AuditRecord[]>>;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  requestAdminAction?: (title: string, action: () => void) => void;
  isModalOpenExternal?: boolean;
  setIsModalOpenExternal?: (open: boolean) => void;
  selectedStandardFilter?: string;
}

export const AuditScheduleList: React.FC<AuditScheduleListProps> = ({
  audits,
  setAudits,
  showToast,
  requestAdminAction,
  isModalOpenExternal = false,
  setIsModalOpenExternal,
  selectedStandardFilter = 'All',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [standardFilter, setStandardFilter] = useState<string>(selectedStandardFilter);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isModalOpenInternal, setIsModalOpenInternal] = useState(false);
  const isModalOpen = isModalOpenExternal || isModalOpenInternal;

  const setIsModalOpen = (val: boolean) => {
    setIsModalOpenInternal(val);
    if (setIsModalOpenExternal) setIsModalOpenExternal(val);
  };

  const [editingItem, setEditingItem] = useState<AuditRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<AuditRecord, 'id'>>({
    standard: 'GOTS',
    auditType: 'Annual Surveillance',
    certifyingBody: 'Control Union Certifications',
    auditorName: '',
    auditDate: new Date().toISOString().split('T')[0],
    auditPeriod: `${new Date().getFullYear()}-${new Date().getFullYear() + 1} Cycle`,
    status: 'Upcoming',
    findings: '',
    nonConformity: '',
    ncLevel: 'None',
    correctiveAction: '',
    capaStatus: 'N/A',
    nextAuditDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    scoreGrade: 'Grade A',
    remarks: '',
    documents: [],
  });

  const [newDocName, setNewDocName] = useState('');

  const handleOpenModal = (item?: AuditRecord) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        standard: item.standard,
        auditType: item.auditType,
        certifyingBody: item.certifyingBody,
        auditorName: item.auditorName,
        auditDate: item.auditDate,
        auditPeriod: item.auditPeriod,
        status: item.status,
        findings: item.findings,
        nonConformity: item.nonConformity || '',
        ncLevel: item.ncLevel || 'None',
        correctiveAction: item.correctiveAction || '',
        capaStatus: item.capaStatus || 'N/A',
        nextAuditDueDate: item.nextAuditDueDate || '',
        scoreGrade: item.scoreGrade || '',
        remarks: item.remarks || '',
        documents: item.documents || [],
      });
    } else {
      setEditingItem(null);
      setFormData({
        standard: 'GOTS',
        auditType: 'Annual Surveillance',
        certifyingBody: 'Control Union Certifications',
        auditorName: 'Lead Auditor Team',
        auditDate: new Date().toISOString().split('T')[0],
        auditPeriod: `${new Date().getFullYear()} Cycle`,
        status: 'Upcoming',
        findings: 'Annual compliance review of TC records, mass balance, wastewater, and health & safety.',
        nonConformity: '',
        ncLevel: 'None',
        correctiveAction: '',
        capaStatus: 'N/A',
        nextAuditDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        scoreGrade: 'Grade A - Compliant',
        remarks: 'Pre-audit documentation ready.',
        documents: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleAddDoc = () => {
    if (!newDocName.trim()) return;
    const newDoc: ComplianceDocument = {
      id: `doc-${Date.now()}`,
      name: newDocName.trim(),
      type: 'Audit Report',
      size: '2.4 MB',
      date: new Date().toISOString().split('T')[0],
    };
    setFormData((prev) => ({
      ...prev,
      documents: [...(prev.documents || []), newDoc],
    }));
    setNewDocName('');
  };

  const handleRemoveDoc = (docId: string) => {
    setFormData((prev) => ({
      ...prev,
      documents: (prev.documents || []).filter((d) => d.id !== docId),
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.certifyingBody || !formData.auditDate) {
      showToast('error', 'Missing Information', 'Please fill in Certifying Body and Audit Date.');
      return;
    }

    if (editingItem) {
      setAudits((prev) =>
        prev.map((item) => (item.id === editingItem.id ? { ...formData, id: item.id } : item))
      );
      showToast('success', 'Audit Record Updated', `${formData.standard} ${formData.auditType} updated.`);
    } else {
      const newItem: AuditRecord = {
        ...formData,
        id: Date.now(),
      };
      setAudits((prev) => [newItem, ...prev]);
      showToast('success', 'Audit Scheduled / Recorded', `${formData.standard} audit on ${formData.auditDate} registered.`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (item: AuditRecord) => {
    const doDelete = () => {
      setAudits((prev) => prev.filter((a) => a.id !== item.id));
      showToast('info', 'Audit Record Deleted', `${item.standard} audit record removed.`);
    };

    if (requestAdminAction) {
      requestAdminAction(`Delete Audit Record (${item.standard} - ${item.auditType})`, doDelete);
    } else if (window.confirm(`Delete ${item.standard} audit record on ${item.auditDate}?`)) {
      doDelete();
    }
  };

  // Filtered audits
  const filtered = useMemo(() => {
    return audits.filter((a) => {
      const matchStd = standardFilter === 'All' || a.standard === standardFilter;
      const matchStatus = statusFilter === 'All' || a.status === statusFilter;
      const matchSearch =
        searchTerm === '' ||
        a.certifyingBody.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.auditorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.findings.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.auditType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.nonConformity && a.nonConformity.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchStd && matchStatus && matchSearch;
    });
  }, [audits, standardFilter, statusFilter, searchTerm]);

  // Exports
  const handleExportExcel = () => {
    const data = filtered.map((a, i) => ({
      'SL': i + 1,
      'Standard': a.standard,
      'Audit Type': a.auditType,
      'Certifying Body': a.certifyingBody,
      'Auditor Name': a.auditorName,
      'Audit Date': a.auditDate,
      'Audit Period': a.auditPeriod,
      'Status': a.status,
      'Score / Grade': a.scoreGrade || '',
      'Findings': a.findings,
      'NC Level': a.ncLevel || 'None',
      'Non-Conformity (NC)': a.nonConformity || 'None',
      'Corrective Action (CAPA)': a.correctiveAction || 'N/A',
      'CAPA Status': a.capaStatus || 'N/A',
      'Next Audit Due': a.nextAuditDueDate || '',
      'Remarks': a.remarks || '',
    }));
    exportToExcel(data, `Audit_Compliance_Schedule_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    const headers = ['Std', 'Audit Type', 'Certifying Body', 'Date', 'Status', 'Score', 'NC Level', 'CAPA Status', 'Next Due'];
    const rows = filtered.map((a) => [
      a.standard,
      a.auditType,
      a.certifyingBody,
      a.auditDate,
      a.status,
      a.scoreGrade || 'Pass',
      a.ncLevel || 'None',
      a.capaStatus || 'N/A',
      a.nextAuditDueDate || '',
    ]);
    exportToPDF(
      'Factory Audit Schedule, Findings & CAPA Resolution Report',
      headers,
      rows,
      `Audit_Schedule_Report_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Card */}
      <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              Audit Management, Schedule & CAPA Resolution System
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage surveillance audits, third-party certification bodies, non-conformities (NC), and corrective actions (CAPA).
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
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              + Schedule / Record Audit
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Body, Auditor, NC, Findings..."
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
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="All">All Audit Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Under Review">Under Review</option>
              <option value="Corrective Action Pending">Corrective Action Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audits Cards / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 bg-white dark:bg-slate-800 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
            No audit records match the selected criteria.
          </div>
        ) : (
          filtered.map((item) => {
            const color = STANDARD_COLORS[item.standard] || STANDARD_COLORS.Other;
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-4 hover:shadow-md transition relative overflow-hidden"
              >
                {/* Top Bar */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${color.badge}`}>
                      {item.standard}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.auditType}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                        item.status === 'Completed'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                          : item.status === 'Upcoming'
                          ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300'
                          : item.status === 'Under Review'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Body details */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Certifying Body:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                      {item.certifyingBody}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Auditor(s):</span>
                    <span className="text-slate-700 dark:text-slate-300">{item.auditorName || 'Assigned Lead Auditor'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Audit Date & Cycle:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {item.auditDate} ({item.auditPeriod})
                    </span>
                  </div>

                  {item.nextAuditDueDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Next Audit Due:</span>
                      <span className="font-mono text-emerald-600 font-bold">{item.nextAuditDueDate}</span>
                    </div>
                  )}

                  {item.scoreGrade && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Score / Grade:</span>
                      <span className="font-bold text-slate-900 dark:text-white px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md">
                        {item.scoreGrade}
                      </span>
                    </div>
                  )}
                </div>

                {/* Findings & CAPA Block */}
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-2 text-xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Key Audit Findings:</div>
                    <div className="text-slate-700 dark:text-slate-300 mt-0.5">{item.findings}</div>
                  </div>

                  {item.nonConformity && item.nonConformity !== 'None' && (
                    <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700">
                      <div className="text-[10px] uppercase font-bold text-rose-600 flex items-center justify-between">
                        <span>Non-Conformity ({item.ncLevel || 'Minor'}):</span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                            item.capaStatus === 'Verified & Closed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          CAPA: {item.capaStatus}
                        </span>
                      </div>
                      <div className="text-rose-700 dark:text-rose-300 mt-0.5">{item.nonConformity}</div>
                      {item.correctiveAction && (
                        <div className="mt-1 text-[11px] text-slate-600 dark:text-slate-400">
                          <strong className="text-slate-700 dark:text-slate-300">Action Taken:</strong> {item.correctiveAction}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Documents & Actions Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{item.documents?.length || 0} Reports & Proofs</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                      title="Edit Audit Details & CAPA"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      title="Delete Audit"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Audit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingItem ? 'Edit Audit & CAPA Record' : 'Schedule New Audit / Record Findings'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Input third-party audit details, findings, non-conformities (NC), and corrective actions (CAPA).
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Standard */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Standard / Certification *
                  </label>
                  <select
                    value={formData.standard}
                    onChange={(e) => setFormData({ ...formData, standard: e.target.value as AuditStandard })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  >
                    {AUDIT_STANDARDS_LIST.map((std) => (
                      <option key={std} value={std}>
                        {std}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Audit Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Audit Type *
                  </label>
                  <select
                    value={formData.auditType}
                    onChange={(e) => setFormData({ ...formData, auditType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  >
                    <option value="Annual Surveillance">Annual Surveillance</option>
                    <option value="Initial Certification">Initial Certification</option>
                    <option value="Renewal Audit">Renewal Audit</option>
                    <option value="Buyer / Customer Audit">Buyer / Customer Audit</option>
                    <option value="Environmental / Higg">Environmental / Higg FEM</option>
                    <option value="Unannounced / Surprise">Unannounced / Surprise Audit</option>
                    <option value="Internal Audit">Internal Audit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Certifying Body */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Certifying Body / Inspection Agency *
                  </label>
                  <input
                    type="text"
                    value={formData.certifyingBody}
                    onChange={(e) => setFormData({ ...formData, certifyingBody: e.target.value })}
                    placeholder="e.g. Control Union, IDFL, TÜV NORD, SGS, Hohenstein"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>

                {/* Auditor Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Lead Auditor(s) Name
                  </label>
                  <input
                    type="text"
                    value={formData.auditorName}
                    onChange={(e) => setFormData({ ...formData, auditorName: e.target.value })}
                    placeholder="e.g. Engr. Farhan Kabir & Lead Assessor"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Audit Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Audit Date *
                  </label>
                  <input
                    type="date"
                    value={formData.auditDate}
                    onChange={(e) => setFormData({ ...formData, auditDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>

                {/* Next Due Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Next Audit Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.nextAuditDueDate}
                    onChange={(e) => setFormData({ ...formData, nextAuditDueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Audit Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Audit Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Completed">Completed</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Corrective Action Pending">Corrective Action Pending</option>
                  </select>
                </div>
              </div>

              {/* Findings */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Audit Findings & Observations
                </label>
                <textarea
                  rows={2}
                  value={formData.findings}
                  onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
                  placeholder="Summary of auditor observations, mass balance match, and compliance rating..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              {/* NC & CAPA Section */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Non-Conformity (NC) & Corrective Action (CAPA) Resolution
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* NC Level */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      NC Severity Level
                    </label>
                    <select
                      value={formData.ncLevel}
                      onChange={(e) => setFormData({ ...formData, ncLevel: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                    >
                      <option value="None">None (Zero NC)</option>
                      <option value="Observation">Observation / Suggestion</option>
                      <option value="Minor">Minor NC</option>
                      <option value="Major">Major NC</option>
                      <option value="Critical">Critical NC</option>
                    </select>
                  </div>

                  {/* CAPA Status */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      CAPA Resolution Status
                    </label>
                    <select
                      value={formData.capaStatus}
                      onChange={(e) => setFormData({ ...formData, capaStatus: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none"
                    >
                      <option value="N/A">N/A (No CAPA required)</option>
                      <option value="Pending">Pending Resolution</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Verified & Closed">Verified & Closed (Auditor Approved)</option>
                    </select>
                  </div>
                </div>

                {/* NC details */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Non-Conformity Description (If any)
                  </label>
                  <input
                    type="text"
                    value={formData.nonConformity}
                    onChange={(e) => setFormData({ ...formData, nonConformity: e.target.value })}
                    placeholder="e.g. Minor NC: Chemical secondary containment labeling..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                  />
                </div>

                {/* Corrective action */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Corrective & Preventive Action (CAPA) Plan / Implementation
                  </label>
                  <textarea
                    rows={2}
                    value={formData.correctiveAction}
                    onChange={(e) => setFormData({ ...formData, correctiveAction: e.target.value })}
                    placeholder="Action taken to eliminate root cause and prevent recurrence..."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none resize-none"
                  />
                </div>
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Attach Official Audit Report / Evidence File
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. ControlUnion-Audit-Report-2026.pdf"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddDoc}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Attach
                  </button>
                </div>

                {formData.documents && formData.documents.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {formData.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 text-xs border border-slate-200 dark:border-slate-700"
                      >
                        <span className="font-bold text-slate-800 dark:text-slate-200">{doc.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="text-rose-500 hover:text-rose-700"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition"
                >
                  {editingItem ? 'Update Audit' : 'Save Audit Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
