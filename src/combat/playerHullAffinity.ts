// ============================================================
// 플레이어 함선 체급 → 방어 affinity (weapon_affinity_matrix 대상)
// ============================================================

import { affinityKindFromHullTierKey } from '../arcCore/balance/capitalHullPurchaseFromBalance';
import { enemyLevelToZoneIndex, getPlanetLevelingRowForZone } from '../arcCore/planetBalance/planetZoneIndexRegistry';

export function resolvePlayerHullAffinityKind(playerLevel: number): string {
  const zoneIndex = enemyLevelToZoneIndex(Math.max(1, Math.floor(playerLevel)));
  const row = getPlanetLevelingRowForZone(zoneIndex);
  return affinityKindFromHullTierKey(row.recommendedHullTierKey);
}
