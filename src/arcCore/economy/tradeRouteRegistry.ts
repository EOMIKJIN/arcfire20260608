// ============================================================
// tg_* 교역로 — planet_trade_route_profile × item_defs trade_route
// ============================================================

import { PlanetTradeRouteProfile_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { getItemDef, listItemDefs } from '../../data/itemRegistry';
import { STAR_SYSTEMS } from '../../data/systems';
import {
  getPlanetLevelingRowForZone,
  resolvePlanetZoneIndex,
} from '../planetBalance/planetZoneIndexRegistry';
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

let tradeRouteItemCache: Array<{ id: string; category: string; attrs: TradeRouteAttrs }> | null =
  null;

function parseNum(raw: unknown, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function findSystemForPlanetId(planetId: string) {
  for (const system of Object.values(STAR_SYSTEMS)) {
    if (system.planets.some((p) => p.id === planetId)) return system;
  }
  return undefined;
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
  return profileByPlanetId.get(planetId) ?? null;
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

/** 행성 zone·교역 팩션 — 공급(src)·수요(dst) tg_* 진열 */
export function listTradeRouteItemIdsForPlanet(planetId: string): string[] {
  const profile = getPlanetTradeRouteProfile(planetId);
  if (!profile) return [];

  const system = findSystemForPlanetId(planetId);
  const zoneIndex = resolvePlanetZoneIndex(planetId, system ?? null);
  const row = getPlanetLevelingRowForZone(zoneIndex);
  const sectorBand = String(row.sectorBand ?? 'early');
  const allowedCategories = splitPipeCategoriesFromSectorBand(sectorBand);

  const out: string[] = [];
  for (const item of listTradeRouteItems()) {
    if (!allowedCategories.has(item.category)) continue;
    const { attrs } = item;
    if (
      attrs.srcFactionCode === profile.tradeFactionCode
      || attrs.dstFactionCode === profile.tradeFactionCode
    ) {
      out.push(item.id);
    }
  }
  return [...new Set(out)].sort();
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

  return listTradeRouteItems()
    .filter((item) => {
      if (!allowedCategories.has(item.category)) return false;
      return item.attrs.srcFactionCode === profile.tradeFactionCode;
    })
    .map((item) => ({
      tgId: item.id,
      attrs: item.attrs,
      baseProfit: item.attrs.baseProfit,
    }))
    .sort((a, b) => b.baseProfit - a.baseProfit);
}

/** 수송선 — 목적지 팩션에 대응하는 무역소 행성 id (프로필 정본) */
export function pickTradePortPlanetForDstFaction(dstFactionCode: string, seed: string): string | null {
  const candidates = PlanetTradeRouteProfile_FROM_BALANCE_CSV.filter(
    (row) => String(row.tradeFactionCode).trim() === dstFactionCode,
  ).map((row) => String(row.planetId).trim());
  if (candidates.length === 0) return null;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return candidates[Math.abs(hash) % candidates.length] ?? null;
}

export function isTradeRouteDestinationPlanet(planetId: string, attrs: TradeRouteAttrs): boolean {
  const profile = getPlanetTradeRouteProfile(planetId);
  if (!profile) return false;
  return attrs.dstFactionCode === profile.tradeFactionCode;
}
