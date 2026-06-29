// ============================================================
// 행성 자원 생태계 — Table-First (planet_resource_ecosystem_policy.csv)
// 태초 R 10~70 · 플레이어 운영 30~70 · R↔매장·채굴상한
// ============================================================

import {
  PlanetResourceEcosystemPolicy_FROM_BALANCE_CSV,
  PlanetResourceGenesis_FROM_BALANCE_CSV,
} from '../../data/balance/generated';
import { resolvePlanetZoneIndex } from '../planetBalance/planetZoneIndexRegistry';
import { resolveStarSystemForPlanetId } from '../../world/resolvePlanetSystemPosition';
import { getPlanetRecord } from '../../world/planetTradePortDb';
import type { PlanetCoreGaugeView } from '../../store/planetCoreRuntimeStore';

let kv: Map<string, string> | null = null;

export type PlanetGenesisGauge = {
  genesisResourcePct: number;
  genesisPopulationPct: number;
  genesisDefensePct: number;
  genesisTechnologyPct: number;
  genesisEnvironmentPct: number;
  depositWeightMul: number;
};

let genesisByPlanetId: Map<string, PlanetGenesisGauge> | null = null;

function getKv(): Map<string, string> {
  if (!kv) {
    kv = new Map(
      PlanetResourceEcosystemPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return kv;
}

function num(key: string, fallback: number): number {
  const n = Number(getKv().get(key));
  return Number.isFinite(n) ? n : fallback;
}

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Math.round(Number.isFinite(n) ? n : 0)));
}

export type PlanetResourceEcosystemPolicy = {
  genesisRMin: number;
  genesisRMax: number;
  playerROperatingMin: number;
  playerROperatingMax: number;
  miningSessionCapAtRMin: number;
  miningSessionCapAtRMax: number;
  depositWeightBaselineR: number;
  resourceFullDevTargetPct: number;
  depositRuntimeRBlend: number;
};

export function resolvePlanetResourceEcosystemPolicy(): PlanetResourceEcosystemPolicy {
  return {
    genesisRMin: clamp100(num('genesis_r_min', 10)),
    genesisRMax: clamp100(num('genesis_r_max', 70)),
    playerROperatingMin: clamp100(num('player_r_operating_min', 30)),
    playerROperatingMax: clamp100(num('player_r_operating_max', 70)),
    miningSessionCapAtRMin: Math.max(1, Math.floor(num('mining_session_cap_at_r_min', 30))),
    miningSessionCapAtRMax: Math.max(1, Math.floor(num('mining_session_cap_at_r_max', 100))),
    depositWeightBaselineR: Math.max(1, num('deposit_weight_baseline_r', 50)),
    resourceFullDevTargetPct: clamp100(num('resource_full_dev_target_pct', 70)),
    depositRuntimeRBlend: Math.max(0, Math.min(1, num('deposit_runtime_r_blend', 0.6))),
  };
}

function readGenesisStat(row: Record<string, string>, key: string, fallback: number): number {
  const n = Number(row[key]);
  return clamp100(Number.isFinite(n) ? n : fallback);
}

function buildGenesisIndex(): Map<string, PlanetGenesisGauge> {
  const policy = resolvePlanetResourceEcosystemPolicy();
  const out = new Map<string, PlanetGenesisGauge>();
  for (const row of PlanetResourceGenesis_FROM_BALANCE_CSV) {
    const planetId = String(row.planetId ?? '').trim();
    if (!planetId) continue;
    const genesisResourcePct = readGenesisStat(row, 'genesisResourcePct', 50);
    const genesisPopulationPct = readGenesisStat(row, 'genesisPopulationPct', genesisResourcePct);
    const genesisDefensePct = readGenesisStat(row, 'genesisDefensePct', genesisResourcePct);
    const genesisTechnologyPct = readGenesisStat(row, 'genesisTechnologyPct', genesisResourcePct);
    const genesisEnvironmentPct = readGenesisStat(row, 'genesisEnvironmentPct', genesisResourcePct);
    const explicitMul = Number(row.depositWeightMul);
    const depositWeightMul =
      Number.isFinite(explicitMul) && explicitMul > 0
        ? explicitMul
        : genesisResourcePct / policy.depositWeightBaselineR;
    out.set(planetId, {
      genesisResourcePct,
      genesisPopulationPct,
      genesisDefensePct,
      genesisTechnologyPct,
      genesisEnvironmentPct,
      depositWeightMul,
    });
  }
  return out;
}

