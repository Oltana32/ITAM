import { useEffect, useState } from 'react';
import { Users as UsersIcon, UserPlus, Shield, UserCheck, Search, Mail } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth';

import { getRoleLabel } from '@/lib/permissions';

const roleColors: Record<string, string> = {
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  it_team: 'bg-[hsl(var(--chart-3))]/10 text-[hsl(var(--chart-3))] border-[hsl(var(--chart-3))]/20',
  finance: 'bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))] border-[hsl(var(--chart-5))]/20',
};

const avatarColors: Record<string, string> = {
  admin: 'bg-destructive/15 text-destructive',
  it_team: 'bg-[hsl(var(--chart-3))]/15 text-[hsl(var(--chart-3))]',
  finance: 'bg-[hsl(var(--chart-5))]/15 text-[hsl(var(--chart-5))]',
};

interface UserRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'it_team' | 'finance';
  department?: string;
  is_active?: boolean;
}

export default function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', role: 'it_team', department: '' });

  useEffect(() => {
    void (async () => {
      const response = await authFetch('/api/users/');
      if (!response.ok) return;
      const payload = await response.json();
      setUsers((Array.isArray(payload) ? payload : payload.results ?? []) as UserRow[]);
    })();
  }, []);

  const filtered = users.filter((u) =>
    searchQuery === '' ||
    `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = async () => {
    if (!form.first_name.trim() || !form.email.trim() || form.password.length < 8) {
      toast.error('First name, email, and password (8+ chars) are required');
      return;
    }
    const response = await authFetch('/api/users/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!response.ok) {
      toast.error('Failed to create user');
      return;
    }
    const created = (await response.json()) as UserRow;
    setUsers((prev) => [created, ...prev]);
    toast.success(`${created.first_name} ${created.last_name} added`);
    setForm({ first_name: '', last_name: '', email: '', password: '', role: 'it_team', department: '' });
    setOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
              <UsersIcon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Users</h1>
              <p className="text-muted-foreground">Manage {users.length} team members and access</p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20">
                <UserPlus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add new user</DialogTitle>
                <DialogDescription>Create a team member account.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="u-first">First name</Label>
                  <Input id="u-first" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} placeholder="Abebe" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="u-last">Last name</Label>
                  <Input id="u-last" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Bekele" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="u-email">Email</Label>
                  <Input id="u-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="user@awashwine.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="u-pass">Password</Label>
                  <Input id="u-pass" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Role</Label>
                    <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="it_team">IT Team</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="u-dept">Department</Label>
                    <Input id="u-dept" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="IT" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd}>Create user</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-4 animate-fade-in-up">
          <Card className="card-hover relative overflow-hidden">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10"><UsersIcon className="h-5 w-5 text-primary" /></div>
              <div><p className="text-2xl font-bold">{users.length}</p><p className="text-sm text-muted-foreground">Total Users</p></div>
            </CardContent>
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </Card>
          <Card className="card-hover relative overflow-hidden">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[hsl(var(--status-active))]/10"><UserCheck className="h-5 w-5 text-[hsl(var(--status-active))]" /></div>
              <div><p className="text-2xl font-bold">{users.filter(u => u.is_active).length}</p><p className="text-sm text-muted-foreground">Active</p></div>
            </CardContent>
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-[hsl(var(--status-active))]/40 to-transparent" />
          </Card>
          <Card className="card-hover relative overflow-hidden">
            <CardContent className="pt-6 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-destructive/10"><Shield className="h-5 w-5 text-destructive" /></div>
              <div><p className="text-2xl font-bold">{users.filter(u => u.role === 'admin').length}</p><p className="text-sm text-muted-foreground">Admins</p></div>
            </CardContent>
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-destructive/40 to-transparent" />
          </Card>
          <Card className="card-hover relative overflow-hidden"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Live data from backend users API</p></CardContent></Card>
        </div>

        <div className="relative max-w-sm animate-fade-in-up">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>

        <Card className="animate-fade-in-up">
          <CardHeader><CardTitle>All Users ({filtered.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filtered.map((user, idx) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/50 hover:border-border transition-all duration-200 group animate-fade-in-up"
                  style={{ animationDelay: `${idx * 0.05}s`, animationFillMode: 'backwards' }}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                      <AvatarFallback className={`${avatarColors[user.role]} text-sm font-semibold`}>
                          {`${user.first_name || ''}${user.last_name || ''}`.slice(0, 2).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background ${user.is_active ? 'bg-[hsl(var(--status-active))]' : 'bg-[hsl(var(--status-retired))]'}`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{`${user.first_name} ${user.last_name}`.trim() || user.email}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">{user.department || 'Unassigned'}</span>
                    <Badge variant="secondary" className={roleColors[user.role]}>{getRoleLabel(user.role)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
