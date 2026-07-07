// ============================================================
// 행성 소유권 증서 가격 — 배치 캐시 + 연간수익·정성가치 산출
// ============================================================

import { getItemDef } from '../../data/itemRegistry';
import {
  computePlanetOwnershipDeedValuation,
  invalidatePlanetOwnershipDeedPricingCache as invalidateValuationPolicyCache,
  resolvePlanetOwnershipDeedValuationPolicy,
  resolvePlanetPgpBmuForOwnershipPricing,
} from './computePlanetOwnershipDeedValuation';

export {
  resolvePlanetPgpBmuForOwnershipPricing,
  computePlanetOwnershipDeedValuation,
  resolveOwnershipPricingZoneType,
  resolvePlanetOwnershipDeedValuationPolicy,
} from './computePlanetOwnershipDeedValuation';

function readCachedOwnershipDeedPriceCredits(planetId: string): number | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { usePlanetCoreRuntimeStore } =
      require('../../store/planetCoreRuntimeStore') as typeof import('../../store/planetCoreRuntimeStore');
    const cached = usePlanetCoreRuntimeStore.getState().byPlanetId[planetId]?.detail?.ownershipDeedPricing;
    if (typeof cached?.priceCredits === 'number' && cached.priceCredits > 0) {
      return Math.floor(cached.priceCredits);
    }
  } catch {
    /* store 미로드 */
  }
  return null;
}

/** 무역소 구매 탭 단가 — 일 1회 배치 캐시 우선 · 없으면 즉시 산출 */
export function resolvePlanetOwnershipDeedTradePriceCredits(planetId: string): number {
  const id = planetId.trim();
  if (!id) return 1;

  const policy = resolvePlanetOwnershipDeedValuationPolicy();
  if (policy.testPlanetIds.has(id)) {
    return policy.testPriceCredits;
  }

  const itemDef = getItemDef(`ownership_${id}`);
  if (itemDef?.basePrice === policy.testPriceCredits) {
    return policy.testPriceCredits;
  }

  const cached = readCachedOwnershipDeedPriceCredits(id);
  if (cached != null) return cached;

  return computePlanetOwnershipDeedValuation(id).priceCredits;
}

export function invalidatePlanetOwnershipDeedPricingCache(): void {
  invalidateValuationPolicyCache();
}
