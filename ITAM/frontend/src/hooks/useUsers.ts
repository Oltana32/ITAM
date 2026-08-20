import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth';

export interface UserItem {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
}

export function useUsers() {
  const [users, setUsers] = useState<UserItem[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await authFetch('/api/users/');
        if (!res.ok) return;
        const payload = await res.json();
        const list = (Array.isArray(payload) ? payload : payload.results ?? []).map((u: any) => ({ id: u.id, email: u.email, first_name: u.first_name, last_name: u.last_name }));
        if (mounted) setUsers(list);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { users };
}
