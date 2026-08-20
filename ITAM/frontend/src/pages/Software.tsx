import { useEffect, useState } from 'react';
import { KeySquare, Plus, AlertCircle, CheckCircle, TrendingUp, Search, Filter, ExternalLink, MoreHorizontal, RefreshCw } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { vendorOptions } from '@/types/asset';

const API_BASE = '/api/licenses/';

interface SoftwareLicense {
  id: string;
  name: string;
  vendor: string;
  vendorDisplay: string;
  totalLicenses: number;
  usedLicenses: number;
  activeUsers: number;
  expiryDate: string;
  cost: number;
  currency: string;
  perSeatCost: number;
  status: string;
  category: string;
  notes?: string;
}

interface LicenseFormData {
  name: string;
  vendor: string;
  category: string;
  totalLicenses: number;
  activeUsers: number;
  cost: number;
  currency?: string;
  expiryDate: string;
  notes: string;
}

function normalizeSoftwareLicense(raw: any): SoftwareLicense {
  const expiryDate = raw.expiry_date || '';
  const daysUntilExpiry = expiryDate ? Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000) : Infinity;
  const inferredStatus = raw.status || (expiryDate
    ? daysUntilExpiry < 0
      ? 'expired'
      : daysUntilExpiry < 60
      ? 'warning'
      : 'active'
    : 'active');

  const totalSeats = Number(raw.seats ?? 0) || 0;
  const usedSeats = Number(raw.active_users ?? raw.used_seats ?? raw.allocated_seats ?? 0) || 0;
  const totalAnnualCost = Number(raw.total_annual_cost ?? raw.annual_cost ?? 0) || 0;
  const costPerSeat = Number(raw.cost_per_seat ?? (totalSeats > 0 ? totalAnnualCost / totalSeats : 0)) || 0;

  const vendorCode = raw.vendor || 'other';
  const vendorDisplay = raw.vendor_display || vendorCode;

  return {
    id: String(raw.id),
    name: raw.software_name || 'Untitled',
    vendor: vendorCode,
    vendorDisplay,
    totalLicenses: totalSeats,
    usedLicenses: usedSeats,
    activeUsers: usedSeats,
    expiryDate,
    cost: totalAnnualCost,
    currency: raw.cost_currency || 'USD',
    status: inferredStatus,
    category: vendorDisplay || 'Software',
    notes: raw.notes || '',
    perSeatCost: costPerSeat,
  };
}

const statusStyles: Record<string, string> = {
  active: 'bg-[hsl(var(--status-active))]/10 text-[hsl(var(--status-active))] border-[hsl(var(--status-active))]/20',
  warning: 'bg-[hsl(var(--chart-3))]/10 text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]/20',
  expired: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  warning: 'Expiring Soon',
  expired: 'Expired',
};

