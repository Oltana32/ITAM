import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, X, ScanLine } from 'lucide-react';

interface QrScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (result: string) => void;
  continuous?: boolean;
}

export function QrScannerDialog({ open, onOpenChange, onScan, continuous = false }: QrScannerDialogProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const mountId = 'qr-reader';

  useEffect(() => {
    if (!open) return;

    const startScanner = async () => {
      setError(null);
      try {
        const scanner = new Html5Qrcode(mountId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            onScan(decodedText);
            if (!continuous) {
              stopScanner();
              onOpenChange(false);
            }
          },
          () => {}
        );
        setScanning(true);
      } catch (err: any) {
        setError(
          err?.message?.includes('NotAllowed') || err?.toString()?.includes('NotAllowed')
            ? 'Camera permission denied. Please allow camera access.'
            : 'Unable to access camera. Ensure your device has a camera and permissions are granted.'
        );
      }
    };

    // Delay to allow DOM to mount
    const timer = setTimeout(startScanner, 300);
    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [open]);

  const stopScanner = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().catch(() => {});
    }
    scannerRef.current = null;
    setScanning(false);
  };

  const handleClose = () => {
    stopScanner();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-3">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Scan QR Code / Barcode
          </DialogTitle>
        </DialogHeader>

        <div className="relative px-6 pb-6">
          <div
            id={mountId}
            className="w-full rounded-xl overflow-hidden bg-muted/50 min-h-[300px] border border-border/50"
          />

          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6 pb-6">
              <div className="relative w-[250px] h-[250px]">
                {/* Corner markers */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-md" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-md" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-md" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-md" />
                {/* Scan line animation */}
                <div className="absolute inset-x-4 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-[scan_2s_ease-in-out_infinite]" />
              </div>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pb-6">
              <div className="bg-card rounded-xl border border-border p-6 text-center space-y-3 mx-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mx-auto">
                  <X className="h-6 w-6 text-destructive" />
                </div>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" size="sm" onClick={handleClose}>
                  Close
                </Button>
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center mt-3">
            Point your camera at a QR code or barcode to scan
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
