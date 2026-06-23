// ============================================================
// 내구도 도메인 — 무기·장비·전함 선체
// ============================================================

import type { CargoItem, Player, PlayerHangarShip, PlayerShip, ShipEquipSlotAssignment, ShipyardEquipSlotId, WeaponData } from '../../types';
import { CAPITAL_WEAPON_LIST_FROM_CSV } from '../../data/generated';
import { buildWeaponDataFromCapitalRow } from '../capitalWeaponRange';
import { isWeaponItemId } from '../weaponItemBridge';
import { isShipEquipmentItemId } from '../shipEquipment';
import { isSurvivalPodNpcShipId } from '../survivalPodIds';
import { COMBAT_WEAPON_SLOT_IDS, UNEQUIPPED_WEAPON_ITEM_ID } from '../combatWeaponSlots';
import { SHIPYARD_EQUIP_SLOT_DEFS } from '../shipyardEquipSlots';
import { resolveCapitalShipPerformanceBasePrice } from '../../arcCore/balance/capitalShipPerformancePricing';
import {
  getCapitalShipDurabilityPolicy,
  resolveItemWearPerCombatPct,
  rollCapitalShipWearPerCombatPct,
} from './durabilityPolicy';
import type { PlayerInventorySlot } from '../playerInventory';

export const DURABILITY_DEFAULT_PCT = 100;
export const DURABILITY_MIN_PCT = 0;

export function isDurabilityTrackedInventoryGoodId(goodId: string): boolean {
  return isWeaponItemId(goodId) || isShipEquipmentItemId(goodId);
}

export function resolveDurabilityPct(raw: number | undefined | null): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return DURABILITY_DEFAULT_PCT;
  return Math.max(DURABILITY_MIN_PCT, Math.min(DURABILITY_DEFAULT_PCT, raw));
}

export function resolvePlayerShipDurabilityPct(ship: PlayerShip | null | undefined): number {
  if (!ship) return DURABILITY_MIN_PCT;
  return resolveDurabilityPct(ship.durabilityPct);
}

export function isPlayerShipHullOperable(ship: PlayerShip | null | undefined): boolean {
  if (!ship) return false;
  if (isSurvivalPodNpcShipId(ship.portraitNpcCapitalShipId)) return false;
  return resolvePlayerShipDurabilityPct(ship) > DURABILITY_MIN_PCT;
}

export function normalizeCargoItemDurability(cell: CargoItem): CargoItem {
  if (!isDurabilityTrackedInventoryGoodId(cell.goodId)) return cell;
  return {
    ...cell,
    durabilityPct: resolveDurabilityPct(cell.durabilityPct),
  };
}

export function syncCurrentShipDurabilityToHangar(
  ship: PlayerShip,
  hangar: PlayerHangarShip[],
): PlayerHangarShip[] {
  const npcId = ship.portraitNpcCapitalShipId?.trim();
  if (!npcId || isSurvivalPodNpcShipId(npcId)) return hangar;
  const pct = resolvePlayerShipDurabilityPct(ship);
  return hangar.map((entry) =>
    entry.npcCapitalShipId === npcId ? { ...entry, durabilityPct: pct } : entry,
  );
}

export function resolveHangarShipDurabilityPct(
  hangar: PlayerHangarShip[],
  npcCapitalShipId: string | undefined,
): number {
  const id = npcCapitalShipId?.trim();
  if (!id) return DURABILITY_DEFAULT_PCT;
  const entry = hangar.find((h) => h.npcCapitalShipId === id);
  return resolveDurabilityPct(entry?.durabilityPct);
}

function weaponIdFromSlotItemDef(itemDefId: string | null | undefined): string {
  const raw = String(itemDefId ?? '').trim();
  if (!raw || raw === UNEQUIPPED_WEAPON_ITEM_ID) return '';
  return raw.replace(/^weapon_item_/, '').trim();
}

