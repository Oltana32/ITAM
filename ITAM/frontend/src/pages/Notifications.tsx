import { useMemo, useState } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, Clock, Trash2, CheckCheck, Filter, Loader } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/useNotifications';

const notificationTypeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  asset_assigned: { icon: Info, color: 'text-primary', label: 'Asset Assigned' },
  asset_returned: { icon: Info, color: 'text-primary', label: 'Asset Returned' },
  asset_retired: { icon: Info, color: 'text-primary', label: 'Asset Retired' },
  asset_disposed: { icon: Info, color: 'text-primary', label: 'Asset Disposed' },
  maintenance_created: { icon: AlertTriangle, color: 'text-[hsl(var(--chart-3))]', label: 'Maintenance Created' },
  maintenance_completed: { icon: CheckCircle, color: 'text-[hsl(var(--status-active))]', label: 'Maintenance Completed' },
  license_expiry: { icon: AlertTriangle, color: 'text-[hsl(var(--chart-3))]', label: 'License Nearing Expiry' },
};

const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  warning: { icon: AlertTriangle, color: 'text-[hsl(var(--chart-3))]' },
  info: { icon: Info, color: 'text-primary' },
  success: { icon: CheckCircle, color: 'text-[hsl(var(--status-active))]' },
};

export default function Notifications() {
  const [typeFilter, setTypeFilter] = useState('all');
  const { notifications, loading, markAllRead, clearAll, markRead, deleteNotification } = useNotifications();

  const filtered = useMemo(
    () => notifications.filter((n) => typeFilter === 'all' || n.notification_type === typeFilter),
    [notifications, typeFilter]
  );
  const unread = useMemo(
    () => notifications.filter((n) => !n.read_status).length,
    [notifications]
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20 relative">
              <Bell className="h-5 w-5 text-primary-foreground" />
              {unread > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">{unread}</span>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
              <p className="text-muted-foreground">{unread} unread notification{unread !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={markAllRead} disabled={unread === 0} className="gap-1.5">
              <CheckCheck className="h-3.5 w-3.5" />Mark All Read
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll} className="gap-1.5 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" />Clear Read
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 animate-fade-in-up">
          {[
            { label: 'Total', count: notifications.length, color: 'bg-primary/10 text-primary' },
            { label: 'Maintenance', count: notifications.filter(n => n.notification_type.includes('maintenance')).length, color: 'bg-[hsl(var(--chart-3))]/10 text-[hsl(var(--chart-3))]' },
            { label: 'Unread', count: unread, color: 'bg-destructive/10 text-destructive' },
            { label: 'Licenses', count: notifications.filter(n => n.notification_type === 'license_expiry').length, color: 'bg-[hsl(var(--status-active))]/10 text-[hsl(var(--status-active))]' },
          ].map(s => (
            <Card key={s.label} className="card-hover">
              <CardContent className="pt-5 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${s.color}`}><Bell className="h-4 w-4" /></div>
                <div><p className="text-2xl font-bold">{s.count}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filter */}
        <div className="flex gap-3 animate-fade-in-up">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]"><Filter className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="asset_assigned">Asset Assigned</SelectItem>
              <SelectItem value="maintenance_created">Maintenance Created</SelectItem>
              <SelectItem value="maintenance_completed">Maintenance Completed</SelectItem>
              <SelectItem value="license_expiry">License Expiry</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        <Card className="animate-fade-in-up">
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No notifications</div>
                ) : filtered.map((notif) => {
                  const cfg = notificationTypeConfig[notif.notification_type] || notificationTypeConfig.asset_assigned;
                  const createdDate = new Date(notif.created_at);
                  const timeAgo = getTimeAgo(createdDate);
                  
                  return (
                    <div key={notif.id} className={cn(
                      'flex items-start gap-3 p-3 rounded-xl border border-border/50 transition-colors hover:bg-muted/50 group',
                      !notif.read_status && 'bg-primary/[0.03] border-primary/20'
                    )}>
                      <cfg.icon className={cn('h-4 w-4 mt-0.5 shrink-0', cfg.color)} />
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => markRead(notif.id)}>
                        <div className="flex items-center gap-2">
                          <p className={cn('text-sm font-medium', !notif.read_status && 'font-semibold')}>{cfg.label}</p>
                          {!notif.read_status && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                          <Badge variant="outline" className="text-[9px] ml-auto capitalize">{notif.notification_type.replace(/_/g, ' ')}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{notif.message}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{timeAgo}</span>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteNotification(notif.id)}>
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
