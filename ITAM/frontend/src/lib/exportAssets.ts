import { Asset, categoryLabels, statusLabels } from '@/types/asset';
import { format } from 'date-fns';

function assetToRow(asset: Asset) {
  return {
    'Asset Tag': asset.assetTag,
    'Name': asset.name,
    'Category': categoryLabels[asset.category],
    'Status': statusLabels[asset.status],
    'Manufacturer': asset.manufacturer,
    'Model': asset.model,
    'Serial Number': asset.serialNumber,
    'Assigned To': asset.assignedTo || '',
    'Location': asset.location,
    'Purchase Date': format(new Date(asset.purchaseDate), 'yyyy-MM-dd'),
    'Warranty Expiry': asset.warrantyExpiry ? format(new Date(asset.warrantyExpiry), 'yyyy-MM-dd') : '',
    'Notes': asset.notes || '',
  };
}

export function exportToCSV(assets: Asset[], filename = 'assets-export') {
  const rows = assets.map(assetToRow);
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => {
        const val = String(row[h as keyof typeof row]);
        return val.includes(',') || val.includes('"') || val.includes('\n')
          ? `"${val.replace(/"/g, '""')}"`
          : val;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportToJSON(assets: Asset[], filename = 'assets-export') {
  const blob = new Blob([JSON.stringify(assets, null, 2)], { type: 'application/json' });
  downloadBlob(blob, `${filename}.json`);
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
