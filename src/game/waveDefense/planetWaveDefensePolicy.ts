/**
 * 행성 웨이브 판 수·척수·편성 존 — Table-First.
 * 아르카디아에서 크림슨 수도(core_prime 방향)로 갈수록 판 수·척수·소스 존이 오른다.
 * persist/틱 없음. CSV 부트 1회 Map.
 */

import { PlayScenarioZonePlanets_FROM_BALANCE_CSV } from '../../data/balance/generated/csvPlayScenarioZonePlanets';
import { PlanetWaveDefensePolicy_FROM_BALANCE_CSV } from '../../data/balance/generated/csvPlanetWaveDefensePolicy';
import { resolvePlanetZoneIndex } from '../../arcCore/planetBalance/planetZoneIndexRegistry';

export const WAVE_DEFENSE_ABSOLUTE_MAX_WAVES = 9;
const ZONE_MIN = 1;
const ZONE_MAX = 21;

export type PlanetWaveDefenseWaveSpec = {
  maxWaves: number;
  enemyCount: number;
  sourceZoneIndex: number;
  sourcePlanetId: string;
};

type PolicyRow = {
  maxWaves: number;
  enemyCounts: number[];
  sourceZoneOffsets: number[];
};

function parseNum(raw: string | number | undefined, fallback: number): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function parseIntPipe(raw: string | undefined, fallback: number[]): number[] {
  const text = String(raw ?? '').trim();
  if (!text) return fallback.slice();
  const out: number[] = [];
  const parts = text.split('|');
  for (let i = 0; i < parts.length; i += 1) {
    const n = Math.floor(parseNum(parts[i], Number.NaN));
    if (!Number.isFinite(n) || n < 0) continue;
    out.push(n);
  }
  return out.length > 0 ? out : fallback.slice();
}

function clampZone(n: number): number {
  return Math.max(ZONE_MIN, Math.min(ZONE_MAX, Math.round(n)));
}

function clampWaves(n: number): number {
  return Math.max(1, Math.min(WAVE_DEFENSE_ABSOLUTE_MAX_WAVES, Math.floor(n)));
}

function clampCount(n: number): number {
  return Math.max(1, Math.min(12, Math.floor(n)));
}

function bandFallback(zoneIndex: number): PolicyRow {
  const z = clampZone(zoneIndex);
  if (z <= 6) {
    return { maxWaves: 3, enemyCounts: [3, 4, 5], sourceZoneOffsets: [0, 1, 2] };
  }
  if (z <= 14) {
    return { maxWaves: 6, enemyCounts: [3, 4, 6, 6, 8, 8], sourceZoneOffsets: [0, 1, 2, 3, 4, 5] };
  }
  return {
    maxWaves: 9,
    enemyCounts: [3, 6, 8, 10, 12, 12, 12, 12, 12],
    sourceZoneOffsets: [0, 1, 2, 3, 4, 5, 6, 7, 8],
  };
}

const LEGACY_COUNTS = [3, 6, 12, 12, 12, 12, 12, 12, 12];

let planetByZone: Map<number, string> | null = null;
let policyByPlanet: Map<string, PolicyRow> | null = null;

function getPlanetByZone(): Map<number, string> {
  if (!planetByZone) {
    planetByZone = new Map();
    for (const row of PlayScenarioZonePlanets_FROM_BALANCE_CSV) {
      const z = clampZone(parseNum(row.zoneIndex, 0));
      const id = String(row.primaryPlanetId ?? '').trim();
      if (id) planetByZone.set(z, id);
    }
  }
  return planetByZone;
}

function rowFromCsv(raw: (typeof PlanetWaveDefensePolicy_FROM_BALANCE_CSV)[number]): PolicyRow {
  const maxWaves = clampWaves(parseNum(raw.maxWaves, 3));
  const band = bandFallback(parseNum(raw.zoneIndex, 1));
  const enemyCounts = parseIntPipe(raw.enemyCountsPipe, band.enemyCounts).map(clampCount);
  const sourceZoneOffsets = parseIntPipe(raw.sourceZoneOffsetPipe, band.sourceZoneOffsets);
  return { maxWaves, enemyCounts, sourceZoneOffsets };
}

function getPolicyByPlanet(): Map<string, PolicyRow> {
  if (!policyByPlanet) {
    policyByPlanet = new Map();
    for (const raw of PlanetWaveDefensePolicy_FROM_BALANCE_CSV) {
      const id = String(raw.planetId ?? '').trim();
      if (!id) continue;
      policyByPlanet.set(id, rowFromCsv(raw));
    }
  }
  return policyByPlanet;
}

export function resolvePlayScenarioPlanetIdForZone(zoneIndex: number): string {
  const z = clampZone(zoneIndex);
  return getPlanetByZone().get(z) ?? 'arcadia_prime';
}

function isCorePrimaryPlanetId(planetId: string): boolean {
  const zones = getPlanetByZone();
  for (const id of zones.values()) {
    if (id === planetId) return true;
  }
  return false;
}

function isSynthWavePlanetId(planetId: string): boolean {
  return planetId.startsWith('synth_') && planetId.endsWith('_p');
}

const LOCAL_ONLY_OFFSETS = [0, 0, 0, 0, 0, 0, 0, 0, 0];

function resolvePolicyRow(planetId: string | null | undefined): PolicyRow {
  const pid = planetId?.trim() ?? '';
  if (pid) {
    const direct = getPolicyByPlanet().get(pid);
    if (direct) return direct;
    if (isCorePrimaryPlanetId(pid) || isSynthWavePlanetId(pid)) {
      return bandFallback(resolvePlanetZoneIndex(pid));
    }
    return {
      maxWaves: WAVE_DEFENSE_ABSOLUTE_MAX_WAVES,
      enemyCounts: LEGACY_COUNTS.slice(),
      sourceZoneOffsets: LOCAL_ONLY_OFFSETS.slice(),
    };
  }
  return {
    maxWaves: WAVE_DEFENSE_ABSOLUTE_MAX_WAVES,
    enemyCounts: LEGACY_COUNTS.slice(),
    sourceZoneOffsets: LOCAL_ONLY_OFFSETS.slice(),
  };
}

export function resolvePlanetWaveDefenseMaxWaves(planetId: string | null | undefined): number {
  return resolvePolicyRow(planetId).maxWaves;
}

export function resolvePlanetWaveDefenseWave(
  planetId: string | null | undefined,
  waveIndex: number,
): PlanetWaveDefenseWaveSpec {
  const row = resolvePolicyRow(planetId);
  const wave = Math.max(1, Math.floor(waveIndex));
  const idx = Math.min(wave, row.maxWaves) - 1;
  const countRaw = row.enemyCounts[idx] ?? row.enemyCounts[row.enemyCounts.length - 1] ?? 3;
  const offset = row.sourceZoneOffsets[idx] ?? idx;
  const pid = planetId?.trim() ?? '';
  const mapped = Boolean(pid) && (
    getPolicyByPlanet().has(pid)
    || isCorePrimaryPlanetId(pid)
    || isSynthWavePlanetId(pid)
  );
  const localZone = mapped ? resolvePlanetZoneIndex(pid) : ZONE_MIN;
  const sourceZoneIndex = mapped ? clampZone(localZone + Math.max(0, offset)) : localZone;
  const sourcePlanetId = mapped ? resolvePlayScenarioPlanetIdForZone(sourceZoneIndex) : pid;
  return {
    maxWaves: row.maxWaves,
    enemyCount: clampCount(countRaw),
    sourceZoneIndex,
    sourcePlanetId,
  };
}
