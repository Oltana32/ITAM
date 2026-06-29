import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Asset } from '@/types/asset';
import { Printer, Download } from 'lucide-react';
import { useRef } from 'react';

interface QrCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: Asset | null;
}

export function QrCodeDialog({ open, onOpenChange, asset }: QrCodeDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!asset) return null;

  const qrValue = JSON.stringify({
    assetTag: asset.assetTag,
    name: asset.name,
    id: asset.id,
  });

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${asset.assetTag}</title>
          <style>
            body { display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; font-family: system-ui, sans-serif; }
            .label { text-align: center; padding: 24px; border: 2px dashed #ccc; border-radius: 12px; }
            .tag { font-size: 14px; font-weight: 700; margin-top: 12px; font-family: monospace; letter-spacing: 1px; }
            .name { font-size: 12px; color: #666; margin-top: 4px; }
          </style>
        </head>
        <body>
          <div class="label">
            ${content.querySelector('svg')?.outerHTML || ''}
            <div class="tag">${asset.assetTag}</div>
            <div class="name">${asset.name}</div>
          </div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = () => {
    const svg = printRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      ctx!.fillStyle = 'white';
      ctx!.fillRect(0, 0, canvas.width, canvas.height);
      ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);

      const link = document.createElement('a');
      link.download = `qr-${asset.assetTag}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">Asset QR Code</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4" ref={printRef}>
          <div className="rounded-2xl border-2 border-dashed border-border p-6 bg-background">
            <QRCodeSVG
              value={qrValue}
              size={180}
              level="H"
              includeMargin
              bgColor="transparent"
              fgColor="currentColor"
              className="text-foreground"
            />
          </div>
          <div className="text-center space-y-1">
            <p className="font-mono text-sm font-bold tracking-wider">{asset.assetTag}</p>
            <p className="text-sm text-muted-foreground">{asset.name}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download PNG
          </Button>
          <Button className="flex-1 gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            Print Label
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
