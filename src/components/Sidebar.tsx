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
  X,
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

  const handleNav = (mod: ModuleType) => {
    navigate(mod);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="no-print fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-200"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`no-print fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-800 text-slate-200 transition-all duration-300 z-50 flex flex-col shadow-2xl ${
          sidebarOpen
            ? 'translate-x-0 w-72 md:w-64 max-w-[85vw]'
            : '-translate-x-full md:translate-x-0 md:w-20'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/30">
              <Factory className="w-5 h-5 text-white" />
            </div>
            {(sidebarOpen || typeof window !== 'undefined') && (
              <div className={`transition-opacity duration-200 ${sidebarOpen ? 'block' : 'hidden md:hidden'}`}>
                <h1 className="font-bold text-sm text-white leading-tight tracking-tight">
                  Patriot ERP
                </h1>
                <p className="text-[10px] font-medium text-slate-400 leading-tight">
                  Spinning Mill
                </p>
              </div>
            )}
          </div>

          {/* Desktop Collapse Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:flex p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition cursor-pointer"
            title={sidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
          >
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Close Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          {/* Dashboard */}
          <button
            onClick={() => handleNav('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              isNavActive('dashboard')
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            <span className={sidebarOpen ? 'block' : 'hidden md:hidden'}>Dashboard</span>
          </button>

          {/* SECTION: Cotton Inventory */}
          <div className="pt-2">
            <div className={`px-3 pb-1 flex items-center justify-between ${sidebarOpen ? 'block' : 'hidden md:hidden'}`}>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Cotton Inventory
              </span>
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => handleNav('cotton-receive')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isNavActive('cotton-receive')
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <PackagePlus className="w-4 h-4 flex-shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden md:hidden'}>Cotton Receive</span>
              </button>
              <button
                onClick={() => handleNav('cotton-issue')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isNavActive('cotton-issue')
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <PackageMinus className="w-4 h-4 flex-shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden md:hidden'}>Issue Cotton</span>
              </button>
              <button
                onClick={() => handleNav('cotton-stock')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isNavActive('cotton-stock')
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Archive className="w-4 h-4 flex-shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden md:hidden'}>Cotton Stock</span>
              </button>
              <button
                onClick={() => handleNav('cotton-reports')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isNavActive('cotton-reports')
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <FileBarChart className="w-4 h-4 flex-shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden md:hidden'}>Cotton Reports</span>
              </button>
            </div>
          </div>

          {/* SECTION: Wastage Management */}
          <div className="pt-2">
            <div className={`px-3 pb-1 ${sidebarOpen ? 'block' : 'hidden md:hidden'}`}>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
                Wastage Management
              </span>
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => handleNav('waste-receive')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isNavActive('waste-receive')
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <PackagePlus className="w-4 h-4 flex-shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden md:hidden'}>Wastage Receive</span>
              </button>
              <button
                onClick={() => handleNav('waste-issue')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isNavActive('waste-issue')
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <PackageMinus className="w-4 h-4 flex-shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden md:hidden'}>Wastage Issue</span>
              </button>
              <button
                onClick={() => handleNav('waste-stock')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isNavActive('waste-stock')
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Archive className="w-4 h-4 flex-shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden md:hidden'}>Wastage Stock</span>
              </button>
              <button
                onClick={() => handleNav('waste-reports')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isNavActive('waste-reports')
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <FileBarChart className="w-4 h-4 flex-shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden md:hidden'}>Wastage Reports</span>
              </button>
            </div>
          </div>

          {/* SECTION: Spare Parts */}
          <div className="pt-2">
            <div className={`px-3 pb-1 ${sidebarOpen ? 'block' : 'hidden md:hidden'}`}>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Spare Parts
              </span>
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => handleNav('spare-items')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isNavActive('spare-items')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Database className="w-4 h-4 flex-shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden md:hidden'}>Items Master</span>
              </button>
              <button
                onClick={() => handleNav('spare-receive')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isNavActive('spare-receive')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <PackagePlus className="w-4 h-4 flex-shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden md:hidden'}>Spare Receive</span>
              </button>
              <button
                onClick={() => handleNav('spare-issue')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isNavActive('spare-issue')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <PackageMinus className="w-4 h-4 flex-shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden md:hidden'}>Spare Issue</span>
              </button>
              <button
                onClick={() => handleNav('spare-stock')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isNavActive('spare-stock')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Archive className="w-4 h-4 flex-shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden md:hidden'}>Spare Stock</span>
              </button>
              <button
                onClick={() => handleNav('spare-reports')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isNavActive('spare-reports')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <FileBarChart className="w-4 h-4 flex-shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden md:hidden'}>Spare Reports</span>
              </button>
            </div>
          </div>

          {/* SECTION: Yarn Inventory */}
          <div className="pt-2">
            <div className={`px-3 pb-1 ${sidebarOpen ? 'block' : 'hidden md:hidden'}`}>
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                Yarn Inventory
              </span>
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => handleNav('yarn-receive')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isNavActive('yarn-receive')
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <PackagePlus className="w-4 h-4 flex-shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden md:hidden'}>Yarn Receive</span>
              </button>
              <button
                onClick={() => handleNav('yarn-issue')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isNavActive('yarn-issue')
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <PackageMinus className="w-4 h-4 flex-shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden md:hidden'}>Yarn Issue</span>
              </button>
              <button
                onClick={() => handleNav('yarn-stock')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isNavActive('yarn-stock')
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Archive className="w-4 h-4 flex-shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden md:hidden'}>Yarn Stock</span>
              </button>
            </div>
          </div>

          {/* SECTION: Quality Testing */}
          <div className="pt-2">
            <div className={`px-3 pb-1 ${sidebarOpen ? 'block' : 'hidden md:hidden'}`}>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">
                Quality Testing
              </span>
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => handleNav('hvi-reports')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isNavActive('hvi-reports')
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Microscope className="w-4 h-4 flex-shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden md:hidden'}>HVI Test Reports</span>
              </button>
              <button
                onClick={() => handleNav('uster-reports')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isNavActive('uster-reports')
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <TestTube className="w-4 h-4 flex-shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden md:hidden'}>Uster Test Reports</span>
              </button>
            </div>
          </div>

          {/* SECTION: Audit & Compliance */}
          <div className="pt-2">
            <div className={`px-3 pb-1 ${sidebarOpen ? 'block' : 'hidden md:hidden'}`}>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Audit & Standards
              </span>
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => handleNav('audit-compliance')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isNavActive('audit-compliance')
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden md:hidden'}>Audit & Compliance</span>
              </button>
            </div>
          </div>

          {/* SECTION: Sample Management */}
          <div className="pt-2">
            <div className={`px-3 pb-1 ${sidebarOpen ? 'block' : 'hidden md:hidden'}`}>
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                Sample Room
              </span>
            </div>
            <div className="space-y-0.5">
              <button
                onClick={() => handleNav('sample-management')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition ${
                  isNavActive('sample-management')
                    ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <Boxes className="w-4 h-4 flex-shrink-0" />
                <span className={sidebarOpen ? 'block' : 'hidden md:hidden'}>Sample Management</span>
              </button>
            </div>
          </div>
        </nav>

        {/* User Footer Card */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3 p-2 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold flex-shrink-0 text-sm shadow-md shadow-blue-600/20">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className={`flex-1 overflow-hidden ${sidebarOpen ? 'block' : 'hidden md:hidden'}`}>
              <p className="text-xs font-semibold text-white truncate">
                {user?.name}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.role}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

