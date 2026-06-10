// ============================================================
// 아크코어 — 광물 채굴·무역소 판매가 단일 정본
// - mining_mineral_catalog · mining_zone_mineral_pool · mining_sell_price_policy
// ============================================================

import { MiningSellPricePolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { getItemDef } from '../../data/itemRegistry';
import { STAR_SYSTEMS } from '../../data/systems';
import { getPlayScenarioEconomyRow } from '../balance/playScenarioRegistry';
import { resolvePlanetZoneIndex } from '../planetBalance/planetZoneIndexRegistry';
import {
  filterMineralIdsToZonePool,
  isCatalogGalacticMineral,
  listAllGalacticMineralItemIds,
  listZonePoolMineralIds,
  resolveCatalogSellPriceAnchor,
  resolveZonePrimaryMineralId,
} from './mineralCatalogRegistry';

function parseNum(raw: string | number | undefined, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function clampZone(n: number): number {
  return Math.max(1, Math.min(21, Math.round(n)));
}

function resolveZoneIndexForPlanet(planetId: string): number {
  const system = Object.values(STAR_SYSTEMS).find((s) => s.planets.some((p) => p.id === planetId));
  return clampZone(resolvePlanetZoneIndex(planetId, system ?? null));
}

/** @deprecated 이름 호환 — catalog 10종 */
export function listArcCoreGalacticMineralItemIds(): string[] {
  return listAllGalacticMineralItemIds();
}

export function isArcCorePricedMineral(itemId: string): boolean {
  return isCatalogGalacticMineral(itemId);
}

export function listZoneAllowedMineralIds(zoneIndex: number): string[] {
  return listZonePoolMineralIds(zoneIndex);
}

export function listZoneTradeableMineralIds(zoneIndex: number): string[] {
  return listZonePoolMineralIds(zoneIndex);
}

export { resolveZonePrimaryMineralId };

export function isMineralAllowedInZone(zoneIndex: number, mineralId: string): boolean {
  return listZonePoolMineralIds(zoneIndex).includes(mineralId);
}

function findSellPricePolicy(zoneIndex: number, mineralId: string): number | null {
  const z = clampZone(zoneIndex);
  for (const row of MiningSellPricePolicy_FROM_BALANCE_CSV) {
    const min = parseNum(row.zoneIndexMin, 1);
    const max = parseNum(row.zoneIndexMax, 99);
    if (z < min || z > max) continue;
    if (String(row.mineralId).trim() !== mineralId) continue;
    const price = parseNum(row.sellPriceCredits, 0);
    if (price > 0) return Math.floor(price);
  }
  return null;
}

function scenarioAnchorSellPrice(zoneIndex: number): number {
  const econ = getPlayScenarioEconomyRow(zoneIndex);
  if (!econ) return 10;
  const credits = parseNum(econ.requiredCredits, 0);
  const qty = parseNum(econ.mineralQtyTotal, 0);
  if (credits > 0 && qty > 0) return Math.max(1, Math.floor(credits / qty));
  return 10;
}

/** 무역소 리스팅 없을 때 — catalog·정책 글로벌 판매가(존 풀 제한 없음) */
export function resolveMineralCatalogSellPrice(mineralId: string): number | null {
  if (!isCatalogGalacticMineral(mineralId)) return null;
  const def = getItemDef(mineralId);
  if (!def?.tradeable || !def.sellable) return null;

  const anchor = resolveCatalogSellPriceAnchor(mineralId);
  if (anchor > 0) return anchor;

  for (const row of MiningSellPricePolicy_FROM_BALANCE_CSV) {
    if (String(row.mineralId).trim() !== mineralId) continue;
    const price = parseNum(row.sellPriceCredits, 0);
    if (price > 0) return Math.floor(price);
  }

  return null;
}

export function resolveMineralSellPriceCredits(planetId: string, mineralId: string): number | null {
  if (!isCatalogGalacticMineral(mineralId)) return null;
  const def = getItemDef(mineralId);
  if (!def?.tradeable || !def.sellable) return null;

  const zoneIndex = resolveZoneIndexForPlanet(planetId);
  if (!isMineralAllowedInZone(zoneIndex, mineralId)) return null;

  const anchor = resolveCatalogSellPriceAnchor(mineralId);
  if (anchor > 0) return anchor;

  const policy = findSellPricePolicy(zoneIndex, mineralId);
  if (policy != null) return policy;

  return scenarioAnchorSellPrice(zoneIndex);
}

export function resolveMineralListingBuyPrice(planetId: string, mineralId: string): number {
  const sell = resolveMineralSellPriceCredits(planetId, mineralId);
  if (sell == null) return Math.max(1, getItemDef(mineralId)?.basePrice ?? 1);
  return Math.max(1, Math.ceil(sell / 0.9));
}

export function filterMineralIdsForPlanetZone(planetId: string, mineralIds: readonly string[]): string[] {
  return filterMineralIdsToZonePool(resolveZoneIndexForPlanet(planetId), mineralIds);
}
