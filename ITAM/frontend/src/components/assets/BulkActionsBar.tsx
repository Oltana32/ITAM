import { Trash2, X, Download, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AssetStatus, statusLabels } from '@/types/asset';

interface BulkActionsBarProps {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  onStatusChange: (status: AssetStatus) => void;
  onExport: () => void;
  canDelete?: boolean;
}

export function BulkActionsBar({ count, onClear, onDelete, onStatusChange, onExport, canDelete = true }: BulkActionsBarProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm animate-fade-in">
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary text-xs font-bold">
          {count}
        </span>
        selected
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Select onValueChange={(v) => onStatusChange(v as AssetStatus)}>
          <SelectTrigger className="h-8 w-[170px] text-xs">
            <RotateCw className="mr-1.5 h-3 w-3" />
            <SelectValue placeholder="Change status…" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(statusLabels).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={onExport} className="h-8">
          <Download className="mr-1.5 h-3.5 w-3.5" /> Export
        </Button>
        {canDelete && (
          <Button variant="outline" size="sm" onClick={onDelete}
            className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onClear} className="h-8">
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}