import { useState } from 'react';
import { BarChart3, Download, FileText, TrendingUp, PieChart, DollarSign, Shield, Calendar, Printer } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell } from 'recharts';
import { useAssets } from '@/hooks/useAssets';
import { authFetch } from '@/lib/auth';

const CHART_COLORS = [
  'hsl(43, 80%, 45%)', 'hsl(150, 50%, 35%)', 'hsl(25, 90%, 50%)',
  'hsl(0, 65%, 45%)', 'hsl(280, 60%, 50%)', 'hsl(200, 60%, 45%)',
];

const reports = [
  { id: '1', name: 'Asset Inventory Summary', description: 'Complete overview of all assets by category and status', icon: PieChart, lastGenerated: '2024-03-15', category: 'inventory' },
  { id: '2', name: 'Depreciation Report', description: 'Asset value depreciation over time', icon: TrendingUp, lastGenerated: '2024-03-10', category: 'financial' },
  { id: '3', name: 'Assignment History', description: 'Track asset assignment changes across users', icon: FileText, lastGenerated: '2024-03-08', category: 'operations' },
  { id: '4', name: 'Warranty Status Report', description: 'Assets with expiring or expired warranties', icon: Shield, lastGenerated: '2024-03-05', category: 'compliance' },
  { id: '5', name: 'License Utilization', description: 'Software license usage and optimization', icon: BarChart3, lastGenerated: '2024-03-01', category: 'financial' },
  { id: '6', name: 'Cost Analysis by Dept.', description: 'Total cost of ownership by department', icon: DollarSign, lastGenerated: '2024-02-28', category: 'financial' },
  { id: '7', name: 'Maintenance Log', description: 'All maintenance activities and costs', icon: FileText, lastGenerated: '2024-03-12', category: 'operations' },
  { id: '8', name: 'Audit Trail', description: 'Asset audit history and compliance status', icon: Shield, lastGenerated: '2024-03-14', category: 'compliance' },
];

