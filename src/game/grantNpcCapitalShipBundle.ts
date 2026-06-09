// ============================================================
// 전함 지급 번들 — 함선 + npc_ai_ships 테이블 기본 무장(구매 완료와 동일)
// ============================================================

import { NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV } from '../data/generated';
import { getItemDef } from '../data/itemRegistry';
import type { PlayerShip } from '../types';
import {
  addToInventorySlotsMax,
  countGoodInInventory,
  type PlayerInventorySlot,
} from './playerInventory';
import { isWeaponItemId, weaponItemIdFromWeaponId } from './weaponItemId';
import { SHIPYARD_EQUIP_SLOT_DEFS } from './shipyardEquipSlots';

const WEAPON_SLOT_IDS = SHIPYARD_EQUIP_SLOT_DEFS
  .map((d) => d.id)
  .filter((id): id is 'WEAPON_1' | 'WEAPON_2' => id === 'WEAPON_1' || id === 'WEAPON_2');

const UNEQUIPPED_WEAPON_ITEM_ID = '0';

/** `npc_ai_ships.csv` laser/missileWeaponId → 인벤 `weapon_item_*` id */
export function listDefaultWeaponItemDefIdsForNpcShip(npcCapitalShipId: string): string[] {
  const runtime = NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV[npcCapitalShipId.trim()];
  if (!runtime) return [];
  const out: string[] = [];
  const laser = runtime.laserWeaponId?.trim();
  const missile = runtime.missileWeaponId?.trim();
  if (laser) out.push(weaponItemIdFromWeaponId(laser));
  if (missile) out.push(weaponItemIdFromWeaponId(missile));
  return out;
}

function weaponBuyPrice(itemDefId: string): number {
  return getItemDef(itemDefId)?.basePrice ?? 0;
}

/** 무료/기본 지급 — 전함 1 + 테이블 기본 무기(각 1)를 인벤에 적재 */
export function grantNpcCapitalShipBundleToInventory(
  slots: PlayerInventorySlot[],
  npcCapitalShipId: string,
  opts?: { shipBuyPrice?: number },
): PlayerInventorySlot[] {
  let next = slots;
  const shipItemId = `capital_ship_${npcCapitalShipId.trim()}`;
  next = addToInventorySlotsMax(next, shipItemId, 1, opts?.shipBuyPrice ?? 0).slots;
  for (const itemDefId of listDefaultWeaponItemDefIdsForNpcShip(npcCapitalShipId)) {
    if (countGoodInInventory(next, itemDefId) >= 1) continue;
    next = addToInventorySlotsMax(next, itemDefId, 1, weaponBuyPrice(itemDefId)).slots;
  }
  return next;
}

/** 장착 중인 무기는 인벤에 최소 1개 보유(구매 후 장착 흐름과 동일) */
export function reconcileEquippedWeaponsInInventory(
  slots: PlayerInventorySlot[],
  ship: PlayerShip,
): PlayerInventorySlot[] {
  let next = slots;
  for (const slotId of WEAPON_SLOT_IDS) {
    const itemDefId = ship.equipSlots?.[slotId]?.itemDefId?.trim();
    if (!itemDefId || itemDefId === UNEQUIPPED_WEAPON_ITEM_ID) continue;
    if (!isWeaponItemId(itemDefId)) continue;
    if (countGoodInInventory(next, itemDefId) >= 1) continue;
    next = addToInventorySlotsMax(next, itemDefId, 1, weaponBuyPrice(itemDefId)).slots;
  }
  return next;
}
