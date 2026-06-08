// ============================================================
// 카탈로그 무기 → 기존 WeaponData / 전투 엔진 브리지
// ============================================================

import type { WeaponData } from '../types';
import type { WeaponFamily, WeaponSystemCatalogEntry } from './catalogTypes';
import { getDefaultItemCatalogRegistry } from './itemCatalogRegistry';

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

export function weaponDataFromCatalogId(catalogId: string): WeaponData {
  const reg = getDefaultItemCatalogRegistry();
  const w = reg.getWeaponSystem(catalogId);
  if (!w) {
    throw new Error(`[weaponDataFromCatalogId] unknown weapon catalog id: ${catalogId}`);
  }
  return weaponSystemToWeaponData(w);
}
