// ============================================================
// capital_ship_trade_listing_policy.csv — 무역소 등급 그룹(격투+정찰 쌍)
// 무기 진열과 동일: pinned 상시 + 파일럿 레벨 밴드(인접 zone 버퍼) · 행성 독점 없음
// ============================================================

import { CapitalShipTradeListingPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { getNpcCapitalShip } from '../../npc/npcFleetRegistry';
import { CapitalHullPurchasePolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { getPlanetLevelingRowForZone } from '../planetBalance/planetZoneIndexRegistry';
import {
  getCapitalHullPurchaseRow,
  getTradePortCapitalListingCount,
  getTradePortCapitalMinPerPlanet,
  getTradePortCapitalZoneOverlap,
} from './balanceTableRegistry';

type ListingRow = (typeof CapitalShipTradeListingPolicy_FROM_BALANCE_CSV)[number];

const HULL_TIER_ORDER: string[] = CapitalHullPurchasePolicy_FROM_BALANCE_CSV.map(
  (r) => r.hullTierKey,
);

const SORTED_LISTING_ROWS: ListingRow[] = [...CapitalShipTradeListingPolicy_FROM_BALANCE_CSV].sort(
  (a, b) => parseNum(a.tradeGradeRank, 0) - parseNum(b.tradeGradeRank, 0),
);

const PINNED_LISTING_ROWS = SORTED_LISTING_ROWS.filter(
  (row) => String((row as { listingAnchor?: string }).listingAnchor ?? '').trim().toLowerCase() === 'pinned',
);

const PROGRESSION_LISTING_ROWS = SORTED_LISTING_ROWS.filter(
  (row) => String((row as { listingAnchor?: string }).listingAnchor ?? '').trim().toLowerCase() !== 'pinned',
);

function listingNpcShipIdsForRow(row: ListingRow): string[] {
  const ids: string[] = [];
  const primary = String(row.canonicalNpcShipId ?? '').trim();
  const alternate = String((row as { alternateNpcShipId?: string }).alternateNpcShipId ?? '').trim();
  if (primary) ids.push(primary);
  if (alternate) ids.push(alternate);
  return ids;
}

function expandGradeRowsToShipIds(rows: readonly ListingRow[]): string[] {
  const out: string[] = [];
  for (const row of rows) {
    for (const id of listingNpcShipIdsForRow(row)) {
      if (id && isCanonicalTradePortCapitalShip(id)) out.push(id);
    }
  }
  return out;
}

const canonicalNpcShipIds = new Set(
  SORTED_LISTING_ROWS.flatMap((row) => listingNpcShipIdsForRow(row)),
);

const hullTierByNpcShipId = new Map<string, string>();
for (const row of SORTED_LISTING_ROWS) {
  const tier = String(row.hullTierKey).trim();
  for (const shipId of listingNpcShipIdsForRow(row)) {
    hullTierByNpcShipId.set(shipId, tier);
  }
}

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

function resolveRequiredPilotLevelForListingRow(row: ListingRow): number {
  const tier = String(row.hullTierKey ?? '').trim();
  const hullRow = getCapitalHullPurchaseRow(tier);
  return parseNum(hullRow?.requiredPilotLevelMin, 1);
}

/** 무기와 동일 — 권장 파일럿 레벨 ± 인접 zone 버퍼 */
export function resolveCapitalPilotLevelBandForZone(zoneIndex: number): {
  minLv: number;
  maxLv: number;
} {
  const zone = Math.max(1, Math.min(20, Math.round(zoneIndex)));
  const overlap = getTradePortCapitalZoneOverlap();
  const curLv = parseNum(getPlanetLevelingRowForZone(zone).recommendedPilotLevel, 1);

  let minLv = curLv;
  let maxLv = curLv;
  for (let d = 1; d <= overlap; d += 1) {
    if (zone - d >= 1) {
      minLv = Math.min(
        minLv,
        parseNum(getPlanetLevelingRowForZone(zone - d).recommendedPilotLevel, 1),
      );
    }
    if (zone + d <= 20) {
      maxLv = Math.max(
        maxLv,
        parseNum(getPlanetLevelingRowForZone(zone + d).recommendedPilotLevel, curLv),
      );
    }
  }

  return { minLv: Math.max(1, minLv), maxLv: Math.max(minLv, maxLv) };
}

function isPinnedListingRow(row: ListingRow): boolean {
  return (
    String((row as { listingAnchor?: string }).listingAnchor ?? '').trim().toLowerCase() === 'pinned'
  );
}

function sortGradeRows(rows: ListingRow[]): ListingRow[] {
  return [...rows].sort(
    (a, b) => parseNum(a.tradeGradeRank, 0) - parseNum(b.tradeGradeRank, 0),
  );
}

function applyGradeGroupCap(rows: ListingRow[], maxGradeGroups: number): ListingRow[] {
  const sorted = sortGradeRows(rows);
  const pinned = sorted.filter((row) => isPinnedListingRow(row));
  const progression = sorted.filter((row) => !isPinnedListingRow(row));
  const progressionSlots = Math.max(0, maxGradeGroups - pinned.length);
  return [...pinned, ...progression.slice(0, progressionSlots)];
}

/** 최소 척수 미달 시 밴드 상단·하단 버퍼로 등급 그룹 추가(무기 min_per_planet와 동일 취지) */
function fillGradeRowsToMinShipCount(
  selectedGrades: Map<number, ListingRow>,
  minShipCount: number,
  minLv: number,
  maxLv: number,
): ListingRow[] {
  const slackAbove = Math.max(4, getTradePortCapitalZoneOverlap() * 6);

  const sync = () => sortGradeRows([...selectedGrades.values()]);

  let gradeRows = sync();
  let shipIds = expandGradeRowsToShipIds(gradeRows);
  if (shipIds.length >= minShipCount) return gradeRows;

  for (const row of PROGRESSION_LISTING_ROWS) {
    if (shipIds.length >= minShipCount) break;
    const rank = parseNum(row.tradeGradeRank, 0);
    if (selectedGrades.has(rank)) continue;
    const req = resolveRequiredPilotLevelForListingRow(row);
    if (req >= minLv && req <= maxLv + slackAbove) {
      selectedGrades.set(rank, row);
      gradeRows = sync();
      shipIds = expandGradeRowsToShipIds(gradeRows);
    }
  }

  if (shipIds.length < minShipCount) {
    for (const row of PROGRESSION_LISTING_ROWS) {
      if (shipIds.length >= minShipCount) break;
      const rank = parseNum(row.tradeGradeRank, 0);
      if (selectedGrades.has(rank)) continue;
      selectedGrades.set(rank, row);
      gradeRows = sync();
      shipIds = expandGradeRowsToShipIds(gradeRows);
    }
  }

  return gradeRows;
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
  const ship = getNpcCapitalShip(npcShipId);
  return ship?.tradePortListed === true;
}

export function resolveHullTierKeyForTradeCatalogShip(npcShipId: string): string {
  return hullTierByNpcShipId.get(npcShipId.trim()) ?? 'frigate_upgraded';
}

export function resolveCapitalShipRequiredPilotLevel(npcShipId: string): number {
  const tier = resolveHullTierKeyForTradeCatalogShip(npcShipId);
  const hullRow = getCapitalHullPurchaseRow(tier);
  return parseNum(hullRow?.requiredPilotLevelMin, 1);
}

/**
 * 행성 zone — pinned 입문함 상시 + 레벨 밴드 progression(격투·정찰 쌍 동시).
 * 행성별 독점 슬라이딩 없음 · 인접 zone SKU 중복 허용.
 */
export function resolveTradePortNpcShipIdsForZone(zoneIndex: number): string[] {
  const { minLv, maxLv } = resolveCapitalPilotLevelBandForZone(zoneIndex);
  const minShipCount = getTradePortCapitalMinPerPlanet();
  const maxGradeGroups = getTradePortCapitalListingCount();

  const selectedGrades = new Map<number, ListingRow>();

  for (const row of PINNED_LISTING_ROWS) {
    selectedGrades.set(parseNum(row.tradeGradeRank, 0), row);
  }

  for (const row of PROGRESSION_LISTING_ROWS) {
    const req = resolveRequiredPilotLevelForListingRow(row);
    if (req >= minLv && req <= maxLv) {
      selectedGrades.set(parseNum(row.tradeGradeRank, 0), row);
    }
  }

  let gradeRows = fillGradeRowsToMinShipCount(selectedGrades, minShipCount, minLv, maxLv);
  let shipIds = expandGradeRowsToShipIds(gradeRows);

  gradeRows = applyGradeGroupCap(gradeRows, maxGradeGroups);
  shipIds = expandGradeRowsToShipIds(gradeRows);

  if (shipIds.length < minShipCount) {
    gradeRows = fillGradeRowsToMinShipCount(selectedGrades, minShipCount, minLv, maxLv);
    gradeRows = applyGradeGroupCap(
      gradeRows,
      Math.max(maxGradeGroups, PINNED_LISTING_ROWS.length + 2),
    );
    shipIds = expandGradeRowsToShipIds(gradeRows);
  }

  if (shipIds.length < minShipCount) {
    gradeRows = fillGradeRowsToMinShipCount(selectedGrades, minShipCount, minLv, maxLv);
    shipIds = expandGradeRowsToShipIds(gradeRows);
  }

  return [...new Set(shipIds)].sort((a, b) => {
    const tierDiff =
      hullTierRank(resolveHullTierKeyForTradeCatalogShip(a))
      - hullTierRank(resolveHullTierKeyForTradeCatalogShip(b));
    if (tierDiff !== 0) return tierDiff;
    const lvDiff =
      resolveCapitalShipRequiredPilotLevel(a) - resolveCapitalShipRequiredPilotLevel(b);
    if (lvDiff !== 0) return lvDiff;
    return a.localeCompare(b);
  });
}
