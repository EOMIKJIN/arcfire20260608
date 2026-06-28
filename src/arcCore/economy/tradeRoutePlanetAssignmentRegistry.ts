// ============================================================
// trade_route_planet_supply_assignments.csv — 행성별 생산(구매) 1:1 배정
// ============================================================

import { TradeRoutePlanetSupplyAssignments_FROM_BALANCE_CSV } from '../../data/balance/generated';

const supplyByPlanetId = new Map<string, string[]>();
const demandByPlanetId = new Map<string, string[]>();
const supplyPlanetByTgId = new Map<string, string>();
const demandPlanetByTgId = new Map<string, string>();

/** synth 프론티어 — dev_trade_port 설치 후 런타임 교역품 배정 */
const runtimeSupplyByPlanetId = new Map<string, string[]>();
const runtimeDemandByPlanetId = new Map<string, string[]>();
const runtimeDemandPlanetsByTgId = new Map<string, Set<string>>();

export function registerRuntimeTradeRouteAssignments(
  planetId: string,
  supplyTgIds: readonly string[],
  demandTgIds: readonly string[],
): void {
  runtimeSupplyByPlanetId.set(planetId, [...new Set(supplyTgIds)].sort());
  runtimeDemandByPlanetId.set(planetId, [...new Set(demandTgIds)].sort());
  for (const tgId of runtimeDemandPlanetsByTgId.keys()) {
    runtimeDemandPlanetsByTgId.get(tgId)?.delete(planetId);
  }
  for (const tgId of demandTgIds) {
    const set = runtimeDemandPlanetsByTgId.get(tgId) ?? new Set<string>();
    set.add(planetId);
    runtimeDemandPlanetsByTgId.set(tgId, set);
  }
}

export function unregisterRuntimeTradeRouteAssignments(planetId: string): void {
  runtimeSupplyByPlanetId.delete(planetId);
  runtimeDemandByPlanetId.delete(planetId);
  for (const tgId of runtimeDemandPlanetsByTgId.keys()) {
    runtimeDemandPlanetsByTgId.get(tgId)?.delete(planetId);
  }
}

export function clearRuntimeTradeRouteAssignments(): void {
  runtimeSupplyByPlanetId.clear();
  runtimeDemandByPlanetId.clear();
  runtimeDemandPlanetsByTgId.clear();
}

export function listRuntimeDemandPlanetsForTradeGood(goodId: string): string[] {
  const set = runtimeDemandPlanetsByTgId.get(goodId);
  return set ? [...set].sort() : [];
}

function ensureIndex(): void {
  if (supplyByPlanetId.size > 0) return;
  for (const row of TradeRoutePlanetSupplyAssignments_FROM_BALANCE_CSV) {
    const tgId = String(row.tgId).trim();
    const supplyPlanetId = String(row.supplyPlanetId).trim();
    const demandPlanetId = String(row.demandPlanetId).trim();
    if (!tgId || !supplyPlanetId) continue;
    supplyPlanetByTgId.set(tgId, supplyPlanetId);
    if (demandPlanetId) demandPlanetByTgId.set(tgId, demandPlanetId);

    const supplyList = supplyByPlanetId.get(supplyPlanetId) ?? [];
    supplyList.push(tgId);
    supplyByPlanetId.set(supplyPlanetId, supplyList);

    if (demandPlanetId) {
      const demandList = demandByPlanetId.get(demandPlanetId) ?? [];
      demandList.push(tgId);
      demandByPlanetId.set(demandPlanetId, demandList);
    }
  }
  for (const [pid, list] of supplyByPlanetId) {
    supplyByPlanetId.set(pid, [...new Set(list)].sort());
  }
  for (const [pid, list] of demandByPlanetId) {
    demandByPlanetId.set(pid, [...new Set(list)].sort());
  }
}

export function resolveTradeRouteAssignedSupplyPlanetId(tgId: string): string | null {
  ensureIndex();
  return supplyPlanetByTgId.get(tgId) ?? null;
}

export function resolveTradeRouteAssignedDemandPlanetId(tgId: string): string | null {
  ensureIndex();
  return demandPlanetByTgId.get(tgId) ?? null;
}

/** 무역소 구매 탭 — 이 행성에 배정된 생산 교역품만 */
export function listTradeRouteSupplyAssignedItemIdsForPlanet(planetId: string): string[] {
  ensureIndex();
  const csv = supplyByPlanetId.get(planetId) ?? [];
  const runtime = runtimeSupplyByPlanetId.get(planetId) ?? [];
  if (runtime.length === 0) return csv;
  return [...new Set([...csv, ...runtime])].sort();
}

export function listTradeRouteDemandAssignedItemIdsForPlanet(planetId: string): string[] {
  ensureIndex();
  const csv = demandByPlanetId.get(planetId) ?? [];
  const runtime = runtimeDemandByPlanetId.get(planetId) ?? [];
  if (runtime.length === 0) return csv;
  return [...new Set([...csv, ...runtime])].sort();
}
