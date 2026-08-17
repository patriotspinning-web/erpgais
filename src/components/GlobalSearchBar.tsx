import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  Layers,
  Wrench,
  Sparkles,
  ArrowRight,
  CornerDownLeft,
  Command,
  PackageCheck,
  Archive,
  ArrowUpRight,
  Boxes,
  Tag,
  Factory,
} from 'lucide-react';
import {
  ModuleType,
  CottonReceive,
  CottonIssue,
  SpareItem,
  SpareReceive,
  SpareIssue,
  YarnReceive,
  YarnIssue,
} from '../types';

export interface SearchResultItem {
  id: string;
  category: 'cotton' | 'spare' | 'yarn';
  categoryLabel: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  targetModule: ModuleType;
  metadata?: {
    stock?: string;
    sectionOrOrigin?: string;
    date?: string;
    refNo?: string;
  };
}

interface GlobalSearchBarProps {
  cottonReceives?: CottonReceive[];
  cottonIssues?: CottonIssue[];
  spareItems?: SpareItem[];
  spareReceives?: SpareReceive[];
  spareIssues?: SpareIssue[];
  yarnReceives?: YarnReceive[];
  yarnIssues?: YarnIssue[];
  onNavigate: (module: ModuleType) => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  cottonReceives = [],
  cottonIssues = [],
  spareItems = [],
  spareReceives = [],
  spareIssues = [],
  yarnReceives = [],
  yarnIssues = [],
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'cotton' | 'spare' | 'yarn'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  // Map spare item IDs to names for MRR/Issue lookups
  const spareItemMap = useMemo(() => {
    const map = new Map<number, SpareItem>();
    spareItems.forEach((item) => map.set(item.id, item));
    return map;
  }, [spareItems]);

  // Global keyboard shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setIsMobileSearchOpen(true);
        setTimeout(() => {
          inputRef.current?.focus();
          mobileInputRef.current?.focus();
        }, 50);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        setIsMobileSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search Results Indexer
  const results = useMemo<SearchResultItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const items: SearchResultItem[] = [];

    // 1. COTTON SEARCH
    if (activeCategory === 'all' || activeCategory === 'cotton') {
      // Receives
      cottonReceives.forEach((item) => {
        const consignmentMatch = item.consignment?.toLowerCase().includes(q);
        const originMatch = item.origin?.toLowerCase().includes(q);
        const supplierMatch = item.supplierName?.toLowerCase().includes(q);
        const lcMatch = item.lcNo?.toLowerCase().includes(q);
        const idCodeMatch = item.idCode?.toLowerCase().includes(q);
        const remarksMatch = item.remarks?.toLowerCase().includes(q);

        if (consignmentMatch || originMatch || supplierMatch || lcMatch || idCodeMatch || remarksMatch) {
          items.push({
            id: `cotton-rcv-${item.id}`,
            category: 'cotton',
            categoryLabel: 'Cotton Inventory',
            title: `Lot: ${item.consignment || 'Unassigned'}`,
            subtitle: `${item.origin || 'Unknown Origin'} • ${item.supplierName || 'Supplier N/A'} • LC: ${item.lcNo || 'N/A'}`,
            badge: 'Cotton Receive',
            badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700',
            targetModule: 'cotton-receive',
            metadata: {
              stock: `${item.actualReceive || 0} Bales (${Number(item.actualReceiveKg || 0).toLocaleString()} Kg)`,
              sectionOrOrigin: item.origin,
              date: item.date,
              refNo: item.lcNo || item.idCode,
            },
          });
        }
      });

      // Issues
      cottonIssues.forEach((item) => {
        const consignmentMatch = item.consignment?.toLowerCase().includes(q);
        const originMatch = item.origin?.toLowerCase().includes(q);
        const srMatch = item.srNo?.toLowerCase().includes(q);
        const deptMatch = item.department?.toLowerCase().includes(q);
        const processMatch = item.processType?.toLowerCase().includes(q);

        if (consignmentMatch || originMatch || srMatch || deptMatch || processMatch) {
          items.push({
            id: `cotton-iss-${item.id}`,
            category: 'cotton',
            categoryLabel: 'Cotton Issue',
            title: `SR: ${item.srNo || 'N/A'} — Lot: ${item.consignment}`,
            subtitle: `Issued to: ${item.department || item.processType || 'Mill Floor'} • ${item.origin}`,
            badge: 'Cotton Issue',
            badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-700',
            targetModule: 'cotton-issue',
            metadata: {
              stock: `${item.baleQty || 0} Bales (${Number(item.weightKg || 0).toLocaleString()} Kg)`,
              sectionOrOrigin: item.department || item.processType,
              date: item.date,
              refNo: item.srNo,
            },
          });
        }
      });
    }

