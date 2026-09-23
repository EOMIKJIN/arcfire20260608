// ============================================================
// 은하 이동 연료비 견적 — 홉·맵 거리·함급·연료효율(스킬 fuel_efficiency)
// ============================================================

import type { PlayerShip, StarSystem } from '../../types';
import { resolvePlayerDefaultNpcCapitalShipId } from '../../arcCore/balance/capitalHullPurchaseFromBalance';
import { resolveHullTierKeyForNpcShipId } from '../../arcCore/balance/tradePortCapitalShipPolicy';
import { resolvePlayerOwnedSkillStatBonus } from '../playerOwnedSkillStatBonus';
import {
  applyGalaxyTransitFuelEfficiency,
  resolveGalaxyTransitFuelPolicy,
  resolveGalaxyTransitHullFuelCostMul,
} from './galaxyTransitFuelPolicy';
import {
  applyPostCapNavFuelDiscount,
  resolveWormholeFinderSkipHops,
  resolveWormholeGeneratorSkipHops,
} from '../playerOwnedSkillNavAdjust';

export { applyGalaxyTransitFuelEfficiency } from './galaxyTransitFuelPolicy';

export type GalaxyTransitFuelQuote = {
  totalCredits: number;
  hopCount: number;
  hullTierKey: string;
  hullFuelCostMul: number;
  fuelEfficiencyPct: number;
  perHopCredits: readonly number[];
  wormholeProc: boolean;
  jumpBoostProc: boolean;
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
  const ratio = Math.max(0.01, edgeDistance / policy.referenceHopDistance);
  const raw = Math.pow(ratio, policy.distanceCurveExponent);
  return clamp(raw, policy.distanceMulMin, policy.distanceMulMax);
}

function resolveHopProgressionMul(hopIndex: number, policy: ReturnType<typeof resolveGalaxyTransitFuelPolicy>): number {
  if (hopIndex <= 0 || policy.hopProgressionRate <= 0) return 1;
  return Math.pow(1 + policy.hopProgressionRate, hopIndex);
}

function resolveRouteLengthMul(hopCount: number, policy: ReturnType<typeof resolveGalaxyTransitFuelPolicy>): number {
  if (hopCount <= 1 || policy.routeLengthExponent <= 1) return 1;
  const ref = Math.max(1, policy.referenceRouteHopCount);
  if (hopCount <= ref) return 1;
  return Math.pow(hopCount / ref, policy.routeLengthExponent);
}

export function resolvePlayerFlagshipNpcShipId(ship: PlayerShip | null | undefined): string {
  const current = ship?.portraitNpcCapitalShipId?.trim();
  if (current) return current;
  return resolvePlayerDefaultNpcCapitalShipId();
}

/** 보유 스킬 `fuel_efficiency` 합산. 캡은 견적 `applyGalaxyTransitFuelEfficiency`에서 적용. `_ship`은 향후 장비용 자리. */
export function resolvePlayerGalaxyTransitFuelEfficiencyPct(
  _ship: PlayerShip | null | undefined,
): number {
  const raw = resolvePlayerOwnedSkillStatBonus('fuel_efficiency');
  return Number.isFinite(raw) && raw > 0 ? raw : 0;
}

export function computeGalaxyTransitFuelQuote(input: {
  systems: Record<string, StarSystem>;
  pathSystemIds: readonly string[];
  ship: PlayerShip | null | undefined;
  destSystemId?: string | null;
  visitedSystemIds?: readonly string[];
  ownedSkillIds?: readonly string[];
}): GalaxyTransitFuelQuote | null {
  const { systems, pathSystemIds, ship } = input;
  if (pathSystemIds.length < 2) return null;

  const policy = resolveGalaxyTransitFuelPolicy();
  const npcShipId = resolvePlayerFlagshipNpcShipId(ship);
  const hullTierKey = resolveHullTierKeyForNpcShipId(npcShipId) ?? 'frigate_default';
  const hullFuelCostMul = resolveGalaxyTransitHullFuelCostMul(hullTierKey);
  const rawFuelEfficiencyPct = resolvePlayerGalaxyTransitFuelEfficiencyPct(ship);
  const fuelEfficiencyPct = clamp(rawFuelEfficiencyPct, 0, policy.fuelEfficiencyStatCapPct);

  const perHopCredits: number[] = [];
  for (let i = 0; i < pathSystemIds.length - 1; i += 1) {
    const from = systems[pathSystemIds[i]!];
    const to = systems[pathSystemIds[i + 1]!];
    if (!from || !to) return null;
    const distanceMul = resolveDistanceMul(mapEdgeDistance(from, to), policy);
    const hopProgressionMul = resolveHopProgressionMul(i, policy);
    const raw = policy.baseCreditsPerHop * distanceMul * hullFuelCostMul * hopProgressionMul;
    perHopCredits.push(Math.max(policy.minCreditsPerHop, Math.round(raw)));
  }

  const hopCount = perHopCredits.length;
  const finderSkip = resolveWormholeFinderSkipHops({
    ownedSkillIds: input.ownedSkillIds,
    hopCount,
    fromSystemId: pathSystemIds[0],
    destSystemId: input.destSystemId ?? pathSystemIds[pathSystemIds.length - 1] ?? null,
  });
  const skipHops = Math.min(
    Math.max(0, hopCount - 1),
    resolveWormholeGeneratorSkipHops(input.ownedSkillIds) + finderSkip,
  );
  if (skipHops > 0) {
    perHopCredits.length = hopCount - skipHops;
  }
  const billedHopCount = perHopCredits.length;
  const routeLengthMul = resolveRouteLengthMul(billedHopCount, policy);
  const subtotal = Math.round(perHopCredits.reduce((sum, n) => sum + n, 0) * routeLengthMul);
  const afterCap = applyGalaxyTransitFuelEfficiency(
    subtotal,
    fuelEfficiencyPct,
    policy.fuelEfficiencyStatCapPct,
  );
  const destSystemId = input.destSystemId ?? pathSystemIds[pathSystemIds.length - 1] ?? null;
  const nav = applyPostCapNavFuelDiscount(afterCap, {
    ownedSkillIds: input.ownedSkillIds,
    destSystemId,
    visitedSystemIds: input.visitedSystemIds,
    hopCount: billedHopCount,
    hopSkipped: finderSkip > 0,
  });

  return {
    totalCredits: nav.credits,
    hopCount: perHopCredits.length,
    hullTierKey,
    hullFuelCostMul,
    fuelEfficiencyPct,
    perHopCredits,
    wormholeProc: nav.wormhole || skipHops > 0 || finderSkip > 0,
    jumpBoostProc: nav.jumpBoost,
  };
}

export function canAffordGalaxyTransitFuel(credits: number, quote: GalaxyTransitFuelQuote | null): boolean {
  if (!quote) return false;
  if (quote.totalCredits <= 0) return true;
  return credits >= quote.totalCredits;
}
