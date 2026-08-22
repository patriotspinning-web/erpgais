import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  PlusCircle,
  MinusCircle,
  Printer,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart as PieChartIcon,
  Tag,
  CheckCircle2,
  Clock,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { AccountTransaction } from '../../types';
import { triggerAppPrint } from '../../utils/printUtils';

interface AccountsDashboardProps {
  transactions: AccountTransaction[];
  onOpenReceiveModal: () => void;
  onOpenExpenseModal: () => void;
  onViewVoucher: (t: AccountTransaction) => void;
  onNavigateTab: (tab: 'receive' | 'expense' | 'daily-summary' | 'monthly-summary' | 'reports') => void;
}

export const AccountsDashboard: React.FC<AccountsDashboardProps> = ({
  transactions,
  onOpenReceiveModal,
  onOpenExpenseModal,
  onViewVoucher,
  onNavigateTab,
}) => {
  // Current date & active month calculations
  const todayStr = new Date().toISOString().split('T')[0]; // e.g. 2026-08-22
  const currentMonthStr = todayStr.substring(0, 7); // e.g. 2026-08

  // Calculate Today's metrics
  const openingCashToday = transactions
    .filter((t) => t.date < todayStr)
    .reduce((acc, t) => {
      const isReceive = t.voucherType === 'Receive' || t.voucherType === 'Receipt' || (t.credit > 0 && t.debit === 0);
      return isReceive ? acc + (t.amount || t.credit) : acc - (t.amount || t.debit);
    }, 0);

  const todayTransactions = transactions.filter((t) => t.date === todayStr);

  const todayReceive = todayTransactions
    .filter((t) => t.voucherType === 'Receive' || t.voucherType === 'Receipt' || (t.credit > 0 && t.debit === 0))
    .reduce((acc, t) => acc + (t.amount || t.credit), 0);

  const todayExpense = todayTransactions
    .filter((t) => t.voucherType === 'Expense' || t.voucherType === 'Payment' || (t.debit > 0 && t.credit === 0))
    .reduce((acc, t) => acc + (t.amount || t.debit), 0);

  const todayClosingCash = openingCashToday + todayReceive - todayExpense;

  // Calculate This Month metrics
  const monthTransactions = transactions.filter((t) => t.date.startsWith(currentMonthStr));

  const thisMonthReceive = monthTransactions
    .filter((t) => t.voucherType === 'Receive' || t.voucherType === 'Receipt' || (t.credit > 0 && t.debit === 0))
    .reduce((acc, t) => acc + (t.amount || t.credit), 0);

  const thisMonthExpense = monthTransactions
    .filter((t) => t.voucherType === 'Expense' || t.voucherType === 'Payment' || (t.debit > 0 && t.credit === 0))
    .reduce((acc, t) => acc + (t.amount || t.debit), 0);

  // Lifetime Current Cash Balance
  const totalAllReceive = transactions
    .filter((t) => t.voucherType === 'Receive' || t.voucherType === 'Receipt' || (t.credit > 0 && t.debit === 0))
    .reduce((acc, t) => acc + (t.amount || t.credit), 0);

  const totalAllExpense = transactions
    .filter((t) => t.voucherType === 'Expense' || t.voucherType === 'Payment' || (t.debit > 0 && t.credit === 0))
    .reduce((acc, t) => acc + (t.amount || t.debit), 0);

  const currentCashBalance = totalAllReceive - totalAllExpense;

  const formatBDT = (val: number) =>
    '৳ ' + Math.round(val || 0).toLocaleString('en-US');

  // Category aggregations for visual distribution
  const incomeByCategory: Record<string, number> = {};
  const expenseByCategory: Record<string, number> = {};

  transactions.forEach((t) => {
    const isReceive = t.voucherType === 'Receive' || t.voucherType === 'Receipt' || (t.credit > 0 && t.debit === 0);
    const cat = t.category || 'Other';
    const amt = t.amount || (isReceive ? t.credit : t.debit) || 0;
    if (isReceive) {
      incomeByCategory[cat] = (incomeByCategory[cat] || 0) + amt;
    } else {
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + amt;
    }
  });

  const sortedIncomeCategories = Object.entries(incomeByCategory).sort((a, b) => b[1] - a[1]);
  const sortedExpenseCategories = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);

  // Recent 10 transactions sorted descending
  const recentTransactions = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 8);

  return (
    <div className="space-y-6">
      {/* Top Banner / Quick Action Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 rounded-2xl shadow-lg border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Factory Cash Desk
            </span>
            <span className="text-xs text-slate-400 font-medium">Patriot Spinning Mills Ltd.</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight mt-1 text-white">
            দৈনিক ফ্যাক্টরি ক্যাশ ড্যাশবোর্ড <span className="text-slate-400 font-normal text-base">(Daily Cash Manager)</span>
          </h2>
          <p className="text-xs text-slate-300 mt-0.5">
            আজকের তারিখ: <strong className="text-white">{todayStr}</strong> | সরাসরি ক্যাশ জমা, খরচ ও ব্যালেন্স ট্র্যাকিং
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={onOpenReceiveModal}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition"
          >
            <PlusCircle className="w-4 h-4" />
            + টাকা জমা (Receive)
          </button>
          <button
            onClick={onOpenExpenseModal}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition"
          >
            <MinusCircle className="w-4 h-4" />
            + দৈনিক খরচ (Expense)
          </button>
          <button
            onClick={() => triggerAppPrint()}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-600 transition"
            title="Print Dashboard Summary"
          >
            <Printer className="w-4 h-4" />
            প্রিন্ট শিট
          </button>
        </div>
      </div>

      {/* 7 PRIMARY DASHBOARD KPI CARDS (Required by prompt) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* 1. Today's Opening Cash */}
        <div className="bg-white dark:bg-slate-800/90 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
            Today's Opening Cash
          </span>
          <span className="text-[10px] text-slate-400 block mb-1">আজকের শুরুর ক্যাশ</span>
          <div className="text-sm md:text-base font-bold text-slate-800 dark:text-slate-100 truncate">
            {formatBDT(openingCashToday)}
          </div>
        </div>

        {/* 2. Today's Receive */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 rounded-xl p-3.5 border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 truncate">
              Today's Receive
            </span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block mb-1">আজকের মোট জমা (+)</span>
          <div className="text-sm md:text-base font-black text-emerald-700 dark:text-emerald-300 truncate">
            {formatBDT(todayReceive)}
          </div>
        </div>

        {/* 3. Today's Expense */}
        <div className="bg-rose-50/70 dark:bg-rose-950/20 rounded-xl p-3.5 border border-rose-200 dark:border-rose-800/50 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 truncate">
              Today's Expense
            </span>
            <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
          </div>
          <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 block mb-1">আজকের মোট খরচ (-)</span>
          <div className="text-sm md:text-base font-black text-rose-700 dark:text-rose-300 truncate">
            {formatBDT(todayExpense)}
          </div>
        </div>

        {/* 4. Today's Closing Cash */}
        <div className="bg-blue-50/70 dark:bg-blue-950/30 rounded-xl p-3.5 border border-blue-200 dark:border-blue-800/60 shadow-sm">
          <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 block truncate">
            Today's Closing Cash
          </span>
          <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 block mb-1">আজকের সমাপনী ক্যাশ</span>
          <div className="text-sm md:text-base font-black text-blue-900 dark:text-blue-200 truncate">
            {formatBDT(todayClosingCash)}
          </div>
        </div>

        {/* 5. This Month Total Receive */}
        <div className="bg-white dark:bg-slate-800/90 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block truncate">
            Month Total Receive
          </span>
          <span className="text-[10px] text-slate-400 block mb-1">চলতি মাসের জমা</span>
          <div className="text-sm md:text-base font-bold text-emerald-600 dark:text-emerald-400 truncate">
            {formatBDT(thisMonthReceive)}
          </div>
        </div>

        {/* 6. This Month Total Expense */}
        <div className="bg-white dark:bg-slate-800/90 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block truncate">
            Month Total Expense
          </span>
          <span className="text-[10px] text-slate-400 block mb-1">চলতি মাসের খরচ</span>
          <div className="text-sm md:text-base font-bold text-rose-600 dark:text-rose-400 truncate">
            {formatBDT(thisMonthExpense)}
          </div>
        </div>

        {/* 7. Current Cash Balance */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-900 text-white rounded-xl p-3.5 border border-indigo-500/30 shadow-md col-span-2 md:col-span-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-indigo-200 truncate">
              Current Cash Balance
            </span>
            <Wallet className="w-3.5 h-3.5 text-indigo-300" />
          </div>
          <span className="text-[10px] text-indigo-200/80 block mb-1">বর্তমান মোট ব্যালেন্স</span>
          <div className="text-base font-black text-emerald-300 truncate">
            {formatBDT(currentCashBalance)}
          </div>
        </div>
      </div>

      {/* CORE FORMULA BANNER */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
          Daily Cash Calculation Engine / দৈনিক ক্যাশ হিসাব ফর্মুলা
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Opening Cash:</span>
            <span className="font-bold text-slate-900 dark:text-white">{formatBDT(openingCashToday)}</span>
          </div>
          <span className="font-bold text-emerald-600 text-lg">+</span>
          <div className="flex items-center gap-2">
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Today's Receive (জমা):</span>
            <span className="font-bold text-emerald-600">{formatBDT(todayReceive)}</span>
          </div>
          <span className="font-bold text-rose-600 text-lg">−</span>
          <div className="flex items-center gap-2">
            <span className="text-rose-700 dark:text-rose-400 font-semibold">Today's Expense (খরচ):</span>
            <span className="font-bold text-rose-600">{formatBDT(todayExpense)}</span>
          </div>
          <span className="font-bold text-slate-600 text-lg">=</span>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold shadow-sm">
            <span>Closing Cash Balance:</span>
            <span>{formatBDT(todayClosingCash)}</span>
          </div>
        </div>
      </div>

      {/* TWO COLUMN CATEGORY VISUALS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Income Sources Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-lg">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">টাকা আসার উৎস (Income Sources)</h3>
                <p className="text-[11px] text-slate-500">Head Office Fund, Wastage, Vegetable, Fish & Scrap Sale</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('receive')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
            >
              সব দেখুন →
            </button>
          </div>

          <div className="space-y-2.5">
            {sortedIncomeCategories.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">কোন জমা এন্ট্রি নেই</div>
            ) : (
              sortedIncomeCategories.map(([cat, amt]) => {
                const pct = totalAllReceive > 0 ? ((amt / totalAllReceive) * 100).toFixed(1) : '0';
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">{cat}</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                        {formatBDT(amt)} <span className="text-[10px] text-slate-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(5, Number(pct)))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-100 dark:bg-rose-950/40 text-rose-600 rounded-lg">
                <TrendingDown className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">দৈনিক খরচের খাত (Expense Breakdown)</h3>
                <p className="text-[11px] text-slate-500">Salary, Maintenance, Purchase, Loading/Unloading, Food</p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('expense')}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700"
            >
              সব দেখুন →
            </button>
          </div>

          <div className="space-y-2.5">
            {sortedExpenseCategories.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">কোন খরচ এন্ট্রি নেই</div>
            ) : (
              sortedExpenseCategories.slice(0, 6).map(([cat, amt]) => {
                const pct = totalAllExpense > 0 ? ((amt / totalAllExpense) * 100).toFixed(1) : '0';
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700 dark:text-slate-300 font-semibold">{cat}</span>
                      <span className="text-rose-700 dark:text-rose-400 font-bold">
                        {formatBDT(amt)} <span className="text-[10px] text-slate-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(5, Number(pct)))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* RECENT TRANSACTIONS TABLE */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">সাম্প্রতিক লেনদেন তালিকা (Recent Transactions)</h3>
            <p className="text-xs text-slate-500">সর্বশেষ ক্যাশ জমা ও খরচ এন্ট্রি</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('daily-summary')}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition"
            >
              দৈনিক ক্যাশ শিট দেখুন
            </button>
            <button
              onClick={() => onNavigateTab('monthly-summary')}
              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 rounded-lg text-xs font-semibold transition"
            >
              মাসিক হিসাব দেখুন
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-3">তারিখ</th>
                <th className="py-2.5 px-3">ভাউচার নং</th>
                <th className="py-2.5 px-3">ধরণ</th>
                <th className="py-2.5 px-3">খাত / ক্যাটাগরি</th>
                <th className="py-2.5 px-3">উৎস / প্রাপক</th>
                <th className="py-2.5 px-3">বিবরণ</th>
                <th className="py-2.5 px-3 text-right">টাকা (BDT)</th>
                <th className="py-2.5 px-3 text-center">রসিদ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60">
              {recentTransactions.map((t) => {
                const isReceive = t.voucherType === 'Receive' || t.voucherType === 'Receipt' || (t.credit > 0 && t.debit === 0);
                return (
                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">{t.date}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">{t.voucherNo}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                        isReceive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}>
                        {isReceive ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {isReceive ? 'জমা (Receive)' : 'খরচ (Expense)'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">{t.category}</td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{t.partyName || '-'}</td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-[200px] truncate" title={t.narration}>{t.narration}</td>
                    <td className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${isReceive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {isReceive ? `+ ${formatBDT(t.amount)}` : `− ${formatBDT(t.amount)}`}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => onViewVoucher(t)}
                        className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition"
                        title="View Print Slip"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