    // 2. SPARE PARTS SEARCH
    if (activeCategory === 'all' || activeCategory === 'spare') {
      // Items Master
      spareItems.forEach((item) => {
        const nameMatch = item.name?.toLowerCase().includes(q);
        const partNoMatch = item.partNumber?.toLowerCase().includes(q);
        const sectionMatch = item.section?.toLowerCase().includes(q);
        const sourceMatch = item.source?.toLowerCase().includes(q);
        const locationMatch = item.location?.toLowerCase().includes(q);

        if (nameMatch || partNoMatch || sectionMatch || sourceMatch || locationMatch) {
          items.push({
            id: `spare-item-${item.id}`,
            category: 'spare',
            categoryLabel: 'Spare Part Item',
            title: item.name,
            subtitle: `Part #: ${item.partNumber || 'N/A'} • Section: ${item.section} • ${item.source}`,
            badge: 'Spare Master',
            badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
            targetModule: 'spare-items',
            metadata: {
              stock: `Stock: ${item.currentStock} ${item.unit} (Min: ${item.minStock || 0})`,
              sectionOrOrigin: item.section,
              refNo: item.partNumber,
            },
          });
        }
      });

      // Receives (MRR)
      spareReceives.forEach((item) => {
        const linkedItem = spareItemMap.get(item.itemId);
        const mrrMatch = item.mrrNo?.toLowerCase().includes(q);
        const nameMatch = linkedItem?.name?.toLowerCase().includes(q);
        const partMatch = linkedItem?.partNumber?.toLowerCase().includes(q);
        const remarksMatch = item.remarks?.toLowerCase().includes(q);

        if (mrrMatch || nameMatch || partMatch || remarksMatch) {
          items.push({
            id: `spare-rcv-${item.id}`,
            category: 'spare',
            categoryLabel: 'Spare MRR Receive',
            title: `MRR: ${item.mrrNo} — ${linkedItem?.name || 'Spare Item'}`,
            subtitle: `Received: ${item.quantity} ${item.unit || linkedItem?.unit || 'pcs'} • By: ${item.receivedBy || 'Store'}`,
            badge: 'Spare Receive',
            badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
            targetModule: 'spare-receive',
            metadata: {
              stock: `+${item.quantity} ${item.unit || 'pcs'}`,
              sectionOrOrigin: linkedItem?.section || 'Spare Store',
              date: item.date,
              refNo: item.mrrNo,
            },
          });
        }
      });

      // Issues (SR)
      spareIssues.forEach((item) => {
        const linkedItem = spareItemMap.get(item.itemId);
        const srMatch = item.srNo?.toLowerCase().includes(q);
        const nameMatch = linkedItem?.name?.toLowerCase().includes(q);
        const issueToMatch = item.issueTo?.toLowerCase().includes(q);

        if (srMatch || nameMatch || issueToMatch) {
          items.push({
            id: `spare-iss-${item.id}`,
            category: 'spare',
            categoryLabel: 'Spare Issue Requisition',
            title: `SR: ${item.srNo} — ${linkedItem?.name || 'Spare Item'}`,
            subtitle: `Issued To: ${item.issueTo} • Qty: ${item.quantity} ${item.unit || linkedItem?.unit || 'pcs'}`,
            badge: 'Spare Issue',
            badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
            targetModule: 'spare-issue',
            metadata: {
              stock: `-${item.quantity} ${item.unit || 'pcs'}`,
              sectionOrOrigin: item.issueTo,
              date: item.date,
              refNo: item.srNo,
            },
          });
        }
      });
    }

