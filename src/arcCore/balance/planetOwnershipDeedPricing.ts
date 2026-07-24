// ============================================================
// 행성 소유권 증서 가격 — 배치 캐시 + 연간수익·정성가치 산출
// + 전쟁 후 중립·분쟁지역 스폴일 오버레이(테스트 10CR)
// ============================================================

import { getItemDef } from '../../data/itemRegistry';
import {
  computePlanetOwnershipDeedValuation,
  invalidatePlanetOwnershipDeedPricingCache as invalidateValuationPolicyCache,
  resolvePlanetOwnershipDeedValuationPolicy,
  resolvePlanetPgpBmuForOwnershipPricing,
} from './computePlanetOwnershipDeedValuation';
import { computeWarSpoilsOwnershipDeedPriceCredits } from './planetOwnershipWarSpoilsPrice';

export {
  resolvePlanetPgpBmuForOwnershipPricing,
  computePlanetOwnershipDeedValuation,
  resolveOwnershipPricingZoneType,
  resolvePlanetOwnershipDeedValuationPolicy,
} from './computePlanetOwnershipDeedValuation';
export { computeWarSpoilsOwnershipDeedPriceCredits } from './planetOwnershipWarSpoilsPrice';

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

/**
 * 분쟁지역 게이트 — 정적 CSV(contestedZone) + 동적 편입.
 * 전성계 분쟁화 시에도 동일 함수로 확장(동적 store / CSV 행만 증가).
 */
export function isPlanetEligibleForWarSpoilsDeedPricing(planetId: string): boolean {
  const id = planetId.trim();
  if (!id) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isPlanetContestedZone } =
      require('./balanceTableRegistry') as typeof import('./balanceTableRegistry');
    if (isPlanetContestedZone(id)) return true;
  } catch {
    /* ignore */
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isDynamicContestedZonePlanet } =
      require('../territorial/dynamicContestedZoneStore') as typeof import('../territorial/dynamicContestedZoneStore');
    if (isDynamicContestedZonePlanet(id)) return true;
  } catch {
    /* ignore */
  }
  return false;
}

/**
 * 전쟁 후 중립(neutralizedAt) · 미구매(비 독립국) · 분쟁지역 → 스폴일 테스트가.
 * 구매(player_independent) 이후 가격 변동은 추후 구현 — 본 오버레이 미적용.
 */
export function resolveWarSpoilsOwnershipDeedPriceCredits(planetId: string): number | null {
  const id = planetId.trim();
  if (!id) return null;

  const policy = resolvePlanetOwnershipDeedValuationPolicy();
  const isContestedEligible = isPlanetEligibleForWarSpoilsDeedPricing(id);

  let neutralizedAt: number | null | undefined;
  let isIndependentNation = false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useClanWarFoundationStore } =
      require('../../store/clanWarFoundationStore') as typeof import('../../store/clanWarFoundationStore');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isPlayerIndependentNationHold } =
      require('../../clanWar/planetOwnershipModel') as typeof import('../../clanWar/planetOwnershipModel');

    const hold = useClanWarFoundationStore.getState().planetHolds[id];
    neutralizedAt = hold?.neutralizedAt;
    isIndependentNation = hold ? isPlayerIndependentNationHold(hold) : false;
  } catch {
    return null;
  }

  return computeWarSpoilsOwnershipDeedPriceCredits({
    neutralizedAt,
    isIndependentNation,
    isContestedEligible,
    warSpoilsTestPriceCredits: policy.warSpoilsTestPriceCredits,
    warSpoilsRequireContested: policy.warSpoilsRequireContested,
  });
}

/** 무역소 구매 탭 단가 — 전쟁 스폴일 오버레이 > 테스트 고정 > 일 1회 배치 캐시 > 즉시 산출 */
export function resolvePlanetOwnershipDeedTradePriceCredits(planetId: string): number {
  const id = planetId.trim();
  if (!id) return 1;

  const warSpoils = resolveWarSpoilsOwnershipDeedPriceCredits(id);
  if (warSpoils != null) return warSpoils;

  const policy = resolvePlanetOwnershipDeedValuationPolicy();
  if (policy.testPlanetIds.has(id)) {
    return policy.testPriceCredits;
  }

  const itemDef = getItemDef(`ownership_${id}`);
  if (
    policy.testPlanetIds.size > 0
    && itemDef?.basePrice === policy.testPriceCredits
  ) {
    return policy.testPriceCredits;
  }

  const cached = readCachedOwnershipDeedPriceCredits(id);
  if (cached != null) return cached;

  return computePlanetOwnershipDeedValuation(id).priceCredits;
}

export function invalidatePlanetOwnershipDeedPricingCache(): void {
  invalidateValuationPolicyCache();
}
