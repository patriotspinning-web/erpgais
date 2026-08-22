import React, { useState, useMemo } from 'react';
import {
  TrendingDown,
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
  MinusCircle,
} from 'lucide-react';
import { AccountTransaction } from '../../types';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { triggerAppPrint } from '../../utils/printUtils';
import { DateRangeFilter } from '../../components/DateRangeFilter';
import { isDateInRange } from '../../utils/dateUtils';

interface ExpenseListProps {
  transactions: AccountTransaction[];
  setTransactions: React.Dispatch<React.SetStateAction<AccountTransaction[]>>;
  expenseCategories: string[];
  onAddCategory: (newCat: string) => void;
  onViewVoucher: (t: AccountTransaction) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  requestAdminAction?: (title: string, action: () => void) => void;
  isModalOpenExternal?: boolean;
  setIsModalOpenExternal?: (val: boolean) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  transactions,
  setTransactions,
  expenseCategories,
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

  // New Category inline popover
  const [showAddCatInput, setShowAddCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    voucherNo: '',
    category: expenseCategories[0] || 'Factory Maintenance',
    narration: '', // Description
    amount: '',
    partyName: '', // Paid To / Supplier
    remarks: '',
    paymentMethod: 'Cash',
    referenceNo: '',
  });

  // Filter only Expense transactions
  const expenseTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.voucherType === 'Expense' || t.voucherType === 'Payment' || (t.debit > 0 && t.credit === 0)
    );
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return expenseTransactions.filter((t) => {
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
  }, [expenseTransactions, searchTerm, selectedCategory, startDate, endDate]);

  const totalFilteredAmount = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + (t.amount || t.debit || 0), 0);
  }, [filteredTransactions]);

  const formatBDT = (val: number) =>
    '৳ ' + Math.round(val || 0).toLocaleString('en-US');

  // Auto-generate Next Voucher No
  const generateVoucherNo = () => {
    const today = new Date();
    const yyyymm = today.toISOString().slice(0, 7).replace('-', '');
    const count = expenseTransactions.length + 1;
    return `VE-${yyyymm}-${String(count).padStart(3, '0')}`;
  };

  const handleOpenAddModal = () => {
    setEditingTransaction(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      voucherNo: generateVoucherNo(),
      category: expenseCategories[0] || 'Factory Maintenance',
      narration: '',
      amount: '',
      partyName: '',
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
      category: t.category,
      narration: t.narration || '',
      amount: String(t.amount || t.debit),
      partyName: t.partyName,
      remarks: t.remarks || '',
      paymentMethod: t.paymentMethod || 'Cash',
      referenceNo: t.referenceNo || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(formData.amount);
    if (!formData.narration.trim()) {
      showToast('error', 'Required Field', 'Please enter Description of expense.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('error', 'Invalid Amount', 'Please enter a valid expense amount greater than 0.');
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
                category: formData.category,
                accountHead: formData.category,
                partyName: formData.partyName || 'Factory Expense',
                amount: numAmount,
                debit: numAmount,
                credit: 0,
                narration: formData.narration,
                remarks: formData.remarks,
                paymentMethod: formData.paymentMethod,
                referenceNo: formData.referenceNo,
              }
            : item
        )
      );
      showToast('success', 'Entry Updated', `Expense voucher ${formData.voucherNo} updated successfully.`);
    } else {
      const newTransaction: AccountTransaction = {
        id: Date.now(),
        voucherNo: formData.voucherNo || generateVoucherNo(),
        date: formData.date,
        voucherType: 'Expense',
        accountHead: formData.category,
        category: formData.category,
        partyName: formData.partyName || 'Factory Cash Expense',
        debit: numAmount,
        credit: 0,
        amount: numAmount,
        paymentMethod: formData.paymentMethod,
        referenceNo: formData.referenceNo,
        bankAccount: 'Factory Cash in Hand',
        narration: formData.narration,
        remarks: formData.remarks,
        status: 'Approved',
      };
      setTransactions((prev) => [newTransaction, ...prev]);
      showToast('success', 'Expense Recorded', `৳ ${numAmount.toLocaleString()} expense recorded under ${formData.category}.`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (t: AccountTransaction) => {
    const doDelete = () => {
      setTransactions((prev) => prev.filter((item) => item.id !== t.id));
      showToast('info', 'Deleted', `Voucher ${t.voucherNo} deleted.`);
    };

    if (requestAdminAction) {
      requestAdminAction(`Delete Expense Voucher ${t.voucherNo}`, doDelete);
    } else {
      if (confirm(`Are you sure you want to delete Expense Voucher ${t.voucherNo}?`)) {
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
    showToast('success', 'New Category Added', `Added "${newCatName.trim()}" to Expense categories.`);
  };

  // Export handlers
  const handleExportExcel = () => {
    const data = filteredTransactions.map((t) => ({
      Date: t.date,
      'Voucher No': t.voucherNo,
      'Expense Category': t.category,
      Description: t.narration,
      'Amount (BDT)': t.amount || t.debit,
      'Paid To / Supplier': t.partyName,
      Remarks: t.remarks || '',
      'Payment Mode': t.paymentMethod || 'Cash',
    }));
    exportToExcel(data, `Factory_Daily_Expense_Report_${new Date().toISOString().split('T')[0]}`);
    showToast('success', 'Excel Exported', 'Daily Expense entries exported to Excel file.');
  };

  const handleExportPDF = () => {
    const columns = ['Date', 'Voucher No', 'Expense Head', 'Description', 'Paid To / Supplier', 'Amount (BDT)'];
    const rows = filteredTransactions.map((t) => [
      t.date,
      t.voucherNo,
      t.category,
      t.narration || '-',
      t.partyName || '-',
      Number(t.amount || t.debit || 0).toLocaleString('en-US'),
    ]);
    exportToPDF(
      'Patriot Spinning Mills Ltd. - Factory Daily Expense Report (দৈনিক খরচ রিপোর্ট)',
      columns,
      rows,
      `Expense_Report_${new Date().toISOString().split('T')[0]}.pdf`,
      'landscape'
    );
    showToast('success', 'PDF Exported', 'Daily Expense PDF report generated successfully.');
  };

  return (
    <div className="space-y-5">
      {/* Top Banner with Summary */}
      <div className="bg-rose-900/10 dark:bg-rose-950/30 border border-rose-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-600 text-white">
              Daily Expense Entry (দৈনিক খরচ)
            </span>
            <span className="text-xs text-slate-500 font-semibold">{filteredTransactions.length} টি রেকর্ড</span>
          </div>
          <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mt-1">
            ফ্যাক্টরি দৈনিক খরচ খাতা <span className="text-sm font-medium text-rose-700 dark:text-rose-400">(Factory Outflow / Debit)</span>
          </h2>
          <p className="text-xs text-slate-500">
            বেতন, মেইনটেন্যান্স, লোকাল ক্রয়, পরিবহন, লেবার ও অফিসসহ সকল ক্যাশ খরচ এন্ট্রি
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-700/60 shadow-sm text-right">
            <span className="text-[10px] text-slate-500 uppercase font-bold block">ফিল্টারকৃত মোট খরচ:</span>
            <span className="text-base md:text-lg font-black text-rose-600 dark:text-rose-400">
              {formatBDT(totalFilteredAmount)}
            </span>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" />
            + নতুন খরচ এন্ট্রি (Expense)
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
              placeholder="ভাউচার নং, প্রাপক/সাপ্লায়ার, খরচের খাত বা বিবরণ দিয়ে খুঁজুন..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-2 px-3 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="All">সকল খরচের খাত (All Categories)</option>
            {expenseCategories.map((c) => (
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
              <tr className="bg-rose-50 dark:bg-slate-900/80 text-rose-900 dark:text-rose-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-3.5">তারিখ</th>
                <th className="py-3 px-3.5">ভাউচার নং</th>
                <th className="py-3 px-3.5">খরচের খাত (Category)</th>
                <th className="py-3 px-3.5">বিবরণ (Description)</th>
                <th className="py-3 px-3.5">প্রাপক / সাপ্লায়ার (Paid To)</th>
                <th className="py-3 px-3.5">মন্তব্য</th>
                <th className="py-3 px-3.5 text-right font-black">খরচের টাকা (BDT)</th>
                <th className="py-3 px-3.5 text-center">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                    কোন খরচ লেনদেন পাওয়া যায়নি।
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
                    <td className="py-3 px-3.5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-3.5 text-slate-700 dark:text-slate-200 font-medium max-w-[220px]">
                      {t.narration}
                    </td>
                    <td className="py-3 px-3.5 text-slate-600 dark:text-slate-300">
                      {t.partyName || '-'}
                    </td>
                    <td className="py-3 px-3.5 text-slate-400 italic text-[11px]">
                      {t.remarks || '-'}
                    </td>
                    <td className="py-3 px-3.5 text-right font-black text-rose-600 dark:text-rose-400 whitespace-nowrap text-sm">
                      − {formatBDT(t.amount || t.debit)}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onViewVoucher(t)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 rounded transition"
                          title="Print Expense Voucher"
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

      {/* MODAL FOR NEW / EDIT EXPENSE ENTRY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rose-700 to-rose-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-rose-300" />
                  {editingTransaction ? 'Edit Expense Entry (খরচ এন্ট্রি সংশোধন)' : 'Daily Expense Entry (দৈনিক খরচ এন্ট্রি)'}
                </h3>
                <p className="text-xs text-rose-200 mt-0.5">ফ্যাক্টরি দৈনিক ক্যাশ খরচের ভাউচার এন্ট্রি করুন</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-rose-200 hover:text-white rounded-lg hover:bg-rose-800 transition"
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
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Voucher No. (ভাউচার নং)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.voucherNo}
                    onChange={(e) => setFormData({ ...formData, voucherNo: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg font-mono font-bold border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              {/* Expense Category with "+ New Category" */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Expense Category (খরচের খাত) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAddCatInput(!showAddCatInput)}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700"
                  >
                    {showAddCatInput ? 'বাতিল করুন' : '+ নতুন খরচের খাত যোগ করুন'}
                  </button>
                </div>

                {showAddCatInput && (
                  <div className="mb-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="নতুন খরচের খাতের নাম লিখুন..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCategory}
                      className="px-3 py-1 bg-rose-600 text-white rounded text-xs font-bold hover:bg-rose-700"
                    >
                      Save
                    </button>
                  </div>
                )}

                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  {expenseCategories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description (খরচের বিবরণ) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="যেমন: ৩ নং রিং ফ্রেমের জন্য বেল্ট ও বেয়ারিং ক্রয়, নাইট শিফট টিফিন ইত্যাদি..."
                  value={formData.narration}
                  onChange={(e) => setFormData({ ...formData, narration: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              {/* Amount & Paid To in 2 cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Amount in BDT (টাকা) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-rose-600 text-sm">৳</span>
                    <input
                      type="number"
                      step="any"
                      required
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-8 pr-3 py-2 text-sm font-black rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Paid To / Supplier (প্রাপক / ব্যক্তি / প্রতিষ্ঠান)
                  </label>
                  <input
                    type="text"
                    placeholder="সাপ্লায়ার বা প্রাপকের নাম"
                    value={formData.partyName}
                    onChange={(e) => setFormData({ ...formData, partyName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              {/* Remarks and Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Remarks (মন্তব্য)
                  </label>
                  <input
                    type="text"
                    placeholder="অতিরিক্ত মন্তব্য / অনুমোদন রেফারেন্স"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bill / Cash Memo / Requisition No.
                  </label>
                  <input
                    type="text"
                    placeholder="MEMO-912 / MRR No"
                    value={formData.referenceNo}
                    onChange={(e) => setFormData({ ...formData, referenceNo: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none"
                  />
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
                  className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow transition active:scale-95"
                >
                  {editingTransaction ? 'Update Entry' : 'Save Expense (খরচ সংরক্ষণ)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
