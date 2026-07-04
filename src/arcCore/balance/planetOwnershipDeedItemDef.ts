// ============================================================
// 행성 소유권 증서 — ItemDef id 유틸 (정본: item_defs.csv + build merge)
// synth ownership rows: build-content-from-csv ← synth_system_colonization.csv
// ============================================================

const OWNERSHIP_PREFIX = 'ownership_';

export function isPlanetOwnershipItemId(itemId: string): boolean {
  return itemId.startsWith(OWNERSHIP_PREFIX);
}

export function resolvePlanetIdFromOwnershipItemId(itemId: string): string | null {
  if (!isPlanetOwnershipItemId(itemId)) return null;
  const planetId = itemId.slice(OWNERSHIP_PREFIX.length).trim();
  return planetId || null;
}
