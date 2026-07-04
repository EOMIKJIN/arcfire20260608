// ============================================================
// arc_core_red_planet_dev_portfolio.csv — RED 점령지별 개발 포트폴리오
// ============================================================

import { ArcCoreRedPlanetDevPortfolio_FROM_BALANCE_CSV } from '../../data/balance/generated/csvArcCoreRedPlanetDevPortfolio';
import type { ArcCorePlanetDevModuleId } from './arcCorePlanetDevelopmentActions';

export type ArcCoreRedPlanetDevPortfolioRow = {
  planetId: string;
  priorityRank: number;
  primaryModuleId: ArcCorePlanetDevModuleId;
  secondaryModuleId: ArcCorePlanetDevModuleId;
};

const DEFAULT_RANK = 99;

let portfolioByPlanetId: Map<string, ArcCoreRedPlanetDevPortfolioRow> | null = null;

function parseRank(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_RANK;
}

function isModuleId(raw: string | undefined): raw is ArcCorePlanetDevModuleId {
  return (
    raw === 'defense_satellite'
    || raw === 'dev_orbit_shipyard'
    || raw === 'dev_trade_port'
    || raw === 'dev_research_lab'
    || raw === 'dev_population_dome'
  );
}

function buildPortfolioMap(): Map<string, ArcCoreRedPlanetDevPortfolioRow> {
  const map = new Map<string, ArcCoreRedPlanetDevPortfolioRow>();
  for (let i = 0; i < ArcCoreRedPlanetDevPortfolio_FROM_BALANCE_CSV.length; i += 1) {
    const row = ArcCoreRedPlanetDevPortfolio_FROM_BALANCE_CSV[i]!;
    const planetId = String(row.planetId ?? '').trim();
    if (!planetId) continue;
    const primary = String(row.primaryModuleId ?? '').trim();
    const secondary = String(row.secondaryModuleId ?? '').trim();
    if (!isModuleId(primary) || !isModuleId(secondary)) continue;
    map.set(planetId, {
      planetId,
      priorityRank: parseRank(row.priorityRank),
      primaryModuleId: primary,
      secondaryModuleId: secondary,
    });
  }
  return map;
}

export function resolveArcCoreRedPlanetDevPortfolio(planetId: string): ArcCoreRedPlanetDevPortfolioRow | null {
  if (!portfolioByPlanetId) portfolioByPlanetId = buildPortfolioMap();
  return portfolioByPlanetId.get(planetId) ?? null;
}

export function resolveArcCoreRedPlanetDevPriorityRank(planetId: string): number {
  return resolveArcCoreRedPlanetDevPortfolio(planetId)?.priorityRank ?? DEFAULT_RANK;
}
