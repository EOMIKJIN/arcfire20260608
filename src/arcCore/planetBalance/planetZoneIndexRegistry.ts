// ============================================================
// 아크코어 — 행성별 마스터 밸런스 zoneIndex(1..21) 정본 해석
// - `01_레벨업구조` 정규화: play_scenario_zone_planets.csv 우선
// - planet_hostile_red_progression.csv · synth_system_colonization.csv
// - 미매핑: 성계 enemyLevel → zoneIndex
// ============================================================

import {
  PlanetHostileRedProgression_FROM_BALANCE_CSV,
  PlanetLevelingProgression_FROM_BALANCE_CSV,
  PlayScenarioZonePlanets_FROM_BALANCE_CSV,
  SynthSystemColonization_FROM_BALANCE_CSV,
} from '../../data/balance/generated';
import { resolvePlanetTargetEngageSec } from '../balance/balanceTableRegistry';
import { enrichMasterBalanceWithPlayScenario } from '../balance/playScenarioRegistry';
import type { PlanetMasterBalanceDetail } from '../../store/planetCoreMetricTypes';
import type { StarSystem } from '../../types';

const ZONE_MIN = 1;
const ZONE_MAX = 21;

function clampZone(n: number): number {
  return Math.max(ZONE_MIN, Math.min(ZONE_MAX, Math.round(n)));
}

function parseNum(raw: string | number | undefined, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

let zoneByPlanetId: Map<string, number> | null = null;

function buildZoneByPlanetId(): Map<string, number> {
  const out = new Map<string, number>();
  for (const row of PlayScenarioZonePlanets_FROM_BALANCE_CSV) {
    out.set(row.primaryPlanetId, clampZone(parseNum(row.zoneIndex, 1)));
  }
  for (const row of PlanetHostileRedProgression_FROM_BALANCE_CSV) {
    if (!out.has(row.planetId)) {
      out.set(row.planetId, clampZone(parseNum(row.zoneIndex, 1)));
    }
  }
  for (const row of SynthSystemColonization_FROM_BALANCE_CSV) {
    const planetId = `${row.synthSystemId}_p`;
    out.set(planetId, clampZone(parseNum(row.zoneIndex, 1)));
  }
  return out;
}

function getZoneByPlanetIdIndex(): Map<string, number> {
  if (!zoneByPlanetId) zoneByPlanetId = buildZoneByPlanetId();
  return zoneByPlanetId;
}

const zoneRowByIndex = new Map(
  PlanetLevelingProgression_FROM_BALANCE_CSV.map((row) => [
    clampZone(parseNum(row.zoneIndex, 1)),
    row,
  ] as const),
);

/** 성계 난이도 → 1..20 지역 (파일럿 Lv 1..60과 정렬) */
export function enemyLevelToZoneIndex(enemyLevel: number): number {
  return clampZone(Math.max(1, Math.round(enemyLevel / 3)));
}

export function resolvePlanetZoneIndex(
  planetId: string,
  system?: Pick<StarSystem, 'enemyLevel' | 'zone'> | null,
): number {
  const table = getZoneByPlanetIdIndex().get(planetId);
  if (table != null) return table;
  if (system?.zone === 'safe') return 1;
  return enemyLevelToZoneIndex(system?.enemyLevel ?? 1);
}

export function getPlanetLevelingRowForZone(zoneIndex: number) {
  return zoneRowByIndex.get(clampZone(zoneIndex)) ?? zoneRowByIndex.get(1)!;
}

export function buildPlanetMasterBalanceDetail(
  zoneIndex: number,
  runtimeCpmMul = 1,
): PlanetMasterBalanceDetail {
  const row = getPlanetLevelingRowForZone(zoneIndex);
  return {
    version: 1,
    zoneIndex: clampZone(zoneIndex),
    sectorBand: row.sectorBand,
    recommendedPilotLevel: parseNum(row.recommendedPilotLevel, 1),
    requiredFleetMinDps: parseNum(row.requiredFleetMinDps, 150),
    targetCreditsEarned: parseNum(row.targetCreditsEarned, 30_000),
    enemyAffinityKind: row.enemyAffinityKind,
    recommendedHullTierKey: row.recommendedHullTierKey,
    recommendedWeaponTierKey: row.recommendedWeaponTierKey,
    combatsInZone: parseNum(row.combatsInZone, 3),
    combatMinutesTotal: parseNum(row.combatMinutesTotal, 3),
    targetEngageSec: 32,
    mineralUpgradeCapAtZone: parseNum(row.mineralUpgradeCapAtZone, 5),
    runtimeCpmMul,
  };
}

export { getPlanetHostileRedProgressionRow, resolveMainStageCombatEnabled } from '../balance/balanceTableRegistry';

export function getPlanetMasterBalanceDetailForPlanet(
  planetId: string,
  system?: Pick<StarSystem, 'enemyLevel' | 'zone'> | null,
  runtimeCpmMul = 1,
): PlanetMasterBalanceDetail {
  const zoneIndex = resolvePlanetZoneIndex(planetId, system);
  const base = {
    ...buildPlanetMasterBalanceDetail(zoneIndex, runtimeCpmMul),
    targetEngageSec: resolvePlanetTargetEngageSec(planetId),
  };
  return enrichMasterBalanceWithPlayScenario(base, planetId);
}
