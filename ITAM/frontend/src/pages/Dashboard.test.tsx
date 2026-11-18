import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import Dashboard from './Dashboard';

const mockUseAssets = vi.fn();

vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/hooks/useAssets', () => ({
  useAssets: () => mockUseAssets(),
}));

describe('Dashboard', () => {
  beforeEach(() => {
    mockUseAssets.mockReset();
  });

  it('does not show NaN when an asset has an invalid cost value', () => {
    mockUseAssets.mockReturnValue({
      assets: [
        { id: '1', name: 'Laptop', category: 'laptop', status: 'available', location: 'HQ', purchaseDate: '2024-01-01', purchaseCost: 'NaN', currentValue: 'NaN', manufacturer: 'Dell', model: 'XPS', serialNumber: 'ABC', tag: 'AW-LAP-0001', assetTag: 'AW-LAP-0001' },
        { id: '2', name: 'Monitor', category: 'monitor', status: 'assigned', location: 'HQ', purchaseDate: '2024-02-01', purchaseCost: 50000, currentValue: 50000, manufacturer: 'Dell', model: 'P2419H', serialNumber: 'DEF', tag: 'AW-MON-0001', assetTag: 'AW-MON-0001' },
      ],
    });

    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>,
    );

    const text = screen.getByText(/Managing .* IT assets worth/i).textContent ?? '';
    expect(text).not.toContain('NaN');
    expect(text).toMatch(/worth.*50,000|worth.*ETB/i);
  });
});
