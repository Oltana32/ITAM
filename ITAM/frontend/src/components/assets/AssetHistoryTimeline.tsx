import { format, formatDistanceToNow } from 'date-fns';
import {
  PlusCircle, Edit3, RefreshCw, Activity, MapPin,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AssetHistoryEntry } from '@/hooks/useAssetHistory';

const iconMap: Record<string, React.ElementType> = {
  create: PlusCircle,
  field: Edit3,
  status: RefreshCw,
  location: MapPin,
};

const colorMap: Record<string, string> = {
  create: 'text-[hsl(var(--status-active))] bg-[hsl(var(--status-active-bg))]',
  field: 'text-primary bg-primary/10',
  status: 'text-[hsl(var(--chart-5))] bg-[hsl(var(--chart-5))]/10',
  location: 'text-[hsl(var(--chart-2))] bg-[hsl(var(--chart-2))]/10',
};

interface AssetHistoryTimelineProps {
  entries: AssetHistoryEntry[];
  loading?: boolean;
}

export function AssetHistoryTimeline({ entries, loading }: AssetHistoryTimelineProps) {
  if (loading) {
    return <p className="text-sm text-muted-foreground py-8 text-center">Loading history…</p>;
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
          <Activity className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No change history recorded yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[320px] pr-3">
      <div className="relative space-y-4 pl-2">
        <div className="absolute left-[18px] top-2 bottom-2 w-px bg-border" />
        {entries.map((entry) => {
          const Icon = iconMap[entry.change_type] || Activity;
          return (
            <div key={entry.id} className="relative flex gap-3">
              <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-background ${colorMap[entry.change_type] || colorMap.field}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 pt-1 min-w-0">
                <p className="text-sm font-medium leading-tight">{entry.summary}</p>
                {(entry.old_value || entry.new_value) && entry.change_type === 'field' && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {entry.old_value} → {entry.new_value}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground">
                    {entry.changed_by_name}
                    {entry.changed_by_role ? ` (${entry.changed_by_role})` : ''}
                    {' · '}
                    {formatDistanceToNow(new Date(entry.changed_at), { addSuffix: true })}
                  </p>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {format(new Date(entry.changed_at), 'PPp')}
                  </Badge>
                </div>
                {entry.reason && (
                  <p className="text-xs text-muted-foreground mt-1 italic">{entry.reason}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
