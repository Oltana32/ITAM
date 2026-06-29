import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/auth';

export interface AssetHistoryEntry {
  id: number;
  change_type: 'status' | 'field' | 'create' | 'location';
  field_name: string;
  field_label: string;
  old_value: string;
  new_value: string;
  from_status: string;
  to_status: string;
  summary: string;
  changed_by: number | null;
  changed_by_name: string;
  changed_by_email: string;
  changed_by_role: string;
  changed_at: string;
  reason: string;
}

async function fetchAssetHistory(assetId: string): Promise<AssetHistoryEntry[]> {
  const response = await authFetch(`/api/assets/${assetId}/history/`);
  if (!response.ok) {
    throw new Error('Failed to load asset history');
  }
  return response.json();
}

export function useAssetHistory(assetId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['asset-history', assetId],
    queryFn: () => fetchAssetHistory(assetId!),
    enabled: Boolean(assetId) && enabled,
  });
}
