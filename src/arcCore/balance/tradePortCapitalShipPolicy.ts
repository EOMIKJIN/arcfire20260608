// ============================================================
// 무역소 전함 진열 — pinned + 파일럿 레벨 밴드(인접 zone 버퍼) · 격투/정찰 쌍 동시
// ============================================================

import { CapitalHullPurchasePolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { getNpcCapitalShip } from '../../npc/npcFleetRegistry';
import { STAR_SYSTEMS } from '../../data/systems';
import { resolvePlanetZoneIndex } from '../planetBalance/planetZoneIndexRegistry';
import { getCapitalHullPurchaseRow } from './balanceTableRegistry';
import { resolveCapitalShipPerformanceBasePrice } from './capitalShipPerformancePricing';
import {
  getCanonicalNpcShipIdForHullTier,
  isCanonicalTradePortCapitalShip,
  listCanonicalTradePortNpcShipIds,
  listTradeGradeListingRows,
  resolveCapitalPilotLevelBandForZone,
  resolveHullTierKeyForTradeCatalogShip,
  resolveTradePortNpcShipIdsForZone,
} from './capitalShipTradeListingPolicy';
import { resolveNpcShipIdForHullTier } from './capitalHullPurchaseFromBalance';
import {
  WAVE_TEST_TRADE_PRICE_CREDITS,
  isWaveTestTradeShipId,
} from '../../economy/waveDefenseTestTradeItems';

const HULL_TIER_ORDER: string[] = CapitalHullPurchasePolicy_FROM_BALANCE_CSV.map(
  (r) => r.hullTierKey,
);

function parseNum(raw: string | number | undefined, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function findSystemForPlanetId(planetId: string) {
  for (const system of Object.values(STAR_SYSTEMS)) {
    if (system.planets.some((p) => p.id === planetId)) return system;
  }
  return undefined;
}

function hullTierRank(tierKey: string): number {
  const idx = HULL_TIER_ORDER.indexOf(tierKey);
  return idx >= 0 ? idx : 0;
}

/** hullTierKey → 대표 npc id (조선소·정책 대표 매핑) */
export function resolveHullTierKeyForNpcShipId(npcShipId: string): string | null {
  for (const row of CapitalHullPurchasePolicy_FROM_BALANCE_CSV) {
    const mapped = resolveNpcShipIdForHullTier(row.hullTierKey);
    if (mapped === npcShipId) return row.hullTierKey;
    const canonical = getCanonicalNpcShipIdForHullTier(row.hullTierKey);
    if (canonical === npcShipId) return row.hullTierKey;
  }
  const fromListing = resolveHullTierKeyForTradeCatalogShip(npcShipId);
  if (listTradeGradeListingRows().some((r) => String(r.canonicalNpcShipId).trim() === npcShipId)) {
    return fromListing;
  }
  return null;
}

/** 무역소·조선소 공통 — 체급 추정(비진열 적함 등) */
export function resolveHullTierKeyForListedNpcShip(npcShipId: string): string {
  const explicit = resolveHullTierKeyForNpcShipId(npcShipId);
  if (explicit) return explicit;

  const ship = getNpcCapitalShip(npcShipId);
  if (!ship) return 'frigate_default';

  const hp = ship.combat.maxHp;
  let bestTier = 'frigate_default';
  let bestDist = Number.POSITIVE_INFINITY;
  for (const row of CapitalHullPurchasePolicy_FROM_BALANCE_CSV) {
    if (row.hullTierKey === 'battlecruiser_max') continue;
    const minLv = parseNum(row.requiredPilotLevelMin, 1);
    const targetHp = 400 + minLv * 8;
    const dist = Math.abs(hp - targetHp);
    if (dist < bestDist) {
      bestDist = dist;
      bestTier = row.hullTierKey;
    }
  }
  return bestTier;
}

function isTradeListableHullTier(tierKey: string): boolean {
  if (tierKey === 'battlecruiser_max') return false;
  if (tierKey === 'frigate_default') return true;
  const row = getCapitalHullPurchaseRow(tierKey);
  return row != null && parseNum(row.purchaseCredits, 0) > 0;
}


/** 무역소에 올릴 수 있는 전함 `capital_ship_*` id (정책 등급 대표 전체) */
export function listAllTradePortCapitalShipItemIds(): string[] {
  return listCanonicalTradePortNpcShipIds()
    .filter((id) => isCanonicalTradePortCapitalShip(id))
    .map((id) => `capital_ship_${id}`);
}

/** zoneIndex 기준 무역소에 허용되는 hullTierKey(레벨 밴드·버퍼) */
export function resolveTradePortHullTiersForZone(zoneIndex: number): string[] {
  const { minLv, maxLv } = resolveCapitalPilotLevelBandForZone(zoneIndex);
  return HULL_TIER_ORDER.filter((tier) => {
    if (!isTradeListableHullTier(tier)) return false;
    const row = getCapitalHullPurchaseRow(tier);
    const req = parseNum(row?.requiredPilotLevelMin, 1);
    return req >= minLv && req <= maxLv;
  });
}

/** 행성 zone — 등급 그룹 기반 전함 SKU(재고 수량과 무관) */
export function listCapitalShipItemIdsForPlanet(planetId: string): string[] {
  const system = findSystemForPlanetId(planetId);
  const zoneIndex = resolvePlanetZoneIndex(planetId, system ?? null);
  const npcIds = resolveTradePortNpcShipIdsForZone(zoneIndex);

  return npcIds
    .filter((id) => isCanonicalTradePortCapitalShip(id))
    .map((id) => `capital_ship_${id}`)
    .sort((a, b) => {
      const tierA = resolveHullTierKeyForTradeCatalogShip(a.slice('capital_ship_'.length));
      const tierB = resolveHullTierKeyForTradeCatalogShip(b.slice('capital_ship_'.length));
      const rankDiff = hullTierRank(tierA) - hullTierRank(tierB);
      if (rankDiff !== 0) return rankDiff;
      return a.localeCompare(b);
    });
}

/** 성능 기준가 — 수요는 TradeEngine.getBuyPrice 2차 반영 */
export function resolveCapitalShipTradePrice(itemId: string, planetId?: string): number {
  const npcId = itemId.startsWith('capital_ship_') ? itemId.slice('capital_ship_'.length) : '';
  if (!npcId) return 1;

  if (planetId) {
    const allowed = listCapitalShipItemIdsForPlanet(planetId);
    if (!allowed.includes(itemId)) return Number.POSITIVE_INFINITY;
  }

  if (!isCanonicalTradePortCapitalShip(npcId)) return Number.POSITIVE_INFINITY;

  // 웨이브 디펜스 테스트함 — 테스트 단계 거래가 1(성능 기준가 우회). 운영 전함 무관.
  if (isWaveTestTradeShipId(npcId)) return WAVE_TEST_TRADE_PRICE_CREDITS;

  return resolveCapitalShipPerformanceBasePrice(npcId);
}
