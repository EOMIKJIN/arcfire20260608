// ============================================================
// 행성 소유권 증서 — item_defs.csv Table-First 단일 정본
// A(21) + synth: tables/content/item_defs.csv (sync-synth-ownership-into-item-defs.mjs)
// 개방 시: 무역소 카탈로그 resync만 (item_defs 런타임 쓰기 없음)
// ============================================================

import { getItemDef } from '../../data/itemRegistry';
import { getSynthSystemColonizationRow } from './balanceTableRegistry';
import {
  isRouteCapitalPlanetId,
  resolveFrontierWorldFacilitySeed,
} from '../../world/galaxyFrontierDevelopmentRidge';
import { resolvePlanetOwnershipDeedItemId } from './planetOwnershipDeedCatalog';

function planetIdToSynthSystemId(planetId: string): string {
  const id = String(planetId ?? '').trim();
  return id.endsWith('_p') ? id.slice(0, -2) : id;
}

/** colonization·item_defs 빌드 후 ITEM_DEFS_FROM_CSV에 등록됐는지 확인 */
export function isPlanetOwnershipItemDefRegistered(planetId: string): boolean {
  const itemId = resolvePlanetOwnershipDeedItemId(planetId);
  const def = getItemDef(itemId);
  return Boolean(def?.tradeable && def.type === 'planet_ownership');
}

/**
 * 증서 정본이 필요한 synth만.
 * 개척 행이 있고 hop 능선이 무역소를 준 행성만 (비콘 hop 밖 오지 제외).
 */
export function isPlanetOwnershipItemDefRequiredForFrontier(planetId: string): boolean {
  const systemId = planetIdToSynthSystemId(planetId);
  if (!systemId.startsWith('synth_')) return false;
  if (!getSynthSystemColonizationRow(systemId) && !isRouteCapitalPlanetId(planetId)) return false;
  return resolveFrontierWorldFacilitySeed(planetId, 1).hasTradePort;
}

/**
 * synth 성계 개방 직후 — 개척 CSV가 무역소를 준 행성만 item_defs 검사.
 * 미발견 확장(synth_080+)은 증서 대상이 아니므로 경고하지 않는다.
 */
export function assertPlanetOwnershipItemDefOnFrontierUnlock(planetId: string): boolean {
  if (!planetId.trim()) return false;
  if (!isPlanetOwnershipItemDefRequiredForFrontier(planetId)) return true;
  if (isPlanetOwnershipItemDefRegistered(planetId)) return true;
  if (__DEV__) {
    const itemId = resolvePlanetOwnershipDeedItemId(planetId);
    console.warn(
      `[PlanetOwnership] item_defs 미등록: ${itemId} — synth_system_colonization.csv 확인 후 npm run build:content-tables`,
    );
  }
  return false;
}
