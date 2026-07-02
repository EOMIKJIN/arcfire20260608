// ============================================================
// 행성 소유권 증서 — synth·개척 행성 런타임 ItemDef 합성 (CSV 21행성 외)
// ============================================================

import type { ItemDef } from '../../types';
import { resolvePlanetById } from '../../world/resolvePlanetById';
import { isPlanetOwnershipDeedCatalogEligible } from './planetOwnershipDeedCatalog';

const OWNERSHIP_PREFIX = 'ownership_';
const synthByItemId = new Map<string, ItemDef>();

export function isPlanetOwnershipItemId(itemId: string): boolean {
  return itemId.startsWith(OWNERSHIP_PREFIX);
}

export function resolvePlanetIdFromOwnershipItemId(itemId: string): string | null {
  if (!isPlanetOwnershipItemId(itemId)) return null;
  const planetId = itemId.slice(OWNERSHIP_PREFIX.length).trim();
  return planetId || null;
}

/** CSV `item_defs`에 없는 `ownership_{planetId}` — 무역소 보유 행성만 */
export function resolveSyntheticPlanetOwnershipItemDef(itemId: string): ItemDef | undefined {
  const planetId = resolvePlanetIdFromOwnershipItemId(itemId);
  if (!planetId || !isPlanetOwnershipDeedCatalogEligible(planetId)) return undefined;

  const cached = synthByItemId.get(itemId);
  if (cached) return cached;

  const planet = resolvePlanetById(planetId);
  if (!planet) return undefined;

  const deedDescription =
    '행성 소유권 증서(재판매 불가). 구매 시 소속 클랜이 해당 행성을 점유합니다.';
  const deedDescriptionEn =
    'Planet ownership deed (non-resale). Purchasing assigns your clan to hold this planet.';

  const def: ItemDef = {
    id: itemId,
    name: `${planet.name}/소유권`,
    nameEn: planet.nameEn ? `${planet.nameEn} / Ownership` : `${planet.name} / Ownership`,
    description: deedDescription,
    descriptionEn: deedDescriptionEn,
    featureDescription: `${deedDescription} 구매 시 소속 클랜이 해당 행성을 점유합니다.`,
    featureDescriptionEn: deedDescriptionEn,
    basePrice: 12000,
    priceVariance: 0,
    volume: 1,
    category: 'luxury',
    kind: 'misc',
    type: 'planet_ownership',
    tradeable: true,
    sellable: false,
    cargoHoldable: false,
    capitalShipMountable: false,
    nonRepurchase: true,
    tags: ['planet_ownership', 'no_resale'],
    attrs: { planetId, noResale: true },
  };

  synthByItemId.set(itemId, def);
  return def;
}

export function invalidateSyntheticPlanetOwnershipItemDefCache(): void {
  synthByItemId.clear();
}
