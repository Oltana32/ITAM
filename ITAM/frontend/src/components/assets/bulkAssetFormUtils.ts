import { AssetStatus } from '@/types/asset';

const hiddenAssetStatusValues = new Set(['ready', 'assigned']);

export function getVisibleAssetStatusOptions(labels: Record<string, string>): Array<[AssetStatus | string, string]> {
  return Object.entries(labels).filter(([value]) => !hiddenAssetStatusValues.has(value));
}

export function getBulkAssetStatusOptions(labels: Record<string, string>): Array<[AssetStatus | string, string]> {
  return getVisibleAssetStatusOptions(labels);
}
