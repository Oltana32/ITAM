export type ReturnInspectionForm = {
  inspectedBy?: string;
  overallCondition?: string;
  finalAssetStatus?: string;
};

export function isReturnInspectionComplete(
  inspection: ReturnInspectionForm | null | undefined,
): boolean {
  if (!inspection) return false;

  return Boolean(
    inspection.inspectedBy?.trim() &&
      inspection.overallCondition?.trim() &&
      inspection.finalAssetStatus?.trim(),
  );
}
