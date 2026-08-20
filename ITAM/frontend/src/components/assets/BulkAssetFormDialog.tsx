import { useMemo, useState, useEffect } from 'react';
import { Plus, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAssets } from '@/hooks/useAssets';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { authFetch } from '@/lib/auth';
import { getVisibleAssetStatusOptions } from '@/components/assets/bulkAssetFormUtils';
import { statusLabels, categoryLabels, conditionLabels } from '@/types/asset';
import { CATEGORY_SPECS, getSpecsForCategory } from '@/data/assetSpecs';

interface BulkAssetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: Record<string, unknown>;
}

interface DraftAsset {
  name: string;
  category: string;
  status: string;
  purchaseDate: Date;
  purchaseCost: string;
  warrantyExpiry?: Date;
  manufacturer: string;
  model: string;
  serialNumber: string;
  condition: string;
  department: string;
  notes: string;
  specs: Record<string, string | number | undefined>;
}

const emptyDraft = (initialValues?: Record<string, unknown>): DraftAsset => ({
  name: String(initialValues?.name ?? ''),
  category: String(initialValues?.category ?? 'laptop'),
  status: String(initialValues?.status ?? 'available'),
  purchaseDate: initialValues?.purchaseDate instanceof Date ? initialValues.purchaseDate : new Date(),
  purchaseCost: String(initialValues?.purchaseCost ?? ''),
  warrantyExpiry: initialValues?.warrantyExpiry instanceof Date ? initialValues.warrantyExpiry : undefined,
  manufacturer: String(initialValues?.manufacturer ?? ''),
  model: String(initialValues?.model ?? ''),
  serialNumber: String(initialValues?.serialNumber ?? ''),
  condition: String(initialValues?.condition ?? 'good'),
  department: String(initialValues?.department ?? ''),
  notes: String(initialValues?.notes ?? ''),
  specs: (initialValues?.specs as Record<string, string | number | undefined>) ?? {},
});