function getGenesisIndex(): Map<string, PlanetGenesisGauge> {
  if (!genesisByPlanetId) genesisByPlanetId = buildGenesisIndex();
  return genesisByPlanetId;
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

function zoneFallbackGenesisGauge(planetId: string): PlanetGenesisGauge {
  const policy = resolvePlanetResourceEcosystemPolicy();
  const system = resolveStarSystemForPlanetId(planetId);
  const zoneIndex = resolvePlanetZoneIndex(planetId, system ?? null);
  const span = Math.max(1, policy.genesisRMax - policy.genesisRMin);
  const zoneT = (Math.max(1, Math.min(21, zoneIndex)) - 1) / 20;
  const seed = planetIdSeed(planetId);
  const jitter = (pseudoRandom(seed) - 0.5) * 8;
  const resource = clamp100(policy.genesisRMin + zoneT * span + jitter);
  const population = clamp100(42 + zoneT * 18 + (pseudoRandom(seed + 3) - 0.5) * 10);
  const defense = clamp100(38 + zoneT * 22 + (pseudoRandom(seed + 7) - 0.5) * 8);
  const technology = clamp100(40 + zoneT * 24 + (pseudoRandom(seed + 11) - 0.5) * 10);
  const environment = clamp100(44 + zoneT * 16 + (pseudoRandom(seed + 19) - 0.5) * 12);
  return {
    genesisResourcePct: resource,
    genesisPopulationPct: population,
    genesisDefensePct: defense,
    genesisTechnologyPct: technology,
    genesisEnvironmentPct: environment,
    depositWeightMul: resource / policy.depositWeightBaselineR,
  };
}

/** synth·미등록 행성 — zone + 결정론 jitter → genesis R */
export function resolveZoneFallbackGenesisResourcePct(planetId: string): number {
  return zoneFallbackGenesisGauge(planetId).genesisResourcePct;
}

export function resolvePlanetGenesisGauge(planetId: string): PlanetGenesisGauge {
  const row = getGenesisIndex().get(planetId);
  if (row) return row;
  const planet = getPlanetRecord(planetId);
  if (planet && (planet.coreResource !== 50 || planet.corePopulation !== 50)) {
    const policy = resolvePlanetResourceEcosystemPolicy();
    return {
      genesisResourcePct: clamp100(planet.coreResource),
      genesisPopulationPct: clamp100(planet.corePopulation),
      genesisDefensePct: clamp100(planet.coreDefense),
      genesisTechnologyPct: clamp100(planet.coreTechnology),
      genesisEnvironmentPct: clamp100(planet.coreEnvironment),
      depositWeightMul: clamp100(planet.coreResource) / policy.depositWeightBaselineR,
    };
  }
  return zoneFallbackGenesisGauge(planetId);
}

/** CSV 정본 → 태초 R(%) */
export function resolvePlanetGenesisResourcePct(planetId: string): number {
  return resolvePlanetGenesisGauge(planetId).genesisResourcePct;
}

/** 태초 5지표 — legacy flat-50 세이브 1회 시드용 */
export function resolvePlanetGenesisCoreGauge(planetId: string): PlanetCoreGaugeView {
  const g = resolvePlanetGenesisGauge(planetId);
  return {
    resource: g.genesisResourcePct,
    population: g.genesisPopulationPct,
    defense: g.genesisDefensePct,
    technology: g.genesisTechnologyPct,
    environment: g.genesisEnvironmentPct,
  };
}

/** 행성별 매장 가중 — genesis(40%) + runtime R(60%) 블렌드 */
export function resolvePlanetDepositWeightMul(planetId: string, runtimeResource?: number): number {
  const policy = resolvePlanetResourceEcosystemPolicy();
  const genesisMul = Math.max(0.05, resolvePlanetGenesisGauge(planetId).depositWeightMul);
  if (runtimeResource == null || !Number.isFinite(runtimeResource)) {
    return genesisMul;
  }
  const runtimeMul = Math.max(0.05, runtimeResource / policy.depositWeightBaselineR);
  const blend = policy.depositRuntimeRBlend;
  return Math.max(0.05, genesisMul * (1 - blend) + runtimeMul * blend);
}

/** R 스탯 → 궤도 채굴 1세션 상한(단위) — zone 광물 종류·드랍율과 분리 */
export function resolveOrbitMiningSessionMaxUnits(resourceStat: number): number {
  const policy = resolvePlanetResourceEcosystemPolicy();
  const r = clamp100(resourceStat);
  const rLo = policy.genesisRMin;
  const rHi = policy.playerROperatingMax;
  const capLo = policy.miningSessionCapAtRMin;
  const capHi = policy.miningSessionCapAtRMax;
  if (r <= rLo) return capLo;
  if (r >= rHi) return capHi;
  const t = (r - rLo) / Math.max(1, rHi - rLo);
  return Math.max(capLo, Math.min(capHi, Math.round(capLo + t * (capHi - capLo))));
}

export function resolveOrbitMiningSessionMaxForPlanet(
  planetId: string,
  runtimeResource?: number,
): number {
  const r =
    runtimeResource != null && Number.isFinite(runtimeResource)
      ? runtimeResource
      : resolvePlanetGenesisResourcePct(planetId);
  return resolveOrbitMiningSessionMaxUnits(r);
}

/** 플레이어 개발·equilibrium R 목표 상한 */
export function clampResourceToOperatingBand(resourceStat: number): number {
  const policy = resolvePlanetResourceEcosystemPolicy();
  return clamp100(
    Math.max(policy.playerROperatingMin, Math.min(policy.playerROperatingMax, resourceStat)),
  );
}

/** legacy flat-50 세이브 — 태초 5지표 1회 시드 대상 */
export function isLegacyFlatCoreSeed(runtime: {
  resource: number;
  population: number;
  defense: number;
  technology: number;
  environment: number;
}): boolean {
  return (
    runtime.resource === 50
    && runtime.population === 50
    && runtime.defense === 50
    && runtime.technology === 50
    && runtime.environment === 50
  );
}

export function invalidatePlanetResourceGenesisCache(): void {
  kv = null;
  genesisByPlanetId = null;
}
