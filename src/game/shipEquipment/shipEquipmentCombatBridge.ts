// ============================================================
// 함선 장비 → 전투 runtimeConfig(이동·선회·재장전·탐지) 연동
// HP·실드·장갑은 여기서 다시 더하지 않는다 — 이중 적용 정리(2026-10-10).
//   플레이어: shipStatPipeline(resolveShipEquipmentFlatStatBonus) 1회
//   NPC·트윈: applyShipEquipmentStatBonusToCombat 1회(숙련 전)
// ============================================================

import type { NpcCapitalShipCombatRuntimeConfig } from '../../data/generated/csvNpcCapitalShips';
import type { ShipPerformanceResult } from '../../combat/ShipPerformanceCalculator';
import type { PlayerShip } from '../../types';
import {
  aggregateShipEquipmentBonuses,
  type ShipEquipmentCombatBonuses,
} from './shipEquipmentModel';
import { shipEquipmentPolicy as P } from './shipEquipmentEffectPolicy';

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function scaleCooldownMs(value: number | undefined, factor: number, floor: number): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return value;
  return Math.max(floor, Math.round(value * factor));
}

function applyRuntimeEquipmentBonuses(
  runtime: NpcCapitalShipCombatRuntimeConfig | undefined,
  bonuses: ShipEquipmentCombatBonuses,
): NpcCapitalShipCombatRuntimeConfig | undefined {
  if (!runtime) return undefined;

  const speedMul = 1 + bonuses.speedBonusPct / 100 * P('runtime_speed_motion_mul');
  const maneuverMul = 1 + bonuses.maneuverBonusPct / 100 * P('runtime_maneuver_motion_mul');
  const motionMul = speedMul * maneuverMul;
  const cdFactor = clamp(1 - bonuses.cooldownReductionPct / 100, P('runtime_cooldown_factor_min'), 1);
  const cdFloor = P('runtime_cooldown_floor_ms');
  const detectMul = 1 + bonuses.detectRangeBonusPct / 100;

  const next: NpcCapitalShipCombatRuntimeConfig = { ...runtime };
  if (typeof next.maxMoveSpeedPxPerMs === 'number') {
    next.maxMoveSpeedPxPerMs = next.maxMoveSpeedPxPerMs * motionMul;
  }
  if (typeof next.accelPxPerMs2 === 'number') {
    next.accelPxPerMs2 = next.accelPxPerMs2 * motionMul;
  }
  if (typeof next.maxTurnRateRadPerMs === 'number') {
    next.maxTurnRateRadPerMs = next.maxTurnRateRadPerMs * maneuverMul;
  }
  if (typeof next.turnAccelRadPerMs2 === 'number') {
    next.turnAccelRadPerMs2 = next.turnAccelRadPerMs2 * maneuverMul;
  }
  if (typeof next.detectRangeScale === 'number') {
    next.detectRangeScale = next.detectRangeScale * detectMul;
  }

  next.laserCooldownJitterMinMs = scaleCooldownMs(next.laserCooldownJitterMinMs, cdFactor, cdFloor);
  next.laserCooldownJitterMaxMs = scaleCooldownMs(next.laserCooldownJitterMaxMs, cdFactor, cdFloor);
  next.missileCooldownJitterMinMs = scaleCooldownMs(next.missileCooldownJitterMinMs, cdFactor, cdFloor);
  next.missileCooldownJitterMaxMs = scaleCooldownMs(next.missileCooldownJitterMaxMs, cdFactor, cdFloor);
  next.salvoStepMinMs = scaleCooldownMs(next.salvoStepMinMs, cdFactor, cdFloor);
  next.salvoStepMaxMs = scaleCooldownMs(next.salvoStepMaxMs, cdFactor, cdFloor);

  return next;
}

/** 숙련·광물 강화 이후 장비의 전투 runtime 보너스만 적용(스탯은 위 머리말 참고) */
export function applyShipEquipmentToShipPerformance(
  perf: ShipPerformanceResult,
  equipSlots: PlayerShip['equipSlots'] | undefined,
): ShipPerformanceResult {
  const bonuses = aggregateShipEquipmentBonuses(equipSlots);
  const hasAny = Object.values(bonuses).some((v) => v > 0);
  if (!hasAny) return perf;
  return {
    combat: perf.combat,
    runtimeConfig: applyRuntimeEquipmentBonuses(perf.runtimeConfig, bonuses),
  };
}
