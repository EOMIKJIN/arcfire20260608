// ============================================================
// 카탈로그/레거시 id → WeaponData — 전투 정본은 weapon_list.csv
// ============================================================

import type { WeaponData } from '../types';
import type { WeaponFamily, WeaponSystemCatalogEntry } from './catalogTypes';
import { getCapitalWeaponRow } from '../game/capitalWeaponRowLookup';
import { getDefaultItemCatalogRegistry } from './itemCatalogRegistry';

/** 구 ItemCatalog id → weapon_list.csv id (호환만 · 신규 사용 금지) */
const LEGACY_CATALOG_TO_WEAPON_LIST: Record<string, string> = {
  pulse_laser_i: 'w_laser_light_01',
  light_cannon: 'w_laser_light_01',
  defense_turret: 'w_laser_light_01',
};

/** D20 `WeaponData.type` 은 4종 — 카탈로그 세분 패밀리는 근접 계열로 매핑 */
function catalogFamilyToWeaponDataType(family: WeaponFamily): WeaponData['type'] {
  switch (family) {
    case 'laser':
    case 'plasma':
    case 'particle':
      return 'laser';
    case 'missile':
    case 'torpedo':
    case 'mine':
      return 'missile';
    case 'emp':
      return 'emp';
    case 'cannon':
    case 'railgun':
    case 'other':
    default:
      return 'cannon';
  }
}

export function weaponSystemToWeaponData(entry: WeaponSystemCatalogEntry): WeaponData {
  const { combat, id, displayName } = entry;
  return {
    id,
    catalogId: id,
    name: displayName,
    damageDice: combat.damageDice,
    attackBonus: combat.attackBonus,
    range: combat.range,
    type: catalogFamilyToWeaponDataType(combat.family),
  };
}

function weaponDataFromWeaponListId(weaponId: string): WeaponData | null {
  const row = getCapitalWeaponRow(weaponId);
  if (!row) return null;
  const diceSides = Math.max(4, Math.min(12, Math.round(row.damage)));
  return {
    id: row.id,
    name: row.name,
    type: row.kind === 'missile' ? 'missile' : 'laser',
    attackBonus: Math.max(0, Math.floor(row.damage)),
    range: Math.max(1, Math.floor(row.rangePx)),
    damageDice: {
      count: 1,
      sides: diceSides,
      bonus: Math.max(0, Math.floor(row.damage / 4)),
    },
  };
}

/**
 * 무기 WeaponData 조회 — **1순위 weapon_list.csv**, 2순위 레거시 ItemCatalog.
 * 신규 코드는 `getCapitalWeaponRow` / combat pipeline을 직접 쓸 것.
 */
export function weaponDataFromCatalogId(catalogId: string): WeaponData {
  const id = String(catalogId ?? '').trim();
  const mapped = LEGACY_CATALOG_TO_WEAPON_LIST[id] ?? id;
  const fromList = weaponDataFromWeaponListId(mapped);
  if (fromList) return fromList;

  const reg = getDefaultItemCatalogRegistry();
  const w = reg.getWeaponSystem(id);
  if (!w) {
    throw new Error(`[weaponDataFromCatalogId] unknown weapon id: ${catalogId}`);
  }
  return weaponSystemToWeaponData(w);
}
