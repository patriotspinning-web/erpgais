import React, { useState, useEffect, useCallback } from 'react';
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
  supabase,
  fetchCottonReceivesFromSupabase,
  syncCottonReceiveToSupabase,
  deleteCottonReceiveFromSupabase,
  fetchCottonIssuesFromSupabase,
  syncCottonIssueToSupabase,
  deleteCottonIssueFromSupabase,
  fetchWasteReceivesFromSupabase,
  syncWasteReceiveToSupabase,
  deleteWasteReceiveFromSupabase,
  fetchWasteIssuesFromSupabase,
  syncWasteIssueToSupabase,
  deleteWasteIssueFromSupabase,
  fetchSpareItemsFromSupabase,
  syncSpareItemToSupabase,
  deleteSpareItemFromSupabase,
  fetchSpareReceivesFromSupabase,
  syncSpareReceiveToSupabase,
  deleteSpareReceiveFromSupabase,
  fetchSpareIssuesFromSupabase,
  syncSpareIssueToSupabase,
  deleteSpareIssueFromSupabase,
  fetchYarnReceivesFromSupabase,
  syncYarnReceiveToSupabase,
  deleteYarnReceiveFromSupabase,
  fetchYarnIssuesFromSupabase,
  syncYarnIssueToSupabase,
  deleteYarnIssueFromSupabase,
  fetchHviReportsFromSupabase,
  syncHviReportToSupabase,
  deleteHviReportFromSupabase,
  fetchUsterReportsFromSupabase,
  syncUsterReportToSupabase,
  deleteUsterReportFromSupabase,
  fetchAuditItemsFromSupabase,
  syncAuditItemToSupabase,
  fetchSampleItemsFromSupabase,
  syncSampleItemToSupabase,
  populateSupabaseWithInitialSeedData,
} from './lib/supabase';
import {
  mergeEntityList,
  broadcastDataChange,
  subscribeToBroadcast,
  recordDeletedId,
  exportErpBackup,
  importErpBackup,
} from './lib/syncEngine';

