import { useState } from 'react';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Settings, Bell, Shield, Palette, Database, Globe, HardDrive, Download, Upload, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const themePalettes = [
  { value: 'classic', label: 'Classic', color: 'hsl(210, 16%, 82%)' },
  { value: 'ocean', label: 'Ocean', color: 'hsl(190, 80%, 53%)' },
  { value: 'forest', label: 'Forest', color: 'hsl(130, 32%, 42%)' },
  { value: 'sunset', label: 'Sunset', color: 'hsl(15, 85%, 55%)' },
  { value: 'vintage', label: 'Vintage Modern', color: 'hsl(345, 65%, 35%)' },
];

export default function SettingsPage() {
  const [tab, setTab] = useState('general');
  const { theme, setTheme, themeStyle, setThemeStyle } = useTheme();

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3 animate-fade-in">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
            <Settings className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Awash Wine S.C. ITAM configuration</p>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Alerts</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-6">
            <Card className="animate-fade-in-up">
              <CardHeader>
                <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-base">Organization</CardTitle></div>
                <CardDescription>Company & regional settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Organization Name</Label>
                    <Input defaultValue="Awash Wine S.C." />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select defaultValue="etb">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="etb">ETB (Ethiopian Birr)</SelectItem>
                        <SelectItem value="usd">USD (US Dollar)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Fiscal Year Start</Label>
                    <Select defaultValue="july">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['January', 'April', 'July', 'October'].map(m => <SelectItem key={m} value={m.toLowerCase()}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Asset Tag Prefix</Label>
                    <Input defaultValue="AW-" />
                  </div>
                </div>
                <Button onClick={() => toast.success('Settings saved')} className="shadow-lg shadow-primary/20">Save Changes</Button>
              </CardContent>
            </Card>

            <Card className="animate-fade-in-up">
              <CardHeader>
                <div className="flex items-center gap-2"><Palette className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-base">Appearance</CardTitle></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Theme Mode</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Theme Palette</Label>
                    <Select value={themeStyle} onValueChange={setThemeStyle}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {themePalettes.map((palette) => (
                          <SelectItem key={palette.value} value={palette.value}>
                            <span
                              className="mr-2 inline-block h-3.5 w-3.5 rounded-full border border-border"
                              style={{ backgroundColor: palette.color }}
                            />
                            {palette.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between"><Label>Compact mode</Label><Switch /></div>
                <div className="flex items-center justify-between"><Label>Animations</Label><Switch defaultChecked /></div>
                <div className="flex items-center justify-between"><Label>Show asset thumbnails</Label><Switch defaultChecked /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 mt-6">
            <Card className="animate-fade-in-up">
              <CardHeader>
                <div className="flex items-center gap-2"><Bell className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-base">Alert Configuration</CardTitle></div>
                <CardDescription>Configure when and how you receive alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between"><Label>Email notifications</Label><Switch defaultChecked /></div>
                <Separator />
                <div className="flex items-center justify-between"><Label>Warranty expiry alerts</Label><Switch defaultChecked /></div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Alert before expiry (days)</Label>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['7', '14', '30', '60', '90'].map(d => <SelectItem key={d} value={d}>{d} days</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between"><Label>License expiry alerts</Label><Switch defaultChecked /></div>
                <div className="flex items-center justify-between"><Label>Maintenance reminders</Label><Switch defaultChecked /></div>
                <div className="flex items-center justify-between"><Label>Audit overdue alerts</Label><Switch defaultChecked /></div>
                <div className="flex items-center justify-between"><Label>Low stock warnings</Label><Switch /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-6">
            <Card className="animate-fade-in-up">
              <CardHeader>
                <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-base">Access Control</CardTitle></div>
                <CardDescription>Authentication & session settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between"><Label>Two-factor authentication</Label><Switch /></div>
                <div className="flex items-center justify-between"><Label>Auto session timeout</Label><Switch defaultChecked /></div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Session timeout</Label>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['15', '30', '60', '120'].map(m => <SelectItem key={m} value={m}>{m} minutes</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between"><Label>Require approval for asset transfers</Label><Switch defaultChecked /></div>
                <div className="flex items-center justify-between"><Label>Log all user actions</Label><Switch defaultChecked /></div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4 mt-6">
            <Card className="animate-fade-in-up">
              <CardHeader>
                <div className="flex items-center gap-2"><Database className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-base">Storage & Backup</CardTitle></div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Storage Used</span><span className="font-semibold">2.4 GB / 10 GB</span></div>
                  <Progress value={24} className="h-2" />
                </div>
                <Separator />
                <div className="flex gap-3">
                  <Button variant="outline" className="gap-2" onClick={() => toast.success('Backup started...')}><Download className="h-4 w-4" />Export Backup</Button>
                  <Button variant="outline" className="gap-2" onClick={() => toast.info('Import dialog would open')}><Upload className="h-4 w-4" />Import Data</Button>
                </div>
                <Separator />
                <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                  <p className="text-sm font-medium text-destructive">Danger Zone</p>
                  <p className="text-xs text-muted-foreground mt-1">Permanently delete all asset data. This action cannot be undone.</p>
                  <Button variant="destructive" size="sm" className="mt-3 gap-2" onClick={() => toast.error('This action requires admin confirmation')}><Trash2 className="h-3.5 w-3.5" />Reset All Data</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
