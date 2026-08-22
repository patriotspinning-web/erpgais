import React from 'react';
import { Calendar, X, Filter, RotateCcw } from 'lucide-react';
import { DATE_PRESETS, DatePresetKey, getDatePresetRange } from '../utils/dateUtils';

export interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
  onReset?: () => void;
  totalCount?: number;
  filteredCount?: number;
  label?: string;
  compact?: boolean;
  accentColor?: 'amber' | 'blue' | 'emerald' | 'purple' | 'cyan' | 'rose' | 'indigo';
  showPresets?: boolean;
  className?: string;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onReset,
  totalCount,
  filteredCount,
  label = 'Date Filter',
  compact = false,
  accentColor = 'amber',
  showPresets = true,
  className = '',
}) => {
  const isFiltered = Boolean(startDate || endDate);

  const handlePresetClick = (key: DatePresetKey) => {
    const range = getDatePresetRange(key);
    onStartDateChange(range.startDate);
    onEndDateChange(range.endDate);
  };

  const handleClear = () => {
    onStartDateChange('');
    onEndDateChange('');
    if (onReset) onReset();
  };

  // Color schemes for borders and highlights
  const colorMap = {
    amber: 'focus:border-amber-500 focus:ring-amber-500/20 text-amber-600 dark:text-amber-400',
    blue: 'focus:border-blue-500 focus:ring-blue-500/20 text-blue-600 dark:text-blue-400',
    emerald: 'focus:border-emerald-500 focus:ring-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    purple: 'focus:border-purple-500 focus:ring-purple-500/20 text-purple-600 dark:text-purple-400',
    cyan: 'focus:border-cyan-500 focus:ring-cyan-500/20 text-cyan-600 dark:text-cyan-400',
    rose: 'focus:border-rose-500 focus:ring-rose-500/20 text-rose-600 dark:text-rose-400',
    indigo: 'focus:border-indigo-500 focus:ring-indigo-500/20 text-indigo-600 dark:text-indigo-400',
  };

  const activeColor = colorMap[accentColor] || colorMap.amber;

  return (
    <div
      className={`bg-slate-50/80 dark:bg-slate-900/40 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 transition-all ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {/* Header / Label */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <Calendar className={`w-3.5 h-3.5 ${activeColor}`} />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
            {label}
          </span>

          {/* Records Counter Badge */}
          {typeof filteredCount === 'number' && (
            <span
              className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                isFiltered
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              {typeof totalCount === 'number' && totalCount !== filteredCount
                ? `${filteredCount} / ${totalCount} records`
                : `${filteredCount} records`}
            </span>
          )}
        </div>

        {/* Clear Filter Button */}
        {isFiltered && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 transition"
          >
            <RotateCcw className="w-3 h-3" />
            Clear Filter
          </button>
        )}
      </div>

      {/* Date Input Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-[140px] sm:min-w-[180px]">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
            From:
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className={`w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 ${activeColor}`}
          />
        </div>

        <div className="flex items-center gap-1.5 flex-1 min-w-[140px] sm:min-w-[180px]">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
            To:
          </span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className={`w-full px-2.5 py-1.5 text-xs font-medium border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 ${activeColor}`}
          />
        </div>
      </div>

      {/* Quick Presets Bar */}
      {showPresets && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Presets:
          </span>
          {DATE_PRESETS.map((preset) => {
            const range = getDatePresetRange(preset.key);
            const isSelected =
              preset.key === 'all'
                ? !startDate && !endDate
                : startDate === range.startDate && endDate === range.endDate;

            return (
              <button
                key={preset.key}
                type="button"
                onClick={() => handlePresetClick(preset.key)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
