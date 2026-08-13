import React from 'react';
import {
  Factory,
  LayoutDashboard,
  PackagePlus,
  PackageMinus,
  Archive,
  FileBarChart,
  FileSpreadsheet,
  Database,
  Microscope,
  TestTube,
  ShieldCheck,
  Boxes,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from 'lucide-react';
import { ModuleType, User } from '../types';

interface SidebarProps {
  currentModule: ModuleType;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  navigate: (mod: ModuleType) => void;
  user: User | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentModule,
  sidebarOpen,
  setSidebarOpen,
  navigate,
  user,
}) => {
  const isNavActive = (mod: ModuleType) => currentModule === mod;

  return (
    <aside
      className={`no-print fixed left-0 top-0 h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 z-40 flex flex-col ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
            <Factory className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="transition-opacity duration-200">
              <h1 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                Patriot ERP
              </h1>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-tight">
                Spinning Mill
              </p>
            </div>
          )}
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
          title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
        {/* Dashboard */}
        <button
          onClick={() => navigate('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
            isNavActive('dashboard')
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
          {sidebarOpen && <span>Dashboard</span>}
        </button>

        {/* SECTION: Cotton Inventory */}
        <div className="pt-2">
          {sidebarOpen && (
            <div className="px-3 pb-1 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Cotton Inventory
              </span>
            </div>
          )}
          <div className="space-y-0.5">
            <button
              onClick={() => navigate('cotton-receive')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isNavActive('cotton-receive')
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <PackagePlus className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Cotton Receive</span>}
            </button>
            <button
              onClick={() => navigate('cotton-issue')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isNavActive('cotton-issue')
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <PackageMinus className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Issue Cotton</span>}
            </button>
            <button
              onClick={() => navigate('cotton-stock')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isNavActive('cotton-stock')
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <Archive className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Cotton Stock</span>}
            </button>
            <button
              onClick={() => navigate('cotton-reports')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isNavActive('cotton-reports')
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <FileBarChart className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Cotton Reports</span>}
            </button>
          </div>
        </div>

        {/* SECTION: Wastage Management */}
        <div className="pt-2">
          {sidebarOpen && (
            <div className="px-3 pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                Wastage Management
              </span>
            </div>
          )}
          <div className="space-y-0.5">
            <button
              onClick={() => navigate('waste-receive')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isNavActive('waste-receive')
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <PackagePlus className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Wastage Receive</span>}
            </button>
            <button
              onClick={() => navigate('waste-issue')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isNavActive('waste-issue')
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <PackageMinus className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Wastage Issue</span>}
            </button>
            <button
              onClick={() => navigate('waste-stock')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isNavActive('waste-stock')
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <Archive className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Wastage Stock</span>}
            </button>
            <button
              onClick={() => navigate('waste-reports')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isNavActive('waste-reports')
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <FileBarChart className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Wastage Reports</span>}
            </button>
          </div>
        </div>

        {/* SECTION: Spare Parts */}
        <div className="pt-2">
          {sidebarOpen && (
            <div className="px-3 pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Spare Parts
              </span>
            </div>
          )}
          <div className="space-y-0.5">
            <button
              onClick={() => navigate('spare-items')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isNavActive('spare-items')
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <Database className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Items Master</span>}
            </button>
            <button
              onClick={() => navigate('spare-receive')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isNavActive('spare-receive')
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <PackagePlus className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Spare Receive</span>}
            </button>
            <button
              onClick={() => navigate('spare-issue')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isNavActive('spare-issue')
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <PackageMinus className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Spare Issue</span>}
            </button>
            <button
              onClick={() => navigate('spare-stock')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isNavActive('spare-stock')
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <Archive className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Spare Stock</span>}
            </button>
            <button
              onClick={() => navigate('spare-reports')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isNavActive('spare-reports')
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <FileBarChart className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Spare Reports</span>}
            </button>
          </div>
        </div>

        {/* SECTION: Yarn Inventory */}
        <div className="pt-2">
          {sidebarOpen && (
            <div className="px-3 pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Yarn Inventory
              </span>
            </div>
          )}
          <div className="space-y-0.5">
            <button
              onClick={() => navigate('yarn-receive')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isNavActive('yarn-receive')
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <PackagePlus className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Yarn Receive</span>}
            </button>
            <button
              onClick={() => navigate('yarn-issue')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isNavActive('yarn-issue')
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <PackageMinus className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Yarn Issue</span>}
            </button>
            <button
              onClick={() => navigate('yarn-stock')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isNavActive('yarn-stock')
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <Archive className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Yarn Stock</span>}
            </button>
          </div>
        </div>

        {/* SECTION: Quality Testing */}
        <div className="pt-2">
          {sidebarOpen && (
            <div className="px-3 pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Quality Testing
              </span>
            </div>
          )}
          <div className="space-y-0.5">
            <button
              onClick={() => navigate('hvi-reports')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isNavActive('hvi-reports')
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <Microscope className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>HVI Test Reports</span>}
            </button>
            <button
              onClick={() => navigate('uster-reports')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isNavActive('uster-reports')
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <TestTube className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Uster Test Reports</span>}
            </button>
          </div>
        </div>

        {/* SECTION: Audit & Compliance */}
        <div className="pt-2">
          {sidebarOpen && (
            <div className="px-3 pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Audit & Standards
              </span>
            </div>
          )}
          <div className="space-y-0.5">
            <button
              onClick={() => navigate('audit-compliance')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isNavActive('audit-compliance')
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Audit & Compliance (GOTS/ISO)</span>}
            </button>
          </div>
        </div>

        {/* SECTION: Sample Management */}
        <div className="pt-2">
          {sidebarOpen && (
            <div className="px-3 pb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Sample Room
              </span>
            </div>
          )}
          <div className="space-y-0.5">
            <button
              onClick={() => navigate('sample-management')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                isNavActive('sample-management')
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <Boxes className="w-4 h-4 flex-shrink-0" />
              {sidebarOpen && <span>Sample Management</span>}
            </button>
          </div>
        </div>
      </nav>

      {/* User Footer Card */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="flex items-center gap-3 p-2 rounded-xl">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm shadow">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          {sidebarOpen && (
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                {user?.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {user?.role}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
