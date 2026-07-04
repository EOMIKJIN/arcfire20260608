// ============================================================
// 행성 소유권 증서 — item_defs.csv Table-First 단일 정본
// A(21) + synth: tables/content/item_defs.csv (sync-synth-ownership-into-item-defs.mjs)
// 개방 시: 무역소 카탈로그 resync만 (item_defs 런타임 쓰기 없음)
// ============================================================

import { getItemDef } from '../../data/itemRegistry';
import { resolvePlanetOwnershipDeedItemId } from './planetOwnershipDeedCatalog';

/** colonization·item_defs 빌드 후 ITEM_DEFS_FROM_CSV에 등록됐는지 확인 */
export function isPlanetOwnershipItemDefRegistered(planetId: string): boolean {
  const itemId = resolvePlanetOwnershipDeedItemId(planetId);
  const def = getItemDef(itemId);
  return Boolean(def?.tradeable && def.type === 'planet_ownership');
}

/**
 * synth 성계 개방 직후 — 테이블 미등록이면 dev 경고.
 * 신규 synth 행 추가 시 `npm run build:content-tables` 필수.
 */
export function assertPlanetOwnershipItemDefOnFrontierUnlock(planetId: string): boolean {
  if (!planetId.trim()) return false;
  if (isPlanetOwnershipItemDefRegistered(planetId)) return true;
  if (__DEV__) {
    const itemId = resolvePlanetOwnershipDeedItemId(planetId);
    console.warn(
      `[PlanetOwnership] item_defs 미등록: ${itemId} — synth_system_colonization.csv 확인 후 npm run build:content-tables`,
    );
  }
  return false;
}
