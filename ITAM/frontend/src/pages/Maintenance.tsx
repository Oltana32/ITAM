import { Wrench, AlertTriangle, CheckCircle, Clock, CalendarDays, Plus, Search, MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { authFetch } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAssets } from '@/hooks/useAssets';

const API_BASE = '/api/maintenance/';

interface MaintenanceWorkOrder {
  id: string;
  asset: string;
  assetTag: string;
  type: string;
  status: string;
  technician: string;
  description: string;
  created: string;
  scheduleDate: string;
  completedDate: string | null;
  cost: number | null;
}

interface MaintenanceFormData {
  asset: string;
  type: string;
  status: string;
  scheduleDate: string;
  completedDate: string;
  technician: string;
  cost: string;
  description: string;
}

const maintenanceTypes = [
  { value: 'preventive', label: 'Preventive' },
  { value: 'corrective', label: 'Corrective' },
  { value: 'upgrade', label: 'Upgrade' },
  { value: 'inspection', label: 'Inspection' },
];

const maintenanceStatuses = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

const woStatusStyles: Record<string, string> = {
  'in_progress': 'bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))]',
  'scheduled': 'bg-[hsl(var(--chart-3))]/10 text-[hsl(var(--chart-3))]',
  'completed': 'bg-[hsl(var(--status-active))]/10 text-[hsl(var(--status-active))]',
  'cancelled': 'bg-destructive/10 text-destructive',
};

function normalizeMaintenanceRecord(raw: any): MaintenanceWorkOrder {
  const created = raw.created_at ? raw.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const scheduleDate = raw.schedule_date || created;
  const assetName = raw.asset_name || raw.asset?.name || 'Unknown Asset';
  return {
    id: String(raw.id),
    asset: assetName,
    assetTag: raw.asset_tag || raw.asset?.tag || '',
    type: String(raw.type || 'maintenance'),
    status: String(raw.status || 'scheduled'),
    technician: raw.technician_email || 'Unassigned',
    description: raw.description || '',
    created,
    scheduleDate,
    completedDate: raw.completed_date || null,
    cost: raw.cost || null,
  };
}

function resolveAssetId(query: string, assets: any[]) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;
  const matched = assets.find((asset) => {
    return [asset.assetTag, asset.name, asset.serialNumber]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase() === normalized);
  });
  return matched?.id ?? null;
}