function rebuildWeaponsFromEquipSlots(
  equipSlots: Partial<Record<ShipyardEquipSlotId, ShipEquipSlotAssignment | null>>,
): WeaponData[] {
  return COMBAT_WEAPON_SLOT_IDS
    .map((slotId) => equipSlots?.[slotId]?.itemDefId ?? '')
    .map((itemDefId) => weaponIdFromSlotItemDef(itemDefId))
    .map((weaponId) => CAPITAL_WEAPON_LIST_FROM_CSV[weaponId])
    .filter((w): w is NonNullable<typeof w> => Boolean(w))
    .map((w) => buildWeaponDataFromCapitalRow(w));
}

function isEquippedSlotAssignment(
  slot: ShipEquipSlotAssignment | null | undefined,
): slot is ShipEquipSlotAssignment {
  if (!slot?.itemDefId) return false;
  if (slot.itemDefId === UNEQUIPPED_WEAPON_ITEM_ID) return false;
  return isWeaponItemId(slot.itemDefId) || isShipEquipmentItemId(slot.itemDefId);
}

function findInventoryIndexForEquippedItem(
  slots: PlayerInventorySlot[],
  slot: ShipEquipSlotAssignment,
): number {
  const preferred = slot.sourceInventoryIndex;
  if (
    typeof preferred === 'number'
    && preferred >= 0
    && preferred < slots.length
    && slots[preferred]?.goodId === slot.itemDefId
  ) {
    return preferred;
  }
  for (let i = 0; i < slots.length; i += 1) {
    if (slots[i]?.goodId === slot.itemDefId) return i;
  }
  return -1;
}

function clearEquipSlot(
  equipSlots: Partial<Record<ShipyardEquipSlotId, ShipEquipSlotAssignment | null>>,
  slotId: ShipyardEquipSlotId,
): Partial<Record<ShipyardEquipSlotId, ShipEquipSlotAssignment | null>> {
  const next = { ...equipSlots };
  if (COMBAT_WEAPON_SLOT_IDS.includes(slotId as typeof COMBAT_WEAPON_SLOT_IDS[number])) {
    next[slotId] = { itemDefId: UNEQUIPPED_WEAPON_ITEM_ID, name: '' };
  } else {
    delete next[slotId];
  }
  return next;
}

export function backfillEquipSlotInventoryIndices(
  ship: PlayerShip,
  inventorySlots: PlayerInventorySlot[],
): PlayerShip {
  const equipSlots = { ...(ship.equipSlots ?? {}) };
  const claimed = new Set<number>();
  const slotIds: ShipyardEquipSlotId[] = [
    ...COMBAT_WEAPON_SLOT_IDS,
    ...SHIPYARD_EQUIP_SLOT_DEFS.map((d) => d.id),
  ];

  for (const slotId of slotIds) {
    const assignment = equipSlots[slotId];
    if (!isEquippedSlotAssignment(assignment)) continue;
    if (
      typeof assignment.sourceInventoryIndex === 'number'
      && assignment.sourceInventoryIndex >= 0
      && assignment.sourceInventoryIndex < inventorySlots.length
      && inventorySlots[assignment.sourceInventoryIndex]?.goodId === assignment.itemDefId
    ) {
      claimed.add(assignment.sourceInventoryIndex);
      continue;
    }
    const index = findInventoryIndexForEquippedItem(inventorySlots, assignment);
    if (index >= 0 && !claimed.has(index)) {
      equipSlots[slotId] = { ...assignment, sourceInventoryIndex: index };
      claimed.add(index);
    }
  }

  return { ...ship, equipSlots };
}

export interface PostCombatDurabilityResult {
  player: Player;
  destroyedItemLabels: string[];
}

