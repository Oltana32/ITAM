import { useEffect, useState } from 'react';
import { UserCircle, Mail, Building, Shield, Calendar } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { authFetch, getStoredUser, AuthUser } from '@/lib/auth';

export default function Profile() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());

  useEffect(() => {
    void (async () => {
      const response = await authFetch('/api/users/me/');
      if (!response.ok) return;
      setUser((await response.json()) as AuthUser);
    })();
  }, []);

  const fullName = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'Unnamed User';
  const initials = fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
            <UserCircle className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground">Your account & activity</p>
          </div>
        </div>

        {/* Profile Card */}
        <Card className="animate-fade-in-up overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-primary/80 via-primary to-accent/80" />
          <CardContent className="pt-0 -mt-10 relative">
            <div className="flex items-end gap-4">
              <Avatar className="h-20 w-20 border-4 border-card shadow-lg">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="pb-1 flex-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">{fullName}</h2>
                  <Badge className="bg-accent text-accent-foreground capitalize">{user?.role?.replace('_', ' ') ?? 'user'}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{user?.department || 'No department'} · Awash Wine S.C.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in-up">
          <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { icon: Mail, label: 'Email', value: user?.email || '-' },
                { icon: Building, label: 'Department', value: user?.department || '-' },
                { icon: Shield, label: 'Role', value: user?.role?.replace('_', ' ') || '-' },
                { icon: Calendar, label: 'Joined', value: user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : '-' },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className="text-sm font-medium capitalize">{item.value}</p>
                    </div>
                  </div>
                  {i < 3 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
