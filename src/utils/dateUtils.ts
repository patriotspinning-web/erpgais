/**
 * Date filtering and preset utilities for Patriot Spinning Mills ERP
 */

/**
 * Checks if a given item date string falls within [startDate, endDate] inclusive.
 * Handles 'YYYY-MM-DD', ISO strings, or empty/null dates gracefully.
 */
export function isDateInRange(
  dateStr: string | undefined | null,
  startDate?: string,
  endDate?: string
): boolean {
  if (!startDate && !endDate) return true;
  if (!dateStr) return false;

  // Extract 'YYYY-MM-DD' prefix
  const cleaned = dateStr.trim().split('T')[0];
  if (!cleaned) return false;

  if (startDate && startDate.trim()) {
    if (cleaned < startDate.trim()) return false;
  }

  if (endDate && endDate.trim()) {
    if (cleaned > endDate.trim()) return false;
  }

  return true;
}

export type DatePresetKey = 'all' | 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'lastMonth' | 'thisYear';

export interface DatePresetOption {
  key: DatePresetKey;
  label: string;
}

export const DATE_PRESETS: DatePresetOption[] = [
  { key: 'all', label: 'All Time' },
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 Days' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
  { key: 'thisYear', label: 'This Year' },
];

/**
 * Generates ISO string 'YYYY-MM-DD' for date presets
 */
export function getDatePresetRange(preset: DatePresetKey): { startDate: string; endDate: string } {
  const now = new Date();
  const format = (d: Date) => d.toISOString().split('T')[0];

  switch (preset) {
    case 'today': {
      const todayStr = format(now);
      return { startDate: todayStr, endDate: todayStr };
    }
    case 'yesterday': {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = format(y);
      return { startDate: yStr, endDate: yStr };
    }
    case 'last7': {
      const past = new Date(now);
      past.setDate(past.getDate() - 6);
      return { startDate: format(past), endDate: format(now) };
    }
    case 'thisMonth': {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      return { startDate: format(firstDay), endDate: format(lastDay) };
    }
    case 'lastMonth': {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: format(firstDay), endDate: format(lastDay) };
    }
    case 'thisYear': {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31);
      return { startDate: format(firstDay), endDate: format(lastDay) };
    }
    case 'all':
    default:
      return { startDate: '', endDate: '' };
  }
}
