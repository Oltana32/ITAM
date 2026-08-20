import { describe, expect, it } from 'vitest';
import { getBulkAssetStatusOptions, getVisibleAssetStatusOptions } from '../bulkAssetFormUtils';

describe('getVisibleAssetStatusOptions', () => {
  it('excludes ready and assigned from the selectable status list', () => {
    const labels = {
      available: 'Available',
      assigned: 'Assigned',
      'in-use': 'In Use',
      ready: 'Ready',
      maintenance: 'Under Maintenance',
      retired: 'Retired',
      disposed: 'Disposed',
      lost: 'Lost',
      damaged: 'Damaged',
    };

    const options = getVisibleAssetStatusOptions(labels);

    expect(options).toEqual([
      ['available', 'Available'],
      ['in-use', 'In Use'],
      ['maintenance', 'Under Maintenance'],
      ['retired', 'Retired'],
      ['disposed', 'Disposed'],
      ['lost', 'Lost'],
      ['damaged', 'Damaged'],
    ]);
  });

  it('provides the same filtered list for bulk status actions', () => {
    const labels = {
      available: 'Available',
      assigned: 'Assigned',
      'in-use': 'In Use',
      ready: 'Ready',
      maintenance: 'Under Maintenance',
    };

    expect(getBulkAssetStatusOptions(labels)).toEqual([
      ['available', 'Available'],
      ['in-use', 'In Use'],
      ['maintenance', 'Under Maintenance'],
    ]);
  });
});
