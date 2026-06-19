import { scoreCapitalCombatStats } from '../balance/capitalShipPerformancePricing';
import { getNpcCapitalShip } from '../../npc/npcFleetRegistry';
import type { TerritorialFactionSide } from './arcCoreTerritorialCombatPolicy';

export type TerritorialQuickCombatInput = {
  attackerShipIds: readonly string[];
  defenderShipIds: readonly string[];
  defenderAdvantagePct: number;
  combatNoisePct: number;
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
  const attackerPower = resolveFleetPower(input.attackerShipIds);
  const defenderPower = resolveFleetPower(input.defenderShipIds);
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

export function resolveHoldFactionSide(
  occupierClanId: string | null | undefined,
): TerritorialFactionSide | 'NEUTRAL' {
  if (!occupierClanId || occupierClanId === 'neutral') return 'NEUTRAL';
  if (occupierClanId === 'balance_seed_faction_red') return 'RED';
  if (occupierClanId === 'balance_seed_faction_blue') return 'BLUE';
  if (occupierClanId.includes('_red') || occupierClanId.includes('crimson')) return 'RED';
  if (occupierClanId.includes('_blue') || occupierClanId.includes('stellium')) return 'BLUE';
  return 'NEUTRAL';
}

export function opposingTerritorialSide(
  side: TerritorialFactionSide | 'NEUTRAL',
): TerritorialFactionSide {
  return side === 'RED' ? 'BLUE' : 'RED';
}
