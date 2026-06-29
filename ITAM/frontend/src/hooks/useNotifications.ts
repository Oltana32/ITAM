import { useState } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success';
  time: string;
  read: boolean;
  category: string;
}

export function useNotifications() {
  const [notifications] = useState<Notification[]>([
    { id: '1', title: 'Warranty Expiring', message: 'Dell XPS 15 (AW-LPT-002) warranty expires in 15 days', type: 'warning', time: '2 hours ago', read: false, category: 'warranty' },
    { id: '2', title: 'Asset Assigned', message: 'MacBook Pro assigned to Abebe Bekele - IT Department', type: 'info', time: '5 hours ago', read: false, category: 'assignment' },
    { id: '3', title: 'Maintenance Complete', message: 'ThinkPad T14s (AW-LPT-003) battery replacement completed', type: 'success', time: '1 day ago', read: true, category: 'maintenance' },
    { id: '4', title: 'New Request Submitted', message: 'Kidist Alemu requested additional access for Marketing', type: 'info', time: '2 days ago', read: true, category: 'request' },
  ]);

  return { notifications };
}
