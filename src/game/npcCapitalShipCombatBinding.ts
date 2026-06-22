// ============================================================
// NPC 전함 — 테이블 equipSlots → 전투 스탯·runtime·agent knobs
// ============================================================

import type { NpcCapitalShipCombatRuntimeConfig } from '../data/generated/csvNpcCapitalShips';
import { calculateShipPerformance } from '../combat/ShipPerformanceCalculator';
import type { NpcCapitalCombatStats, NpcCapitalShip, PlayerShip } from '../types';
import {
  applyShipEquipmentToShipPerformance,
  aggregateShipEquipmentBonuses,
  resolveShipEquipmentAgentKnobs,
  type ShipEquipmentAgentKnobs,
} from './shipEquipment';
import { resolveNpcCapitalShipEquipSlots } from './npcCapitalShipEquipSlots';
import { isSurvivalPodNpcShipId } from './playerSurvivalPod';

export type NpcCapitalShipCombatBinding = {
  equipSlots: PlayerShip['equipSlots'];
  combatStats: NpcCapitalCombatStats;
  runtimeConfig: NpcCapitalShipCombatRuntimeConfig | undefined;
  equipmentAgentKnobs: ShipEquipmentAgentKnobs;
};

function readNpcProficiencyMultiplier(npcRow: NpcCapitalShip | undefined): number {
  const raw = (npcRow as NpcCapitalShip & { proficiencyMultiplier?: number })?.proficiencyMultiplier;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
  return 1;
}

function readNpcCombatLevel(npcRow: NpcCapitalShip | undefined): number {
  const raw = (npcRow as NpcCapitalShip & { combatLevel?: number })?.combatLevel;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return Math.floor(raw);
  return 1;
}

/** npc_capital_ship_equip_slots.csv + npc_ai_ships combat → 장비 반영 전투 바인딩 */
export function resolveNpcCapitalShipCombatBinding(input: {
  npcShipId: string;
  npcRow: NpcCapitalShip | undefined;
  runtimeConfig: NpcCapitalShipCombatRuntimeConfig | undefined;
}): NpcCapitalShipCombatBinding {
  const npcShipId = input.npcShipId.trim();
  const baseCombat = input.npcRow?.combat;
  if (!baseCombat || isSurvivalPodNpcShipId(npcShipId)) {
    const emptyKnobs = resolveShipEquipmentAgentKnobs(1, aggregateShipEquipmentBonuses(undefined));
    return {
      equipSlots: {},
      combatStats: baseCombat ?? {
        maxHp: 1,
        maxShield: 0,
        armor: 0,
        attackBonus: 0,
        damageDice: { count: 1, sides: 6, bonus: 0 },
        expReward: 0,
        strStat: 10,
        dexStat: 10,
        sizeClass: 0,
        capitalShipArchetype: 'neutral',
      },
      runtimeConfig: input.runtimeConfig,
      equipmentAgentKnobs: emptyKnobs,
    };
  }

  const equipSlots = resolveNpcCapitalShipEquipSlots(npcShipId);
  let perf = calculateShipPerformance(
    baseCombat,
    {
      level: readNpcCombatLevel(input.npcRow),
      proficiencyMultiplier: readNpcProficiencyMultiplier(input.npcRow),
    },
    input.runtimeConfig,
  );
  perf = applyShipEquipmentToShipPerformance(perf, equipSlots);
  const equipmentBonuses = aggregateShipEquipmentBonuses(equipSlots);
  const equipmentAgentKnobs = resolveShipEquipmentAgentKnobs(perf.combat.maxHp, equipmentBonuses);

  return {
    equipSlots,
    combatStats: perf.combat,
    runtimeConfig: perf.runtimeConfig ?? input.runtimeConfig,
    equipmentAgentKnobs,
  };
}