export default function Maintenance() {
  const [searchQuery, setSearchQuery] = useState('');
  const [workOrders, setWorkOrders] = useState<MaintenanceWorkOrder[]>([]);
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loadingWorkOrders, setLoadingWorkOrders] = useState(false);
  const [form, setForm] = useState<MaintenanceFormData>({ asset: '', type: maintenanceTypes[0].value, status: maintenanceStatuses[0].value, scheduleDate: '', completedDate: '', technician: '', cost: '', description: '' });
  const { assets } = useAssets();

  useEffect(() => {
    const loadWorkOrders = async () => {
      setLoadingWorkOrders(true);
      try {
        const response = await authFetch(API_BASE);
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          const message = payload.detail || payload.error || response.statusText || 'Failed to load maintenance records';
          throw new Error(message);
        }
        const json = await response.json();
        const records = (Array.isArray(json) ? json : json.results ?? []) as any[];
        setWorkOrders(records.map(normalizeMaintenanceRecord));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load maintenance records');
      } finally {
        setLoadingWorkOrders(false);
      }
    };

    void loadWorkOrders();
  }, []);

  const maintenanceAssets = assets.filter(a => a.status === 'maintenance');
  const warrantyExpiring = assets.filter(a => {
    if (!a.warrantyExpiry) return false;
    const days = Math.ceil((new Date(a.warrantyExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 && days <= 90;
  });
  const warrantyExpired = assets.filter(a => {
    if (!a.warrantyExpiry) return false;
    return new Date(a.warrantyExpiry) < new Date();
  });
  const healthScore = assets.length ? Math.round(((assets.length - maintenanceAssets.length - warrantyExpired.length) / assets.length) * 100) : 0;

  const filteredWorkOrders = workOrders.filter(wo =>
    searchQuery === '' || wo.asset.toLowerCase().includes(searchQuery.toLowerCase()) || wo.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.asset.trim() || !form.type.trim() || !form.scheduleDate.trim()) {
      toast.error('Asset, work type, and schedule date are required');
      return;
    }

    try {
      const response = await authFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset: Number(form.asset),
          type: form.type,
          schedule_date: form.scheduleDate,
          completed_date: form.completedDate || null,
          status: form.status,
          technician: form.technician ? Number(form.technician) : null,
          cost: form.cost ? Number(form.cost) : null,
          description: form.description || '',
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = payload.detail || payload.error || response.statusText || 'Failed to create work order';
        throw new Error(message);
      }
      const createdResponse = await response.json();
      const created = normalizeMaintenanceRecord(createdResponse);
      setWorkOrders((prev) => [created, ...prev]);
      toast.success(`Work order created for ${created.asset}`);
      setForm({ asset: '', type: maintenanceTypes[0].value, status: maintenanceStatuses[0].value, scheduleDate: '', completedDate: '', technician: '', cost: '', description: '' });
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create work order');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await authFetch(`${API_BASE}export/`);
      if (!response.ok) throw new Error('Failed to export maintenance data');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'maintenance_export.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Maintenance export downloaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--chart-3))] to-[hsl(var(--chart-3))]/70 shadow-lg shadow-[hsl(var(--chart-3))]/20">
              <Wrench className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
              <p className="text-muted-foreground">Warranty monitoring & work orders</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleExport} disabled={exporting} className="shadow-lg shadow-primary/10">
              <span>{exporting ? 'Exporting…' : 'Export CSV'}</span>
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-lg shadow-primary/20">
                  <Plus className="mr-2 h-4 w-4" />
                  New Work Order
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create work order</DialogTitle>
                  <DialogDescription>Schedule a maintenance task.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="wo-asset">Asset</Label>
                  <Select value={form.asset} onValueChange={(v) => setForm({ ...form, asset: v })}>
                    <SelectTrigger id="wo-asset">
                      <SelectValue placeholder="Select an asset" />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-muted-foreground">No assets available</div>
                      ) : (
                        assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.name} ({asset.assetTag}) - {asset.serialNumber}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                  <div className="grid gap-2">
                    <Label>Work type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {maintenanceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="capitalize">
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {maintenanceStatuses.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="wo-schedule">Schedule date</Label>
                      <Input id="wo-schedule" type="date" value={form.scheduleDate} onChange={(e) => setForm({ ...form, scheduleDate: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="wo-completed">Completed date</Label>
                      <Input id="wo-completed" type="date" value={form.completedDate} onChange={(e) => setForm({ ...form, completedDate: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="wo-cost">Cost (optional)</Label>
                    <Input id="wo-cost" type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} placeholder="0.00" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="wo-desc">Description</Label>
                    <Textarea id="wo-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional details..." rows={3} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate}>Create work order</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4 animate-fade-in-up">
          <Card className="card-hover relative overflow-hidden">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[hsl(var(--chart-3))]/10"><Wrench className="h-5 w-5 text-[hsl(var(--chart-3))]" /></div>
              <div><p className="text-2xl font-bold">{maintenanceAssets.length}</p><p className="text-sm text-muted-foreground">In Maintenance</p></div>
            </CardContent>
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[hsl(var(--chart-3))]/40 to-transparent" />
          </Card>
          <Card className="card-hover relative overflow-hidden">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
              <div><p className="text-2xl font-bold">{warrantyExpired.length}</p><p className="text-sm text-muted-foreground">Warranty Expired</p></div>
            </CardContent>
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-destructive/40 to-transparent" />
          </Card>
          <Card className="card-hover relative overflow-hidden">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[hsl(var(--chart-5))]/10"><Clock className="h-5 w-5 text-[hsl(var(--chart-5))]" /></div>
              <div><p className="text-2xl font-bold">{warrantyExpiring.length}</p><p className="text-sm text-muted-foreground">Expiring Soon</p></div>
            </CardContent>
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[hsl(var(--chart-5))]/40 to-transparent" />
          </Card>
          <Card className="card-hover relative overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Health Score</p>
                  <p className="text-2xl font-bold mt-1">{healthScore}%</p>
                  <Progress value={healthScore} className="h-2 mt-2 w-20" />
                </div>
                <div className="p-3 rounded-xl bg-[hsl(var(--status-active))]/10"><CheckCircle className="h-5 w-5 text-[hsl(var(--status-active))]" /></div>
              </div>
            </CardContent>
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[hsl(var(--status-active))]/40 to-transparent" />
          </Card>
        </div>

        {/* Work Orders */}
        <div className="relative max-w-sm animate-fade-in-up">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search work orders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>

        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-[hsl(var(--chart-3))]" />
              Work Orders ({filteredWorkOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredWorkOrders.map((wo, idx) => (
                <div
                  key={wo.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/50 hover:border-border transition-all duration-200 group animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'backwards' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-xs font-mono text-muted-foreground">{wo.id}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm capitalize">{wo.type}</p>
                        <Badge variant="secondary" className={woStatusStyles[wo.status]}>{wo.status.replace('_', ' ')}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{wo.asset} · {wo.technician} · Scheduled {wo.scheduleDate}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Update Status</DropdownMenuItem>
                      <DropdownMenuItem>Reassign</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Warranty Sections */}
        {warrantyExpiring.length > 0 && (
          <Card className="animate-fade-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-[hsl(var(--chart-3))]" />
                Warranty Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {warrantyExpiring.map((asset) => {
                  const days = Math.ceil((new Date(asset.warrantyExpiry!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={asset.id} className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors">
                      <div>
                        <p className="font-semibold text-sm">{asset.name}</p>
                        <p className="text-xs text-muted-foreground">{asset.assetTag} · {asset.location}</p>
                      </div>
                      <Badge variant="secondary" className="bg-[hsl(var(--chart-3))]/10 text-[hsl(var(--chart-3))]">
                        {days} days left
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
