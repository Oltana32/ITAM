import { useState, useRef } from 'react';
import { Upload, Download, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { authFetch, authFetchWithRefresh } from '@/lib/auth';

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete?: () => void;
  onOpenBulkAssetForm?: () => void;
}

export function BulkImportDialog({ open, onOpenChange, onImportComplete, onOpenBulkAssetForm }: BulkImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = async () => {
    try {
      const res = await authFetchWithRefresh('/api/assets/import-template/', { method: 'GET' });
      if (!res.ok) {
        const payload = await res.text().catch(() => '');
        throw new Error(payload || `Failed to download template (status ${res.status})`);
      }

      const contentDisposition = res.headers.get('content-disposition') || '';
      // Support filename*=UTF-8''... and filename="..." formats
      let filename = 'asset_import_template.xlsx';
      const filenameStar = contentDisposition.match(/filename\*=(?:UTF-8'')?([^;]+)/i);
      if (filenameStar && filenameStar[1]) {
        try {
          filename = decodeURIComponent(filenameStar[1].trim().replace(/['"]/g, ''));
        } catch {
          filename = filenameStar[1].trim().replace(/['"]/g, '');
        }
      } else {
        const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
        if (filenameMatch && filenameMatch[1]) filename = filenameMatch[1];
      }
      const contentType = (res.headers.get('content-type') || '').toLowerCase();

      // If the response isn't an Excel MIME, parse text and show error (avoid downloading HTML/JSON as .xltx)
      if (!contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml') && !contentType.includes('application/octet-stream')) {
        const payloadText = await res.text().catch(() => '');
        let message = payloadText || `Unexpected response (status ${res.status})`;
        try {
          const j = JSON.parse(payloadText);
          message = j.detail || JSON.stringify(j);
        } catch {
          // not JSON
        }
        toast.error(`Failed to download template: ${message}`);
        console.error('Template download error payload:', payloadText);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1500);
      document.body.removeChild(a);
      toast.success('Template downloaded');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xltx')) {
        toast.error('Please select a .xlsx or .xltx file');
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await authFetch('/api/assets/bulk-import/', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Import failed');
      }

      const result = await res.json();
      setImportResult(result);
      toast.success(`${result.summary.created} assets imported successfully`);
      
      if (result.summary.failed > 0) {
        toast.warning(`${result.summary.failed} rows had errors`);
      }

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      toast.error(String(err));
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImportResult(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Import Assets</DialogTitle>
          <DialogDescription>
            Upload an Excel file to import multiple assets at once. Download the template first — it includes
            dropdowns for category, status, condition, and spec fields, plus date pickers for purchase and warranty
            dates, matching the add-asset form. Location is optional; manufacturers are created automatically if missing.
          </DialogDescription>
        </DialogHeader>

        {!importResult ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleDownloadTemplate}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
              {onOpenBulkAssetForm && (
                <Button type="button" variant="secondary" className="w-full" onClick={onOpenBulkAssetForm}>
                  Open bulk asset entry form
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Excel File</label>
              <div
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-accent transition"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xltx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                {selectedFile ? (
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium">Click to select file or drag and drop</p>
                    <p className="text-xs text-muted-foreground">Only .xlsx or .xltx files accepted</p>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-medium text-green-900">
                ✓ {importResult.summary.created} assets created
              </p>
              {importResult.summary.failed > 0 && (
                <p className="text-sm text-yellow-700 mt-1">
                  ⚠ {importResult.summary.failed} rows had errors
                </p>
              )}
            </div>

            {importResult.created.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium">Created Assets:</h3>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-3 bg-muted/50">
                  {importResult.created.map((item: any) => (
                    <div key={item.id} className="text-sm py-1 border-b last:border-0">
                      Row {item.row}: <span className="font-mono font-medium">{item.tag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-medium text-destructive">Errors:</h3>
                <div className="max-h-48 overflow-y-auto border border-destructive/30 rounded-lg p-3 bg-destructive/5">
                  {importResult.errors.map((item: any, idx: number) => (
                    <div key={idx} className="text-sm py-2 border-b border-destructive/20 last:border-0">
                      <p className="font-medium">Row {item.row}:</p>
                      {Object.entries(item.errors).map(([field, msg]) => (
                        <p key={field} className="text-xs text-destructive ml-2">
                          • {field}: {String(msg)}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!importResult ? (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button 
                onClick={handleImport} 
                disabled={!selectedFile || isImporting}
              >
                {isImporting ? 'Importing...' : 'Import'}
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
