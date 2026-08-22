import React, { useState, useMemo } from 'react';
import {
  Calendar,
  FileSpreadsheet,
  Download,
  Printer,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { AccountTransaction } from '../../types';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { triggerAppPrint } from '../../utils/printUtils';

interface MonthlySummaryProps {
  transactions: AccountTransaction[];
  onSelectDate?: (dateStr: string) => void;
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({
  transactions,
  onSelectDate,
}) => {
  // Current active year and month (e.g. "2026-08")
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().substring(0, 7)
  );

  // Month navigation
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${yyyy}-${mm}`);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${yyyy}-${mm}`);
  };

  // 1. Month's Opening Cash Balance (sum of all transactions prior to the 1st of this month)
  const monthStartStr = `${selectedMonth}-01`;
  const monthOpeningBalance = useMemo(() => {
    return transactions
      .filter((t) => t.date < monthStartStr)
      .reduce((acc, t) => {
        const isReceive = t.voucherType === 'Receive' || t.voucherType === 'Receipt' || (t.credit > 0 && t.debit === 0);
        const amt = t.amount || (isReceive ? t.credit : t.debit) || 0;
        return isReceive ? acc + amt : acc - amt;
      }, 0);
  }, [transactions, monthStartStr]);

  // 2. Month transactions
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // 3. Month's Total Receive & Total Expense
  const totalMonthReceive = useMemo(() => {
    return monthTransactions
      .filter((t) => t.voucherType === 'Receive' || t.voucherType === 'Receipt' || (t.credit > 0 && t.debit === 0))
      .reduce((acc, t) => acc + (t.amount || t.credit || 0), 0);
  }, [monthTransactions]);

  const totalMonthExpense = useMemo(() => {
    return monthTransactions
      .filter((t) => t.voucherType === 'Expense' || t.voucherType === 'Payment' || (t.debit > 0 && t.credit === 0))
      .reduce((acc, t) => acc + (t.amount || t.debit || 0), 0);
  }, [monthTransactions]);

  const monthClosingBalance = monthOpeningBalance + totalMonthReceive - totalMonthExpense;
  const netMonthlyChange = totalMonthReceive - totalMonthExpense;

  const formatBDT = (val: number) =>
    '৳ ' + Math.round(val || 0).toLocaleString('en-US');

  // 4. Generate Day-by-Day Summary for the whole month
  const dayByDayData = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const totalDays = new Date(year, month, 0).getDate();

    let rollingOpening = monthOpeningBalance;
    const dailyRows: Array<{
      date: string;
      opening: number;
      receive: number;
      expense: number;
      closing: number;
      net: number;
      count: number;
    }> = [];

    for (let day = 1; day <= totalDays; day++) {
      const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
      const dayTxs = transactions.filter((t) => t.date === dateStr);

      const dayReceive = dayTxs
        .filter((t) => t.voucherType === 'Receive' || t.voucherType === 'Receipt' || (t.credit > 0 && t.debit === 0))
        .reduce((acc, t) => acc + (t.amount || t.credit || 0), 0);

      const dayExpense = dayTxs
        .filter((t) => t.voucherType === 'Expense' || t.voucherType === 'Payment' || (t.debit > 0 && t.credit === 0))
        .reduce((acc, t) => acc + (t.amount || t.debit || 0), 0);

      const dayClosing = rollingOpening + dayReceive - dayExpense;

      // Only include dates that either have transactions or within the month timeline
      dailyRows.push({
        date: dateStr,
        opening: rollingOpening,
        receive: dayReceive,
        expense: dayExpense,
        closing: dayClosing,
        net: dayReceive - dayExpense,
        count: dayTxs.length,
      });

      rollingOpening = dayClosing;
    }

    return dailyRows;
  }, [transactions, selectedMonth, monthOpeningBalance]);

  // Formatted Month Label
  const monthName = new Date(`${selectedMonth}-01`).toLocaleString('default', {
    month: 'long',
    year: 'numeric',
  });

  // Export handlers
  const handleExportExcel = () => {
    const data = dayByDayData.map((d) => ({
      Date: d.date,
      'Opening Cash': d.opening,
      'Total Receive (+)': d.receive,
      'Total Expense (-)': d.expense,
      'Closing Cash (=)': d.closing,
      'Net Change': d.net,
      'Voucher Count': d.count,
    }));
    exportToExcel(data, `Monthly_Cash_Summary_${selectedMonth}`);
  };

  const handleExportPDF = () => {
    const columns = ['Date', 'Opening Cash', 'Total Receive (+)', 'Total Expense (-)', 'Closing Cash (=)', 'Net Diff'];
    const rows = dayByDayData.map((d) => [
      d.date,
      formatBDT(d.opening),
      d.receive > 0 ? formatBDT(d.receive) : '-',
      d.expense > 0 ? formatBDT(d.expense) : '-',
      formatBDT(d.closing),
      (d.net >= 0 ? '+' : '') + formatBDT(d.net),
    ]);
    exportToPDF(
      `Patriot Spinning Mills Ltd. - Monthly Cash Summary (${monthName})`,
      columns,
      rows,
      `Monthly_Cash_Summary_${selectedMonth}.pdf`,
      'landscape'
    );
  };

  return (
    <div className="space-y-6">
      {/* Month Selector Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Monthly Accounts Summary (মাসিক হিসাব সামারি)
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mt-0.5">
            মাসিক ডেবিট-ক্রেডিট ও সমাপনী ক্যাশ ব্যালেন্স
          </h2>
          <p className="text-xs text-slate-500">
            মাসভিত্তিক মোট জমা, খরচ ও প্রতিদিনের ক্যাশ প্রবাহ তালিকা
          </p>
        </div>

        {/* Month Selector Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer"
            />
          </div>
          <button
            onClick={handleNextMonth}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 transition"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MONTHLY SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Month Opening Cash */}
        <div className="bg-slate-50 dark:bg-slate-800/80 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
            Month Opening Cash
          </span>
          <span className="text-[10px] text-slate-400 block mb-1">মাসের শুরুর ব্যালেন্স (১ তারিখ)</span>
          <div className="text-lg font-black text-slate-900 dark:text-white">
            {formatBDT(monthOpeningBalance)}
          </div>
        </div>

        {/* 2. Total Month Receive */}
        <div className="bg-emerald-50/80 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              Total Month Receive (+)
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mb-1">মাসের মোট জমা</span>
          <div className="text-lg font-black text-emerald-700 dark:text-emerald-300">
            {formatBDT(totalMonthReceive)}
          </div>
        </div>

        {/* 3. Total Month Expense */}
        <div className="bg-rose-50/80 dark:bg-rose-950/20 rounded-xl p-4 border border-rose-200 dark:border-rose-800/50 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
              Total Month Expense (−)
            </span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 block mb-1">মাসের মোট খরচ</span>
          <div className="text-lg font-black text-rose-700 dark:text-rose-300">
            {formatBDT(totalMonthExpense)}
          </div>
        </div>

        {/* 4. Month Closing Balance */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl p-4 border border-indigo-600/40 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-200">
              Month Closing Cash (=)
            </span>
            <Wallet className="w-4 h-4 text-indigo-300" />
          </div>
          <span className="text-[10px] text-indigo-300/80 block mb-1">মাসের সমাপনী ব্যালেন্স</span>
          <div className="text-lg font-black text-emerald-300">
            {formatBDT(monthClosingBalance)}
          </div>
        </div>

        {/* 5. Net Monthly Difference */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
            Net Cash Flow (জমা বনাম খরচ)
          </span>
          <span className="text-[10px] text-slate-400 block mb-1">মাসিক উদ্বৃত্ত / ঘাটতি</span>
          <div className={`text-lg font-black ${netMonthlyChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {netMonthlyChange >= 0 ? `+ ${formatBDT(netMonthlyChange)}` : `− ${formatBDT(Math.abs(netMonthlyChange))}`}
          </div>
        </div>
      </div>

      {/* Export Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
        <div>
          <span className="text-xs font-bold text-slate-800 dark:text-white">
            {monthName} এর দিনভিত্তিক ক্যাশ বিবরণী (Day-by-Day Breakdown)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel Export
          </button>
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-semibold hover:bg-rose-100 transition"
          >
            <Download className="w-3.5 h-3.5" />
            PDF Export
          </button>
          <button
            onClick={() => triggerAppPrint()}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            প্রিন্ট শিট
          </button>
        </div>
      </div>

      {/* DAY-BY-DAY TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 px-3.5">তারিখ (Date)</th>
                <th className="py-3 px-3.5 text-right">দিনের শুরুর ক্যাশ (Opening)</th>
                <th className="py-3 px-3.5 text-right text-emerald-700 dark:text-emerald-400 font-black">মোট জমা / Receive (+)</th>
                <th className="py-3 px-3.5 text-right text-rose-700 dark:text-rose-400 font-black">মোট খরচ / Expense (−)</th>
                <th className="py-3 px-3.5 text-right font-black text-indigo-700 dark:text-indigo-300">সমাপনী ক্যাশ (Closing)</th>
                <th className="py-3 px-3.5 text-right">দিনের তফাত (Net Change)</th>
                <th className="py-3 px-3.5 text-center">ভাউচার সংখ্যা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {dayByDayData.map((d) => {
                const hasActivity = d.receive > 0 || d.expense > 0;
                return (
                  <tr
                    key={d.date}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-700/20 transition ${
                      hasActivity ? 'bg-white dark:bg-slate-800 font-medium' : 'bg-slate-50/40 dark:bg-slate-900/20 text-slate-400'
                    }`}
                  >
                    <td className="py-2.5 px-3.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                      {d.date}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatBDT(d.opening)}
                    </td>
                    <td className={`py-2.5 px-3.5 text-right font-bold whitespace-nowrap ${d.receive > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      {d.receive > 0 ? `+ ${formatBDT(d.receive)}` : '-'}
                    </td>
                    <td className={`py-2.5 px-3.5 text-right font-bold whitespace-nowrap ${d.expense > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                      {d.expense > 0 ? `− ${formatBDT(d.expense)}` : '-'}
                    </td>
                    <td className="py-2.5 px-3.5 text-right font-black text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                      {formatBDT(d.closing)}
                    </td>
                    <td className={`py-2.5 px-3.5 text-right font-semibold whitespace-nowrap ${d.net > 0 ? 'text-emerald-600' : d.net < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                      {d.net !== 0 ? `${d.net > 0 ? '+' : ''}${formatBDT(d.net)}` : '-'}
                    </td>
                    <td className="py-2.5 px-3.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.count > 0 ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200' : 'text-slate-300'
                      }`}>
                        {d.count} টি
                      </span>
                    </td>
                  </tr>
                );
              })}

              {/* Month Total Row */}
              <tr className="bg-slate-100 dark:bg-slate-900 font-bold border-t-2 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white">
                <td className="py-3 px-3.5 font-black">MONTH TOTAL (মাসের মোট)</td>
                <td className="py-3 px-3.5 text-right font-bold text-slate-600">{formatBDT(monthOpeningBalance)}</td>
                <td className="py-3 px-3.5 text-right font-black text-emerald-600 text-sm whitespace-nowrap">
                  + {formatBDT(totalMonthReceive)}
                </td>
                <td className="py-3 px-3.5 text-right font-black text-rose-600 text-sm whitespace-nowrap">
                  − {formatBDT(totalMonthExpense)}
                </td>
                <td className="py-3 px-3.5 text-right font-black text-indigo-600 dark:text-indigo-400 text-sm whitespace-nowrap">
                  = {formatBDT(monthClosingBalance)}
                </td>
                <td className={`py-3 px-3.5 text-right font-bold ${netMonthlyChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {netMonthlyChange >= 0 ? `+ ${formatBDT(netMonthlyChange)}` : `− ${formatBDT(Math.abs(netMonthlyChange))}`}
                </td>
                <td className="py-3 px-3.5 text-center font-bold">{monthTransactions.length} টি</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
