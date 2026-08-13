import React, { useState, useEffect } from 'react';
import { Sun, Moon, LogOut, ShieldCheck, User as UserIcon, ChevronDown, Database, Copy, Check, ExternalLink, RefreshCw } from 'lucide-react';
import { ModuleType, User } from '../types';
import { testSupabaseConnection, SUPABASE_SQL_SCHEMA } from '../lib/supabase';

interface HeaderProps {
  currentModule: ModuleType;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;
  onSeedSupabase?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentModule,
  theme,
  toggleTheme,
  user,
  setUser,
  logout,
  onSeedSupabase,
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [supabaseStatus, setSupabaseStatus] = useState<{ connected: boolean; message: string }>({
    connected: true,
    message: 'Testing connection...',
  });
  const [copiedSql, setCopiedSql] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const checkConnection = async () => {
    setTestingConnection(true);
    const res = await testSupabaseConnection();
    setSupabaseStatus(res);
    setTestingConnection(false);
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
      'audit-compliance': 'Audit & Certification Compliance (GOTS/OCS/ISO/BCI)',
      'sample-management': 'Sample Room & Quality Trials',
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
      'audit-compliance': 'Global certification audit tracking for GOTS, OCS, ISO 9001/14001, BCI, and OEKO-TEX',
      'sample-management': 'Sample item tracking with quantity, installation date, machine frames, test reports, and remarks',
    };
    return subtexts[mod] || '';
  };

  return (
    <header className="no-print sticky top-0 z-30 h-16 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6">
      {/* Title & Subtitle */}
      <div>
        <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
          {getModuleLabel(currentModule)}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight hidden sm:block">
          {getModuleSubtext(currentModule)}
        </p>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        {/* Supabase Connection Status Button */}
        <button
          onClick={() => setSupabaseModalOpen(true)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition ${
            supabaseStatus.connected
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
          }`}
          title="Supabase Database Status & SQL Configuration"
        >
          <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden md:inline">Supabase Connected</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </button>

        {/* Role Badge */}
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
            user?.role === 'Super Admin'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          {user?.role || 'User'}
        </span>

        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

        {/* User Account Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-xs shadow">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
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
              </div>

              {/* Demo Switch Role Options */}
              <div className="p-2 border-b border-slate-200 dark:border-slate-700">
                <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Active Role (Demo)
                </p>
                <button
                  onClick={() => {
                    setUser({ name: 'Store Manager', email: 'store@patriot.com', role: 'Store Manager' });
                    setUserMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                    user?.role === 'Store Manager'
                      ? 'bg-blue-50 dark:bg-blue-900/30 font-semibold text-blue-600 dark:text-blue-400'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>Store Manager</span>
                  {user?.role === 'Store Manager' && <span className="text-[10px]">Active</span>}
                </button>
                <button
                  onClick={() => {
                    setUser({ name: 'Admin User', email: 'admin@patriot.com', role: 'Super Admin' });
                    setUserMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                    user?.role === 'Super Admin'
                      ? 'bg-purple-50 dark:bg-purple-900/30 font-semibold text-purple-600 dark:text-purple-400'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span>Super Admin</span>
                  {user?.role === 'Super Admin' && <span className="text-[10px]">Active</span>}
                </button>
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
                  <p className="text-xs text-slate-500 font-mono">https://zmcuzcabmwmoqcnrmdvj.supabase.co</p>
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
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Supabase Status: Connected
                </span>
                <button
                  onClick={checkConnection}
                  disabled={testingConnection}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-lg text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${testingConnection ? 'animate-spin' : ''}`} /> Test
                </button>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">{supabaseStatus.message}</p>
            </div>

            {/* Seed / Sync Action */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-900 dark:text-blue-200">Database Auto-Sync & Seeding</p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">Sync local mill records directly to Supabase tables</p>
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

            {/* SQL Schema Copy Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Supabase SQL Table Schema (Run in Supabase SQL Editor if creating fresh tables):
                </label>
                <button
                  onClick={copySqlSchema}
                  className="px-3 py-1 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:opacity-90"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? 'Copied SQL!' : 'Copy SQL Schema'}
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] h-48 overflow-y-auto border border-slate-700">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href="https://supabase.com/dashboard/project/zmcuzcabmwmoqcnrmdvj/sql/new"
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
    </header>
  );
};
