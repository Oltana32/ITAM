import { AssetStatus, statusLabels } from '@/types/asset';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: AssetStatus;
}

const statusStyles: Record<AssetStatus, string> = {
  'in-use': 'status-active',
  available: 'status-available',
  maintenance: 'status-maintenance',
  retired: 'status-retired',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status]
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
