import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/auth';
import { toast } from 'sonner';
import { AssignmentStatus } from '@/types/asset';

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
  status: AssignmentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const API_BASE = '/api/assignments/';

function parseApiError(payload: Record<string, unknown>, fallback: string): string {
  if (typeof payload.detail === 'string') return payload.detail;
  if (typeof payload.error === 'string') return payload.error;
  const fieldErrors = Object.entries(payload)
    .filter(([key]) => key !== 'detail' && key !== 'error')
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) return value.map((msg) => `${key}: ${msg}`);
      if (typeof value === 'string') return [`${key}: ${value}`];
      return [];
    });
  if (fieldErrors.length > 0) return fieldErrors.join('; ');
  return fallback;
}

async function fetchAssignments(): Promise<Assignment[]> {
  const response = await authFetch(API_BASE);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = payload.detail || payload.error || response.statusText || 'Failed to load assignments';
    throw new Error(message);
  }

  const payloadRaw = await response.json();
  const payload = (Array.isArray(payloadRaw) ? payloadRaw : payloadRaw.results ?? []) as any[];
  return payload.map((raw) => ({
    id: String(raw.id),
    asset: raw.asset,
    asset_tag: raw.asset_tag,
    asset_name: raw.asset_name,
    assignedBy: raw.assignedBy,
    assignedTo: raw.assignedTo,
    employeeId: raw.employeeId,
    department: raw.department || '',
    email: raw.email || '',
    phone: raw.phone || '',
    location: raw.location,
    assigned_date: raw.assigned_date,
    expectedReturnDate: raw.expectedReturnDate || raw.expected_return_date || null,
    returnDate: raw.actualReturnDate || raw.actual_return_date || raw.return_date || null,
    status: raw.status,
    notes: raw.notes || '',
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  }));
}

async function createAssignment(payload: Omit<Assignment, 'id' | 'assignedBy' | 'asset_tag' | 'asset_name' | 'created_at' | 'updated_at'>) {
  const response = await authFetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = parseApiError(payload, response.statusText || 'Failed to create assignment');
    throw new Error(message);
  }

  return (await response.json()) as Assignment;
}

async function updateAssignment(id: string | number, payload: Partial<Assignment>) {
  const response = await authFetch(`${API_BASE}${id}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const message = parseApiError(payload, response.statusText || 'Failed to update assignment');
    throw new Error(message);
  }

  return (await response.json()) as Assignment;
}

export function useAssignments() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['assignments'],
    queryFn: fetchAssignments,
    staleTime: 1000 * 60,
    onError: () => {
      toast.error('Could not load assignment history');
    },
  });

  const mutation = useMutation({
    mutationFn: createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries(['assignments']);
      window.dispatchEvent(new CustomEvent('asset-buddy-assignments-changed'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string | number; payload: Partial<Assignment> }) => updateAssignment(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['assignments']);
      window.dispatchEvent(new CustomEvent('asset-buddy-assignments-changed'));
    },
  });

  return {
    assignments: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetchAssignments: query.refetch,
    createAssignment: mutation.mutateAsync,
    isCreatingAssignment: mutation.isLoading,
    updateAssignment: updateMutation.mutateAsync,
    isUpdatingAssignment: updateMutation.isLoading,
  };
}
