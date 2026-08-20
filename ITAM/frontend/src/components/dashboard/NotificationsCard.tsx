import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

export function NotificationsCard() {
  const { notifications } = useNotifications();
  const recentNotifications = notifications.slice(0, 5);

  const typeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
    asset_assigned: {
      icon: Info,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    asset_returned: {
      icon: Info,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    asset_retired: {
      icon: Info,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    asset_disposed: {
      icon: Info,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    maintenance_created: {
      icon: AlertTriangle,
      color: 'text-[hsl(var(--chart-3))]',
      bgColor: 'bg-[hsl(var(--chart-3))]/10',
    },
    maintenance_completed: {
      icon: CheckCircle,
      color: 'text-[hsl(var(--status-active))]',
      bgColor: 'bg-[hsl(var(--status-active))]/10',
    },
    license_expiry: {
      icon: AlertTriangle,
      color: 'text-[hsl(var(--chart-3))]',
      bgColor: 'bg-[hsl(var(--chart-3))]/10',
    },
  };

  return (
    <Card className="card-hover animate-fade-in-up">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentNotifications.map((notification) => {
          const config = typeConfig[notification.notification_type] || typeConfig.asset_assigned;
          const Icon = config.icon;
          const createdAt = notification.created_at ? new Date(notification.created_at).toLocaleDateString() : '';

          return (
            <div key={notification.id} className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className={cn('p-2 rounded-lg flex-shrink-0', config.bgColor)}>
                <Icon className={cn('h-4 w-4', config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{notification.notification_type_display || notification.notification_type.replace(/_/g, ' ')}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                {createdAt && <p className="text-xs text-muted-foreground/60 pt-1">{createdAt}</p>}
              </div>
              {!notification.read_status && (
                <div className="h-2 w-2 rounded-full bg-destructive flex-shrink-0 mt-2" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
