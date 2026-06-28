// ============================================================
// tg_* 교역로 — planet_trade_route_profile × item_defs trade_route
// ============================================================

import { PlanetTradeRouteProfile_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { getItemDef, listItemDefs } from '../../data/itemRegistry';
import { resolveStarSystemForPlanetId } from '../../world/resolvePlanetSystemPosition';
import {
  getPlanetLevelingRowForZone,
  resolvePlanetZoneIndex,
} from '../planetBalance/planetZoneIndexRegistry';
import {
  listTradeRouteDemandAssignedItemIdsForPlanet,
  listTradeRouteSupplyAssignedItemIdsForPlanet,
  resolveTradeRouteAssignedDemandPlanetId,
  resolveTradeRouteAssignedSupplyPlanetId,
  listRuntimeDemandPlanetsForTradeGood,
} from './tradeRoutePlanetAssignmentRegistry';
import { splitPipeCategoriesFromSectorBand } from './tradeRouteSectorCategories';

export type TradeRouteAttrs = {
  tradeRoute: boolean;
  srcFactionCode: string;
  dstFactionCode: string;
  srcRegion: string;
  dstRegion: string;
  baseBuyPrice: number;
  baseSellPrice: number;
  baseProfit: number;
};

export type PlanetTradeRouteProfile = {
  planetId: string;
  tradeFactionCode: string;
  tradeRegionCode: string;
};

export type TradeRouteRole = 'supply' | 'demand';

const profileByPlanetId = new Map(
  PlanetTradeRouteProfile_FROM_BALANCE_CSV.map(
    (row) =>
      [
        String(row.planetId).trim(),
        {
          planetId: String(row.planetId).trim(),
          tradeFactionCode: String(row.tradeFactionCode).trim(),
          tradeRegionCode: String(row.tradeRegionCode).trim(),
        },
      ] as const,
  ),
);

/** synth 프론티어 — dev_trade_port 설치 후 런타임 교역 프로필 */
const runtimeProfileByPlanetId = new Map<string, PlanetTradeRouteProfile>();

export function registerRuntimePlanetTradeRouteProfile(profile: PlanetTradeRouteProfile): void {
  runtimeProfileByPlanetId.set(profile.planetId, profile);
}

export function unregisterRuntimePlanetTradeRouteProfile(planetId: string): void {
  runtimeProfileByPlanetId.delete(planetId);
}

export function clearRuntimePlanetTradeRouteProfiles(): void {
  runtimeProfileByPlanetId.clear();
}

let tradeRouteItemCache: Array<{ id: string; category: string; attrs: TradeRouteAttrs }> | null =
  null;

function parseNum(raw: unknown, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function findSystemForPlanetId(planetId: string) {
  return resolveStarSystemForPlanetId(planetId);
}

export function parseTradeRouteAttrs(def: ReturnType<typeof getItemDef>): TradeRouteAttrs | null {
  if (!def || def.type !== 'trade_route') return null;
  const a = def.attrs ?? {};
  if (!a.tradeRoute) return null;
  return {
    tradeRoute: true,
    srcFactionCode: String(a.srcFactionCode ?? '').trim(),
    dstFactionCode: String(a.dstFactionCode ?? '').trim(),
    srcRegion: String(a.srcRegion ?? '').trim(),
    dstRegion: String(a.dstRegion ?? '').trim(),
    baseBuyPrice: parseNum(a.baseBuyPrice, def.basePrice),
    baseSellPrice: parseNum(a.baseSellPrice, def.basePrice),
    baseProfit: parseNum(a.baseProfit, 0),
  };
}

export function listTradeRouteItems(): Array<{
  id: string;
  category: string;
  attrs: TradeRouteAttrs;
}> {
  if (!tradeRouteItemCache) {
    tradeRouteItemCache = listItemDefs()
      .filter((d) => d.id.startsWith('tg_'))
      .map((d) => {
        const attrs = parseTradeRouteAttrs(d);
        if (!attrs) return null;
        return { id: d.id, category: String(d.category ?? '').trim().toLowerCase(), attrs };
      })
      .filter(Boolean) as Array<{ id: string; category: string; attrs: TradeRouteAttrs }>;
  }
  return tradeRouteItemCache;
}

export function getPlanetTradeRouteProfile(planetId: string): PlanetTradeRouteProfile | null {
  return runtimeProfileByPlanetId.get(planetId) ?? profileByPlanetId.get(planetId) ?? null;
}

export function resolveTradeRouteRole(
  planetId: string,
  tgId: string,
): TradeRouteRole | null {
  const profile = getPlanetTradeRouteProfile(planetId);
  const item = listTradeRouteItems().find((r) => r.id === tgId);
  if (!profile || !item) return null;
  const { attrs } = item;
  const isSupply = attrs.srcFactionCode === profile.tradeFactionCode;
  const isDemand = attrs.dstFactionCode === profile.tradeFactionCode;
  if (isSupply) return 'supply';
  if (isDemand) return 'demand';
  return null;
}

function listTradeRouteItemIdsForPlanetByRole(
  planetId: string,
  role: TradeRouteRole,
): string[] {
  const profile = getPlanetTradeRouteProfile(planetId);
  if (!profile) return [];

  const system = findSystemForPlanetId(planetId);
  const zoneIndex = resolvePlanetZoneIndex(planetId, system ?? null);
  const row = getPlanetLevelingRowForZone(zoneIndex);
  const sectorBand = String(row.sectorBand ?? 'early');
  const allowedCategories = splitPipeCategoriesFromSectorBand(sectorBand);

  const factionKey = role === 'supply' ? 'srcFactionCode' : 'dstFactionCode';
  const out: string[] = [];
  for (const item of listTradeRouteItems()) {
    if (!allowedCategories.has(item.category)) continue;
    if (item.attrs[factionKey] === profile.tradeFactionCode) {
      out.push(item.id);
    }
  }
  return [...new Set(out)].sort();
}

/** 생산지 — `trade_route_planet_supply_assignments` 행성별 1:1 배정 */
export function listTradeRouteSupplyBuyItemIdsForPlanet(planetId: string): string[] {
  const profile = getPlanetTradeRouteProfile(planetId);
  if (!profile) return [];

  const system = findSystemForPlanetId(planetId);
  const zoneIndex = resolvePlanetZoneIndex(planetId, system ?? null);
  const row = getPlanetLevelingRowForZone(zoneIndex);
  const sectorBand = String(row.sectorBand ?? 'early');
  const allowedCategories = splitPipeCategoriesFromSectorBand(sectorBand);

  return listTradeRouteSupplyAssignedItemIdsForPlanet(planetId).filter((tgId) => {
    const item = listTradeRouteItems().find((r) => r.id === tgId);
    return item != null && allowedCategories.has(item.category);
  });
}

/** 수요지 — `trade_route_planet_supply_assignments` 수요 행성 배정 */
export function listTradeRouteDemandImportItemIdsForPlanet(planetId: string): string[] {
  const profile = getPlanetTradeRouteProfile(planetId);
  if (!profile) return [];

  const system = findSystemForPlanetId(planetId);
  const zoneIndex = resolvePlanetZoneIndex(planetId, system ?? null);
  const row = getPlanetLevelingRowForZone(zoneIndex);
  const sectorBand = String(row.sectorBand ?? 'early');
  const allowedCategories = splitPipeCategoriesFromSectorBand(sectorBand);

  return listTradeRouteDemandAssignedItemIdsForPlanet(planetId).filter((tgId) => {
    const item = listTradeRouteItems().find((r) => r.id === tgId);
    return item != null && allowedCategories.has(item.category);
  });
}

/** @deprecated 공급+수요 혼합 진열 — `listTradeRouteSupplyBuyItemIdsForPlanet` 사용 */
export function listTradeRouteItemIdsForPlanet(planetId: string): string[] {
  return [
    ...listTradeRouteSupplyBuyItemIdsForPlanet(planetId),
    ...listTradeRouteDemandImportItemIdsForPlanet(planetId),
  ];
}

/** 수송선 — 현재 행성이 출발지인 교역로(수익 내림차순) */
export function listConvoySourceRoutesAtPlanet(planetId: string): Array<{
  tgId: string;
  attrs: TradeRouteAttrs;
  baseProfit: number;
}> {
  const profile = getPlanetTradeRouteProfile(planetId);
  if (!profile) return [];

  const system = findSystemForPlanetId(planetId);
  const zoneIndex = resolvePlanetZoneIndex(planetId, system ?? null);
  const row = getPlanetLevelingRowForZone(zoneIndex);
  const sectorBand = String(row.sectorBand ?? 'early');
  const allowedCategories = splitPipeCategoriesFromSectorBand(sectorBand);

  return listTradeRouteSupplyAssignedItemIdsForPlanet(planetId)
    .filter((tgId) => {
      const item = listTradeRouteItems().find((r) => r.id === tgId);
      return item != null && allowedCategories.has(item.category);
    })
    .map((tgId) => {
      const item = listTradeRouteItems().find((r) => r.id === tgId)!;
      return {
        tgId: item.id,
        attrs: item.attrs,
        baseProfit: item.attrs.baseProfit,
      };
    })
    .sort((a, b) => b.baseProfit - a.baseProfit);
}

/** 수송선 — 목적지 팩션에 대응하는 무역소 행성 id (CSV + synth 런타임) */
export function pickTradePortPlanetForDstFaction(dstFactionCode: string, seed: string): string | null {
  const candidates: string[] = [];
  for (const row of PlanetTradeRouteProfile_FROM_BALANCE_CSV) {
    if (String(row.tradeFactionCode).trim() === dstFactionCode) {
      candidates.push(String(row.planetId).trim());
    }
  }
  for (const profile of runtimeProfileByPlanetId.values()) {
    if (profile.tradeFactionCode === dstFactionCode) {
      candidates.push(profile.planetId);
    }
  }
  const unique = [...new Set(candidates.filter(Boolean))];
  if (unique.length === 0) return null;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return unique[Math.abs(hash) % unique.length] ?? null;
}

/** 공급(src) 팩션 무역소 행성 id */
export function pickTradePortPlanetForSrcFaction(srcFactionCode: string, seed: string): string | null {
  return pickTradePortPlanetForDstFaction(srcFactionCode, seed);
}

/** 교역품 수요지 행성 id 목록(CSV 1건 + synth 런타임 수요지) */
export function listDemandPlanetIdsForTradeGood(goodId: string): string[] {
  const ids = new Set<string>();
  const canonical = resolveTradeRouteAssignedDemandPlanetId(goodId);
  if (canonical) ids.add(canonical);
  for (const pid of listRuntimeDemandPlanetsForTradeGood(goodId)) {
    ids.add(pid);
  }
  return [...ids];
}

export function isTradeRouteDestinationPlanet(planetId: string, attrs: TradeRouteAttrs): boolean {
  const profile = getPlanetTradeRouteProfile(planetId);
  if (!profile) return false;
  return attrs.dstFactionCode === profile.tradeFactionCode;
}

/** 교역 프로필이 있는 모든 무역소 행성 id (CSV + synth 런타임) */
export function listAllTradeRoutePlanetIds(): string[] {
  const ids = new Set<string>(
    PlanetTradeRouteProfile_FROM_BALANCE_CSV.map((row) => String(row.planetId).trim()),
  );
  for (const pid of runtimeProfileByPlanetId.keys()) {
    ids.add(pid);
  }
  return [...ids];
}

/** 수송선이 생산지에서 출발 가능한 행성 id */
export function listConvoySupplyPlanetIds(): string[] {
  const out: string[] = [];
  for (const planetId of listAllTradeRoutePlanetIds()) {
    if (listConvoySourceRoutesAtPlanet(planetId).length > 0) out.push(planetId);
  }
  return out;
}

/** 수요지 역할 교역품이 배정된 행성 id */
export function listConvoyDemandPlanetIds(): string[] {
  const out: string[] = [];
  for (const planetId of listAllTradeRoutePlanetIds()) {
    if (listTradeRouteDemandImportItemIdsForPlanet(planetId).length > 0) out.push(planetId);
  }
  return out;
}

/** 수요 행성 — 동일 교역품 공급(생산) 행성 중 맵 거리 최단 */
export function resolveNearestSupplyPlanetForTradeGood(
  _demandPlanetId: string,
  goodId: string,
): string | null {
  return resolveTradeRouteAssignedSupplyPlanetId(goodId);
}
