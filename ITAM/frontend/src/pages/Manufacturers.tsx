import { useMemo, useState } from 'react';
import { Factory, Search, Package, ChevronDown, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { categoryLabels } from '@/types/asset';
import { useAssets } from '@/hooks/useAssets';

type ModelGroup = {
  model: string;
  count: number;
  category?: string;
  assets: { id: string; name: string; assetTag: string }[];
};

type ManufacturerGroup = {
  name: string;
  assetCount: number;
  models: ModelGroup[];
};

export default function Manufacturers() {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { assets } = useAssets();

  const grouped = useMemo<ManufacturerGroup[]>(() => {
    const map = new Map<string, ManufacturerGroup>();

    for (const a of assets) {
      const key = a.manufacturer.trim();
      if (!map.has(key)) {
        map.set(key, { name: key, assetCount: 0, models: [] });
      }
      const m = map.get(key)!;
      m.assetCount += 1;
      let modelGroup = m.models.find((g) => g.model === a.model);
      if (!modelGroup) {
        modelGroup = { model: a.model, count: 0, category: categoryLabels[a.category], assets: [] };
        m.models.push(modelGroup);
      }
      modelGroup.count += 1;
      modelGroup.assets.push({ id: a.id, name: a.name, assetTag: a.assetTag });
    }

    return Array.from(map.values()).sort(
      (a, b) => b.assetCount - a.assetCount,
    );
  }, []);

  const filtered = grouped.filter((g) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      g.name.toLowerCase().includes(q) ||
      g.models.some((m) => m.model.toLowerCase().includes(q))
    );
  });

  const totalAssets = grouped.reduce((s, g) => s + g.assetCount, 0);
  const totalModels = grouped.reduce((s, g) => s + g.models.length, 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
              <Factory className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Manufacturers</h1>
              <p className="text-muted-foreground">Assets grouped by maker & model</p>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3 animate-fade-in-up">
          <Card className="card-hover"><CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10"><Factory className="h-4 w-4 text-primary" /></div>
            <div><p className="text-2xl font-bold">{grouped.length}</p><p className="text-xs text-muted-foreground">Manufacturers</p></div>
          </CardContent></Card>
          <Card className="card-hover"><CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[hsl(var(--chart-2))]/10"><Package className="h-4 w-4 text-[hsl(var(--chart-2))]" /></div>
            <div><p className="text-2xl font-bold">{totalAssets}</p><p className="text-xs text-muted-foreground">Total Assets</p></div>
          </CardContent></Card>
          <Card className="card-hover"><CardContent className="pt-5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[hsl(var(--chart-3))]/10"><Package className="h-4 w-4 text-[hsl(var(--chart-3))]" /></div>
            <div><p className="text-2xl font-bold">{totalModels}</p><p className="text-xs text-muted-foreground">Distinct Models</p></div>
          </CardContent></Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md animate-fade-in-up">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search manufacturer or model..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Grid */}
        <div className="grid gap-4 md:grid-cols-2 animate-fade-in-up">
          {filtered.map((m) => {
            const isOpen = expanded[m.name] ?? false;
            return (
              <Card key={m.name} className="card-hover">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Factory className="h-4 w-4 text-primary" />
                      {m.name}
                    </CardTitle>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="bg-[hsl(var(--chart-2))]/10 text-[hsl(var(--chart-2))]">
                        {m.assetCount} assets
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Models */}
                  {m.models.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">
                        Models ({m.models.length})
                      </p>
                      <div className="space-y-1.5">
                        {m.models.map((mod) => (
                          <div
                            key={mod.model}
                            className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/40"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{mod.model}</p>
                              {mod.category && (
                                <p className="text-[10px] text-muted-foreground">{mod.category}</p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs font-mono">
                              ×{mod.count}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expand asset detail */}
                  {m.assetCount > 0 && (
                    <>
                      <Separator />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-between h-8 text-xs"
                        onClick={() => setExpanded((p) => ({ ...p, [m.name]: !isOpen }))}
                      >
                        <span>{isOpen ? 'Hide' : 'Show'} individual assets</span>
                        {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                      </Button>
                      {isOpen && (
                        <div className="space-y-1 pl-2 border-l-2 border-border/50">
                          {m.models.flatMap((mod) =>
                            mod.assets.map((a) => (
                              <div key={a.id} className="flex items-center justify-between text-xs py-1">
                                <span className="truncate">{a.name}</span>
                                <span className="font-mono text-muted-foreground">{a.assetTag}</span>
                              </div>
                            )),
                          )}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {filtered.length === 0 && (
            <div className="md:col-span-2 text-center py-12 text-muted-foreground">
              <Factory className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No manufacturers match your search</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}