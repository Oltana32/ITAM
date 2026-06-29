import { useState } from 'react';
import { GitPullRequest, Clock, CheckCircle2, XCircle, Search, Plus, Filter, AlertCircle, User, Calendar } from 'lucide-react';
import { generateUuid } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const mockRequests = [
  { id: '1', title: 'New Laptop Request', requester: 'Abebe Bekele', department: 'IT Department', date: '2024-03-15', status: 'pending', type: 'new', priority: 'high', description: 'Need a new laptop for development work' },
  { id: '2', title: 'Monitor Replacement', requester: 'Sara Tesfaye', department: 'Finance', date: '2024-03-14', status: 'approved', type: 'replacement', priority: 'medium', description: 'Current monitor has dead pixels' },
  { id: '3', title: 'Keyboard & Mouse', requester: 'Hana Gebre', department: 'Marketing', date: '2024-03-13', status: 'fulfilled', type: 'new', priority: 'low', description: 'Standard peripherals for new hire' },
  { id: '4', title: 'Server Access', requester: 'Dawit Hailu', department: 'IT Department', date: '2024-03-12', status: 'rejected', type: 'access', priority: 'high', description: 'Need server room access for maintenance' },
  { id: '5', title: 'Software License - Adobe CC', requester: 'Kidist Alemu', department: 'Marketing', date: '2024-03-11', status: 'pending', type: 'software', priority: 'medium', description: 'Adobe Creative Cloud for design team' },
  { id: '6', title: 'Printer for Reception', requester: 'Yonas Tadesse', department: 'HR & Admin', date: '2024-03-10', status: 'approved', type: 'new', priority: 'low', description: 'Color printer for front desk' },
  { id: '7', title: 'UPS Battery Replacement', requester: 'Dawit Hailu', department: 'IT Department', date: '2024-03-09', status: 'pending', type: 'maintenance', priority: 'critical', description: 'Server room UPS battery needs replacement urgently' },
];

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pending: { color: 'bg-[hsl(var(--chart-3))]/10 text-[hsl(var(--chart-3))]', icon: Clock, label: 'Pending' },
  approved: { color: 'bg-primary/10 text-primary', icon: CheckCircle2, label: 'Approved' },
  fulfilled: { color: 'bg-[hsl(var(--status-active))]/10 text-[hsl(var(--status-active))]', icon: CheckCircle2, label: 'Fulfilled' },
  rejected: { color: 'bg-destructive/10 text-destructive', icon: XCircle, label: 'Rejected' },
};

const priorityConfig: Record<string, string> = {
  critical: 'bg-destructive/10 text-destructive border-destructive/20',
  high: 'bg-[hsl(var(--chart-3))]/10 text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]/20',
  medium: 'bg-primary/10 text-primary border-primary/20',
  low: 'bg-muted text-muted-foreground border-border',
};

export default function Requests() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [requests, setRequests] = useState(mockRequests);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', requester: '', department: '', type: 'new', priority: 'medium', description: '' });

  const filtered = requests.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase()) || r.requester.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApprove = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    toast.success('Request approved successfully');
  };

  const handleReject = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    toast.info('Request rejected');
  };

  const handleCreate = () => {
    if (!form.title.trim() || !form.requester.trim()) { toast.error('Title and requester are required'); return; }
    setRequests((prev) => [
      {
        id: generateUuid(),
        title: form.title,
        requester: form.requester,
        department: form.department || 'General',
        date: new Date().toISOString().slice(0, 10),
        status: 'pending',
        type: form.type,
        priority: form.priority,
        description: form.description,
      },
      ...prev,
    ]);
    toast.success('Request submitted');
    setForm({ title: '', requester: '', department: '', type: 'new', priority: 'medium', description: '' });
    setOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
              <GitPullRequest className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Requests</h1>
              <p className="text-muted-foreground">Asset requests & approval workflow</p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20">
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit a request</DialogTitle>
                <DialogDescription>Request a new asset, replacement, or access.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="r-title">Title</Label>
                  <Input id="r-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="New laptop request" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="r-requester">Requester</Label>
                    <Input id="r-requester" value={form.requester} onChange={(e) => setForm({ ...form, requester: e.target.value })} placeholder="Full name" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="r-dept">Department</Label>
                    <Input id="r-dept" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="IT" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Type</Label>
                    <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['new','replacement','software','access','maintenance'].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Priority</Label>
                    <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['low','medium','high','critical'].map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="r-desc">Description</Label>
                  <Textarea id="r-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Provide details about your request..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate}>Submit request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-4 animate-fade-in-up">
          {Object.entries(statusConfig).map(([status, cfg]) => {
            const count = requests.filter(r => r.status === status).length;
            return (
              <Card key={status} className="card-hover">
                <CardContent className="pt-5 flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${cfg.color}`}><cfg.icon className="h-4 w-4" /></div>
                  <div><p className="text-2xl font-bold">{count}</p><p className="text-xs text-muted-foreground">{cfg.label}</p></div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search requests..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]"><Filter className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(statusConfig).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Request List */}
        <Card className="animate-fade-in-up">
          <CardHeader><CardTitle>All Requests</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filtered.map((req) => {
                const cfg = statusConfig[req.status];
                return (
                  <div key={req.id} className="p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm">{req.title}</p>
                          <Badge variant="outline" className={`text-[10px] ${priorityConfig[req.priority]}`}>{req.priority}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{req.description}</p>
                      </div>
                      <Badge variant="secondary" className={cfg.color}>{req.status}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><User className="h-3 w-3" />{req.requester}</span>
                        <span>{req.department}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{req.date}</span>
                        <Badge variant="outline" className="text-[10px]">{req.type}</Badge>
                      </div>
                      {req.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="h-7 text-xs bg-[hsl(var(--status-active))]/10 text-[hsl(var(--status-active))] border-[hsl(var(--status-active))]/20 hover:bg-[hsl(var(--status-active))]/20" onClick={() => handleApprove(req.id)}>
                            <CheckCircle2 className="h-3 w-3 mr-1" />Approve
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 text-xs bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20" onClick={() => handleReject(req.id)}>
                            <XCircle className="h-3 w-3 mr-1" />Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