    // 3. YARN SEARCH
    if (activeCategory === 'all' || activeCategory === 'yarn') {
      // Receives
      yarnReceives.forEach((item) => {
        const countMatch = item.count?.toLowerCase().includes(q);
        const lotMatch = item.lotNo?.toLowerCase().includes(q);
        const processMatch = item.process?.toLowerCase().includes(q);
        const mixingMatch = item.mixingRatio?.toLowerCase().includes(q);
        const remarksMatch = item.remarks?.toLowerCase().includes(q);

        if (countMatch || lotMatch || processMatch || mixingMatch || remarksMatch) {
          items.push({
            id: `yarn-rcv-${item.id}`,
            category: 'yarn',
            categoryLabel: 'Yarn Production Receive',
            title: `Count: ${item.count} — Lot: ${item.lotNo}`,
            subtitle: `Process: ${item.process} • Mix: ${item.mixingRatio || '100% Cotton'}`,
            badge: 'Yarn Receive',
            badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-700',
            targetModule: 'yarn-receive',
            metadata: {
              stock: `${item.bags || 0} Bags (${Number(item.quantity || 0).toLocaleString()} Kg)`,
              sectionOrOrigin: `${item.process} Spinning`,
              date: item.date,
              refNo: item.lotNo,
            },
          });
        }
      });

      // Issues
      yarnIssues.forEach((item) => {
        const countMatch = item.count?.toLowerCase().includes(q);
        const lotMatch = item.lotNo?.toLowerCase().includes(q);
        const processMatch = item.process?.toLowerCase().includes(q);
        const partyMatch = item.issueTo?.toLowerCase().includes(q);

        if (countMatch || lotMatch || processMatch || partyMatch) {
          items.push({
            id: `yarn-iss-${item.id}`,
            category: 'yarn',
            categoryLabel: 'Yarn Delivery / Issue',
            title: `Delivery: ${item.issueTo} — ${item.count}`,
            subtitle: `Lot: ${item.lotNo} • ${item.process} Process`,
            badge: 'Yarn Issue',
            badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300 border-sky-200 dark:border-sky-700',
            targetModule: 'yarn-issue',
            metadata: {
              stock: `${item.bags || 0} Bags (${Number(item.quantity || 0).toLocaleString()} Kg)`,
              sectionOrOrigin: item.issueTo,
              date: item.date,
              refNo: item.lotNo,
            },
          });
        }
      });
    }

