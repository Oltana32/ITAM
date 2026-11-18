import { describe, expect, it } from 'vitest';
import { isReturnInspectionComplete } from './returnInspection';

describe('isReturnInspectionComplete', () => {
  it('requires the inspection details before enabling the return print flow', () => {
    const complete = {
      inspectedBy: 'Mekdes T',
      overallCondition: 'good',
      finalAssetStatus: 'available',
    };

    const incomplete = {
      inspectedBy: 'Mekdes T',
      overallCondition: 'good',
      finalAssetStatus: '',
    };

    expect(isReturnInspectionComplete(complete)).toBe(true);
    expect(isReturnInspectionComplete(incomplete)).toBe(false);
  });
});
