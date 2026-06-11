// ============================================================
// 전함 기본 무장 → ship.equipSlots (WEAPON_1~4) 시드
// ============================================================

import type { PlayerShip, ShipyardEquipSlotId } from '../types';
import { buildWeaponDataFromCapitalWeaponId } from './capitalWeaponRange';
import { COMBAT_WEAPON_SLOT_IDS, isEquipSlotFilled } from './combatWeaponSlots';
import { clearSurvivalPodWeaponLoadout, isSurvivalPodNpcShipId } from './survivalPodShip';
import { resolveEquipSlotDisplayName, normalizeEquipSlotNamesFromTables } from './equipSlotDisplayName';
import { listDefaultWeaponItemDefIdsForNpcShip } from './grantNpcCapitalShipBundle';
import { weaponIdFromWeaponItemId } from './weaponItemId';

const WEAPON_SLOT_IDS: ShipyardEquipSlotId[] = [...COMBAT_WEAPON_SLOT_IDS];

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
  const npcPortraitId = ship.portraitNpcCapitalShipId?.trim();
  if (npcPortraitId && isSurvivalPodNpcShipId(npcPortraitId)) {
    return {};
  }
  const existing = sanitizeEquipSlots(ship.equipSlots ?? {});
  const allFilled = WEAPON_SLOT_IDS.every((slotId) => isEquipSlotFilled(existing[slotId]));
  if (allFilled) return normalizeEquipSlotNamesFromTables(existing);

  const npcId = ship.portraitNpcCapitalShipId?.trim();
  if (!npcId) return existing;

  const out = { ...existing };
  const defaultItemIds = listDefaultWeaponItemDefIdsForNpcShip(npcId);
  if (defaultItemIds.length === 0) return existing;

  WEAPON_SLOT_IDS.forEach((slotId, idx) => {
    // 장착됨·의도적 해제('0') 모두 유지 — 슬롯 키가 없을 때만 기본 무장 시드
    const cur = out[slotId]?.itemDefId?.trim();
    if (cur) return;
    const itemDefId = defaultItemIds[idx];
    if (!itemDefId) return;
    out[slotId] = {
      itemDefId,
      name: resolveEquipSlotDisplayName(itemDefId),
    };
  });
  return normalizeEquipSlotNamesFromTables(out);
}

/** equipSlots 정본 → weapons / weaponItems 동기(전투·조선소 표시) */
export function syncShipWeaponsFromEquipSlots(ship: PlayerShip): PlayerShip {
  if (isSurvivalPodNpcShipId(ship.portraitNpcCapitalShipId)) {
    return clearSurvivalPodWeaponLoadout(ship);
  }
  const slots = ship.equipSlots ?? {};
  const weapons = [...ship.weapons];
  const weaponItems = [...(ship.weaponItems ?? [])];
  const weaponIds = new Set(weapons.map((w) => w.id));
  const itemIds = new Set(weaponItems.map((w) => w.itemId));

  for (const slotId of WEAPON_SLOT_IDS) {
    const slot = slots[slotId];
    if (!slot?.itemDefId?.trim()) continue;
    const itemDefId = slot.itemDefId.trim();
    if (itemDefId === '0') continue;
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
        name: resolveEquipSlotDisplayName(itemDefId, slot.name),
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
    equipSlots: normalizeEquipSlotNamesFromTables(
      seedCombatEquipSlotsFromNpcDefaults(ship),
    ),
  };
  return syncShipWeaponsFromEquipSlots(withSlots);
}
