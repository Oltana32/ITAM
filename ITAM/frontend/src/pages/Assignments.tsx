import { useState, useMemo, useCallback } from 'react';
import { ClipboardList, UserCheck, MapPin, Package, Printer, ScanLine } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AssetDetailDialog } from '@/components/assets/AssetDetailDialog';
import { useAssets } from '@/hooks/useAssets';
import { useLocations } from '@/hooks/useLocations';
import { useActivityLog } from '@/hooks/useActivityLog';
import { useAssignments, Assignment } from '@/hooks/useAssignmentsQuery';
import { categoryLabels, AssetCategory, isActiveAssignmentStatus, assignmentStatusLabels, Asset } from '@/types/asset';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { QRCodeSVG } from 'qrcode.react';
import { QrScannerDialog } from '@/components/assets/QrScannerDialog';
import { extractAssetTag } from '@/lib/parseQrScan';
import { returnAssetByTag } from '@/hooks/useAudits';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function Assignments() {
  const { assets, updateAsset } = useAssets();
  const { locations } = useLocations();
  const { log } = useActivityLog();
  const { assignments, refetchAssignments, createAssignment, isCreatingAssignment, updateAssignment } = useAssignments();

  const [open, setOpen] = useState(false);
  const [assetId, setAssetId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState<string>('all');
  const [printData, setPrintData] = useState<{
    assetTag: string;
    assetName: string;
    employeeName: string;
    employeeId: string;
    location: string;
    assignedAt: string;
  } | null>(null);
  
  const [returnData, setReturnData] = useState<{
    assignmentId: string;
    assetId: string;
    assetTag: string;
    assetName: string;
    employeeName: string;
    employeeId: string;
    location: string;
    assignedDate: string;
  } | null>(null);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [returnScannerOpen, setReturnScannerOpen] = useState(false);

  const assigned = useMemo(
    () => assets.filter((a) => a.assignedTo || (a.location && a.location !== 'Unassigned')),
    [assets]
  );

  const assignedPeopleCount = useMemo(
    () => new Set(assigned.filter((a) => a.assignedTo).map((a) => a.assignedTo)).size,
    [assigned]
  );

  const availableAssets = useMemo(() => {
    return assets.filter((a) => {
      // Asset is available if not assigned to anyone and status is available or ready
      const isAvailable = !a.assignedTo && (a.status === 'available' || a.status === 'ready');
      const matchesCategory = assetCategoryFilter === 'all' || a.category === assetCategoryFilter;
      return isAvailable && matchesCategory;
    });
  }, [assets, assetCategoryFilter]);

  // Auto-update category filter when asset is selected
  const handleAssetIdChange = (newAssetId: string) => {
    setAssetId(newAssetId);
    const selectedAsset = availableAssets.find((a) => a.id === newAssetId);
    if (selectedAsset && assetCategoryFilter === 'all') {
      setAssetCategoryFilter(selectedAsset.category);
    }
  };
  const locationChartData = useMemo(() => {
    const counts = assigned.reduce<Record<string, number>>((acc, asset) => {
      const location = asset.location || 'Unassigned';
      acc[location] = (acc[location] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count);
  }, [assigned]);

  const reset = () => {
    setAssetId('');
    setLocationId('');
    setAssignedTo('');
    setEmployeeId('');
    setAssetCategoryFilter('all');
  };

  const formatSafeDate = (dateString?: string | null) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return Number.isNaN(date.getTime()) ? 'Unknown date' : format(date, 'PPP');
  };

  const activeAssignments = useMemo(
    () => assignments.filter((a) => isActiveAssignmentStatus(a.status)),
    [assignments]
  );

  const handleSave = async () => {
    if (!assetId) { toast.error('Please select an available asset'); return; }
    if (!locationId) { toast.error('Please select a location'); return; }
    if (!assignedTo.trim()) { toast.error('Please enter who this asset is assigned to'); return; }
    if (!employeeId.trim()) { toast.error('Please enter the employee ID'); return; }

    const asset = assets.find((a) => a.id === assetId);
    const location = locations.find((l) => l.id === locationId);
    if (!asset || !location) return;

    // Check if asset is still available
    if (asset.assignedTo) {
      toast.error('This asset is no longer available');
      return;
    }

    const locationLabel = `${location.name} - ${location.city}`;
    const notes = `Assigned ${asset.name} to ${assignedTo.trim()} (${employeeId.trim()}) at ${locationLabel}`;
    const today = new Date();
    const assignedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    try {
      await createAssignment({
        asset: Number(asset.id),
        assigned_date: assignedDate,
        status: 'assigned',
        notes,
        assignedTo: assignedTo.trim(),
        employeeId: employeeId.trim(),
        location: locationLabel,
      });
      await updateAsset(asset.id, {
        status: 'in-use',
        locationId,
      });
      await refetchAssignments();
      log({
        assetId: asset.id,
        assetName: asset.name,
        type: 'assigned',
        description: notes,
      });
      setPrintData({
        assetTag: asset.assetTag,
        assetName: asset.name,
        employeeName: assignedTo.trim(),
        employeeId: employeeId.trim(),
        location: locationLabel,
        assignedAt: new Date().toISOString(),
      });
      toast.success('Assignment saved');
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save assignment');
    }
  };

  const handleViewAsset = (assignment: Assignment) => {
    const asset = assets.find((a) => a.id === String(assignment.asset));
    if (asset) {
      setDetailAsset(asset);
      setDetailOpen(true);
    } else {
      toast.error('Asset details not found');
    }
  };

  const handleQrReturn = async (raw: string) => {
    const assetTag = extractAssetTag(raw);
    try {
      await returnAssetByTag(assetTag);
      await refetchAssignments();
      window.dispatchEvent(new Event('asset-buddy-assignments-changed'));
      log({
        assetId: '',
        assetName: assetTag,
        type: 'returned',
        description: `Asset ${assetTag} returned via QR scan`,
      });
      toast.success(`Asset ${assetTag} returned to available`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to return asset');
    }
  };

  const handleReturnAsset = async () => {
    if (!returnData) return;

    try {
      await updateAssignment({
        id: returnData.assignmentId,
        payload: {
          status: 'returned',
          actualReturnDate: format(new Date(), 'yyyy-MM-dd'),
        },
      });

      const asset = assets.find((a) => a.id === returnData.assetId);
      if (asset) {
        await updateAsset(asset.id, { status: 'returned' });
        await updateAsset(asset.id, { status: 'available' });
      }

      // Refresh assignments and assets
      await refetchAssignments();

      log({
        assetId: returnData.assetId,
        assetName: returnData.assetName,
        type: 'returned',
        description: `${returnData.assetName} returned by ${returnData.employeeName} (${returnData.employeeId})`,
      });

      toast.success('Asset returned successfully');
      setReturnData(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to return asset');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
              <ClipboardList className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Asset Assignments</h1>
              <p className="text-muted-foreground">Assign assets to people and locations</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setReturnScannerOpen(true)}>
              <ScanLine className="h-4 w-4" />
              Return via QR
            </Button>
            <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { reset(); setAssetCategoryFilter('all'); } }}>
            <DialogTrigger asChild>
              <Button className="shadow-lg shadow-primary/20">
                <UserCheck className="mr-2 h-4 w-4" />
                New Assignment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New asset assignment</DialogTitle>
                <DialogDescription>
                  Pick an asset from inventory, choose a location, and assign it to an employee with their ID.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label>Asset Category</Label>
                  <Select value={assetCategoryFilter} onValueChange={setAssetCategoryFilter}>
                    <SelectTrigger><SelectValue placeholder="Filter by category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Available Asset ({availableAssets.length} available)</Label>
                  <Select value={assetId} onValueChange={handleAssetIdChange}>
                    <SelectTrigger><SelectValue placeholder="Select an available asset" /></SelectTrigger>
                    <SelectContent>
                      {availableAssets.length === 0 && (
                        <div className="px-3 py-2 text-xs text-muted-foreground">
                          {assetCategoryFilter === 'all'
                            ? 'No available assets — add some first.'
                            : `No available ${categoryLabels[assetCategoryFilter as AssetCategory]} assets.`
                          }
                        </div>
                      )}
                      {availableAssets.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.id} · {a.assetTag || 'No tag'} — {a.name} ({categoryLabels[a.category]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Location</Label>
                  <Select value={locationId} onValueChange={setLocationId}>
                    <SelectTrigger><SelectValue placeholder="Select a location" /></SelectTrigger>
                    <SelectContent>
                      {locations.length === 0 && (
                        <div className="px-3 py-2 text-xs text-muted-foreground">No locations yet — add one first.</div>
                      )}
                      {locations.filter(l => l.name?.toLowerCase() !== 'it stock').map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name} — {l.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">IT Stock location cannot be selected for assignments</p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="a-person">Assigned To</Label>
                  <Input
                    id="a-person"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    placeholder="e.g. Abebe Bekele"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="employee-id">Employee ID</Label>
                  <Input
                    id="employee-id"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    placeholder="e.g. EMP-12345"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setOpen(false); reset(); }}>Cancel</Button>
                <Button onClick={handleSave} disabled={isCreatingAssignment}>
                  {isCreatingAssignment ? 'Saving…' : 'Save & Print Agreement'}
                </Button>
              </DialogFooter>
            </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 animate-fade-in-up">
          <Card className="card-hover">
            <CardContent className="pt-5 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10"><Package className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{assets.length}</p>
                <p className="text-xs text-muted-foreground">Total Assets</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="pt-5 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[hsl(var(--chart-2))]/10"><UserCheck className="h-4 w-4 text-[hsl(var(--chart-2))]" /></div>
              <div>
                <p className="text-2xl font-bold">{assignedPeopleCount}</p>
                <p className="text-xs text-muted-foreground">Assigned to People</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="animate-fade-in-up">
          <CardHeader>
            <CardTitle>Allocated Assets ({activeAssignments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No assignment records yet. Create an assignment to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {activeAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleViewAsset(assignment)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleViewAsset(assignment);
                      }
                    }}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                        <UserCheck className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{assignment.asset_name} ({assignment.asset_tag})</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>👤 {assignment.assignedTo || 'Unknown person'}</span>
                          <span>•</span>
                          <span>{formatSafeDate(assignment.assigned_date)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>✓ Assigned by: {assignment.assignedBy || 'System'}</span>
                        </div>
                        {assignment.notes && (
                          <p className="text-xs text-muted-foreground truncate">{assignment.notes}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={isActiveAssignmentStatus(assignment.status) ? 'default' : 'secondary'}>
                        {assignmentStatusLabels[assignment.status] ?? assignment.status}
                      </Badge>
                      {isActiveAssignmentStatus(assignment.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            const asset = assets.find((a) => a.id === String(assignment.asset));
                            if (asset) {
                              setReturnData({
                                assignmentId: assignment.id,
                                assetId: String(assignment.asset),
                                assetTag: assignment.asset_tag,
                                assetName: assignment.asset_name,
                                employeeName: assignment.assignedTo,
                                employeeId: assignment.employeeId,
                                location: assignment.location,
                                assignedDate: assignment.assigned_date,
                              });
                            }
                          }}
                        >
                          <span>Return</span>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={Boolean(printData)} onOpenChange={(open) => { if (!open) setPrintData(null); }}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Assignment Agreement</DialogTitle>
              <DialogDescription>
                Review the assignment details and print the agreement with barcode, asset tag, and QR code.
              </DialogDescription>
            </DialogHeader>
            {printData ? (
              <div className="space-y-6 py-4">
                <div className="rounded-2xl border border-border p-6 bg-muted/50">
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold">ASSET ASSIGNMENT AGREEMENT</h2>
                    <p className="text-sm text-muted-foreground">Asset Buddy Management System</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">ASSET DETAILS</p>
                        <p className="text-lg font-semibold">{printData.assetName}</p>
                        <p className="text-sm text-muted-foreground">Asset Tag: <span className="font-mono font-bold">{printData.assetTag}</span></p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground font-medium">ASSIGNEE DETAILS</p>
                        <p className="text-lg font-semibold">{printData.employeeName}</p>
                        <p className="text-sm text-muted-foreground">Employee ID: <span className="font-mono font-bold">{printData.employeeId}</span></p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground font-medium">LOCATION & DATE</p>
                        <p className="font-semibold">{printData.location}</p>
                        <p className="text-sm text-muted-foreground">Assigned: {format(new Date(printData.assignedAt), 'PPP')}</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground font-medium mb-2">BARCODE</p>
                        <div className="bg-white p-3 rounded-lg border-2 border-gray-300">
                          <div className="text-center font-mono text-2xl font-bold tracking-wider">
                            {printData.assetTag.split('').map((char, i) => (
                              <span key={i} className="inline-block mx-0.5">{char}</span>
                            ))}
                          </div>
                          <p className="text-xs text-center mt-1 font-mono">{printData.assetTag}</p>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-muted-foreground font-medium mb-2">QR CODE</p>
                        <div className="inline-flex items-center justify-center rounded-xl bg-white p-4 shadow-sm border">
                          <QRCodeSVG
                            value={JSON.stringify({
                              tag: printData.assetTag,
                              name: printData.assetName,
                              employeeId: printData.employeeId,
                              employeeName: printData.employeeName,
                              location: printData.location,
                              assignedAt: printData.assignedAt
                            })}
                            size={120}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border">
                    <div className="grid gap-4 md:grid-cols-2 text-xs">
                      <div>
                        <p className="font-medium mb-2">ASSIGNEE SIGNATURE</p>
                        <div className="border-b border-gray-400 h-8"></div>
                        <p className="text-muted-foreground mt-1">Signature: ___________________________</p>
                        <p className="text-muted-foreground">Date: _______________________________</p>
                      </div>
                      <div>
                        <p className="font-medium mb-2">IT DEPARTMENT APPROVAL</p>
                        <div className="border-b border-gray-400 h-8"></div>
                        <p className="text-muted-foreground mt-1">Signature: ___________________________</p>
                        <p className="text-muted-foreground">Date: _______________________________</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-center text-xs text-muted-foreground">
                    <p>This agreement confirms the assignment of the above asset to the employee.</p>
                    <p>Asset must be returned in good condition. Loss or damage may result in charges.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <Button variant="outline" onClick={() => setPrintData(null)}>Cancel</Button>
                  <Button onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;
                    printWindow.document.write(`<!DOCTYPE html><html><head><title>Asset Assignment Agreement</title><style>body{font-family:system-ui,Arial,sans-serif;padding:24px;color:#111;background:#fff;max-width:800px;margin:0 auto;} .header{text-align:center;margin-bottom:24px;} .section{margin-bottom:20px;} .field{display:flex;margin-bottom:8px;} .label{font-weight:600;width:120px;flex-shrink:0;} .value{flex:1;} .barcode{text-align:center;margin:20px 0;padding:16px;background:#f8f9fa;border:2px solid #dee2e6;border-radius:8px;} .barcode-text{font-family:monospace;font-size:24px;font-weight:bold;letter-spacing:2px;} .qr{text-align:center;margin:20px 0;} .signatures{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:32px;padding-top:16px;border-top:1px solid #dee2e6;} .signature{border-bottom:1px solid #ccc;height:40px;margin-bottom:8px;} .footer{text-align:center;margin-top:24px;font-size:12px;color:#666;}</style></head><body><div class="header"><h1>ASSET ASSIGNMENT AGREEMENT</h1><p>Asset Buddy Management System</p></div><div class="section"><div class="field"><span class="label">Asset Name:</span><span class="value">${printData.assetName}</span></div><div class="field"><span class="label">Asset Tag:</span><span class="value font-mono">${printData.assetTag}</span></div><div class="field"><span class="label">Employee:</span><span class="value">${printData.employeeName}</span></div><div class="field"><span class="label">Employee ID:</span><span class="value font-mono">${printData.employeeId}</span></div><div class="field"><span class="label">Location:</span><span class="value">${printData.location}</span></div><div class="field"><span class="label">Assigned Date:</span><span class="value">${format(new Date(printData.assignedAt), 'PPP')}</span></div></div><div class="barcode"><div class="barcode-text">${printData.assetTag.split('').join(' ')}</div><div style="font-family:monospace;font-size:12px;margin-top:8px;">${printData.assetTag}</div></div><div class="qr"><img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify({ tag: printData.assetTag, name: printData.assetName, employeeId: printData.employeeId, employeeName: printData.employeeName, location: printData.location, assignedAt: printData.assignedAt }))}" alt="QR Code" /></div><div class="signatures"><div><div class="signature"></div><div style="font-size:12px;">Assignee Signature</div></div><div><div class="signature"></div><div style="font-size:12px;">IT Department Approval</div></div></div><div class="footer"><p>This agreement confirms the assignment of the above asset to the employee. Asset must be returned in good condition.</p></div></body></html>`);
                    printWindow.document.close();
                    printWindow.focus();
                    printWindow.print();
                  }} className="gap-2">
                    <Printer className="h-4 w-4" />
                    Print Assignment
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(returnData)} onOpenChange={(open) => { if (!open) setReturnData(null); }}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Asset Return Agreement</DialogTitle>
              <DialogDescription>
                Review the return details and print the asset return confirmation.
              </DialogDescription>
            </DialogHeader>
            {returnData ? (
              <div className="space-y-6 py-4">
                <div className="rounded-2xl border border-border p-6 bg-muted/50">
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold">ASSET RETURN AGREEMENT</h2>
                    <p className="text-sm text-muted-foreground">Asset Buddy Management System</p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">ASSET DETAILS</p>
                        <p className="text-lg font-semibold">{returnData.assetName}</p>
                        <p className="text-sm text-muted-foreground">Asset Tag: <span className="font-mono font-bold">{returnData.assetTag}</span></p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground font-medium">RETURNED BY</p>
                        <p className="text-lg font-semibold">{returnData.employeeName}</p>
                        <p className="text-sm text-muted-foreground">Employee ID: <span className="font-mono font-bold">{returnData.employeeId}</span></p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground font-medium">LOCATION & DATES</p>
                        <p className="font-semibold">{returnData.location}</p>
                        <p className="text-sm text-muted-foreground">
                          Assigned: {format(new Date(returnData.assignedDate), 'PPP')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Returned: {format(new Date(), 'PPP')}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground font-medium mb-2">ASSET BARCODE</p>
                        <div className="bg-white p-3 rounded-lg border-2 border-gray-300">
                          <div className="text-center font-mono text-2xl font-bold tracking-wider">
                            {returnData.assetTag.split('').map((char, i) => (
                              <span key={i} className="inline-block mx-0.5">{char}</span>
                            ))}
                          </div>
                          <p className="text-xs text-center mt-1 font-mono">{returnData.assetTag}</p>
                        </div>
                      </div>

                      <div className="text-center">
                        <p className="text-xs text-muted-foreground font-medium mb-2">RETURN QR CODE</p>
                        <div className="inline-flex items-center justify-center rounded-xl bg-white p-4 shadow-sm border">
                          <QRCodeSVG
                            value={JSON.stringify({
                              tag: returnData.assetTag,
                              name: returnData.assetName,
                              employeeId: returnData.employeeId,
                              employeeName: returnData.employeeName,
                              location: returnData.location,
                              returnedDate: new Date().toISOString()
                            })}
                            size={120}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border">
                    <div className="grid gap-4 md:grid-cols-2 text-xs">
                      <div>
                        <p className="font-medium mb-2">EMPLOYEE SIGNATURE</p>
                        <div className="border-b border-gray-400 h-8"></div>
                        <p className="text-muted-foreground mt-1">Signature: ___________________________</p>
                        <p className="text-muted-foreground">Date: _______________________________</p>
                      </div>
                      <div>
                        <p className="font-medium mb-2">IT DEPARTMENT RECEIVED BY</p>
                        <div className="border-b border-gray-400 h-8"></div>
                        <p className="text-muted-foreground mt-1">Signature: ___________________________</p>
                        <p className="text-muted-foreground">Date: _______________________________</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-center text-xs text-muted-foreground">
                    <p>This agreement confirms the return of the above asset from the employee.</p>
                    <p>The asset has been inspected and is being returned to inventory.</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <Button variant="outline" onClick={() => setReturnData(null)}>Close without Printing</Button>
                  <Button variant="outline" onClick={() => {
                    const printWindow = window.open('', '_blank');
                    if (!printWindow) return;
                    printWindow.document.write(`<!DOCTYPE html><html><head><title>Asset Return Agreement</title><style>body{font-family:system-ui,Arial,sans-serif;padding:24px;color:#111;background:#fff;max-width:800px;margin:0 auto;} .header{text-align:center;margin-bottom:24px;} .section{margin-bottom:20px;} .field{display:flex;margin-bottom:8px;} .label{font-weight:600;width:120px;flex-shrink:0;} .value{flex:1;} .barcode{text-align:center;margin:20px 0;padding:16px;background:#f8f9fa;border:2px solid #dee2e6;border-radius:8px;} .barcode-text{font-family:monospace;font-size:24px;font-weight:bold;letter-spacing:2px;} .qr{text-align:center;margin:20px 0;} .signatures{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:32px;padding-top:16px;border-top:1px solid #dee2e6;} .signature{border-bottom:1px solid #ccc;height:40px;margin-bottom:8px;} .footer{text-align:center;margin-top:24px;font-size:12px;color:#666;}</style></head><body><div class="header"><h1>ASSET RETURN AGREEMENT</h1><p>Asset Buddy Management System</p></div><div class="section"><div class="field"><span class="label">Asset Name:</span><span class="value">${returnData.assetName}</span></div><div class="field"><span class="label">Asset Tag:</span><span class="value font-mono">${returnData.assetTag}</span></div><div class="field"><span class="label">Returned By:</span><span class="value">${returnData.employeeName}</span></div><div class="field"><span class="label">Employee ID:</span><span class="value font-mono">${returnData.employeeId}</span></div><div class="field"><span class="label">Location:</span><span class="value">${returnData.location}</span></div><div class="field"><span class="label">Assigned Date:</span><span class="value">${format(new Date(returnData.assignedDate), 'PPP')}</span></div><div class="field"><span class="label">Return Date:</span><span class="value">${format(new Date(), 'PPP')}</span></div></div><div class="barcode"><div class="barcode-text">${returnData.assetTag.split('').join(' ')}</div><div style="font-family:monospace;font-size:12px;margin-top:8px;">${returnData.assetTag}</div></div><div class="qr"><img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(JSON.stringify({ tag: returnData.assetTag, name: returnData.assetName, employeeId: returnData.employeeId, employeeName: returnData.employeeName, location: returnData.location, returnedDate: new Date().toISOString() }))}" alt="QR Code" /></div><div class="signatures"><div><div class="signature"></div><div style="font-size:12px;">Employee Signature</div></div><div><div class="signature"></div><div style="font-size:12px;">IT Department</div></div></div><div class="footer"><p>This agreement confirms the return of the above asset. The asset has been inspected and is being returned to inventory.</p></div></body></html>`);
                    printWindow.document.close();
                    printWindow.focus();
                    printWindow.print();
                  }} className="gap-2">
                    <Printer className="h-4 w-4" />
                    Print Return Agreement
                  </Button>
                  <Button onClick={handleReturnAsset} className="gap-2">
                    <UserCheck className="h-4 w-4" />
                    Confirm Return
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <AssetDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          asset={detailAsset}
          onEdit={() => {}}
          onDelete={() => {}}
          canDelete={false}
          readOnly
        />

        <QrScannerDialog
          open={returnScannerOpen}
          onOpenChange={setReturnScannerOpen}
          onScan={handleQrReturn}
        />
      </div>
    </AppLayout>
  );
}