export default function Reports() {
  const [tab, setTab] = useState('overview');
  const [generating, setGenerating] = useState<string | null>(null);
  const { assets } = useAssets();

  // Compute real data
  const categoryBreakdown = Object.entries(
    assets.reduce((acc, a) => { acc[a.category] = (acc[a.category] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const deptBreakdown = Object.entries(
    assets.reduce((acc, a) => { acc[a.department || 'Unassigned'] = (acc[a.department || 'Unassigned'] || 0) + 1; return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const deptCost = Object.entries(
    assets.reduce((acc, a) => { acc[a.department || 'Unassigned'] = (acc[a.department || 'Unassigned'] || 0) + (a.purchaseCost || 0); return acc; }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value: Math.round(value / 1000) }));

  const totalValue = assets.reduce((s, a) => s + (a.purchaseCost || 0), 0);

  const handleCsvExport = async (reportType: string) => {
    setGenerating(reportType);
    try {
      const endpoint = `/api/reports/generate_${reportType}_report/`;
      const response = await authFetch(endpoint);
      if (!response.ok) {
        throw new Error(`Failed to generate ${reportType} report`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report exported successfully`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to export ${reportType} report`);
    } finally {
      setGenerating(null);
    }
  };

  const handleDownload = (name: string) => {
    toast.success(`Report "${name}" generated and downloading...`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
              <p className="text-muted-foreground">Analytics & report generation</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => toast.success('All reports bundle preparing...')} className="gap-2">
            <Download className="h-4 w-4" />Export All
          </Button>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="animate-fade-in-up">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="generate">Generate</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* KPI Summary */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="card-hover"><CardContent className="pt-5">
                <p className="text-xs text-muted-foreground">Total Assets</p>
                <p className="text-2xl font-bold">{assets.length}</p>
                <p className="text-xs text-[hsl(var(--status-active))]">+12% from last quarter</p>
              </CardContent></Card>
              <Card className="card-hover"><CardContent className="pt-5">
                <p className="text-xs text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">ETB {(totalValue / 1000000).toFixed(1)}M</p>
                <p className="text-xs text-[hsl(var(--chart-3))]">Across all departments</p>
              </CardContent></Card>
              <Card className="card-hover"><CardContent className="pt-5">
                <p className="text-xs text-muted-foreground">Utilization</p>
                <p className="text-2xl font-bold">{assets.length ? Math.round((assets.filter(a => a.status === 'in-use').length / assets.length) * 100) : 0}%</p>
                <Progress value={assets.length ? (assets.filter(a => a.status === 'in-use').length / assets.length) * 100 : 0} className="h-1.5 mt-2" />
              </CardContent></Card>
              <Card className="card-hover"><CardContent className="pt-5">
                <p className="text-xs text-muted-foreground">Avg. Asset Value</p>
                <p className="text-2xl font-bold">ETB {assets.length ? Math.round(totalValue / assets.length / 1000) : 0}K</p>
                <p className="text-xs text-muted-foreground">Per asset</p>
              </CardContent></Card>
            </div>

            {/* Dept breakdown table */}
            <Card>
              <CardHeader><CardTitle className="text-base">Department Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {deptBreakdown.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-sm flex-1">{d.name}</span>
                      <span className="text-sm font-semibold">{d.value} assets</span>
                      <span className="text-xs text-muted-foreground w-12 text-right">{assets.length ? Math.round((d.value / assets.length) * 100) : 0}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charts" className="space-y-6 mt-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader><CardTitle className="text-base">Assets by Category</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie data={categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                          {categoryBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </RechartsPie>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Cost by Department (ETB K)</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deptCost}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: number) => [`ETB ${v}K`, 'Cost']} />
                        <Bar dataKey="value" fill="hsl(43, 80%, 45%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="generate" className="mt-6">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {/* Asset Report */}
                <Card className="card-hover">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-sm">Asset Report</CardTitle>
                        <CardDescription className="text-xs">Export all assets with details</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">Includes: Asset Tag, Name, Category, Status, Location</p>
                      <Button 
                        size="sm" 
                        className="w-full gap-1.5" 
                        onClick={() => handleCsvExport('asset')}
                        disabled={generating === 'asset'}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {generating === 'asset' ? 'Generating...' : 'Export as CSV'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Assignment Report */}
                <Card className="card-hover">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[hsl(var(--chart-2))]/10">
                        <FileText className="h-5 w-5 text-[hsl(var(--chart-2))]" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-sm">Assignment Report</CardTitle>
                        <CardDescription className="text-xs">All asset assignments and details</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">Includes: Asset, Assigned To, Employee ID, Dates, Status</p>
                      <Button 
                        size="sm" 
                        className="w-full gap-1.5" 
                        onClick={() => handleCsvExport('assignment')}
                        disabled={generating === 'assignment'}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {generating === 'assignment' ? 'Generating...' : 'Export as CSV'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Maintenance Report */}
                <Card className="card-hover">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[hsl(var(--chart-3))]/10">
                        <FileText className="h-5 w-5 text-[hsl(var(--chart-3))]" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-sm">Maintenance Report</CardTitle>
                        <CardDescription className="text-xs">Maintenance activities and costs</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">Includes: Asset, Work Order, Type, Status, Date, Cost</p>
                      <Button 
                        size="sm" 
                        className="w-full gap-1.5" 
                        onClick={() => handleCsvExport('maintenance')}
                        disabled={generating === 'maintenance'}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {generating === 'maintenance' ? 'Generating...' : 'Export as CSV'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* License Report */}
                <Card className="card-hover">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[hsl(var(--chart-5))]/10">
                        <FileText className="h-5 w-5 text-[hsl(var(--chart-5))]" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-sm">License Report</CardTitle>
                        <CardDescription className="text-xs">Software licenses and subscriptions</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">Includes: Software, Vendor, Seats, Expiry, Status</p>
                      <Button 
                        size="sm" 
                        className="w-full gap-1.5" 
                        onClick={() => handleCsvExport('license')}
                        disabled={generating === 'license'}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {generating === 'license' ? 'Generating...' : 'Export as CSV'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Status History Report */}
                <Card className="card-hover">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-destructive/10">
                        <FileText className="h-5 w-5 text-destructive" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-sm">Asset Change History</CardTitle>
                        <CardDescription className="text-xs">Who changed what and when</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">Includes: Asset, field, old/new values, changed by, role, timestamp</p>
                      <Button
                        size="sm"
                        className="w-full gap-1.5"
                        onClick={() => handleCsvExport('status_history')}
                        disabled={generating === 'status_history'}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {generating === 'status_history' ? 'Generating...' : 'Export as CSV'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Additional context */}
              <Card className="bg-muted/50 border-muted">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Report Information</p>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Reports are exported as CSV (.csv) files</li>
                      <li>• All data is current as of the moment of export</li>
                      <li>• CSV files open in Excel, Google Sheets, or any spreadsheet tool</li>
                      <li>• Download to your local machine for further analysis or sharing</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
