import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth';
import { toast } from 'sonner';

export interface Assignment {
  id: string;
  asset: number;
  asset_tag: string;
  asset_name: string;
  assignedBy: string;
  assignedTo: string;
  employeeId: string;
  department?: string;
  email?: string;
  phone?: string;
  location: string;
  assigned_date: string;
  expectedReturnDate?: string | null;
  returnDate?: string | null;
  status: 'active' | 'returned' | 'overdue';
  notes?: string;
  created_at: string;
  updated_at: string;
}

const API_BASE = '/api/assignments/';

// Module-level shared store so every page sees the same assignments list.
let _assignments: Assignment[] = [];
const _listeners = new Set<(a: Assignment[]) => void>();
const _emit = () => _listeners.forEach((l) => l(_assignments));
let _loaded = false;

export function useAssignments() {
  const [assignments, setAssignments] = useState<Assignment[]>(_assignments);

  const fetchAssignments = useCallback(async () => {
    const response = await authFetch(API_BASE);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const message = payload.detail || payload.error || response.statusText || 'Failed to load assignments';
      throw new Error(`${message} (${response.status})`);
    }
    const payloadRaw = await response.json();
    const payload = (Array.isArray(payloadRaw) ? payloadRaw : payloadRaw.results ?? []) as any[];
    const data = payload.map((raw: any) => ({
      id: String(raw.id),
      asset: raw.asset,
      asset_tag: raw.asset_tag,
      asset_name: raw.asset_name,
      assignedBy: raw.assignedBy || raw.user_email || '',
      assignedTo: raw.assignedTo || raw.assigned_to || '',
      employeeId: raw.employeeId || raw.employee_id || '',
      department: raw.department || '',
      email: raw.email || '',
      phone: raw.phone || '',
      location: raw.location || raw.location_name || 'Unassigned',
      assigned_date: raw.assigned_date,
      expectedReturnDate: raw.expectedReturnDate || raw.expected_return_date || null,
      returnDate: raw.returnDate || raw.return_date || null,
      status: raw.status,
      notes: raw.notes || '',
      created_at: raw.created_at,
      updated_at: raw.updated_at,
    }));
    _assignments = data;
    _loaded = true;
    _emit();
    return data;
  }, []);

  useEffect(() => {
    const listener = (a: Assignment[]) => setAssignments(a);
    _listeners.add(listener);
    if (!_loaded) {
      fetchAssignments().catch(() => {
        toast.error('Could not load assignments from backend');
      });
    }
    return () => { _listeners.delete(listener); };
  }, [fetchAssignments]);

  return { assignments, refetchAssignments: fetchAssignments };
}