export function App() {
  // Auth & Roles State (null by default to enforce login screen first)
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = sessionStorage.getItem('patriot_erp_auth_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [userRole, setUserRole] = useState<Role>(() => user?.role || 'Store Manager');

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

  // Helper to load state safely from localStorage
  const getInitialState = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed as T;
      }
    } catch (e) {
      console.warn(`Failed loading ${key} from localStorage`, e);
    }
    return fallback;
  };

  // ERP Domain State (Initialized with localStorage or mill seed data)
  const [cottonCountries, setCottonCountries] = useState<string[]>(() =>
    getInitialState('patriot_erp_cotton_countries', DEFAULT_COTTON_COUNTRIES)
  );
  const [cottonReceives, setCottonReceives] = useState<CottonReceive[]>(() =>
    getInitialState('patriot_erp_cotton_receives', SEED_COTTON_RECEIVES)
  );
  const [cottonIssues, setCottonIssues] = useState<CottonIssue[]>(() =>
    getInitialState('patriot_erp_cotton_issues', SEED_COTTON_ISSUES)
  );

  const [wasteCategories, setWasteCategories] = useState<string[]>(() =>
    getInitialState('patriot_erp_waste_categories', DEFAULT_WASTE_CATEGORIES)
  );
  const [wasteReceives, setWasteReceives] = useState<WasteReceive[]>(() =>
    getInitialState('patriot_erp_waste_receives', SEED_WASTE_RECEIVES)
  );
  const [wasteIssues, setWasteIssues] = useState<WasteIssue[]>(() =>
    getInitialState('patriot_erp_waste_issues', SEED_WASTE_ISSUES)
  );

  const [spareSections] = useState<string[]>(DEFAULT_SPARE_SECTIONS);
  const [spareItems, setSpareItems] = useState<SpareItem[]>(() =>
    getInitialState('patriot_erp_spare_items', SEED_SPARE_ITEMS)
  );
  const [spareReceives, setSpareReceives] = useState<SpareReceive[]>(() =>
    getInitialState('patriot_erp_spare_receives', SEED_SPARE_RECEIVES)
  );
  const [spareIssues, setSpareIssues] = useState<SpareIssue[]>(() =>
    getInitialState('patriot_erp_spare_issues', SEED_SPARE_ISSUES)
  );

  const [yarnReceives, setYarnReceives] = useState<YarnReceive[]>(() =>
    getInitialState('patriot_erp_yarn_receives', SEED_YARN_RECEIVES)
  );
  const [yarnIssues, setYarnIssues] = useState<YarnIssue[]>(() =>
    getInitialState('patriot_erp_yarn_issues', SEED_YARN_ISSUES)
  );

  const [hviReports, setHviReports] = useState<HVIReport[]>(() =>
    getInitialState('patriot_erp_hvi_reports', SEED_HVI_REPORTS)
  );
  const [usterReports, setUsterReports] = useState<UsterReport[]>(() =>
    getInitialState('patriot_erp_uster_reports', SEED_USTER_REPORTS)
  );

  const [auditItems, setAuditItems] = useState<AuditItem[]>(() =>
    getInitialState('patriot_erp_audit_items', SEED_AUDIT_ITEMS)
  );
  const [sampleItems, setSampleItems] = useState<SampleItem[]>(() =>
    getInitialState('patriot_erp_sample_items', SEED_SAMPLE_ITEMS)
  );

  // Synchronize state changes to localStorage
  useEffect(() => { localStorage.setItem('patriot_erp_cotton_countries', JSON.stringify(cottonCountries)); }, [cottonCountries]);
  useEffect(() => { localStorage.setItem('patriot_erp_cotton_receives', JSON.stringify(cottonReceives)); }, [cottonReceives]);
  useEffect(() => { localStorage.setItem('patriot_erp_cotton_issues', JSON.stringify(cottonIssues)); }, [cottonIssues]);
  useEffect(() => { localStorage.setItem('patriot_erp_waste_categories', JSON.stringify(wasteCategories)); }, [wasteCategories]);
  useEffect(() => { localStorage.setItem('patriot_erp_waste_receives', JSON.stringify(wasteReceives)); }, [wasteReceives]);
  useEffect(() => { localStorage.setItem('patriot_erp_waste_issues', JSON.stringify(wasteIssues)); }, [wasteIssues]);
  useEffect(() => { localStorage.setItem('patriot_erp_spare_items', JSON.stringify(spareItems)); }, [spareItems]);
  useEffect(() => { localStorage.setItem('patriot_erp_spare_receives', JSON.stringify(spareReceives)); }, [spareReceives]);
  useEffect(() => { localStorage.setItem('patriot_erp_spare_issues', JSON.stringify(spareIssues)); }, [spareIssues]);
  useEffect(() => { localStorage.setItem('patriot_erp_yarn_receives', JSON.stringify(yarnReceives)); }, [yarnReceives]);
  useEffect(() => { localStorage.setItem('patriot_erp_yarn_issues', JSON.stringify(yarnIssues)); }, [yarnIssues]);
  useEffect(() => { localStorage.setItem('patriot_erp_hvi_reports', JSON.stringify(hviReports)); }, [hviReports]);
  useEffect(() => { localStorage.setItem('patriot_erp_uster_reports', JSON.stringify(usterReports)); }, [usterReports]);
  useEffect(() => { localStorage.setItem('patriot_erp_audit_items', JSON.stringify(auditItems)); }, [auditItems]);
  useEffect(() => { localStorage.setItem('patriot_erp_sample_items', JSON.stringify(sampleItems)); }, [sampleItems]);

  // Toggle Dark Mode Class on Document Elements
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Non-destructive synchronization from Supabase Cloud Database
  const loadSupabaseData = useCallback(async () => {
    try {
      const [
        crData,
        ciData,
        wrData,
        wiData,
        spData,
        srData,
        siData,
        yrData,
        yiData,
        hviData,
        usterData,
        auData,
        smData,
      ] = await Promise.all([
        fetchCottonReceivesFromSupabase(),
        fetchCottonIssuesFromSupabase(),
        fetchWasteReceivesFromSupabase(),
        fetchWasteIssuesFromSupabase(),
        fetchSpareItemsFromSupabase(),
        fetchSpareReceivesFromSupabase(),
        fetchSpareIssuesFromSupabase(),
        fetchYarnReceivesFromSupabase(),
        fetchYarnIssuesFromSupabase(),
        fetchHviReportsFromSupabase(),
        fetchUsterReportsFromSupabase(),
        fetchAuditItemsFromSupabase(),
        fetchSampleItemsFromSupabase(),
      ]);

      if (crData && crData.length > 0) setCottonReceives((prev) => mergeEntityList(prev, crData));
      if (ciData && ciData.length > 0) setCottonIssues((prev) => mergeEntityList(prev, ciData));
      if (wrData && wrData.length > 0) setWasteReceives((prev) => mergeEntityList(prev, wrData));
      if (wiData && wiData.length > 0) setWasteIssues((prev) => mergeEntityList(prev, wiData));
      if (spData && spData.length > 0) setSpareItems((prev) => mergeEntityList(prev, spData));
      if (srData && srData.length > 0) setSpareReceives((prev) => mergeEntityList(prev, srData));
      if (siData && siData.length > 0) setSpareIssues((prev) => mergeEntityList(prev, siData));
      if (yrData && yrData.length > 0) setYarnReceives((prev) => mergeEntityList(prev, yrData));
      if (yiData && yiData.length > 0) setYarnIssues((prev) => mergeEntityList(prev, yiData));
      if (hviData && hviData.length > 0) setHviReports((prev) => mergeEntityList(prev, hviData));
      if (usterData && usterData.length > 0) setUsterReports((prev) => mergeEntityList(prev, usterData));
      if (auData && auData.length > 0) setAuditItems((prev) => mergeEntityList(prev, auData));
      if (smData && smData.length > 0) setSampleItems((prev) => mergeEntityList(prev, smData));
    } catch (err) {
      console.info('Supabase non-blocking sync note:', err);
    }
  }, []);

  // Periodic polling & focus sync & Realtime channel
  useEffect(() => {
    loadSupabaseData();

    // Setup fast 5s background auto-sync interval and on focus
    const interval = setInterval(loadSupabaseData, 5000);
    const handleFocus = () => loadSupabaseData();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadSupabaseData();
      }
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    // Setup Supabase Realtime channel subscription
    let channel: any = null;
    try {
      channel = supabase
        .channel('patriot_erp_realtime_sync')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          loadSupabaseData();
        })
        .subscribe();
    } catch {
      // ignore
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {
          // ignore
        }
      }
    };
  }, [loadSupabaseData]);

  // Listen to multi-tab BroadcastChannel and cross-tab storage changes
  useEffect(() => {
    const handleDataUpdate = (key: string, parsed: any) => {
      if (!parsed || !Array.isArray(parsed)) return;
      if (key === 'patriot_erp_cotton_receives') setCottonReceives(parsed);
      if (key === 'patriot_erp_cotton_issues') setCottonIssues(parsed);
      if (key === 'patriot_erp_waste_receives') setWasteReceives(parsed);
      if (key === 'patriot_erp_waste_issues') setWasteIssues(parsed);
      if (key === 'patriot_erp_spare_items') setSpareItems(parsed);
      if (key === 'patriot_erp_spare_receives') setSpareReceives(parsed);
      if (key === 'patriot_erp_spare_issues') setSpareIssues(parsed);
      if (key === 'patriot_erp_yarn_receives') setYarnReceives(parsed);
      if (key === 'patriot_erp_yarn_issues') setYarnIssues(parsed);
      if (key === 'patriot_erp_hvi_reports') setHviReports(parsed);
      if (key === 'patriot_erp_uster_reports') setUsterReports(parsed);
      if (key === 'patriot_erp_audit_items') setAuditItems(parsed);
      if (key === 'patriot_erp_sample_items') setSampleItems(parsed);
    };

    // 1. StorageEvent listener
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        handleDataUpdate(e.key, parsed);
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', handleStorage);

    // 2. BroadcastChannel listener
    const unsubscribeBroadcast = subscribeToBroadcast((key, data) => {
      handleDataUpdate(key, data);
    });

    return () => {
      window.removeEventListener('storage', handleStorage);
      unsubscribeBroadcast();
    };
  }, []);

  // Export Full JSON Backup
  const handleExportBackup = () => {
    const backupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      millName: 'Patriot Spinning Mills Ltd.',
      cottonCountries,
      cottonReceives,
      cottonIssues,
      wasteCategories,
      wasteReceives,
      wasteIssues,
      spareSections,
      spareItems,
      spareReceives,
      spareIssues,
      yarnReceives,
      yarnIssues,
      hviReports,
      usterReports,
      auditItems,
      sampleItems,
    };
    exportErpBackup(backupData);
    showToast('success', 'Backup Exported', 'Full mill database downloaded as JSON backup.');
  };

  // Import JSON Backup
  const handleImportBackup = async (file: File) => {
    try {
      const data = await importErpBackup(file);
      if (data.cottonReceives && Array.isArray(data.cottonReceives)) setCottonReceives(data.cottonReceives);
      if (data.cottonIssues && Array.isArray(data.cottonIssues)) setCottonIssues(data.cottonIssues);
      if (data.wasteReceives && Array.isArray(data.wasteReceives)) setWasteReceives(data.wasteReceives);
      if (data.wasteIssues && Array.isArray(data.wasteIssues)) setWasteIssues(data.wasteIssues);
      if (data.spareItems && Array.isArray(data.spareItems)) setSpareItems(data.spareItems);
      if (data.spareReceives && Array.isArray(data.spareReceives)) setSpareReceives(data.spareReceives);
      if (data.spareIssues && Array.isArray(data.spareIssues)) setSpareIssues(data.spareIssues);
      if (data.yarnReceives && Array.isArray(data.yarnReceives)) setYarnReceives(data.yarnReceives);
      if (data.yarnIssues && Array.isArray(data.yarnIssues)) setYarnIssues(data.yarnIssues);
      if (data.hviReports && Array.isArray(data.hviReports)) setHviReports(data.hviReports);
      if (data.usterReports && Array.isArray(data.usterReports)) setUsterReports(data.usterReports);
      if (data.auditItems && Array.isArray(data.auditItems)) setAuditItems(data.auditItems);
      if (data.sampleItems && Array.isArray(data.sampleItems)) setSampleItems(data.sampleItems);

      showToast('success', 'Backup Restored', 'All mill records imported successfully from JSON file.');
    } catch (err: any) {
      showToast('error', 'Import Failed', err?.message || 'Could not parse JSON backup file.');
    }
  };

  // Supabase Database Seed Handler
  const handleSeedSupabase = async () => {
    showToast('info', 'Supabase Syncing', 'Pushing local mill records to Supabase Cloud Database...');
    const result = await populateSupabaseWithInitialSeedData({
      cottonReceives,
      cottonIssues,
      wasteReceives,
      wasteIssues,
      spareItems,
      spareReceives,
      spareIssues,
      yarnReceives,
      yarnIssues,
      hviReports,
      usterReports,
      auditItems,
      sampleItems,
    });

    if (result.success) {
      showToast('success', 'Supabase Seeded', `Successfully synchronized ${result.count} records to Supabase!`);
    } else {
      showToast('error', 'Supabase Seed Error', result.error || 'Failed to seed tables. Ensure tables exist in SQL Editor.');
    }
  };

  // Wrapped State Setters that sync updates to Supabase Cloud Database and Broadcast
  const handleSetCottonReceives: React.Dispatch<React.SetStateAction<CottonReceive[]>> = (action) => {
    setCottonReceives((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      broadcastDataChange('patriot_erp_cotton_receives', next);
      next.forEach((item) => {
        const old = prev.find((p) => p.id === item.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(item)) {
          syncCottonReceiveToSupabase(item);
        }
      });
      prev.forEach((old) => {
        if (!next.some((n) => n.id === old.id)) {
          recordDeletedId(old.id);
          deleteCottonReceiveFromSupabase(old.id);
        }
      });
      return next;
    });
  };

  const handleSetCottonIssues: React.Dispatch<React.SetStateAction<CottonIssue[]>> = (action) => {
    setCottonIssues((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      broadcastDataChange('patriot_erp_cotton_issues', next);
      next.forEach((item) => {
        const old = prev.find((p) => p.id === item.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(item)) {
          syncCottonIssueToSupabase(item);
        }
      });
      prev.forEach((old) => {
        if (!next.some((n) => n.id === old.id)) {
          recordDeletedId(old.id);
          deleteCottonIssueFromSupabase(old.id);
        }
      });
      return next;
    });
  };

  const handleSetWasteReceives: React.Dispatch<React.SetStateAction<WasteReceive[]>> = (action) => {
    setWasteReceives((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      broadcastDataChange('patriot_erp_waste_receives', next);
      next.forEach((item) => {
        const old = prev.find((p) => p.id === item.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(item)) {
          syncWasteReceiveToSupabase(item);
        }
      });
      prev.forEach((old) => {
        if (!next.some((n) => n.id === old.id)) {
          recordDeletedId(old.id);
          deleteWasteReceiveFromSupabase(old.id);
        }
      });
      return next;
    });
  };

  const handleSetWasteIssues: React.Dispatch<React.SetStateAction<WasteIssue[]>> = (action) => {
    setWasteIssues((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      broadcastDataChange('patriot_erp_waste_issues', next);
      next.forEach((item) => {
        const old = prev.find((p) => p.id === item.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(item)) {
          syncWasteIssueToSupabase(item);
        }
      });
      prev.forEach((old) => {
        if (!next.some((n) => n.id === old.id)) {
          recordDeletedId(old.id);
          deleteWasteIssueFromSupabase(old.id);
        }
      });
      return next;
    });
  };

  const handleSetSpareItems: React.Dispatch<React.SetStateAction<SpareItem[]>> = (action) => {
    setSpareItems((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      broadcastDataChange('patriot_erp_spare_items', next);
      next.forEach((item) => {
        const old = prev.find((p) => p.id === item.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(item)) {
          syncSpareItemToSupabase(item);
        }
      });
      prev.forEach((old) => {
        if (!next.some((n) => n.id === old.id)) {
          recordDeletedId(old.id);
          deleteSpareItemFromSupabase(old.id);
        }
      });
      return next;
    });
  };

  const handleSetSpareReceives: React.Dispatch<React.SetStateAction<SpareReceive[]>> = (action) => {
    setSpareReceives((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      broadcastDataChange('patriot_erp_spare_receives', next);
      next.forEach((item) => {
        const old = prev.find((p) => p.id === item.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(item)) {
          syncSpareReceiveToSupabase(item);
        }
      });
      prev.forEach((old) => {
        if (!next.some((n) => n.id === old.id)) {
          recordDeletedId(old.id);
          deleteSpareReceiveFromSupabase(old.id);
        }
      });
      return next;
    });
  };

  const handleSetSpareIssues: React.Dispatch<React.SetStateAction<SpareIssue[]>> = (action) => {
    setSpareIssues((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      broadcastDataChange('patriot_erp_spare_issues', next);
      next.forEach((item) => {
        const old = prev.find((p) => p.id === item.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(item)) {
          syncSpareIssueToSupabase(item);
        }
      });
      prev.forEach((old) => {
        if (!next.some((n) => n.id === old.id)) {
          recordDeletedId(old.id);
          deleteSpareIssueFromSupabase(old.id);
        }
      });
      return next;
    });
  };

  const handleSetYarnReceives: React.Dispatch<React.SetStateAction<YarnReceive[]>> = (action) => {
    setYarnReceives((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      broadcastDataChange('patriot_erp_yarn_receives', next);
      next.forEach((item) => {
        const old = prev.find((p) => p.id === item.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(item)) {
          syncYarnReceiveToSupabase(item);
        }
      });
      prev.forEach((old) => {
        if (!next.some((n) => n.id === old.id)) {
          recordDeletedId(old.id);
          deleteYarnReceiveFromSupabase(old.id);
        }
      });
      return next;
    });
  };

  const handleSetYarnIssues: React.Dispatch<React.SetStateAction<YarnIssue[]>> = (action) => {
    setYarnIssues((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      broadcastDataChange('patriot_erp_yarn_issues', next);
      next.forEach((item) => {
        const old = prev.find((p) => p.id === item.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(item)) {
          syncYarnIssueToSupabase(item);
        }
      });
      prev.forEach((old) => {
        if (!next.some((n) => n.id === old.id)) {
          recordDeletedId(old.id);
          deleteYarnIssueFromSupabase(old.id);
        }
      });
      return next;
    });
  };

  const handleSetHviReports: React.Dispatch<React.SetStateAction<HVIReport[]>> = (action) => {
    setHviReports((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      broadcastDataChange('patriot_erp_hvi_reports', next);
      next.forEach((item) => {
        const old = prev.find((p) => p.id === item.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(item)) {
          syncHviReportToSupabase(item);
        }
      });
      prev.forEach((old) => {
        if (!next.some((n) => n.id === old.id)) {
          recordDeletedId(old.id);
          deleteHviReportFromSupabase(old.id);
        }
      });
      return next;
    });
  };

  const handleSetUsterReports: React.Dispatch<React.SetStateAction<UsterReport[]>> = (action) => {
    setUsterReports((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      broadcastDataChange('patriot_erp_uster_reports', next);
      next.forEach((item) => {
        const old = prev.find((p) => p.id === item.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(item)) {
          syncUsterReportToSupabase(item);
        }
      });
      prev.forEach((old) => {
        if (!next.some((n) => n.id === old.id)) {
          recordDeletedId(old.id);
          deleteUsterReportFromSupabase(old.id);
        }
      });
      return next;
    });
  };

  const handleSetAuditItems: React.Dispatch<React.SetStateAction<AuditItem[]>> = (action) => {
    setAuditItems((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      broadcastDataChange('patriot_erp_audit_items', next);
      next.forEach((item) => {
        const old = prev.find((p) => p.id === item.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(item)) {
          syncAuditItemToSupabase(item);
        }
      });
      return next;
    });
  };

  const handleSetSampleItems: React.Dispatch<React.SetStateAction<SampleItem[]>> = (action) => {
    setSampleItems((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      broadcastDataChange('patriot_erp_sample_items', next);
      next.forEach((item) => {
        const old = prev.find((p) => p.id === item.id);
        if (!old || JSON.stringify(old) !== JSON.stringify(item)) {
          syncSampleItemToSupabase(item);
        }
      });
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
          try {
            sessionStorage.setItem('patriot_erp_auth_user', JSON.stringify(loggedInUser));
          } catch (_) {}
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
            try {
              sessionStorage.setItem('patriot_erp_auth_user', JSON.stringify(updatedUser));
            } catch (_) {}
          }}
          logout={() => {
            setUser(null);
            try {
              sessionStorage.removeItem('patriot_erp_auth_user');
            } catch (_) {}
            showToast('info', 'Logged Out', 'You have been safely signed out.');
          }}
          onSeedSupabase={handleSeedSupabase}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
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
              setWasteReceives={handleSetWasteReceives}
              wasteIssues={wasteIssues}
              setWasteIssues={handleSetWasteIssues}
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
              setSpareReceives={handleSetSpareReceives}
              spareIssues={spareIssues}
              setSpareIssues={handleSetSpareIssues}
              requestAdminAction={requestAdminAction}
              showToast={showToast}
            />
          )}

          {activeModule === 'yarn' && (
            <YarnModule
              subTab={subTab as any}
              yarnReceives={yarnReceives}
              setYarnReceives={handleSetYarnReceives}
              yarnIssues={yarnIssues}
              setYarnIssues={handleSetYarnIssues}
              requestAdminAction={requestAdminAction}
              showToast={showToast}
            />
          )}

          {activeModule === 'quality' && (
            <QualityModule
              subTab={subTab as any}
              hviReports={hviReports}
              setHviReports={handleSetHviReports}
              usterReports={usterReports}
              setUsterReports={handleSetUsterReports}
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
