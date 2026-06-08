// ============================================================
// NPC 전함 테이블 사양 → PlayerShip 스냅샷(격납고 편성·출항 등에 재사용)
// ============================================================

import type { PlayerShip, WeaponData } from '../types';
import {
  CAPITAL_WEAPON_LIST_FROM_CSV,
  NPC_CAPITAL_SHIP_COMBAT_RUNTIME_CONFIG_FROM_CSV,
  NPC_CAPITAL_SHIPS_FROM_CSV,
} from '../data/generated';

function weaponFromCapitalWeaponId(weaponId: string): WeaponData | null {
  const w = CAPITAL_WEAPON_LIST_FROM_CSV[weaponId];
  if (!w) return null;
  const sides = Math.max(6, Math.min(14, w.damage + 4));
  return {
    id: w.id,
    catalogId: w.id,
    name: w.name,
    type: w.kind,
    attackBonus: Math.max(0, Math.floor(w.damage * 0.8)),
    range: Math.min(900, Math.max(420, Math.round(w.rangePx * 3.2))),
    damageDice: { count: 1, sides, bonus: 0 },
  };
}

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
    const lw = weaponFromCapitalWeaponId(cfg.laserWeaponId);
    if (lw) weapons.push(lw);
  }
  if (cfg?.missileWeaponId) {
    const mw = weaponFromCapitalWeaponId(cfg.missileWeaponId);
    if (mw) weapons.push(mw);
  }
  // 전함 교체 시에도 현재 계정 무기 로드아웃(공용)을 우선 유지한다.
  const nextWeapons = ship.weapons.length > 0 ? [...ship.weapons] : weapons;
  const c = row.combat;
  return {
    ok: true,
    ship: {
      ...ship,
      name: row.name,
      portraitNpcCapitalShipId: npcCapitalShipId,
      maxHp: c.maxHp,
      hp: c.maxHp,
      maxShield: c.maxShield,
      shield: c.maxShield,
      armor: c.armor,
      weapons: nextWeapons,
    },
  };
}
