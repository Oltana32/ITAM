import { AssetStatus } from '@/types/asset';

const hiddenAssetStatusValues = new Set(['ready', 'assigned', 'in_use', 'in-use']);

export function getVisibleAssetStatusOptions(labels: Record<string, string>): Array<[AssetStatus | string, string]> {
  return Object.entries(labels).filter(([value]) => !hiddenAssetStatusValues.has(value) && !hiddenAssetStatusValues.has(value.replace('_', '-')));
}

export function getBulkAssetStatusOptions(labels: Record<string, string>): Array<[AssetStatus | string, string]> {
  return getVisibleAssetStatusOptions(labels);
}
