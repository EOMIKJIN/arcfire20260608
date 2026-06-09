// ============================================================
// 전함 기본 무장 → ship.equipSlots (WEAPON_1/2) 시드
// ============================================================

import { ITEM_DEFS_FROM_CSV } from '../data/generated';
import type { PlayerShip, ShipyardEquipSlotId } from '../types';
import { buildWeaponDataFromCapitalWeaponId } from './capitalWeaponRange';
import { listDefaultWeaponItemDefIdsForNpcShip } from './grantNpcCapitalShipBundle';
import { weaponIdFromWeaponItemId } from './weaponItemId';

const WEAPON_SLOT_IDS: ShipyardEquipSlotId[] = ['WEAPON_1', 'WEAPON_2'];

function sanitizeEquipSlots(raw: PlayerShip['equipSlots'] | unknown): NonNullable<PlayerShip['equipSlots']> {
  if (!raw || typeof raw !== 'object') return {};
  const out: NonNullable<PlayerShip['equipSlots']> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!WEAPON_SLOT_IDS.includes(k as ShipyardEquipSlotId)) continue;
    if (!v || typeof v !== 'object') continue;
    const o = v as Record<string, unknown>;
    if (typeof o.itemDefId !== 'string' || typeof o.name !== 'string') continue;
    const itemDefId = o.itemDefId.trim();
    const name = o.name.trim();
    if (!itemDefId || !name) continue;
    out[k as ShipyardEquipSlotId] = { itemDefId, name };
  }
  return out;
}

/** NPC 전함 테이블 무장 → 비어 있는 WEAPON 슬롯만 채움 */
export function seedCombatEquipSlotsFromNpcDefaults(
  ship: PlayerShip,
): NonNullable<PlayerShip['equipSlots']> {
  const existing = sanitizeEquipSlots(ship.equipSlots ?? {});
  const hasWeapon1 = Boolean(existing.WEAPON_1?.itemDefId?.trim());
  const hasWeapon2 = Boolean(existing.WEAPON_2?.itemDefId?.trim());
  if (hasWeapon1 && hasWeapon2) return existing;

  const npcId = ship.portraitNpcCapitalShipId?.trim();
  if (!npcId) return existing;

  const out = { ...existing };
  const defaultItemIds = listDefaultWeaponItemDefIdsForNpcShip(npcId);
  if (defaultItemIds.length === 0) return existing;
  if (!hasWeapon1 && defaultItemIds[0]) {
    const itemDefId = defaultItemIds[0];
    const weaponId = weaponIdFromWeaponItemId(itemDefId) ?? itemDefId;
    const def = ITEM_DEFS_FROM_CSV[itemDefId];
    out.WEAPON_1 = { itemDefId, name: def?.name ?? weaponId };
  }
  if (!hasWeapon2 && defaultItemIds[1]) {
    const itemDefId = defaultItemIds[1];
    const weaponId = weaponIdFromWeaponItemId(itemDefId) ?? itemDefId;
    const def = ITEM_DEFS_FROM_CSV[itemDefId];
    out.WEAPON_2 = { itemDefId, name: def?.name ?? weaponId };
  }
  return out;
}

/** equipSlots 정본 → weapons / weaponItems 동기(전투·조선소 표시) */
export function syncShipWeaponsFromEquipSlots(ship: PlayerShip): PlayerShip {
  const slots = ship.equipSlots ?? {};
  const weapons = [...ship.weapons];
  const weaponItems = [...(ship.weaponItems ?? [])];
  const weaponIds = new Set(weapons.map((w) => w.id));
  const itemIds = new Set(weaponItems.map((w) => w.itemId));

  for (const slotId of WEAPON_SLOT_IDS) {
    const slot = slots[slotId];
    if (!slot?.itemDefId?.trim()) continue;
    const itemDefId = slot.itemDefId.trim();
    const weaponId = itemDefId.replace(/^weapon_item_/, '').trim();
    if (!weaponId) continue;
    const built = buildWeaponDataFromCapitalWeaponId(weaponId);
    if (built && !weaponIds.has(built.id)) {
      weapons.push(built);
      weaponIds.add(built.id);
    }
    if (!itemIds.has(itemDefId)) {
      weaponItems.push({
        itemId: itemDefId,
        weaponId,
        name: slot.name,
        type: built?.type ?? 'laser',
      });
      itemIds.add(itemDefId);
    }
  }

  if (weapons.length === 0) return ship;
  return { ...ship, weapons, weaponItems };
}

export function applyDefaultCombatLoadout(ship: PlayerShip): PlayerShip {
  const withSlots = {
    ...ship,
    equipSlots: seedCombatEquipSlotsFromNpcDefaults(ship),
  };
  return syncShipWeaponsFromEquipSlots(withSlots);
}
