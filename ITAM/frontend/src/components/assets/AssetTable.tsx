import { MoreHorizontal, Eye, Edit, Trash2, QrCode, ArrowUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Asset, categoryLabels } from '@/types/asset';
import { StatusBadge } from './StatusBadge';
import { CategoryIcon } from './CategoryIcon';
import { format } from 'date-fns';

interface AssetTableProps {
  assets: Asset[];
  onView?: (asset: Asset) => void;
  onEdit?: (asset: Asset) => void;
  onDelete?: (asset: Asset) => void;
  onShowQr?: (asset: Asset) => void;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  canDelete?: boolean;
}

type SortKey = 'name' | 'serialNumber' | 'category' | 'status' | 'assignedTo' | 'location' | 'purchaseDate';

export function AssetTable({
  assets, onView, onEdit, onDelete, onShowQr,
  selectedIds = [], onSelectionChange,
  canDelete = true,
}: AssetTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const sorted = useMemo(() => {
    const copy = [...assets];
    copy.sort((a, b) => {
      const av = (a[sortKey] || '') as string;
      const bv = (b[sortKey] || '') as string;
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return copy;
  }, [assets, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(k); setSortDir('asc'); }
  };

  const allSelected = sorted.length > 0 && sorted.every((a) => selectedIds.includes(a.id));
  const someSelected = sorted.some((a) => selectedIds.includes(a.id)) && !allSelected;

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? [] : sorted.map((a) => a.id));
  };

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  };

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button onClick={() => toggleSort(k)} className="flex items-center gap-1 hover:text-foreground transition-colors">
      {label}
      <ArrowUpDown className={`h-3 w-3 ${sortKey === k ? 'text-primary' : 'opacity-40'}`} />
    </button>
  );

  return (
    <div className="rounded-lg border bg-card overflow-hidden animate-fade-in">
      <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent bg-muted/50">
            {onSelectionChange && (
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={allSelected || (someSelected ? 'indeterminate' : false)}
                  onCheckedChange={toggleAll}
                  aria-label="Select all"
                />
              </TableHead>
            )}
            <TableHead className="w-[300px]"><SortBtn k="name" label="Asset" /></TableHead>
            <TableHead><SortBtn k="serialNumber" label="Serial" /></TableHead>
            <TableHead><SortBtn k="category" label="Category" /></TableHead>
            <TableHead><SortBtn k="status" label="Status" /></TableHead>
            <TableHead><SortBtn k="assignedTo" label="Assigned To" /></TableHead>
            <TableHead><SortBtn k="location" label="Location" /></TableHead>
            <TableHead><SortBtn k="purchaseDate" label="Purchase Date" /></TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={onSelectionChange ? 9 : 8} className="h-32 text-center text-muted-foreground">
                No assets found
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((asset, index) => (
              <TableRow 
                key={asset.id} 
                className={`cursor-pointer group transition-colors hover:bg-muted/50 ${selectedIds.includes(asset.id) ? 'bg-primary/5' : ''}`}
                onClick={() => onView?.(asset)}
                style={{ animationDelay: `${index * 0.03}s` }}
              >
                {onSelectionChange && (
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedIds.includes(asset.id)}
                      onCheckedChange={() => toggleOne(asset.id)}
                      aria-label={`Select ${asset.name}`}
                    />
                  </TableCell>
                )}
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-muted to-muted/50 ring-1 ring-border/50 transition-all duration-300 group-hover:ring-primary/30 group-hover:shadow-md">
                      <CategoryIcon
                        category={asset.category}
                        className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors duration-300"
                      />
                    </div>
                    <div>
                      <p className="font-medium group-hover:text-primary transition-colors duration-300">{asset.name}</p>
                      <p className="text-sm text-muted-foreground font-mono">{asset.assetTag}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{asset.serialNumber || '—'}</TableCell>
                <TableCell>{categoryLabels[asset.category]}</TableCell>
                <TableCell>
                  <StatusBadge status={asset.status} />
                </TableCell>
                <TableCell>{asset.assignedTo || '—'}</TableCell>
                <TableCell>{asset.location}</TableCell>
                <TableCell>{asset.purchaseDate ? format(new Date(asset.purchaseDate), 'MMM d, yyyy') : '—'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView?.(asset); }}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(asset); }}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShowQr?.(asset); }}>
                        <QrCode className="mr-2 h-4 w-4" />
                        QR Code
                      </DropdownMenuItem>
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); onDelete?.(asset); }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
      <div className="divide-y md:hidden">
        {sorted.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No assets found</div>
        ) : (
          sorted.map((asset) => (
            <div key={asset.id} className={`p-4 transition-colors ${selectedIds.includes(asset.id) ? 'bg-primary/5' : 'bg-card'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {onSelectionChange && (
                    <Checkbox
                      checked={selectedIds.includes(asset.id)}
                      onCheckedChange={() => toggleOne(asset.id)}
                      aria-label={`Select ${asset.name}`}
                      className="mt-1"
                    />
                  )}
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-muted to-muted/50 ring-1 ring-border/50">
                    <CategoryIcon category={asset.category} className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onView?.(asset); }}>
                      <Eye className="mr-2 h-4 w-4" />View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(asset); }}>
                      <Edit className="mr-2 h-4 w-4" />Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShowQr?.(asset); }}>
                      <QrCode className="mr-2 h-4 w-4" />QR Code
                    </DropdownMenuItem>
                    {canDelete && (
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete?.(asset); }} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <button type="button" className="mt-3 w-full text-left" onClick={() => onView?.(asset)}>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{asset.name}</p>
                  <StatusBadge status={asset.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground font-mono">{asset.assetTag}</p>
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <p><span className="font-medium text-foreground">Serial:</span> {asset.serialNumber || '—'}</p>
                  <p><span className="font-medium text-foreground">Category:</span> {categoryLabels[asset.category]}</p>
                  <p><span className="font-medium text-foreground">Assigned To:</span> {asset.assignedTo || '—'}</p>
                  <p><span className="font-medium text-foreground">Location:</span> {asset.location}</p>
                </div>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
