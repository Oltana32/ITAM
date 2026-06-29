import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/auth';
import { toast } from 'sonner';

export type AuditSessionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface AuditSession {
  id: number;
  title: string;
  description: string;
  status: AuditSessionStatus;
  planned_date: string;
  audit_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  location: number | null;
  location_name: string | null;
  department: string;
  category: string;
  stats: {
    expected: number;
    verified: number;
    missing: number;
    progress_pct: number;
  };
  created_at: string;
}

export interface AuditResultRow {
  asset_id: number;
  asset_tag: string;
  asset_name: string;
  audit_status: 'found' | 'missing';
  assigned_to: string;
  scan_time: string | null;
  scanned_by: string;
  scanned_by_email: string;
  finding_id: number | null;
}

export interface AuditResults {
  expected: number;
  verified: number;
  missing: number;
  progress_pct: number;
  assets: AuditResultRow[];
  missing_assets: AuditResultRow[];
}

const SESSIONS_KEY = ['audit-sessions'];

async function parseError(res: Response, fallback: string) {
  const payload = await res.json().catch(() => ({}));
  return payload.detail || payload.error || fallback;
}

export function useAuditSessions() {
  return useQuery({
    queryKey: SESSIONS_KEY,
    queryFn: async () => {
      const res = await authFetch('/api/audit-sessions/');
      if (!res.ok) throw new Error(await parseError(res, 'Failed to load audits'));
      const data = await res.json();
      return (Array.isArray(data) ? data : data.results ?? []) as AuditSession[];
    },
  });
}

export function useAuditResults(sessionId: number | null, enabled = true) {
  return useQuery({
    queryKey: ['audit-results', sessionId],
    queryFn: async () => {
      const res = await authFetch(`/api/audit-sessions/${sessionId}/results/`);
      if (!res.ok) throw new Error(await parseError(res, 'Failed to load audit results'));
      return res.json() as Promise<AuditResults>;
    },
    enabled: Boolean(sessionId) && enabled,
    refetchInterval: 5000,
  });
}

export function useAuditMutations() {
  const qc = useQueryClient();

  const invalidate = (sessionId?: number) => {
    void qc.invalidateQueries({ queryKey: SESSIONS_KEY });
    if (sessionId) void qc.invalidateQueries({ queryKey: ['audit-results', sessionId] });
  };

  const createSession = useMutation({
    mutationFn: async (payload: {
      title: string;
      department: string;
      location: number | null;
      status: AuditSessionStatus;
      planned_date: string;
      description?: string;
    }) => {
      const res = await authFetch('/api/audit-sessions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await parseError(res, 'Failed to create audit'));
      return res.json() as Promise<AuditSession>;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Audit session created');
    },
  });

  const startSession = useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`/api/audit-sessions/${id}/start/`, { method: 'POST' });
      if (!res.ok) throw new Error(await parseError(res, 'Failed to start audit'));
      return res.json() as Promise<AuditSession>;
    },
    onSuccess: (_, id) => {
      invalidate(id);
      toast.success('Audit started — begin scanning assets');
    },
  });

  const scanAsset = useMutation({
    mutationFn: async ({ sessionId, assetTag }: { sessionId: number; assetTag: string }) => {
      const res = await authFetch(`/api/audit-sessions/${sessionId}/scan/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_tag: assetTag }),
      });
      if (res.status === 409) {
        const payload = await res.json();
        throw new Error('Already scanned in this audit');
      }
      if (!res.ok) throw new Error(await parseError(res, 'Scan failed'));
      return res.json();
    },
    onSuccess: (_, { sessionId }) => invalidate(sessionId),
  });

  const completeSession = useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`/api/audit-sessions/${id}/complete/`, { method: 'POST' });
      if (!res.ok) throw new Error(await parseError(res, 'Failed to complete audit'));
      return res.json() as Promise<AuditSession>;
    },
    onSuccess: (_, id) => {
      invalidate(id);
      toast.success('Audit completed — missing assets recorded');
    },
  });

  return { createSession, startSession, scanAsset, completeSession };
}

export async function downloadAuditExport(sessionId: number, format: 'xlsx' | 'pdf') {
  const path = format === 'xlsx'
    ? `/api/audit-sessions/${sessionId}/export-xlsx/`
    : `/api/audit-sessions/${sessionId}/export-pdf/`;
  const res = await authFetch(path);
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit-${sessionId}.${format === 'xlsx' ? 'xlsx' : 'html'}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function returnAssetByTag(assetTag: string) {
  const res = await authFetch('/api/assignments/return-by-tag/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asset_tag: assetTag }),
  });
  if (!res.ok) throw new Error(await parseError(res, 'Return failed'));
  return res.json();
}
