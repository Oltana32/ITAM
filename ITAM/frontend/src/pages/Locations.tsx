import { useMemo, useState } from 'react';
import { MapPin, Building, Plus, Search, Filter, Users, Package, Wifi, Shield } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { getCurrentUserRole } from '@/lib/authRole';
import { canWrite } from '@/lib/permissions';
import { useAssets } from '@/hooks/useAssets';
import { useLocations } from '@/hooks/useLocations';
import { ethiopianCities } from '@/types/asset';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const typeColors: Record<string, string> = {
  'Office': 'bg-primary/10 text-primary',
  'Factory': 'bg-[hsl(var(--chart-2))]/10 text-[hsl(var(--chart-2))]',
  'Data Center': 'bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))]',
  'Warehouse': 'bg-[hsl(var(--chart-3))]/10 text-[hsl(var(--chart-3))]',
  'Storage': 'bg-muted text-muted-foreground',
};

export default function Locations() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { locations, addLocation } = useLocations();
  const { assets } = useAssets();
  const [open, setOpen] = useState(false);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);

  const getLocationAssets = (loc: typeof locations[number]) => {
    const normalized = `${loc.name} ${loc.building} ${loc.city}`.toLowerCase();
    return assets.filter((asset) => {
      const assetLocation = asset.location?.toLowerCase() || '';
      return normalized.includes(assetLocation) || assetLocation.includes(loc.name.toLowerCase()) || assetLocation.includes(loc.building.toLowerCase()) || assetLocation.includes(loc.city.toLowerCase());
    });
  };

  const assigned = useMemo(
    () => assets.filter((a) => a.assignedTo || (a.location && a.location !== 'Unassigned')),
    [assets]
  );

  const locationChartData = useMemo(() => {
    const counts = assigned.reduce<Record<string, number>>((acc, asset) => {
      const location = asset.location || 'Unassigned';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);
  }, [assigned]);

  const selectedLocation = activeLocation ? locations.find((loc) => loc.id === activeLocation) : null;
  const selectedLocationAssets = selectedLocation ? getLocationAssets(selectedLocation) : [];
  const [form, setForm] = useState({ name: '', building: '', city: 'Addis Ababa', type: 'Office', manager: '', capacity: 50 });

  const filtered = locations.filter(loc => {
    const matchesSearch = loc.name.toLowerCase().includes(search.toLowerCase()) || loc.city.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || loc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalAssets = assets.length;
  const totalCapacity = locations.reduce((sum, l) => sum + (Number(l.capacity) || 0), 0);
  const types = [...new Set(locations.map((l) => l.type))];

  const handleAdd = async () => {
    if (!form.name.trim()) {
      toast.error('Location name is required');
      return;
    }
    try {
      await addLocation({
        name: form.name,
        building: form.building || '—',
        city: form.city,
        type: form.type,
        capacity: Number(form.capacity) || 0,
        manager: form.manager || 'Unassigned',
      });
      setForm({ name: '', building: '', city: 'Addis Ababa', type: 'Office', manager: '', capacity: 50 });
      setOpen(false);
    } catch {
      // Error toast handled in useLocations.
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
              <MapPin className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
              <p className="text-muted-foreground">Awash Wine S.C. sites & facilities</p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            {(() => {
              const canCreate = canWrite(getCurrentUserRole());
              if (canCreate) {
                return (
                  <DialogTrigger asChild>
                    <Button className="shadow-lg shadow-primary/20">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Location
                    </Button>
                  </DialogTrigger>
                );
              }
              return (
                <Button className="shadow-lg shadow-primary/20" disabled title="Only IT staff can add locations">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Location
                </Button>
              );
            })()}
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add new location</DialogTitle>
                <DialogDescription>Register a site or facility.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="l-name">Name</Label>
                  <Input id="l-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Head Office" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="l-building">Building</Label>
                    <Input id="l-building" value={form.building} onChange={(e) => setForm({ ...form, building: e.target.value })} placeholder="Main Building" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="l-city">City</Label>
                    <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v })}>
                      <SelectTrigger id="l-city">
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ethiopianCities).map(([value, label]) => (
                          <SelectItem key={value} value={label}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Office','Factory','Data Center','Warehouse','Storage'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="l-cap">Capacity</Label>
                    <Input id="l-cap" type="number" min={0} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="l-mgr">Manager</Label>
                  <Input id="l-mgr" value={form.manager} onChange={(e) => setForm({ ...form, manager: e.target.value })} placeholder="Site manager name" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd}>Create location</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4 animate-fade-in-up">
          <Card className="card-hover">
            <CardContent className="pt-5 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10"><Building className="h-4 w-4 text-primary" /></div>
              <div><p className="text-2xl font-bold">{locations.length}</p><p className="text-xs text-muted-foreground">Total Sites</p></div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="pt-5 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[hsl(var(--chart-2))]/10"><Package className="h-4 w-4 text-[hsl(var(--chart-2))]" /></div>
              <div><p className="text-2xl font-bold">{totalAssets}</p><p className="text-xs text-muted-foreground">Total Assets</p></div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="pt-5 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[hsl(var(--chart-3))]/10"><Shield className="h-4 w-4 text-[hsl(var(--chart-3))]" /></div>
              <div><p className="text-2xl font-bold">{Math.round((totalAssets / totalCapacity) * 100)}%</p><p className="text-xs text-muted-foreground">Capacity Used</p></div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="pt-5 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[hsl(var(--chart-5))]/10"><Wifi className="h-4 w-4 text-[hsl(var(--chart-5))]" /></div>
              <div><p className="text-2xl font-bold">{locations.filter(l => l.status === 'active').length}</p><p className="text-xs text-muted-foreground">Active Sites</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search locations..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Location Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 animate-fade-in-up">
          {filtered.map((loc) => {
            const assetList = getLocationAssets(loc);
            const usage = loc.capacity > 0 ? Math.round((assetList.length / loc.capacity) * 100) : 0;
            return (
              <Card key={loc.id} className="card-hover cursor-pointer" onClick={() => setActiveLocation(loc.id)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">{loc.name}</CardTitle>
                    </div>
                    <Badge variant="secondary" className={typeColors[loc.type] || 'bg-muted text-muted-foreground'}>{loc.type}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{loc.building} · {loc.city}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Assets</span>
                      <span className="font-medium">{assetList.length} / {loc.capacity || 0}</span>
                    </div>
                    <Progress value={Math.min(Math.max(usage, 0), 100)} className="h-2" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />
                    <span>Manager: {loc.manager}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {loc.departments.map(d => (
                      <span key={d} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{d}</span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle>Device Allocation by Location</CardTitle>
          </CardHeader>
          <CardContent>
            {locationChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No assigned devices yet to display the location diagram.
              </p>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="location" tick={{ fontSize: 12 }} interval={0} angle={-12} textAnchor="end" height={70} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={Boolean(selectedLocation)} onOpenChange={(open) => !open && setActiveLocation(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedLocation?.name ?? 'Location details'}</DialogTitle>
              <DialogDescription>Assets assigned to this location and assigned employees.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Site</p>
                  <p className="font-medium">{selectedLocation?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Manager</p>
                  <p className="font-medium">{selectedLocation?.manager || 'Unassigned'}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Assets in location</p>
                {selectedLocationAssets.length ? (
                  <div className="space-y-2 rounded-xl border border-border bg-card p-4">
                    {selectedLocationAssets.map((asset) => (
                      <div key={asset.id} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                        <div>
                          <p className="font-medium">{asset.name}</p>
                          <p className="text-xs text-muted-foreground">{asset.type || asset.category || 'Asset'}</p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-medium">{asset.assignedTo || 'Unassigned'}</p>
                          <p className="text-muted-foreground">{asset.status || 'Unknown status'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No assets currently mapped to this location.</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActiveLocation(null)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
