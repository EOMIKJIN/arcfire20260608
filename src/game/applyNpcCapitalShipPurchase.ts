// ============================================================
// NPC 전함 테이블 사양 → PlayerShip 스냅샷(격납고 편성·출항 등에 재사용)
// ============================================================

import type { PlayerShip, ShipEquipSlotAssignment, ShipyardEquipSlotId, WeaponData } from '../types';
import { getNpcCapitalShip } from '../npc/npcFleetRegistry';
import { NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV } from '../data/generated';
import { buildWeaponDataFromCapitalWeaponId } from './capitalWeaponRange';
import { isSurvivalPodNpcShipId } from './survivalPodShip';
import { isEquipSlotFilled } from './combatWeaponSlots';
import { applyDefaultCombatLoadout } from './seedShipCombatEquipSlots';

function snapshotFilledEquipSlots(
  slots: PlayerShip['equipSlots'] | undefined,
): PlayerShip['preservedEquipSlots'] {
  if (!slots) return undefined;
  const out: Partial<Record<ShipyardEquipSlotId, ShipEquipSlotAssignment | null>> = {};
  for (const [key, slot] of Object.entries(slots)) {
    if (!isEquipSlotFilled(slot)) continue;
    out[key as ShipyardEquipSlotId] = {
      itemDefId: slot!.itemDefId,
      name: slot!.name,
    };
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * `npc_ai_ships.csv` id 기준으로 현재 함선 전투 스냅샷·무장·표시명·포트레이트를 덮어쓴다.
 * 속도·화물·장비·적재 화물은 유지한다.
 * 생존포드로 갈 때는 장착을 비우고 `preservedEquipSlots`에 남긴다. 다음 전함에서 되돌린다.
 */
export function applyNpcCapitalShipToPlayerShip(
  ship: PlayerShip,
  npcCapitalShipId: string,
): { ok: true; ship: PlayerShip } | { ok: false; reason: string } {
  const row = getNpcCapitalShip(npcCapitalShipId);
  if (!row) return { ok: false, reason: 'unknown_ship' };
  const cfg = NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV[npcCapitalShipId];
  const weapons: WeaponData[] = [];
  if (cfg?.laserWeaponId) {
    const lw = buildWeaponDataFromCapitalWeaponId(cfg.laserWeaponId);
    if (lw) weapons.push(lw);
  }
  if (cfg?.missileWeaponId) {
    const mw = buildWeaponDataFromCapitalWeaponId(cfg.missileWeaponId);
    if (mw) weapons.push(mw);
  }
  if (cfg?.closeRangeWeaponId) {
    const cw = buildWeaponDataFromCapitalWeaponId(cfg.closeRangeWeaponId);
    if (cw) weapons.push(cw);
  }
  if (cfg?.auxWeaponId) {
    const aw = buildWeaponDataFromCapitalWeaponId(cfg.auxWeaponId);
    if (aw) weapons.push(aw);
  }
  const c = row.combat;
  const enteringPod = isSurvivalPodNpcShipId(npcCapitalShipId);
  const comingFromPod = isSurvivalPodNpcShipId(ship.portraitNpcCapitalShipId);
  let equipSlots = ship.equipSlots;
  let preservedEquipSlots = ship.preservedEquipSlots;
  if (enteringPod) {
    equipSlots = {};
    if (!comingFromPod) {
      preservedEquipSlots = snapshotFilledEquipSlots(ship.equipSlots);
    }
  } else if (comingFromPod) {
    const restored = snapshotFilledEquipSlots(ship.preservedEquipSlots);
    if (restored) equipSlots = restored;
    preservedEquipSlots = undefined;
  }
  const merged: PlayerShip = {
    ...ship,
    name: row.name,
    portraitNpcCapitalShipId: npcCapitalShipId,
    maxHp: c.maxHp,
    hp: c.maxHp,
    maxShield: c.maxShield,
    shield: c.maxShield,
    armor: c.armor,
    weapons: enteringPod ? [] : ship.weapons.length > 0 ? [...ship.weapons] : weapons,
    weaponItems: enteringPod ? [] : ship.weaponItems,
    equipSlots,
    preservedEquipSlots,
  };
  return {
    ok: true,
    ship: applyDefaultCombatLoadout(merged),
  };
}
