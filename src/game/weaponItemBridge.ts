import type { ItemDef, TradeGood } from '../types';
import { CAPITAL_WEAPON_LIST_FROM_CSV } from '../data/generated';
import { resolveIntegratedWeaponTradePrice } from '../arcCore/economy/weaponTradePricing';
import { getCapitalWeaponRow } from './capitalWeaponRegistry';
import {
  isWeaponItemId,
  weaponIdFromWeaponItemId,
  weaponItemIdFromWeaponId,
} from './weaponItemId';

export {
  isWeaponItemId,
  weaponIdFromWeaponItemId,
  weaponItemIdFromWeaponId,
  WEAPON_ITEM_ID_PREFIX,
} from './weaponItemId';

export function resolveWeaponItemDef(
  itemId: string,
  cumulativeCredits = 0,
): ItemDef | null {
  const weaponId = weaponIdFromWeaponItemId(itemId);
  if (!weaponId) return null;
  const row = getCapitalWeaponRow(weaponId);
  if (!row) return null;
  const basePrice = resolveIntegratedWeaponTradePrice(weaponId, cumulativeCredits);
  return {
    id: itemId,
    name: row.name,
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

export function resolveWeaponTradeGood(itemId: string, cumulativeCredits = 0): TradeGood | null {
  const def = resolveWeaponItemDef(itemId, cumulativeCredits);
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
