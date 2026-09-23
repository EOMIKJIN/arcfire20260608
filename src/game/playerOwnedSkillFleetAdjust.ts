// ============================================================
// 함대 스킬 — 격납고 · 화물 슬롯 (습득/견적 1회)
// ============================================================

import { sumOwnedSkillStatBonus } from './ownedSkillStatBonus';
import { resolveSkillAutoCombatPolicy } from './skillAutoCombatPolicy';

/** `playerInventory.PLAYER_INVENTORY_SLOT_COUNT`와 동기. 여기선 인벤 모듈을 읽지 않는다(테스트 PNG 순환 방지) */
const BASE_INVENTORY_SLOTS = 100;

function readOwnedSkillIds(ownedSkillIds?: readonly string[]): readonly string[] {
  if (ownedSkillIds) return ownedSkillIds;
  const { usePlayerStore } = require('../store/playerStore') as typeof import('../store/playerStore');
  return usePlayerStore.getState().player?.skills ?? [];
}

export function resolvePlayerCargoSlotBonus(ownedSkillIds?: readonly string[]): number {
  const policy = resolveSkillAutoCombatPolicy();
  const raw = Math.max(0, sumOwnedSkillStatBonus('cargo_capacity', readOwnedSkillIds(ownedSkillIds)));
  return Math.min(policy.cargoSlotBonusCap, raw);
}

export function resolvePlayerInventorySlotCount(ownedSkillIds?: readonly string[]): number {
  return BASE_INVENTORY_SLOTS + resolvePlayerCargoSlotBonus(ownedSkillIds);
}

export function resolvePlayerHangarShipCap(ownedSkillIds?: readonly string[]): number {
  const policy = resolveSkillAutoCombatPolicy();
  const owned = readOwnedSkillIds(ownedSkillIds);
  const bonus = Math.max(0, sumOwnedSkillStatBonus('fleet_slot', owned))
    + Math.max(0, sumOwnedSkillStatBonus('fleet_size', owned));
  return policy.hangarBase + Math.min(policy.hangarSlotBonusCap, bonus);
}

const HULL_DURABILITY_CAP = 100;

export function applyRepairDroneDurabilityHeal(
  durabilityPct: number,
  ownedSkillIds?: readonly string[],
): number {
  const step = Math.max(0, sumOwnedSkillStatBonus('fleet_regen', readOwnedSkillIds(ownedSkillIds)));
  if (step <= 0) return Math.max(0, Math.min(HULL_DURABILITY_CAP, durabilityPct));
  return Math.min(HULL_DURABILITY_CAP, Math.max(0, durabilityPct) + step);
}

let lastRepairDroneHealAtMs = 0;

export function resetRepairDroneHubPresence(): void {
  lastRepairDroneHealAtMs = 0;
}

export function resetRepairDroneHubPresenceForTests(): void {
  resetRepairDroneHubPresence();
}

/** 허브 착륙·포커스 1회. 틱/루프 금지. fleet_regen=%p */
export function tryApplyRepairDroneOnHubPresence(nowMs: number = Date.now()): boolean {
  const policy = resolveSkillAutoCombatPolicy();
  if (nowMs - lastRepairDroneHealAtMs < policy.repairDroneHubIntervalMs) return false;

  const { usePlayerStore } = require('../store/playerStore') as typeof import('../store/playerStore');
  const store = usePlayerStore.getState();
  const player = store.player;
  if (!player) return false;
  const owned = player.skills ?? [];
  const step = Math.max(0, sumOwnedSkillStatBonus('fleet_regen', owned));
  if (step <= 0) return false;

  const shipPct = typeof player.ship.durabilityPct === 'number' ? player.ship.durabilityPct : HULL_DURABILITY_CAP;
  const nextShipPct = applyRepairDroneDurabilityHeal(shipPct, owned);
  const hangar = player.shipHangar;
  let hangarChanged = false;
  const nextHangar = hangar.map((entry) => {
    const pct = typeof entry.durabilityPct === 'number' ? entry.durabilityPct : HULL_DURABILITY_CAP;
    const healed = applyRepairDroneDurabilityHeal(pct, owned);
    if (healed === pct) return entry;
    hangarChanged = true;
    return { ...entry, durabilityPct: healed };
  });
  if (nextShipPct === shipPct && !hangarChanged) return false;

  lastRepairDroneHealAtMs = nowMs;
  usePlayerStore.setState({
    player: {
      ...player,
      ship: { ...player.ship, durabilityPct: nextShipPct },
      shipHangar: hangarChanged ? nextHangar : hangar,
    },
  });
  store.schedulePersist();
  const { presentSkillProcBanner, SKILL_PROC_LABEL } = require('./skillProcBanner') as typeof import('./skillProcBanner');
  presentSkillProcBanner(SKILL_PROC_LABEL.repairDrone);
  return true;
}
