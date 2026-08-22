import React, { useState, useMemo } from 'react';
import {
  Database,
  PackagePlus,
  PackageMinus,
  Archive,
  FileBarChart,
  Plus,
  Edit3,
  Trash2,
  Download,
  Search,
  AlertTriangle,
  Filter,
  CheckCircle2,
  Boxes,
  Printer,
} from 'lucide-react';
import { SpareItem, SpareReceive, SpareIssue, SpareSource } from '../types';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';
import { triggerAppPrint } from '../utils/printUtils';
import { DateRangeFilter } from '../components/DateRangeFilter';
import { isDateInRange } from '../utils/dateUtils';

interface SpareModuleProps {
  subTab: 'items' | 'receive' | 'issue' | 'stock' | 'reports';
  spareSections: string[];
  spareItems: SpareItem[];
  setSpareItems: React.Dispatch<React.SetStateAction<SpareItem[]>>;
  spareReceives: SpareReceive[];
  setSpareReceives: React.Dispatch<React.SetStateAction<SpareReceive[]>>;
  spareIssues: SpareIssue[];
  setSpareIssues: React.Dispatch<React.SetStateAction<SpareIssue[]>>;
  requestAdminAction: (title: string, action: () => void) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

const SPARE_UNITS = [
  'Pcs',
  'kg',
  'Roll',
  'Packet',
  'Box',
  'Meter',
  'Liter',
  'Set',
  'Pair',
  'Ft',
  'Lbs',
  'Drum',
  'Can',
  'Dozen',
  'Tube',
  'Rim',
  'Spool',
  'Meter/Kg',
  'Bag',
  'Cone',
  'Gallon',
];

export const SpareModule: React.FC<SpareModuleProps> = ({
  subTab,
  spareSections,
  spareItems,
  setSpareItems,
  spareReceives,
  setSpareReceives,
  spareIssues,
  setSpareIssues,
  requestAdminAction,
  showToast,
}) => {
  // Filter state
  const [filterSource, setFilterSource] = useState<string>('');
  const [filterSection, setFilterSection] = useState<string>('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add / Edit Item Modal
  const [showItemModal, setShowItemModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<SpareItem | null>(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    partNumber: '',
    section: 'Ring',
    source: 'Maintenance Import' as SpareSource,
    openingStock: '',
    minStock: '',
    unit: 'Pcs',
    location: '',
  });

  // Receive Form
  const [receiveForm, setReceiveForm] = useState({
    itemId: '',
    mrrNo: '',
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    receivedBy: 'Store Officer',
    remarks: '',
  });

  // Issue Form
  const [issueForm, setIssueForm] = useState({
    itemId: '',
    srNo: '',
    date: new Date().toISOString().split('T')[0],
    quantity: '',
    issueTo: 'Ring Maintenance',
    issuedBy: 'Store Officer',
    remarks: '',
  });

  // Receive & Issue Filter States
  const [receiveStartDate, setReceiveStartDate] = useState('');
  const [receiveEndDate, setReceiveEndDate] = useState('');
  const [receiveSearch, setReceiveSearch] = useState('');

  const [issueStartDate, setIssueStartDate] = useState('');
  const [issueEndDate, setIssueEndDate] = useState('');
  const [issueSearch, setIssueSearch] = useState('');

  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');

  // Filtered Receives
  const filteredSpareReceives = useMemo(() => {
    return spareReceives.filter((r) => {
      const matchesDate = isDateInRange(r.date, receiveStartDate, receiveEndDate);
      const item = spareItems.find((i) => i.id === r.itemId);
      const itemName = item?.name || '';
      const matchesQuery =
        !receiveSearch ||
        r.mrrNo.toLowerCase().includes(receiveSearch.toLowerCase()) ||
        itemName.toLowerCase().includes(receiveSearch.toLowerCase()) ||
        r.receivedBy.toLowerCase().includes(receiveSearch.toLowerCase()) ||
        (r.remarks && r.remarks.toLowerCase().includes(receiveSearch.toLowerCase()));
      return matchesDate && matchesQuery;
    });
  }, [spareReceives, spareItems, receiveStartDate, receiveEndDate, receiveSearch]);

  // Filtered Issues
  const filteredSpareIssues = useMemo(() => {
    return spareIssues.filter((i) => {
      const matchesDate = isDateInRange(i.date, issueStartDate, issueEndDate);
      const item = spareItems.find((itm) => itm.id === i.itemId);
      const itemName = item?.name || '';
      const matchesQuery =
        !issueSearch ||
        i.srNo.toLowerCase().includes(issueSearch.toLowerCase()) ||
        itemName.toLowerCase().includes(issueSearch.toLowerCase()) ||
        i.issueTo.toLowerCase().includes(issueSearch.toLowerCase()) ||
        i.issuedBy.toLowerCase().includes(issueSearch.toLowerCase()) ||
        (i.remarks && i.remarks.toLowerCase().includes(issueSearch.toLowerCase()));
      return matchesDate && matchesQuery;
    });
  }, [spareIssues, spareItems, issueStartDate, issueEndDate, issueSearch]);

  // Filter items
  const filteredItems = spareItems.filter((item) => {
    if (filterSource && item.source !== filterSource) return false;
    if (filterSection && item.section !== filterSection) return false;
    if (filterLowStockOnly && item.currentStock > item.minStock) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.partNumber.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Open Add Item Modal
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setItemForm({
      name: '',
      partNumber: '',
      section: spareSections[0] || 'Ring',
      source: 'Maintenance Import',
      openingStock: '10',
      minStock: '5',
      unit: 'Pcs',
      location: 'Rack A-01',
    });
    setShowItemModal(true);
  };

  // Open Edit Item Modal
  const handleOpenEditModal = (item: SpareItem) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      partNumber: item.partNumber,
      section: item.section,
      source: item.source,
      openingStock: String(item.openingStock),
      minStock: String(item.minStock),
      unit: item.unit,
      location: item.location || '',
    });
    setShowItemModal(true);
  };

