import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Package, ScanLine } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { AssetTable } from '@/components/assets/AssetTable';
import { AssetFilters } from '@/components/assets/AssetFilters';
import { AssetFormDialog } from '@/components/assets/AssetFormDialog';
import { AssetDetailDialog } from '@/components/assets/AssetDetailDialog';
import { DeleteAssetDialog } from '@/components/assets/DeleteAssetDialog';
import { QrScannerDialog } from '@/components/assets/QrScannerDialog';
import { QrCodeDialog } from '@/components/assets/QrCodeDialog';
import { Button } from '@/components/ui/button';
import { useAssets } from '@/hooks/useAssets';
import { useActivityLog } from '@/hooks/useActivityLog';
import { BulkActionsBar } from '@/components/assets/BulkActionsBar';
import { Asset, AssetStatus, AssetCategory, categoryLabels } from '@/types/asset';
import { exportToCSV, exportToJSON } from '@/lib/exportAssets';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { getCurrentUserRole, UserRole } from '@/lib/authRole';
import { findAssetByScan } from '@/lib/parseQrScan';

export default function Assets() {
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get('category') as AssetCategory | null;

  const { assets, addAsset, updateAsset, deleteAsset } = useAssets();
  const { log } = useActivityLog();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<AssetCategory | 'all'>(
    categoryFromUrl || 'all'
  );

  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [qrCodeOpen, setQrCodeOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [role, setRole] = useState<UserRole>(getCurrentUserRole());

  useEffect(() => {
    const onRoleChanged = () => setRole(getCurrentUserRole());
    window.addEventListener('asset-buddy-role-changed', onRoleChanged);
    return () => window.removeEventListener('asset-buddy-role-changed', onRoleChanged);
  }, []);

  const canDelete = role === 'admin';

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const term = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        [asset.name, asset.assetTag, asset.serialNumber].some((value) =>
          String(value || '').toLowerCase().includes(term)
        );

      const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [assets, searchQuery, statusFilter, categoryFilter]);

  const pageTitle =
    categoryFilter !== 'all' ? categoryLabels[categoryFilter] : 'All Assets';

  const handleAddAsset = () => {
    setSelectedAsset(null);
    setFormDialogOpen(true);
  };

  const handleViewAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setDetailDialogOpen(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setDetailDialogOpen(false);
    setFormDialogOpen(true);
  };

  const handleDeleteAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setDetailDialogOpen(false);
    setDeleteDialogOpen(true);
  };

  const handleShowQr = (asset: Asset) => {
    setSelectedAsset(asset);
    setQrCodeOpen(true);
  };

  const handleScanResult = (result: string) => {
    const found = findAssetByScan(assets, result);
    if (found) {
      setSelectedAsset(found);
      setQrCodeOpen(false);
      setDetailDialogOpen(true);
      log({ assetId: found.id, assetName: found.name, type: 'scanned', description: `Scanned QR for "${found.name}"` });
      toast.success('Asset found!', { description: found.name });
      return;
    }
    toast.error('Asset not found', {
      description: `No asset matches scan payload`,
    });
  };

  const handleFormSubmit = async (data: any) => {
    const formattedData = {
      ...data,
      purchaseDate: format(data.purchaseDate, 'yyyy-MM-dd'),
      purchaseCost: data.purchaseCost || undefined,
      warrantyExpiry: data.warrantyExpiry ? format(data.warrantyExpiry, 'yyyy-MM-dd') : undefined,
      notes: data.notes || undefined,
    };

    if (selectedAsset) {
      try {
        await updateAsset(selectedAsset.id, formattedData);
        log({ assetId: selectedAsset.id, assetName: formattedData.name, type: 'updated', description: `Updated "${formattedData.name}"` });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to update asset');
        throw error;
      }
    } else {
      // Location & assignment are managed on the Assignments page.
      // Note: assetTag is auto-generated by backend and should not be sent
      try {
        const created = await addAsset({
          ...formattedData,
          location: 'Unassigned',
          assignedTo: undefined,
        });
        setSelectedAsset(created);
        setQrCodeOpen(true);
        log({ assetId: created.id, assetName: created.name, type: 'created', description: `Created asset "${created.name}" with tag ${created.assetTag}` });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to create asset');
        throw error;
      }
    }
  };

  const handleConfirmDelete = async (asset: Asset) => {
    try {
      await deleteAsset(asset.id);
      log({ assetId: asset.id, assetName: asset.name, type: 'deleted', description: `Deleted asset "${asset.name}"` });
      setDeleteDialogOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete asset');
    }
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      const a = assets.find((x) => x.id === id);
      if (a) {
        try {
          await deleteAsset(id);
          log({ assetId: id, assetName: a.name, type: 'deleted', description: `Bulk deleted "${a.name}"` });
        } catch (error) {
          toast.error(error instanceof Error ? error.message : `Failed deleting ${a.name}`);
        }
      }
    }
    toast.success(`Deleted ${selectedIds.length} asset${selectedIds.length !== 1 ? 's' : ''}`);
    setSelectedIds([]);
  };

  const handleBulkStatus = async (status: AssetStatus) => {
    for (const id of selectedIds) {
      const a = assets.find((x) => x.id === id);
      if (a) {
        try {
          await updateAsset(id, { status });
          log({ assetId: id, assetName: a.name, type: 'status-changed', description: `Status changed to ${status} for "${a.name}"` });
        } catch (error) {
          toast.error(error instanceof Error ? error.message : `Failed updating ${a.name}`);
        }
      }
    }
    toast.success(`Updated status for ${selectedIds.length} asset${selectedIds.length !== 1 ? 's' : ''}`);
    setSelectedIds([]);
  };

  const handleBulkExport = () => {
    const selected = assets.filter((a) => selectedIds.includes(a.id));
    exportToCSV(selected);
    toast.success(`Exported ${selected.length} selected assets`);
  };

  const handleExportCSV = () => {
    exportToCSV(filteredAssets);
    toast.success(`Exported ${filteredAssets.length} assets as CSV`);
  };

  const handleExportJSON = () => {
    exportToJSON(filteredAssets);
    toast.success(`Exported ${filteredAssets.length} assets as JSON`);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/20">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
              <p className="text-muted-foreground">
                {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setScannerOpen(true)} className="gap-2">
              <ScanLine className="h-4 w-4" />
              Scan QR
            </Button>
            <Button onClick={handleAddAsset} className="shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30">
              <Plus className="mr-2 h-4 w-4" />
              Add Asset
            </Button>
          </div>
        </div>

        {/* Filters */}
        <AssetFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          onExportCSV={handleExportCSV}
          onExportJSON={handleExportJSON}
        />

        <BulkActionsBar
          count={selectedIds.length}
          onClear={() => setSelectedIds([])}
          onDelete={handleBulkDelete}
          onStatusChange={handleBulkStatus}
          onExport={handleBulkExport}
          canDelete={canDelete}
        />

        {/* Table */}
        <AssetTable 
          assets={filteredAssets} 
          onView={handleViewAsset}
          onEdit={handleEditAsset}
          onDelete={handleDeleteAsset}
          onShowQr={handleShowQr}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          canDelete={canDelete}
        />
      </div>

      {/* Dialogs */}
      <AssetFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        asset={selectedAsset}
        onSubmit={handleFormSubmit}
      />

      <AssetDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        asset={selectedAsset}
        onEdit={handleEditAsset}
        onDelete={handleDeleteAsset}
        canDelete={canDelete}
      />

      <DeleteAssetDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        asset={selectedAsset}
        onConfirm={handleConfirmDelete}
      />

      <QrScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleScanResult}
      />

      <QrCodeDialog
        open={qrCodeOpen}
        onOpenChange={setQrCodeOpen}
        asset={selectedAsset}
      />
    </AppLayout>
  );
}