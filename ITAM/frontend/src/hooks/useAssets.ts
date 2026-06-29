import { useState, useEffect, useCallback } from 'react';
import { Asset } from '@/types/asset';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth';

const API_BASE = '/api/assets/';

function parseApiError(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback;
  const data = payload as Record<string, unknown>;
  if (typeof data.error === 'string') return data.error;
  if (typeof data.detail === 'string') return data.detail;
  if (Array.isArray(data.detail)) return data.detail.map(String).join(', ');
  const fieldMessages = Object.entries(data)
    .filter(([, value]) => Array.isArray(value) && value.length > 0)
    .map(([field, value]) => `${field}: ${(value as string[]).join(', ')}`);
  if (fieldMessages.length > 0) return fieldMessages.join('; ');
  return fallback;
}

// Module-level shared store so every page sees the same assets list.
let _assets: Asset[] = [];
const _listeners = new Set<(a: Asset[]) => void>();
const _emit = () => _listeners.forEach((l) => l(_assets));
let _loaded = false;

async function getOrCreateManufacturerId(name: string): Promise<number> {
  const res = await authFetch('/api/manufacturers/');
  if (!res.ok) throw new Error('Failed to load manufacturers');
  const payload = await res.json();
  const list = (Array.isArray(payload) ? payload : payload.results ?? []) as Array<{ id: number; name: string }>;
  const match = list.find((item) => item.name.toLowerCase() === name.trim().toLowerCase());
  if (match) return match.id;

  const createRes = await authFetch('/api/manufacturers/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: name.trim() || 'Unknown Manufacturer' }),
  });
  if (!createRes.ok) throw new Error('Failed to create manufacturer');
  const created = (await createRes.json()) as { id: number };
  return created.id;
}

