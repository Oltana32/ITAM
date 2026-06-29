import { differenceInDays, format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, AlertTriangle } from 'lucide-react';
import { Asset } from '@/types/asset';

export function WarrantyTimeline({ assets }: { assets: Asset[] }) {
  const upcoming = assets
    .filter((a) => a.warrantyExpiry)
    .map((a) => ({ ...a, daysLeft: differenceInDays(new Date(a.warrantyExpiry!), new Date()) }))
    .filter((a) => a.daysLeft >= 0 && a.daysLeft <= 180)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  return (
    <Card className="card-hover animate-fade-in-up">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          Warranty Expiring Soon
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No warranties expiring in the next 180 days</p>
        ) : (
          upcoming.map((a) => (
            <div key={a.id} className="flex items-center gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                a.daysLeft <= 30 ? 'bg-destructive/10 text-destructive' : 'bg-[hsl(var(--status-maintenance-bg))] text-[hsl(var(--status-maintenance))]'
              }`}>
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{a.name}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(a.warrantyExpiry!), 'MMM d, yyyy')}
                </p>
              </div>
              <span className={`text-xs font-semibold ${a.daysLeft <= 30 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {a.daysLeft}d
              </span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}