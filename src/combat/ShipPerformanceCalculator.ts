// ============================================================
// 전함 전투 성능 — 숙련 계수 배율 (docs/_player-combat-proficiency-system.md §5.2)
// ============================================================

import type { NpcCapitalCombatStats } from '../types';
import type { NpcCapitalShipCombatRuntimeConfig } from '../data/generated/csvNpcCapitalShips';

export const UNASSIGNED_CAPTAIN_PROFICIENCY_MULTIPLIER = 0.9;

export type ShipPerformanceProficiencyInput = {
  level?: number;
  proficiencyMultiplier: number;
};

export type ShipPerformanceResult = {
  combat: NpcCapitalCombatStats;
  runtimeConfig?: NpcCapitalShipCombatRuntimeConfig;
};

export type MineralUpgradeState = Record<string, number> | undefined;

function proficiencyFlatBonus(multiplier: number): number {
  if (!Number.isFinite(multiplier) || multiplier <= 1) return 0;
  return Math.floor((multiplier - 1) * 10);
}

function scaleRuntimeMotion(
  runtime: NpcCapitalShipCombatRuntimeConfig | undefined,
  multiplier: number,
  dexStat: number,
): NpcCapitalShipCombatRuntimeConfig | undefined {
  if (!runtime) return undefined;
  const dexMod = Math.max(0, Math.floor((dexStat - 10) / 2));
  const motionMult = multiplier * (1 + dexMod * 0.02);
  const next = { ...runtime };
  if (typeof next.maxMoveSpeedPxPerMs === 'number') {
    next.maxMoveSpeedPxPerMs = next.maxMoveSpeedPxPerMs * motionMult;
  }
  if (typeof next.maxTurnRateRadPerMs === 'number') {
    next.maxTurnRateRadPerMs = next.maxTurnRateRadPerMs * motionMult;
  }
  return next;
}

export function calculateShipPerformance(
  baseCombat: NpcCapitalCombatStats,
  proficiency: ShipPerformanceProficiencyInput,
  runtimeConfig?: NpcCapitalShipCombatRuntimeConfig,
): ShipPerformanceResult {
  const mult = Math.max(
    UNASSIGNED_CAPTAIN_PROFICIENCY_MULTIPLIER,
    proficiency.proficiencyMultiplier,
  );
  const flat = proficiencyFlatBonus(mult);
  const strStat = Math.max(1, baseCombat.strStat + flat);
  const dexStat = Math.max(1, baseCombat.dexStat + flat);

  const combat: NpcCapitalCombatStats = {
    ...baseCombat,
    maxHp: Math.max(1, Math.round(baseCombat.maxHp * mult)),
    maxShield: Math.max(0, Math.round(baseCombat.maxShield * mult)),
    armor: Math.max(0, baseCombat.armor + flat),
    attackBonus: baseCombat.attackBonus + flat,
    strStat,
    dexStat,
    damageDice: {
      ...baseCombat.damageDice,
      bonus: baseCombat.damageDice.bonus + flat,
    },
  };

  return {
    combat,
    runtimeConfig: scaleRuntimeMotion(runtimeConfig, mult, dexStat),
  };
}

/** 광물 업그레이드 DB 연동 전까지 입력 그대로 반환 */
export function applyMineralUpgradeToShipPerformance(
  perf: ShipPerformanceResult,
  _mineralUpgrades?: MineralUpgradeState,
): ShipPerformanceResult {
  return perf;
}
