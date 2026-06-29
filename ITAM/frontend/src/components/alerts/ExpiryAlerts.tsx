import { useEffect, useState } from 'react';
import { AlertTriangle, X, Clock, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAssets } from '@/hooks/useAssets';

interface ExpiryItem {
  id: string;
  name: string;
  type: 'warranty' | 'license';
  expiryDate: string;
  daysLeft: number;
  severity: 'critical' | 'warning';
}


function getDaysLeft(dateStr: string): number {
  const now = new Date();
  const expiry = new Date(dateStr);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getExpiryItems(assetsArr: Array<{ id: string; name: string; warrantyExpiry?: string }>): ExpiryItem[] {
  const items: ExpiryItem[] = [];
  const WARN_DAYS = 90;

  assetsArr.forEach((asset) => {
    if (!asset.warrantyExpiry) return;
    const daysLeft = getDaysLeft(asset.warrantyExpiry);
    if (daysLeft <= WARN_DAYS) {
      items.push({
        id: asset.id,
        name: asset.name,
        type: 'warranty',
        expiryDate: asset.warrantyExpiry,
        daysLeft,
        severity: daysLeft <= 0 ? 'critical' : daysLeft <= 30 ? 'critical' : 'warning',
      });
    }
  });

  return items.sort((a, b) => a.daysLeft - b.daysLeft);
}

export function ExpiryAlerts() {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const { assets } = useAssets();
  const items = getExpiryItems(assets);

  useEffect(() => {
    const critical = items.filter((i) => i.severity === 'critical');
    critical.forEach((item) => {
      const label = item.type === 'warranty' ? 'Warranty' : 'License';
      const msg = item.daysLeft <= 0
        ? `${item.name} ${label.toLowerCase()} has expired!`
        : `${item.name} ${label.toLowerCase()} expires in ${item.daysLeft} day${item.daysLeft !== 1 ? 's' : ''}`;
      toast.warning(msg, {
        id: `expiry-${item.id}`,
        duration: 8000,
        icon: item.daysLeft <= 0 ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />,
      });
    });
  }, []);

  const visible = items.filter((i) => !dismissed.has(i.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-2 animate-fade-in">
      {visible.map((item) => {
        const isCritical = item.severity === 'critical';
        const isExpired = item.daysLeft <= 0;
        return (
          <Alert
            key={item.id}
            variant={isCritical ? 'destructive' : 'default'}
            className={cn(
              'relative pr-10 border',
              isCritical
                ? 'border-destructive/30 bg-destructive/5'
                : 'border-[hsl(var(--chart-3))]/30 bg-[hsl(var(--chart-3))]/5'
            )}
          >
            {item.type === 'warranty' ? (
              <Shield className={cn('h-4 w-4', isCritical ? 'text-destructive' : 'text-[hsl(var(--chart-3))]')} />
            ) : (
              <KeySquare className={cn('h-4 w-4', isCritical ? 'text-destructive' : 'text-[hsl(var(--chart-3))]')} />
            )}
            <AlertTitle className="flex items-center gap-2">
              {item.name}
              <Badge
                variant="secondary"
                className={cn(
                  'text-[10px] px-1.5 py-0',
                  isCritical ? 'bg-destructive/10 text-destructive' : 'bg-[hsl(var(--chart-3))]/10 text-[hsl(var(--chart-3))]'
                )}
              >
                {item.type === 'warranty' ? 'Warranty' : 'License'}
              </Badge>
            </AlertTitle>
            <AlertDescription className={cn(!isCritical && 'text-[hsl(var(--chart-3))]')}>
              {isExpired
                ? `Expired ${Math.abs(item.daysLeft)} day${Math.abs(item.daysLeft) !== 1 ? 's' : ''} ago — immediate action required`
                : `Expires in ${item.daysLeft} day${item.daysLeft !== 1 ? 's' : ''} (${new Date(item.expiryDate).toLocaleDateString()})`}
            </AlertDescription>
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(item.id))}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </Alert>
        );
      })}
    </div>
  );
}
