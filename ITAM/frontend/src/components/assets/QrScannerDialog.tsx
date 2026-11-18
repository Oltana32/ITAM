import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, X, ScanLine } from 'lucide-react';

function isLocalSecureContext(): boolean {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname;
  return window.isSecureContext || host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
}

interface QrScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan?: (result: string) => void;
  /** Optional: called with verification payload when user confirms scan */
  onVerify?: (payload: {
    asset_tag: string;
    verification: Record<string, boolean>;
    current_condition?: string;
    notes?: string;
  }) => void;
  continuous?: boolean;
}

export function QrScannerDialog({ open, onOpenChange, onScan, onVerify, continuous = false }: QrScannerDialogProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const mountId = 'qr-reader';
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [tagMatch, setTagMatch] = useState(true);
  const [serialMatch, setSerialMatch] = useState(true);
  const [assignedUserCorrect, setAssignedUserCorrect] = useState(true);
  const [locationCorrect, setLocationCorrect] = useState(true);
  const [currentCondition, setCurrentCondition] = useState('excellent');
  const [notes, setNotes] = useState('');
  const [manualTag, setManualTag] = useState('');

  useEffect(() => {
    if (!open) return;

    if (!isLocalSecureContext()) {
      setError('Camera access is blocked on this host. Use localhost or HTTPS, or type the asset tag manually below.');
      setScanning(false);
      return;
    }

    const startScanner = async () => {
      setError(null);
      try {
        const scanner = new Html5Qrcode(mountId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            if (onVerify) {
              // stop and show review UI
              stopScanner();
              setPendingCode(decodedText);
              setShowReview(true);
              return;
            }
            if (onScan) onScan(decodedText);
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

  const submitManualTag = () => {
    const trimmed = manualTag.trim();
    if (!trimmed) return;

    if (onVerify) {
      setPendingCode(trimmed);
      setShowReview(true);
      return;
    }

    if (onScan) onScan(trimmed);
    if (!continuous) {
      onOpenChange(false);
    }
    setManualTag('');
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

          {!showReview && (
            <div className="mt-4 space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Or enter an asset tag manually</label>
              <div className="flex gap-2">
                <input
                  value={manualTag}
                  onChange={(e) => setManualTag(e.target.value)}
                  placeholder="AW-LAP-0001"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      submitManualTag();
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                <Button type="button" variant="secondary" size="sm" disabled={!manualTag.trim()} onClick={submitManualTag}>
                  Use tag
                </Button>
              </div>
            </div>
          )}

            {showReview && pendingCode && (
              <div className="absolute inset-0 flex items-end">
                <div className="w-full bg-card/90 backdrop-blur border-t border-border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Verify scan: {pendingCode}</p>
                      <p className="text-xs text-muted-foreground">Confirm verification details before submitting.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => { setShowReview(false); setPendingCode(null); onOpenChange(false); }}>
                        Cancel
                      </Button>
                      <Button size="sm" onClick={() => {
                        if (onVerify) {
                          onVerify({
                            asset_tag: pendingCode,
                            verification: {
                              tag_match: tagMatch,
                              serial_match: serialMatch,
                              assigned_user_correct: assignedUserCorrect,
                              location_correct: locationCorrect,
                            },
                            current_condition: currentCondition,
                            notes: notes || undefined,
                          });
                        }
                        setShowReview(false);
                        setPendingCode(null);
                        onOpenChange(false);
                      }}>Confirm</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={tagMatch} onChange={(e) => setTagMatch(e.target.checked)} /> Tag matches</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={serialMatch} onChange={(e) => setSerialMatch(e.target.checked)} /> Serial matches</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={assignedUserCorrect} onChange={(e) => setAssignedUserCorrect(e.target.checked)} /> Assigned user correct</label>
                    <label className="flex items-center gap-2"><input type="checkbox" checked={locationCorrect} onChange={(e) => setLocationCorrect(e.target.checked)} /> Location correct</label>
                  </div>
                  <div className="grid gap-2 mt-3">
                    <label className="text-xs">Condition</label>
                    <select value={currentCondition} onChange={(e) => setCurrentCondition(e.target.value)} className="w-full">
                      <option value="excellent">Excellent</option>
                      <option value="good">Good</option>
                      <option value="fair">Fair</option>
                      <option value="poor">Poor</option>
                      <option value="damaged">Damaged</option>
                    </select>
                    <label className="text-xs">Notes (optional)</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full p-2 border rounded" />
                  </div>
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
