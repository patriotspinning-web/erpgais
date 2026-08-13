import React, { useState } from 'react';
import {
  TestTube,
  PackageCheck,
  Calendar,
  Search,
  Plus,
  Filter,
  Edit3,
  Trash2,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  FileSpreadsheet,
  QrCode,
  Tag,
  Cpu,
  User,
  Sparkles,
  Printer,
  X,
  FileText,
  Boxes,
} from 'lucide-react';
import { SampleItem, SampleType, SampleStatus } from '../types';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

interface SampleModuleProps {
  sampleItems: SampleItem[];
  setSampleItems: React.Dispatch<React.SetStateAction<SampleItem[]>>;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

export const SampleModule: React.FC<SampleModuleProps> = ({
  sampleItems,
  setSampleItems,
  showToast,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SampleItem | null>(null);
  const [printableTagModal, setPrintableTagModal] = useState<SampleItem | null>(null);

  // Form state matching user's exact requested fields with HVI & Uster testing parameters
  const [formData, setFormData] = useState<Omit<SampleItem, 'id'>>({
    sampleCode: '',
    itemName: '',
    quantity: '',
    installedOn: '',
    testReport: '',
    remarks: '',
    sampleType: 'Spare Parts',
    customerBrand: '',
    countLot: '',
    machineFrame: '',
    status: 'Pending Testing',
    requestedBy: '',

    // HVI Cotton Parameters
    hviMicronaire: '',
    hviLengthMm: '',
    hviStrengthGtex: '',
    hviUniformityIndex: '',
    hviShortFiberIndex: '',
    hviTrashPct: '',
    hviSCI: '',

    // Uster & Mechanical Performance Parameters
    usterCsp: '',
    usterUnevennessU: '',
    usterIpiTotal: '',
    usterHairinessH: '',
    usterThin50: '',
    usterThick50: '',
    usterNeps200: '',
    wearResistanceLife: '',
  });

  const sampleTypesList: SampleType[] = [
    'Spare Parts',
    'Accessories',
    'Cotton Sample',
    'Yarn Sample',
    'Sliver / Roving',
    'Waste / Blend',
  ];

  const sampleStatusList: SampleStatus[] = [
    'Pending Testing',
    'Under Evaluation',
    'Approved',
    'Rejected',
    'Delivered to Client',
  ];

  const applyPresetTemplate = (preset: 'Spare' | 'Accessory' | 'Cotton' | 'Yarn') => {
    const today = new Date().toISOString().split('T')[0];
    const code = `SMP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    if (preset === 'Spare') {
      setFormData({
        sampleCode: code,
        itemName: 'Bräcker C1 MMDR 180 Ring Travelers (Trial Box)',
        quantity: '1,000 Pcs (1 Trial Box)',
        installedOn: today,
        testReport: 'Hardness: 820 HV, Wear Resistance: Zero groove cut after 120 hrs continuous run @ 18,500 RPM',
        remarks: 'Sample travelers tested on Ring Frame M-04 for traveler burning & end-breakage reduction.',
        sampleType: 'Spare Parts',
        customerBrand: 'Bräcker AG Switzerland / Spinning Dept',
        countLot: 'Traveler C1 MMDR 180',
        machineFrame: 'Ring Frame M-04 (Spindles 1-120)',
        status: 'Under Evaluation',
        requestedBy: 'Maintenance Head / Ring Spinning',
        hviMicronaire: '',
        hviLengthMm: '',
        hviStrengthGtex: '',
        hviUniformityIndex: '',
        hviShortFiberIndex: '',
        hviTrashPct: '',
        hviSCI: '',
        usterCsp: '2420',
        usterUnevennessU: '9.9',
        usterIpiTotal: '115',
        usterHairinessH: '4.3',
        usterThin50: '8',
        usterThick50: '65',
        usterNeps200: '42',
        wearResistanceLife: 'Hardness 820 HV, 120 hrs continuous run @ 18,500 RPM',
      });
    } else if (preset === 'Accessory') {
      setFormData({
        sampleCode: code,
        itemName: 'Accotex NO-7920 Synthetic Aprons & Rubber Cots',
        quantity: '48 Sets (Top & Bottom)',
        installedOn: today,
        testReport: 'Shore A Hardness: 68-70°, Elastic Recovery: 99.4%, Yarn CV% Improvement: -0.4%',
        remarks: 'High elasticity cots trial for front roller drafting. Reduced lap-up incidents by 85%.',
        sampleType: 'Accessories',
        customerBrand: 'Accotex Germany / Maintenance',
        countLot: 'Cot Shore 70A / Lot AC-99',
        machineFrame: 'Comber Frame C-02 & Ring M-08',
        status: 'Under Evaluation',
        requestedBy: 'Mechanical Engineer',
        hviMicronaire: '',
        hviLengthMm: '',
        hviStrengthGtex: '',
        hviUniformityIndex: '',
        hviShortFiberIndex: '',
        hviTrashPct: '',
        hviSCI: '',
        usterCsp: '2380',
        usterUnevennessU: '10.1',
        usterIpiTotal: '130',
        usterHairinessH: '4.6',
        usterThin50: '10',
        usterThick50: '75',
        usterNeps200: '45',
        wearResistanceLife: 'Shore A Hardness 68-70°, Elasticity 99.4%',
      });
    } else if (preset === 'Cotton') {
      setFormData({
        sampleCode: code,
        itemName: '100% US Pima Extra Long Staple Cotton Sample',
        quantity: '15.0 Kg (1 Sample Bag)',
        installedOn: today,
        testReport: 'HVI: Micronaire 4.15, UHML 31.8mm, Strength 32.5 g/tex, UI 84.2%, Trash 0.12%',
        remarks: 'Imported US Pima sample for premium 60/1 combed compact yarn trial batch.',
        sampleType: 'Cotton Sample',
        customerBrand: 'Cotton USA / In-house R&D Lab',
        countLot: 'Pima US / Consignment 402',
        machineFrame: 'Blowroom & HVI Testing Bench',
        status: 'Under Evaluation',
        requestedBy: 'Cotton Procurement Officer',
        hviMicronaire: '4.15',
        hviLengthMm: '31.8',
        hviStrengthGtex: '32.5',
        hviUniformityIndex: '84.2',
        hviShortFiberIndex: '6.8',
        hviTrashPct: '0.12',
        hviSCI: '152',
        usterCsp: '',
        usterUnevennessU: '',
        usterIpiTotal: '',
        usterHairinessH: '',
        usterThin50: '',
        usterThick50: '',
        usterNeps200: '',
        wearResistanceLife: '',
      });
    } else if (preset === 'Yarn') {
      setFormData({
        sampleCode: code,
        itemName: '30/1 Organic Carded Hosiery Yarn Sample',
        quantity: '5.0 Kg (3 Cones)',
        installedOn: today,
        testReport: 'Uster: CSP 2280, U% 11.2, IPI 285 - PASS Grade A',
        remarks: 'Sample produced on Ring Frame M-06 for buyer trial approval.',
        sampleType: 'Yarn Sample',
        customerBrand: 'H&M Organic Line Sourcing',
        countLot: '30s / Lot 12-S',
        machineFrame: 'Ring Frame M-06 / Spindles 1-24',
        status: 'Approved',
        requestedBy: 'Quality Assurance Dept',
        hviMicronaire: '',
        hviLengthMm: '',
        hviStrengthGtex: '',
        hviUniformityIndex: '',
        hviShortFiberIndex: '',
        hviTrashPct: '',
        hviSCI: '',
        usterCsp: '2280',
        usterUnevennessU: '11.2',
        usterIpiTotal: '285',
        usterHairinessH: '5.1',
        usterThin50: '12',
        usterThick50: '145',
        usterNeps200: '128',
        wearResistanceLife: '24 Months Shelf Life / Grade A Luster',
      });
    }
  };

  const handleOpenModal = (item?: SampleItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        sampleCode: item.sampleCode,
        itemName: item.itemName,
        quantity: item.quantity,
        installedOn: item.installedOn,
        testReport: item.testReport,
        remarks: item.remarks,
        sampleType: item.sampleType,
        customerBrand: item.customerBrand,
        countLot: item.countLot,
        machineFrame: item.machineFrame,
        status: item.status,
        requestedBy: item.requestedBy,
        hviMicronaire: item.hviMicronaire || '',
        hviLengthMm: item.hviLengthMm || '',
        hviStrengthGtex: item.hviStrengthGtex || '',
        hviUniformityIndex: item.hviUniformityIndex || '',
        hviShortFiberIndex: item.hviShortFiberIndex || '',
        hviTrashPct: item.hviTrashPct || '',
        hviSCI: item.hviSCI || '',
        usterCsp: item.usterCsp || '',
        usterUnevennessU: item.usterUnevennessU || '',
        usterIpiTotal: item.usterIpiTotal || '',
        usterHairinessH: item.usterHairinessH || '',
        usterThin50: item.usterThin50 || '',
        usterThick50: item.usterThick50 || '',
        usterNeps200: item.usterNeps200 || '',
        wearResistanceLife: item.wearResistanceLife || '',
      });
    } else {
      setEditingItem(null);
      applyPresetTemplate('Spare');
    }
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemName || !formData.quantity || !formData.installedOn) {
      showToast('error', 'Validation Error', 'Please fill in Item Name, Quantity, and Installed On date.');
      return;
    }

    if (editingItem) {
      setSampleItems((prev) =>
        prev.map((item) => (item.id === editingItem.id ? { ...formData, id: item.id } : item))
      );
      showToast('success', 'Sample Updated', `Sample ${formData.sampleCode} (${formData.itemName}) updated.`);
    } else {
      const newItem: SampleItem = {
        ...formData,
        id: Date.now(),
      };
      setSampleItems((prev) => [newItem, ...prev]);
      showToast('success', 'Sample Created', `New sample ${formData.sampleCode} registered.`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteItem = (id: number, sampleCode: string) => {
    if (confirm(`Are you sure you want to delete sample #${sampleCode}?`)) {
      setSampleItems((prev) => prev.filter((item) => item.id !== id));
      showToast('info', 'Sample Removed', `Sample ${sampleCode} deleted.`);
    }
  };

  const filteredItems = sampleItems.filter((item) => {
    const matchesSearch =
      item.sampleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerBrand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.testReport.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.remarks.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.machineFrame.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'All' || item.sampleType === selectedType;
    const matchesStatus = selectedStatus === 'All' || item.status === selectedStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  // KPI Statistics
  const totalSamples = sampleItems.length;
  const approvedCount = sampleItems.filter((i) => i.status === 'Approved').length;
  const evaluationCount = sampleItems.filter((i) => i.status === 'Under Evaluation' || i.status === 'Pending Testing').length;
  const deliveredCount = sampleItems.filter((i) => i.status === 'Delivered to Client').length;

  const handleExportPDF = () => {
    const headers = ['Sample Code', 'Item Name', 'Quantity', 'Installed On', 'Customer / Brand', 'Test Report', 'Status'];
    const rows = filteredItems.map((i) => [
      i.sampleCode,
      i.itemName,
      i.quantity,
      i.installedOn,
      i.customerBrand,
      i.testReport,
      i.status,
    ]);
    exportToPDF('Patriot Spinning Mills - Sample Management Register', headers, rows, 'Sample_Register_Report', 'landscape');
    showToast('success', 'PDF Exported', 'Sample register exported to PDF.');
  };

  const handleExportExcel = () => {
    const exportData = filteredItems.map((i) => ({
      'Sample Code': i.sampleCode,
      'Item Name': i.itemName,
      Quantity: i.quantity,
      'Installed On / Sent Date': i.installedOn,
      Type: i.sampleType,
      'Customer / Brand': i.customerBrand,
      'Count / Lot': i.countLot,
      'Machine Frame': i.machineFrame,
      'Test Report': i.testReport,
      Status: i.status,
      'Requested By': i.requestedBy,
      Remarks: i.remarks,
    }));
    exportToExcel(exportData, 'Sample_Management_Register');
    showToast('success', 'Excel Exported', 'Sample register exported to Excel.');
  };

  const getStatusBadge = (status: SampleStatus) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300';
      case 'Under Evaluation':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300';
      case 'Pending Testing':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300';
      case 'Delivered to Client':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300';
      case 'Rejected':
        return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border-rose-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <TestTube className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Sample Management Module
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 border border-sky-300">
                  Lab & Buyer Trials
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Track Spinning Mill Samples: Spare Parts, Machine Accessories, Cotton Fibre & Yarn Samples (Item Name, Quantity, Installed On, Test Report & Remarks)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition"
            >
              <Plus className="w-4 h-4" /> Add New Sample
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
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Samples Logged</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{totalSamples}</h3>
            <p className="text-[11px] text-sky-600 dark:text-sky-400 font-semibold mt-1">QC & Buyer Trial Cones</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Approved Samples</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{approvedCount}</h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Passed QC & Uster Test</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Under Evaluation / Testing</p>
            <h3 className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{evaluationCount}</h3>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">Installed on Frames</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Delivered to Clients</p>
            <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{deliveredCount}</h3>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-1">Dispatched to Buyers</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search item, quantity, test report, brand..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Type:
          </span>
          {['All', ...sampleTypesList].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedType(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedType === st
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <div className="w-full md:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full md:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="All">All Statuses</option>
            {sampleStatusList.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* Main Samples Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3.5 px-4">Code & Item Name</th>
                <th className="py-3.5 px-4">Quantity</th>
                <th className="py-3.5 px-4">Installed On</th>
                <th className="py-3.5 px-4">Customer / Brand</th>
                <th className="py-3.5 px-4">Test Report</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Remarks</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs text-slate-800 dark:text-slate-200 font-medium">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 dark:text-slate-500">
                    <TestTube className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No sample records found matching current search.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition">
                    
                    {/* Code & Item Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-extrabold text-sky-600 dark:text-sky-400 text-[11px]">
                        {item.sampleCode}
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">
                        {item.itemName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-sky-500" /> {item.sampleType} • {item.countLot}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-3.5 px-4 font-extrabold text-slate-900 dark:text-white font-mono">
                      {item.quantity}
                    </td>

                    {/* Installed On */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-mono text-slate-700 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {item.installedOn}
                      </div>
                      {item.machineFrame && (
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-indigo-400" /> {item.machineFrame}
                        </div>
                      )}
                    </td>

                    {/* Customer / Brand */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        {item.customerBrand}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Req: {item.requestedBy}
                      </div>
                    </td>

                    {/* Test Report */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {item.testReport}
                      </div>

                      {/* Structured Cotton HVI Badges */}
                      {item.sampleType === 'Cotton Sample' && (item.hviMicronaire || item.hviLengthMm || item.hviStrengthGtex) && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.hviMicronaire && <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded text-[10px] font-mono font-bold">Mic: {item.hviMicronaire}</span>}
                          {item.hviLengthMm && <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded text-[10px] font-mono font-bold">UHML: {item.hviLengthMm}mm</span>}
                          {item.hviStrengthGtex && <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded text-[10px] font-mono font-bold">Str: {item.hviStrengthGtex}g/t</span>}
                          {item.hviUniformityIndex && <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded text-[10px] font-mono font-bold">UI: {item.hviUniformityIndex}%</span>}
                          {item.hviTrashPct && <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded text-[10px] font-mono font-bold">Trash: {item.hviTrashPct}%</span>}
                          {item.hviSCI && <span className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded text-[10px] font-mono font-bold">SCI: {item.hviSCI}</span>}
                        </div>
                      )}

                      {/* Structured Uster / Spec Badges for Spare Parts / Accessories / Yarn */}
                      {item.sampleType !== 'Cotton Sample' && (item.usterCsp || item.usterUnevennessU || item.usterIpiTotal || item.wearResistanceLife) && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.usterCsp && <span className="px-1.5 py-0.5 bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300 rounded text-[10px] font-mono font-bold">CSP: {item.usterCsp}</span>}
                          {item.usterUnevennessU && <span className="px-1.5 py-0.5 bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300 rounded text-[10px] font-mono font-bold">U%: {item.usterUnevennessU}</span>}
                          {item.usterIpiTotal && <span className="px-1.5 py-0.5 bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300 rounded text-[10px] font-mono font-bold">IPI: {item.usterIpiTotal}</span>}
                          {item.usterHairinessH && <span className="px-1.5 py-0.5 bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-300 rounded text-[10px] font-mono font-bold">H: {item.usterHairinessH}</span>}
                          {item.wearResistanceLife && <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 rounded text-[10px] font-bold">Life/Hardness: {item.wearResistanceLife}</span>}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${getStatusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Remarks */}
                    <td className="py-3.5 px-4 max-w-xs text-slate-600 dark:text-slate-300 text-[11px]">
                      {item.remarks || '-'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setPrintableTagModal(item)}
                          className="p-1.5 text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/40 rounded-lg transition"
                          title="Print Lab Tag / Barcode Passport"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg transition"
                          title="Edit Sample Record"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id, item.sampleCode)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-lg transition"
                          title="Delete Sample"
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

      {/* PRINTABLE LAB SAMPLE TAG MODAL */}
      {printableTagModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-2xl p-6 relative">
            <button
              onClick={() => setPrintableTagModal(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Printable Tag Visual Card */}
            <div className="p-5 border-2 border-dashed border-sky-300 dark:border-sky-700 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 relative">
              <div className="flex items-center justify-between pb-3 border-b border-sky-200 dark:border-sky-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-black text-xs">
                    PSM
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-900 dark:text-white tracking-wider">
                      PATRIOT SPINNING MILLS LTD.
                    </h4>
                    <p className="text-[9px] font-bold text-sky-700 dark:text-sky-300">QUALITY CONTROL SAMPLE TAG</p>
                  </div>
                </div>
                <QrCode className="w-8 h-8 text-slate-800 dark:text-slate-200" />
              </div>

              <div className="py-3 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Sample Code:</span>
                  <span className="font-mono font-black text-sky-600 dark:text-sky-400">{printableTagModal.sampleCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Item Name:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white text-right">{printableTagModal.itemName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Quantity:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{printableTagModal.quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Installed / Tested On:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{printableTagModal.installedOn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Machine Frame:</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{printableTagModal.machineFrame || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Customer / Brand:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{printableTagModal.customerBrand}</span>
                </div>

                <div className="pt-2 border-t border-sky-200 dark:border-sky-800">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">
                    USTER / HVI TEST REPORT:
                  </span>
                  <p className="font-mono text-[11px] p-2 bg-white dark:bg-slate-900 rounded-lg border border-sky-200 dark:border-sky-800 font-bold text-slate-800 dark:text-slate-200">
                    {printableTagModal.testReport}
                  </p>
                </div>

                <div className="pt-1">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase block mb-1">
                    REMARKS:
                  </span>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 italic">
                    {printableTagModal.remarks || 'No remarks recorded.'}
                  </p>
                </div>
              </div>

              <div className="pt-2 mt-2 border-t border-sky-200 dark:border-sky-800 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
                <span>Inspector: {printableTagModal.requestedBy}</span>
                <span>Status: {printableTagModal.status}</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow transition"
              >
                <Printer className="w-4 h-4" /> Print Sample Tag
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
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
                <TestTube className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {editingItem ? 'Edit Sample Record' : 'Register New Sample Entry'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Fill in Item Name, Quantity, Installed On date, Test Report, and Remarks
                </p>
              </div>
            </div>

            {!editingItem && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Quick Auto-Fill Sample Templates:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate('Spare')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-900/30 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                  >
                    ⚙️ Spare Parts Trial
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate('Accessory')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-900/30 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                  >
                    🔌 Accessory Trial
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate('Cotton')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-900/30 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                  >
                    🌱 Cotton Fibre Sample
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetTemplate('Yarn')}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-900/30 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                  >
                    🧵 Yarn Cone Sample
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveItem} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sample Code
                  </label>
                  <input
                    type="text"
                    value={formData.sampleCode}
                    onChange={(e) => setFormData({ ...formData, sampleCode: e.target.value })}
                    placeholder="e.g. SMP-2026-001"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sample Type
                  </label>
                  <select
                    value={formData.sampleType}
                    onChange={(e) => setFormData({ ...formData, sampleType: e.target.value as SampleType })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  >
                    {sampleTypesList.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Item Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    placeholder="e.g. 30/1 Organic Carded Hosiery Yarn Sample"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="e.g. 5.0 Kg / 3 Cones"
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Installed On (Date) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.installedOn}
                    onChange={(e) => setFormData({ ...formData, installedOn: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Machine Frame / Location
                  </label>
                  <input
                    type="text"
                    value={formData.machineFrame}
                    onChange={(e) => setFormData({ ...formData, machineFrame: e.target.value })}
                    placeholder="e.g. Ring Frame M-06 / Spindles 1-24"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Customer / Brand Name
                  </label>
                  <input
                    type="text"
                    value={formData.customerBrand}
                    onChange={(e) => setFormData({ ...formData, customerBrand: e.target.value })}
                    placeholder="e.g. H&M Sourcing / Zara Trial"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Count / Lot No
                  </label>
                  <input
                    type="text"
                    value={formData.countLot}
                    onChange={(e) => setFormData({ ...formData, countLot: e.target.value })}
                    placeholder="e.g. 30s / Lot 12-S"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as SampleStatus })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                  >
                    {sampleStatusList.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* HVI Parameters for Cotton Sample */}
              {formData.sampleType === 'Cotton Sample' ? (
                <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      🌱 Cotton Fibre HVI Parameter Inputs (High Volume Instrument)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const parts = [];
                        if (formData.hviMicronaire) parts.push(`Mic: ${formData.hviMicronaire}`);
                        if (formData.hviLengthMm) parts.push(`UHML: ${formData.hviLengthMm}mm`);
                        if (formData.hviStrengthGtex) parts.push(`Str: ${formData.hviStrengthGtex}g/tex`);
                        if (formData.hviUniformityIndex) parts.push(`UI: ${formData.hviUniformityIndex}%`);
                        if (formData.hviShortFiberIndex) parts.push(`SFI: ${formData.hviShortFiberIndex}%`);
                        if (formData.hviTrashPct) parts.push(`Trash: ${formData.hviTrashPct}%`);
                        if (formData.hviSCI) parts.push(`SCI: ${formData.hviSCI}`);
                        if (parts.length) {
                          setFormData({ ...formData, testReport: `HVI: ${parts.join(', ')}` });
                        }
                      }}
                      className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Auto-Format Test Report
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Micronaire (Mic)</label>
                      <input
                        type="text"
                        value={formData.hviMicronaire || ''}
                        onChange={(e) => setFormData({ ...formData, hviMicronaire: e.target.value })}
                        placeholder="e.g. 4.15"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">UHML Staple (mm)</label>
                      <input
                        type="text"
                        value={formData.hviLengthMm || ''}
                        onChange={(e) => setFormData({ ...formData, hviLengthMm: e.target.value })}
                        placeholder="e.g. 31.8"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Strength (g/tex)</label>
                      <input
                        type="text"
                        value={formData.hviStrengthGtex || ''}
                        onChange={(e) => setFormData({ ...formData, hviStrengthGtex: e.target.value })}
                        placeholder="e.g. 32.5"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Uniformity UI %</label>
                      <input
                        type="text"
                        value={formData.hviUniformityIndex || ''}
                        onChange={(e) => setFormData({ ...formData, hviUniformityIndex: e.target.value })}
                        placeholder="e.g. 84.2"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Short Fiber SFI %</label>
                      <input
                        type="text"
                        value={formData.hviShortFiberIndex || ''}
                        onChange={(e) => setFormData({ ...formData, hviShortFiberIndex: e.target.value })}
                        placeholder="e.g. 6.8"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Trash Area %</label>
                      <input
                        type="text"
                        value={formData.hviTrashPct || ''}
                        onChange={(e) => setFormData({ ...formData, hviTrashPct: e.target.value })}
                        placeholder="e.g. 0.12"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Spinning Consistency (SCI)</label>
                      <input
                        type="text"
                        value={formData.hviSCI || ''}
                        onChange={(e) => setFormData({ ...formData, hviSCI: e.target.value })}
                        placeholder="e.g. 152"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-sky-50/80 dark:bg-sky-950/30 rounded-2xl border border-sky-200 dark:border-sky-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-sky-800 dark:text-sky-300 flex items-center gap-1.5">
                      ⚙️ Spare Parts, Accessories & Uster Quality Parameters
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const parts = [];
                        if (formData.usterCsp) parts.push(`CSP: ${formData.usterCsp}`);
                        if (formData.usterUnevennessU) parts.push(`U%: ${formData.usterUnevennessU}`);
                        if (formData.usterIpiTotal) parts.push(`IPI: ${formData.usterIpiTotal}`);
                        if (formData.usterHairinessH) parts.push(`H: ${formData.usterHairinessH}`);
                        if (formData.wearResistanceLife) parts.push(`Wear/Life: ${formData.wearResistanceLife}`);
                        if (parts.length) {
                          setFormData({ ...formData, testReport: `Uster/Spec: ${parts.join(', ')}` });
                        }
                      }}
                      className="text-[10px] font-bold text-sky-700 dark:text-sky-300 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Auto-Format Test Report
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">CSP (Lea Strength)</label>
                      <input
                        type="text"
                        value={formData.usterCsp || ''}
                        onChange={(e) => setFormData({ ...formData, usterCsp: e.target.value })}
                        placeholder="e.g. 2420"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Unevenness U% / CVm%</label>
                      <input
                        type="text"
                        value={formData.usterUnevennessU || ''}
                        onChange={(e) => setFormData({ ...formData, usterUnevennessU: e.target.value })}
                        placeholder="e.g. 9.9"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Total IPI</label>
                      <input
                        type="text"
                        value={formData.usterIpiTotal || ''}
                        onChange={(e) => setFormData({ ...formData, usterIpiTotal: e.target.value })}
                        placeholder="e.g. 115"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Hairiness (H)</label>
                      <input
                        type="text"
                        value={formData.usterHairinessH || ''}
                        onChange={(e) => setFormData({ ...formData, usterHairinessH: e.target.value })}
                        placeholder="e.g. 4.3"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Thin -50%/km</label>
                      <input
                        type="text"
                        value={formData.usterThin50 || ''}
                        onChange={(e) => setFormData({ ...formData, usterThin50: e.target.value })}
                        placeholder="e.g. 8"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Thick +50%/km</label>
                      <input
                        type="text"
                        value={formData.usterThick50 || ''}
                        onChange={(e) => setFormData({ ...formData, usterThick50: e.target.value })}
                        placeholder="e.g. 65"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Neps +200%/km</label>
                      <input
                        type="text"
                        value={formData.usterNeps200 || ''}
                        onChange={(e) => setFormData({ ...formData, usterNeps200: e.target.value })}
                        placeholder="e.g. 42"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">Wear / Life / Hardness</label>
                      <input
                        type="text"
                        value={formData.wearResistanceLife || ''}
                        onChange={(e) => setFormData({ ...formData, wearResistanceLife: e.target.value })}
                        placeholder="e.g. 820 HV / 120 hrs"
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Test Report Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={formData.testReport}
                  onChange={(e) => setFormData({ ...formData, testReport: e.target.value })}
                  rows={2}
                  required
                  placeholder="e.g. Uster: CSP 2280, U% 11.2, IPI 285 - PASS Grade A"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Remarks
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  rows={2}
                  placeholder="Enter trial notes, machine performance, buyer comments"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
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
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow transition"
                >
                  {editingItem ? 'Save Changes' : 'Register Sample'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
