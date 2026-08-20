import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import Assignments from './Assignments';

const mockRefetchAssignments = vi.fn();
const mockCreateAssignment = vi.fn();
const mockUpdateAssignment = vi.fn();
const mockUpdateAsset = vi.fn();
const mockLog = vi.fn();
const mockUseAssignments = vi.fn();
const mockUseAssets = vi.fn();
const mockUseLocations = vi.fn();
const mockUseActivityLog = vi.fn();
const mockGetStoredUser = vi.fn();

vi.mock('@/components/layout/AppLayout', () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/assets/AssetDetailDialog', () => ({
  AssetDetailDialog: () => null,
}));

vi.mock('@/components/assets/QrScannerDialog', () => ({
  QrScannerDialog: () => null,
}));

vi.mock('@/hooks/useAssignmentsQuery', () => ({
  useAssignments: () => mockUseAssignments(),
}));

vi.mock('@/hooks/useAssets', () => ({
  useAssets: () => mockUseAssets(),
}));

vi.mock('@/hooks/useLocations', () => ({
  useLocations: () => mockUseLocations(),
}));

vi.mock('@/hooks/useActivityLog', () => ({
  useActivityLog: () => mockUseActivityLog(),
}));

vi.mock('@/lib/auth', () => ({
  getStoredUser: () => mockGetStoredUser(),
}));

describe('Assignments', () => {
  beforeEach(() => {
    mockRefetchAssignments.mockReset();
    mockCreateAssignment.mockReset();
    mockUpdateAssignment.mockReset();
    mockUpdateAsset.mockReset();
    mockLog.mockReset();
    mockUseAssignments.mockReset();
    mockUseAssets.mockReset();
    mockUseLocations.mockReset();
    mockUseActivityLog.mockReset();
    mockGetStoredUser.mockReset();

    mockGetStoredUser.mockReturnValue({
      first_name: 'Ada',
      last_name: 'Lovelace',
      email: 'ada@example.com',
      department: 'IT',
      role: 'it_team',
    });

    mockUseAssignments.mockReturnValue({
      assignments: [
        {
          id: '1',
          asset: 1,
          asset_name: 'Laptop',
          asset_tag: 'TAG-001',
          assignedTo: 'Jane Doe',
          employeeId: 'EMP-001',
          employeeDepartment: 'IT',
          employeePosition: 'Engineer',
          location: 'Main Office',
          assigned_date: '2024-01-01',
          status: 'assigned',
          assignedBy: 'System',
          notes: 'Office laptop',
        },
        {
          id: '2',
          asset: 2,
          asset_name: 'Monitor',
          asset_tag: 'TAG-002',
          assignedTo: 'John Smith',
          employeeId: 'EMP-002',
          employeeDepartment: 'IT',
          employeePosition: 'Analyst',
          location: 'Main Office',
          assigned_date: '2024-01-02',
          status: 'assigned',
          assignedBy: 'System',
          notes: 'Office monitor',
        },
      ],
      refetchAssignments: mockRefetchAssignments,
      createAssignment: mockCreateAssignment,
      isCreatingAssignment: false,
      updateAssignment: mockUpdateAssignment,
    });

    mockUseAssets.mockReturnValue({
      assets: [
        { id: '1', name: 'Laptop', assetTag: 'TAG-001', manufacturer: 'Dell', model: 'Latitude', serialNumber: 'SN-001', condition: 'good', category: 'laptop', status: 'in-use', assignedTo: 'Jane Doe' },
        { id: '2', name: 'Monitor', assetTag: 'TAG-002', manufacturer: 'Samsung', model: 'S24', serialNumber: 'SN-002', condition: 'good', category: 'monitor', status: 'in-use', assignedTo: 'John Smith' },
      ],
      updateAsset: mockUpdateAsset,
    });

    mockUseLocations.mockReturnValue({
      locations: [{ id: '1', name: 'Main Office', city: 'Addis Ababa' }],
    });

    mockUseActivityLog.mockReturnValue({
      log: mockLog,
    });
  });

  it('filters assignments by asset name and assigned person name', () => {
    render(<Assignments />);

    const searchInput = screen.getByPlaceholderText(/search assignments/i);
    fireEvent.change(searchInput, { target: { value: 'Laptop' } });

    expect(screen.getByText(/Laptop\s*\(TAG-001\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/Monitor\s*\(TAG-002\)/i)).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: 'Jane' } });

    expect(screen.getByText(/Jane Doe/i)).toBeInTheDocument();
    expect(screen.queryByText(/John Smith/i)).not.toBeInTheDocument();
  });
});
