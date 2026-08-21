/** Extract asset tag / id candidates from a QR scan payload. */
export function parseQrScanPayload(raw: string): string[] {
  const trimmed = raw.trim();
  const candidates = new Set<string>([trimmed]);

  try {
    const parsed = JSON.parse(trimmed) as {
      assetTag?: string;
      tag?: string;
      id?: string | number;
    };
    if (parsed.assetTag) candidates.add(String(parsed.assetTag).trim());
    if (parsed.tag) candidates.add(String(parsed.tag).trim());
    if (parsed.id != null) candidates.add(String(parsed.id).trim());
  } catch {
    // Non-JSON payload
  }

  try {
    const url = new URL(trimmed);
    const tag = url.searchParams.get('assetTag') ?? url.searchParams.get('tag');
    const id = url.searchParams.get('id');
    if (tag) candidates.add(tag.trim());
    if (id) candidates.add(id.trim());
  } catch {
    // Not a URL
  }

  return Array.from(candidates).filter((v) => v.length > 0);
}

export function findAssetByScan<T extends { id: string; assetTag: string; serialNumber: string }>(
  assets: T[],
  raw: string,
): T | undefined {
  const normalized = parseQrScanPayload(raw).map((v) => v.toLowerCase());
  return assets.find((asset) => {
    const tag = (asset.assetTag || '').toLowerCase();
    const id = asset.id.toLowerCase();
    const serial = (asset.serialNumber || '').toLowerCase();
    return normalized.some((v) => v === tag || v === id || v === serial);
  });
}

export function extractAssetTag(raw: string): string {
  const candidates = parseQrScanPayload(raw);
  // Prefer tag-like AW-XXX-0001 format
  const tagLike = candidates.find((c) => /^AW-[A-Z]{3}-\d{4}$/i.test(c));
  return tagLike || candidates[0] || raw.trim();
}
