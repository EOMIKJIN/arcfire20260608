import type { ItemDef, TradeGood } from '../types';
import { CAPITAL_WEAPON_LIST_FROM_CSV } from '../data/generated';
import { getCapitalWeaponRow } from './capitalWeaponRegistry';

const WEAPON_ITEM_ID_PREFIX = 'weapon_item_';

export function weaponItemIdFromWeaponId(weaponId: string): string {
  return `${WEAPON_ITEM_ID_PREFIX}${weaponId}`;
}

export function weaponIdFromWeaponItemId(itemId: string): string | null {
  if (!itemId.startsWith(WEAPON_ITEM_ID_PREFIX)) return null;
  const weaponId = itemId.slice(WEAPON_ITEM_ID_PREFIX.length).trim();
  return weaponId.length > 0 ? weaponId : null;
}

export function isWeaponItemId(itemId: string): boolean {
  const weaponId = weaponIdFromWeaponItemId(itemId);
  return Boolean(weaponId && CAPITAL_WEAPON_LIST_FROM_CSV[weaponId]);
}

export function resolveWeaponItemDef(itemId: string): ItemDef | null {
  const weaponId = weaponIdFromWeaponItemId(itemId);
  if (!weaponId) return null;
  const row = getCapitalWeaponRow(weaponId);
  if (!row) return null;
  const basePrice = row.purchasePrice > 0
    ? row.purchasePrice
    : Math.max(600, Math.floor(row.damage * 280 + row.rangePx * 2 + row.projectileSpeedPxPerSec * 0.6));
  return {
    id: itemId,
    name: `${row.name} 모듈`,
    description: `${row.familyKind.toUpperCase()} · DMG ${row.damage} · RANGE ${Math.round(row.rangePx)}`,
    basePrice,
    priceVariance: 18,
    volume: 1,
    category: 'weapon',
    kind: 'equipment',
    type: 'weapon_module',
    tradeable: true,
    sellable: true,
    cargoHoldable: true,
    capitalShipMountable: true,
    nonRepurchase: false,
    tags: ['weapon_module'],
    attrs: {
      weaponId: row.id,
      weaponKind: row.kind,
      weaponFamilyKind: row.familyKind,
      damage: row.damage,
      rangePx: row.rangePx,
      projectileSpeedPxPerSec: row.projectileSpeedPxPerSec,
      salvoCount: row.salvoCount,
      lockImpactPoint: row.lockImpactPoint,
    },
  };
}

export function resolveWeaponTradeGood(itemId: string): TradeGood | null {
  const def = resolveWeaponItemDef(itemId);
  if (!def) return null;
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    basePrice: def.basePrice,
    priceVariance: def.priceVariance,
    volume: def.volume,
    category: def.category,
  };
}

export function listWeaponTradeItemIds(): string[] {
  return Object.keys(CAPITAL_WEAPON_LIST_FROM_CSV).map(weaponItemIdFromWeaponId);
}