export default function Software() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [licenses, setLicenses] = useState<SoftwareLicense[]>([]);
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<SoftwareLicense | null>(null);
  const [form, setForm] = useState<LicenseFormData>({ name: '', vendor: '', category: 'Productivity', totalLicenses: 10, activeUsers: 0, cost: 0, currency: 'USD', expiryDate: '', notes: '' });
  const [editForm, setEditForm] = useState<LicenseFormData>({ name: '', vendor: '', category: 'Productivity', totalLicenses: 10, activeUsers: 0, cost: 0, currency: 'USD', expiryDate: '', notes: '' });

  useEffect(() => {
    void loadLicenses();
  }, []);

  const filtered = licenses.filter((lic) => {
    const matchesSearch = searchQuery === '' || lic.name.toLowerCase().includes(searchQuery.toLowerCase()) || lic.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || lic.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Total annual spend = sum of (seats * annual_cost)
  const totalCost = licenses.reduce((s, l) => s + (Number(l.cost) || 0), 0);
  const totalUsed = licenses.reduce((s, l) => s + l.usedLicenses, 0);
  const totalAvailable = licenses.reduce((s, l) => s + l.totalLicenses, 0);
  const activeCount = licenses.filter(l => l.status === 'active').length;
  const atRiskCount = licenses.filter(l => l.status !== 'active').length;

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const response = await authFetch(API_BASE);
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = payload.detail || payload.error || response.statusText || 'Failed to load licenses';
        throw new Error(message);
      }
      const json = await response.json();
      const items = (Array.isArray(json) ? json : json.results ?? []) as any[];
      setLicenses(items.map(normalizeSoftwareLicense));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load licenses');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!form.name.trim() || !form.vendor.trim()) {
      toast.error('Software name and vendor are required');
      return;
    }

    try {
      const response = await authFetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          software_name: form.name,
          vendor: form.vendor,
          seats: Number(form.totalLicenses) || 1,
          active_users: Number(form.activeUsers) || 0,
          expiry_date: form.expiryDate || null,
          notes: form.notes || '',
          annual_cost: Number(form.cost) || 0,
          cost_currency: form.currency || 'USD',
        }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = payload.detail || payload.error || response.statusText || 'Failed to add license';
        throw new Error(message);
      }
      const created = normalizeSoftwareLicense(await response.json());
      setLicenses((prev) => [created, ...prev]);
      toast.success(`${created.name} license added`);
      setForm({ name: '', vendor: '', category: 'Productivity', totalLicenses: 10, activeUsers: 0, cost: 0, expiryDate: '', notes: '' });
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add license');
    }
  };

  const openLicenseDetails = (license: SoftwareLicense) => {
    setSelectedLicense(license);
    setDetailOpen(true);
  };

  const openLicenseEdit = (license: SoftwareLicense) => {
    setSelectedLicense(license);
    setEditForm({
      name: license.name,
      vendor: license.vendor,
      category: license.category,
      totalLicenses: license.totalLicenses,
      activeUsers: license.activeUsers ?? license.usedLicenses,
      cost: license.cost,
      currency: license.currency || 'USD',
      expiryDate: license.expiryDate,
      notes: license.notes ?? '',
    });
    setEditOpen(true);
  };

  const handleEditLicense = async () => {
    if (!selectedLicense || !editForm.name.trim() || !editForm.vendor.trim()) {
      toast.error('Software name and vendor are required');
      return;
    }

    try {
      const response = await authFetch(`${API_BASE}${selectedLicense.id}/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          software_name: editForm.name,
          vendor: editForm.vendor,
          seats: Number(editForm.totalLicenses) || 1,
          active_users: Number(editForm.activeUsers) || 0,
          expiry_date: editForm.expiryDate || null,
          notes: editForm.notes || '',
          annual_cost: Number(editForm.cost) || 0,
          cost_currency: editForm.currency || 'USD',
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = payload.detail || payload.error || response.statusText || 'Failed to update license';
        throw new Error(message);
      }

      const updated = normalizeSoftwareLicense(await response.json());
      setLicenses((prev) => prev.map((item) => item.id === updated.id ? updated : item));
      toast.success(`${updated.name} license updated`);
      setEditOpen(false);
      setSelectedLicense(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update license');
    }
  };

  const handleRevokeLicense = async () => {
    if (!selectedLicense) return;

    try {
      const response = await authFetch(`${API_BASE}${selectedLicense.id}/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = payload.detail || payload.error || response.statusText || 'Failed to revoke license';
        throw new Error(message);
      }

      setLicenses((prev) => prev.filter((item) => item.id !== selectedLicense.id));
      toast.success(`${selectedLicense.name} license revoked`);
      setRevokeOpen(false);
      setSelectedLicense(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to revoke license');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--chart-5))] to-[hsl(var(--chart-5))]/70 shadow-lg shadow-[hsl(var(--chart-5))]/20">
              <KeySquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Software & Licenses</h1>
              <p className="text-muted-foreground">Manage {licenses.length} software subscriptions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search licenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-lg shadow-primary/20">
                  <Plus className="mr-2 h-4 w-4" />
                  Add License
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add new license</DialogTitle>
                  <DialogDescription>Register a software subscription.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="s-name">Software name</Label>
                      <Input id="s-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Microsoft 365" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="s-vendor">Vendor</Label>
                      <Select value={form.vendor} onValueChange={(v) => setForm({ ...form, vendor: v })}>
                        <SelectTrigger id="s-vendor">
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendorOptions.map(vendor => (
                            <SelectItem key={vendor} value={vendor.toLowerCase().replace(/\s+/g, '_')}>{vendor}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="s-seats">Total seats</Label>
                      <Input id="s-seats" type="number" min={1} value={form.totalLicenses} onChange={(e) => setForm({ ...form, totalLicenses: Number(e.target.value) })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="s-active-users">Active users</Label>
                      <Input id="s-active-users" type="number" min={0} value={form.activeUsers} onChange={(e) => setForm({ ...form, activeUsers: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="s-exp">Expiry date</Label>
                      <Input id="s-exp" type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="s-currency">Currency</Label>
                      <Input id="s-currency" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="s-cost">Annual cost</Label>
                    <Input id="s-cost" type="number" step="0.01" min={0} value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="s-notes">Notes</Label>
                    <Input id="s-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional license notes" />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button onClick={handleAdd}>Add license</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4 animate-fade-in-up">
          <Card className="card-hover relative overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Licenses</p>
                  <p className="text-2xl font-bold mt-1">{totalAvailable}</p>
                  <p className="text-xs text-muted-foreground mt-1">{totalUsed} in use · {totalAvailable - totalUsed} free</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10">
                  <KeySquare className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </Card>
          <Card className="card-hover relative overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Annual Spend</p>
                  <p className="text-2xl font-bold mt-1">${totalCost.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground mt-1">across {licenses.length} subscriptions</p>
                </div>
                <div className="p-3 rounded-xl bg-[hsl(var(--chart-2))]/10">
                  <TrendingUp className="h-5 w-5 text-[hsl(var(--chart-2))]" />
                </div>
              </div>
            </CardContent>
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[hsl(var(--chart-2))]/40 to-transparent" />
          </Card>
          <Card className="card-hover relative overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Utilization</p>
                  <p className="text-2xl font-bold mt-1">{totalAvailable ? Math.round((totalUsed / totalAvailable) * 100) : 0}%</p>
                  <Progress value={totalAvailable ? (totalUsed / totalAvailable) * 100 : 0} className="h-2 mt-2 w-24" />
                </div>
                <div className="p-3 rounded-xl bg-[hsl(var(--chart-5))]/10">
                  <CheckCircle className="h-5 w-5 text-[hsl(var(--chart-5))]" />
                </div>
              </div>
            </CardContent>
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[hsl(var(--chart-5))]/40 to-transparent" />
          </Card>
          <Card className="card-hover relative overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">At Risk</p>
                  <p className="text-2xl font-bold mt-1">{atRiskCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activeCount} active</p>
                </div>
                <div className="p-3 rounded-xl bg-destructive/10">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                </div>
              </div>
            </CardContent>
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-destructive/40 to-transparent" />
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-end gap-1.5 animate-fade-in-up">
          {['all', 'active', 'warning', 'expired'].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="capitalize text-xs"
            >
              {s === 'all' ? 'All' : statusLabels[s] || s}
            </Button>
          ))}
        </div>

        {/* License List */}
        <Card className="animate-fade-in-up">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>All Licenses ({filtered.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filtered.map((lic, idx) => {
                const utilization = Math.round((lic.usedLicenses / lic.totalLicenses) * 100);
                return (
                  <div
                    key={lic.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/50 hover:border-border transition-all duration-200 group animate-fade-in-up"
                    style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'backwards' }}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))] shrink-0">
                        <KeySquare className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm truncate">{lic.name}</p>
                          <Badge variant="secondary" className={statusStyles[lic.status]}>
                            {statusLabels[lic.status]}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal">
                            {lic.category}
                          </Badge>
                        </div>
                        {(() => {
                          const expiryDisplay = lic.expiryDate ? new Date(lic.expiryDate).toLocaleDateString() : '—';
                          const perSeat = lic.perSeatCost || 0;
                          const totalForLicense = lic.cost || 0;
                          return (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {lic.vendorDisplay || lic.vendor} · Expires {expiryDisplay} · ${perSeat.toLocaleString()}/seat · ${totalForLicense.toLocaleString()}/yr
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right min-w-[100px]">
                        <p className="text-sm font-semibold">{lic.activeUsers ?? lic.usedLicenses} / {lic.totalLicenses}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={utilization} className="h-1.5 w-20" />
                          <span className="text-[10px] text-muted-foreground">{utilization}%</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openLicenseDetails(lic)}>View Details</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => openLicenseEdit(lic)}>Edit License</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => { setSelectedLicense(lic); setRevokeOpen(true); }} className="text-destructive">Revoke</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <KeySquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No licenses match your search</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedLicense?.name ?? 'License Details'}</DialogTitle>
            <DialogDescription>License summary and assignment overview.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Vendor</p>
                <p className="font-medium">{selectedLicense?.vendorDisplay || selectedLicense?.vendor || '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{selectedLicense?.status ?? 'active'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total seats</p>
                <p className="font-medium">{selectedLicense?.totalLicenses ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Active users</p>
                <p className="font-medium">{selectedLicense?.activeUsers ?? selectedLicense?.usedLicenses ?? 0}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Expiry date</p>
                <p className="font-medium">{selectedLicense?.expiryDate ? new Date(selectedLicense.expiryDate).toLocaleDateString() : '—'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Annual cost</p>
                <p className="font-medium">${(selectedLicense?.cost ?? 0).toLocaleString()}</p>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Notes</p>
              <p className="mt-1 text-sm">{selectedLicense?.notes || 'No notes provided.'}</p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setDetailOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit License</DialogTitle>
            <DialogDescription>Update software subscription details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Software name</Label>
                <Input id="edit-name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-vendor">Vendor</Label>
                <Select value={editForm.vendor} onValueChange={(v) => setEditForm({ ...editForm, vendor: v })}>
                  <SelectTrigger id="edit-vendor">
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorOptions.map(vendor => (
                      <SelectItem key={vendor} value={vendor.toLowerCase().replace(/\s+/g, '_')}>{vendor}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="edit-seats">Total seats</Label>
                <Input id="edit-seats" type="number" min={1} value={editForm.totalLicenses} onChange={(e) => setEditForm({ ...editForm, totalLicenses: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-active-users">Active users</Label>
                <Input id="edit-active-users" type="number" min={0} value={editForm.activeUsers} onChange={(e) => setEditForm({ ...editForm, activeUsers: Number(e.target.value) })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="edit-expiry">Expiry date</Label>
                <Input id="edit-expiry" type="date" value={editForm.expiryDate} onChange={(e) => setEditForm({ ...editForm, expiryDate: e.target.value })} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-cost">Annual cost</Label>
                <Input id="edit-cost" type="number" step="0.01" min={0} value={editForm.cost} onChange={(e) => setEditForm({ ...editForm, cost: Number(e.target.value) })} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Input id="edit-notes" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleEditLicense()}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={revokeOpen} onOpenChange={setRevokeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Revoke license</DialogTitle>
            <DialogDescription>
              This will remove {selectedLicense?.name ?? 'this license'} from the active list.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => void handleRevokeLicense()}>Revoke</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
