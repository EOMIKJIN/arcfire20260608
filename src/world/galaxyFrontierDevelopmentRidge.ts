// ============================================================
// 은하 발전 능선 — 뉴에덴·4대 항로 수도 근접도
// 코어 21 손맛은 planets.csv / genesis CSV. synth·확장은 거리 공식.
// ============================================================

import { GALAXY_SYSTEMS } from '../data/galaxy100';
import { STAR_SYSTEMS } from '../data/systems';
import { GALAXY_ROUTE_POLICIES } from './galaxyRouteFactionPolicy';
import {
  resolveSystemIdForPlanetIdFromGalaxy,
  resolveSystemPositionForPlanetId,
} from './resolvePlanetSystemPosition';

export type FrontierBand = 'A' | 'B' | 'C' | 'D';

export type FrontierFacilitySeed = {
  hasTradePort: boolean;
  hasShipyard: boolean;
  hasBar: boolean;
};

export type FrontierGenesisGauge = {
  genesisResourcePct: number;
  genesisPopulationPct: number;
  genesisDefensePct: number;
  genesisTechnologyPct: number;
  genesisEnvironmentPct: number;
  depositWeightMul: number;
};

const SIGMA_CORE = 0.42;
const SIGMA_RIM = 0.4;
const BAND_B_MIN = 0.42;
const BAND_C_MIN = 0.2;
const DEPOSIT_BASELINE_R = 50;
/** 남·북 수도 벨트 — 무역만. BAND_B(0.42)보다 좁혀 비콘 hop 밖 난립 방지 */
const RIM_FACILITY_TRADE_MIN = 0.72;
/** 남·북 수도 바로 옆 — 무역+조선+바 */
const RIM_FACILITY_FULL_MIN = 0.85;

const NEW_EDEN_PLANET_ID = 'eden_city';
/** 비콘 개척지 — 아르카디아 5홉. 이 hop부터 월드 시설 0(외부 수도 근처만 재상승) */
const BEACON_COLONY_SYSTEM_ID = 'synth_057';
const CORE_HOP_ORIGINS = ['arcadia', 'new_eden'] as const;
const RIM_CAPITAL_PLANET_IDS = ['synth_706_p', 'synth_732_p'] as const;

const NONE_FACILITY: FrontierFacilitySeed = {
  hasTradePort: false,
  hasShipyard: false,
  hasBar: false,
};
const TRADE_ONLY_FACILITY: FrontierFacilitySeed = {
  hasTradePort: true,
  hasShipyard: false,
  hasBar: false,
};
const FULL_WORLD_FACILITY: FrontierFacilitySeed = {
  hasTradePort: true,
  hasShipyard: true,
  hasBar: true,
};

let corePlanetIds: Set<string> | null = null;
let ridgeCache: Map<string, { proximity: number; band: FrontierBand }> | null = null;
let genesisCache: Map<string, FrontierGenesisGauge> | null = null;
let coreHopBySystemId: Map<string, number> | null = null;
let beaconWildernessHop: number | null = null;

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));
}

function planetIdSeed(planetId: string): number {
  let s = 0;
  for (let i = 0; i < planetId.length; i += 1) {
    s += planetId.charCodeAt(i) * (i + 17);
  }
  return s;
}

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getCorePlanetIds(): Set<string> {
  if (corePlanetIds) return corePlanetIds;
  const ids = new Set<string>();
  for (const system of Object.values(STAR_SYSTEMS)) {
    for (const planet of system.planets) {
      if (planet.id) ids.add(planet.id);
    }
  }
  corePlanetIds = ids;
  return ids;
}

export function isCoreScenarioPlanetId(planetId: string): boolean {
  return getCorePlanetIds().has(String(planetId ?? '').trim());
}

export function listRouteCapitalPlanetIds(): string[] {
  return Object.values(GALAXY_ROUTE_POLICIES)
    .map((p) => String(p.centerPlanetId ?? '').trim())
    .filter(Boolean);
}

