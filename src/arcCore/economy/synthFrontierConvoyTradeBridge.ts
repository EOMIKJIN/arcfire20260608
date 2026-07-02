// ============================================================
// synth 프론티어 — dev_trade_port 설치 → 교역·수송선단·경제 연동
// ============================================================

import { getSynthSystemColonizationRow } from '../balance/balanceTableRegistry';
import { forceResyncPlanetTradePortCatalog } from '../balance/tradePortCatalogPolicy';
import { getPlanetLevelingRowForZone } from '../planetBalance/planetZoneIndexRegistry';
import { isPlanetCsvTradePortWorldEnabled } from '../../game/planetDevelopment/planetCsvWorldFlags';
import { isSynthFrontierPlanetId } from '../../world/isSynthFrontierPlanetId';
import { resolveSystemIdForPlanetId } from '../../world/resolvePlanetSystemId';
import { rebuildPlanetTradeMarket } from '../../world/planetTradeMarketStore';
import { useWorldStore } from '../../store/worldStore';
import {
  listTradeRouteItems,
  registerRuntimePlanetTradeRouteProfile,
  unregisterRuntimePlanetTradeRouteProfile,
  clearRuntimePlanetTradeRouteProfiles,
  getPlanetTradeRouteProfile,
  type PlanetTradeRouteProfile,
} from './tradeRouteRegistry';
import {
  clearRuntimeTradeRouteAssignments,
  registerRuntimeTradeRouteAssignments,
  unregisterRuntimeTradeRouteAssignments,
} from './tradeRoutePlanetAssignmentRegistry';
import { splitPipeCategoriesFromSectorBand } from './tradeRouteSectorCategories';

type QuadrantKey = 'north' | 'south' | 'east' | 'west';

/** synth 런타임 convoy SKU 상한 — CSV 21행성 1:1(~10) 정렬 */
const SYNTH_RUNTIME_TRADE_ROUTE_SKU_CAP = 10;

const QUADRANT_TRADE_FACTION: Record<
  QuadrantKey,
  Pick<PlanetTradeRouteProfile, 'tradeFactionCode' | 'tradeRegionCode'>
> = {
  north: { tradeFactionCode: 'F4', tradeRegionCode: 'N' },
  south: { tradeFactionCode: 'F2', tradeRegionCode: 'S' },
  east: { tradeFactionCode: 'F3', tradeRegionCode: 'E' },
  west: { tradeFactionCode: 'F1', tradeRegionCode: 'W' },
};

function parseCsvNum(raw: string | number | undefined, fallback: number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function resolveQuadrantFromTradeProfile(profile: string | undefined, fallback: QuadrantKey): QuadrantKey {
  const p = String(profile ?? '').trim().toLowerCase();
  if (p === 'north' || p === 'east' || p === 'south' || p === 'west') return p;
  return fallback;
}

function capSynthRuntimeTgIds(ids: string[]): string[] {
  const sorted = [...new Set(ids)].sort();
  return sorted.length <= SYNTH_RUNTIME_TRADE_ROUTE_SKU_CAP
    ? sorted
    : sorted.slice(0, SYNTH_RUNTIME_TRADE_ROUTE_SKU_CAP);
}

function computeTradeRouteAssignmentsForFaction(
  tradeFactionCode: string,
  sectorBand: string,
): { supplyTgIds: string[]; demandTgIds: string[] } {
  const allowedCategories = splitPipeCategoriesFromSectorBand(sectorBand);
  const supplyTgIds: string[] = [];
  const demandTgIds: string[] = [];
  for (const item of listTradeRouteItems()) {
    if (!allowedCategories.has(item.category)) continue;
    if (item.attrs.srcFactionCode === tradeFactionCode) supplyTgIds.push(item.id);
    if (item.attrs.dstFactionCode === tradeFactionCode) demandTgIds.push(item.id);
  }
  return {
    supplyTgIds: capSynthRuntimeTgIds(supplyTgIds),
    demandTgIds: capSynthRuntimeTgIds(demandTgIds),
  };
}

function readPlanetTradePortInstalled(planetId: string): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isPlanetTradePortInstalled } = require('../../game/planetDevelopment/planetTradePortListing') as typeof import('../../game/planetDevelopment/planetTradePortListing');
    return isPlanetTradePortInstalled(planetId);
  } catch {
    return false;
  }
}

function isUnlockedSynthFrontierPlanet(planetId: string): boolean {
  if (!isSynthFrontierPlanetId(planetId)) return false;
  const systemId = resolveSystemIdForPlanetId(planetId);
  if (!systemId || !systemId.startsWith('synth_')) return false;
  const world = useWorldStore.getState();
  if (!world.loaded) return false;
  return world.unlockedSystemIds.includes(systemId);
}

/** 무역소(월드·dev) 또는 ArcCore 개방 synth(교역 프로필 등록) — convoy·재정 생태계 */
export function isPlanetConvoyTradeEnabled(planetId: string): boolean {
  if (!planetId) return false;
  if (readPlanetTradePortInstalled(planetId) || isPlanetCsvTradePortWorldEnabled(planetId)) {
    return true;
  }
  if (
    isUnlockedSynthFrontierPlanet(planetId)
    && getPlanetTradeRouteProfile(planetId)
  ) {
    return true;
  }
  // headless audit — dev 무역소 mock 없이 runtime synth 프로필 fixture
  if (
    process.env.ARCFIRE_HEADLESS_ECONOMY_AUDIT === '1'
    && isSynthFrontierPlanetId(planetId)
    && getPlanetTradeRouteProfile(planetId)
  ) {
    return true;
  }
  return false;
}

