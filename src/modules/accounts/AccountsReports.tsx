import React, { useState, useMemo } from 'react';
import {
  FileText,
  Calendar,
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { AccountTransaction } from '../../types';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { triggerAppPrint } from '../../utils/printUtils';
import { DateRangeFilter } from '../../components/DateRangeFilter';
import { isDateInRange } from '../../utils/dateUtils';

interface AccountsReportsProps {
  transactions: AccountTransaction[];
  incomeCategories: string[];
  expenseCategories: string[];
  onViewVoucher: (t: AccountTransaction) => void;
}

type ReportType =
  | 'daily-cash'
  | 'datewise-receive'
  | 'datewise-expense'
  | 'categorywise-income'
  | 'categorywise-expense'
  | 'monthly-debit-credit'
  | 'monthly-cash-balance';

export const AccountsReports: React.FC<AccountsReportsProps> = ({
  transactions,
  incomeCategories,
  expenseCategories,
  onViewVoucher,
}) => {
  const [activeReport, setActiveReport] = useState<ReportType>('daily-cash');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7)
  );

  const formatBDT = (val: number) =>
    '৳ ' + Math.round(val || 0).toLocaleString('en-US');

  // Filter transactions by date range
  const dateFilteredTransactions = useMemo(() => {
    return transactions.filter((t) => isDateInRange(t.date, startDate, endDate));
  }, [transactions, startDate, endDate]);

  // Report 1: Daily Cash Report
  const dailyCashReportData = useMemo(() => {
    // Group transactions by date
    const dateMap: Record<string, { receives: AccountTransaction[]; expenses: AccountTransaction[] }> = {};
    
    // Sort transactions by date ascending
    const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
    const allDates = Array.from(new Set(sorted.map((t) => t.date)));

    const rows: Array<{
      date: string;
      opening: number;
      receive: number;
      expense: number;
      closing: number;
    }> = [];

    let rollingBal = 0;

    allDates.forEach((d) => {
      const dayTxs = transactions.filter((t) => t.date === d);
      const dayReceive = dayTxs
        .filter((t) => t.voucherType === 'Receive' || t.voucherType === 'Receipt' || (t.credit > 0 && t.debit === 0))
        .reduce((acc, t) => acc + (t.amount || t.credit || 0), 0);

      const dayExpense = dayTxs
        .filter((t) => t.voucherType === 'Expense' || t.voucherType === 'Payment' || (t.debit > 0 && t.credit === 0))
        .reduce((acc, t) => acc + (t.amount || t.debit || 0), 0);

      const dayOpening = rollingBal;
      const dayClosing = dayOpening + dayReceive - dayExpense;
      rollingBal = dayClosing;

      if (isDateInRange(d, startDate, endDate)) {
        rows.push({
          date: d,
          opening: dayOpening,
          receive: dayReceive,
          expense: dayExpense,
          closing: dayClosing,
        });
      }
    });

    return rows;
  }, [transactions, startDate, endDate]);

  // Report 2: Date-wise Receive Report
  const datewiseReceiveData = useMemo(() => {
    return dateFilteredTransactions
      .filter((t) => t.voucherType === 'Receive' || t.voucherType === 'Receipt' || (t.credit > 0 && t.debit === 0))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [dateFilteredTransactions]);

  // Report 3: Date-wise Expense Report
  const datewiseExpenseData = useMemo(() => {
    return dateFilteredTransactions
      .filter((t) => t.voucherType === 'Expense' || t.voucherType === 'Payment' || (t.debit > 0 && t.credit === 0))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [dateFilteredTransactions]);

  // Report 4: Category-wise Income Report
  const categorywiseIncomeData = useMemo(() => {
    const recs = dateFilteredTransactions.filter(
      (t) => t.voucherType === 'Receive' || t.voucherType === 'Receipt' || (t.credit > 0 && t.debit === 0)
    );
    const map: Record<string, { total: number; count: number }> = {};

    recs.forEach((t) => {
      const cat = t.category || 'Other';
      const amt = t.amount || t.credit || 0;
      if (!map[cat]) map[cat] = { total: 0, count: 0 };
      map[cat].total += amt;
      map[cat].count += 1;
    });

    const grandTotal = Object.values(map).reduce((acc, curr) => acc + curr.total, 0);

    return Object.entries(map)
      .map(([cat, data]) => ({
        category: cat,
        total: data.total,
        count: data.count,
        percentage: grandTotal > 0 ? ((data.total / grandTotal) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.total - a.total);
  }, [dateFilteredTransactions]);

  // Report 5: Category-wise Expense Report
  const categorywiseExpenseData = useMemo(() => {
    const exps = dateFilteredTransactions.filter(
      (t) => t.voucherType === 'Expense' || t.voucherType === 'Payment' || (t.debit > 0 && t.credit === 0)
    );
    const map: Record<string, { total: number; count: number }> = {};

    exps.forEach((t) => {
      const cat = t.category || 'Other';
      const amt = t.amount || t.debit || 0;
      if (!map[cat]) map[cat] = { total: 0, count: 0 };
      map[cat].total += amt;
      map[cat].count += 1;
    });

    const grandTotal = Object.values(map).reduce((acc, curr) => acc + curr.total, 0);

    return Object.entries(map)
      .map(([cat, data]) => ({
        category: cat,
        total: data.total,
        count: data.count,
        percentage: grandTotal > 0 ? ((data.total / grandTotal) * 100).toFixed(1) : '0',
      }))
      .sort((a, b) => b.total - a.total);
  }, [dateFilteredTransactions]);

  // Report 6 & 7: Monthly Summary Data
  const monthlyReportData = useMemo(() => {
    // Group all transactions by month YYYY-MM
    const months = Array.from(new Set(transactions.map((t) => t.date.substring(0, 7)))).sort();
    let rollingOpening = 0;

    return months.map((m) => {
      const txs = transactions.filter((t) => t.date.startsWith(m));
      const receive = txs
        .filter((t) => t.voucherType === 'Receive' || t.voucherType === 'Receipt' || (t.credit > 0 && t.debit === 0))
        .reduce((acc, t) => acc + (t.amount || t.credit || 0), 0);

      const expense = txs
        .filter((t) => t.voucherType === 'Expense' || t.voucherType === 'Payment' || (t.debit > 0 && t.credit === 0))
        .reduce((acc, t) => acc + (t.amount || t.debit || 0), 0);

      const opening = rollingOpening;
      const closing = opening + receive - expense;
      rollingOpening = closing;

      return {
        month: m,
        opening,
        receive,
        expense,
        closing,
        net: receive - expense,
        count: txs.length,
      };
    });
  }, [transactions]);

  // Export handlers
  const handleExportCurrentReport = () => {
    const reportNames: Record<ReportType, string> = {
      'daily-cash': 'Daily_Cash_Report',
      'datewise-receive': 'Datewise_Receive_Report',
      'datewise-expense': 'Datewise_Expense_Report',
      'categorywise-income': 'Categorywise_Income_Report',
      'categorywise-expense': 'Categorywise_Expense_Report',
      'monthly-debit-credit': 'Monthly_Debit_Credit_Report',
      'monthly-cash-balance': 'Monthly_Cash_Balance_Report',
    };

    const fileName = `${reportNames[activeReport]}_${new Date().toISOString().split('T')[0]}`;

    if (activeReport === 'daily-cash') {
      exportToExcel(dailyCashReportData, fileName);
    } else if (activeReport === 'datewise-receive') {
      exportToExcel(
        datewiseReceiveData.map((t) => ({
          Date: t.date,
          'Voucher No': t.voucherNo,
          Source: t.partyName,
          Category: t.category,
          Description: t.narration,
          'Amount (BDT)': t.amount || t.credit,
        })),
        fileName
      );
    } else if (activeReport === 'datewise-expense') {
      exportToExcel(
        datewiseExpenseData.map((t) => ({
          Date: t.date,
          'Voucher No': t.voucherNo,
          'Paid To': t.partyName,
          Category: t.category,
          Description: t.narration,
          'Amount (BDT)': t.amount || t.debit,
        })),
        fileName
      );
    } else if (activeReport === 'categorywise-income') {
      exportToExcel(categorywiseIncomeData, fileName);
    } else if (activeReport === 'categorywise-expense') {
      exportToExcel(categorywiseExpenseData, fileName);
    } else {
      exportToExcel(monthlyReportData, fileName);
    }
  };

  const handleExportPDFCurrent = () => {
    if (activeReport === 'daily-cash') {
      exportToPDF(
        'Patriot Spinning Mills Ltd. - Daily Cash Report',
        ['Date', 'Opening Cash', 'Total Receive (+)', 'Total Expense (-)', 'Closing Cash (=)'],
        dailyCashReportData.map((r) => [
          r.date,
          formatBDT(r.opening),
          formatBDT(r.receive),
          formatBDT(r.expense),
          formatBDT(r.closing),
        ]),
        `Daily_Cash_Report.pdf`,
        'landscape'
      );
    } else if (activeReport === 'categorywise-income') {
      exportToPDF(
        'Patriot Spinning Mills Ltd. - Category-wise Income Report',
        ['Category / Head', 'Transaction Count', 'Total Received (BDT)', 'Percentage (%)'],
        categorywiseIncomeData.map((r) => [r.category, r.count, formatBDT(r.total), `${r.percentage}%`]),
        `Category_Income_Report.pdf`
      );
    } else if (activeReport === 'categorywise-expense') {
      exportToPDF(
        'Patriot Spinning Mills Ltd. - Category-wise Expense Report',
        ['Expense Category', 'Transaction Count', 'Total Spent (BDT)', 'Percentage (%)'],
        categorywiseExpenseData.map((r) => [r.category, r.count, formatBDT(r.total), `${r.percentage}%`]),
        `Category_Expense_Report.pdf`
      );
    } else {
      exportToPDF(
        'Patriot Spinning Mills Ltd. - Accounts Report',
        ['Month', 'Opening Cash', 'Receive (+)', 'Expense (-)', 'Closing Cash (=)', 'Net Diff'],
        monthlyReportData.map((r) => [
          r.month,
          formatBDT(r.opening),
          formatBDT(r.receive),
          formatBDT(r.expense),
          formatBDT(r.closing),
          (r.net >= 0 ? '+' : '') + formatBDT(r.net),
        ]),
        `Accounts_Report.pdf`,
        'landscape'
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* 7 REPORT TABS NAVIGATION */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Select Accounts Report / রিপোর্ট নির্বাচন করুন:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2">
          <button
            onClick={() => setActiveReport('daily-cash')}
            className={`px-3 py-2 text-xs font-bold rounded-xl border text-center transition ${
              activeReport === 'daily-cash'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            1. Daily Cash Report
          </button>
          <button
            onClick={() => setActiveReport('datewise-receive')}
            className={`px-3 py-2 text-xs font-bold rounded-xl border text-center transition ${
              activeReport === 'datewise-receive'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            2. Date-wise Receive
          </button>
          <button
            onClick={() => setActiveReport('datewise-expense')}
            className={`px-3 py-2 text-xs font-bold rounded-xl border text-center transition ${
              activeReport === 'datewise-expense'
                ? 'bg-rose-600 text-white border-rose-600 shadow'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            3. Date-wise Expense
          </button>
          <button
            onClick={() => setActiveReport('categorywise-income')}
            className={`px-3 py-2 text-xs font-bold rounded-xl border text-center transition ${
              activeReport === 'categorywise-income'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            4. Category-wise Income
          </button>
          <button
            onClick={() => setActiveReport('categorywise-expense')}
            className={`px-3 py-2 text-xs font-bold rounded-xl border text-center transition ${
              activeReport === 'categorywise-expense'
                ? 'bg-rose-700 text-white border-rose-700 shadow'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            5. Category-wise Expense
          </button>
          <button
            onClick={() => setActiveReport('monthly-debit-credit')}
            className={`px-3 py-2 text-xs font-bold rounded-xl border text-center transition ${
              activeReport === 'monthly-debit-credit'
                ? 'bg-indigo-700 text-white border-indigo-700 shadow'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            6. Monthly Debit & Credit
          </button>
          <button
            onClick={() => setActiveReport('monthly-cash-balance')}
            className={`px-3 py-2 text-xs font-bold rounded-xl border text-center transition ${
              activeReport === 'monthly-cash-balance'
                ? 'bg-slate-900 text-white border-slate-900 shadow'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            7. Monthly Cash Balance
          </button>
        </div>
      </div>

      {/* Filter and Export Header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
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
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCurrentReport}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100 transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel Export
          </button>
          <button
            onClick={handleExportPDFCurrent}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-bold hover:bg-rose-100 transition"
          >
            <Download className="w-4 h-4" />
            PDF Export
          </button>
          <button
            onClick={() => triggerAppPrint()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition"
          >
            <Printer className="w-4 h-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE REPORT TABLE */}

      {/* 1. Daily Cash Report */}
      {activeReport === 'daily-cash' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              ১. দৈনিক ক্যাশ রিপোর্ট (Daily Cash Report)
            </h3>
            <span className="text-xs text-slate-500">{dailyCashReportData.length} টি তারিখ অন্তর্ভুক্ত</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4">তারিখ (Date)</th>
                  <th className="py-3 px-4 text-right">দিনের শুরুর ক্যাশ (Opening)</th>
                  <th className="py-3 px-4 text-right text-emerald-600 font-black">মোট জমা / Credit (+)</th>
                  <th className="py-3 px-4 text-right text-rose-600 font-black">মোট খরচ / Debit (−)</th>
                  <th className="py-3 px-4 text-right font-black text-indigo-700 dark:text-indigo-300">সমাপনী ক্যাশ (Closing)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {dailyCashReportData.map((r) => (
                  <tr key={r.date} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                    <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{r.date}</td>
                    <td className="py-2.5 px-4 text-right font-mono">{formatBDT(r.opening)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-600">+{formatBDT(r.receive)}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-rose-600">−{formatBDT(r.expense)}</td>
                    <td className="py-2.5 px-4 text-right font-black text-indigo-700 dark:text-indigo-300">{formatBDT(r.closing)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Date-wise Receive Report */}
      {activeReport === 'datewise-receive' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
            <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-300">
              ২. তারিখভিত্তিক জমা রিপোর্ট (Date-wise Money Receive Report)
            </h3>
            <span className="text-xs text-emerald-700 font-semibold">{datewiseReceiveData.length} টি জমা ভাউচার</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4">তারিখ</th>
                  <th className="py-3 px-4">ভাউচার নং</th>
                  <th className="py-3 px-4">টাকা প্রাপ্তির উৎস</th>
                  <th className="py-3 px-4">খাত / ক্যাটাগরি</th>
                  <th className="py-3 px-4">বিবরণ</th>
                  <th className="py-3 px-4 text-right font-black">জমা টাকা (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {datewiseReceiveData.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                    <td className="py-2.5 px-4 font-semibold">{t.date}</td>
                    <td className="py-2.5 px-4 font-mono font-bold">{t.voucherNo}</td>
                    <td className="py-2.5 px-4 font-semibold">{t.partyName}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">{t.narration}</td>
                    <td className="py-2.5 px-4 text-right font-black text-emerald-600">+{formatBDT(t.amount || t.credit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Date-wise Expense Report */}
      {activeReport === 'datewise-expense' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800 flex justify-between items-center">
            <h3 className="text-sm font-black text-rose-900 dark:text-rose-300">
              ৩. তারিখভিত্তিক খরচ রিপোর্ট (Date-wise Expense Report)
            </h3>
            <span className="text-xs text-rose-700 font-semibold">{datewiseExpenseData.length} টি খরচ ভাউচার</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4">তারিখ</th>
                  <th className="py-3 px-4">ভাউচার নং</th>
                  <th className="py-3 px-4">খরচের খাত</th>
                  <th className="py-3 px-4">বিবরণ</th>
                  <th className="py-3 px-4">প্রাপক / সাপ্লায়ার</th>
                  <th className="py-3 px-4 text-right font-black">খরচের টাকা (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {datewiseExpenseData.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                    <td className="py-2.5 px-4 font-semibold">{t.date}</td>
                    <td className="py-2.5 px-4 font-mono font-bold">{t.voucherNo}</td>
                    <td className="py-2.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">{t.narration}</td>
                    <td className="py-2.5 px-4">{t.partyName || '-'}</td>
                    <td className="py-2.5 px-4 text-right font-black text-rose-600">−{formatBDT(t.amount || t.debit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Category-wise Income Report */}
      {activeReport === 'categorywise-income' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              ৪. খাতভিত্তিক আয় রিপোর্ট (Category-wise Income Summary)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4">আয়ের খাত (Income Category)</th>
                  <th className="py-3 px-4 text-center">ভাউচার সংখ্যা</th>
                  <th className="py-3 px-4 text-right">শতাংশ (%)</th>
                  <th className="py-3 px-4 text-right font-black">মোট জমা টাকা (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {categorywiseIncomeData.map((c) => (
                  <tr key={c.category} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{c.category}</td>
                    <td className="py-3 px-4 text-center">{c.count} টি</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-500">{c.percentage}%</td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600 text-sm">+{formatBDT(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Category-wise Expense Report */}
      {activeReport === 'categorywise-expense' && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              ৫. খাতভিত্তিক ব্যয় রিপোর্ট (Category-wise Expense Summary)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4">খরচের খাত (Expense Category)</th>
                  <th className="py-3 px-4 text-center">ভাউচার সংখ্যা</th>
                  <th className="py-3 px-4 text-right">শতাংশ (%)</th>
                  <th className="py-3 px-4 text-right font-black">মোট খরচ টাকা (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {categorywiseExpenseData.map((c) => (
                  <tr key={c.category} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">{c.category}</td>
                    <td className="py-3 px-4 text-center">{c.count} টি</td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-500">{c.percentage}%</td>
                    <td className="py-3 px-4 text-right font-black text-rose-600 text-sm">−{formatBDT(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6 & 7. Monthly Debit & Credit / Cash Balance Report */}
      {(activeReport === 'monthly-debit-credit' || activeReport === 'monthly-cash-balance') && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {activeReport === 'monthly-debit-credit'
                ? '৬. মাসিক ডেবিট-ক্রেডিট সামারি (Monthly Debit & Credit Summary)'
                : '৭. মাসিক ক্যাশ ব্যালেন্স রিপোর্ট (Monthly Cash Balance Report)'}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                  <th className="py-3 px-4">মাস (Month)</th>
                  <th className="py-3 px-4 text-right">মাসের শুরুর ক্যাশ (Opening)</th>
                  <th className="py-3 px-4 text-right text-emerald-600 font-black">মোট জমা / Credit (+)</th>
                  <th className="py-3 px-4 text-right text-rose-600 font-black">মোট খরচ / Debit (−)</th>
                  <th className="py-3 px-4 text-right font-black text-indigo-700 dark:text-indigo-300">মাসের সমাপনী ব্যালেন্স (Closing)</th>
                  <th className="py-3 px-4 text-right">মাসিক তফাত (Net)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {monthlyReportData.map((m) => (
                  <tr key={m.month} className="hover:bg-slate-50 dark:hover:bg-slate-700/20">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{m.month}</td>
                    <td className="py-3 px-4 text-right font-mono">{formatBDT(m.opening)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">+{formatBDT(m.receive)}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-600">−{formatBDT(m.expense)}</td>
                    <td className="py-3 px-4 text-right font-black text-indigo-700 dark:text-indigo-300">{formatBDT(m.closing)}</td>
                    <td className={`py-3 px-4 text-right font-bold ${m.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {m.net >= 0 ? `+${formatBDT(m.net)}` : `−${formatBDT(Math.abs(m.net))}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
