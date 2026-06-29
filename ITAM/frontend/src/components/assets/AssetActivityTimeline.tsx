import { formatDistanceToNow } from 'date-fns';
import {
  PlusCircle, Edit3, Trash2, RefreshCw, UserPlus, ScanLine, Wrench, Activity,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ActivityEntry, ActivityType } from '@/hooks/useActivityLog';

const iconMap: Record<ActivityType, React.ElementType> = {
  created: PlusCircle,
  updated: Edit3,
  deleted: Trash2,
  'status-changed': RefreshCw,
  assigned: UserPlus,
  scanned: ScanLine,
  maintenance: Wrench,
};

const colorMap: Record<ActivityType, string> = {
  created: 'text-[hsl(var(--status-active))] bg-[hsl(var(--status-active-bg))]',
  updated: 'text-primary bg-primary/10',
  deleted: 'text-destructive bg-destructive/10',
  'status-changed': 'text-[hsl(var(--chart-5))] bg-[hsl(var(--chart-5))]/10',
  assigned: 'text-[hsl(var(--chart-2))] bg-[hsl(var(--chart-2))]/10',
  scanned: 'text-[hsl(var(--status-available))] bg-[hsl(var(--status-available-bg))]',
  maintenance: 'text-[hsl(var(--status-maintenance))] bg-[hsl(var(--status-maintenance-bg))]',
};

export function AssetActivityTimeline({ entries }: { entries: ActivityEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
          <Activity className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No activity recorded yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[260px] pr-3">
      <div className="relative space-y-4 pl-2">
        <div className="absolute left-[18px] top-2 bottom-2 w-px bg-border" />
        {entries.map((entry) => {
          const Icon = iconMap[entry.type] || Activity;
          return (
            <div key={entry.id} className="relative flex gap-3">
              <div className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-background ${colorMap[entry.type]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 pt-1">
                <p className="text-sm font-medium leading-tight">{entry.description}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {entry.user || 'Admin'} · {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}