import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Printer,
  FileSpreadsheet,
  Download,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Building2,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { AccountTransaction } from '../../types';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { triggerAppPrint } from '../../utils/printUtils';

interface DailyCashSummaryProps {
  transactions: AccountTransaction[];
  onViewVoucher: (t: AccountTransaction) => void;
  onOpenReceiveModal: () => void;
  onOpenExpenseModal: () => void;
}

export const DailyCashSummary: React.FC<DailyCashSummaryProps> = ({
  transactions,
  onViewVoucher,
  onOpenReceiveModal,
  onOpenExpenseModal,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Navigate dates
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // 1. Calculate Opening Balance strictly from all transactions BEFORE selectedDate
  const openingBalance = useMemo(() => {
    return transactions
      .filter((t) => t.date < selectedDate)
      .reduce((acc, t) => {
        const isReceive = t.voucherType === 'Receive' || t.voucherType === 'Receipt' || (t.credit > 0 && t.debit === 0);
        const amt = t.amount || (isReceive ? t.credit : t.debit) || 0;
        return isReceive ? acc + amt : acc - amt;
      }, 0);
  }, [transactions, selectedDate]);

  // 2. Transactions of the selected date in chronological order
  const dayTransactions = useMemo(() => {
    return transactions
      .filter((t) => t.date === selectedDate)
      .sort((a, b) => a.id - b.id);
  }, [transactions, selectedDate]);

  // 3. Today's Total Receive & Total Expense
  const totalReceive = useMemo(() => {
    return dayTransactions
      .filter((t) => t.voucherType === 'Receive' || t.voucherType === 'Receipt' || (t.credit > 0 && t.debit === 0))
      .reduce((acc, t) => acc + (t.amount || t.credit || 0), 0);
  }, [dayTransactions]);

  const totalExpense = useMemo(() => {
    return dayTransactions
      .filter((t) => t.voucherType === 'Expense' || t.voucherType === 'Payment' || (t.debit > 0 && t.credit === 0))
      .reduce((acc, t) => acc + (t.amount || t.debit || 0), 0);
  }, [dayTransactions]);

  // 4. Closing Cash Balance
  const closingBalance = openingBalance + totalReceive - totalExpense;

  const formatBDT = (val: number) =>
    '৳ ' + Math.round(val || 0).toLocaleString('en-US');

  // Compute running balance for each row
  let currentRunning = openingBalance;
  const ledgerRows = dayTransactions.map((t) => {
    const isReceive = t.voucherType === 'Receive' || t.voucherType === 'Receipt' || (t.credit > 0 && t.debit === 0);
    const amt = t.amount || (isReceive ? t.credit : t.debit) || 0;
    if (isReceive) {
      currentRunning += amt;
    } else {
      currentRunning -= amt;
    }
    return {
      ...t,
      isReceive,
      receiveAmt: isReceive ? amt : 0,
      expenseAmt: !isReceive ? amt : 0,
      runningBalance: currentRunning,
    };
  });

  // Export handlers
  const handleExportExcel = () => {
    const data = [
      {
        'Voucher No': 'OPENING BALANCE',
        Category: '-',
        'Party / Details': 'Previous Day Cash in Hand',
        'Receive (+)': openingBalance,
        'Expense (-)': 0,
        'Running Balance': openingBalance,
      },
      ...ledgerRows.map((r) => ({
        'Voucher No': r.voucherNo,
        Category: r.category,
        'Party / Details': `${r.partyName} - ${r.narration}`,
        'Receive (+)': r.receiveAmt,
        'Expense (-)': r.expenseAmt,
        'Running Balance': r.runningBalance,
      })),
      {
        'Voucher No': 'CLOSING BALANCE',
        Category: '-',
        'Party / Details': 'End of Day Cash in Hand',
        'Receive (+)': totalReceive,
        'Expense (-)': totalExpense,
        'Running Balance': closingBalance,
      },
    ];
    exportToExcel(data, `Daily_Cash_Sheet_${selectedDate}`);
  };

  const handleExportPDF = () => {
    const columns = ['SL', 'Voucher No', 'Category', 'Source / Paid To & Narration', 'Receive (+)', 'Expense (-)', 'Balance'];
    const rows = [
      ['-', 'OPENING', 'Opening Cash', 'Carried Forward Balance', '-', '-', formatBDT(openingBalance)],
      ...ledgerRows.map((r, idx) => [
        idx + 1,
        r.voucherNo,
        r.category,
        `${r.partyName ? r.partyName + ': ' : ''}${r.narration}`,
        r.receiveAmt > 0 ? formatBDT(r.receiveAmt) : '-',
        r.expenseAmt > 0 ? formatBDT(r.expenseAmt) : '-',
        formatBDT(r.runningBalance),
      ]),
      ['-', 'CLOSING', 'Summary', `Total Receive: ${formatBDT(totalReceive)} | Total Expense: ${formatBDT(totalExpense)}`, formatBDT(totalReceive), formatBDT(totalExpense), formatBDT(closingBalance)],
    ];
    exportToPDF(
      `Patriot Spinning Mills Ltd. - Daily Cash Sheet (${selectedDate})`,
      columns,
      rows,
      `Daily_Cash_Sheet_${selectedDate}.pdf`,
      'landscape'
    );
  };

  return (
    <div className="space-y-6">
      {/* Date Picker Header Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Daily Cash Transaction Sheet (দৈনিক ক্যাশ শিট)
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
            দৈনিক ক্যাশ ব্যালেন্স ও লেনদেন সামারি
          </h2>
          <p className="text-xs text-slate-500">
            নির্দিষ্ট দিনের শুরুর ক্যাশ, সারাদিনের জমা ও খরচ এবং দিন শেষের সমাপনী ক্যাশ
          </p>
        </div>

        {/* Date Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={handleNextDay}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-2 text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 rounded-lg transition"
          >
            Today (আজকে)
          </button>
        </div>
      </div>

      {/* 4 CORE METRIC CARDS WITH FORMULA (Opening + Receive - Expense = Closing) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Opening Cash Balance */}
        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Opening Cash Balance
            </span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-[11px] text-slate-400 block mb-2">দিনের শুরুর ক্যাশ</span>
          <div className="text-xl font-black text-slate-900 dark:text-white">
            {formatBDT(openingBalance)}
          </div>
          <div className="mt-2 text-[10px] text-slate-400">পূর্ববর্তী দিনের সমাপনী ব্যালেন্স</div>
        </div>

        {/* 2. Today's Total Receive */}
        <div className="bg-emerald-50/80 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              Today's Total Receive (+)
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 block mb-2">আজকের মোট জমা</span>
          <div className="text-xl font-black text-emerald-700 dark:text-emerald-300">
            {formatBDT(totalReceive)}
          </div>
          <div className="mt-2 text-[10px] text-emerald-600/80">{dayTransactions.filter(t => t.credit > 0 || t.voucherType === 'Receive').length} টি জমা এন্ট্রি</div>
        </div>

        {/* 3. Today's Total Expense */}
        <div className="bg-rose-50/80 dark:bg-rose-950/20 rounded-xl p-4 border border-rose-200 dark:border-rose-800/50 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
              Today's Total Expense (−)
            </span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-[11px] text-rose-600 dark:text-rose-400 block mb-2">আজকের মোট খরচ</span>
          <div className="text-xl font-black text-rose-700 dark:text-rose-300">
            {formatBDT(totalExpense)}
          </div>
          <div className="mt-2 text-[10px] text-rose-600/80">{dayTransactions.filter(t => t.debit > 0 || t.voucherType === 'Expense').length} টি খরচ এন্ট্রি</div>
        </div>

        {/* 4. Closing Cash Balance */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl p-4 border border-indigo-600/40 shadow-md">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-indigo-200">
              Closing Cash Balance (=)
            </span>
            <Wallet className="w-4 h-4 text-indigo-300" />
          </div>
          <span className="text-[11px] text-indigo-300/80 block mb-2">আজকের সমাপনী ব্যালেন্স</span>
          <div className="text-xl font-black text-emerald-300">
            {formatBDT(closingBalance)}
          </div>
          <div className="mt-2 text-[10px] text-indigo-200/70">হাতে থাকা মোট ক্যাশ টাকা</div>
        </div>
      </div>

      {/* Export & Action Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            তারিখ: <strong className="text-slate-900 dark:text-white">{selectedDate}</strong> ({dayTransactions.length} টি লেনদেন)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenReceiveModal}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
          >
            + জমা এন্ট্রি
          </button>
          <button
            onClick={onOpenExpenseModal}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition"
          >
            + খরচ এন্ট্রি
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-semibold hover:bg-rose-100 transition"
          >
            <Download className="w-3.5 h-3.5" />
            PDF
          </button>
          <button
            onClick={() => triggerAppPrint()}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition"
          >
            <Printer className="w-3.5 h-3.5" />
            প্রিন্ট শিট (Print Sheet)
          </button>
        </div>
      </div>

      {/* CHRONOLOGICAL DAILY LEDGER TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden" id="daily-cash-sheet-table">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-3.5 w-12 text-center">SL</th>
                <th className="py-3 px-3.5">ভাউচার নং</th>
                <th className="py-3 px-3.5">উৎস / প্রাপক</th>
                <th className="py-3 px-3.5">খাত / ক্যাটাগরি</th>
                <th className="py-3 px-3.5">বিবরণ (Narration)</th>
                <th className="py-3 px-3.5 text-right text-emerald-700 dark:text-emerald-400 font-black">Receive / জমা (+)</th>
                <th className="py-3 px-3.5 text-right text-rose-700 dark:text-rose-400 font-black">Expense / খরচ (−)</th>
                <th className="py-3 px-3.5 text-right font-black text-slate-900 dark:text-white">রানিং ব্যালেন্স (BDT)</th>
                <th className="py-3 px-3.5 text-center">রসিদ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {/* Row 0: Opening Cash row */}
              <tr className="bg-slate-50/80 dark:bg-slate-900/30 font-semibold text-slate-800 dark:text-slate-200">
                <td className="py-2.5 px-3.5 text-center font-bold text-slate-400">0</td>
                <td className="py-2.5 px-3.5 font-mono text-slate-500">OPENING</td>
                <td className="py-2.5 px-3.5 font-bold text-indigo-600 dark:text-indigo-400" colSpan={3}>
                  দিনের শুরুর ক্যাশ ব্যালেন্স (Opening Cash in Hand)
                </td>
                <td className="py-2.5 px-3.5 text-right text-slate-400">-</td>
                <td className="py-2.5 px-3.5 text-right text-slate-400">-</td>
                <td className="py-2.5 px-3.5 text-right font-black text-indigo-700 dark:text-indigo-300">
                  {formatBDT(openingBalance)}
                </td>
                <td className="py-2.5 px-3.5 text-center text-slate-400">-</td>
              </tr>

              {/* Transactions list */}
              {ledgerRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs italic">
                    এই তারিখে কোন লেনদেন নেই।
                  </td>
                </tr>
              ) : (
                ledgerRows.map((r, idx) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/20 transition">
                    <td className="py-2.5 px-3.5 text-center text-slate-500 font-semibold">{idx + 1}</td>
                    <td className="py-2.5 px-3.5 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {r.voucherNo}
                    </td>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-800 dark:text-slate-200">{r.partyName}</td>
                    <td className="py-2.5 px-3.5">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.isReceive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                      }`}>
                        {r.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={r.narration}>
                      {r.narration}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {r.receiveAmt > 0 ? `+ ${formatBDT(r.receiveAmt)}` : '-'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      {r.expenseAmt > 0 ? `− ${formatBDT(r.expenseAmt)}` : '-'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-black text-slate-900 dark:text-white whitespace-nowrap">
                      {formatBDT(r.runningBalance)}
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <button
                        onClick={() => onViewVoucher(r)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded transition"
                        title="Print Slip"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}

              {/* Summary / Total Row */}
              <tr className="bg-slate-100 dark:bg-slate-900 font-bold border-t-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                <td className="py-3 px-3.5 text-center font-bold" colSpan={5}>
                  TOTAL (মোট হিসাব)
                </td>
                <td className="py-3 px-3.5 text-right font-black text-emerald-600 text-sm whitespace-nowrap">
                  + {formatBDT(totalReceive)}
                </td>
                <td className="py-3 px-3.5 text-right font-black text-rose-600 text-sm whitespace-nowrap">
                  − {formatBDT(totalExpense)}
                </td>
                <td className="py-3 px-3.5 text-right font-black text-indigo-600 dark:text-indigo-400 text-sm whitespace-nowrap">
                  = {formatBDT(closingBalance)}
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
