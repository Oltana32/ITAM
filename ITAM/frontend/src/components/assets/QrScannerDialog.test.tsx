import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { QrScannerDialog } from './QrScannerDialog';

describe('QrScannerDialog', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'isSecureContext', { value: false, configurable: true });
    Object.defineProperty(window, 'location', {
      value: { ...window.location, hostname: '192.168.1.50' },
      configurable: true,
    });
  });

  it('shows a manual tag entry fallback when camera access is blocked on a local network host', () => {
    render(
      <QrScannerDialog
        open
        onOpenChange={vi.fn()}
        onScan={vi.fn()}
      />,
    );

    expect(screen.getByText(/Camera access is blocked on this host/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/AW-LAP-0001/i)).toBeInTheDocument();
  });
});
