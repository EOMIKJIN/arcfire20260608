// ============================================================
// 시민 체류 역할-시간 누적 — 비영속 모듈 버퍼 (수송 acc와 축 분리)
// 틱: 행성별 역할 카운트 × dt 만. 함장 전수 스캔 금지.
// ============================================================

import type { PlanetCoreGaugeView } from '../../store/planetCoreRuntimeStore';
import { resolvePlanetDwellCivicPolicy } from './planetDwellCivicPolicy';
import { getDwellRoleDef } from './planetDwellRoleCatalog';
import { DWELL_ROLE_IDS, type DwellRoleId } from './planetDwellTypes';

type AccVec = Record<keyof PlanetCoreGaugeView, number>;
export type DwellRoleCounts = Partial<Record<DwellRoleId, number>>;

const ZERO: AccVec = {
  resource: 0,
  population: 0,
  defense: 0,
  technology: 0,
  environment: 0,
};

const CORE_KEYS = Object.keys(ZERO) as (keyof AccVec)[];

const moduleBuffer: Record<string, AccVec> = {};
let occupancyByPlanet = new Map<string, DwellRoleCounts>();

function emptyAcc(): AccVec {
  return { ...ZERO };
}

export function publishDwellRoleOccupancy(next: ReadonlyMap<string, DwellRoleCounts>): void {
  const copy = new Map<string, DwellRoleCounts>();
  for (const [planetId, counts] of next) {
    copy.set(planetId, { ...counts });
  }
  occupancyByPlanet = copy;
}

export function peekDwellRoleOccupancy(): ReadonlyMap<string, DwellRoleCounts> {
  return occupancyByPlanet;
}

export function peekDwellOccupancyTotals(): Map<string, number> {
  const out = new Map<string, number>();
  for (const [planetId, counts] of occupancyByPlanet) {
    let sum = 0;
    for (const role of DWELL_ROLE_IDS) sum += counts[role] ?? 0;
    if (sum > 0) out.set(planetId, sum);
  }
  return out;
}

export function addWallTickFromDwellOccupancy(wallDeltaSec: number): void {
  if (wallDeltaSec <= 0 || occupancyByPlanet.size === 0) return;
  const scale = resolvePlanetDwellCivicPolicy().civicAccPerWallSec * wallDeltaSec;
  if (scale <= 0) return;

  for (const [planetId, counts] of occupancyByPlanet) {
    let acc = moduleBuffer[planetId];
    if (!acc) {
      acc = emptyAcc();
      moduleBuffer[planetId] = acc;
    }
    for (const role of DWELL_ROLE_IDS) {
      const n = counts[role] ?? 0;
      if (n <= 0) continue;
      const w = getDwellRoleDef(role);
      const gain = n * scale;
      acc.resource += w.wResource * gain;
      acc.population += w.wPopulation * gain;
      acc.defense += w.wDefense * gain;
      acc.technology += w.wTechnology * gain;
      acc.environment += w.wEnvironment * gain;
    }
  }
}

export function listDwellCivicAccPlanetIds(): string[] {
  return Object.keys(moduleBuffer);
}

export function consumeDwellCivicIntegerDeltas(
  planetId: string,
  maxAbsPerStat: number,
): PlanetCoreGaugeView {
  const cap = Math.max(0, Math.min(8, Math.floor(Number(maxAbsPerStat) || 0)));
  const applied: AccVec = { ...ZERO };
  if (!planetId || cap === 0) return applied;

  const merged = moduleBuffer[planetId];
  if (!merged) return applied;

  for (const k of CORE_KEYS) {
    const v = merged[k];
    if (v >= 1) {
      const take = Math.min(cap, Math.floor(v));
      applied[k] = take;
      merged[k] -= take;
    } else if (v <= -1) {
      const take = Math.max(-cap, Math.ceil(v));
      applied[k] = take;
      merged[k] -= take;
    }
  }

  const leftover =
    Math.abs(merged.resource) +
    Math.abs(merged.population) +
    Math.abs(merged.defense) +
    Math.abs(merged.technology) +
    Math.abs(merged.environment);
  if (leftover < 1e-6) delete moduleBuffer[planetId];
  return applied;
}

export function resetDwellCivicAccForTests(): void {
  for (const k of Object.keys(moduleBuffer)) delete moduleBuffer[k];
  occupancyByPlanet = new Map();
}