export function isRouteCapitalPlanetId(planetId: string): boolean {
  const id = String(planetId ?? '').trim();
  if (!id) return false;
  return listRouteCapitalPlanetIds().includes(id);
}

function buildUndirectedGalaxyAdj(): Map<string, string[]> {
  const adj = new Map<string, Set<string>>();
  const add = (a: string, b: string) => {
    if (!a || !b || a === b) return;
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  };
  for (const sys of [...Object.values(STAR_SYSTEMS), ...Object.values(GALAXY_SYSTEMS)]) {
    for (const raw of sys.connections ?? []) {
      add(sys.id, String(raw ?? '').trim());
    }
  }
  return new Map([...adj].map(([k, v]) => [k, [...v]]));
}

function ensureCoreHopIndex(): Map<string, number> {
  if (coreHopBySystemId) return coreHopBySystemId;
  const adj = buildUndirectedGalaxyAdj();
  const dist = new Map<string, number>();
  const q: string[] = [];
  for (const origin of CORE_HOP_ORIGINS) {
    if (!adj.has(origin) && !STAR_SYSTEMS[origin] && !GALAXY_SYSTEMS[origin]) continue;
    dist.set(origin, 0);
    q.push(origin);
  }
  for (let i = 0; i < q.length; i += 1) {
    const cur = q[i]!;
    const d = dist.get(cur)!;
    for (const next of adj.get(cur) ?? []) {
      if (dist.has(next)) continue;
      dist.set(next, d + 1);
      q.push(next);
    }
  }
  coreHopBySystemId = dist;
  beaconWildernessHop = dist.get(BEACON_COLONY_SYSTEM_ID) ?? 5;
  return dist;
}

function resolveSystemIdForFrontierPlanet(planetId: string): string {
  const id = String(planetId ?? '').trim();
  return resolveSystemIdForPlanetIdFromGalaxy(id)
    ?? (id.endsWith('_p') ? id.slice(0, -2) : id);
}

/** 아르카디아·뉴에덴까지 무방향 hop. 미연결 확장은 Infinity. */
export function resolveFrontierCoreHop(planetId: string): number {
  const sid = resolveSystemIdForFrontierPlanet(planetId);
  if (!sid) return Number.POSITIVE_INFINITY;
  return ensureCoreHopIndex().get(sid) ?? Number.POSITIVE_INFINITY;
}

/** 비콘 개척지(synth_057) hop — 월드 시설 황무지 하한 */
export function resolveBeaconWildernessHop(): number {
  ensureCoreHopIndex();
  return beaconWildernessHop ?? 5;
}

export function isBeaconColonyPlanetId(planetId: string): boolean {
  return resolveSystemIdForFrontierPlanet(planetId) === BEACON_COLONY_SYSTEM_ID;
}

function gaussianProximity(
  pos: { x: number; y: number },
  anchor: { x: number; y: number },
  sigma: number,
): number {
  const dx = pos.x - anchor.x;
  const dy = pos.y - anchor.y;
  const d2 = dx * dx + dy * dy;
  return Math.exp(-d2 / (2 * sigma * sigma));
}

function resolveAnchorPosition(planetId: string): { x: number; y: number } | null {
  return resolveSystemPositionForPlanetId(planetId);
}

function computeRimCapitalProximity(planetId: string): number {
  const pos = resolveSystemPositionForPlanetId(planetId);
  if (!pos) return 0;
  let best = 0;
  for (const cap of RIM_CAPITAL_PLANET_IDS) {
    const ap = resolveAnchorPosition(cap);
    if (!ap) continue;
    const p = gaussianProximity(pos, ap, SIGMA_RIM);
    if (p > best) best = p;
  }
  return best;
}