export function BulkAssetFormDialog({ open, onOpenChange, initialValues }: BulkAssetFormDialogProps) {
  const { addAsset } = useAssets();
  const [drafts, setDrafts] = useState<DraftAsset[]>([emptyDraft(initialValues)]);
  const [templateDraft, setTemplateDraft] = useState<DraftAsset>(emptyDraft(initialValues));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manufacturers, setManufacturers] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;

    const loadManufacturers = async () => {
      try {
        const response = await authFetch('/api/manufacturers/?ordering=name');
        if (!response.ok) throw new Error('Failed to load manufacturers');
        const payload = await response.json();
        const items = (Array.isArray(payload) ? payload : payload.results ?? []) as Array<{ id: number; name: string }>;
        setManufacturers(items.map((item) => item.name));
      } catch {
        setManufacturers([]);
      }
    };

    loadManufacturers();
  }, [open]);

  useEffect(() => {
    if (open) {
      const nextTemplate = emptyDraft(initialValues);
      setDrafts([nextTemplate]);
      setTemplateDraft(nextTemplate);
    }
  }, [open, initialValues]);

  const reset = () => {
    const nextTemplate = emptyDraft(initialValues);
    setDrafts([nextTemplate]);
    setTemplateDraft(nextTemplate);
    setIsSubmitting(false);
  };

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) reset();
  };

  const updateDraft = (index: number, patch: Partial<DraftAsset>) => {
    setDrafts((current) => current.map((draft, draftIndex) => (draftIndex === index ? { ...draft, ...patch } : draft)));
  };

  const addAnother = () => {
    setDrafts((current) => {
      const previous = current[current.length - 1] ?? templateDraft;
      return [...current, { ...previous, serialNumber: '' }];
    });
  };

  const removeDraft = (index: number) => {
    setDrafts((current) => {
      const next = current.filter((_, draftIndex) => draftIndex !== index);
      return next.length > 0 ? next : [emptyDraft(initialValues)];
    });
  };

  const handleSubmit = async (index: number) => {
    const draft = drafts[index];
    if (!draft.serialNumber.trim()) {
      toast.error('Serial number is required for every asset');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...draft,
        purchaseDate: format(draft.purchaseDate, 'yyyy-MM-dd'),
        purchaseCost: draft.purchaseCost || undefined,
        warrantyExpiry: draft.warrantyExpiry ? format(draft.warrantyExpiry, 'yyyy-MM-dd') : undefined,
        notes: draft.notes || undefined,
      };

      await addAsset({
        ...payload,
        location: 'Unassigned',
        assignedTo: undefined,
      } as any);

      setTemplateDraft({ ...draft, serialNumber: draft.serialNumber.trim() });
      setDrafts((current) => {
        const next = [...current];
        next[index] = { ...emptyDraft(initialValues), serialNumber: '' };
        return next;
      });
      toast.success(`Asset ${draft.serialNumber} added`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add asset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitLabel = useMemo(() => (drafts.length > 1 ? 'Save all entries' : 'Save asset'), [drafts.length]);
  const activeCategory = drafts[0]?.category || 'laptop';
  const categorySpecs = getSpecsForCategory(activeCategory as keyof typeof CATEGORY_SPECS);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Asset Entry</DialogTitle>
          <DialogDescription>
            Fill the first asset form completely, then add another asset and only enter the serial number to reuse the previous values.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {drafts.map((draft, index) => {
            const isFirst = index === 0;
            return (
              <div key={`${index}-${draft.serialNumber}`} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Asset {index + 1}</div>
                  {!isFirst && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeDraft(index)}>
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Asset Name</span>
                    <input
                      value={draft.name}
                      onChange={(event) => updateDraft(index, { name: event.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder={'MacBook Pro 16"'}
                      disabled={!isFirst}
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Asset Tag</span>
                    <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm font-mono">
                      {isFirst ? 'Auto-generated on save' : 'Uses the first form values'}
                    </div>
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Category</span>
                    <select
                      value={draft.category}
                      onChange={(event) => updateDraft(index, { category: event.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      disabled={!isFirst}
                    >
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Status</span>
                    <select
                      value={draft.status}
                      onChange={(event) => updateDraft(index, { status: event.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      disabled={!isFirst}
                    >
                      {getVisibleAssetStatusOptions(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Manufacturer</span>
                    <input
                      value={draft.manufacturer}
                      onChange={(event) => updateDraft(index, { manufacturer: event.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Apple"
                      disabled={!isFirst}
                      list="bulk-manufacturer-list"
                    />
                    {manufacturers.length > 0 && (
                      <datalist id="bulk-manufacturer-list">
                        {manufacturers.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    )}
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Model</span>
                    <input
                      value={draft.model}
                      onChange={(event) => updateDraft(index, { model: event.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder={'MacBook Pro 16" M3 Pro'}
                      disabled={!isFirst}
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Serial Number</span>
                    <input
                      value={draft.serialNumber}
                      onChange={(event) => updateDraft(index, { serialNumber: event.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Required"
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Purchase Date</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
                            !draft.purchaseDate && 'text-muted-foreground'
                          )}
                          disabled={!isFirst}
                        >
                          {draft.purchaseDate ? format(draft.purchaseDate, 'PPP') : 'Pick a date'}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={draft.purchaseDate}
                          onSelect={(date) => updateDraft(index, { purchaseDate: date ?? new Date() })}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Purchase Cost (ETB)</span>
                    <input
                      type="number"
                      value={draft.purchaseCost}
                      onChange={(event) => updateDraft(index, { purchaseCost: event.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="125000"
                      disabled={!isFirst}
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Department (Optional)</span>
                    <input
                      value={draft.department}
                      onChange={(event) => updateDraft(index, { department: event.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="IT"
                      disabled={!isFirst}
                    />
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Warranty Expiry (Optional)</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
                            !draft.warrantyExpiry && 'text-muted-foreground'
                          )}
                          disabled={!isFirst}
                        >
                          {draft.warrantyExpiry ? format(draft.warrantyExpiry, 'PPP') : 'Pick a date'}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={draft.warrantyExpiry}
                          onSelect={(date) => updateDraft(index, { warrantyExpiry: date })}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </label>

                  <label className="space-y-1 text-sm">
                    <span className="font-medium">Condition</span>
                    <select
                      value={draft.condition}
                      onChange={(event) => updateDraft(index, { condition: event.target.value })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      disabled={!isFirst}
                    >
                      {Object.entries(conditionLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {categorySpecs && Object.keys(categorySpecs.fields).length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="text-sm font-semibold mb-4">{categorySpecs.label}</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {Object.entries(categorySpecs.fields).map(([fieldKey, fieldConfig]) => (
                        <label key={fieldKey} className="space-y-1 text-sm">
                          <span className="font-medium">{fieldConfig.label}</span>
                          {fieldConfig.type === 'select' && fieldConfig.options ? (
                            <select
                              value={String((draft.specs?.[fieldKey] as string | number | undefined) ?? '')}
                              onChange={(event) => updateDraft(index, { specs: { ...(draft.specs ?? {}), [fieldKey]: event.target.value } })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              disabled={!isFirst}
                            >
                              {fieldConfig.options.map((option) => (
                                <option key={option} value={option}>{option}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              value={String((draft.specs?.[fieldKey] as string | number | undefined) ?? '')}
                              onChange={(event) => updateDraft(index, { specs: { ...(draft.specs ?? {}), [fieldKey]: event.target.value } })}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              placeholder={fieldConfig.placeholder || `Enter ${fieldConfig.label.toLowerCase()}`}
                              disabled={!isFirst}
                            />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <label className="space-y-1 text-sm">
                  <span className="font-medium">Notes</span>
                  <textarea
                    value={draft.notes}
                    onChange={(event) => updateDraft(index, { notes: event.target.value })}
                    className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    placeholder="Additional notes"
                    disabled={!isFirst}
                  />
                </label>

                <div className="flex justify-end">
                  <Button type="button" onClick={() => handleSubmit(index)} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : `Save Asset ${index + 1}`}
                  </Button>
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between border-t pt-4">
            <Button type="button" variant="outline" onClick={addAnother}>
              <Plus className="mr-2 h-4 w-4" />
              Add another asset
            </Button>
            <Button type="button" variant="ghost" onClick={() => handleClose(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
