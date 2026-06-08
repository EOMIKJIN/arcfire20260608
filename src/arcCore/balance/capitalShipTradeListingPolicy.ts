// ============================================================
// capital_ship_trade_listing_policy.csv — 무역소 등급 대표 전함(이름만 다른 동급 제외)
// ============================================================

import { CapitalShipTradeListingPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { NPC_CAPITAL_SHIPS_FROM_CSV } from '../../data/generated';
import { CapitalHullPurchasePolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { getTradePortCapitalListingCount } from './balanceTableRegistry';

type ListingRow = (typeof CapitalShipTradeListingPolicy_FROM_BALANCE_CSV)[number];

const HULL_TIER_ORDER: string[] = CapitalHullPurchasePolicy_FROM_BALANCE_CSV.map(
  (r) => r.hullTierKey,
);

const SORTED_LISTING_ROWS: ListingRow[] = [...CapitalShipTradeListingPolicy_FROM_BALANCE_CSV].sort(
  (a, b) => parseNum(a.tradeGradeRank, 0) - parseNum(b.tradeGradeRank, 0),
);

const canonicalNpcShipIds = new Set(
  SORTED_LISTING_ROWS.map((row) => String(row.canonicalNpcShipId).trim()),
);

const hullTierByNpcShipId = new Map(
  SORTED_LISTING_ROWS.map(
    (row) => [String(row.canonicalNpcShipId).trim(), String(row.hullTierKey).trim()] as const,
  ),
);

const canonicalByTier = new Map<string, string>();
for (const row of SORTED_LISTING_ROWS) {
  const tier = String(row.hullTierKey).trim();
  if (!canonicalByTier.has(tier)) {
    canonicalByTier.set(tier, String(row.canonicalNpcShipId).trim());
  }
}

function parseNum(raw: string | number | undefined, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function hullTierRank(tierKey: string): number {
  const idx = HULL_TIER_ORDER.indexOf(tierKey);
  return idx >= 0 ? idx : 0;
}

export function listTradeGradeListingRows(): readonly ListingRow[] {
  return SORTED_LISTING_ROWS;
}

export function getCanonicalNpcShipIdForHullTier(hullTierKey: string): string | null {
  return canonicalByTier.get(hullTierKey.trim()) ?? null;
}

export function listCanonicalTradePortNpcShipIds(): string[] {
  return [...canonicalNpcShipIds];
}

/** 무역소 상품으로 등록된 전함(npc_ai_ships.tradePortListed + 정책 대표) */
export function isCanonicalTradePortCapitalShip(npcShipId: string): boolean {
  if (!canonicalNpcShipIds.has(npcShipId)) return false;
  const ship = NPC_CAPITAL_SHIPS_FROM_CSV.find((s) => s.id === npcShipId);
  return ship?.tradePortListed === true;
}

export function resolveHullTierKeyForTradeCatalogShip(npcShipId: string): string {
  return hullTierByNpcShipId.get(npcShipId.trim()) ?? 'frigate_upgraded';
}

/**
 * 행성 zone — 무역소에 올릴 등급 대표 전함 npc id (기본 10종, 성능 사다리 슬라이딩).
 * 재고 수량과 무관; 동명이인·동급 클론은 정책 테이블에 없는 한 제외.
 */
export function resolveTradePortNpcShipIdsForZone(zoneIndex: number): string[] {
  const listingCount = getTradePortCapitalListingCount();
  const rows = SORTED_LISTING_ROWS;
  if (rows.length === 0) return [];

  const zone = Math.max(1, Math.min(20, Math.round(zoneIndex)));
  const maxStart = Math.max(0, rows.length - listingCount);
  const zoneSpan = Math.max(1, 20 - 1);
  let startIdx = Math.floor(((zone - 1) / zoneSpan) * maxStart);

  let window = rows.slice(startIdx, startIdx + listingCount);
  if (window.length < listingCount) {
    window = rows.slice(Math.max(0, rows.length - listingCount));
  }

  return window.map((row) => String(row.canonicalNpcShipId).trim()).filter(Boolean);
}
