import { useMemo, useState } from 'react';
import { ClipboardList, UserCheck, MapPin, Package, Printer, ScanLine, MoreHorizontal } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AssetDetailDialog } from '@/components/assets/AssetDetailDialog';
import { useAssets } from '@/hooks/useAssets';
import { useLocations } from '@/hooks/useLocations';
import { useActivityLog } from '@/hooks/useActivityLog';
import { useAssignments, Assignment } from '@/hooks/useAssignmentsQuery';
import { categoryLabels, AssetCategory, isActiveAssignmentStatus, assignmentStatusLabels, Asset } from '@/types/asset';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { QrScannerDialog } from '@/components/assets/QrScannerDialog';
import { extractAssetTag, findAssetByScan, parseQrScanPayload } from '@/lib/parseQrScan';
import { returnAssetByTag } from '@/hooks/useAudits';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getStoredUser } from '@/lib/auth';
import { buildIssueVoucherDataFromAssignments, buildIssueVoucherPages, buildReturnVoucherPages, type IssueVoucherAsset } from '@/lib/issueVoucher';

export default function Assignments() {
  const { assets, updateAsset } = useAssets();
  const { locations } = useLocations();
  const { log } = useActivityLog();
  const { assignments, refetchAssignments, createAssignment, isCreatingAssignment, updateAssignment } = useAssignments();
  const currentUser = getStoredUser();
  const currentUserName = `${currentUser?.first_name ?? ''} ${currentUser?.last_name ?? ''}`.trim() || currentUser?.email || 'System User';

  const [open, setOpen] = useState(false);
  const [assetId, setAssetId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [assetCategoryFilter, setAssetCategoryFilter] = useState<string>('all');
  const [employeeDepartment, setEmployeeDepartment] = useState<string>(currentUser?.department ?? 'IT');
  const [employeePosition, setEmployeePosition] = useState<string>(currentUser?.role === 'it_team' ? 'IT Staff' : 'Employee');
  const [printData, setPrintData] = useState<{
    voucherNumber: string;
    issueDate: string;
    printedBy: string;
    employee: {
      name: string;
      employeeId: string;
      department: string;
      position: string;
      location: string;
    };
    assets: IssueVoucherAsset[];
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
  const [searchQuery, setSearchQuery] = useState('');
  const [returnInspection, setReturnInspection] = useState({
    inspectionDate: format(new Date(), 'yyyy-MM-dd'),
    inspectedBy: currentUserName,
    overallCondition: 'good',
    physicalCondition: '',
    functionalTest: 'passed',
    accessoriesReturned: '',
    missingAccessories: '',
    requiresMaintenance: false,
    maintenanceIssue: '',
    dataWiped: 'yes',
    finalAssetStatus: 'available',
    inspectionRemarks: '',
    employeeSignature: '',
    itStaffSignature: '',
    returnedBy: '',
    receivedBy: currentUserName,
  });

  const canPrintReturnVoucher = Boolean(
    returnData &&
    returnInspection.inspectedBy.trim() &&
    returnInspection.overallCondition &&
    returnInspection.finalAssetStatus &&
    returnInspection.itStaffSignature.trim()
  );

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
    setEmployeeDepartment(currentUser?.department ?? 'IT');
    setEmployeePosition(currentUser?.role === 'it_team' ? 'IT Staff' : 'Employee');
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

  const filteredAssignments = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return activeAssignments;
    }

    return activeAssignments.filter((assignment) => {
      const haystack = [
        assignment.asset_name,
        assignment.asset_tag,
        assignment.assignedTo,
        assignment.employeeId,
        assignment.location,
        assignment.notes,
        assignment.assignedBy,
        assignment.employeeDepartment,
        assignment.employeePosition,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [activeAssignments, searchQuery]);

  const buildReturnVoucherPreviewData = useMemo(() => {
    if (!returnData) return null;
    // Try to resolve a matching asset object from the current assets list
    const resolvedAsset = assets.find(
      (a) => String(a.id) === String(returnData.assetId) || a.assetTag === returnData.assetTag || a.tag === returnData.assetTag
    );

    const assetTag = returnData.assetTag || resolvedAsset?.assetTag || resolvedAsset?.tag || '—';
    const assetName = returnData.assetName || resolvedAsset?.name || '—';
    const brand = resolvedAsset?.manufacturer || resolvedAsset?.brand || '—';
    const model = resolvedAsset?.model || '—';
    const serialNumber = resolvedAsset?.serialNumber || '—';
    const condition = returnInspection.overallCondition
      ? returnInspection.overallCondition.charAt(0).toUpperCase() + returnInspection.overallCondition.slice(1)
      : resolvedAsset?.condition
      ? resolvedAsset.condition.charAt(0).toUpperCase() + resolvedAsset.condition.slice(1)
      : 'Good';

    return {
      voucherNumber: `AW-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`,
      issueDate: new Date().toISOString(),
      printedBy: `${currentUser?.first_name ?? ''} ${currentUser?.last_name ?? ''}`.trim() || currentUser?.email || 'IT Asset Management System',
      employee: {
        name: returnData.employeeName || resolvedAsset?.assignedTo || '—',
        employeeId: returnData.employeeId || '—',
        department: 'IT',
        position: 'Employee',
        location: returnData.location || resolvedAsset?.location || '—',
      },
      assets: [
        {
          assetTag,
          assetName,
          brand,
          model,
          serialNumber,
          condition,
          status: returnInspection.finalAssetStatus === 'maintenance' ? 'Under Maintenance' : 'Returned',
          qrValue: `https://itam.company.local/assets/${assetTag}`,
        },
      ],
      inspection: {
        inspectionDate: returnInspection.inspectionDate,
        inspectedBy: returnInspection.inspectedBy,
        overallCondition: returnInspection.overallCondition,
        physicalCondition: returnInspection.physicalCondition,
        functionalTest: returnInspection.functionalTest,
        accessoriesReturned: returnInspection.accessoriesReturned,
        missingAccessories: returnInspection.missingAccessories,
        requiresMaintenance: returnInspection.requiresMaintenance,
        maintenanceIssue: returnInspection.maintenanceIssue,
        dataWiped: returnInspection.dataWiped,
        finalAssetStatus: returnInspection.finalAssetStatus,
        inspectionRemarks: returnInspection.inspectionRemarks,
        employeeSignature: returnInspection.employeeSignature,
        itStaffSignature: returnInspection.itStaffSignature,
        returnedBy: returnInspection.returnedBy,
        receivedBy: returnInspection.receivedBy,
      },
    };
  }, [currentUser, returnData, returnInspection]);

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
      const assetTag = asset.assetTag || asset.tag || 'AW-0001';
      setPrintData({
        voucherNumber: `AW-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
        issueDate: today.toISOString(),
        printedBy: `${currentUser?.first_name ?? ''} ${currentUser?.last_name ?? ''}`.trim() || currentUser?.email || 'IT Asset Management System',
        employee: {
          name: assignedTo.trim(),
          employeeId: employeeId.trim(),
          department: employeeDepartment.trim() || 'IT',
          position: employeePosition.trim() || 'Employee',
          location: locationLabel,
        },
        assets: [{
          assetTag,
          assetName: asset.name,
          brand: asset.manufacturer || '—',
          model: asset.model || '—',
          serialNumber: asset.serialNumber || '—',
          condition: asset.condition ? asset.condition.charAt(0).toUpperCase() + asset.condition.slice(1) : 'Good',
          status: 'Assigned',
          qrValue: `https://itam.company.local/assets/${assetTag}`,
          specs: asset.specs,
        }],
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

  const handleQrReturn = (raw: string) => {
    const assetTag = extractAssetTag(raw);
    const scannedCandidates = parseQrScanPayload(raw);
    const matchedAsset = findAssetByScan(assets, raw);
    const assignment = assignments.find((item) => {
      if (!isActiveAssignmentStatus(item.status)) return false;
      if (matchedAsset && String(item.asset) === matchedAsset.id) return true;
      return scannedCandidates.some((candidate) =>
        candidate === item.asset_tag || candidate === String(item.asset)
      );
    });

    setReturnScannerOpen(false);

    if (!assignment) {
      toast.error(`No active assignment found for scanned asset ${assetTag}`);
      return;
    }

    setReturnData({
      assignmentId: assignment.id,
      assetId: String(assignment.asset),
      assetTag: assignment.asset_tag || assetTag,
      assetName: assignment.asset_name,
      employeeName: assignment.assignedTo,
      employeeId: assignment.employeeId,
      location: assignment.location,
      assignedDate: assignment.assigned_date,
    });
    setReturnInspection((current) => ({
      ...current,
      inspectionDate: format(new Date(), 'yyyy-MM-dd'),
      inspectedBy: current.inspectedBy || currentUserName,
      returnedBy: assignment.assignedTo || current.returnedBy,
      receivedBy: currentUserName,
      employeeSignature: current.employeeSignature,
      itStaffSignature: current.itStaffSignature || currentUserName,
    }));
  };

  const handleReturnAsset = async () => {
    if (!returnData) return;

    if (!returnInspection.inspectedBy.trim()) {
      toast.error('Please enter the inspector name');
      return;
    }

    if (!returnInspection.overallCondition.trim()) {
      toast.error('Please select the overall condition');
      return;
    }

    if (!returnInspection.finalAssetStatus) {
      toast.error('Please select the final asset status');
      return;
    }

    if (!returnInspection.itStaffSignature.trim()) {
      toast.error('Please capture the IT staff signature');
      return;
    }

    try {
      const inspectionInspector = returnInspection.inspectedBy.trim() || currentUserName;
      const inspectionReceiver = returnInspection.receivedBy.trim() || currentUserName;

      await returnAssetByTag({
        assetTag: returnData.assetTag,
        inspection: {
          inspectionDate: returnInspection.inspectionDate,
          inspectedBy: inspectionInspector,
          overallCondition: returnInspection.overallCondition,
          physicalCondition: returnInspection.physicalCondition.split(',').map((item) => item.trim()).filter(Boolean),
          functionalTest: returnInspection.functionalTest,
          accessoriesReturned: returnInspection.accessoriesReturned.split(',').map((item) => item.trim()).filter(Boolean),
          missingAccessories: returnInspection.missingAccessories,
          requiresMaintenance: returnInspection.requiresMaintenance,
          maintenanceIssue: returnInspection.maintenanceIssue,
          dataWiped: returnInspection.dataWiped,
          finalAssetStatus: returnInspection.finalAssetStatus,
          inspectionRemarks: returnInspection.inspectionRemarks,
          employeeSignature: returnInspection.employeeSignature,
          itStaffSignature: returnInspection.itStaffSignature,
          returnedBy: returnInspection.returnedBy,
          receivedBy: inspectionReceiver,
        },
      });

      const asset = assets.find((a) => a.id === returnData.assetId);
      const nextStatus = returnInspection.finalAssetStatus === 'maintenance' ? 'maintenance' : returnInspection.finalAssetStatus === 'retired' ? 'retired' : returnInspection.finalAssetStatus === 'disposed' ? 'disposed' : 'available';
      if (asset) {
        await updateAsset(asset.id, { status: nextStatus, assignedTo: '', employeeId: '' });
      }

      // Refresh assignments and assets
      await refetchAssignments();
      window.dispatchEvent(new Event('asset-buddy-assignments-changed'));

      log({
        assetId: returnData.assetId,
        assetName: returnData.assetName,
        type: 'returned',
        description: `${returnData.assetName} returned by ${returnData.employeeName} (${returnData.employeeId})`,
      });

      toast.success(`Asset ${returnData.assetTag} returned successfully`);
      setReturnData(null);
      setReturnInspection({
        inspectionDate: format(new Date(), 'yyyy-MM-dd'),
        inspectedBy: '',
        overallCondition: 'good',
        physicalCondition: '',
        functionalTest: 'passed',
        accessoriesReturned: '',
        missingAccessories: '',
        requiresMaintenance: false,
        maintenanceIssue: '',
        dataWiped: 'yes',
        finalAssetStatus: 'available',
        inspectionRemarks: '',
        employeeSignature: '',
        itStaffSignature: '',
        returnedBy: '',
        receivedBy: '',
      });
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
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
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
                  <Label htmlFor="employee-department">Department</Label>
                  <Input
                    id="employee-department"
                    value={employeeDepartment}
                    onChange={(e) => setEmployeeDepartment(e.target.value)}
                    placeholder="e.g. IT"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="employee-position">Position</Label>
                  <Input
                    id="employee-position"
                    value={employeePosition}
                    onChange={(e) => setEmployeePosition(e.target.value)}
                    placeholder="e.g. System Administrator"
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
              <DialogFooter className="sticky bottom-0 bg-white py-3 flex justify-end gap-2 border-t border-border">
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
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Allocated Assets ({filteredAssignments.length})</CardTitle>
            <div className="w-full md:w-80">
              <Input
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No assignment records yet. Create an assignment to get started.
              </p>
            ) : filteredAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No assignments found for “{searchQuery}”.
              </p>
            ) : (
              <div className="space-y-2">
                {filteredAssignments.map((assignment) => (
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
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                              aria-label={`Open actions for ${assignment.asset_name}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem
                              className="gap-2"
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
                                  setReturnInspection((current) => ({
                                    ...current,
                                    inspectionDate: format(new Date(), 'yyyy-MM-dd'),
                                    inspectedBy: current.inspectedBy || currentUserName,
                                    returnedBy: assignment.assignedTo || current.returnedBy,
                                    receivedBy: currentUserName,
                                    employeeSignature: current.employeeSignature,
                                    itStaffSignature: current.itStaffSignature || currentUserName,
                                  }));
                                }
                              }}
                            >
                              <UserCheck className="h-4 w-4" />
                              Return
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                const asset = assets.find((a) => a.id === String(assignment.asset));
                                const assetTag = assignment.asset_tag || asset?.assetTag || asset?.tag || '—';
                                const assetName = assignment.asset_name || asset?.name || '—';
                                const brand = assignment.asset_manufacturer || assignment.manufacturer || asset?.manufacturer || '—';
                                const model = assignment.asset_model || assignment.model || asset?.model || '—';
                                const serialNumber = assignment.asset_serial_number || assignment.serialNumber || asset?.serialNumber || '—';
                                const conditionValue = assignment.asset_condition || asset?.condition;
                                const condition = conditionValue
                                  ? conditionValue.charAt(0).toUpperCase() + conditionValue.slice(1)
                                  : 'Good';

                                const employeeAssignments = activeAssignments.filter((item) =>
                                  (item.assignedTo || '').trim().toLowerCase() === (assignment.assignedTo || '').trim().toLowerCase()
                                );
                                const voucherData = buildIssueVoucherDataFromAssignments({
                                  employeeName: assignment.assignedTo || 'Unknown',
                                  employeeId: assignment.employeeId || '—',
                                  department: assignment.employeeDepartment || 'IT',
                                  position: assignment.employeePosition || 'Employee',
                                  location: assignment.location || '—',
                                  printedBy: `${currentUser?.first_name ?? ''} ${currentUser?.last_name ?? ''}`.trim() || currentUser?.email || 'IT Asset Management System',
                                  assignments: employeeAssignments,
                                  assets: assets.map((item) => ({
                                    id: item.id,
                                    name: item.name,
                                    assetTag: item.assetTag || item.tag,
                                    tag: item.tag,
                                    manufacturer: item.manufacturer,
                                    model: item.model,
                                    serialNumber: item.serialNumber,
                                    condition: item.condition,
                                    category: item.category,
                                    specs: item.specs,
                                  })),
                                });
                                setPrintData(voucherData);
                              }}
                            >
                              <Printer className="h-4 w-4" />
                              Print Agreement
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
              <div className="space-y-4 py-4">
                <div className="rounded-xl border border-border bg-muted/30 p-2">
                  <iframe
                    title="ICT equipment issue voucher preview"
                    srcDoc={buildIssueVoucherPages(printData, `${window.location.origin}/awash%20wine%20logo.png`)[0]?.html ?? ''}
                    className="h-[70vh] w-full rounded-lg border border-border bg-white"
                  />
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button variant="outline" onClick={() => setPrintData(null)}>Close</Button>
                  <Button
                    onClick={() => {
                      const voucherPages = buildIssueVoucherPages(printData, `${window.location.origin}/awash%20wine%20logo.png`);
                      const printWindow = window.open('', '_blank');
                      if (!printWindow) return;

                      const printBody = voucherPages
                        .map((page) => page.html.replace(/<!DOCTYPE html><html[^>]*><head>[\s\S]*?<body>/i, '').replace(/<\/body><\/html>/i, ''))
                        .join('<div style="page-break-after: always;"></div>');

                      const printHtml = `<!DOCTYPE html><html><head><title>ICT Equipment Issue Voucher</title><style>@page{size:A4 portrait;margin:12mm}body{margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#fff;color:#111827}img{max-width:100%;display:block;} .voucher-asset{max-width:100%;height:auto;} .qr-img{image-rendering:crisp-edges;}</style></head><body>${printBody}<script>window.addEventListener('load',function(){const assets=Array.from(document.querySelectorAll('.voucher-asset'));const isReady=()=>assets.every((img)=>img.tagName!=='IMG'||(img.complete&&img.naturalWidth!==0));if(assets.length===0){window.print();return;}assets.forEach((img)=>{if(img.tagName==='IMG'&&!img.complete){img.addEventListener('load',isReady);img.addEventListener('error',isReady);}});setTimeout(isReady,1200);});</script></body></html>`;
                      printWindow.document.write(printHtml);
                      printWindow.document.close();
                      printWindow.focus();
                    }}
                    className="gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print Voucher
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>

        <Dialog open={Boolean(returnData)} onOpenChange={(open) => { if (!open) { setReturnData(null); setReturnInspection({
          inspectionDate: format(new Date(), 'yyyy-MM-dd'),
          inspectedBy: '',
          overallCondition: 'good',
          physicalCondition: '',
          functionalTest: 'passed',
          accessoriesReturned: '',
          missingAccessories: '',
          requiresMaintenance: false,
          maintenanceIssue: '',
          dataWiped: 'yes',
          finalAssetStatus: 'available',
          inspectionRemarks: '',
          employeeSignature: '',
          itStaffSignature: '',
          returnedBy: '',
          receivedBy: '',
        }); } }}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Asset Return Agreement</DialogTitle>
              <DialogDescription>
                Review the return details and print the asset return confirmation.
              </DialogDescription>
            </DialogHeader>
            {returnData ? (
              <div className="space-y-4 py-4">
                <div className="grid gap-3 rounded-xl border border-border bg-muted/30 p-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="inspection-date">Inspection Date</Label>
                      <Input id="inspection-date" type="date" value={returnInspection.inspectionDate} onChange={(e) => setReturnInspection((current) => ({ ...current, inspectionDate: e.target.value }))} />
                    </div>
                    <div>
                      <Label htmlFor="inspected-by">Inspected By</Label>
                      <Input id="inspected-by" value={returnInspection.inspectedBy} onChange={(e) => setReturnInspection((current) => ({ ...current, inspectedBy: e.target.value }))} placeholder="IT staff name" />
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="overall-condition">Overall Condition</Label>
                      <Select value={returnInspection.overallCondition} onValueChange={(value) => setReturnInspection((current) => ({ ...current, overallCondition: value }))}>
                        <SelectTrigger><SelectValue placeholder="Condition" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="damaged">Damaged</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="final-status">Final Asset Status</Label>
                      <Select value={returnInspection.finalAssetStatus} onValueChange={(value) => setReturnInspection((current) => ({ ...current, finalAssetStatus: value }))}>
                        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="maintenance">Under Maintenance</SelectItem>
                          <SelectItem value="retired">Retired</SelectItem>
                          <SelectItem value="disposed">Disposed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="physical-condition">Physical Condition</Label>
                      <Input id="physical-condition" value={returnInspection.physicalCondition} onChange={(e) => setReturnInspection((current) => ({ ...current, physicalCondition: e.target.value }))} placeholder="Scratches, missing cover" />
                    </div>
                    <div>
                      <Label htmlFor="functional-test">Functional Test</Label>
                      <Input id="functional-test" value={returnInspection.functionalTest} onChange={(e) => setReturnInspection((current) => ({ ...current, functionalTest: e.target.value }))} placeholder="passed / failed" />
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="accessories-returned">Accessories Returned</Label>
                      <Input id="accessories-returned" value={returnInspection.accessoriesReturned} onChange={(e) => setReturnInspection((current) => ({ ...current, accessoriesReturned: e.target.value }))} placeholder="Charger, mouse" />
                    </div>
                    <div>
                      <Label htmlFor="missing-accessories">Missing Accessories</Label>
                      <Input id="missing-accessories" value={returnInspection.missingAccessories} onChange={(e) => setReturnInspection((current) => ({ ...current, missingAccessories: e.target.value }))} placeholder="Optional" />
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="maintenance-issue">Maintenance Issue</Label>
                      <Input id="maintenance-issue" value={returnInspection.maintenanceIssue} onChange={(e) => setReturnInspection((current) => ({ ...current, maintenanceIssue: e.target.value }))} placeholder="Optional" />
                    </div>
                    <div>
                      <Label htmlFor="data-wiped">Data Wiped</Label>
                      <Input id="data-wiped" value={returnInspection.dataWiped} onChange={(e) => setReturnInspection((current) => ({ ...current, dataWiped: e.target.value }))} placeholder="yes / no" />
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="returned-by">Returned By</Label>
                      <Input id="returned-by" value={returnInspection.returnedBy} onChange={(e) => setReturnInspection((current) => ({ ...current, returnedBy: e.target.value }))} placeholder="Employee" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="inspection-remarks">Inspection Remarks</Label>
                    <Textarea id="inspection-remarks" value={returnInspection.inspectionRemarks} onChange={(e) => setReturnInspection((current) => ({ ...current, inspectionRemarks: e.target.value }))} rows={3} placeholder="Notes about defects, accessories, or follow-up" />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input type="checkbox" checked={returnInspection.requiresMaintenance} onChange={(e) => setReturnInspection((current) => ({ ...current, requiresMaintenance: e.target.checked }))} />
                    Requires maintenance / follow-up
                  </label>
                </div>
                {!canPrintReturnVoucher ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                    Complete the inspection details to enable the return voucher print preview.
                  </div>
                ) : null}
                <div className="rounded-xl border border-border bg-muted/30 p-2">
                  <iframe
                    title="IT equipment return voucher preview"
                    srcDoc={canPrintReturnVoucher ? buildReturnVoucherPages(buildReturnVoucherPreviewData, `${window.location.origin}/awash%20wine%20logo.png`)[0]?.html ?? '' : ''}
                    className="h-[70vh] w-full rounded-lg border border-border bg-white"
                  />
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button variant="outline" onClick={() => setReturnData(null)}>Close without Printing</Button>
                  {canPrintReturnVoucher ? (
                    <Button
                      onClick={() => {
                        const voucherPages = buildReturnVoucherPages(buildReturnVoucherPreviewData, `${window.location.origin}/awash%20wine%20logo.png`);
                        const printWindow = window.open('', '_blank');
                        if (!printWindow) return;

                        const printBody = voucherPages
                          .map((page) => page.html.replace(/<!DOCTYPE html><html[^>]*><head>[\s\S]*?<body>/i, '').replace(/<\/body><\/html>/i, ''))
                          .join('<div style="page-break-after: always;"></div>');

                        const printHtml = `<!DOCTYPE html><html><head><title>IT Equipment Return Voucher</title><style>@page{size:A4 portrait;margin:12mm}body{margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#fff;color:#111827}img{max-width:100%;display:block;} .voucher-asset{max-width:100%;height:auto;} .qr-img{image-rendering:crisp-edges;}</style></head><body>${printBody}<script>window.addEventListener('load',function(){setTimeout(function(){window.print();}, 400);});</script></body></html>`;
                        printWindow.document.write(printHtml);
                        printWindow.document.close();
                        printWindow.focus();
                      }}
                      className="gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      Print Return Voucher
                    </Button>
                  ) : null}
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