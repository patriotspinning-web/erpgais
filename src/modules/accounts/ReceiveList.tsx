import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  Printer,
  Edit3,
  Trash2,
  X,
  CheckCircle2,
  Calendar,
  Tag,
  DollarSign,
  PlusCircle,
} from 'lucide-react';
import { AccountTransaction } from '../../types';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { triggerAppPrint } from '../../utils/printUtils';
import { DateRangeFilter } from '../../components/DateRangeFilter';
import { isDateInRange } from '../../utils/dateUtils';

interface ReceiveListProps {
  transactions: AccountTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<AccountTransaction[]>>;
  incomeCategories: string[];
  onAddCategory: (newCat: string) => void;
  onViewVoucher: (t: AccountTransaction) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  requestAdminAction?: (title: string, action: () => void) => void;
  isModalOpenExternal?: boolean;
  setIsModalOpenExternal?: (val: boolean) => void;
}

export const ReceiveList: React.FC<ReceiveListProps> = ({
  transactions,
  setTransactions,
  incomeCategories,
  onAddCategory,
  onViewVoucher,
  showToast,
  requestAdminAction,
  isModalOpenExternal,
  setIsModalOpenExternal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [isModalOpenLocal, setIsModalOpenLocal] = useState(false);
  const isModalOpen = isModalOpenExternal !== undefined ? isModalOpenExternal : isModalOpenLocal;
  const setIsModalOpen = setIsModalOpenExternal || setIsModalOpenLocal;

  const [editingTransaction, setEditingTransaction] = useState<AccountTransaction | null>(null);

  // New Category inline modal/popover
  const [showAddCatInput, setShowAddCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    voucherNo: '',
    partyName: '', // Receive From / Source
    category: incomeCategories[0] || 'Head Office Fund Receive',
    amount: '',
    narration: '', // Description
    remarks: '',
    paymentMethod: 'Cash',
    referenceNo: '',
  });

  // Filter only Receive/Income transactions
  const receiveTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.voucherType === 'Receive' || t.voucherType === 'Receipt' || (t.credit > 0 && t.debit === 0)
    );
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return receiveTransactions.filter((t) => {
      const matchesSearch =
        t.voucherNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.narration && t.narration.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.remarks && t.remarks.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.referenceNo && t.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
      const matchesDate = isDateInRange(t.date, startDate, endDate);

      return matchesSearch && matchesCat && matchesDate;
    });
  }, [receiveTransactions, searchTerm, selectedCategory, startDate, endDate]);

  const totalFilteredAmount = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + (t.amount || t.credit || 0), 0);
  }, [filteredTransactions]);

  const formatBDT = (val: number) =>
    '৳ ' + Math.round(val || 0).toLocaleString('en-US');

  // Auto-generate Next Voucher No
  const generateVoucherNo = () => {
    const today = new Date();
    const yyyymm = today.toISOString().slice(0, 7).replace('-', '');
    const count = receiveTransactions.length + 1;
    return `VR-${yyyymm}-${String(count).padStart(3, '0')}`;
  };

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      voucherNo: generateVoucherNo(),
      partyName: '',
      category: incomeCategories[0] || 'Head Office Fund Receive',
      amount: '',
      narration: '',
      remarks: '',
      paymentMethod: 'Cash',
      referenceNo: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: AccountTransaction) => {
    setEditingTransaction(t);
    setFormData({
      date: t.date,
      voucherNo: t.voucherNo,
      partyName: t.partyName,
      category: t.category,
      amount: String(t.amount || t.credit),
      narration: t.narration || '',
      remarks: t.remarks || '',
      paymentMethod: t.paymentMethod || 'Cash',
      referenceNo: t.referenceNo || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(formData.amount);
    if (!formData.partyName.trim()) {
      showToast('error', 'Required Field', 'Please enter Receive From / Source.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('error', 'Invalid Amount', 'Please enter a valid receive amount greater than 0.');
      return;
    }

    if (editingTransaction) {
      setTransactions((prev) =>
        prev.map((item) =>
          item.id === editingTransaction.id
            ? {
                ...item,
                date: formData.date,
                voucherNo: formData.voucherNo || item.voucherNo,
                partyName: formData.partyName,
                category: formData.category,
                amount: numAmount,
                credit: numAmount,
                debit: 0,
                narration: formData.narration,
                remarks: formData.remarks,
                paymentMethod: formData.paymentMethod,
                referenceNo: formData.referenceNo,
              }
            : item
        )
      );
      showToast('success', 'Entry Updated', `Receive voucher ${formData.voucherNo} updated successfully.`);
    } else {
      const newTransaction: AccountTransaction = {
        id: Date.now(),
        voucherNo: formData.voucherNo || generateVoucherNo(),
        date: formData.date,
        voucherType: 'Receive',
        accountHead: formData.category,
        category: formData.category,
        partyName: formData.partyName,
        debit: 0,
        credit: numAmount,
        amount: numAmount,
        paymentMethod: formData.paymentMethod,
        referenceNo: formData.referenceNo,
        bankAccount: 'Factory Cash in Hand',
        narration: formData.narration || 'Factory Cash Received',
        remarks: formData.remarks,
        status: 'Approved',
      };
      setTransactions((prev) => [newTransaction, ...prev]);
      showToast('success', 'Receive Recorded', `৳ ${numAmount.toLocaleString()} received under ${formData.category}.`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (t: AccountTransaction) => {
    const doDelete = () => {
      setTransactions((prev) => prev.filter((item) => item.id !== t.id));
      showToast('info', 'Deleted', `Voucher ${t.voucherNo} deleted.`);
    };

    if (requestAdminAction) {
      requestAdminAction(`Delete Receive Voucher ${t.voucherNo}`, doDelete);
    } else {
      if (confirm(`Are you sure you want to delete Receive Voucher ${t.voucherNo}?`)) {
        doDelete();
      }
    }
  };

  const handleAddNewCategory = () => {
    if (!newCatName.trim()) return;
    onAddCategory(newCatName.trim());
    setFormData((prev) => ({ ...prev, category: newCatName.trim() }));
    setNewCatName('');
    setShowAddCatInput(false);
    showToast('success', 'New Category Added', `Added "${newCatName.trim()}" to Income categories.`);
  };

  // Export handlers
  const handleExportExcel = () => {
    const data = filteredTransactions.map((t) => ({
      Date: t.date,
      'Voucher No': t.voucherNo,
      'Receive From / Source': t.partyName,
      Category: t.category,
      'Amount (BDT)': t.amount || t.credit,
      'Description / Remarks': t.narration + (t.remarks ? ` | ${t.remarks}` : ''),
      'Ref / Slip No': t.referenceNo || '',
      'Payment Mode': t.paymentMethod || 'Cash',
    }));
    exportToExcel(data, `Factory_Money_Receive_Report_${new Date().toISOString().split('T')[0]}`);
    showToast('success', 'Excel Exported', 'Money Receive entries exported to Excel file.');
  };

  const handleExportPDF = () => {
    const columns = ['Date', 'Voucher No', 'Source / Party', 'Category', 'Description', 'Amount (BDT)'];
    const rows = filteredTransactions.map((t) => [
      t.date,
      t.voucherNo,
      t.partyName,
      t.category,
      t.narration || '-',
      Number(t.amount || t.credit || 0).toLocaleString('en-US'),
    ]);
    exportToPDF(
      'Patriot Spinning Mills Ltd. - Factory Money Receive Report (টাকা জমা রিপোর্ট)',
      columns,
      rows,
      `Receive_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      'landscape'
    );
    showToast('success', 'PDF Exported', 'Money Receive PDF report generated successfully.');
  };

  return (
    <div className="space-y-5">
      {/* Top Banner with Summary */}
      <div className="bg-emerald-900/10 dark:bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white">
              টাকা Receive / Income Entry
            </span>
            <span className="text-xs text-slate-500 font-semibold">{filteredTransactions.length} টি রেকর্ড</span>
          </div>
          <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mt-1">
            ফ্যাক্টরি ক্যাশ জমা খাতা <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">(Factory Inflow / Credit)</span>
          </h2>
          <p className="text-xs text-slate-500">
            হেড অফিস ফান্ড, ওয়েস্টেজ, সবজি, মাছ, স্ক্র্যাপ বিক্রয় ও অন্যান্য আয় এন্ট্রি
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700/60 shadow-sm text-right">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">ফিল্টারকৃত মোট জমা:</span>
            <span className="text-base md:text-lg font-black text-emerald-600 dark:text-emerald-400">
              {formatBDT(totalFilteredAmount)}
            </span>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            + নতুন জমা এন্ট্রি (Receive)
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ভাউচার নং, উৎস/পার্টি, খাত বা বিবরণ দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="All">সকল জমা ক্যাটাগরি (All)</option>
            {incomeCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filter & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
            onClear={() => {
              setStartDate('');
              setEndDate('');
            }}
          />
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition"
            title="Export Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1 px-3 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-semibold hover:bg-rose-100 transition"
            title="Export PDF"
          >
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>
          <button
            onClick={() => triggerAppPrint()}
            className="inline-flex items-center gap-1 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-200 transition"
            title="Print Table"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-emerald-50 dark:bg-slate-900/80 text-emerald-900 dark:text-emerald-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-3.5">তারিখ</th>
                <th className="py-3 px-3.5">ভাউচার নং</th>
                <th className="py-3 px-3.5">টাকা প্রাপ্তির উৎস (Receive From)</th>
                <th className="py-3 px-3.5">ক্যাটাগরি</th>
                <th className="py-3 px-3.5">বিবরণ ও মন্তব্য</th>
                <th className="py-3 px-3.5 text-right font-black">জমা টাকা (BDT)</th>
                <th className="py-3 px-3.5 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400 text-xs">
                    কোন জমা লেনদেন পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="py-3 px-3.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {t.date}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      {t.voucherNo}
                    </td>
                    <td className="py-3 px-3.5 font-semibold text-slate-800 dark:text-slate-100">
                      {t.partyName}
                    </td>
                    <td className="py-3 px-3.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300 max-w-[240px]">
                      <div>{t.narration}</div>
                      {t.remarks && <div className="text-[10px] text-slate-400 italic mt-0.5">{t.remarks}</div>}
                    </td>
                    <td className="py-3 px-3.5 text-right font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap text-sm">
                      + {formatBDT(t.amount || t.credit)}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewVoucher(t)}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded transition"
                          title="Print Money Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(t)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded transition"
                          title="Edit Entry"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(t)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded transition"
                          title="Delete Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* MODAL FOR NEW / EDIT RECEIVE ENTRY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-300" />
                  {editingTransaction ? 'Edit Receive Entry (জমা এন্ট্রি সংশোধন)' : 'New Money Receive (নতুন টাকা জমা এন্ট্রি)'}
                </h3>
                <p className="text-xs text-emerald-200 mt-0.5">ফ্যাক্টরি ক্যাশ কাউন্টারে টাকা জমার তথ্য সংরক্ষণ করুন</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Date (তারিখ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Voucher / Ref No. (ভাউচার নং)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.voucherNo}
                    onChange={(e) => setFormData({ ...formData, voucherNo: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg font-mono font-bold border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Receive From / Source (টাকা প্রাপ্তির উৎস / পার্টি) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: Head Office (Dhaka Account), Hazi Ismail Waste Traders, ইত্যাদি"
                  value={formData.partyName}
                  onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Category selector with "+ New Category" */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Category (জমার খাত) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCatInput(!showAddCatInput)}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    {showAddCatInput ? 'বাতিল করুন' : '+ নতুন খাত যোগ করুন'}
                  </button>
                </div>

                {showAddCatInput && (
                  <div className="mb-2 p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="নতুন জমা খাতের নাম লিখুন..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCategory}
                      className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700"
                    >
                      Save
                    </button>
                  </div>
                )}

                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {incomeCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Amount in BDT (টাকার পরিমাণ) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-emerald-600 text-sm">৳</span>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-8 pr-3 py-2.5 text-sm font-black rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              {/* Description / Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Narration (বিবরণ)
                </label>
                <textarea
                  rows={2}
                  placeholder="টাকা জমার বিস্তারিত বিবরণ লিখুন..."
                  value={formData.narration}
                  onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ref / Challan / Slip No.
                  </label>
                  <input
                    type="text"
                    placeholder="MR-8812 / Slip No"
                    value={formData.referenceNo}
                    onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Cash">Cash (নগদ)</option>
                    <option value="Bank Cheque">Bank Cheque</option>
                    <option value="BEFTN / RTGS">BEFTN / RTGS</option>
                    <option value="Mobile Banking">Mobile Banking (bKash/Nagad)</option>
                  </select>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                >
                  Cancel (বাতিল)
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition active:scale-95"
                >
                  {editingTransaction ? 'Update Entry' : 'Save Receive (জমা সংরক্ষণ)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
