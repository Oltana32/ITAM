import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth';

export interface Notification {
  id: string;
  notification_type: string;
  notification_type_display: string;
  message: string;
  read_status: boolean;
  related_asset_id: number | null;
  related_assignment_id: number | null;
  related_maintenance_id: number | null;
  created_at: string;
}

const API_BASE = '/api/notifications/';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch(API_BASE);
      if (!response.ok) {
        throw new Error('Failed to load notifications');
      }
      const data = await response.json();
      const list = Array.isArray(data) ? data : data.results || [];
      setNotifications(list);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const markAllRead = useCallback(async () => {
    try {
      const response = await authFetch(`${API_BASE}mark_all_read/`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to mark notifications read');
      setNotifications((prev) => prev.map((notification) => ({ ...notification, read_status: true })));
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark all as read');
    }
  }, []);

  const clearAll = useCallback(async () => {
    try {
      const response = await authFetch(`${API_BASE}clear_all/`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to clear notifications');
      setNotifications([]);
      const payload = await response.json();
      toast.success(`${payload.count || 'All'} notifications cleared`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to clear notifications');
    }
  }, []);

  const markRead = useCallback(async (id: string) => {
    try {
      const response = await authFetch(`${API_BASE}${id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read_status: true }),
      });
      if (!response.ok) throw new Error('Failed to mark notification read');
      setNotifications((prev) => prev.map((notification) => notification.id === id ? { ...notification, read_status: true } : notification));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to mark notification as read');
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const response = await authFetch(`${API_BASE}${id}/`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete notification');
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete notification');
    }
  }, []);

  return {
    notifications,
    loading,
    fetchNotifications,
    markAllRead,
    clearAll,
    markRead,
    deleteNotification,
  };
}
