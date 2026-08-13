import React, { useState, useEffect } from 'react';
import {
  Role,
  User,
  CottonReceive,
  CottonIssue,
  WasteReceive,
  WasteIssue,
  SpareItem,
  SpareReceive,
  SpareIssue,
  YarnReceive,
  YarnIssue,
  HVIReport,
  UsterReport,
  ToastMessage,
  ModuleType,
  AuditItem,
  SampleItem,
} from './types';
import {
  DEFAULT_COTTON_COUNTRIES,
  DEFAULT_WASTE_CATEGORIES,
  DEFAULT_SPARE_SECTIONS,
  SEED_COTTON_RECEIVES,
  SEED_COTTON_ISSUES,
  SEED_WASTE_RECEIVES,
  SEED_WASTE_ISSUES,
  SEED_SPARE_ITEMS,
  SEED_SPARE_RECEIVES,
  SEED_SPARE_ISSUES,
  SEED_YARN_RECEIVES,
  SEED_YARN_ISSUES,
  SEED_HVI_REPORTS,
  SEED_USTER_REPORTS,
  SEED_AUDIT_ITEMS,
  SEED_SAMPLE_ITEMS,
} from './data/seedData';

// Layout components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';
import { ToastContainer } from './components/ToastContainer';
import { AdminModal } from './components/AdminModal';

// ERP Modules
import { DashboardModule } from './modules/DashboardModule';
import { CottonModule } from './modules/CottonModule';
import { WastageModule } from './modules/WastageModule';
import { SpareModule } from './modules/SpareModule';
import { YarnModule } from './modules/YarnModule';
import { QualityModule } from './modules/QualityModule';
import { AuditModule } from './modules/AuditModule';
import { SampleModule } from './modules/SampleModule';

import {
  fetchCottonReceivesFromSupabase,
  syncCottonReceiveToSupabase,
  fetchCottonIssuesFromSupabase,
  syncCottonIssueToSupabase,
  fetchSpareItemsFromSupabase,
  syncSpareItemToSupabase,
  fetchAuditItemsFromSupabase,
  syncAuditItemToSupabase,
  fetchSampleItemsFromSupabase,
  syncSampleItemToSupabase,
  populateSupabaseWithInitialSeedData,
} from './lib/supabase';

