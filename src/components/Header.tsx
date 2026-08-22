import React, { useState, useEffect, useRef } from 'react';
import {
  Sun,
  Moon,
  LogOut,
  ShieldCheck,
  ChevronDown,
  Database,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Download,
  Upload,
  HardDrive,
  Key,
  Sliders,
  AlertTriangle,
  Users,
  Lock,
  Menu,
  Printer,
} from 'lucide-react';
import {
  ModuleType,
  User,
  CottonReceive,
  CottonIssue,
  SpareItem,
  SpareReceive,
  SpareIssue,
  YarnReceive,
  YarnIssue,
} from '../types';
import {
  testSupabaseConnection,
  SUPABASE_SQL_SCHEMA,
  getSavedSupabaseUrl,
  getSavedSupabaseKey,
  saveSupabaseConfig,
} from '../lib/supabase';
import { AuthModule } from './AuthModule';
import { GlobalSearchBar } from './GlobalSearchBar';
import { triggerAppPrint } from '../utils/printUtils';

interface HeaderProps {
  currentModule: ModuleType;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
  onSeedSupabase?: () => Promise<void> | void;
  onExportBackup?: () => void;
  onImportBackup?: (file: File) => void;
  onRestoreSeedData?: () => void;
  onClearAllData?: () => void;
  onToggleSidebar?: () => void;
  cottonReceives?: CottonReceive[];
  cottonIssues?: CottonIssue[];
  spareItems?: SpareItem[];
  spareReceives?: SpareReceive[];
  spareIssues?: SpareIssue[];
  yarnReceives?: YarnReceive[];
  yarnIssues?: YarnIssue[];
  onNavigate?: (module: ModuleType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentModule,
  theme,
  toggleTheme,
  user,
  setUser,
  logout,
  onSeedSupabase,
  onExportBackup,
  onImportBackup,
  onRestoreSeedData,
  onClearAllData,
  onToggleSidebar,
  cottonReceives,
  cottonIssues,
  spareItems,
  spareReceives,
  spareIssues,
  yarnReceives,
  yarnIssues,
  onNavigate,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{ connected: boolean; message: string }>({
    connected: true,
    message: 'Testing connection...',
  });
  const [copiedSql, setCopiedSql] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [isPushingSeed, setIsPushingSeed] = useState(false);
  const [urlInput, setUrlInput] = useState(getSavedSupabaseUrl());
  const [keyInput, setKeyInput] = useState(getSavedSupabaseKey());
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [configSavedNotice, setConfigSavedNotice] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const projectRef = (urlInput.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i)?.[1]) || 'uegrjghtheviiswgoiuy';
  const apiDashboardUrl = `https://supabase.com/dashboard/project/${projectRef}/settings/api`;
  const sqlDashboardUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  const checkConnection = async () => {
    setTestingConnection(true);
    const res = await testSupabaseConnection();
    setSupabaseStatus(res);
    setTestingConnection(false);
  };

  const handleSaveCredentials = async () => {
    if (!urlInput.trim() || !keyInput.trim()) return;
    saveSupabaseConfig(urlInput.trim(), keyInput.trim());
    setConfigSavedNotice(true);
    setTimeout(() => setConfigSavedNotice(false), 2500);
    await checkConnection();
  };

