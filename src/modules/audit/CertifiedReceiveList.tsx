import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Plus,
  Filter,
  FileText,
  Edit3,
  Trash2,
  Calendar,
  Building2,
  Globe,
  Tag,
  Paperclip,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Upload,
  X,
} from 'lucide-react';
import { CertifiedCottonReceive, AuditStandard, ComplianceDocument } from '../../types';
import { AUDIT_STANDARDS_LIST, STANDARD_COLORS } from '../../data/auditSeedData';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { DEFAULT_COTTON_COUNTRIES } from '../../data/seedData';

interface CertifiedReceiveListProps {
  receives: CertifiedCottonReceive[];
  setReceives: React.Dispatch<React.SetStateAction<CertifiedCottonReceive[]>>;
  onViewTcTraceability: (tcNumber: string) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  requestAdminAction?: (title: string, action: () => void) => void;
  isModalOpenExternal?: boolean;
  setIsModalOpenExternal?: (open: boolean) => void;
  selectedStandardFilter?: string;
}

export const CertifiedReceiveList: React.FC<CertifiedReceiveListProps> = ({
  receives,
  setReceives,
  onViewTcTraceability,
  showToast,
  requestAdminAction,
  isModalOpenExternal = false,
  setIsModalOpenExternal,
  selectedStandardFilter = 'All',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [standardFilter, setStandardFilter] = useState<string>(selectedStandardFilter);
  const [originFilter, setOriginFilter] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isModalOpenInternal, setIsModalOpenInternal] = useState(false);
  const isModalOpen = isModalOpenExternal || isModalOpenInternal;

  const setIsModalOpen = (val: boolean) => {
    setIsModalOpenInternal(val);
    if (setIsModalOpenExternal) setIsModalOpenExternal(val);
  };

  const [editingItem, setEditingItem] = useState<CertifiedCottonReceive | null>(null);

  // Form State
  const [formData, setFormData] = useState<Omit<CertifiedCottonReceive, 'id'>>({
    standard: 'GRS',
    supplierName: '',
    countryOfOrigin: 'Brazil',
    cottonDescription: '',
    lotNo: '',
    baleCount: 100,
    quantityKg: 22680,
    receiveDate: new Date().toISOString().split('T')[0],
    purchaseRef: '',
    tcNumber: '',
    tcQuantityKg: 22680,
    tcIssueDate: new Date().toISOString().split('T')[0],
    tcValidityDate: '',
    invoiceChallanNo: '',
    remarks: '',
    documents: [],
  });

  // Document upload form helper
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState<any>('Transaction Certificate (TC)');

  const handleOpenModal = (item?: CertifiedCottonReceive) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        standard: item.standard,
        supplierName: item.supplierName,
        countryOfOrigin: item.countryOfOrigin,
        cottonDescription: item.cottonDescription,
        lotNo: item.lotNo,
        baleCount: item.baleCount,
        quantityKg: item.quantityKg,
        receiveDate: item.receiveDate,
        purchaseRef: item.purchaseRef,
        tcNumber: item.tcNumber,
        tcQuantityKg: item.tcQuantityKg,
        tcIssueDate: item.tcIssueDate,
        tcValidityDate: item.tcValidityDate || '',
        invoiceChallanNo: item.invoiceChallanNo,
        remarks: item.remarks,
        documents: item.documents || [],
      });
    } else {
      setEditingItem(null);
      const randomTc = `TC-${formData.standard}-CU-${Math.floor(10000 + Math.random() * 90000)}`;
      setFormData({
        standard: 'GRS',
        supplierName: '',
        countryOfOrigin: 'Brazil',
        cottonDescription: '100% Certified Raw Cotton Lint',
        lotNo: `LOT-${formData.standard}-${new Date().getFullYear()}-${Math.floor(10 + Math.random() * 90)}`,
        baleCount: 100,
        quantityKg: 22680,
        receiveDate: new Date().toISOString().split('T')[0],
        purchaseRef: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)} / LC-${Math.floor(10000 + Math.random() * 90000)}`,
        tcNumber: randomTc,
        tcQuantityKg: 22680,
        tcIssueDate: new Date().toISOString().split('T')[0],
        tcValidityDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        invoiceChallanNo: `INV-${Math.floor(1000 + Math.random() * 9000)} / CH-${Math.floor(100 + Math.random() * 900)}`,
        remarks: 'Received in clean condition with valid supplier TC.',
        documents: [
          {
            id: `doc-${Date.now()}`,
            name: `${randomTc}-Official.pdf`,
            type: 'Transaction Certificate (TC)',
            size: '1.4 MB',
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
      type: newDocType,
      size: `${(Math.random() * 1.5 + 0.5).toFixed(1)} MB`,
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
    if (!formData.supplierName || !formData.tcNumber || !formData.lotNo || !formData.quantityKg) {
      showToast('error', 'Required Fields Missing', 'Please fill in Standard, Supplier, TC Number, Lot, and Quantity.');
      return;
    }

    if (editingItem) {
      setReceives((prev) =>
        prev.map((item) => (item.id === editingItem.id ? { ...formData, id: item.id } : item))
      );
      showToast('success', 'TC Receive Updated', `TC ${formData.tcNumber} updated successfully.`);
    } else {
      const newItem: CertifiedCottonReceive = {
        ...formData,
        id: Date.now(),
      };
      setReceives((prev) => [newItem, ...prev]);
      showToast('success', 'Certified Cotton Received', `TC ${formData.tcNumber} recorded with ${formData.quantityKg.toLocaleString()} KG.`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (item: CertifiedCottonReceive) => {
    const doDelete = () => {
      setReceives((prev) => prev.filter((r) => r.id !== item.id));
      showToast('info', 'Receive Deleted', `TC ${item.tcNumber} removed.`);
    };

    if (requestAdminAction) {
      requestAdminAction(`Delete Certified Cotton Receive (TC: ${item.tcNumber})`, doDelete);
    } else if (window.confirm(`Delete TC ${item.tcNumber} permanently?`)) {
      doDelete();
    }
  };

  // Filtered List
  const filtered = useMemo(() => {
    return receives.filter((r) => {
      const matchStd = standardFilter === 'All' || r.standard === standardFilter;
      const matchOrigin = originFilter === 'All' || r.countryOfOrigin === originFilter;
      const matchSearch =
        searchTerm === '' ||
        r.tcNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.lotNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.cottonDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.invoiceChallanNo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDate =
        (!startDate || r.receiveDate >= startDate) &&
        (!endDate || r.receiveDate <= endDate);

      return matchStd && matchOrigin && matchSearch && matchDate;
    });
  }, [receives, standardFilter, originFilter, searchTerm, startDate, endDate]);

  // Totals for filtered
  const totalQtyKg = filtered.reduce((sum, r) => sum + r.quantityKg, 0);
  const totalBales = filtered.reduce((sum, r) => sum + r.baleCount, 0);

  // Export handlers
  const handleExportExcel = () => {
    const data = filtered.map((r, i) => ({
      'SL': i + 1,
      'Standard': r.standard,
      'TC Number': r.tcNumber,
      'Receive Date': r.receiveDate,
      'Supplier / Party': r.supplierName,
      'Country of Origin': r.countryOfOrigin,
      'Lot Number': r.lotNo,
      'Bale Count': r.baleCount,
      'Quantity (KG)': r.quantityKg,
      'TC Qty (KG)': r.tcQuantityKg,
      'TC Issue Date': r.tcIssueDate,
      'TC Validity': r.tcValidityDate || 'N/A',
      'Invoice / Challan': r.invoiceChallanNo,
      'Purchase Reference': r.purchaseRef,
      'Remarks': r.remarks,
    }));
    exportToExcel(data, `Certified_Cotton_Receives_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportPDF = () => {
    const headers = ['Std', 'TC Number', 'Date', 'Supplier', 'Origin', 'Lot', 'Bales', 'Qty (KG)', 'Challan'];
    const rows = filtered.map((r) => [
      r.standard,
      r.tcNumber,
      r.receiveDate,
      r.supplierName,
      r.countryOfOrigin,
      r.lotNo,
      r.baleCount,
      r.quantityKg.toLocaleString(),
      r.invoiceChallanNo,
    ]);
    exportToPDF(
      'Certified Raw Cotton / TC Receive Statement',
      headers,
      rows,
      `Certified_Cotton_Receives_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Controls & Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              Certified Raw Cotton / TC Receive Management
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Record certified cotton receipts, Transaction Certificate (TC) details, and supporting documents.
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
              + Receive Certified Cotton
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search TC No, Supplier, Lot, Challan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Standard Filter */}
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

          {/* Country of Origin Filter */}
          <div>
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="All">All Origins</option>
              {DEFAULT_COTTON_COUNTRIES.map((cnt) => (
                <option key={cnt} value={cnt}>
                  {cnt}
                </option>
              ))}
            </select>
          </div>

          {/* Date range quick filter */}
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-1/2 px-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] focus:ring-2 focus:ring-emerald-500 outline-none"
              title="From Date"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-1/2 px-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] focus:ring-2 focus:ring-emerald-500 outline-none"
              title="To Date"
            />
          </div>
        </div>

        {/* Summary Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-slate-800 dark:text-slate-200">{filtered.length}</strong> of {receives.length} receipts
            </span>
            <span>•</span>
            <span>
              Total Bales: <strong className="text-slate-800 dark:text-slate-200 font-mono">{totalBales.toLocaleString()}</strong>
            </span>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-xl font-bold font-mono border border-emerald-200 dark:border-emerald-800/40">
            Total Received: {totalQtyKg.toLocaleString()} KG ({(totalQtyKg / 1000).toFixed(1)} MT)
          </div>
        </div>
      </div>

      {/* Receives Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Standard</th>
                <th className="px-4 py-3">TC Number & Date</th>
                <th className="px-4 py-3">Supplier & Origin</th>
                <th className="px-4 py-3">Lot & Bales</th>
                <th className="px-4 py-3 text-right">Receive Qty (KG)</th>
                <th className="px-4 py-3">Challan / Ref</th>
                <th className="px-4 py-3">TC Validity</th>
                <th className="px-4 py-3 text-center">Docs</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    No certified cotton receives match the filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const color = STANDARD_COLORS[item.standard] || STANDARD_COLORS.Other;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${color.badge}`}>
                          {item.standard}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div
                          onClick={() => onViewTcTraceability(item.tcNumber)}
                          className="font-bold text-slate-900 dark:text-white font-mono cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1"
                        >
                          {item.tcNumber}
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          Rec: {item.receiveDate} (TC: {item.tcIssueDate})
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{item.supplierName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Globe className="w-3 h-3 text-sky-500" />
                          {item.countryOfOrigin}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">{item.lotNo}</div>
                        <div className="text-[11px] text-slate-500">{item.baleCount} Bales</div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="font-black text-slate-900 dark:text-white font-mono text-sm">
                          {item.quantityKg.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {((item.quantityKg / 1000) || 0).toFixed(1)} MT
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                          {item.invoiceChallanNo}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[130px]">{item.purchaseRef}</div>
                      </td>

                      <td className="px-4 py-3">
                        {item.tcValidityDate ? (
                          <span className="text-[11px] text-slate-600 dark:text-slate-300 font-mono">
                            {item.tcValidityDate}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">N/A</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {item.documents && item.documents.length > 0 ? (
                          <button
                            onClick={() => onViewTcTraceability(item.tcNumber)}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 rounded-lg text-[10px] font-bold border border-sky-200 dark:border-sky-800/40 hover:bg-sky-100"
                            title={item.documents.map((d) => d.name).join(', ')}
                          >
                            <Paperclip className="w-3 h-3" />
                            {item.documents.length} Docs
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[10px]">None</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onViewTcTraceability(item.tcNumber)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                            title="View Full TC Traceability Matrix"
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

      {/* Add / Edit Certified Cotton Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingItem ? 'Edit Certified Cotton Receive Entry' : 'Receive Certified Raw Cotton (TC Entry)'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Input standard, Transaction Certificate (TC) number, quantity, lot, and attach certificates.
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Standard */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Certification / Standard *
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

                {/* TC Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Transaction Certificate (TC) No *
                  </label>
                  <input
                    type="text"
                    value={formData.tcNumber}
                    onChange={(e) => setFormData({ ...formData, tcNumber: e.target.value })}
                    placeholder="e.g. TC-GRS-CU-884912"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>

                {/* Receive Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Receive Date *
                  </label>
                  <input
                    type="date"
                    value={formData.receiveDate}
                    onChange={(e) => setFormData({ ...formData, receiveDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Supplier Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Supplier / Party Name *
                  </label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
                    placeholder="e.g. bioRe Organic Cotton Ltd"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>

                {/* Country of Origin */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Country of Origin *
                  </label>
                  <select
                    value={formData.countryOfOrigin}
                    onChange={(e) => setFormData({ ...formData, countryOfOrigin: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  >
                    {DEFAULT_COTTON_COUNTRIES.map((cnt) => (
                      <option key={cnt} value={cnt}>
                        {cnt}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lot Number */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cotton Lot Number *
                  </label>
                  <input
                    type="text"
                    value={formData.lotNo}
                    onChange={(e) => setFormData({ ...formData, lotNo: e.target.value })}
                    placeholder="e.g. LOT-GOTS-ORG-01"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Total Quantity (KG) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Quantity (KG) *
                  </label>
                  <input
                    type="number"
                    value={formData.quantityKg || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setFormData({ ...formData, quantityKg: val, tcQuantityKg: val });
                    }}
                    placeholder="e.g. 54432"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-black text-emerald-600 focus:ring-2 focus:ring-emerald-500 outline-none"
                    required
                  />
                </div>

                {/* Total Bales */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bale Count / Number of Bales
                  </label>
                  <input
                    type="number"
                    value={formData.baleCount || ''}
                    onChange={(e) => setFormData({ ...formData, baleCount: Number(e.target.value) })}
                    placeholder="e.g. 240"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* TC Issue Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    TC Issue Date
                  </label>
                  <input
                    type="date"
                    value={formData.tcIssueDate}
                    onChange={(e) => setFormData({ ...formData, tcIssueDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* TC Validity Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    TC Validity Date (If any)
                  </label>
                  <input
                    type="date"
                    value={formData.tcValidityDate}
                    onChange={(e) => setFormData({ ...formData, tcValidityDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Invoice / Challan */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Invoice / Challan Number
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceChallanNo}
                    onChange={(e) => setFormData({ ...formData, invoiceChallanNo: e.target.value })}
                    placeholder="e.g. INV-8812 / CH-401"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Purchase Reference / LC */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Purchase Order / LC Ref
                  </label>
                  <input
                    type="text"
                    value={formData.purchaseRef}
                    onChange={(e) => setFormData({ ...formData, purchaseRef: e.target.value })}
                    placeholder="e.g. PO-GOTS-4402 / LC-88310"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Cotton Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cotton / Material Description
                </label>
                <input
                  type="text"
                  value={formData.cottonDescription}
                  onChange={(e) => setFormData({ ...formData, cottonDescription: e.target.value })}
                  placeholder="e.g. 100% Organic Raw Cotton (MCU-5 Variety / GOTS 6.0 certified, 29mm fiber length)"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Document Attachments Section */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-sky-600" />
                    Attach Supporting Documents (TC, Invoice, Packing List, Scope Cert)
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    {formData.documents?.length || 0} attached
                  </span>
                </div>

                {/* Quick Add Doc bar */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Document title or filename (e.g. TC-Signed-Copy.pdf)"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    className="flex-1 min-w-[200px] px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                  >
                    <option value="Transaction Certificate (TC)">Transaction Certificate (TC)</option>
                    <option value="Scope Certificate">Scope Certificate</option>
                    <option value="Invoice / Challan">Invoice / Challan</option>
                    <option value="Packing List">Packing List</option>
                    <option value="Test Report">Test Report / Lab Certificate</option>
                    <option value="Other">Other Supporting Document</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddDoc}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Attach
                  </button>
                </div>

                {/* Attached list */}
                {formData.documents && formData.documents.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {formData.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <div className="truncate">
                            <div className="font-bold text-slate-800 dark:text-slate-200 truncate">{doc.name}</div>
                            <div className="text-[10px] text-slate-400">{doc.type} • {doc.size || '1.2 MB'}</div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Special instructions, bale condition, or audit notes..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
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
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition"
                >
                  {editingItem ? 'Update Receive Entry' : 'Save Certified Cotton Receive'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
