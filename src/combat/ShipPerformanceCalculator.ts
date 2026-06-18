// ============================================================
// 전함 전투 성능 — 숙련 계수 배율 (docs/_player-combat-proficiency-system.md §5.2)
// 파이터/레인저 구분 스탯 — npc_ai_ships.csv capitalShipArchetype
// ============================================================

import type { CapitalShipArchetype, NpcCapitalCombatStats } from '../types';
import type { NpcCapitalShipCombatRuntimeConfig } from '../data/generated/csvNpcCapitalShips';
import {
  computeMineralUpgradeEffectScalar,
  getMineralUpgradeStatDef,
} from '../game/shipyardMineralUpgrade/mineralUpgradeModel';

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

function clampCooldown(value: number | undefined, factor: number, floor: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return value;
  return Math.max(floor, Math.round(value * factor));
}

/**
 * 조선소 광물 업그레이드(statId→level)를 전함 성능에 적용.
 * 정본: mineralUpgradeModel(기존 테이블). 플레이어 함선에만 적용(적 NPC 미적용).
 * v1 매핑: HP/실드(가산) · 선회율(배수) · 무기 쿨다운(배수, 하한) · 무기 데미지(damageDice.bonus 가산).
 * 사거리(weapon_range_flat)는 per-weapon 해석이라 본 경유 미적용(후속 보완).
 */
export function applyMineralUpgradeToShipPerformance(
  perf: ShipPerformanceResult,
  mineralUpgrades?: MineralUpgradeState,
): ShipPerformanceResult {
  if (!mineralUpgrades) return perf;
  const entries = Object.entries(mineralUpgrades).filter(
    ([, lv]) => Number.isFinite(lv) && (lv as number) > 0,
  );
  if (entries.length === 0) return perf;

  const combat: NpcCapitalCombatStats = {
    ...perf.combat,
    damageDice: { ...perf.combat.damageDice },
  };
  const runtime: NpcCapitalShipCombatRuntimeConfig | undefined = perf.runtimeConfig
    ? { ...perf.runtimeConfig }
    : perf.runtimeConfig;

  for (const [statId, level] of entries) {
    const def = getMineralUpgradeStatDef(statId);
    if (!def) continue;
    const scalar = computeMineralUpgradeEffectScalar(statId, level as number);
    switch (def.effectKind) {
      case 'ship_bonus_max_hp':
        combat.maxHp = Math.max(1, Math.round(combat.maxHp + scalar));
        break;
      case 'ship_bonus_max_shield':
        combat.maxShield = Math.max(0, Math.round(combat.maxShield + scalar));
        break;
      case 'ship_turn_rate_mul_per_level':
        if (runtime && typeof runtime.maxTurnRateRadPerMs === 'number') {
          runtime.maxTurnRateRadPerMs = runtime.maxTurnRateRadPerMs * scalar;
        }
        break;
      case 'weapon_damage_flat':
        combat.damageDice = {
          ...combat.damageDice,
          bonus: combat.damageDice.bonus + Math.round(scalar),
        };
        break;
      case 'weapon_fire_rate_cooldown':
        if (runtime) {
          if (def.upgradeGroup === 'weapon_laser') {
            runtime.laserCooldownJitterMinMs = clampCooldown(runtime.laserCooldownJitterMinMs, scalar, def.effectFloor);
            runtime.laserCooldownJitterMaxMs = clampCooldown(runtime.laserCooldownJitterMaxMs, scalar, def.effectFloor);
          } else if (def.upgradeGroup === 'weapon_missile') {
            runtime.missileCooldownJitterMinMs = clampCooldown(runtime.missileCooldownJitterMinMs, scalar, def.effectFloor);
            runtime.missileCooldownJitterMaxMs = clampCooldown(runtime.missileCooldownJitterMaxMs, scalar, def.effectFloor);
          }
        }
        break;
      case 'weapon_range_flat':
        // v1 보류: 사거리는 per-weapon 해석 경로(ag.laserEngageRangePx 등)라 본 경유로 적용하지 않음.
        break;
    }
  }

  return { combat, runtimeConfig: runtime };
}