  const handlePushSeedClick = async () => {
    if (!onSeedSupabase || isPushingSeed) return;
    setIsPushingSeed(true);
    try {
      await onSeedSupabase();
    } finally {
      setTimeout(() => setIsPushingSeed(false), 1200);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const copySqlSchema = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 2000);
        return;
      }
    } catch (err) {
      console.warn('Clipboard write API unavailable or blocked in iframe:', err);
    }

    // Fallback using temporary textarea element
    try {
      const textArea = document.createElement('textarea');
      textArea.value = SUPABASE_SQL_SCHEMA;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        setCopiedSql(true);
        setTimeout(() => setCopiedSql(false), 2000);
      }
    } catch (fallbackErr) {
      console.error('Fallback copy failed:', fallbackErr);
    }
  };

  const downloadSqlFile = () => {
    const blob = new Blob([SUPABASE_SQL_SCHEMA], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'patriot-erp-supabase-schema.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportBackup) {
      onImportBackup(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getModuleLabel = (mod: ModuleType): string => {
    const labels: Record<ModuleType, string> = {
      dashboard: 'Executive Dashboard',
      'cotton-receive': 'Cotton Receive Entry',
      'cotton-issue': 'Issue Cotton (Mixing)',
      'cotton-stock': 'Cotton Live Stock Balance',
      'cotton-reports': 'Cotton Inventory Reports',
      'waste-receive': 'Wastage Receive Entry',
      'waste-issue': 'Wastage Issue (Challan)',
      'waste-stock': 'Wastage Live Stock',
      'waste-reports': 'Wastage Inventory Reports',
      'spare-items': 'Spare Parts Items Master',
      'spare-receive': 'Spare Receive (MRR)',
      'spare-issue': 'Spare Issue (SR)',
      'spare-stock': 'Spare Parts Live Stock',
      'spare-reports': 'Spare Parts Reports & Analytics',
      'yarn-receive': 'Yarn Production Receive',
      'yarn-issue': 'Yarn Delivery & Issue',
      'yarn-stock': 'Yarn Live Stock',
      'hvi-reports': 'HVI Quality Test Reports',
      'uster-reports': 'Uster Evenness Test Reports',
      'audit-compliance': 'Audit & Certification Compliance (GRS/GOTS/OCS/BCI/ISO)',
      'audit-dashboard': 'Audit & Compliance Dashboard Overview',
      'audit-receives': 'Certified Cotton & TC Inward Management',
      'audit-traceability': 'TC-wise Stock Control & Full Traceability',
      'audit-usages': 'Certified Cotton Consumption & Yarn Production',
      'audit-schedule': 'Audit Management & CAPA Resolution Tracker',
      'audit-certificates': 'Scope Certificates & Document Repository',
      'audit-reports': 'Audit & Compliance Official Reporting Hub',
      'sample-management': 'Sample Room & Quality Trials',
      'accounts-dashboard': 'Factory Cash Dashboard (ক্যাশ ড্যাশবোর্ড)',
      'accounts-receive': 'Money Receive / টাকা জমা Entry',
      'accounts-expense': 'Factory Daily Expense (দৈনিক খরচ)',
      'accounts-daily-summary': 'Daily Cash Summary Sheet (দৈনিক ক্যাশ সামারি)',
      'accounts-monthly-summary': 'Monthly Accounts Summary (মাসিক হিসাব সামারি)',
      'accounts-reports': 'Factory Accounts & Cash Reports (রিপোর্টসমূহ)',
      'accounts-vouchers': 'Factory Cash Dashboard (ক্যাশ ড্যাশবোর্ড)',
      'accounts-income': 'Money Receive / টাকা জমা Entry',
      'accounts-ledger': 'Daily Cash Summary Sheet (দৈনিক ক্যাশ সামারি)',
    };
    return labels[mod] || 'Patriot ERP';
  };

  const getModuleSubtext = (mod: ModuleType): string => {
    const subtexts: Record<ModuleType, string> = {
      dashboard: 'Real-time spinning mill production, stock levels, and quality metrics',
      'cotton-receive': 'Receive imported and local cotton bales (26 origins supported)',
      'cotton-issue': 'Issue cotton bales with auto-calculated weight based on lot average',
      'cotton-stock': 'Consignment and origin-wise cotton inventory balance',
      'cotton-reports': 'Daily & Monthly summaries, stock ledger, and PDF/Excel exports',
      'waste-receive': 'Receive mill waste from Ring, Rotor, Willow, and Party sources',
      'waste-issue': 'Issue wastage with auto-generated S R / Challan tracking',
      'waste-stock': 'Real-time wastage stock balance across 20+ categories',
      'waste-reports': 'Category-wise wastage movements and export summaries',
      'spare-items': 'Manage 1800+ spare items across 24 mill sections and 3 import/local sources',
      'spare-receive': 'Material Receive Report (MRR) entry for maintenance items',
      'spare-issue': 'Store Requisition (SR) issue tracking for mill machinery repairs',
      'spare-stock': 'Section-wise stock status with automated low-stock reorder alerts',
      'spare-reports': 'Section health, low stock inventory lists, and ledger exports',
      'yarn-receive': 'Receive finished Ring and Rotor yarn production into store',
      'yarn-issue': 'Deliver finished yarn to buyers with bag and weight verification',
      'yarn-stock': 'Count-wise finished yarn inventory balance',
      'hvi-reports': 'High Volume Instrument fiber quality parameters (Micronaire, Length, Strength, SCI)',
      'uster-reports': 'Uster yarn evenness, imperfecions (IPI), hairiness, and CSP tests',
      'audit-compliance': 'Global certification audit tracking for GRS, GOTS, OCS, ISO 9001/14001, BCI, and OEKO-TEX',
      'audit-dashboard': 'Standard-wise live stock summary, expiring certificates alerts, and quick actions',
      'audit-receives': 'TC-wise certified cotton receipts, origin, lot, bales, and certification documents',
      'audit-traceability': 'End-to-end chain-of-custody mass balance ledger and TC stock reconciliation',
      'audit-usages': 'Buyer and party-wise certified cotton consumption, yarn conversion, and wastage %',
      'audit-schedule': 'Surveillance audit schedule, certifying bodies, non-conformities, and CAPA resolution',
      'audit-certificates': 'Scope certificates validity periods, license numbers, and renewal alerts',
      'audit-reports': '10 Official audit statements for third-party certifying bodies, brand buyers, and ESG compliance',
      'sample-management': 'Sample item tracking with quantity, installation date, machine frames, test reports, and remarks',
      'accounts-dashboard': 'আজকের শুরু ক্যাশ, মোট জমা, মোট খরচ, সমাপনী ক্যাশ এবং চলতি ব্যালেন্স ট্র্যাকিং',
      'accounts-receive': 'হেড অফিস ফান্ড, ওয়েস্টেজ, সবজি, মাছ, স্ক্র্যাপ বিক্রয় ও অন্যান্য আয় এন্ট্রি',
      'accounts-expense': 'বেতন, মেইনটেন্যান্স, লোকাল ক্রয়, পরিবহন, লেবার ও অফিসসহ সকল ক্যাশ খরচ এন্ট্রি',
      'accounts-daily-summary': 'দিনের শুরুর ব্যালেন্স + আজকের জমা - আজকের খরচ = সমাপনী ব্যালেন্স ও দৈনিক শিট',
      'accounts-monthly-summary': 'মাসের মোট ডেবিট-ক্রেডিট হিসাব, দিনভিত্তিক ক্যাশ বিবরণী এবং ক্লোজিং ব্যালেন্স',
      'accounts-reports': 'দৈনিক ক্যাশ, তারিখভিত্তিক জমা/খরচ, খাতভিত্তিক আয়/ব্যয় এবং মাসিক সামারি রিপোর্ট',
      'accounts-vouchers': 'আজকের শুরু ক্যাশ, মোট জমা, মোট খরচ, সমাপনী ক্যাশ এবং চলতি ব্যালেন্স ট্র্যাকিং',
      'accounts-income': 'হেড অফিস ফান্ড, ওয়েস্টেজ, সবজি, মাছ, স্ক্র্যাপ বিক্রয় ও অন্যান্য আয় এন্ট্রি',
      'accounts-ledger': 'দিনের শুরুর ব্যালেন্স + আজকের জমা - আজকের খরচ = সমাপনী ব্যালেন্স ও দৈনিক শিট',
    };
    return subtexts[mod] || '';
  };

  return (
    <header className="no-print sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-3 sm:px-6">
      {/* Title & Mobile Toggle */}
      <div className="flex items-center gap-2.5 min-w-0 pr-2">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition flex-shrink-0 cursor-pointer"
            aria-label="Open Navigation Menu"
            title="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
            {getModuleLabel(currentModule)}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight hidden sm:block truncate">
            {getModuleSubtext(currentModule)}
          </p>
        </div>
      </div>

      {/* Global Search Bar */}
      {onNavigate && (
        <div className="flex-1 max-w-lg mx-2 lg:mx-6 flex justify-center">
          <GlobalSearchBar
            cottonReceives={cottonReceives}
            cottonIssues={cottonIssues}
            spareItems={spareItems}
            spareReceives={spareReceives}
            spareIssues={spareIssues}
            yarnReceives={yarnReceives}
            yarnIssues={yarnIssues}
            onNavigate={onNavigate}
          />
        </div>
      )}

      {/* Header Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        {/* Direct Push Seed Data Button (Super Admin Only) */}
        {user?.role === 'Super Admin' && onSeedSupabase && (
          <button
            onClick={handlePushSeedClick}
            disabled={isPushingSeed}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 border shadow-sm transition ${
              isPushingSeed
                ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 border-blue-300'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 border-transparent shadow-blue-500/20 active:scale-95'
            }`}
            title="Push and sync all local mill data to Supabase Cloud Database (Super Admin only)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isPushingSeed ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isPushingSeed ? 'Pushing Data...' : 'Push Seed Data'}</span>
          </button>
        )}

        {/* Auto Sync Indicator (Super Admin Only Clickable) */}
        {user?.role === 'Super Admin' ? (
          <div
            onClick={() => setSupabaseModalOpen(true)}
            className="cursor-pointer px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 sm:gap-2 border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
            title="Auto-Sync active (Super Admin: Click to view/manage DB settings & schema)"
          >
            <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden lg:inline text-[11px]">Auto Sync</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        ) : (
          <div
            className="px-2 sm:px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 sm:gap-2 border bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 select-none cursor-default"
            title="Real-time Cloud Sync is Active"
          >
            <Database className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden lg:inline text-[11px]">Sync Active</span>
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
        )}

        {/* Role Badge */}
        <span
          className={`hidden sm:flex px-2.5 py-1 rounded-full text-xs font-semibold items-center gap-1 ${
            user?.role === 'Super Admin'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          {user?.role || 'User'}
        </span>

        {/* Print Report Trigger */}
        <button
          onClick={() => triggerAppPrint()}
          className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 flex items-center gap-1.5 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer"
          title="Print Active Module / Report (Ctrl+P / ⌘P)"
          aria-label="Print Report"
        >
          <Printer className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">Print</span>
        </button>

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Account Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-1.5 p-1 sm:p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs shadow">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden xs:block" />
          </button>

          {userMenuOpen && (
            <div
              onClick={() => setUserMenuOpen(false)}
              className="fixed inset-0 z-40"
            />
          )}

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
                <p className="text-sm font-bold text-slate-900 dark:text-white">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  {user?.role}
                </div>
              </div>

              {/* Account Actions */}
              <div className="p-2 border-b border-slate-200 dark:border-slate-700 space-y-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition"
                >
                  <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Change Password</span>
                </button>

                {user?.role === 'Super Admin' && (
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setAuthModalOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 flex items-center gap-2 transition"
                  >
                    <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Manage User Accounts</span>
                  </button>
                )}
              </div>

              <div className="p-2">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Supabase Status & SQL Schema Modal */}
      {supabaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-2xl text-emerald-600 dark:text-emerald-400">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Supabase Cloud Connection</h3>
                  <p className="text-xs text-slate-500 font-mono">{urlInput}</p>
                </div>
              </div>
              <button
                onClick={() => setSupabaseModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"
              >
                ✕
              </button>
            </div>

            {/* Connection Status Panel */}
            <div className={`p-4 rounded-2xl space-y-2 border ${
              supabaseStatus.connected && !supabaseStatus.message.includes('Error') && !supabaseStatus.message.includes('NetworkError')
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold flex items-center gap-1.5 ${
                  supabaseStatus.connected && !supabaseStatus.message.includes('Error') && !supabaseStatus.message.includes('NetworkError')
                    ? 'text-emerald-800 dark:text-emerald-300'
                    : 'text-amber-800 dark:text-amber-300'
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    supabaseStatus.connected && !supabaseStatus.message.includes('Error') && !supabaseStatus.message.includes('NetworkError')
                      ? 'bg-emerald-500'
                      : 'bg-amber-500 animate-ping'
                  }`}></span>
                  {supabaseStatus.connected && !supabaseStatus.message.includes('Error') && !supabaseStatus.message.includes('NetworkError')
                    ? 'Supabase Status: Connected'
                    : 'Supabase Status: Attention Needed'}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowKeyConfig(!showKeyConfig)}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1"
                  >
                    <Sliders className="w-3 h-3" /> {showKeyConfig ? 'Hide Config' : 'Edit Credentials'}
                  </button>
                  <button
                    onClick={checkConnection}
                    disabled={testingConnection}
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-lg text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${testingConnection ? 'animate-spin' : ''}`} /> Test
                  </button>
                </div>
              </div>
              <p className={`text-xs ${
                supabaseStatus.connected && !supabaseStatus.message.includes('Error') && !supabaseStatus.message.includes('NetworkError')
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-amber-700 dark:text-amber-300'
              }`}>{supabaseStatus.message}</p>
            </div>

            {/* Editable API Credentials Box */}
            {showKeyConfig && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    Supabase Project API Credentials
                  </p>
                  <a
                    href={apiDashboardUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Get Anon Key from Dashboard <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Supabase Project URL
                    </label>
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://your-project.supabase.co"
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Supabase Public / Anon API Key
                    </label>
                    <input
                      type="text"
                      value={keyInput}
                      onChange={(e) => setKeyInput(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <p className="text-[11px] text-slate-500">
                    💡 You can find this in Supabase Dashboard → <b>Project Settings → API → anon/public key</b>.
                  </p>
                  <button
                    onClick={handleSaveCredentials}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    {configSavedNotice ? <Check className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    {configSavedNotice ? 'Saved & Reconnected!' : 'Save & Reconnect'}
                  </button>
                </div>
              </div>
            )}

            {/* Backup & Restore Action */}
            <div className="p-4 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Offline Backup & Migration
                  </p>
                  <p className="text-[11px] text-purple-700 dark:text-purple-300">
                    Download full mill data as JSON file or restore onto any computer/browser
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {onExportBackup && (
                  <button
                    onClick={onExportBackup}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download JSON Backup
                  </button>
                )}
                {onImportBackup && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileInputChange}
                      accept=".json"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Restore from JSON Backup
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Seed / Sync Action */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-900 dark:text-blue-200">Database Auto-Sync & Seeding</p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">Sync all local mill records directly to Supabase tables</p>
              </div>
              {onSeedSupabase && (
                <button
                  onClick={() => {
                    onSeedSupabase();
                    checkConnection();
                  }}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  Push Seed Data
                </button>
              )}
            </div>

            {/* Restore Full Mill Dataset Action */}
            {onRestoreSeedData && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Load All Default Mill Records</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">Populate all modules with standard Patriot Spinning Mills records</p>
                </div>
                <button
                  onClick={onRestoreSeedData}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Load All Data
                </button>
              </div>
            )}

            {/* Clear All Data Option */}
            {onClearAllData && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-rose-900 dark:text-rose-200">Wipe & Clear All Data</p>
                  <p className="text-[11px] text-rose-700 dark:text-rose-300">Empty all modules (Cotton, Wastage, Spares, Yarn, Quality & Samples)</p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to clear all data from all modules? This will reset all tables to empty.')) {
                      onClearAllData();
                    }
                  }}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  Clear All Data
                </button>
              </div>
            )}

            {/* SQL Schema Copy Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Supabase SQL Table Schema (Run in Supabase SQL Editor if creating fresh tables):
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={downloadSqlFile}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-slate-200"
                    title="Download as .sql file"
                  >
                    <Download className="w-3 h-3" /> .SQL File
                  </button>
                  <button
                    onClick={copySqlSchema}
                    className="px-3 py-1 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:opacity-90"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSql ? 'Copied SQL!' : 'Copy SQL Schema'}
                  </button>
                </div>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] h-48 overflow-y-auto border border-slate-700">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={sqlDashboardUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
              >
                Open Supabase SQL Editor <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setSupabaseModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Authentication & Password Management Modal */}
      <AuthModule
        currentUser={user}
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onUserUpdated={(updatedUser) => setUser(updatedUser)}
      />
    </header>
  );
};
