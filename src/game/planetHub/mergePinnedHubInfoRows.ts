import type { NearbyInfoDetailRow } from './nearbyPresenceDisplay';

/** 고정 행을 체류 목록 앞에 두고 함장/함선 중복을 제거한다. 내정보 행은 호출측에서 제외. */
export function mergePinnedHubInfoRows(
  orbitRows: NearbyInfoDetailRow[],
  pinnedRows: NearbyInfoDetailRow[],
): NearbyInfoDetailRow[] {
  if (pinnedRows.length === 0) return orbitRows;
  const seenCaptain = new Set<string>();
  const seenShip = new Set<string>();
  for (let i = 0; i < pinnedRows.length; i += 1) {
    const row = pinnedRows[i]!;
    const captainId = String(row.captainId ?? '').trim();
    const shipId = String(row.shipId ?? '').trim();
    if (captainId) seenCaptain.add(captainId);
    if (shipId) seenShip.add(shipId);
  }
  const rest: NearbyInfoDetailRow[] = [];
  for (let i = 0; i < orbitRows.length; i += 1) {
    const row = orbitRows[i]!;
    if (row.isPlayerFlagship) {
      rest.push(row);
      continue;
    }
    const captainId = String(row.captainId ?? '').trim();
    const shipId = String(row.shipId ?? '').trim();
    if (captainId && seenCaptain.has(captainId)) continue;
    if (shipId && seenShip.has(shipId)) continue;
    rest.push(row);
  }
  return [...pinnedRows, ...rest];
}
