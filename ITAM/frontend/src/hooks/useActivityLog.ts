import { useCallback, useEffect, useState } from 'react';
import { generateUuid } from '@/lib/utils';

export type ActivityType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status-changed'
  | 'assigned'
  | 'scanned'
  | 'maintenance';

export interface ActivityEntry {
  id: string;
  assetId?: string;
  assetName?: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  user?: string;
}

const STORAGE_KEY = 'assetBuddy.activity.entries';

const readStoredEntries = (): ActivityEntry[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

let _entries: ActivityEntry[] = readStoredEntries();
const _listeners = new Set<(e: ActivityEntry[]) => void>();
const _emit = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(_entries));
  }
  _listeners.forEach((l) => l(_entries));
};
let _loaded = false;

export function useActivityLog() {
  const [entries, setEntries] = useState<ActivityEntry[]>(_entries);

  const fetchEntries = useCallback(async () => {
    const data = readStoredEntries();
    _entries = data;
    _loaded = true;
    _emit();
    return data;
  }, []);

  useEffect(() => {
    const fn = (e: ActivityEntry[]) => setEntries(e);
    _listeners.add(fn);
    if (!_loaded) {
      void fetchEntries();
    }
    return () => {
      _listeners.delete(fn);
    };
  }, [fetchEntries]);

  const log = useCallback((entry: Omit<ActivityEntry, 'id' | 'timestamp'>) => {
    const settings = typeof window !== 'undefined' ? JSON.parse(window.localStorage.getItem('itam_settings') ?? '{}') : {};
    if (settings.logUserActions === false) {
      return;
    }

    const saved: ActivityEntry = {
      ...entry,
      id: generateUuid(),
      timestamp: new Date().toISOString(),
      user: entry.user || 'System',
    };
    _entries = [saved, ..._entries.filter((e) => e.id !== saved.id)].slice(0, 200);
    _emit();
  }, []);

  const clear = useCallback(() => {
    _entries = [];
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    _emit();
  }, []);

  const forAsset = useCallback(
    (assetId: string) => entries.filter((e) => e.assetId === assetId),
    [entries],
  );

  return { entries, log, clear, forAsset };
}
