// ============================================================
// 은하 이동 연료비 견적 — 홉·맵 거리·함급·연료효율(향후 스킬/아이템)
// ============================================================

import type { PlayerShip, StarSystem } from '../../types';
import { resolvePlayerDefaultNpcCapitalShipId } from '../../arcCore/balance/capitalHullPurchaseFromBalance';
import { resolveHullTierKeyForNpcShipId } from '../../arcCore/balance/tradePortCapitalShipPolicy';
import {
  resolveGalaxyTransitFuelPolicy,
  resolveGalaxyTransitHullFuelCostMul,
} from './galaxyTransitFuelPolicy';

export type GalaxyTransitFuelQuote = {
  totalCredits: number;
  hopCount: number;
  hullTierKey: string;
  hullFuelCostMul: number;
  fuelEfficiencyPct: number;
  perHopCredits: readonly number[];
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function mapEdgeDistance(a: StarSystem, b: StarSystem): number {
  const dx = a.position.x - b.position.x;
  const dy = a.position.y - b.position.y;
  return Math.hypot(dx, dy);
}

function resolveDistanceMul(edgeDistance: number, policy: ReturnType<typeof resolveGalaxyTransitFuelPolicy>): number {
  const raw = edgeDistance / policy.referenceHopDistance;
  return clamp(raw, policy.distanceMulMin, policy.distanceMulMax);
}

export function resolvePlayerFlagshipNpcShipId(ship: PlayerShip | null | undefined): string {
  const current = ship?.portraitNpcCapitalShipId?.trim();
  if (current) return current;
  return resolvePlayerDefaultNpcCapitalShipId();
}

/** 향후 스킬·장비 fuel_efficiency 합산 — 현재 0%(배율 1.0) */
export function resolvePlayerGalaxyTransitFuelEfficiencyPct(
  _ship: PlayerShip | null | undefined,
): number {
  return 0;
}

function applyFuelEfficiency(total: number, efficiencyPct: number, capPct: number): number {
  const capped = clamp(efficiencyPct, 0, capPct);
  const mul = 1 - capped / 100;
  return Math.max(0, Math.round(total * mul));
}

export function computeGalaxyTransitFuelQuote(input: {
  systems: Record<string, StarSystem>;
  pathSystemIds: readonly string[];
  ship: PlayerShip | null | undefined;
}): GalaxyTransitFuelQuote | null {
  const { systems, pathSystemIds, ship } = input;
  if (pathSystemIds.length < 2) return null;

  const policy = resolveGalaxyTransitFuelPolicy();
  const npcShipId = resolvePlayerFlagshipNpcShipId(ship);
  const hullTierKey = resolveHullTierKeyForNpcShipId(npcShipId) ?? 'frigate_default';
  const hullFuelCostMul = resolveGalaxyTransitHullFuelCostMul(hullTierKey);
  const fuelEfficiencyPct = resolvePlayerGalaxyTransitFuelEfficiencyPct(ship);

  const perHopCredits: number[] = [];
  for (let i = 0; i < pathSystemIds.length - 1; i += 1) {
    const from = systems[pathSystemIds[i]!];
    const to = systems[pathSystemIds[i + 1]!];
    if (!from || !to) return null;
    const distanceMul = resolveDistanceMul(mapEdgeDistance(from, to), policy);
    const raw = policy.baseCreditsPerHop * distanceMul * hullFuelCostMul;
    perHopCredits.push(Math.max(policy.minCreditsPerHop, Math.round(raw)));
  }

  const subtotal = perHopCredits.reduce((sum, n) => sum + n, 0);
  const totalCredits = applyFuelEfficiency(subtotal, fuelEfficiencyPct, policy.fuelEfficiencyStatCapPct);

  return {
    totalCredits,
    hopCount: perHopCredits.length,
    hullTierKey,
    hullFuelCostMul,
    fuelEfficiencyPct,
    perHopCredits,
  };
}

export function canAffordGalaxyTransitFuel(credits: number, quote: GalaxyTransitFuelQuote | null): boolean {
  if (!quote) return false;
  if (quote.totalCredits <= 0) return true;
  return credits >= quote.totalCredits;
}
