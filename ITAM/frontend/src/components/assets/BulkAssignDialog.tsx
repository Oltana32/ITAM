import { useState } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
// Input and Label already imported above
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth';
import { Asset, categoryLabels, AssetCategory } from '@/types/asset';
import { useAssignments } from '@/hooks/useAssignmentsQuery';
import { useLocations } from '@/hooks/useLocations';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BulkAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAssets: Asset[];
  onAssignComplete?: () => void;
}

export function BulkAssignDialog({ open, onOpenChange, selectedAssets, onAssignComplete }: BulkAssignDialogProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignResult, setAssignResult] = useState<any>(null);
  const [formData, setFormData] = useState({
    assigned_to_name: '',
    employee_id: '',
    department: '',
    position: '',
    location: '',
    expected_return_date: '',
  });
  const { createAssignment, isCreatingAssignment } = useAssignments();
  const { locations } = useLocations();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAssign = async () => {
    if (!formData.assigned_to_name || !formData.employee_id) {
      toast.error('Please fill in Name and Employee ID');
      return;
    }
    // If single asset selected, create a regular assignment using assignments API
    if (selectedAssets.length === 1) {
      setIsAssigning(true);
      try {
        const asset = selectedAssets[0];
        const today = new Date();
        const assigned_date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const locationLabel = formData.location || (locations.find(l => l.id === asset.location)?.name || asset.location || 'Unassigned');

        await createAssignment({
          asset: Number(asset.id),
          assigned_date,
          status: 'assigned',
          notes: `Assigned ${asset.name} via Assets page`,
          assignedTo: formData.assigned_to_name,
          employeeId: formData.employee_id,
          department: formData.department,
          
          location: locationLabel,
          expectedReturnDate: formData.expected_return_date || null,
        });

        toast.success('Assignment saved');
        setAssignResult({ summary: { created: 1, failed: 0 }, created: [], errors: [] });
        if (onAssignComplete) onAssignComplete();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      } finally {
        setIsAssigning(false);
      }
      return;
    }

    // Bulk assign fallback
    setIsAssigning(true);
    try {
      const payload = {
        asset_ids: selectedAssets.map(a => parseInt(a.id)),
        assigned_to_name: formData.assigned_to_name,
        employee_id: formData.employee_id,
        department: formData.department,
        
        location: formData.location,
        expected_return_date: formData.expected_return_date || null,
      };

      const res = await authFetch('/api/assignments/bulk-assign/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Assignment failed');
      }

      const result = await res.json();
      setAssignResult(result);
      toast.success(`${result.summary.created} assets assigned successfully`);
      
      if (result.summary.failed > 0) {
        toast.warning(`${result.summary.failed} assets could not be assigned`);
      }

      if (onAssignComplete) {
        onAssignComplete();
      }
    } catch (err) {
      toast.error(String(err));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClose = () => {
    setFormData({
      assigned_to_name: '',
      employee_id: '',
      department: '',
      position: '',
      location: '',
      expected_return_date: '',
    });
    setAssignResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{selectedAssets.length === 1 ? 'Assign Asset' : 'Bulk Assign Assets'}</DialogTitle>
          <DialogDescription>
            Assign {selectedAssets.length} selected asset{selectedAssets.length !== 1 ? 's' : ''} to an assignee.
          </DialogDescription>
        </DialogHeader>

        {!assignResult ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <span className="font-medium">{selectedAssets.length}</span> asset{selectedAssets.length !== 1 ? 's' : ''} selected
              </p>
              <div className="mt-2 max-h-32 overflow-y-auto">
                {selectedAssets.map(asset => (
                  <p key={asset.id} className="text-xs text-blue-800">
                    • {asset.name} ({asset.assetTag})
                  </p>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {selectedAssets.length === 1 && (
                <>
                  <div className="space-y-2 col-span-2">
                    <Label>Asset Category</Label>
                    <Select value={selectedAssets[0].category as AssetCategory} onValueChange={() => {}}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label>Available Asset</Label>
                    <Select value={selectedAssets[0].id} onValueChange={() => {}}>
                      <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={selectedAssets[0].id}>{selectedAssets[0].name} ({selectedAssets[0].assetTag})</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="space-y-2 col-span-2">
                <Label htmlFor="assigned_to_name">Assigned To *</Label>
                <Input
                  id="assigned_to_name"
                  name="assigned_to_name"
                  placeholder="e.g., Jane Doe"
                  value={formData.assigned_to_name}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  name="department"
                  placeholder="e.g., Finance"
                  value={formData.department}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  name="position"
                  placeholder="e.g. System Administrator"
                  value={formData.position}
                  onChange={handleChange}
                />
              </div>


              {selectedAssets.length === 1 ? (
                <>
                  <div className="space-y-2 col-span-2">
                    <Label>Asset</Label>
                    <Input value={`${selectedAssets[0].name} (${selectedAssets[0].assetTag})`} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Select value={formData.location} onValueChange={(v) => setFormData({ ...formData, location: v })}>
                      <SelectTrigger className="h-9 w-[240px] text-sm"><SelectValue placeholder={selectedAssets[0].location || 'Select location'} /></SelectTrigger>
                      <SelectContent>
                        {locations.map((l) => (
                          <SelectItem key={l.id} value={l.name}>{l.name} - {l.city}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">IT Stock location cannot be selected for assignments</p>
                  </div>
                </>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="e.g., HQ - 3rd Floor"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="employee_id">Employee ID</Label>
                <Input
                  id="employee_id"
                  name="employee_id"
                  placeholder="e.g., E-1023"
                  value={formData.employee_id}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expected_return_date">Given Date</Label>
                <Input
                  id="expected_return_date"
                  name="expected_return_date"
                  type="date"
                  value={formData.expected_return_date}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-medium text-green-900">
                ✓ {assignResult.summary.created} asset{assignResult.summary.created !== 1 ? 's' : ''} assigned
              </p>
              {assignResult.summary.failed > 0 && (
                <p className="text-sm text-yellow-700 mt-1">
                  ⚠ {assignResult.summary.failed} asset{assignResult.summary.failed !== 1 ? 's' : ''} could not be assigned
                </p>
              )}
            </div>

            {assignResult.created.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Assigned Assets:</h3>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-3 bg-muted/50">
                  {assignResult.created.map((item: any) => (
                    <div key={item.id} className="text-sm py-1 border-b last:border-0">
                      Asset ID {item.asset_id} → {item.assigned_to}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {assignResult.errors.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-destructive">Failed Assignments:</h3>
                <div className="max-h-48 overflow-y-auto border border-destructive/30 rounded-lg p-3 bg-destructive/5">
                  {assignResult.errors.map((item: any, idx: number) => (
                    <div key={idx} className="text-sm py-1 border-b border-destructive/20 last:border-0">
                      <p className="text-destructive">
                        Asset ID {item.asset_id}: {item.error}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="sticky bottom-0 bg-white py-3 flex justify-end gap-2 border-t border-border">
          {!assignResult ? (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleAssign} disabled={!formData.assigned_to_name || !formData.employee_id || isAssigning || isCreatingAssignment}>
                {(isAssigning || isCreatingAssignment) ? 'Saving…' : (selectedAssets.length === 1 ? 'Save & Print Agreement' : 'Assign')}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
