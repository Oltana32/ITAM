import { format } from 'date-fns';
import { 
  Calendar, 
  MapPin, 
  User, 
  Tag, 
  Box, 
  FileText, 
  Shield,
  Building,
  Hash,
  Edit,
  Trash2 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Asset, categoryLabels } from '@/types/asset';
import { StatusBadge } from './StatusBadge';
import { CategoryIcon } from './CategoryIcon';
import { useAssetHistory } from '@/hooks/useAssetHistory';
import { AssetHistoryTimeline } from './AssetHistoryTimeline';

interface AssetDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
  canDelete?: boolean;
  readOnly?: boolean;
}

function DetailItem({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: React.ElementType; 
  label: string; 
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

export function AssetDetailDialog({ 
  open, 
  onOpenChange, 
  asset, 
  onEdit, 
  onDelete,
  canDelete = true,
  readOnly = false,
}: AssetDetailDialogProps) {
  const { data: history = [], isLoading: historyLoading } = useAssetHistory(
    asset?.id ?? null,
    open,
  );
  if (!asset) return null;

  const isWarrantyExpired = asset.warrantyExpiry && new Date(asset.warrantyExpiry) < new Date();
  const warrantyDaysRemaining = asset.warrantyExpiry 
    ? Math.ceil((new Date(asset.warrantyExpiry).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/10">
              <CategoryIcon category={asset.category} className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl truncate">{asset.name}</DialogTitle>
              <DialogDescription className="flex items-center gap-2 mt-1">
                <span className="font-mono text-sm">{asset.assetTag}</span>
                <span className="text-muted-foreground/40">•</span>
                <StatusBadge status={asset.status} />
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator className="my-4" />

        <Tabs defaultValue="details">
          <TabsList className="mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">History {history.length > 0 && `(${history.length})`}</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          <DetailItem 
            icon={Box} 
            label="Category" 
            value={categoryLabels[asset.category]} 
          />
          <DetailItem 
            icon={Building} 
            label="Manufacturer" 
            value={asset.manufacturer} 
          />
          <DetailItem 
            icon={Tag} 
            label="Model" 
            value={asset.model} 
          />
          <DetailItem 
            icon={Hash} 
            label="Serial Number" 
            value={<span className="font-mono text-sm">{asset.serialNumber}</span>} 
          />
          <DetailItem 
            icon={MapPin} 
            label="Location" 
            value={asset.location} 
          />
          <DetailItem 
            icon={User} 
            label="Assigned To" 
            value={asset.assignedTo} 
          />
          <DetailItem 
            icon={Calendar} 
            label="Purchase Date" 
            value={format(new Date(asset.purchaseDate), 'MMMM d, yyyy')} 
          />
          <DetailItem 
            icon={Shield} 
            label="Warranty Expiry" 
            value={
              asset.warrantyExpiry ? (
                <span className={isWarrantyExpired ? 'text-destructive' : ''}>
                  {format(new Date(asset.warrantyExpiry), 'MMMM d, yyyy')}
                  {warrantyDaysRemaining !== null && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({isWarrantyExpired ? 'Expired' : `${warrantyDaysRemaining} days left`})
                    </span>
                  )}
                </span>
              ) : null
            } 
          />
            </div>

        {asset.notes && (
          <>
            <Separator className="my-4" />
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="mt-1 text-sm">{asset.notes}</p>
              </div>
            </div>
          </>
        )}
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
            <AssetHistoryTimeline entries={history} loading={historyLoading} />
          </TabsContent>
        </Tabs>

        {!readOnly && (
          <>
            <Separator className="my-4" />
            <div className="flex justify-between">
              {canDelete ? (
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(asset)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Asset
                </Button>
              ) : (
                <div />
              )}
              <Button onClick={() => onEdit(asset)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Asset
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