async function getAnyLocationId(): Promise<number> {
  const res = await authFetch('/api/locations/');
  if (!res.ok) throw new Error('Failed to load locations');
  const payload = await res.json();
  const list = (Array.isArray(payload) ? payload : payload.results ?? []) as Array<{ id: number }>;
  if (list.length > 0) return list[0].id;

  const createRes = await authFetch('/api/locations/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Default Location',
      code: 'DEFAULT',
      building: 'Main',
      floor: 'Ground',
      room: 'A1',
      address: 'Awash Wine',
    }),
  });
  if (!createRes.ok) {
    if (createRes.status === 403) {
      toast.error('Cannot create default location: ask an IT admin to add a location');
      throw new Error('Permission denied: cannot create default location. Ask an IT admin to add a location.');
    }
    // Location may already exist (duplicate code) — reload and use the first available.
    const retryRes = await authFetch('/api/locations/');
    if (retryRes.ok) {
      const retryPayload = await retryRes.json();
      const retryList = (Array.isArray(retryPayload) ? retryPayload : retryPayload.results ?? []) as Array<{ id: number }>;
      if (retryList.length > 0) return retryList[0].id;
    }
    const errPayload = await createRes.json().catch(() => ({}));
    throw new Error(parseApiError(errPayload, 'Failed to create default location'));
  }
  const created = (await createRes.json()) as { id: number };
  return created.id;
}

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>(_assets);

  const toFrontend = useCallback((raw: any): Asset => ({
      id: String(raw.id),
      name: raw.name || 'Unknown Asset',
      assetTag: raw.tag || '',
      category: (raw.category || 'other') as Asset['category'],
      status: String(raw.status || 'available').replace('_', '-'),
      condition: (raw.condition || 'good') as Asset['condition'],
      department: raw.department || undefined,
      location: raw.location_name || raw.location || 'Unassigned',
      purchaseDate: raw.purchase_date || '',
      purchaseCost: raw.purchase_cost ?? undefined,
      warrantyExpiry: raw.warranty_expiry || undefined,
      manufacturer: raw.manufacturer_name || String(raw.manufacturer || ''),
      model: raw.model || '',
      serialNumber: raw.serial_number || '',
      notes: raw.notes || undefined,
      lastAuditDate: raw.last_audit_at || undefined,
      // Normalize assigned_to which may be a string or a nested user object ({id,email})
      assignedTo: (() => {
        const a = raw.assignedTo ?? raw.assigned_to;
        if (!a && a !== 0) return undefined;
        if (typeof a === 'object') return a.email || String(a.id) || undefined;
        return String(a);
      })(),
      employeeId: raw.employeeId || raw.employee_id || undefined,
      allocatedAt: raw.allocatedAt || raw.allocated_at || undefined,
    }), []);

  const fetchAssets = useCallback(async () => {
    const response = await authFetch(API_BASE);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(`${parseApiError(payload, response.statusText || 'Failed to load assets')} (${response.status})`);
    }
    const payloadRaw = await response.json();
    const payload = (Array.isArray(payloadRaw) ? payloadRaw : payloadRaw.results ?? []) as any[];
    const data = payload.map(toFrontend);
    _assets = data;
    _loaded = true;
    _emit();
    return data;
  }, [toFrontend]);

  useEffect(() => {
    const listener = (a: Asset[]) => setAssets(a);
    _listeners.add(listener);

    const refreshAssets = async () => {
      try {
        await fetchAssets();
      } catch {
        // Keep the current list and avoid noisy errors during background refresh.
      }
    };

    const onAssignmentsChanged = () => {
      refreshAssets();
    };

    window.addEventListener('asset-buddy-assignments-changed', onAssignmentsChanged);

    if (!_loaded) {
      fetchAssets().catch(() => {
        toast.error('Could not load assets from backend');
      });
    }

    return () => {
      _listeners.delete(listener);
      window.removeEventListener('asset-buddy-assignments-changed', onAssignmentsChanged);
    };
  }, [fetchAssets]);

  const addAsset = useCallback(async (data: Omit<Asset, 'id' | 'assetTag' | 'tag'>) => {
    const manufacturerId = await getOrCreateManufacturerId(data.manufacturer);
    const locationId = await getAnyLocationId();
    const category = data.category === 'printer' ? 'equipment' : data.category;
    const response = await authFetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        // tag is auto-generated by backend, do not send it
        category,
        status: data.status.replace(/-/g, '_'),
        condition: data.condition ?? 'good',
        purchase_date: data.purchaseDate || null,
        warranty_expiry: data.warrantyExpiry || null,
        purchase_cost: data.purchaseCost != null && data.purchaseCost !== ''
          ? Number(data.purchaseCost)
          : null,
        department: data.department || '',
        manufacturer: manufacturerId,
        location: locationId,
        model: data.model,
        serial_number: data.serialNumber,
        notes: data.notes ?? '',
      }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(parseApiError(payload, response.statusText || 'Failed to add asset'));
    }
    const newAsset = toFrontend(await response.json());
    _assets = [newAsset, ..._assets.filter((a) => a.id !== newAsset.id)];
    _emit();
    toast.success('Asset added successfully', {
      description: `${newAsset.name} (${newAsset.assetTag}) has been added.`,
    });
    return newAsset;
  }, [toFrontend]);

  const updateAsset = useCallback(async (id: string, data: Partial<Asset> & { locationId?: string | number }) => {
    const response = await authFetch(`${API_BASE}${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(data.name ? { name: data.name } : {}),
        ...(data.assetTag ? { tag: data.assetTag } : {}),
        ...(data.category ? { category: data.category } : {}),
        ...(data.status ? { status: data.status.replace(/-/g, '_') } : {}),
        ...(data.condition ? { condition: data.condition } : {}),
        ...(data.purchaseDate ? { purchase_date: data.purchaseDate } : {}),
        ...(data.warrantyExpiry ? { warranty_expiry: data.warrantyExpiry } : {}),
        ...(data.model ? { model: data.model } : {}),
        ...(data.serialNumber ? { serial_number: data.serialNumber } : {}),
        ...(data.assignedTo !== undefined ? { assigned_to: data.assignedTo } : {}),
        ...(data.employeeId !== undefined ? { employee_id: data.employeeId } : {}),
        ...(data.allocatedAt !== undefined ? { allocated_at: data.allocatedAt } : {}),
        ...(data.locationId !== undefined ? { location: Number(data.locationId) } : {}),
        ...(data.purchaseCost !== undefined
          ? {
              purchase_cost:
                data.purchaseCost !== '' && data.purchaseCost != null
                  ? Number(data.purchaseCost)
                  : null,
            }
          : {}),
        ...(data.department !== undefined ? { department: data.department } : {}),
      }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(parseApiError(payload, response.statusText || 'Failed to update asset'));
    }
    const updatedAsset = toFrontend(await response.json());
    _assets = _assets.map((asset) => (asset.id === id ? updatedAsset : asset));
    _emit();
    toast.success('Asset updated successfully');
  }, [toFrontend]);

  const deleteAsset = useCallback(async (id: string) => {
    const response = await authFetch(`${API_BASE}${id}/`, {
      method: 'DELETE',
    });
    if (!response.ok && response.status !== 404) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(parseApiError(payload, response.statusText || 'Failed to delete asset'));
    }
    _assets = _assets.filter((asset) => asset.id !== id);
    _emit();
    toast.success('Asset deleted');
  }, []);

  const getAssetById = useCallback(
    (id: string) => _assets.find((asset) => asset.id === id),
    []
  );

  return { assets, addAsset, updateAsset, deleteAsset, getAssetById, refetchAssets: fetchAssets };
}
