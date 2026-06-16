// ============================================================
// 플레이어 함장 — 전함 combat CSV 단일 정본 (함장 스탯 중복 적용 없음)
// ============================================================

import type { NpcCapitalCombatStats, Player } from '../types';

/** 전함 스냅샷 그대로 반환 — pilotProfile은 UI·서사 전용 */
export function applyPlayerPilotProfileToCombat(
  baseCombat: NpcCapitalCombatStats,
  _player: Player,
): NpcCapitalCombatStats {
  return baseCombat;
}
