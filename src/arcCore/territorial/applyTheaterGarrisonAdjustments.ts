// ============================================================
// 전선 주둔 — 순수 계산 (롤 가중 비삽입)
// ============================================================

import {
  getArcCoreTheaterGarrisonPolicy,
  type ArcCoreTheaterGarrisonPolicy,
} from './arcCoreTheaterGarrisonPolicy';

export function clampTheaterGarrisonPct(pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function resolveTheaterGarrisonCombatMul(
  pct: number,
  policy?: ArcCoreTheaterGarrisonPolicy,
): number {
  const p = policy ?? getArcCoreTheaterGarrisonPolicy();
  if (!p.enabled) return 1;
  const t = clampTheaterGarrisonPct(pct) / 100;
  const min = Math.min(p.combatMulMin, p.combatMulMax);
  const max = Math.max(p.combatMulMin, p.combatMulMax);
  return min + (max - min) * t;
}

export function applyTheaterBattleGarrisonPct(input: {
  currentPct: number;
  outcome: 'defend_win' | 'occupy' | 'status_quo';
  policy?: ArcCoreTheaterGarrisonPolicy;
}): number {
  const p = input.policy ?? getArcCoreTheaterGarrisonPolicy();
  const current = clampTheaterGarrisonPct(input.currentPct);
  if (!p.enabled || input.outcome === 'status_quo') return current;
  if (input.outcome === 'defend_win') {
    return clampTheaterGarrisonPct((current * p.defendWinRetainPct) / 100);
  }
  return clampTheaterGarrisonPct((current * p.occupyRetainPct) / 100);
}

export function planTheaterRebuildSpend(input: {
  currentPct: number;
  targetPct?: number;
  localFeeAvailable: number;
  policy?: ArcCoreTheaterGarrisonPolicy;
}): {
  upkeepCredits: number;
  rebuildLocalSpend: number;
  rebuildNationSpend: number;
  nextPct: number;
} {
  const p = input.policy ?? getArcCoreTheaterGarrisonPolicy();
  const current = clampTheaterGarrisonPct(input.currentPct);
  const target = clampTheaterGarrisonPct(input.targetPct ?? 100);
  if (!p.enabled) {
    return { upkeepCredits: 0, rebuildLocalSpend: 0, rebuildNationSpend: 0, nextPct: current };
  }

  const upkeepCredits = Math.ceil((current / 100) * p.theaterDailyUpkeepCredits);
  const room = Math.max(0, target - current);
  const cap = Math.floor((p.rebuildDailyCapPctOfTarget / 100) * target);
  const deltaPct = Math.min(room, cap);
  const costPerPct = p.theaterDailyUpkeepCredits / 100;
  const rebuildCost = Math.max(0, Math.ceil(deltaPct * costPerPct));
  const localWant = Math.ceil((rebuildCost * p.rebuildLocalFeeSharePct) / 100);
  const rebuildLocalSpend = Math.min(Math.max(0, Math.floor(input.localFeeAvailable)), localWant);
  const rebuildNationSpend = Math.max(0, rebuildCost - rebuildLocalSpend);
  const funded = rebuildLocalSpend + rebuildNationSpend;
  const gainedPct = costPerPct > 0 ? Math.floor(funded / costPerPct) : 0;
  return {
    upkeepCredits,
    rebuildLocalSpend,
    rebuildNationSpend,
    nextPct: clampTheaterGarrisonPct(current + Math.min(deltaPct, gainedPct)),
  };
}