    return items.slice(0, 30); // Cap at 30 high-priority records
  }, [
    query,
    activeCategory,
    cottonReceives,
    cottonIssues,
    spareItems,
    spareReceives,
    spareIssues,
    yarnReceives,
    yarnIssues,
    spareItemMap,
  ]);

  // Handle keyboard selection within the dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = results[selectedIndex];
      if (selected) {
        selectItem(selected);
      }
    }
  };

  const selectItem = (item: SearchResultItem) => {
    onNavigate(item.targetModule);
    setIsOpen(false);
    setIsMobileSearchOpen(false);
    setQuery('');
  };

  // Quick preset shortcuts for fast navigation when query is empty
  const quickShortcuts = [
    { label: 'Cotton Stock', module: 'cotton-stock' as ModuleType, category: 'Cotton' },
    { label: 'Cotton Receive', module: 'cotton-receive' as ModuleType, category: 'Cotton' },
    { label: 'Spare Items Master', module: 'spare-items' as ModuleType, category: 'Spare' },
    { label: 'Spare Stock Alert', module: 'spare-stock' as ModuleType, category: 'Spare' },
    { label: 'Yarn Receive', module: 'yarn-receive' as ModuleType, category: 'Yarn' },
    { label: 'Yarn Stock', module: 'yarn-stock' as ModuleType, category: 'Yarn' },
  ];

  return (
    <>
      {/* ================= DESKTOP SEARCH BAR ================= */}
      <div ref={containerRef} className="relative hidden md:block w-72 lg:w-96">
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-slate-100/80 dark:bg-slate-800/90 transition-all duration-200 ${
            isOpen
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-slate-900 shadow-sm'
              : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setSelectedIndex(0);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search cotton, spares, yarn..."
            className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none"
          />
          {query ? (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              title="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[10px] font-semibold text-slate-400 dark:text-slate-500 select-none">
              <span>⌘</span>
              <span>K</span>
            </div>
          )}
        </div>

        {/* Dropdown Results Panel */}
        {isOpen && (
          <div className="absolute left-0 top-full mt-2 w-[480px] -left-12 lg:left-0 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50 animate-fade-in">
            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 overflow-x-auto">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeCategory === 'all'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                }`}
              >
                All Records
              </button>
              <button
                onClick={() => setActiveCategory('cotton')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeCategory === 'cotton'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-amber-100 dark:hover:bg-amber-950/40'
                }`}
              >
                🌾 Cotton
              </button>
              <button
                onClick={() => setActiveCategory('spare')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeCategory === 'spare'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/40'
                }`}
              >
                ⚙️ Spare Parts
              </button>
              <button
                onClick={() => setActiveCategory('yarn')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeCategory === 'yarn'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-sky-100 dark:hover:bg-sky-950/40'
                }`}
              >
                🧵 Yarn
              </button>
            </div>

            {/* Results Content */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-thin">
              {query.trim() === '' ? (
                <div className="p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Quick Inventory Shortcuts
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {quickShortcuts.map((sc, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          onNavigate(sc.module);
                          setIsOpen(false);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50/40 dark:hover:bg-blue-950/30 text-left transition group cursor-pointer"
                      >
                        <div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            {sc.label}
                          </p>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {sc.category} Module
                          </span>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : results.length > 0 ? (
                results.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <div
                      key={item.id}
                      onClick={() => selectItem(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`p-3 transition cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-50/80 dark:bg-blue-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${item.badgeColor}`}
                          >
                            {item.badge}
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {item.subtitle}
                        </p>
                        {item.metadata && (
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                            {item.metadata.stock && (
                              <span className="font-semibold text-slate-600 dark:text-slate-300">
                                {item.metadata.stock}
                              </span>
                            )}
                            {item.metadata.date && <span>• {item.metadata.date}</span>}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          Open <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center">
                  <Archive className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No matching records found
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Try searching by Lot No, Part Number, Count, or Supplier.
                  </p>
                </div>
              )}
            </div>

            {/* Footer with keyboard hints */}
            <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
                    ↑
                  </kbd>
                  <kbd className="px-1 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
                    ↓
                  </kbd>{' '}
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded">
                    ↵
                  </kbd>{' '}
                  Select
                </span>
              </div>
              <span>ESC to Close</span>
            </div>
          </div>
        )}
      </div>

      {/* ================= MOBILE SEARCH TRIGGER BUTTON ================= */}
      <button
        onClick={() => {
          setIsMobileSearchOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 50);
        }}
        className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
        title="Global Search"
        aria-label="Open Search"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* ================= MOBILE FULLSCREEN SEARCH MODAL ================= */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex flex-col justify-start md:hidden animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 shadow-xl">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-500 bg-blue-50/30 dark:bg-slate-800">
                <Search className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <input
                  ref={mobileInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder="Search cotton, spares, yarn..."
                  className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                />
                {query && (
                  <button
                    onClick={() => {
                      setQuery('');
                      mobileInputRef.current?.focus();
                    }}
                    className="p-1 text-slate-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Cancel
              </button>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                  activeCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveCategory('cotton')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                  activeCategory === 'cotton'
                    ? 'bg-amber-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                🌾 Cotton
              </button>
              <button
                onClick={() => setActiveCategory('spare')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                  activeCategory === 'spare'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                ⚙️ Spares
              </button>
              <button
                onClick={() => setActiveCategory('yarn')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap ${
                  activeCategory === 'yarn'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                🧵 Yarn
              </button>
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1 bg-white dark:bg-slate-900 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {query.trim() === '' ? (
              <div className="p-4">
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  Quick Shortcuts
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {quickShortcuts.map((sc, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        onNavigate(sc.module);
                        setIsMobileSearchOpen(false);
                      }}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-left"
                    >
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {sc.label}
                      </span>
                      <span className="text-[11px] text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        {sc.category} <ArrowRight className="w-3 h-3" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : results.length > 0 ? (
              results.map((item) => (
                <div
                  key={item.id}
                  onClick={() => selectItem(item)}
                  className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 active:bg-blue-50 dark:active:bg-blue-950/50 cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.subtitle}</p>
                  {item.metadata?.stock && (
                    <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mt-1">
                      {item.metadata.stock}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <Archive className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No matching records found
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