/** 전투 종료 1회 — 장착 무기·장비·탑승 전함 선체 마모 */
export function applyPostCombatDurabilityPass(
  player: Player,
  combatSeed = Date.now(),
): PostCombatDurabilityResult {
  if (isSurvivalPodNpcShipId(player.ship.portraitNpcCapitalShipId)) {
    return { player, destroyedItemLabels: [] };
  }

  let slots = player.inventorySlots.map((cell) => (cell ? { ...cell } : null));
  let equipSlots = { ...(player.ship.equipSlots ?? {}) };
  const destroyedItemLabels: string[] = [];

  const slotIds: ShipyardEquipSlotId[] = [
    ...COMBAT_WEAPON_SLOT_IDS,
    ...SHIPYARD_EQUIP_SLOT_DEFS.map((d) => d.id),
  ];

  for (const slotId of slotIds) {
    const assignment = equipSlots[slotId];
    if (!isEquippedSlotAssignment(assignment)) continue;

    const wear = resolveItemWearPerCombatPct(assignment.itemDefId);
    const invIndex = findInventoryIndexForEquippedItem(slots, assignment);
    if (invIndex < 0) continue;

    const cell = slots[invIndex];
    if (!cell) continue;

    const nextPct = resolveDurabilityPct(cell.durabilityPct) - wear;
    if (nextPct <= DURABILITY_MIN_PCT) {
      slots[invIndex] = null;
      equipSlots = clearEquipSlot(equipSlots, slotId);
      destroyedItemLabels.push(assignment.name || assignment.itemDefId);
      continue;
    }

    slots[invIndex] = { ...cell, durabilityPct: nextPct };
  }

  let ship: PlayerShip = {
    ...player.ship,
    equipSlots,
    weapons: rebuildWeaponsFromEquipSlots(equipSlots),
  };
  if (!isSurvivalPodNpcShipId(ship.portraitNpcCapitalShipId)) {
    const hullWear = rollCapitalShipWearPerCombatPct(combatSeed);
    ship = {
      ...ship,
      durabilityPct: Math.max(
        DURABILITY_MIN_PCT,
        resolvePlayerShipDurabilityPct(ship) - hullWear,
      ),
    };
  }

  const shipHangar = syncCurrentShipDurabilityToHangar(ship, player.shipHangar);

  return {
    player: {
      ...player,
      ship,
      inventorySlots: slots,
      shipHangar,
    },
    destroyedItemLabels,
  };
}

export function resolveCapitalShipRepairCost(
  ship: PlayerShip,
  inventorySlots: PlayerInventorySlot[],
): number {
  const policy = getCapitalShipDurabilityPolicy();
  const durabilityPct = resolvePlayerShipDurabilityPct(ship);
  if (durabilityPct >= DURABILITY_DEFAULT_PCT) return 0;

  const npcId = ship.portraitNpcCapitalShipId?.trim();
  let referencePrice = 0;
  if (npcId) {
    referencePrice = resolveCapitalShipPerformanceBasePrice(npcId);
  }
  if (referencePrice <= 0) {
    const itemId = npcId ? `capital_ship_${npcId}` : '';
    if (itemId) {
      for (const cell of inventorySlots) {
        if (cell?.goodId === itemId && cell.buyPrice > 0) {
          referencePrice = cell.buyPrice;
          break;
        }
      }
    }
  }
  if (referencePrice <= 0) referencePrice = policy.repairFloorCredits * 10;

  const missingPct = DURABILITY_DEFAULT_PCT - durabilityPct;
  const raw = referencePrice * (missingPct / DURABILITY_DEFAULT_PCT) * policy.repairCostRatio;
  return Math.max(policy.repairFloorCredits, Math.ceil(raw));
}

export function repairActiveShipHull(player: Player): Player | null {
  if (isSurvivalPodNpcShipId(player.ship.portraitNpcCapitalShipId)) return null;
  const cost = resolveCapitalShipRepairCost(player.ship, player.inventorySlots);
  const durabilityPct = resolvePlayerShipDurabilityPct(player.ship);
  if (durabilityPct >= DURABILITY_DEFAULT_PCT) return null;
  if (player.credits < cost) return null;

  const ship: PlayerShip = {
    ...player.ship,
    durabilityPct: DURABILITY_DEFAULT_PCT,
  };
  const shipHangar = syncCurrentShipDurabilityToHangar(ship, player.shipHangar);

  return {
    ...player,
    ship,
    shipHangar,
    credits: player.credits - cost,
  };
}
