// ============================================================
// 함선 장비 → ShipPerformanceCalculator / runtimeConfig 연동
// ============================================================

import type { NpcCapitalShipCombatRuntimeConfig } from '../../data/generated/csvNpcCapitalShips';
import type { ShipPerformanceResult } from '../../combat/ShipPerformanceCalculator';
import type { PlayerShip } from '../../types';
import {
  aggregateShipEquipmentBonuses,
  type ShipEquipmentCombatBonuses,
} from './shipEquipmentModel';

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function scaleCooldownMs(value: number | undefined, factor: number, floor = 40): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return value;
  return Math.max(floor, Math.round(value * factor));
}

function applyRuntimeEquipmentBonuses(
  runtime: NpcCapitalShipCombatRuntimeConfig | undefined,
  bonuses: ShipEquipmentCombatBonuses,
): NpcCapitalShipCombatRuntimeConfig | undefined {
  if (!runtime) return undefined;

  const speedMul = 1 + bonuses.speedBonusPct / 100 * 0.85;
  const maneuverMul = 1 + bonuses.maneuverBonusPct / 100 * 0.9;
  const motionMul = speedMul * maneuverMul;
  const cdFactor = clamp(1 - bonuses.cooldownReductionPct / 100, 0.72, 1);
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

  next.laserCooldownJitterMinMs = scaleCooldownMs(next.laserCooldownJitterMinMs, cdFactor);
  next.laserCooldownJitterMaxMs = scaleCooldownMs(next.laserCooldownJitterMaxMs, cdFactor);
  next.missileCooldownJitterMinMs = scaleCooldownMs(next.missileCooldownJitterMinMs, cdFactor);
  next.missileCooldownJitterMaxMs = scaleCooldownMs(next.missileCooldownJitterMaxMs, cdFactor);
  next.salvoStepMinMs = scaleCooldownMs(next.salvoStepMinMs, cdFactor);
  next.salvoStepMaxMs = scaleCooldownMs(next.salvoStepMaxMs, cdFactor);

  return next;
}

/** 숙련·광물 업그레이드 이후 장비 보너스 적용 */
export function applyShipEquipmentToShipPerformance(
  perf: ShipPerformanceResult,
  equipSlots: PlayerShip['equipSlots'] | undefined,
): ShipPerformanceResult {
  const bonuses = aggregateShipEquipmentBonuses(equipSlots);
  const hasAny = Object.values(bonuses).some((v) => v > 0);
  if (!hasAny) return perf;

  const combat = {
    ...perf.combat,
    damageDice: { ...perf.combat.damageDice },
  };

  const hpMul = 1 + bonuses.armorBonusPct / 100 * 0.12 + bonuses.powerEfficiencyPct / 100 * 0.05;
  const shieldMul = 1 + bonuses.shieldBonusPct / 100;
  const armorAdd = Math.round(combat.armor * (bonuses.armorBonusPct / 100));

  combat.maxHp = Math.max(1, Math.round(combat.maxHp * hpMul));
  combat.maxShield = Math.max(0, Math.round(combat.maxShield * shieldMul));
  combat.armor = Math.max(0, combat.armor + armorAdd);

  return {
    combat,
    runtimeConfig: applyRuntimeEquipmentBonuses(perf.runtimeConfig, bonuses),
  };
}
