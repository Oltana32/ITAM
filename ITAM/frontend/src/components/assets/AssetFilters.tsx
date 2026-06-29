import { Search, Download, FileSpreadsheet, FileJson } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { AssetStatus, AssetCategory, statusLabels, categoryLabels } from '@/types/asset';

interface AssetFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: AssetStatus | 'all';
  onStatusChange: (value: AssetStatus | 'all') => void;
  categoryFilter: AssetCategory | 'all';
  onCategoryChange: (value: AssetCategory | 'all') => void;
  onExportCSV?: () => void;
  onExportJSON?: () => void;
}

export function AssetFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  categoryFilter,
  onCategoryChange,
  onExportCSV,
  onExportJSON,
}: AssetFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'backwards' }}>
      <div className="relative flex-1 min-w-[250px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name, tag, or serial number..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-card border-border/60 focus-visible:ring-primary/30 transition-shadow"
        />
      </div>
      <Select value={statusFilter} onValueChange={(value) => onStatusChange(value as AssetStatus | 'all')}>
        <SelectTrigger className="w-[160px] bg-card border-border/60">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {Object.entries(statusLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={categoryFilter} onValueChange={(value) => onCategoryChange(value as AssetCategory | 'all')}>
        <SelectTrigger className="w-[180px] bg-card border-border/60">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {Object.entries(categoryLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 bg-card border-border/60">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={onExportCSV} className="gap-2">
            <FileSpreadsheet className="h-4 w-4 text-[hsl(var(--status-active))]" />
            Export as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onExportJSON} className="gap-2">
            <FileJson className="h-4 w-4 text-[hsl(var(--status-available))]" />
            Export as JSON
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
