// ============================================================
// 플레이어 누적 획득 크레딧 — 무기 가격 progressive 스케일
// ============================================================

import type { Player } from '../types';
import { getPlanetLevelingRowForZone } from '../arcCore/planetBalance/planetZoneIndexRegistry';

export function resolvePlayerLifetimeCredits(player: Player): number {
  const stored = player.lifetimeCreditsEarned;
  if (typeof stored === 'number' && Number.isFinite(stored) && stored > 0) {
    return Math.floor(stored);
  }
  const level = Math.max(1, player.level);
  const zoneIndex = Math.max(1, Math.min(20, Math.ceil(level / 3)));
  const zoneRow = getPlanetLevelingRowForZone(zoneIndex);
  const zoneBudget = Number(zoneRow?.targetCreditsEarned) || 30_000;
  const proxy = zoneBudget * (level - 1) * 0.55;
  return Math.max(player.credits, Math.floor(proxy));
}
