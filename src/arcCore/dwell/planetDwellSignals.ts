// ============================================================
// 체류 판단용 행성 신호 — epoch/배치 1회 빌드 (틱 재집계 금지)
// ============================================================

import { isPlanetContestedZone } from '../balance/balanceTableRegistry';
import { getPlanetLevelingRowForZone, resolvePlanetZoneIndex } from '../planetBalance/planetZoneIndexRegistry';
import { SYNTH_COLONIZATION_MAX_PHASE } from '../synthColonizationPhasePolicy';
import { listCoreOpenGameplayPlanetIds, resolveCoreOpenGameplayPlanetRef } from '../../world/coreOpenGameplayPlanets';
import { isSynthFrontierPlanetId } from '../../world/isSynthFrontierPlanetId';
import { computePlanetDwellGravity, normalizeFeeGross } from './planetDwellGravity';
import { resolvePlanetDwellCivicPolicy } from './planetDwellCivicPolicy';
import type { DwellRebellionPhase, PlanetDwellSignal } from './planetDwellTypes';

let cached: Map<string, PlanetDwellSignal> | null = null;

function clamp100(n: number): number {
  return Math.max(0, Math.min(100, Number.isFinite(n) ? n : 0));
}

function readColonizationPhase(planetId: string, isFrontier: boolean): number {
  if (!isFrontier) return SYNTH_COLONIZATION_MAX_PHASE;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { useWorldStore } = require('../../store/worldStore') as typeof import('../../store/worldStore');
    return useWorldStore.getState().getSynthColonizationPhase(planetId);
  } catch {
    return 0;
  }
}

function readRuntimeCores(planetId: string): {
  resource: number;
  population: number;
  defense: number;
  technology: number;
  environment: number;
  wdi: number;
  rebellionPhase: DwellRebellionPhase;
} | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { usePlanetCoreRuntimeStore } =
      require('../../store/planetCoreRuntimeStore') as typeof import('../../store/planetCoreRuntimeStore');
    const runtime = usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId);
    if (!runtime) return null;
    const wd = runtime.detail?.wealthDisparity;
    const rebellion = wd?.rebellionPhase;
    return {
      resource: clamp100(runtime.resource),
      population: clamp100(runtime.population),
      defense: clamp100(runtime.defense),
      technology: clamp100(runtime.technology),
      environment: clamp100(runtime.environment),
      wdi: clamp100(wd?.wdi ?? 0),
      rebellionPhase:
        rebellion === 'overthrow' || rebellion === 'simmering' || rebellion === 'none'
          ? rebellion
          : 'none',
    };
  } catch {
    return null;
  }
}

function readFeeGross(planetId: string): number {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { usePlanetTradeFeeLedgerStore } =
      require('../../store/planetTradeFeeLedgerStore') as typeof import('../../store/planetTradeFeeLedgerStore');
    const bucket = usePlanetTradeFeeLedgerStore.getState().byPlanetId[planetId];
    return Math.max(0, Number(bucket?.grossCredits ?? 0) || 0);
  } catch {
    return 0;
  }
}

export function collectPlanetDwellSignal(planetId: string): PlanetDwellSignal | null {
  const id = String(planetId ?? '').trim();
  if (!id) return null;
  const ref = resolveCoreOpenGameplayPlanetRef(id);
  if (!ref) return null;

  const policy = resolvePlanetDwellCivicPolicy();
  const isFrontier = isSynthFrontierPlanetId(id);
  const runtime = readRuntimeCores(id);
  const population = runtime?.population ?? clamp100(ref.planet.corePopulation);
  const resource = runtime?.resource ?? clamp100(ref.planet.coreResource);
  const defense = runtime?.defense ?? clamp100(ref.planet.coreDefense);
  const technology = runtime?.technology ?? clamp100(ref.planet.coreTechnology);
  const environment = runtime?.environment ?? clamp100(ref.planet.coreEnvironment);
  const zoneIndex = resolvePlanetZoneIndex(id, ref.system);
  const targetCreditsEarned = Number(getPlanetLevelingRowForZone(zoneIndex).targetCreditsEarned) || 30_000;
  const feeGrossNorm = normalizeFeeGross(readFeeGross(id), policy);
  const colonizationPhase = readColonizationPhase(id, isFrontier);
  const draft = {
    population,
    resource,
    hasTradePort: Boolean(ref.planet.hasTradePort),
    hasShipyard: Boolean(ref.planet.hasShipyard),
    hasBar: Boolean(ref.planet.hasBar),
    zone: ref.system.zone,
    targetCreditsEarned,
    feeGrossNorm,
    isFrontier,
    colonizationPhase,
  };
  const { gravity, logicalCap } = computePlanetDwellGravity(draft, policy);

  return {
    planetId: id,
    population,
    resource,
    defense,
    technology,
    environment,
    hasTradePort: draft.hasTradePort,
    hasShipyard: draft.hasShipyard,
    hasBar: draft.hasBar,
    zone: ref.system.zone,
    targetCreditsEarned,
    feeGrossNorm,
    isFrontier,
    colonizationPhase,
    isContested: isPlanetContestedZone(id),
    wdi: runtime?.wdi ?? 0,
    rebellionPhase: runtime?.rebellionPhase ?? 'none',
    gravity,
    logicalCap,
  };
}

export function getOrBuildDwellSignalIndex(): Map<string, PlanetDwellSignal> {
  if (cached) return cached;
  const map = new Map<string, PlanetDwellSignal>();
  for (const planetId of listCoreOpenGameplayPlanetIds()) {
    const signal = collectPlanetDwellSignal(planetId);
    if (signal) map.set(planetId, signal);
  }
  cached = map;
  return map;
}

export function invalidateDwellSignalIndex(): void {
  cached = null;
}
