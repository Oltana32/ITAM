import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

export function NotificationsCard() {
  const { notifications } = useNotifications();
  const recentNotifications = notifications.filter((notification) => notification.category !== 'license').slice(0, 5);

  const typeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
    warning: {
      icon: AlertTriangle,
      color: 'text-[hsl(var(--chart-3))]',
      bgColor: 'bg-[hsl(var(--chart-3))]/10',
    },
    info: {
      icon: Info,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    success: {
      icon: CheckCircle,
      color: 'text-[hsl(var(--status-active))]',
      bgColor: 'bg-[hsl(var(--status-active))]/10',
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
          const config = typeConfig[notification.type];
          const Icon = config.icon;

          return (
            <div key={notification.id} className="flex gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div className={cn('p-2 rounded-lg flex-shrink-0', config.bgColor)}>
                <Icon className={cn('h-4 w-4', config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{notification.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                <p className="text-xs text-muted-foreground/60 pt-1">{notification.time}</p>
              </div>
              {!notification.read && (
                <div className="h-2 w-2 rounded-full bg-destructive flex-shrink-0 mt-2" />
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
