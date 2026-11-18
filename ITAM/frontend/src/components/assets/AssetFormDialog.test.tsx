import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AssetFormDialog } from './AssetFormDialog';

vi.mock('@/lib/auth', () => ({
  authFetch: vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ results: [{ id: 1, name: 'Apple' }] }),
  }),
}));

describe('AssetFormDialog', () => {
  it('restores saved specification values when editing an asset', async () => {
    const asset = {
      id: '1',
      name: 'iPhone 15',
      tag: 'AW-001',
      assetTag: 'AW-001',
      category: 'phone',
      status: 'available',
      condition: 'good',
      manufacturer: 'Apple',
      model: 'iPhone 15',
      serialNumber: 'SN-123',
      purchaseDate: '2024-01-01',
      department: 'IT',
      location: 'Head Office',
      notes: 'Used for testing',
      specs: { os: 'iOS', storage: '256GB' },
    } as any;

    render(
      <AssetFormDialog
        open
        onOpenChange={() => {}}
        asset={asset}
        onSubmit={async () => {}}
      />
    );

    expect(await screen.findByDisplayValue('iOS')).toBeInTheDocument();
    expect(screen.getByDisplayValue('256GB')).toBeInTheDocument();
  });
});
