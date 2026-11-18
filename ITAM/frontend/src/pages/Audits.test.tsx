import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import Audits from './Audits';
import { extractAssetTag } from '@/lib/parseQrScan';

const mockUseAuditSessions = vi.fn();
const mockUseAuditResults = vi.fn();
const mockUseLocations = vi.fn();
const mockUseDepartments = vi.fn();
const mockUseUsers = vi.fn();
const mockUseAuditMutations = vi.fn();

vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/hooks/useAudits', () => ({
  useAuditSessions: () => mockUseAuditSessions(),
  useAuditResults: () => mockUseAuditResults(),
  useAuditMutations: () => mockUseAuditMutations(),
  downloadAuditExport: vi.fn(),
}));

vi.mock('@/hooks/useLocations', () => ({
  useLocations: () => mockUseLocations(),
}));

vi.mock('@/hooks/useDepartments', () => ({
  useDepartments: () => mockUseDepartments(),
}));

vi.mock('@/hooks/useUsers', () => ({
  useUsers: () => mockUseUsers(),
}));

describe('Audits', () => {
  beforeEach(() => {
    mockUseAuditSessions.mockReset();
    mockUseAuditResults.mockReset();
    mockUseLocations.mockReset();
    mockUseDepartments.mockReset();
    mockUseUsers.mockReset();
    mockUseAuditMutations.mockReset();

    mockUseAuditSessions.mockReturnValue({ data: [], isLoading: false });
    mockUseAuditResults.mockReturnValue({ data: null, refetch: vi.fn() });
    mockUseLocations.mockReturnValue({ locations: [] });
    mockUseDepartments.mockReturnValue({ departments: [] });
    mockUseUsers.mockReturnValue({ users: [] });
    mockUseAuditMutations.mockReturnValue({
      createSession: { mutateAsync: vi.fn(), isLoading: false },
      startSession: { mutate: vi.fn(), isPending: false },
      scanAsset: { mutateAsync: vi.fn() },
      completeSession: { mutate: vi.fn(), isPending: false },
    });
  });

  it('falls back to a free-text department field when no departments exist', () => {
    render(<Audits />);

    fireEvent.click(screen.getByRole('button', { name: /new audit session/i }));

    expect(screen.getByPlaceholderText(/enter a department name/i)).toBeInTheDocument();
    expect(screen.queryByText(/choose department/i)).not.toBeInTheDocument();
  });

  it('shows a glowing completion action while an audit is in progress', () => {
    mockUseAuditSessions.mockReturnValue({
      data: [{
        id: 2,
        title: 'Inventory Audit',
        status: 'in_progress',
        location_name: 'HQ',
        department: 'IT',
        audit_id: 'AUD-42',
        stats: { expected: 4, verified: 2, missing: 2, progress_pct: 50 },
      }],
      isLoading: false,
    });

    render(<Audits />);

    expect(screen.getByRole('button', { name: /complete audit/i })).toHaveClass('animate-pulse');
  });

  it('offers a dedicated asset tag field beside the scan button during an active audit', () => {
    mockUseAuditSessions.mockReturnValue({
      data: [{
        id: 2,
        title: 'Inventory Audit',
        status: 'in_progress',
        location_name: 'HQ',
        department: 'IT',
        audit_id: 'AUD-42',
        stats: { expected: 4, verified: 2, missing: 2, progress_pct: 50 },
      }],
      isLoading: false,
    });

    render(<Audits />);

    expect(screen.getByLabelText(/asset tag/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /scan asset/i })).toBeInTheDocument();
  });

  it('extracts the asset tag from QR payloads before auditing', () => {
    expect(extractAssetTag(JSON.stringify({ assetTag: 'AW-LAP-0001' }))).toBe('AW-LAP-0001');
  });
});
