// ============================================================
// NPC 전함 테이블 사양 → PlayerShip 스냅샷(격납고 편성·출항 등에 재사용)
// ============================================================

import type { PlayerShip, WeaponData } from '../types';
import {
  NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV,
  NPC_CAPITAL_SHIPS_FROM_CSV,
} from '../data/generated';
import { buildWeaponDataFromCapitalWeaponId } from './capitalWeaponRange';
import { isSurvivalPodNpcShipId } from './survivalPodShip';
import { applyDefaultCombatLoadout } from './seedShipCombatEquipSlots';

/**
 * `npc_ai_ships.csv` id 기준으로 현재 함선 전투 스냅샷·무장·표시명·포트레이트를 덮어쓴다.
 * 속도·화물·장비·적재 화물은 유지한다.
 */
export function applyNpcCapitalShipToPlayerShip(
  ship: PlayerShip,
  npcCapitalShipId: string,
): { ok: true; ship: PlayerShip } | { ok: false; reason: string } {
  const row = NPC_CAPITAL_SHIPS_FROM_CSV.find(s => s.id === npcCapitalShipId);
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
  const isSurvivalPod = isSurvivalPodNpcShipId(npcCapitalShipId);
  const merged: PlayerShip = {
    ...ship,
    name: row.name,
    portraitNpcCapitalShipId: npcCapitalShipId,
    maxHp: c.maxHp,
    hp: c.maxHp,
    maxShield: c.maxShield,
    shield: c.maxShield,
    armor: c.armor,
    weapons: isSurvivalPod ? [] : ship.weapons.length > 0 ? [...ship.weapons] : weapons,
    weaponItems: isSurvivalPod ? [] : ship.weaponItems,
    equipSlots: isSurvivalPod ? {} : ship.equipSlots,
  };
  return {
    ok: true,
    ship: applyDefaultCombatLoadout(merged),
  };
}
