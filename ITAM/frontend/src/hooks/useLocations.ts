import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth';

export interface Location {
  id: string;
  name: string;
  building: string;
  city: string;
  type: string;
  assetsCount: number;
  capacity: number;
  manager: string;
  status: string;
  departments: string[];
}

const API_BASE = '/api/locations/';

let _locations: Location[] = [];
const _listeners = new Set<(v: Location[]) => void>();
const _emit = () => _listeners.forEach((l) => l(_locations));
let _loaded = false;

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>(_locations);

  const toFrontend = useCallback((raw: any): Location => ({
    id: String(raw.id),
    name: raw.name,
    building: raw.building || '',
    city: raw.address || 'N/A',
    type: raw.floor || 'Office',
    assetsCount: 0,
    capacity: 0,
    manager: raw.room || 'Unassigned',
    status: 'active',
    departments: [],
  }), []);

  const fetchLocations = useCallback(async () => {
    const response = await authFetch(API_BASE);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const message = payload.detail || payload.error || response.statusText || 'Failed to load locations';
      throw new Error(`${message} (${response.status})`);
    }
    const payloadRaw = await response.json();
    const payload = (Array.isArray(payloadRaw) ? payloadRaw : payloadRaw.results ?? []) as any[];
    const data = payload.map(toFrontend);
    _locations = data;
    _loaded = true;
    _emit();
    return data;
  }, [toFrontend]);

  useEffect(() => {
    const fn = (v: Location[]) => setLocations(v);
    _listeners.add(fn);
    if (!_loaded) {
      fetchLocations().catch(() => {
        toast.error('Could not load locations from backend');
      });
    }
    return () => {
      _listeners.delete(fn);
    };
  }, [fetchLocations]);

  const addLocation = useCallback(async (data: Omit<Location, 'id' | 'assetsCount'> & Partial<Location>) => {
    const response = await authFetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        code: `LOC-${Date.now().toString().slice(-6)}`,
        building: data.building || 'Main Building',
        floor: data.type || 'General',
        room: data.manager || 'N/A',
        address: data.city || 'N/A',
        notes: data.departments?.join(', ') || '',
      }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      if (response.status === 403) {
        toast.error('You do not have permission to add locations');
        throw new Error('Permission denied');
      }
      toast.error(payload.error === 'Validation failed' ? 'Invalid location details' : 'Failed to add location');
      throw new Error(payload.error || 'Failed to add location');
    }
    const created = toFrontend(await response.json());
    _locations = [created, ..._locations.filter((l) => l.id !== created.id)];
    _emit();
    toast.success(`${created.name} added`);
    return created;
  }, [toFrontend]);

  const updateLocation = useCallback(async (id: string, data: Partial<Location>) => {
    const response = await authFetch(`${API_BASE}${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(data.name ? { name: data.name } : {}),
        ...(data.building ? { building: data.building } : {}),
        ...(data.type ? { floor: data.type } : {}),
        ...(data.manager ? { room: data.manager } : {}),
        ...(data.city ? { address: data.city } : {}),
      }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      toast.error(payload.error || 'Failed to update location');
      throw new Error(payload.error || 'Failed to update location');
    }
    const updated = toFrontend(await response.json());
    _locations = _locations.map((l) => (l.id === id ? updated : l));
    _emit();
    return updated;
  }, [toFrontend]);

  return { locations, addLocation, updateLocation };
}
