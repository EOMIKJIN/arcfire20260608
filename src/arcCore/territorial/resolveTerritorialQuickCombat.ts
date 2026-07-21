import { scoreCapitalCombatStats } from '../balance/capitalShipPerformancePricing';
import { getNpcCapitalShip } from '../../npc/npcFleetRegistry';

export type TerritorialQuickCombatInput = {
  attackerShipIds: readonly string[];
  defenderShipIds: readonly string[];
  defenderAdvantagePct: number;
  combatNoisePct: number;
  /** 보급선 배율 — 고립 <1 · 보급 확보 ≥1 (기본 1) */
  attackerSupplyMul?: number;
  defenderSupplyMul?: number;
};

export type TerritorialQuickCombatResult = {
  winner: 'attacker' | 'defender';
  attackerPower: number;
  defenderPower: number;
  attackerEffective: number;
  defenderEffective: number;
};

function resolveFleetPower(shipIds: readonly string[]): number {
  let total = 0;
  for (let i = 0; i < shipIds.length; i += 1) {
    const ship = getNpcCapitalShip(shipIds[i]!);
    if (!ship) continue;
    total += scoreCapitalCombatStats(ship.combat);
  }
  return Math.max(1, total);
}

function applyNoise(base: number, noisePct: number): number {
  if (noisePct <= 0) return base;
  const spread = noisePct / 100;
  const factor = 1 + (Math.random() * 2 - 1) * spread;
  return base * factor;
}

/** 일반전투 규칙 기반 빠른 전투 해상(스탯·주사위 가중 합산 + 방어 우세·잡음) */
export function resolveTerritorialQuickCombat(
  input: TerritorialQuickCombatInput,
): TerritorialQuickCombatResult {
  const attackerSupplyMul = input.attackerSupplyMul ?? 1;
  const defenderSupplyMul = input.defenderSupplyMul ?? 1;
  const attackerPower = resolveFleetPower(input.attackerShipIds) * attackerSupplyMul;
  const defenderPower = resolveFleetPower(input.defenderShipIds) * defenderSupplyMul;
  const defBonus = 1 + Math.max(0, input.defenderAdvantagePct) / 100;
  const attackerEffective = applyNoise(attackerPower, input.combatNoisePct);
  const defenderEffective = applyNoise(defenderPower * defBonus, input.combatNoisePct);
  const winner = attackerEffective > defenderEffective ? 'attacker' : 'defender';
  return {
    winner,
    attackerPower,
    defenderPower,
    attackerEffective,
    defenderEffective,
  };
}

// 팩션 side 판정 — 정본은 territorialFactionSide.ts (경량 모듈) · 기존 import 호환 재수출
export { opposingTerritorialSide, resolveHoldFactionSide } from './territorialFactionSide';
