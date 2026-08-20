import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  ClipboardCheck, Plus, ScanLine, Download, FileSpreadsheet,
  CheckCircle2, AlertTriangle, Package, TrendingUp,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { QrScannerDialog } from '@/components/assets/QrScannerDialog';
import {
  useAuditSessions, useAuditResults, useAuditMutations, downloadAuditExport,
  AuditSession,
} from '@/hooks/useAudits';
import { useLocations } from '@/hooks/useLocations';
import { useDepartments } from '@/hooks/useDepartments';
import { useUsers } from '@/hooks/useUsers';
import { extractAssetTag } from '@/lib/parseQrScan';
import { toast } from 'sonner';

const statusLabels: Record<string, string> = {
  planned: 'Planned',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const auditTypeOptions = [
  { value: 'inventory', label: 'Inventory Audit', purpose: 'Verify that physical assets exist and match ITAM records' },
  { value: 'asset_assignment', label: 'Asset Assignment Audit', purpose: 'Verify assets are assigned to the correct employee/department' },
  { value: 'location', label: 'Location Audit', purpose: 'Verify assets are physically located where the system says they are' },
  { value: 'condition', label: 'Condition Audit', purpose: 'Verify asset physical/operational condition' },
  { value: 'compliance', label: 'Compliance Audit', purpose: 'Check whether assets meet company policies' },
  { value: 'financial', label: 'Financial Audit', purpose: 'Verify asset cost, depreciation, and financial records' },
  { value: 'security', label: 'Security Audit', purpose: 'Check security-related asset information' },
  { value: 'full', label: 'Full IT Asset Audit', purpose: 'Comprehensive audit covering all of the above' },
] as const;

export default function Audits() {
  const { data: sessions = [], isLoading } = useAuditSessions();
  const { locations } = useLocations();
  const { createSession, startSession, scanAsset, completeSession } = useAuditMutations();

  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [form, setForm] = useState({
    departmentId: 'none',
    departmentFree: '',
    locationId: 'all',
    planned_date: format(new Date(), 'yyyy-MM-dd'),
    audit_type: 'inventory',
    lead_auditor: 'none',
  });
  const { departments } = useDepartments();
  const { users } = useUsers();

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  );

  const { data: results, refetch: refetchResults } = useAuditResults(
    activeSessionId,
    activeSession?.status === 'in_progress' || activeSession?.status === 'completed',
  );

  const handleCreate = async () => {
    const deptVal = form.departmentId && form.departmentId !== 'none'
      ? (form.departmentId.startsWith('name:') ? form.departmentId.replace(/^name:/, '') : Number(form.departmentId))
      : (form.departmentFree.trim() || undefined);

    const selectedAuditType = auditTypeOptions.find((option) => option.value === form.audit_type) ?? auditTypeOptions[0];

    try {
      const created = await createSession.mutateAsync({
        title: selectedAuditType.label,
        department: deptVal,
        location: form.locationId && form.locationId !== 'all' ? Number(form.locationId) : null,
        status: 'planned',
        planned_date: form.planned_date,
        audit_type: form.audit_type,
        lead_auditor: form.lead_auditor && form.lead_auditor !== 'none' ? Number(form.lead_auditor) : undefined,
      });
      setActiveSessionId(created.id);
      setCreateOpen(false);
      setForm({ departmentId: 'none', departmentFree: '', locationId: 'all', planned_date: format(new Date(), 'yyyy-MM-dd'), audit_type: 'inventory', lead_auditor: 'none' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create audit session');
    }
  };

  

  const handleExport = async (fmt: 'xlsx' | 'pdf') => {
    if (!activeSessionId) return;
    try {
      await downloadAuditExport(activeSessionId, fmt);
      toast.success(fmt === 'xlsx' ? 'Excel export downloaded' : 'Report downloaded (open in browser → Print → Save as PDF)');
    } catch {
      toast.error('Export failed');
    }
  };

  const stats = results ?? activeSession?.stats ?? { expected: 0, verified: 0, missing: 0, progress_pct: 0 };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
              <ClipboardCheck className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Asset Audit</h1>
              <p className="text-muted-foreground">Physical verification with QR scanning</p>
            </div>
          </div>
          <div className="flex gap-2">
            {activeSession?.status === 'in_progress' && (
              <Button variant="outline" className="gap-2" onClick={() => setScannerOpen(true)}>
                <ScanLine className="h-4 w-4" /> Scan Asset
              </Button>
            )}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-lg shadow-primary/20">
                  <Plus className="h-4 w-4" /> New Audit Session
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Audit Session</DialogTitle>
                  <DialogDescription>Define scope by location and department.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                  <div className="grid gap-2">
                    <Label>Audit Type</Label>
                    <Select value={form.audit_type} onValueChange={(v) => setForm({ ...form, audit_type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {auditTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col items-start">
                              <span>{option.label}</span>
                              <span className="text-[11px] text-muted-foreground">{option.purpose}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Department</Label>
                    <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
                      <SelectTrigger><SelectValue placeholder="Choose department (or enter free-text)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">(No department)</SelectItem>
                        {departments.map((d, i) => (
                          <SelectItem key={(d.id ?? d.name) + String(i)} value={String(d.id ?? `name:${d.name}`)}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      value={form.departmentFree}
                      onChange={(e) => setForm({ ...form, departmentFree: e.target.value })}
                      placeholder="Or enter a department name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Location</Label>
                    <Select value={form.locationId} onValueChange={(v) => setForm({ ...form, locationId: v })}>
                      <SelectTrigger><SelectValue placeholder="All locations" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All locations</SelectItem>
                        {locations.map((l) => (
                          <SelectItem key={l.id} value={l.id}>{l.name} — {l.city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Lead Auditor</Label>
                    <Select value={form.lead_auditor} onValueChange={(v) => setForm({ ...form, lead_auditor: v })}>
                      <SelectTrigger><SelectValue placeholder="Optional: select lead auditor" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">(None)</SelectItem>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>{u.first_name ? `${u.first_name} ${u.last_name}` : u.email}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Planned Date</Label>
                    <Input type="date" value={form.planned_date} onChange={(e) => setForm({ ...form, planned_date: e.target.value })} />
                  </div>
                </div>
                  <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={createSession.isLoading}>Create</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Session selector */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Audit Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading sessions…</p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No audit sessions yet. Create one to begin.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sessions.map((s) => (
                  <Button
                    key={s.id}
                    variant={activeSessionId === s.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveSessionId(s.id)}
                    className="gap-2"
                  >
                    {s.title}
                    <Badge variant="secondary" className="text-[10px]">{statusLabels[s.status]}</Badge>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {activeSession && (
          <>
            {/* Session actions */}
            <div className="flex flex-wrap gap-2 items-center">
              <Badge variant="outline">{activeSession.location_name || 'All locations'}</Badge>
              {activeSession.audit_id && <Badge variant="outline">ID: {activeSession.audit_id}</Badge>}
              {activeSession.department && <Badge variant="outline">Dept: {activeSession.department}</Badge>}
              {activeSession.status === 'planned' && (
                <Button size="sm" onClick={() => startSession.mutate(activeSession.id)} disabled={startSession.isPending}>
                  Start Audit
                </Button>
              )}
              {activeSession.status === 'in_progress' && (
                <>
                  <Button size="sm" variant="secondary" onClick={() => completeSession.mutate(activeSession.id)} disabled={completeSession.isPending}>
                    Complete Audit
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => handleExport('xlsx')}>
                    <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => handleExport('pdf')}>
                    <Download className="h-3.5 w-3.5" /> PDF Report
                  </Button>
                </>
              )}
              {activeSession.status === 'completed' && (
                <>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => handleExport('xlsx')}>
                    <FileSpreadsheet className="h-3.5 w-3.5" /> Export Excel
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => handleExport('pdf')}>
                    <Download className="h-3.5 w-3.5" /> Export PDF
                  </Button>
                </>
              )}
            </div>

            {/* Dashboard cards */}
            <div className="grid gap-4 md:grid-cols-4 animate-fade-in-up">
              <Card className="card-hover">
                <CardContent className="pt-5 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10"><Package className="h-4 w-4 text-primary" /></div>
                  <div>
                    <p className="text-2xl font-bold">{stats.expected}</p>
                    <p className="text-xs text-muted-foreground">Expected Assets</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="card-hover">
                <CardContent className="pt-5 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[hsl(var(--status-active))]/10"><CheckCircle2 className="h-4 w-4 text-[hsl(var(--status-active))]" /></div>
                  <div>
                    <p className="text-2xl font-bold">{stats.verified}</p>
                    <p className="text-xs text-muted-foreground">Verified Assets</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="card-hover">
                <CardContent className="pt-5 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-destructive/10"><AlertTriangle className="h-4 w-4 text-destructive" /></div>
                  <div>
                    <p className="text-2xl font-bold">{stats.missing}</p>
                    <p className="text-xs text-muted-foreground">Missing Assets</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="card-hover">
                <CardContent className="pt-5 flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[hsl(var(--chart-3))]/10"><TrendingUp className="h-4 w-4 text-[hsl(var(--chart-3))]" /></div>
                  <div className="flex-1">
                    <p className="text-2xl font-bold">{stats.progress_pct}%</p>
                    <p className="text-xs text-muted-foreground mb-2">Audit Progress</p>
                    <Progress value={stats.progress_pct} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Results table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Audit Results</CardTitle>
                <CardDescription>
                  {activeSession.status === 'in_progress'
                    ? 'Scan QR codes to verify assets. Already-scanned assets show a warning.'
                    : 'Final audit results including missing assets.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-auto max-h-[420px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Asset Tag</TableHead>
                        <TableHead>Asset Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Scan Time</TableHead>
                        <TableHead>Scanned By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(results?.assets ?? []).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            {activeSession.status === 'planned'
                              ? 'Start the audit to load expected assets.'
                              : 'No assets in scope for this session.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        results!.assets.map((row) => (
                          <TableRow key={row.asset_id}>
                            <TableCell className="font-mono text-xs">{row.asset_tag}</TableCell>
                            <TableCell>{row.asset_name}</TableCell>
                            <TableCell>
                              <Badge variant={row.audit_status === 'found' ? 'default' : 'destructive'}>
                                {row.audit_status === 'found' ? 'Found' : 'Missing'}
                              </Badge>
                            </TableCell>
                            <TableCell>{row.assigned_to || '—'}</TableCell>
                            <TableCell className="text-xs">
                              {row.scan_time ? format(new Date(row.scan_time), 'PPp') : '—'}
                            </TableCell>
                            <TableCell className="text-xs">{row.scanned_by || '—'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {results && results.missing_assets.length > 0 && (
              <Card className="border-destructive/30">
                <CardHeader>
                  <CardTitle className="text-base text-destructive">Missing Assets ({results.missing_assets.length})</CardTitle>
                  <CardDescription>Assets expected in scope but not verified during this audit.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="text-sm space-y-1">
                    {results.missing_assets.map((m) => (
                      <li key={m.asset_id} className="font-mono">
                        {m.asset_tag} — {m.asset_name}
                        {m.assigned_to ? ` (assigned to ${m.assigned_to})` : ''}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <QrScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onVerify={async (payload) => {
          if (!activeSessionId) return;
          try {
            await scanAsset.mutateAsync({
              sessionId: activeSessionId,
              asset_tag: payload.asset_tag,
              verification: payload.verification,
              current_condition: payload.current_condition,
              notes: payload.notes,
            });
            toast.success(`Verified: ${payload.asset_tag}`);
            void refetchResults();
          } catch (err) {
            toast.warning(err instanceof Error ? err.message : 'Scan failed');
          }
        }}
        continuous
      />
    </AppLayout>
  );
}
