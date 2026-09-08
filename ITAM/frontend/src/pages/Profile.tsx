import { useEffect, useMemo, useRef, useState } from 'react';
import { UserCircle, Mail, Building, Shield, Calendar, Palette, ImagePlus, Save } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/components/theme/ThemeProvider';
import { authFetch, getStoredUser, AuthUser } from '@/lib/auth';
import { toast } from 'sonner';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export default function Profile() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [form, setForm] = useState({ first_name: '', last_name: '', department: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { theme, themeStyle, setTheme, setThemeStyle } = useTheme();
  const isFinanceUser = user?.role === 'finance';

  useEffect(() => {
    void (async () => {
      const response = await authFetch('/api/users/me/');
      if (!response.ok) return;
      const nextUser = (await response.json()) as AuthUser;
      setUser(nextUser);
      setForm({
        first_name: nextUser.first_name ?? '',
        last_name: nextUser.last_name ?? '',
        department: nextUser.department ?? '',
      });
    })();
  }, []);

  const fullName = useMemo(() => `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim() || 'Unnamed User', [user]);
  const initials = useMemo(() => fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U', [fullName]);
  const avatarUrl = user?.avatar ? `${API_URL}${user.avatar}` : undefined;

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const payload = new FormData();
      payload.append('first_name', form.first_name);
      payload.append('last_name', form.last_name);
      payload.append('department', form.department);
      if (imageFile) payload.append('avatar', imageFile);

      const response = await authFetch(`/api/users/${user.id}/`, {
        method: 'PATCH',
        body: payload,
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Profile update failed');
      }

      const updated = (await response.json()) as AuthUser;
      setUser(updated);
      setForm({
        first_name: updated.first_name ?? '',
        last_name: updated.last_name ?? '',
        department: updated.department ?? '',
      });
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update profile');
    } finally {
      setSaving(false);
    }
  };

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

        <Card className="animate-fade-in-up overflow-hidden">
          <div className="h-20 bg-gradient-to-r from-primary/80 via-primary to-accent/80" />
          <CardContent className="pt-0 -mt-10 relative">
            <div className="flex items-end gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-card shadow-lg">
                  {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName} /> : null}
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">{initials}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full border border-background bg-background text-muted-foreground shadow-sm hover:text-foreground"
                  aria-label="Upload profile photo"
                >
                  <ImagePlus className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
                />
              </div>
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
          <CardHeader><CardTitle className="text-base">Edit Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first-name">First name</Label>
                <Input id="first-name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last-name">Last name</Label>
                <Input id="last-name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input id="department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
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

        {!isFinanceUser && (
          <Card className="animate-fade-in-up">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Appearance</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Theme Mode</Label>
                  <Select value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Theme Palette</Label>
                  <Select value={themeStyle} onValueChange={(value) => setThemeStyle(value as 'classic' | 'ocean' | 'forest' | 'sunset' | 'vintage')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        { value: 'classic', label: 'Classic' },
                        { value: 'ocean', label: 'Ocean' },
                        { value: 'forest', label: 'Forest' },
                        { value: 'sunset', label: 'Sunset' },
                        { value: 'vintage', label: 'Vintage' },
                      ].map((palette) => (
                        <SelectItem key={palette.value} value={palette.value}>
                          {palette.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
