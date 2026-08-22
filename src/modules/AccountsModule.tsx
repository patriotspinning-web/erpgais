import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Calendar,
  CalendarDays,
  FileText,
  Building2,
  DollarSign,
  PlusCircle,
  MinusCircle,
  Tag,
  Plus,
} from 'lucide-react';
import { AccountTransaction, AccountHead } from '../types';
import { DEFAULT_INCOME_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES } from '../data/seedData';
import { AccountsDashboard } from './accounts/AccountsDashboard';
import { ReceiveList } from './accounts/ReceiveList';
import { ExpenseList } from './accounts/ExpenseList';
import { DailyCashSummary } from './accounts/DailyCashSummary';
import { MonthlySummary } from './accounts/MonthlySummary';
import { AccountsReports } from './accounts/AccountsReports';
import { VoucherPrintModal } from './accounts/VoucherPrintModal';

interface AccountsModuleProps {
  subTab?: string;
  transactions?: AccountTransaction[];
  accountTransactions?: AccountTransaction[];
  setTransactions?: React.Dispatch<React.SetStateAction<AccountTransaction[]>>;
  setAccountTransactions?: React.Dispatch<React.SetStateAction<AccountTransaction[]>>;
  accountHeads?: AccountHead[];
  requestAdminAction?: (title: string, action: () => void) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

type TabKey = 'dashboard' | 'receive' | 'expense' | 'daily-summary' | 'monthly-summary' | 'reports';

export const AccountsModule: React.FC<AccountsModuleProps> = ({
  subTab = 'dashboard',
  transactions: propTransactions,
  accountTransactions: propAccTransactions,
  setTransactions: propSetTransactions,
  setAccountTransactions: propSetAccTransactions,
  requestAdminAction,
  showToast,
}) => {
  // Normalize transactions and setter
  const transactions = propTransactions || propAccTransactions || [];
  const setTransactions = propSetTransactions || propSetAccTransactions || (() => {});

  // Active Tab mapping
  const getNormalizedTab = (st: string): TabKey => {
    if (st === 'receive' || st === 'income') return 'receive';
    if (st === 'expense') return 'expense';
    if (st === 'daily-summary' || st === 'daily' || st === 'ledger') return 'daily-summary';
    if (st === 'monthly-summary' || st === 'monthly') return 'monthly-summary';
    if (st === 'reports') return 'reports';
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState<TabKey>(() => getNormalizedTab(subTab));

  useEffect(() => {
    setActiveTab(getNormalizedTab(subTab));
  }, [subTab]);

  // Income & Expense Category management with localStorage persistence
  const [incomeCategories, setIncomeCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('patriot_erp_income_categories');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return DEFAULT_INCOME_CATEGORIES;
  });

  const [expenseCategories, setExpenseCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('patriot_erp_expense_categories');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return DEFAULT_EXPENSE_CATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem('patriot_erp_income_categories', JSON.stringify(incomeCategories));
  }, [incomeCategories]);

  useEffect(() => {
    localStorage.setItem('patriot_erp_expense_categories', JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  const handleAddIncomeCategory = (newCat: string) => {
    if (!newCat.trim() || incomeCategories.includes(newCat.trim())) return;
    setIncomeCategories((prev) => [...prev, newCat.trim()]);
  };

  const handleAddExpenseCategory = (newCat: string) => {
    if (!newCat.trim() || expenseCategories.includes(newCat.trim())) return;
    setExpenseCategories((prev) => [...prev, newCat.trim()]);
  };

  // State for Print Modal
  const [selectedPrintVoucher, setSelectedPrintVoucher] = useState<AccountTransaction | null>(null);

  // State for quick open Add Modal
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Main Navigation Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-2 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'dashboard'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          ক্যাশ ড্যাশবোর্ড (Dashboard)
        </button>

        <button
          onClick={() => setActiveTab('receive')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'receive'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          টাকা Receive / জমা (Income)
        </button>

        <button
          onClick={() => setActiveTab('expense')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'expense'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          দৈনিক খরচ (Expense)
        </button>

        <button
          onClick={() => setActiveTab('daily-summary')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'daily-summary'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          দৈনিক ক্যাশ সামারি (Daily Cash)
        </button>

        <button
          onClick={() => setActiveTab('monthly-summary')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'monthly-summary'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          মাসিক হিসাব সামারি (Monthly Summary)
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'reports'
              ? 'bg-slate-800 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
          }`}
        >
          <FileText className="w-4 h-4" />
          সহজ রিপোর্টসমূহ (Reports)
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeTab === 'dashboard' && (
        <AccountsDashboard
          transactions={transactions}
          onOpenReceiveModal={() => {
            setActiveTab('receive');
            setIsReceiveModalOpen(true);
          }}
          onOpenExpenseModal={() => {
            setActiveTab('expense');
            setIsExpenseModalOpen(true);
          }}
          onViewVoucher={(t) => setSelectedPrintVoucher(t)}
          onNavigateTab={(t) => setActiveTab(t)}
        />
      )}

      {activeTab === 'receive' && (
        <ReceiveList
          transactions={transactions}
          setTransactions={setTransactions}
          incomeCategories={incomeCategories}
          onAddCategory={handleAddIncomeCategory}
          onViewVoucher={(t) => setSelectedPrintVoucher(t)}
          showToast={showToast}
          requestAdminAction={requestAdminAction}
          isModalOpenExternal={isReceiveModalOpen}
          setIsModalOpenExternal={setIsReceiveModalOpen}
        />
      )}

      {activeTab === 'expense' && (
        <ExpenseList
          transactions={transactions}
          setTransactions={setTransactions}
          expenseCategories={expenseCategories}
          onAddCategory={handleAddExpenseCategory}
          onViewVoucher={(t) => setSelectedPrintVoucher(t)}
          showToast={showToast}
          requestAdminAction={requestAdminAction}
          isModalOpenExternal={isExpenseModalOpen}
          setIsModalOpenExternal={setIsExpenseModalOpen}
        />
      )}

      {activeTab === 'daily-summary' && (
        <DailyCashSummary
          transactions={transactions}
          onViewVoucher={(t) => setSelectedPrintVoucher(t)}
          onOpenReceiveModal={() => {
            setActiveTab('receive');
            setIsReceiveModalOpen(true);
          }}
          onOpenExpenseModal={() => {
            setActiveTab('expense');
            setIsExpenseModalOpen(true);
          }}
        />
      )}

      {activeTab === 'monthly-summary' && (
        <MonthlySummary transactions={transactions} />
      )}

      {activeTab === 'reports' && (
        <AccountsReports
          transactions={transactions}
          incomeCategories={incomeCategories}
          expenseCategories={expenseCategories}
          onViewVoucher={(t) => setSelectedPrintVoucher(t)}
        />
      )}

      {/* Printable Money Receipt / Payment Voucher Modal */}
      <VoucherPrintModal
        voucher={selectedPrintVoucher}
        onClose={() => setSelectedPrintVoucher(null)}
      />
    </div>
  );
};
