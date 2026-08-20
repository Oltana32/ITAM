import { useState, useEffect } from 'react';
import { getStoredUser } from '@/lib/auth';
import { Settings, Bell, Shield, Database, Globe, HardDrive, Download, Upload, Trash2 } from 'lucide-react';
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

export default function SettingsPage() {
  const [tab, setTab] = useState('general');
  const currentUser = getStoredUser();
  const isFinanceUser = currentUser?.role === 'finance';

  // local state for settings (persisted to localStorage)
  const [organizationName, setOrganizationName] = useState('Awash Wine S.C.');
  const [currency, setCurrency] = useState('etb');
  const [fiscalStart, setFiscalStart] = useState('july');
  const [assetTagPrefix, setAssetTagPrefix] = useState('AW-');

  const [compactMode, setCompactMode] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(true);

  // notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [warrantyAlerts, setWarrantyAlerts] = useState(true);
  const [alertDays, setAlertDays] = useState('30');
  const [licenseAlerts, setLicenseAlerts] = useState(true);
  const [maintenanceReminders, setMaintenanceReminders] = useState(true);
  const [auditOverdueAlerts, setAuditOverdueAlerts] = useState(true);
  const [lowStockWarnings, setLowStockWarnings] = useState(false);

  // security
  const [twoFactor, setTwoFactor] = useState(false);
  const [autoTimeout, setAutoTimeout] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [requireApproval, setRequireApproval] = useState(true);
  const [logUserActions, setLogUserActions] = useState(true);

  // load saved settings from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('itam_settings');
      if (raw) {
        const s = JSON.parse(raw);
        if (s.organizationName) setOrganizationName(s.organizationName);
        if (s.currency) setCurrency(s.currency);
        if (s.fiscalStart) setFiscalStart(s.fiscalStart);
        if (s.assetTagPrefix) setAssetTagPrefix(s.assetTagPrefix);

        if (typeof s.compactMode === 'boolean') setCompactMode(s.compactMode);
        if (typeof s.animationsEnabled === 'boolean') setAnimationsEnabled(s.animationsEnabled);
        if (typeof s.showThumbnails === 'boolean') setShowThumbnails(s.showThumbnails);

        if (typeof s.emailNotifications === 'boolean') setEmailNotifications(s.emailNotifications);
        if (typeof s.warrantyAlerts === 'boolean') setWarrantyAlerts(s.warrantyAlerts);
        if (s.alertDays) setAlertDays(String(s.alertDays));
        if (typeof s.licenseAlerts === 'boolean') setLicenseAlerts(s.licenseAlerts);
        if (typeof s.maintenanceReminders === 'boolean') setMaintenanceReminders(s.maintenanceReminders);
        if (typeof s.auditOverdueAlerts === 'boolean') setAuditOverdueAlerts(s.auditOverdueAlerts);
        if (typeof s.lowStockWarnings === 'boolean') setLowStockWarnings(s.lowStockWarnings);

        if (typeof s.twoFactor === 'boolean') setTwoFactor(s.twoFactor);
        if (typeof s.autoTimeout === 'boolean') setAutoTimeout(s.autoTimeout);
        if (s.sessionTimeout) setSessionTimeout(String(s.sessionTimeout));
        if (typeof s.requireApproval === 'boolean') setRequireApproval(s.requireApproval);
        if (typeof s.logUserActions === 'boolean') setLogUserActions(s.logUserActions);
      }
    } catch (e) {
      // ignore malformed localStorage
    }
  }, []);

  const saveAll = () => {
    const s = {
      organizationName,
      currency,
      fiscalStart,
      assetTagPrefix,
      compactMode,
      animationsEnabled,
      showThumbnails,
      emailNotifications,
      warrantyAlerts,
      alertDays,
      licenseAlerts,
      maintenanceReminders,
      auditOverdueAlerts,
      lowStockWarnings,
      twoFactor,
      autoTimeout,
      sessionTimeout,
      requireApproval,
      logUserActions,
    };
    localStorage.setItem('itam_settings', JSON.stringify(s));
    toast.success('Settings saved');
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl w-full mx-auto px-2">
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
          <TabsList className="grid w-full max-w-lg grid-cols-2 sm:grid-cols-4 gap-2">
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
                    <Input value={organizationName} onChange={(e) => setOrganizationName(e.currentTarget.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={(v) => setCurrency(v)}>
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
                    <Select value={fiscalStart} onValueChange={(v) => setFiscalStart(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['January', 'April', 'July', 'October'].map(m => <SelectItem key={m} value={m.toLowerCase()}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Asset Tag Prefix</Label>
                    <Input value={assetTagPrefix} onChange={(e) => setAssetTagPrefix(e.currentTarget.value)} />
                  </div>
                </div>
                <Button onClick={saveAll} className="shadow-lg shadow-primary/20">Save Changes</Button>
              </CardContent>
            </Card>

            <Card className="animate-fade-in-up">
              <CardHeader>
                <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" /><CardTitle className="text-base">Preferences</CardTitle></div>
                <CardDescription>Personal display and interaction preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between"><Label>Compact mode</Label><Switch checked={compactMode} onCheckedChange={(v) => setCompactMode(Boolean(v))} /></div>
                <div className="flex items-center justify-between"><Label>Animations</Label><Switch checked={animationsEnabled} onCheckedChange={(v) => setAnimationsEnabled(Boolean(v))} /></div>
                <div className="flex items-center justify-between"><Label>Show asset thumbnails</Label><Switch checked={showThumbnails} onCheckedChange={(v) => setShowThumbnails(Boolean(v))} /></div>
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
                <div className="flex items-center justify-between"><Label>Email notifications</Label><Switch checked={emailNotifications} onCheckedChange={(v) => setEmailNotifications(Boolean(v))} /></div>
                <Separator />
                <div className="flex items-center justify-between"><Label>Warranty expiry alerts</Label><Switch checked={warrantyAlerts} onCheckedChange={(v) => setWarrantyAlerts(Boolean(v))} /></div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Alert before expiry (days)</Label>
                  <Select value={alertDays} onValueChange={(v) => setAlertDays(v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['7', '14', '30', '60', '90'].map(d => <SelectItem key={d} value={d}>{d} days</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between"><Label>License expiry alerts</Label><Switch checked={licenseAlerts} onCheckedChange={(v) => setLicenseAlerts(Boolean(v))} /></div>
                <div className="flex items-center justify-between"><Label>Maintenance reminders</Label><Switch checked={maintenanceReminders} onCheckedChange={(v) => setMaintenanceReminders(Boolean(v))} /></div>
                <div className="flex items-center justify-between"><Label>Audit overdue alerts</Label><Switch checked={auditOverdueAlerts} onCheckedChange={(v) => setAuditOverdueAlerts(Boolean(v))} /></div>
                <div className="flex items-center justify-between"><Label>Low stock warnings</Label><Switch checked={lowStockWarnings} onCheckedChange={(v) => setLowStockWarnings(Boolean(v))} /></div>
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
                <div className="flex items-center justify-between"><Label>Two-factor authentication</Label><Switch checked={twoFactor} onCheckedChange={(v) => setTwoFactor(Boolean(v))} /></div>
                <div className="flex items-center justify-between"><Label>Auto session timeout</Label><Switch checked={autoTimeout} onCheckedChange={(v) => setAutoTimeout(Boolean(v))} /></div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Session timeout</Label>
                  <Select value={sessionTimeout} onValueChange={(v) => setSessionTimeout(v)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['15', '30', '60', '120'].map(m => <SelectItem key={m} value={m}>{m} minutes</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="flex items-center justify-between"><Label>Require approval for asset transfers</Label><Switch checked={requireApproval} onCheckedChange={(v) => setRequireApproval(Boolean(v))} /></div>
                <div className="flex items-center justify-between"><Label>Log all user actions</Label><Switch checked={logUserActions} onCheckedChange={(v) => setLogUserActions(Boolean(v))} /></div>
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
