import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth';
import { toast } from 'sonner';
import { useLocations } from './useLocations';

export interface DepartmentItem {
  id?: number;
  code?: string;
  name: string;
}

export function useDepartments() {
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const { locations } = useLocations();

  useEffect(() => {
    let mounted = true;
    async function fetchDeps() {
      try {
        const res = await authFetch('/api/departments/');
        if (res.ok) {
          const payload = await res.json();
          const list = (Array.isArray(payload) ? payload : payload.results ?? []).map((d: any) => ({ id: d.id, code: d.code, name: d.name }));
          if (mounted) setDepartments(list);
          return;
        }
      } catch (err) {
        // ignore — fall back to locations
      }

      // fallback: extract unique department names from locations
      const setNames = new Set<string>();
      locations.forEach((l) => (l.departments || []).forEach((d) => setNames.add(d)));
      const list = Array.from(setNames).map((n) => ({ name: n }));
      if (mounted) setDepartments(list);
    }
    void fetchDeps();
    return () => { mounted = false; };
  }, [locations]);

  return { departments };
}
