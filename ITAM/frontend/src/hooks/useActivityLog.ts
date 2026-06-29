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

let _entries: ActivityEntry[] = [];
const _listeners = new Set<(e: ActivityEntry[]) => void>();
const _emit = () => _listeners.forEach((l) => l(_entries));
let _loaded = false;

export function useActivityLog() {
  const [entries, setEntries] = useState<ActivityEntry[]>(_entries);

  const fetchEntries = useCallback(async () => {
    const data = _entries;
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
    const saved: ActivityEntry = {
      ...entry,
      id: generateUuid(),
      timestamp: new Date().toISOString(),
      user: entry.user || 'System',
    };
    _entries = [saved, ..._entries.filter((e) => e.id !== saved.id)];
    _emit();
  }, []);

  const clear = useCallback(() => {
    _entries = [];
    _emit();
  }, []);

  const forAsset = useCallback(
    (assetId: string) => entries.filter((e) => e.assetId === assetId),
    [entries],
  );

  return { entries, log, clear, forAsset };
}
