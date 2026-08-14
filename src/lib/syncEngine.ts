import { supabase } from './supabase';

// Multi-tab real-time communication channel using Web BroadcastChannel API
const BROADCAST_CHANNEL_NAME = 'patriot_erp_sync_channel';

let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not supported in this environment', e);
}

/**
 * Deleted items registry to prevent resurrection of deleted items by periodic remote polling
 */
const DELETED_IDS_STORAGE_KEY = 'patriot_erp_deleted_ids';

export function getDeletedIds(): Set<number> {
  try {
    const raw = localStorage.getItem(DELETED_IDS_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        return new Set(arr);
      }
    }
  } catch {
    // ignore
  }
  return new Set<number>();
}

export function recordDeletedId(id: number) {
  try {
    const set = getDeletedIds();
    set.add(id);
    // Keep set to a reasonable max size (e.g. latest 2000 deletions)
    const arr = Array.from(set).slice(-2000);
    localStorage.setItem(DELETED_IDS_STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // ignore
  }
}

/**
 * Intelligent non-destructive merge of Local and Remote entity lists
 * Guarantees that local newly created items are NEVER erased by remote polling.
 */
export function mergeEntityList<T extends { id: number }>(
  localList: T[],
  remoteList: T[] | null | undefined
): T[] {
  if (!remoteList || !Array.isArray(remoteList) || remoteList.length === 0) {
    return localList;
  }

  const deletedIds = getDeletedIds();
  const map = new Map<number, T>();

  // 1. Add all remote items (excluding locally deleted items)
  for (const rItem of remoteList) {
    if (!deletedIds.has(rItem.id)) {
      map.set(rItem.id, rItem);
    }
  }

  // 2. Add local items:
  // If item exists in remote, remote takes precedence (or local if newer).
  // If item only exists locally (newly created in this browser, not yet in remote), PRESERVE IT!
  for (const lItem of localList) {
    if (deletedIds.has(lItem.id)) {
      map.delete(lItem.id);
    } else if (!map.has(lItem.id)) {
      map.set(lItem.id, lItem);
    }
  }

  // Return sorted descending by ID (newest first)
  return Array.from(map.values()).sort((a, b) => b.id - a.id);
}

/**
 * Broadcast an update event to all other tabs/windows in the browser
 */
export function broadcastDataChange(key: string, data: any) {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({
        type: 'PATRIOT_DATA_CHANGE',
        key,
        data,
        timestamp: Date.now(),
      });
    } catch {
      // ignore
    }
  }
}

/**
 * Subscribe to multi-tab broadcast changes
 */
export function subscribeToBroadcast(callback: (key: string, data: any) => void): () => void {
  if (!broadcastChannel) return () => {};

  const handler = (event: MessageEvent) => {
    if (event.data && event.data.type === 'PATRIOT_DATA_CHANGE') {
      callback(event.data.key, event.data.data);
    }
  };

  broadcastChannel.addEventListener('message', handler);
  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', handler);
    }
  };
}

/**
 * Export full ERP dataset to a JSON backup file
 */
export function exportErpBackup(allData: Record<string, any>) {
  const jsonStr = JSON.stringify(allData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `patriot-erp-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import and parse JSON ERP backup file
 */
export function importErpBackup(file: File): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON backup file format.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}
