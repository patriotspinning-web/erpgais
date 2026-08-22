import React, { useState, useMemo } from 'react';
import {
  Award,
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
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { CertificationRecord, AuditStandard, ComplianceDocument } from '../../types';
import { AUDIT_STANDARDS_LIST, STANDARD_COLORS } from '../../data/auditSeedData';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';

interface CertificateListProps {
  certificates: CertificationRecord[];
  setCertificates: React.Dispatch<React.SetStateAction<CertificationRecord[]>>;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  requestAdminAction?: (title: string, action: () => void) => void;
  isModalOpenExternal?: boolean;
  setIsModalOpenExternal?: (open: boolean) => void;
  selectedStandardFilter?: string;
}

export const CertificateList: React.FC<CertificateListProps> = ({
  certificates,
  setCertificates,
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

  const [editingItem, setEditingItem] = useState<CertificationRecord | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<CertificationRecord, 'id'>>({
    standard: 'GRS',
    certificateNo: '',
    certifyingBody: 'Control Union Certifications B.V.',
    scope: '',
    issueDate: new Date().toISOString().split('T')[0],
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Valid',
    licenseNo: '',
    contactPerson: '',
    remarks: '',
    documents: [],
  });

  const [newDocName, setNewDocName] = useState('');

  const handleOpenModal = (item?: CertificationRecord) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        standard: item.standard,
        certificateNo: item.certificateNo,
        certifyingBody: item.certifyingBody,
        scope: item.scope,
        issueDate: item.issueDate,
        validFrom: item.validFrom,
        validUntil: item.validUntil,
        status: item.status,
        licenseNo: item.licenseNo || '',
        contactPerson: item.contactPerson || '',
        remarks: item.remarks || '',
        documents: item.documents || [],
      });
    } else {
      setEditingItem(null);
      const randNo = `CU-884912-${formData.standard}-${new Date().getFullYear()}-01`;
      setFormData({
        standard: 'GRS',
        certificateNo: randNo,
        certifyingBody: 'Control Union Certifications B.V.',
        scope: '100% Recycled Cotton and Recycled Blends Ring Spun Yarns',
        issueDate: new Date().toISOString().split('T')[0],
        validFrom: new Date().toISOString().split('T')[0],
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Valid',
        licenseNo: 'CU-884912',
        contactPerson: 'Compliance Head',
        remarks: 'Global Recycled Standard Version 4.0 Scope Certificate.',
        documents: [
          {
            id: `doc-${Date.now()}`,
            name: `${randNo}-Official-ScopeCert.pdf`,
            type: 'Scope Certificate',
            size: '1.8 MB',
            date: new Date().toISOString().split('T')[0],
          },
        ],
      });
    }
    setIsModalOpen(true);
  };

  const handleAddDoc = () => {
    if (!newDocName.trim()) return;
    const newDoc: ComplianceDocument = {
      id: `doc-${Date.now()}`,
      name: newDocName.trim(),
      type: 'Scope Certificate',
      size: '1.9 MB',
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
    if (!formData.certificateNo || !formData.certifyingBody || !formData.validUntil) {
      showToast('error', 'Missing Information', 'Please fill in Certificate Number, Body, and Valid Until date.');
      return;
    }

    if (editingItem) {
      setCertificates((prev) =>
        prev.map((item) => (item.id === editingItem.id ? { ...formData, id: item.id } : item))
      );
      showToast('success', 'Certificate Updated', `Certificate ${formData.certificateNo} updated.`);
    } else {
      const newItem: CertificationRecord = {
        ...formData,
        id: Date.now(),
      };
      setCertificates((prev) => [newItem, ...prev]);
      showToast('success', 'Certificate Added', `Scope Certificate ${formData.certificateNo} registered.`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (item: CertificationRecord) => {
    const doDelete = () => {
      setCertificates((prev) => prev.filter((c) => c.id !== item.id));
      showToast('info', 'Certificate Deleted', `Certificate ${item.certificateNo} removed.`);
    };

    if (requestAdminAction) {
      requestAdminAction(`Delete Scope Certificate (${item.certificateNo})`, doDelete);
    } else if (window.confirm(`Delete Scope Certificate ${item.certificateNo}?`)) {
      doDelete();
    }
  };

  // Filtered
  const filtered = useMemo(() => {
    return certificates.filter((c) => {
      const matchStd = standardFilter === 'All' || c.standard === standardFilter;
      const matchStatus = statusFilter === 'All' || c.status === statusFilter;
      const matchSearch =
        searchTerm === '' ||
        c.certificateNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.certifyingBody.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.scope.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.licenseNo && c.licenseNo.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchStd && matchStatus && matchSearch;
    });
  }, [certificates, standardFilter, statusFilter, searchTerm]);

  // Exports
  const handleExportExcel = () => {
    const data = filtered.map((c, i) => ({
      'SL': i + 1,
      'Standard': c.standard,
      'Certificate No': c.certificateNo,
      'Certifying Body': c.certifyingBody,
      'Scope / Products': c.scope,
      'License No': c.licenseNo || '',
      'Issue Date': c.issueDate,
      'Valid From': c.validFrom,
      'Valid Until': c.validUntil,
      'Status': c.status,
      'Contact Person': c.contactPerson || '',
      'Remarks': c.remarks || '',
    }));
    exportToExcel(data, `Scope_Certificates_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    const headers = ['Std', 'Certificate No', 'Certifying Body', 'License No', 'Valid From', 'Valid Until', 'Status'];
    const rows = filtered.map((c) => [
      c.standard,
      c.certificateNo,
      c.certifyingBody,
      c.licenseNo || 'N/A',
      c.validFrom,
      c.validUntil,
      c.status,
    ]);
    exportToPDF(
      'Factory Scope Certificates & Compliance License Register',
      headers,
      rows,
      `Scope_Certificates_Report_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Card */}
      <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              Scope Certificate & Compliance Document Management
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage factory scope certificates, validity periods, license numbers, and renewal alerts across GRS, GOTS, OCS, BCI, ISO, OEKO-TEX.
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
              + Add Scope Certificate
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Certificate No, Body, Scope, License..."
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
              <option value="All">All Statuses</option>
              <option value="Valid">Valid (Active)</option>
              <option value="Expiring Soon">Expiring Soon (Alert)</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3 bg-white dark:bg-slate-800 p-12 text-center rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-400 text-xs">
            No scope certificates found.
          </div>
        ) : (
          filtered.map((item) => {
            const color = STANDARD_COLORS[item.standard] || STANDARD_COLORS.Other;
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 space-y-4 hover:shadow-md transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top Standard badge & status */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${color.badge}`}>
                      {item.standard} Standard
                    </span>
                    <span
                      className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                        item.status === 'Valid'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                          : item.status === 'Expiring Soon'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 animate-pulse'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300'
                      }`}
                    >
                      {item.status === 'Valid' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {item.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white font-mono">
                      {item.certificateNo}
                    </h3>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{item.certifyingBody}</span>
                    </div>
                  </div>

                  {/* Scope details */}
                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/60 text-xs space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-slate-400">Certified Scope:</div>
                    <p className="text-slate-700 dark:text-slate-300 font-medium line-clamp-2">
                      {item.scope}
                    </p>
                    {item.licenseNo && (
                      <div className="text-[11px] text-slate-500 font-mono pt-1">
                        License No: <strong>{item.licenseNo}</strong>
                      </div>
                    )}
                  </div>

                  {/* Validity Info */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Valid Period:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {item.validFrom} to {item.validUntil}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Issue Date:</span>
                      <span className="font-mono">{item.issueDate}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Docs & Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{item.documents?.length || 0} Attached</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenModal(item)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                      title="Edit Certificate"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      title="Delete Certificate"
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

      {/* Add / Edit Certificate Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingItem ? 'Edit Scope Certificate' : 'Register New Scope Certificate'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Input scope certificate details, validity dates, license numbers, and attach certificate PDF.
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

                {/* Certificate No */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Scope Certificate Number *
                  </label>
                  <input
                    type="text"
                    value={formData.certificateNo}
                    onChange={(e) => setFormData({ ...formData, certificateNo: e.target.value })}
                    placeholder="e.g. CU-884912-GRS-2026-01"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Certifying Body */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Certifying Body *
                  </label>
                  <input
                    type="text"
                    value={formData.certifyingBody}
                    onChange={(e) => setFormData({ ...formData, certifyingBody: e.target.value })}
                    placeholder="e.g. Control Union Certifications B.V."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>

                {/* License No */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    License / Registration Number
                  </label>
                  <input
                    type="text"
                    value={formData.licenseNo}
                    onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
                    placeholder="e.g. CU-884912"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Valid From */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Valid From *
                  </label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>

                {/* Valid Until */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Valid Until / Expiry *
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Validity Status *
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  >
                    <option value="Valid">Valid (Active)</option>
                    <option value="Expiring Soon">Expiring Soon</option>
                    <option value="Expired">Expired</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Scope Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Certified Product Scope
                </label>
                <textarea
                  rows={2}
                  value={formData.scope}
                  onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
                  placeholder="e.g. 100% Recycled Cotton & Recycled Cotton Blended Ring & Rotor Spun Yarns..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Attach Official Scope Certificate PDF
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. GRS-Scope-Certificate-2026.pdf"
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
                  {editingItem ? 'Update Certificate' : 'Save Scope Certificate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