  // Submit Save Item
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.name.trim() || !itemForm.section) {
      showToast('error', 'Missing Information', 'Item Name and Section are required');
      return;
    }

    const openingVal = Number(itemForm.openingStock) || 0;
    const minVal = Number(itemForm.minStock) || 5;

    if (editingItem) {
      // Update existing
      setSpareItems((prev) =>
        prev.map((i) =>
          i.id === editingItem.id
            ? {
                ...i,
                name: itemForm.name.trim(),
                partNumber: itemForm.partNumber.trim(),
                section: itemForm.section,
                source: itemForm.source,
                minStock: minVal,
                unit: itemForm.unit,
                location: itemForm.location,
              }
            : i
        )
      );
      showToast('success', 'Item Updated', `Updated ${itemForm.name}`);
    } else {
      // Create new
      const newItem: SpareItem = {
        id: Date.now(),
        name: itemForm.name.trim(),
        partNumber: itemForm.partNumber.trim(),
        section: itemForm.section,
        source: itemForm.source,
        openingStock: openingVal,
        currentStock: openingVal,
        minStock: minVal,
        unit: itemForm.unit,
        location: itemForm.location,
      };
      setSpareItems((prev) => [...prev, newItem]);
      showToast('success', 'Item Created', `Added ${newItem.name} to Items Master`);
    }

    setShowItemModal(false);
  };

  // Submit Receive (MRR)
  const handleSaveReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveForm.itemId || !receiveForm.quantity) {
      showToast('error', 'Missing Information', 'Please select Item and enter Quantity');
      return;
    }

    const itemIdNum = Number(receiveForm.itemId);
    const qtyNum = Number(receiveForm.quantity);

    // Increase stock
    setSpareItems((prev) =>
      prev.map((i) => (i.id === itemIdNum ? { ...i, currentStock: i.currentStock + qtyNum } : i))
    );

    const targetItem = spareItems.find((i) => i.id === itemIdNum);

    const newRec: SpareReceive = {
      id: Date.now(),
      itemId: itemIdNum,
      mrrNo: receiveForm.mrrNo || `MRR-2026-${String(spareReceives.length + 1).padStart(3, '0')}`,
      date: receiveForm.date,
      quantity: qtyNum,
      unit: targetItem?.unit || 'Pcs',
      receivedBy: receiveForm.receivedBy,
      remarks: receiveForm.remarks,
    };

    setSpareReceives((prev) => [...prev, newRec]);

    showToast('success', 'Spare Part Received', `Added ${qtyNum} ${targetItem?.unit || 'Pcs'} to ${targetItem?.name}`);

    setReceiveForm({
      itemId: '',
      mrrNo: '',
      date: new Date().toISOString().split('T')[0],
      quantity: '',
      receivedBy: 'Store Officer',
      remarks: '',
    });
  };

  // Submit Issue (SR)
  const handleSaveIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueForm.itemId || !issueForm.quantity) {
      showToast('error', 'Missing Information', 'Please select Item and enter Quantity');
      return;
    }

    const itemIdNum = Number(issueForm.itemId);
    const qtyNum = Number(issueForm.quantity);
    const targetItem = spareItems.find((i) => i.id === itemIdNum);

    if (!targetItem || qtyNum > targetItem.currentStock) {
      showToast('error', 'Insufficient Stock', `Only ${targetItem?.currentStock || 0} ${targetItem?.unit || 'Pcs'} available in store`);
      return;
    }

    // Deduct stock
    setSpareItems((prev) =>
      prev.map((i) => (i.id === itemIdNum ? { ...i, currentStock: i.currentStock - qtyNum } : i))
    );

    const newIssue: SpareIssue = {
      id: Date.now(),
      itemId: itemIdNum,
      srNo: issueForm.srNo || `SR-S-2026-${String(spareIssues.length + 1).padStart(3, '0')}`,
      date: issueForm.date,
      quantity: qtyNum,
      unit: targetItem.unit || 'Pcs',
      issueTo: issueForm.issueTo,
      issuedBy: issueForm.issuedBy,
      remarks: issueForm.remarks,
    };

    setSpareIssues((prev) => [...prev, newIssue]);
    showToast('success', 'Spare Part Issued', `Issued ${qtyNum} ${targetItem.unit} of ${targetItem.name}`);

    setIssueForm({
      itemId: '',
      srNo: '',
      date: new Date().toISOString().split('T')[0],
      quantity: '',
      issueTo: 'Ring Maintenance',
      issuedBy: 'Store Officer',
      remarks: '',
    });
  };

  // EXPORTS
  const exportItemsExcel = () => {
    const exportData = spareItems.map((i) => ({
      'Item Name': i.name,
      'Part Number': i.partNumber,
      Section: i.section,
      Source: i.source,
      'Opening Stock': i.openingStock,
      'Current Stock': i.currentStock,
      'Min Reorder Level': i.minStock,
      Unit: i.unit,
      Location: i.location || '—',
      Status: i.currentStock === 0 ? 'Out of Stock' : i.currentStock <= i.minStock ? 'Low Stock' : 'In Stock',
    }));
    exportToExcel(exportData, 'Spare_Parts_Master_Catalog');
    showToast('success', 'Excel Exported', 'Downloaded Spare Parts Catalog (.xlsx)');
  };

  const exportItemsPDF = () => {
    const headers = ['Item Name', 'Part #', 'Section', 'Source', 'Stock', 'Min', 'Unit', 'Status'];
    const rows = spareItems.map((i) => [
      i.name,
      i.partNumber || '—',
      i.section,
      i.source,
      i.currentStock,
      i.minStock,
      i.unit,
      i.currentStock === 0 ? 'Out of Stock' : i.currentStock <= i.minStock ? 'Low Stock' : 'In Stock',
    ]);
    exportToPDF('Spare Parts Master Items Inventory', headers, rows, 'Spare_Parts_Master', 'landscape');
    showToast('success', 'PDF Exported', 'Downloaded Spare Parts Catalog (.pdf)');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* ==================== SUB-TAB 1: ITEMS MASTER ==================== */}
      {subTab === 'items' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Spare Parts Items Master Catalog
                </h1>
                <p className="text-xs text-slate-500">
                  Manage 1800+ spare items across 24 mill sections and 3 supply sources
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" /> Add Master Item
            </button>
          </div>

          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search item name, part #..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={filterSource}
              onChange={(e) => setFilterSource(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
            >
              <option value="">All Supply Sources</option>
              <option value="Maintenance Import">Maintenance Import</option>
              <option value="Local Spare Parts">Local Spare Parts</option>
              <option value="Electrical Import">Electrical Import</option>
            </select>

            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none"
            >
              <option value="">All 24 Mill Sections</option>
              {spareSections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>

            <button
              onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                filterLowStockOnly
                  ? 'bg-rose-100 border-rose-300 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                  : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" /> Reorder Only
            </button>

            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => triggerAppPrint()}
                className="no-print px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                title="Print Spare Catalog"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Print
              </button>
              <button
                onClick={exportItemsExcel}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                title="Export Excel"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Master Catalog Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Item Name</th>
                    <th className="px-4 py-3">Part #</th>
                    <th className="px-4 py-3">Section</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3 text-right">Current Stock</th>
                    <th className="px-4 py-3 text-right">Min Level</th>
                    <th className="px-4 py-3 text-center">Unit</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-400">
                        No spare items matching criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-500">{item.partNumber || '—'}</td>
                        <td className="px-4 py-3">{item.section}</td>
                        <td className="px-4 py-3 text-[11px]">{item.source}</td>
                        <td className="px-4 py-3 text-right font-mono font-extrabold text-sm">
                          {item.currentStock}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-400">{item.minStock}</td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-500">{item.unit}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.currentStock === 0
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                                : item.currentStock <= item.minStock
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            }`}
                          >
                            {item.currentStock === 0
                              ? 'OUT OF STOCK'
                              : item.currentStock <= item.minStock
                              ? 'LOW STOCK'
                              : 'IN STOCK'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Edit Item"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              requestAdminAction(`Delete Spare Item (${item.name})`, () => {
                                setSpareItems((prev) => prev.filter((i) => i.id !== item.id));
                                showToast('info', 'Deleted', `Removed ${item.name}`);
                              })
                            }
                            className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                            title="Delete Item (Admin)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 2: SPARE RECEIVE (MRR) ==================== */}
      {subTab === 'receive' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center">
                <PackagePlus className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Spare Parts Material Receive Report (MRR)
                </h1>
                <p className="text-xs text-slate-500">Auto-increases current store stock level upon entry</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <form onSubmit={handleSaveReceive} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Spare Item *
                  </label>
                  <select
                    value={receiveForm.itemId}
                    onChange={(e) => setReceiveForm({ ...receiveForm, itemId: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value="">Select Item from Catalog...</option>
                    {spareItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.section}) — Stock: {item.currentStock} {item.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    MRR Number *
                  </label>
                  <input
                    type="text"
                    value={receiveForm.mrrNo}
                    onChange={(e) => setReceiveForm({ ...receiveForm, mrrNo: e.target.value })}
                    placeholder={`MRR-2026-${String(spareReceives.length + 1).padStart(3, '0')}`}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Received Date *
                  </label>
                  <input
                    type="date"
                    value={receiveForm.date}
                    onChange={(e) => setReceiveForm({ ...receiveForm, date: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity Received *
                  </label>
                  <input
                    type="number"
                    value={receiveForm.quantity}
                    onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })}
                    required
                    min="1"
                    placeholder="e.g. 50"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Received By *
                  </label>
                  <input
                    type="text"
                    value={receiveForm.receivedBy}
                    onChange={(e) => setReceiveForm({ ...receiveForm, receivedBy: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <PackagePlus className="w-4 h-4" /> Save MRR Receive & Add to Store Stock
              </button>
            </form>
          </div>

          {/* Spare Parts Receive Log Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm space-y-4 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Spare Parts Receive Log ({spareReceives.length})
                </h3>
                <p className="text-xs text-slate-500">Filter MRR entries by date range or search by MRR / item name</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={receiveSearch}
                    onChange={(e) => setReceiveSearch(e.target.value)}
                    placeholder="Search MRR / Item..."
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 w-44 sm:w-56"
                  />
                </div>
                <button
                  onClick={() => triggerAppPrint()}
                  className="no-print px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                  title="Print Spare Receive Log"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Print Log
                </button>
              </div>
            </div>

            <DateRangeFilter
              startDate={receiveStartDate}
              endDate={receiveEndDate}
              onStartDateChange={setReceiveStartDate}
              onEndDateChange={setReceiveEndDate}
              totalCount={spareReceives.length}
              filteredCount={filteredSpareReceives.length}
              label="Filter Spare Receives by Date Range"
              accentColor="emerald"
            />

            <div className="overflow-x-auto max-h-[400px] border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">MRR No</th>
                    <th className="px-4 py-3">Item Name</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3">Received By</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {filteredSpareReceives.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        No MRR receive records match the selected date range / query.
                      </td>
                    </tr>
                  ) : (
                    [...filteredSpareReceives].reverse().map((r) => {
                      const item = spareItems.find((i) => i.id === r.itemId);
                      return (
                        <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                          <td className="px-4 py-3 font-mono">{r.date}</td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">{r.mrrNo}</td>
                          <td className="px-4 py-3 font-bold">{item?.name || `Item #${r.itemId}`}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{r.quantity}</td>
                          <td className="px-4 py-3 font-bold text-emerald-700 dark:text-emerald-300">{r.unit || item?.unit || 'Pcs'}</td>
                          <td className="px-4 py-3">{r.receivedBy}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() =>
                                requestAdminAction(`Delete MRR Record (${r.mrrNo})`, () => {
                                  setSpareReceives((prev) => prev.filter((i) => i.id !== r.id));
                                  showToast('info', 'Deleted', `Removed MRR ${r.mrrNo}`);
                                })
                              }
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
      )}

      {/* ==================== SUB-TAB 3: SPARE ISSUE (SR) ==================== */}
      {subTab === 'issue' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center">
                <PackageMinus className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Spare Parts Store Requisition Issue (SR)
                </h1>
                <p className="text-xs text-slate-500">
                  Issue spare parts to machinery repair sections with live stock validation
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <form onSubmit={handleSaveIssue} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Spare Item *
                  </label>
                  <select
                    value={issueForm.itemId}
                    onChange={(e) => setIssueForm({ ...issueForm, itemId: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value="">Select Item...</option>
                    {spareItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.section}) — Avail: {item.currentStock} {item.unit}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Store Requisition (S R) No *
                  </label>
                  <input
                    type="text"
                    value={issueForm.srNo}
                    onChange={(e) => setIssueForm({ ...issueForm, srNo: e.target.value })}
                    placeholder={`SR-S-2026-${String(spareIssues.length + 1).padStart(3, '0')}`}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    value={issueForm.date}
                    onChange={(e) => setIssueForm({ ...issueForm, date: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quantity to Issue *
                  </label>
                  <input
                    type="number"
                    value={issueForm.quantity}
                    onChange={(e) => setIssueForm({ ...issueForm, quantity: e.target.value })}
                    required
                    min="1"
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Issue To (Section / Machine) *
                  </label>
                  <select
                    value={issueForm.issueTo}
                    onChange={(e) => setIssueForm({ ...issueForm, issueTo: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {spareSections.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec} Section
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2"
              >
                <PackageMinus className="w-4 h-4" /> Save SR Issue & Deduct Store Stock
              </button>
            </form>
          </div>

          {/* Spare Parts Issue Log Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm space-y-4 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Spare Parts Issue History ({spareIssues.length})
                </h3>
                <p className="text-xs text-slate-500">Filter store requisitions by date range or search by SR / item / section</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={issueSearch}
                    onChange={(e) => setIssueSearch(e.target.value)}
                    placeholder="Search SR / Item / Section..."
                    className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 w-44 sm:w-56"
                  />
                </div>
                <button
                  onClick={() => triggerAppPrint()}
                  className="no-print px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition shadow-sm"
                  title="Print Spare Issue Log"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Print Log
                </button>
              </div>
            </div>

            <DateRangeFilter
              startDate={issueStartDate}
              endDate={issueEndDate}
              onStartDateChange={setIssueStartDate}
              onEndDateChange={setIssueEndDate}
              totalCount={spareIssues.length}
              filteredCount={filteredSpareIssues.length}
              label="Filter Spare Issues by Date Range"
              accentColor="emerald"
            />

            <div className="overflow-x-auto max-h-[400px] border border-slate-200 dark:border-slate-700 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 sticky top-0 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">SR No</th>
                    <th className="px-4 py-3">Item Name</th>
                    <th className="px-4 py-3">Issue To</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                    <th className="px-4 py-3">Unit</th>
                    <th className="px-4 py-3">Issued By</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {filteredSpareIssues.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                        No SR issue records match the selected date range / query.
                      </td>
                    </tr>
                  ) : (
                    [...filteredSpareIssues].reverse().map((i) => {
                      const item = spareItems.find((itm) => itm.id === i.itemId);
                      return (
                        <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                          <td className="px-4 py-3 font-mono">{i.date}</td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white">{i.srNo}</td>
                          <td className="px-4 py-3 font-bold">{item?.name || `Item #${i.itemId}`}</td>
                          <td className="px-4 py-3">{i.issueTo}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">{i.quantity}</td>
                          <td className="px-4 py-3 font-bold text-rose-700 dark:text-rose-300">{i.unit || item?.unit || 'Pcs'}</td>
                          <td className="px-4 py-3">{i.issuedBy}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() =>
                                requestAdminAction(`Delete SR Record (${i.srNo})`, () => {
                                  setSpareIssues((prev) => prev.filter((item) => item.id !== i.id));
                                  showToast('info', 'Deleted', `Removed SR ${i.srNo}`);
                                })
                              }
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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
      )}

      {/* ==================== SUB-TAB 4: SPARE STOCK ==================== */}
      {subTab === 'stock' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl flex items-center justify-center">
                <Archive className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Spare Parts Section Stock Health
                </h1>
                <p className="text-xs text-slate-500">Live stock inventory status across 24 mill sections</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => triggerAppPrint()}
                className="no-print px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                title="Print Section Stock Health Report"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Print Report
              </button>
              <button
                onClick={exportItemsPDF}
                className="px-3 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> PDF Summary
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {spareSections.map((sec) => {
              const secItems = spareItems.filter((i) => i.section === sec);
              const totalCount = secItems.length;
              const lowCount = secItems.filter((i) => i.currentStock > 0 && i.currentStock <= i.minStock).length;
              const outCount = secItems.filter((i) => i.currentStock === 0).length;

              return (
                <div
                  key={sec}
                  className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">{sec}</h3>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full font-mono font-bold">
                      {totalCount} items
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[11px]">
                    <span className="text-emerald-600 font-semibold">
                      In Stock: {totalCount - lowCount - outCount}
                    </span>
                    {lowCount > 0 && (
                      <span className="text-amber-600 font-bold">Low: {lowCount}</span>
                    )}
                    {outCount > 0 && (
                      <span className="text-rose-600 font-bold">Out: {outCount}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================== SUB-TAB 5: SPARE REPORTS ==================== */}
      {subTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Spare Parts Inventory Exports & Reports
                </h1>
                <p className="text-xs text-slate-500">Full catalog, date range transaction ledgers, and low stock alerts</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => triggerAppPrint()}
                  className="no-print px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs shadow transition flex items-center gap-1.5"
                  title="Print Spare Inventory Report"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Print
                </button>
                <button
                  onClick={exportItemsExcel}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow transition"
                >
                  Catalog Excel
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <DateRangeFilter
                startDate={reportStartDate}
                endDate={reportEndDate}
                onStartDateChange={setReportStartDate}
                onEndDateChange={setReportEndDate}
                totalCount={spareReceives.length + spareIssues.length}
                filteredCount={
                  spareReceives.filter((r) => isDateInRange(r.date, reportStartDate, reportEndDate)).length +
                  spareIssues.filter((i) => isDateInRange(i.date, reportStartDate, reportEndDate)).length
                }
                label="Filter Spare Transactions by Date Range for Export"
                accentColor="emerald"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const rangeReceives = spareReceives.filter((r) => isDateInRange(r.date, reportStartDate, reportEndDate));
                    const data = rangeReceives.map((r) => {
                      const itm = spareItems.find((i) => i.id === r.itemId);
                      return {
                        Date: r.date,
                        'MRR No': r.mrrNo,
                        'Item Name': itm?.name || '',
                        Section: itm?.section || '',
                        Quantity: r.quantity,
                        Unit: r.unit || itm?.unit || 'Pcs',
                        'Received By': r.receivedBy,
                      };
                    });
                    exportToExcel(data, `Spare_MRR_${reportStartDate || 'all'}_to_${reportEndDate || 'all'}`);
                    showToast('success', 'Exported', 'Exported MRR receives report');
                  }}
                  className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold rounded-xl text-xs hover:bg-emerald-100 transition"
                >
                  Export Filtered MRR (Excel)
                </button>

                <button
                  onClick={() => {
                    const rangeIssues = spareIssues.filter((i) => isDateInRange(i.date, reportStartDate, reportEndDate));
                    const data = rangeIssues.map((i) => {
                      const itm = spareItems.find((item) => item.id === i.itemId);
                      return {
                        Date: i.date,
                        'SR No': i.srNo,
                        'Item Name': itm?.name || '',
                        'Issue To Section': i.issueTo,
                        Quantity: i.quantity,
                        Unit: i.unit || itm?.unit || 'Pcs',
                        'Issued By': i.issuedBy,
                      };
                    });
                    exportToExcel(data, `Spare_SR_${reportStartDate || 'all'}_to_${reportEndDate || 'all'}`);
                    showToast('success', 'Exported', 'Exported SR issues report');
                  }}
                  className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold rounded-xl text-xs hover:bg-rose-100 transition"
                >
                  Export Filtered SR (Excel)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Master Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              {editingItem ? 'Edit Master Spare Item' : 'Add New Master Spare Item'}
            </h3>

            <form onSubmit={handleSaveItem} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  required
                  placeholder="e.g. Ball Bearing 6204 2RS"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Part Number
                  </label>
                  <input
                    type="text"
                    value={itemForm.partNumber}
                    onChange={(e) => setItemForm({ ...itemForm, partNumber: e.target.value })}
                    placeholder="e.g. 6204-SKF"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Section *
                  </label>
                  <select
                    value={itemForm.section}
                    onChange={(e) => setItemForm({ ...itemForm, section: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {spareSections.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Supply Source *
                  </label>
                  <select
                    value={itemForm.source}
                    onChange={(e) => setItemForm({ ...itemForm, source: e.target.value as SpareSource })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Maintenance Import">Maintenance Import</option>
                    <option value="Local Spare Parts">Local Spare Parts</option>
                    <option value="Electrical Import">Electrical Import</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Unit *
                  </label>
                  <select
                    value={itemForm.unit}
                    onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })}
                    required
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700 dark:text-emerald-300"
                  >
                    {SPARE_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!editingItem && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Opening Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={itemForm.openingStock}
                    onChange={(e) => setItemForm({ ...itemForm, openingStock: e.target.value })}
                    min="0"
                    placeholder="e.g. 10"
                    className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Rack / Shelf Location
                </label>
                <input
                  type="text"
                  value={itemForm.location}
                  onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                  placeholder="e.g. Rack B-04"
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="flex-1 py-2 text-xs font-semibold border border-slate-300 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