/**
 * synth 행성 교역 프로필·SKU 등록(무역소 게이트 없음) — activate·audit 공용.
 */
function applySynthFrontierConvoyTradeProfile(planetId: string): boolean {
  if (!isSynthFrontierPlanetId(planetId)) return false;

  const systemId = resolveSystemIdForPlanetId(planetId);
  if (!systemId) return false;

  const csvRow = getSynthSystemColonizationRow(systemId);
  if (!csvRow) return false;

  const quadrant = resolveQuadrantFromTradeProfile(String(csvRow.tradeProfile ?? ''), 'east');
  const tradeMeta = QUADRANT_TRADE_FACTION[quadrant];

  registerRuntimePlanetTradeRouteProfile({
    planetId,
    tradeFactionCode: tradeMeta.tradeFactionCode,
    tradeRegionCode: tradeMeta.tradeRegionCode,
  });

  const zoneIndex = parseCsvNum(csvRow.zoneIndex, 1);
  const levelingRow = getPlanetLevelingRowForZone(zoneIndex);
  const sectorBand = String(levelingRow.sectorBand ?? 'early');
  const { supplyTgIds, demandTgIds } = computeTradeRouteAssignmentsForFaction(
    tradeMeta.tradeFactionCode,
    sectorBand,
  );
  registerRuntimeTradeRouteAssignments(planetId, supplyTgIds, demandTgIds);

  rebuildPlanetTradeMarket(planetId, planetId.length * 37, true);
  forceResyncPlanetTradePortCatalog(planetId);
  return true;
}

/**
 * ArcCore 개방 synth — 교역 프로필·SKU·시장 등록(플레이어 무역소 dev 불필요).
 * idempotent — 재호출 안전.
 */
export function enrollSynthFrontierPlanetInArcEconomy(planetId: string): boolean {
  if (!isUnlockedSynthFrontierPlanet(planetId)) return false;
  return applySynthFrontierConvoyTradeProfile(planetId);
}

/** 잠금(reconcile)된 synth — 런타임 교역·SKU 해제 */
export function deactivateRemovedSynthFrontierEconomies(systemIds: readonly string[]): void {
  const world = useWorldStore.getState();
  for (const rawId of systemIds) {
    const systemId = String(rawId ?? '').trim();
    if (!systemId.startsWith('synth_')) continue;
    const system = world.getSystem(systemId);
    for (const planet of system?.planets ?? []) {
      deactivateSynthFrontierConvoyTrade(planet.id);
    }
  }
}

/**
 * 부트·일일 배치 — 개방된 synth 전원 경제 생태계 등록(순차 개방 포함).
 */
export function ensureUnlockedSynthFrontierEconomyEnrollment(): number {
  let enrolled = 0;
  const world = useWorldStore.getState();
  if (!world.loaded) return 0;
  const unlocked = new Set(world.unlockedSystemIds);
  for (const system of Object.values(world.systems)) {
    if (!system.id.startsWith('synth_') || !unlocked.has(system.id)) continue;
    for (const planet of system.planets) {
      if (enrollSynthFrontierPlanetInArcEconomy(planet.id)) enrolled += 1;
    }
  }
  return enrolled;
}

/**
 * synth 행성 dev_trade_port 설치 완료 — 교역 프로필·SKU·시장·수송선단 경로 등록.
 * idempotent — 재호출 안전.
 */
export function activateSynthFrontierConvoyTrade(planetId: string): boolean {
  if (!readPlanetTradePortInstalled(planetId)) return false;
  return applySynthFrontierConvoyTradeProfile(planetId);
}

/** 헤드리스 convoy audit — dev 무역소 설치 가정 fixture */
export function seedSynthConvoyAuditFixtures(planetIds: readonly string[]): number {
  if (process.env.ARCFIRE_HEADLESS_ECONOMY_AUDIT !== '1') return 0;
  let activated = 0;
  for (const planetId of planetIds) {
    if (applySynthFrontierConvoyTradeProfile(planetId)) activated += 1;
  }
  return activated;
}

export function deactivateSynthFrontierConvoyTrade(planetId: string): void {
  if (!planetId) return;
  unregisterRuntimePlanetTradeRouteProfile(planetId);
  unregisterRuntimeTradeRouteAssignments(planetId);
}

export function clearSynthFrontierConvoyTradeRuntime(): void {
  clearRuntimePlanetTradeRouteProfiles();
  clearRuntimeTradeRouteAssignments();
}

/** 부트·세션 — dev_trade_port 설치분 convoy 재등록(개방 synth 연동은 integrate* 사용) */
export function rehydrateSynthFrontierConvoyTradeFromInstalledPorts(): number {
  let activated = 0;
  const world = useWorldStore.getState();
  const unlocked = new Set(world.unlockedSystemIds);
  for (const system of Object.values(world.systems)) {
    if (!system.id.startsWith('synth_')) continue;
    if (!unlocked.has(system.id)) continue;
    for (const planet of system.planets) {
      if (!readPlanetTradePortInstalled(planet.id)) continue;
      if (activateSynthFrontierConvoyTrade(planet.id)) activated += 1;
    }
  }
  return activated;
}

/** @deprecated worldStore.loadLocalWorld — reconcileUnlockedSynthPhaseOnWorldLoad 사용 */
export function reconcileSynthFrontierWorldOnLoad(): void {
  const world = useWorldStore.getState();
  for (const systemId of world.unlockedSystemIds) {
    if (!systemId.startsWith('synth_')) continue;
    const system = world.getSystem(systemId);
    const planetId = system?.planets[0]?.id;
    if (!planetId) continue;
    if (world.getSynthColonizationPhase(planetId) < 1) {
      world.applySynthColonizationPhase(systemId, 1);
    }
  }
}
