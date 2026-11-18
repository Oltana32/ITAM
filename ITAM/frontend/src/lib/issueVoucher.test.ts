import { describe, expect, it } from 'vitest';
import { buildIssueVoucherDataFromAssignments, buildIssueVoucherPages, buildReturnVoucherPages } from './issueVoucher';

describe('buildIssueVoucherPages', () => {
  it('creates repeated pages for many assets and includes the official agreement text', () => {
    const pages = buildIssueVoucherPages({
      voucherNumber: 'AW-2026-0001',
      issueDate: '2026-07-28',
      printedBy: 'IT Asset Management System',
      employee: {
        name: 'Abebe Bekele',
        employeeId: 'EMP-101',
        department: 'IT',
        position: 'System Administrator',
        location: 'Head Office',
      },
      assets: Array.from({ length: 7 }, (_, index) => ({
        assetTag: `AW-LAP-00${index + 1}`,
        assetName: `Laptop ${index + 1}`,
        brand: 'Dell',
        model: 'Latitude 5440',
        serialNumber: `SN-${index + 1}`,
        price: 32000 + index * 500,
        condition: 'Good',
        status: 'Assigned',
        qrValue: `https://itam.company.local/assets/AW-LAP-00${index + 1}`,
        specs: { cpu: 'Intel i5', ram: '16GB', storage: '512GB' },
      })),
    });

    expect(pages).toHaveLength(2);
    expect(pages[0].assetRows).toHaveLength(6);
    expect(pages[1].assetRows).toHaveLength(1);
    expect(pages[0].html).toContain('ICT EQUIPMENT ISSUE VOUCHER');
    expect(pages[0].html).toContain('By signing this voucher, I acknowledge');
    expect(pages[0].html).toContain('AW-LAP-001');
    expect(pages[0].html).toContain('Employee Information & QR Codes');
    expect(pages[0].html).toContain('Asset Category');
    expect(pages[0].html).toContain('Price');
    expect(pages[0].html).toContain('ETB');
    expect(pages[0].html).not.toContain('<strong>Issue Date</strong>');
  });

  it('uses the app base path for the default voucher logo', () => {
    const pages = buildIssueVoucherPages({
      voucherNumber: 'AW-2026-0005',
      issueDate: '2026-07-28',
      printedBy: 'IT Asset Management System',
      employee: {
        name: 'Abebe Bekele',
        employeeId: 'EMP-101',
        department: 'IT',
        position: 'System Administrator',
        location: 'Head Office',
      },
      assets: [{
        assetTag: 'AW-NET-002',
        assetName: 'Switch',
        brand: 'Cisco',
        model: 'Catalyst 9200',
        serialNumber: 'SN-NET-002',
        condition: 'Good',
        status: 'Assigned',
        qrValue: 'https://itam.company.local/assets/AW-NET-002',
      }],
    });

    expect(pages[0].html).toContain(encodeURI(`${import.meta.env.BASE_URL || '/'}awash wine logo.png`));
  });

  it('includes a device specification table for assets with specs', () => {
    const pages = buildIssueVoucherPages({
      voucherNumber: 'AW-2026-0004',
      issueDate: '2026-07-28',
      printedBy: 'IT Asset Management System',
      employee: {
        name: 'Abebe Bekele',
        employeeId: 'EMP-101',
        department: 'IT',
        position: 'System Administrator',
        location: 'Head Office',
      },
      assets: [{
        assetTag: 'AW-NET-001',
        assetName: 'Switch',
        brand: 'Cisco',
        model: 'Catalyst 9200',
        serialNumber: 'SN-NET-001',
        condition: 'Good',
        status: 'Assigned',
        qrValue: 'https://itam.company.local/assets/AW-NET-001',
        specs: { interface_count: 48, port_speed: '1G', management: 'Web UI' },
      }],
    });

    expect(pages[0].html).toContain('Device Specifications');
    expect(pages[0].html).toContain('Interface Count');
    expect(pages[0].html).toContain('48');

    const agreementIndex = pages[0].html.indexOf('Employee Equipment Agreement');
    const deviceSpecsIndex = pages[0].html.indexOf('Device Specifications');
    expect(deviceSpecsIndex).toBeGreaterThan(-1);
    expect(deviceSpecsIndex).toBeLessThan(agreementIndex);
  });

  it('builds a return voucher with the return-specific agreement and headings', () => {
    const pages = buildReturnVoucherPages({
      voucherNumber: 'AW-2026-0002',
      issueDate: '2026-07-28',
      printedBy: 'IT Asset Management System',
      employee: {
        name: 'Abebe Bekele',
        employeeId: 'EMP-101',
        department: 'IT',
        position: 'System Administrator',
        location: 'Head Office',
      },
      assets: [{
        assetTag: 'AW-LAP-010',
        assetName: 'Laptop 10',
        brand: 'Dell',
        model: 'Latitude 5440',
        serialNumber: 'SN-010',
        condition: 'Good',
        status: 'Returned',
        qrValue: 'https://itam.company.local/assets/AW-LAP-010',
      }],
    });

    expect(pages).toHaveLength(1);
    expect(pages[0].html).toContain('IT EQUIPMENT RETURN VOUCHER');
    expect(pages[0].html).toContain('Returned Equipment');
    expect(pages[0].html).toContain('Return Status');
    expect(pages[0].html).toContain('I acknowledge that I have returned the equipment listed above');
  });

  it('includes completed inspection details in the return voucher html', () => {
    const pages = buildReturnVoucherPages({
      voucherNumber: 'AW-2026-0003',
      issueDate: '2026-07-28',
      printedBy: 'IT Asset Management System',
      employee: {
        name: 'Abebe Bekele',
        employeeId: 'EMP-101',
        department: 'IT',
        position: 'System Administrator',
        location: 'Head Office',
      },
      assets: [{
        assetTag: 'AW-LAP-011',
        assetName: 'Laptop 11',
        brand: 'Dell',
        model: 'Latitude 5440',
        serialNumber: 'SN-011',
        condition: 'Good',
        status: 'Returned',
        qrValue: 'https://itam.company.local/assets/AW-LAP-011',
      }],
      inspection: {
        inspectionDate: '2026-07-28',
        inspectedBy: 'Mekdes T',
        overallCondition: 'good',
        physicalCondition: 'Minor scratches',
        functionalTest: 'passed',
        accessoriesReturned: 'Charger, Mouse',
        missingAccessories: 'None',
        requiresMaintenance: true,
        maintenanceIssue: 'Battery replacement',
        dataWiped: 'yes',
        finalAssetStatus: 'maintenance',
        inspectionRemarks: 'Needs follow-up',
        employeeSignature: 'Abebe Bekele',
        itStaffSignature: 'Mekdes T',
        returnedBy: 'Abebe Bekele',
        receivedBy: 'Mekdes T',
      },
    });

    expect(pages[0].html).toContain('Inspection Details');
    expect(pages[0].html).toContain('Minor scratches');
    expect(pages[0].html).toContain('Battery replacement');
  });

  it('collects all active assets for the same employee into one voucher payload', () => {
    const data = buildIssueVoucherDataFromAssignments({
      employeeName: 'Abebe Bekele',
      employeeId: 'EMP-101',
      department: 'IT',
      position: 'Employee',
      location: 'Head Office',
      printedBy: 'IT Admin',
      assignments: [
        {
          asset: 1,
          asset_tag: 'AW-001',
          asset_name: 'Laptop 1',
          assignedTo: 'Abebe Bekele',
          employeeId: 'EMP-101',
          status: 'assigned',
          location: 'Head Office',
        },
        {
          asset: 2,
          asset_tag: 'AW-002',
          asset_name: 'Phone 1',
          assignedTo: 'Abebe Bekele',
          employeeId: 'EMP-101',
          status: 'assigned',
          location: 'Head Office',
        },
      ],
      assets: [
        {
          id: '1',
          name: 'Laptop 1',
          assetTag: 'AW-001',
          manufacturer: 'Dell',
          model: 'Latitude',
          serialNumber: 'SN-001',
          condition: 'good',
        },
        {
          id: '2',
          name: 'Phone 1',
          assetTag: 'AW-002',
          manufacturer: 'Samsung',
          model: 'S24',
          serialNumber: 'SN-002',
          condition: 'good',
        },
      ],
    });

    expect(data.assets).toHaveLength(2);
    expect(data.assets.map((asset) => asset.assetTag)).toEqual(['AW-001', 'AW-002']);
    expect(data.employee.name).toBe('Abebe Bekele');
  });
});
