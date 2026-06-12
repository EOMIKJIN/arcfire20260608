// ============================================================
// 전함 전투 성능 — 숙련 계수 배율 (docs/_player-combat-proficiency-system.md §5.2)
// 파이터/레인저 구분 스탯 — npc_ai_ships.csv capitalShipArchetype
// ============================================================

import type { CapitalShipArchetype, NpcCapitalCombatStats } from '../types';
import type { NpcCapitalShipCombatRuntimeConfig } from '../data/generated/csvNpcCapitalShips';

export const UNASSIGNED_CAPTAIN_PROFICIENCY_MULTIPLIER = 0.9;

/** 숙련도가 주 능력치에 더 실리는 비율(0..1). 보조 축은 1-primaryBias */
const ARCHETYPE_PRIMARY_PROFICIENCY_BIAS = 0.72;

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

function resolveArchetypeStatBias(
  archetype: CapitalShipArchetype | undefined,
  flat: number,
): { strFlat: number; dexFlat: number } {
  if (flat <= 0) return { strFlat: 0, dexFlat: 0 };
  const primary = Math.max(0, Math.min(1, ARCHETYPE_PRIMARY_PROFICIENCY_BIAS));
  const secondary = 1 - primary;
  if (archetype === 'fighter') {
    return { strFlat: flat, dexFlat: Math.max(0, Math.floor(flat * secondary)) };
  }
  if (archetype === 'ranger') {
    return { strFlat: Math.max(0, Math.floor(flat * secondary)), dexFlat: flat };
  }
  return { strFlat: flat, dexFlat: flat };
}

function resolveHullProficiencyMultiplier(
  mult: number,
  archetype: CapitalShipArchetype | undefined,
): number {
  if (archetype === 'fighter') return mult * 1.03;
  if (archetype === 'ranger') return mult * 0.97;
  return mult;
}

function scaleCooldownMs(value: number | undefined, factor: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return value;
  return Math.max(40, Math.round(value * factor));
}

function scaleRuntimeMotion(
  runtime: NpcCapitalShipCombatRuntimeConfig | undefined,
  multiplier: number,
  dexStat: number,
  archetype: CapitalShipArchetype | undefined,
): NpcCapitalShipCombatRuntimeConfig | undefined {
  if (!runtime) return undefined;
  const dexMod = Math.max(0, Math.floor((dexStat - 10) / 2));
  const dexArchetypeBoost = archetype === 'ranger' ? 1.06 : archetype === 'fighter' ? 0.98 : 1;
  const motionMult = multiplier * (1 + dexMod * 0.02) * dexArchetypeBoost;
  const profDelta = Math.max(0, multiplier - 1);
  const rangerCdFactor = archetype === 'ranger' ? Math.max(0.78, 1 - profDelta * 0.18) : 1;
  const fighterCdFactor = archetype === 'fighter' ? Math.min(1.12, 1 + profDelta * 0.06) : 1;
  const cdFactor = rangerCdFactor * fighterCdFactor;

  const next = { ...runtime };
  if (typeof next.maxMoveSpeedPxPerMs === 'number') {
    next.maxMoveSpeedPxPerMs = next.maxMoveSpeedPxPerMs * motionMult;
  }
  if (typeof next.maxTurnRateRadPerMs === 'number') {
    next.maxTurnRateRadPerMs = next.maxTurnRateRadPerMs * motionMult;
  }
  if (typeof next.detectRangeScale === 'number') {
    const detectBoost =
      archetype === 'ranger' ? 1 + profDelta * 0.35 : archetype === 'fighter' ? 1 + profDelta * 0.08 : 1;
    next.detectRangeScale = next.detectRangeScale * detectBoost;
  }
  next.laserCooldownJitterMinMs = scaleCooldownMs(next.laserCooldownJitterMinMs, cdFactor);
  next.laserCooldownJitterMaxMs = scaleCooldownMs(next.laserCooldownJitterMaxMs, cdFactor);
  next.missileCooldownJitterMinMs = scaleCooldownMs(next.missileCooldownJitterMinMs, cdFactor);
  next.missileCooldownJitterMaxMs = scaleCooldownMs(next.missileCooldownJitterMaxMs, cdFactor);
  next.salvoStepMinMs = scaleCooldownMs(next.salvoStepMinMs, cdFactor);
  next.salvoStepMaxMs = scaleCooldownMs(next.salvoStepMaxMs, cdFactor);
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
  const archetype = baseCombat.capitalShipArchetype ?? 'neutral';
  const flat = proficiencyFlatBonus(mult);
  const { strFlat, dexFlat } = resolveArchetypeStatBias(archetype, flat);
  const hullMult = resolveHullProficiencyMultiplier(mult, archetype);
  const strStat = Math.max(1, baseCombat.strStat + strFlat);
  const dexStat = Math.max(1, baseCombat.dexStat + dexFlat);

  const combat: NpcCapitalCombatStats = {
    ...baseCombat,
    maxHp: Math.max(1, Math.round(baseCombat.maxHp * hullMult)),
    maxShield: Math.max(0, Math.round(baseCombat.maxShield * hullMult)),
    armor: Math.max(0, baseCombat.armor + strFlat),
    attackBonus: baseCombat.attackBonus + strFlat,
    strStat,
    dexStat,
    damageDice: {
      ...baseCombat.damageDice,
      bonus: baseCombat.damageDice.bonus + strFlat,
    },
  };

  return {
    combat,
    runtimeConfig: scaleRuntimeMotion(runtimeConfig, mult, dexStat, archetype),
  };
}

/** 광물 업그레이드 DB 연동 전까지 입력 그대로 반환 */
export function applyMineralUpgradeToShipPerformance(
  perf: ShipPerformanceResult,
  _mineralUpgrades?: MineralUpgradeState,
): ShipPerformanceResult {
  return perf;
}