function computeRidgeProximity(planetId: string): number {
  const pos = resolveSystemPositionForPlanetId(planetId);
  if (!pos) return 0;
  const anchors: Array<{ planetId: string; sigma: number }> = [
    { planetId: NEW_EDEN_PLANET_ID, sigma: SIGMA_CORE },
    { planetId: 'core_prime', sigma: SIGMA_CORE },
    { planetId: 'synth_706_p', sigma: SIGMA_RIM },
    { planetId: 'synth_732_p', sigma: SIGMA_RIM },
  ];
  let best = 0;
  for (const a of anchors) {
    const ap = resolveAnchorPosition(a.planetId);
    if (!ap) continue;
    const p = gaussianProximity(pos, ap, a.sigma);
    if (p > best) best = p;
  }
  return best;
}

function bandFromProximity(proximity: number, planetId: string): FrontierBand {
  if (isCoreScenarioPlanetId(planetId) || isRouteCapitalPlanetId(planetId)) return 'A';
  if (proximity >= BAND_B_MIN) return 'B';
  if (proximity >= BAND_C_MIN) return 'C';
  return 'D';
}

function ensureRidge(planetId: string): { proximity: number; band: FrontierBand } {
  const id = String(planetId ?? '').trim();
  if (!ridgeCache) ridgeCache = new Map();
  const hit = ridgeCache.get(id);
  if (hit) return hit;
  const proximity = id ? computeRidgeProximity(id) : 0;
  const row = { proximity, band: bandFromProximity(proximity, id) };
  if (id) ridgeCache.set(id, row);
  return row;
}

export function resolveGalaxyFrontierProximity(planetId: string): number {
  return ensureRidge(planetId).proximity;
}

export function resolveGalaxyFrontierBand(planetId: string): FrontierBand {
  return ensureRidge(planetId).band;
}

function capitalGenesisTemplate(planetId: string): FrontierGenesisGauge {
  const seed = planetIdSeed(planetId);
  const j = (k: number) => (pseudoRandom(seed + k) - 0.5) * 4;
  const resource = clamp100(52 + j(1));
  const population = clamp100(54 + j(3));
  const defense = clamp100(50 + j(7));
  const technology = clamp100(52 + j(11));
  const environment = clamp100(48 + j(19));
  return {
    genesisResourcePct: resource,
    genesisPopulationPct: population,
    genesisDefensePct: defense,
    genesisTechnologyPct: technology,
    genesisEnvironmentPct: environment,
    depositWeightMul: resource / DEPOSIT_BASELINE_R,
  };
}

function ridgeGenesisGauge(planetId: string, proximity: number): FrontierGenesisGauge {
  const seed = planetIdSeed(planetId);
  const j = (k: number) => (pseudoRandom(seed + k) - 0.5) * 6;
  const civic = 8 + proximity * 34;
  const resourceBase = 10 + proximity * 30;
  const resource = clamp100(resourceBase + j(1));
  const population = clamp100(civic + j(3) - 1);
  const defense = clamp100(civic + j(7) - 2);
  const technology = clamp100(civic + j(11));
  const environment = clamp100(civic + j(19) - 1);
  return {
    genesisResourcePct: resource,
    genesisPopulationPct: population,
    genesisDefensePct: defense,
    genesisTechnologyPct: technology,
    genesisEnvironmentPct: environment,
    depositWeightMul: resource / DEPOSIT_BASELINE_R,
  };
}

/** synth·확장 태초 5지표. 코어 21은 호출하지 말 것(CSV 정본). */
export function resolveFrontierRidgeGenesisGauge(planetId: string): FrontierGenesisGauge {
  const id = String(planetId ?? '').trim();
  if (!genesisCache) genesisCache = new Map();
  const hit = genesisCache.get(id);
  if (hit) return hit;
  const gauge = isRouteCapitalPlanetId(id)
    ? capitalGenesisTemplate(id)
    : ridgeGenesisGauge(id, ensureRidge(id).proximity);
  if (id) genesisCache.set(id, gauge);
  return gauge;
}

