import React from 'react';
import {
  PackagePlus,
  PackageMinus,
  AlertTriangle,
  FileBarChart,
  Boxes,
  TrendingUp,
  Microscope,
  CheckCircle2,
  Layers,
  ShieldCheck,
  TestTube,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import {
  CottonReceive,
  CottonIssue,
  WasteReceive,
  WasteIssue,
  SpareItem,
  YarnReceive,
  YarnIssue,
  ModuleType,
} from '../types';

interface DashboardModuleProps {
  cottonReceives: CottonReceive[];
  cottonIssues: CottonIssue[];
  wasteReceives: WasteReceive[];
  wasteIssues: WasteIssue[];
  spareItems: SpareItem[];
  yarnReceives: YarnReceive[];
  yarnIssues: YarnIssue[];
  navigate: (mod: ModuleType) => void;
}

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  cottonReceives,
  cottonIssues,
  wasteReceives,
  wasteIssues,
  spareItems,
  yarnReceives,
  yarnIssues,
  navigate,
}) => {
  // Cotton total calculation
  const totalCottonReceivedBales = cottonReceives.reduce((s, r) => s + r.actualReceive, 0);
  const totalCottonIssuedBales = cottonIssues.reduce((s, i) => s + i.baleQty, 0);
  const totalCottonStockBales = totalCottonReceivedBales - totalCottonIssuedBales;

  const totalCottonReceivedKg = cottonReceives.reduce((s, r) => s + r.actualReceiveKg, 0);
  const totalCottonIssuedKg = cottonIssues.reduce((s, i) => s + i.weightKg, 0);
  const totalCottonStockKg = totalCottonReceivedKg - totalCottonIssuedKg;

  // Wastage total calculation
  const totalWasteReceivedKg = wasteReceives.reduce((s, r) => s + r.quantity, 0);
  const totalWasteIssuedKg = wasteIssues.reduce((s, i) => s + i.quantity, 0);
  const totalWasteStockKg = totalWasteReceivedKg - totalWasteIssuedKg;

  // Spare Items calculation
  const lowStockSpareItems = spareItems.filter(
    (item) => item.currentStock > 0 && item.currentStock <= item.minStock
  );
  const outOfStockSpareItems = spareItems.filter((item) => item.currentStock === 0);

  // Yarn calculation
  const totalYarnReceivedKg = yarnReceives.reduce((s, r) => s + r.quantity, 0);
  const totalYarnIssuedKg = yarnIssues.reduce((s, i) => s + i.quantity, 0);
  const totalYarnStockKg = totalYarnReceivedKg - totalYarnIssuedKg;

  // Prepare chart data for Cotton Origins
  const cottonOriginMap: Record<string, number> = {};
  cottonReceives.forEach((r) => {
    cottonOriginMap[r.origin] = (cottonOriginMap[r.origin] || 0) + r.actualReceive;
  });
  cottonIssues.forEach((i) => {
    if (cottonOriginMap[i.origin]) {
      cottonOriginMap[i.origin] = Math.max(0, cottonOriginMap[i.origin] - i.baleQty);
    }
  });
  const cottonOriginData = Object.entries(cottonOriginMap).map(([origin, bales]) => ({
    name: origin,
    bales,
  }));

  // Prepare chart data for Wastage Categories
  const wasteCategoryMap: Record<string, number> = {};
  wasteReceives.forEach((r) => {
    wasteCategoryMap[r.category] = (wasteCategoryMap[r.category] || 0) + r.quantity;
  });
  wasteIssues.forEach((i) => {
    if (wasteCategoryMap[i.category]) {
      wasteCategoryMap[i.category] = Math.max(0, wasteCategoryMap[i.category] - i.quantity);
    }
  });
  const wasteCategoryData = Object.entries(wasteCategoryMap)
    .map(([cat, kg]) => ({
      name: cat.length > 15 ? cat.substring(0, 15) + '...' : cat,
      fullName: cat,
      kg: Math.round(kg),
    }))
    .filter((d) => d.kg > 0)
    .slice(0, 6);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
              <Boxes className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight">Mill Store & Stock Overview</h1>
              <p className="text-xs text-blue-200 mt-0.5">
                Patriot Spinning Mills Ltd. · Real-time inventory balance
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('cotton-receive')}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
          >
            <PackagePlus className="w-4 h-4" /> Cotton Receive
          </button>
          <button
            onClick={() => navigate('spare-issue')}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition"
          >
            <PackageMinus className="w-4 h-4" /> Spare Issue
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Cotton Stock */}
        <div
          onClick={() => navigate('cotton-stock')}
          className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-amber-200 dark:border-amber-900/50 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Cotton Stock
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center group-hover:scale-110 transition">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            {totalCottonStockBales.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">Bales</span>
          </p>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 pt-2">
            <span>Weight: {Math.round(totalCottonStockKg).toLocaleString()} kg</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold group-hover:underline">
              View Lots →
            </span>
          </div>
        </div>

        {/* Card 2: Wastage Stock */}
        <div
          onClick={() => navigate('waste-stock')}
          className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-rose-200 dark:border-rose-900/50 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Wastage Stock
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center group-hover:scale-110 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            {Math.round(totalWasteStockKg).toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">kg</span>
          </p>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 pt-2">
            <span>20 Categories</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold group-hover:underline">
              Stock List →
            </span>
          </div>
        </div>

        {/* Card 3: Spare Parts */}
        <div
          onClick={() => navigate('spare-stock')}
          className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-900/50 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Spare Parts
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            {spareItems.length}{' '}
            <span className="text-xs font-normal text-slate-500">Master Items</span>
          </p>
          <div className="mt-2 text-xs flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 pt-2">
            <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {lowStockSpareItems.length + outOfStockSpareItems.length} Reorder
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold group-hover:underline">
              Inventory →
            </span>
          </div>
        </div>

        {/* Card 4: Finished Yarn */}
        <div
          onClick={() => navigate('yarn-stock')}
          className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-sky-200 dark:border-sky-900/50 shadow-sm hover:shadow-md transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
              Yarn Stock
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/30 text-sky-600 flex items-center justify-center group-hover:scale-110 transition">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-3">
            {Math.round(totalYarnStockKg).toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-500">kg</span>
          </p>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 pt-2">
            <span>Ring & Rotor Yarn</span>
            <span className="text-sky-600 dark:text-sky-400 font-semibold group-hover:underline">
              Yarn Store →
            </span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Cotton Stock By Country Origin */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Cotton Bales Balance by Country/Origin
              </h3>
              <p className="text-xs text-slate-500">Distribution across active import sources</p>
            </div>
            <button
              onClick={() => navigate('cotton-stock')}
              className="text-xs text-blue-600 hover:underline font-semibold"
            >
              Details
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cottonOriginData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  dataKey="bales"
                  paddingAngle={4}
                  label={({ name, bales }) => `${name}: ${bales}B`}
                >
                  {cottonOriginData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Wastage Stock by Category */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Top Wastage Stock Balance (Kg)
              </h3>
              <p className="text-xs text-slate-500">Category-wise mill waste on hand</p>
            </div>
            <button
              onClick={() => navigate('waste-stock')}
              className="text-xs text-rose-600 hover:underline font-semibold"
            >
              Details
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={wasteCategoryData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: any) => [`${value} kg`, 'Wastage Stock']}
                />
                <Bar dataKey="kg" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Low Stock Spare Parts Warning Section */}
      {(lowStockSpareItems.length > 0 || outOfStockSpareItems.length > 0) && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Spare Parts Reorder Level Alerts ({lowStockSpareItems.length + outOfStockSpareItems.length})
              </h3>
            </div>
            <button
              onClick={() => navigate('spare-stock')}
              className="text-xs font-bold text-amber-700 dark:text-amber-300 hover:underline"
            >
              Go to Spare Stock →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...outOfStockSpareItems, ...lowStockSpareItems].slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-200 dark:border-slate-700 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                    {item.name}
                  </p>
                  <p className="text-[10px] text-slate-500">{item.section} · {item.partNumber}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.currentStock === 0
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                    }`}
                  >
                    {item.currentStock === 0 ? 'OUT OF STOCK' : `LOW: ${item.currentStock} ${item.unit}`}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Min: {item.minStock} {item.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Access Action Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
          Quick Department Actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          <button
            onClick={() => navigate('cotton-receive')}
            className="p-3 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl text-center border border-amber-200/60 dark:border-amber-800/40 transition"
          >
            <PackagePlus className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Cotton Receive</span>
          </button>

          <button
            onClick={() => navigate('cotton-issue')}
            className="p-3 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-xl text-center border border-amber-200/60 dark:border-amber-800/40 transition"
          >
            <PackageMinus className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Issue Cotton</span>
          </button>

          <button
            onClick={() => navigate('waste-receive')}
            className="p-3 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl text-center border border-rose-200/60 dark:border-rose-800/40 transition"
          >
            <PackagePlus className="w-5 h-5 text-rose-600 mx-auto mb-1" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Waste Receive</span>
          </button>

          <button
            onClick={() => navigate('spare-issue')}
            className="p-3 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl text-center border border-emerald-200/60 dark:border-emerald-800/40 transition"
          >
            <PackageMinus className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Spare SR Issue</span>
          </button>

          <button
            onClick={() => navigate('yarn-receive')}
            className="p-3 bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/40 rounded-xl text-center border border-sky-200/60 dark:border-sky-800/40 transition"
          >
            <PackagePlus className="w-5 h-5 text-sky-600 mx-auto mb-1" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Yarn Receive</span>
          </button>

          <button
            onClick={() => navigate('hvi-reports')}
            className="p-3 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-xl text-center border border-purple-200/60 dark:border-purple-800/40 transition"
          >
            <Microscope className="w-5 h-5 text-purple-600 mx-auto mb-1" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">HVI Quality</span>
          </button>

          <button
            onClick={() => navigate('audit-compliance')}
            className="p-3 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl text-center border border-emerald-200/60 dark:border-emerald-800/40 transition"
          >
            <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Audit & ISO</span>
          </button>

          <button
            onClick={() => navigate('sample-management')}
            className="p-3 bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/40 rounded-xl text-center border border-sky-200/60 dark:border-sky-800/40 transition"
          >
            <TestTube className="w-5 h-5 text-sky-600 mx-auto mb-1" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Sample Room</span>
          </button>
        </div>
      </div>
    </div>
  );
};
