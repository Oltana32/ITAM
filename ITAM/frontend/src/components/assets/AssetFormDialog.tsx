import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { authFetch } from '@/lib/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Asset, AssetCategory, AssetStatus, categoryLabels, statusLabels } from '@/types/asset';
import { CATEGORY_SPECS, getSpecsForCategory } from '@/data/assetSpecs';

const conditionLabels: Record<string, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  poor: 'Poor',
};

// Build dynamic specs schema
const specsSchemaRecord: Record<string, z.ZodTypeAny> = {};
Object.values(CATEGORY_SPECS).forEach((categorySpecs) => {
  Object.entries(categorySpecs.fields).forEach(([fieldName, fieldConfig]) => {
    specsSchemaRecord[fieldName] = z.string().optional();
  });
});

const assetFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  category: z.enum(['laptop', 'desktop', 'monitor', 'server', 'phone', 'tablet', 'network', 'equipment', 'other']),
  status: z.enum(['available', 'assigned', 'in-use', 'ready', 'maintenance', 'retired', 'disposed', 'lost', 'damaged']),
  purchaseDate: z.date(),
  purchaseCost: z.string().optional(),
  warrantyExpiry: z.date().optional(),
  manufacturer: z.string().min(1, 'Manufacturer is required').max(100),
  model: z.string().min(1, 'Model is required').max(100),
  serialNumber: z.string().min(1, 'Serial number is required').max(100),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
  department: z.string().optional(),
  notes: z.string().max(500).optional(),
  specs: z.record(z.string().optional()).optional(),
});

type AssetFormValues = z.infer<typeof assetFormSchema>;

interface AssetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset?: Asset | null;
  onSubmit: (data: AssetFormValues) => Promise<void> | void;
}

export function AssetFormDialog({ open, onOpenChange, asset, onSubmit }: AssetFormDialogProps) {
  const isEditing = !!asset;
  const [manufacturers, setManufacturers] = useState<string[]>([]);
  const [generatedTag, setGeneratedTag] = useState<string>('');
  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      name: '',
      category: 'laptop',
      status: 'available',
      purchaseDate: new Date(),
      manufacturer: '',
      model: '',
      serialNumber: '',
      condition: 'good',
      department: '',
      purchaseCost: '',
      notes: '',
      specs: {},
    },
  });

  const selectedCategory = form.watch('category') as AssetCategory;
  const categorySpecs = getSpecsForCategory(selectedCategory);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (asset) {
      form.reset({
        name: asset.name,
        category: asset.category,
        status: asset.status as AssetStatus,
        purchaseDate: new Date(asset.purchaseDate),
        purchaseCost: asset.purchaseCost ? String(asset.purchaseCost) : '',
        warrantyExpiry: asset.warrantyExpiry ? new Date(asset.warrantyExpiry) : undefined,
        manufacturer: asset.manufacturer,
        model: asset.model,
        serialNumber: asset.serialNumber,
        condition: 'good',
        department: asset.department || '',
        notes: asset.notes || '',
        specs: asset.specs || {},
      });
      setGeneratedTag(asset.tag || asset.assetTag || '');
    } else {
      form.reset({
        name: '',
        category: 'laptop',
        status: 'available',
        manufacturer: '',
        model: '',
        serialNumber: '',
        purchaseDate: new Date(),
        condition: 'good',
        department: '',
        purchaseCost: '',
        notes: '',
        specs: {},
      });
      setGeneratedTag('');
    }
  }, [asset, form]);

  // Reset specs when category changes
  useEffect(() => {
    form.setValue('specs', {});
  }, [selectedCategory, form]);

  const handleSubmit = async (data: AssetFormValues) => {
    try {
      await onSubmit(data);
      onOpenChange(false);
    } catch {
      // Keep dialog open so the user can fix validation/API errors.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEditing ? 'Edit Asset' : 'Add New Asset'}
          </DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the asset details below.' : 'Fill in the details to add a new asset.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Name</FormLabel>
                    <FormControl>
                      <Input placeholder="MacBook Pro 16&quot;" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {(generatedTag || !isEditing) && (
                <FormItem>
                  <FormLabel>Asset Tag</FormLabel>
                  <div className="px-3 py-2 border rounded-md bg-muted text-sm font-mono">
                    {generatedTag || 'AW-CAT-0001 (auto-generated on save)'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isEditing ? 'Auto-generated on creation' : 'Assigned automatically by the backend when saved'}
                  </p>
                </FormItem>
              )}

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="manufacturer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Apple"
                        {...field}
                        list="manufacturer-list"
                      />
                    </FormControl>
                    {manufacturers.length > 0 && (
                      <datalist id="manufacturer-list">
                        {manufacturers.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="MacBook Pro 16&quot; M3 Pro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial Number</FormLabel>
                    <FormControl>
                      <Input placeholder="C02X1234ABCD" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchaseCost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Cost (ETB)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" placeholder="125000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="IT, Finance…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="warrantyExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warranty Expiry (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="condition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Condition</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(conditionLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Dynamic Category Specifications */}
            {categorySpecs && Object.keys(categorySpecs.fields).length > 0 && (
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-4">{categorySpecs.label}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(categorySpecs.fields).map(([fieldKey, fieldConfig]) => (
                    <FormField
                      key={fieldKey}
                      control={form.control}
                      name={`specs.${fieldKey}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{fieldConfig.label}</FormLabel>
                          {fieldConfig.type === 'select' && fieldConfig.options ? (
                            <Select onValueChange={field.onChange} value={field.value || ''}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={`Select ${fieldConfig.label.toLowerCase()}`} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {fieldConfig.options.map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <FormControl>
                              <Input
                                placeholder={fieldConfig.placeholder || `Enter ${fieldConfig.label.toLowerCase()}`}
                                {...field}
                              />
                            </FormControl>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any additional information about this asset..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="min-w-[100px]">
                {isEditing ? 'Save Changes' : 'Add Asset'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