export function App() {
  // Auth & Roles State
  const [user, setUser] = useState<User | null>({
    name: 'General Manager',
    email: 'admin@patriot.com',
    role: 'Super Admin',
  });
  const [userRole, setUserRole] = useState<Role>('Super Admin');

  // Sidebar Open State
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Theme State
  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Navigation State
  const [activeModule, setActiveModule] = useState<
    'dashboard' | 'cotton' | 'wastage' | 'spare' | 'yarn' | 'quality' | 'audit' | 'sample'
  >('dashboard');
  const [subTab, setSubTab] = useState<string>('receive');

  // System Notification Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Admin Security Authorization Modal
  const [adminModalState, setAdminModalState] = useState<{
    isOpen: boolean;
    title: string;
    action: (() => void) | null;
  }>({
    isOpen: false,
    title: '',
    action: null,
  });

  // ERP Domain State (Initialized with mill seed data)
  const [cottonCountries, setCottonCountries] = useState<string[]>(DEFAULT_COTTON_COUNTRIES);
  const [cottonReceives, setCottonReceives] = useState<CottonReceive[]>(SEED_COTTON_RECEIVES);
  const [cottonIssues, setCottonIssues] = useState<CottonIssue[]>(SEED_COTTON_ISSUES);

  const [wasteCategories, setWasteCategories] = useState<string[]>(DEFAULT_WASTE_CATEGORIES);
  const [wasteReceives, setWasteReceives] = useState<WasteReceive[]>(SEED_WASTE_RECEIVES);
  const [wasteIssues, setWasteIssues] = useState<WasteIssue[]>(SEED_WASTE_ISSUES);

  const [spareSections] = useState<string[]>(DEFAULT_SPARE_SECTIONS);
  const [spareItems, setSpareItems] = useState<SpareItem[]>(SEED_SPARE_ITEMS);
  const [spareReceives, setSpareReceives] = useState<SpareReceive[]>(SEED_SPARE_RECEIVES);
  const [spareIssues, setSpareIssues] = useState<SpareIssue[]>(SEED_SPARE_ISSUES);

  const [yarnReceives, setYarnReceives] = useState<YarnReceive[]>(SEED_YARN_RECEIVES);
  const [yarnIssues, setYarnIssues] = useState<YarnIssue[]>(SEED_YARN_ISSUES);

  const [hviReports, setHviReports] = useState<HVIReport[]>(SEED_HVI_REPORTS);
  const [usterReports, setUsterReports] = useState<UsterReport[]>(SEED_USTER_REPORTS);

  const [auditItems, setAuditItems] = useState<AuditItem[]>(SEED_AUDIT_ITEMS);
  const [sampleItems, setSampleItems] = useState<SampleItem[]>(SEED_SAMPLE_ITEMS);

  // Toggle Dark Mode Class on Document Elements
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load initial data from Supabase Cloud Database on boot
  useEffect(() => {
    async function loadSupabaseData() {
      try {
        const [crData, ciData, spData, auData, smData] = await Promise.all([
          fetchCottonReceivesFromSupabase(),
          fetchCottonIssuesFromSupabase(),
          fetchSpareItemsFromSupabase(),
          fetchAuditItemsFromSupabase(),
          fetchSampleItemsFromSupabase(),
        ]);

        if (crData && crData.length > 0) setCottonReceives(crData);
        if (ciData && ciData.length > 0) setCottonIssues(ciData);
        if (spData && spData.length > 0) setSpareItems(spData);
        if (auData && auData.length > 0) setAuditItems(auData);
        if (smData && smData.length > 0) setSampleItems(smData);
      } catch (err) {
        console.info('Supabase initial fetch notice:', err);
      }
    }

    loadSupabaseData();
  }, []);

  // Supabase Database Seed Handler
  const handleSeedSupabase = async () => {
    showToast('info', 'Supabase Syncing', 'Pushing local mill records to Supabase Cloud Database...');
    const result = await populateSupabaseWithInitialSeedData({
      cottonReceives,
      cottonIssues,
      spareItems,
      auditItems,
      sampleItems,
    });

    if (result.success) {
      showToast('success', 'Supabase Seeded', `Successfully synchronized ${result.count} records to Supabase!`);
    } else {
      showToast('error', 'Supabase Seed Error', result.error || 'Failed to seed tables. Ensure tables exist in SQL Editor.');
    }
  };

  // Wrapped State Setters that sync updates to Supabase
  const handleSetCottonReceives: React.Dispatch<React.SetStateAction<CottonReceive[]>> = (action) => {
    setCottonReceives((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      // Sync newly added or updated items to Supabase
      if (next.length > 0) {
        const latest = next[0];
        syncCottonReceiveToSupabase(latest);
      }
      return next;
    });
  };

  const handleSetCottonIssues: React.Dispatch<React.SetStateAction<CottonIssue[]>> = (action) => {
    setCottonIssues((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (next.length > 0) {
        const latest = next[0];
        syncCottonIssueToSupabase(latest);
      }
      return next;
    });
  };

  const handleSetSpareItems: React.Dispatch<React.SetStateAction<SpareItem[]>> = (action) => {
    setSpareItems((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (next.length > 0) {
        const latest = next[next.length - 1];
        syncSpareItemToSupabase(latest);
      }
      return next;
    });
  };

  const handleSetAuditItems: React.Dispatch<React.SetStateAction<AuditItem[]>> = (action) => {
    setAuditItems((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (next.length > 0) {
        const latest = next[0];
        syncAuditItemToSupabase(latest);
      }
      return next;
    });
  };

  const handleSetSampleItems: React.Dispatch<React.SetStateAction<SampleItem[]>> = (action) => {
    setSampleItems((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (next.length > 0) {
        const latest = next[0];
        syncSampleItemToSupabase(latest);
      }
      return next;
    });
  };

  // Helper to show toasts
  const showToast = (
    type: 'success' | 'error' | 'info',
    title: string,
    message: string
  ) => {
    const newToast: ToastMessage = {
      id: Date.now(),
      type,
      title,
      message,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Helper to trigger admin action modal
  const requestAdminAction = (title: string, action: () => void) => {
    if (userRole === 'Super Admin') {
      action();
    } else {
      setAdminModalState({
        isOpen: true,
        title,
        action,
      });
    }
  };

  // Derive current ModuleType for Header and Sidebar
  const getCurrentModule = (): ModuleType => {
    if (activeModule === 'dashboard') return 'dashboard';
    if (activeModule === 'cotton') return `cotton-${subTab}` as ModuleType;
    if (activeModule === 'wastage') return `waste-${subTab}` as ModuleType;
    if (activeModule === 'spare') return `spare-${subTab}` as ModuleType;
    if (activeModule === 'yarn') return `yarn-${subTab}` as ModuleType;
    if (activeModule === 'quality') return subTab === 'hvi' ? 'hvi-reports' : 'uster-reports';
    if (activeModule === 'audit') return 'audit-compliance';
    if (activeModule === 'sample') return 'sample-management';
    return 'dashboard';
  };

  // Navigate helper for Sidebar links & Dashboard shortcuts
  const handleNavigate = (mod: ModuleType) => {
    if (mod.startsWith('cotton-')) {
      setActiveModule('cotton');
      setSubTab(mod.replace('cotton-', ''));
    } else if (mod.startsWith('waste-')) {
      setActiveModule('wastage');
      setSubTab(mod.replace('waste-', ''));
    } else if (mod.startsWith('spare-')) {
      setActiveModule('spare');
      setSubTab(mod.replace('spare-', ''));
    } else if (mod.startsWith('yarn-')) {
      setActiveModule('yarn');
      setSubTab(mod.replace('yarn-', ''));
    } else if (mod === 'hvi-reports') {
      setActiveModule('quality');
      setSubTab('hvi');
    } else if (mod === 'uster-reports') {
      setActiveModule('quality');
      setSubTab('uster');
    } else if (mod === 'audit-compliance') {
      setActiveModule('audit');
      setSubTab('compliance');
    } else if (mod === 'sample-management') {
      setActiveModule('sample');
      setSubTab('samples');
    } else {
      setActiveModule('dashboard');
      setSubTab('overview');
    }
  };

  if (!user) {
    return (
      <LoginScreen
        onLogin={(loggedInUser) => {
          setUser(loggedInUser);
          setUserRole(loggedInUser.role);
          showToast('success', 'Welcome Back', `Logged in as ${loggedInUser.name} (${loggedInUser.role})`);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar navigation */}
      <Sidebar
        currentModule={getCurrentModule()}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        navigate={handleNavigate}
        user={user}
      />

      {/* Main Container next to Sidebar */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}>
        <Header
          currentModule={getCurrentModule()}
          theme={darkMode ? 'dark' : 'light'}
          toggleTheme={() => setDarkMode(!darkMode)}
          user={user}
          setUser={(updatedUser) => {
            setUser(updatedUser);
            setUserRole(updatedUser.role);
          }}
          logout={() => {
            setUser(null);
            showToast('info', 'Logged Out', 'You have been safely signed out.');
          }}
          onSeedSupabase={handleSeedSupabase}
        />

        {/* Content Workspace Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {activeModule === 'dashboard' && (
            <DashboardModule
              cottonReceives={cottonReceives}
              cottonIssues={cottonIssues}
              wasteReceives={wasteReceives}
              wasteIssues={wasteIssues}
              spareItems={spareItems}
              yarnReceives={yarnReceives}
              yarnIssues={yarnIssues}
              navigate={handleNavigate}
            />
          )}

          {activeModule === 'cotton' && (
            <CottonModule
              subTab={subTab as any}
              cottonCountries={cottonCountries}
              setCottonCountries={setCottonCountries}
              cottonReceives={cottonReceives}
              setCottonReceives={handleSetCottonReceives}
              cottonIssues={cottonIssues}
              setCottonIssues={handleSetCottonIssues}
              requestAdminAction={requestAdminAction}
              showToast={showToast}
            />
          )}

          {activeModule === 'wastage' && (
            <WastageModule
              subTab={subTab as any}
              wasteCategories={wasteCategories}
              setWasteCategories={setWasteCategories}
              wasteReceives={wasteReceives}
              setWasteReceives={setWasteReceives}
              wasteIssues={wasteIssues}
              setWasteIssues={setWasteIssues}
              requestAdminAction={requestAdminAction}
              showToast={showToast}
            />
          )}

          {activeModule === 'spare' && (
            <SpareModule
              subTab={subTab as any}
              spareSections={spareSections}
              spareItems={spareItems}
              setSpareItems={handleSetSpareItems}
              spareReceives={spareReceives}
              setSpareReceives={setSpareReceives}
              spareIssues={spareIssues}
              setSpareIssues={setSpareIssues}
              requestAdminAction={requestAdminAction}
              showToast={showToast}
            />
          )}

          {activeModule === 'yarn' && (
            <YarnModule
              subTab={subTab as any}
              yarnReceives={yarnReceives}
              setYarnReceives={setYarnReceives}
              yarnIssues={yarnIssues}
              setYarnIssues={setYarnIssues}
              requestAdminAction={requestAdminAction}
              showToast={showToast}
            />
          )}

          {activeModule === 'quality' && (
            <QualityModule
              subTab={subTab as any}
              hviReports={hviReports}
              setHviReports={setHviReports}
              usterReports={usterReports}
              setUsterReports={setUsterReports}
              requestAdminAction={requestAdminAction}
              showToast={showToast}
            />
          )}

          {activeModule === 'audit' && (
            <AuditModule
              auditItems={auditItems}
              setAuditItems={handleSetAuditItems}
              showToast={showToast}
            />
          )}

          {activeModule === 'sample' && (
            <SampleModule
              sampleItems={sampleItems}
              setSampleItems={handleSetSampleItems}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Admin Security Password Modal */}
      <AdminModal
        isOpen={adminModalState.isOpen}
        title={adminModalState.title}
        onClose={() => setAdminModalState({ isOpen: false, title: '', action: null })}
        onAuthorize={() => {
          if (adminModalState.action) {
            adminModalState.action();
            showToast('success', 'Admin Authorized', 'Action executed successfully.');
          }
          setAdminModalState({ isOpen: false, title: '', action: null });
        }}
      />
    </div>
  );
}

export default App;