/**
 * 월드 시설 시드 — 연구소는 항상 플레이어 설치.
 * 비콘 개척지 hop(아르카디아 5) 이상 = 0시설. 남·북 수도 근처만 재상승.
 * hop 1~2 = 무역+조선+바 · hop 3~(비콘-1) = 무역만.
 */
export function resolveFrontierWorldFacilitySeed(
  planetId: string,
  colonizationPhase: number,
): FrontierFacilitySeed {
  const id = String(planetId ?? '').trim();
  if (!id) return NONE_FACILITY;
  if (isRouteCapitalPlanetId(id)) return FULL_WORLD_FACILITY;
  if (colonizationPhase < 1) return NONE_FACILITY;

  const hop = resolveFrontierCoreHop(id);
  const wildernessHop = resolveBeaconWildernessHop();
  if (hop >= wildernessHop) {
    const rim = computeRimCapitalProximity(id);
    if (rim >= RIM_FACILITY_FULL_MIN) return FULL_WORLD_FACILITY;
    if (rim >= RIM_FACILITY_TRADE_MIN) return TRADE_ONLY_FACILITY;
    return NONE_FACILITY;
  }
  if (hop <= 2) return FULL_WORLD_FACILITY;
  return TRADE_ONLY_FACILITY;
}

export function resolveRouteCapitalDisplayOverride(planetId: string): {
  systemNameKo: string;
  systemNameEn: string;
  planetNameKo: string;
  planetNameEn: string;
  systemDescriptionKo: string;
  systemDescriptionEn: string;
} | null {
  const id = String(planetId ?? '').trim();
  if (id === 'synth_706_p') {
    return {
      systemNameKo: '머큐리움 본성',
      systemNameEn: 'Mercurium Seat',
      planetNameKo: '머큐리움 프라임',
      planetNameEn: 'Mercurium Prime',
      systemDescriptionKo: '남부항로 끝의 머큐리움 연합 수도 성계.',
      systemDescriptionEn: 'Mercurium Coalition capital at the south-route tip.',
    };
  }
  if (id === 'synth_732_p') {
    return {
      systemNameKo: '아우렐리움 본성',
      systemNameEn: 'Aurelium Seat',
      planetNameKo: '아우렐리움 프라임',
      planetNameEn: 'Aurelium Prime',
      systemDescriptionKo: '북부항로 끝의 아우렐리움 길드 수도 성계.',
      systemDescriptionEn: 'Aurelium Guild capital at the north-route tip.',
    };
  }
  return null;
}

/** 일일 에너지 패스 — 오지·내륙은 genesis R 근처만 허용 */
/**
 * 오지 월드 — 일일 MasterBalance·체류 civic이 genesis 바닥을 끌어올리지 않음.
 * 코어 21·항로 수도·능선 시설이 있는 벨트는 기존대로 둠.
 */
export function isFrontierWildernessGaugeHold(planetId: string): boolean {
  const id = String(planetId ?? '').trim();
  if (!id || isCoreScenarioPlanetId(id) || isRouteCapitalPlanetId(id)) return false;
  const seed = resolveFrontierWorldFacilitySeed(id, 1);
  return !seed.hasTradePort && !seed.hasShipyard && !seed.hasBar;
}

export function resolveFrontierEnergyResourceCap(planetId: string, genesisR: number): number {
  const band = resolveGalaxyFrontierBand(planetId);
  if (band === 'D') return clamp100(genesisR + 3);
  if (band === 'C') return clamp100(genesisR + 6);
  if (band === 'B') return clamp100(genesisR + 10);
  return 100;
}

export function invalidateGalaxyFrontierRidgeCache(): void {
  ridgeCache = null;
  genesisCache = null;
  corePlanetIds = null;
  coreHopBySystemId = null;
  beaconWildernessHop = null;
}
