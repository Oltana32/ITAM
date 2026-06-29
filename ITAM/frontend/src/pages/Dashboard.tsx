import { 
  Package, CheckCircle, AlertTriangle, Archive, 
  ShieldAlert, Clock, Activity, ArrowRight, Plus, ScanLine, BarChart3,
  Wrench
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { StatusChart } from '@/components/dashboard/StatusChart';
import { RecentActivityCard } from '@/components/dashboard/RecentActivityCard';
import { NotificationsCard } from '@/components/dashboard/NotificationsCard';
import { WarrantyTimeline } from '@/components/dashboard/WarrantyTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AssetCategory, AssetStatus } from '@/types/asset';
import awashLogo from '@/assets/awash-wine-logo.png';
import { useAssets } from '@/hooks/useAssets';

export default function Dashboard() {
  const { assets } = useAssets();
  // Placeholder to register file access; no-op intentional.
  const totalAssets = assets.length;
  const inUseAssets = assets.filter((a) => a.status === 'in-use').length;
  const maintenanceAssets = assets.filter((a) => a.status === 'maintenance').length;
  const availableAssets = assets.filter((a) => a.status === 'available').length;
  const retiredAssets = assets.filter((a) => a.status === 'retired').length;
  const unassignedAssets = assets.filter((a) => !a.assignedTo).length;
  const utilizationRate = totalAssets ? Math.round((inUseAssets / totalAssets) * 100) : 0;
  const totalValue = assets.reduce((s, a) => s + (a.purchaseCost || 0), 0);

  // Warranty expiring within 90 days
  const now = Date.now();
  const ninetyDays = 90 * 86400000;
  const expiringSoon = assets.filter((a) => {
    if (!a.warrantyExpiry) return false;
    const t = new Date(a.warrantyExpiry).getTime() - now;
    return t >= 0 && t <= ninetyDays;
  }).length;

  // Average asset age in years (based on purchaseDate)
  const ages = assets
    .map((a) => (a.purchaseDate ? (now - new Date(a.purchaseDate).getTime()) / (365.25 * 86400000) : null))
    .filter((v): v is number => v !== null && v >= 0);
  const avgAgeYears = ages.length ? ages.reduce((s, v) => s + v, 0) / ages.length : 0;

  const categoryData = Object.entries(
    assets.reduce((acc, asset) => {
      acc[asset.category] = (acc[asset.category] || 0) + 1;
      return acc;
    }, {} as Record<AssetCategory, number>)
  ).map(([category, count]) => ({ category: category as AssetCategory, count }));

  const statusData: { status: AssetStatus; count: number }[] = [
    { status: 'in-use', count: inUseAssets },
    { status: 'available', count: availableAssets },
    { status: 'maintenance', count: maintenanceAssets },
    { status: 'retired', count: retiredAssets },
  ];

  const quickActions = [
    { label: 'Add Asset', icon: Plus, href: '/assets', color: 'from-primary to-primary/70' },
    { label: 'Scan QR', icon: ScanLine, href: '/assets', color: 'from-[hsl(var(--chart-2))] to-[hsl(var(--chart-2))]/70' },
    { label: 'Reports', icon: BarChart3, href: '/reports', color: 'from-[hsl(var(--chart-5))] to-[hsl(var(--chart-5))]/70' },
    { label: 'Maintenance', icon: Wrench, href: '/maintenance', color: 'from-[hsl(var(--chart-3))] to-[hsl(var(--chart-3))]/70' },
  ];



  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Hero Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent via-accent/90 to-primary/30 p-8 text-accent-foreground animate-fade-in">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4 blur-xl" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-accent-foreground/80 text-sm font-medium">
                <img src={awashLogo} alt="Awash Wine" className="h-6 w-6 rounded object-contain" />
                Awash Wine S.C.
              </div>
              <h1 className="text-3xl font-bold tracking-tight">IT Asset Dashboard</h1>
              <p className="text-accent-foreground/70 max-w-md">
                Managing {totalAssets} IT assets worth ETB {(totalValue / 1000000).toFixed(1)}M across your organization.
                {maintenanceAssets > 0 && ` ${maintenanceAssets} item${maintenanceAssets !== 1 ? 's' : ''} need attention.`}
              </p>
              <div className="flex items-center gap-3 pt-2">
                <Link to="/assets">
                  <Button variant="secondary" size="sm" className="bg-white/20 border-white/10 text-white hover:bg-white/30 backdrop-blur-sm">
                    View All Assets <ArrowRight className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-3">
              {quickActions.map((action) => (
                <Link key={action.label} to={action.href}>
                  <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-300 cursor-pointer backdrop-blur-sm border border-white/10 hover:scale-105 min-w-[80px]">
                    <action.icon className="h-5 w-5" />
                    <span className="text-[11px] font-medium">{action.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Assets" value={totalAssets} icon={<Package className="h-5 w-5" />} trend={{ value: 12, label: 'from last month' }} index={0} />
          <StatCard title="Active" value={inUseAssets} icon={<CheckCircle className="h-5 w-5" />} trend={{ value: 5, label: 'assigned' }} index={1} />
          <StatCard title="Expiring soon" value={expiringSoon} icon={<ShieldAlert className="h-5 w-5" />} trend={{ value: expiringSoon, label: 'within 90 days' }} index={2} />
          <StatCard title="Unassigned" value={unassignedAssets} icon={<Archive className="h-5 w-5" />} index={3} />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <CategoryChart data={categoryData} />
          <StatusChart data={statusData} />
        </div>

        {/* Bottom row: activity, alerts, warranty */}
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <RecentActivityCard />
          </div>
          <div className="lg:col-span-4">
            <NotificationsCard />
          </div>
          <div className="lg:col-span-3">
            <WarrantyTimeline assets={assets} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
