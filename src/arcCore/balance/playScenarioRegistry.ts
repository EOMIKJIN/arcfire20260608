// ============================================================
// 01_레벨업구조(csv).csv — 정규화 balance 테이블 런타임 정본
// - play_scenario_zone_planets.csv · play_scenario_economy.csv
// - planet_leveling_progression.csv (zone 수치) · planet_hostile_red_progression.csv (전투 배치)
// ============================================================

import {
  PlayScenarioEconomy_FROM_BALANCE_CSV,
  PlayScenarioZonePlanets_FROM_BALANCE_CSV,
  PlanetLevelingProgression_FROM_BALANCE_CSV,
} from '../../data/balance/generated';
import type { PlanetMasterBalanceDetail } from '../../store/planetCoreMetricTypes';

function parseNum(raw: string | number | undefined, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function clampZone(n: number): number {
  return Math.max(1, Math.min(21, Math.round(n)));
}

const zonePlanetByIndex = new Map(
  PlayScenarioZonePlanets_FROM_BALANCE_CSV.map(
    (row) => [clampZone(parseNum(row.zoneIndex, 1)), row] as const,
  ),
);

const zonePlanetByPlanetId = new Map<string, (typeof PlayScenarioZonePlanets_FROM_BALANCE_CSV)[number]>(
  PlayScenarioZonePlanets_FROM_BALANCE_CSV.map((row) => [row.primaryPlanetId, row]),
);

const economyByZone = new Map(
  PlayScenarioEconomy_FROM_BALANCE_CSV.map(
    (row) => [clampZone(parseNum(row.zoneIndex, 1)), row] as const,
  ),
);

const levelingByZone = new Map(
  PlanetLevelingProgression_FROM_BALANCE_CSV.map(
    (row) => [clampZone(parseNum(row.zoneIndex, 1)), row] as const,
  ),
);

export function getPlayScenarioZonePlanetRow(zoneIndex: number) {
  return zonePlanetByIndex.get(clampZone(zoneIndex)) ?? null;
}

export function getPlayScenarioZonePlanetRowByPlanetId(planetId: string) {
  return zonePlanetByPlanetId.get(planetId) ?? null;
}

export function getPlayScenarioEconomyRow(zoneIndex: number) {
  return economyByZone.get(clampZone(zoneIndex)) ?? null;
}

export function resolvePlayScenarioZoneIndexForPlanet(planetId: string): number | null {
  const row = getPlayScenarioZonePlanetRowByPlanetId(planetId);
  if (!row) return null;
  return clampZone(parseNum(row.zoneIndex, 1));
}

/** zone 1..20 플레이 시나리오 앵커 행성 id 목록 */
export function listPlayScenarioAnchorPlanetIds(): string[] {
  return PlayScenarioZonePlanets_FROM_BALANCE_CSV.map((row) => row.primaryPlanetId).filter(Boolean);
}

export type PlayScenarioPlanetBundle = {
  zoneIndex: number;
  planetId: string;
  systemId: string;
  planetLabelKo: string;
  scenarioLocationKo: string;
  leveling: (typeof PlanetLevelingProgression_FROM_BALANCE_CSV)[number];
  economy: (typeof PlayScenarioEconomy_FROM_BALANCE_CSV)[number] | null;
};

export function getPlayScenarioPlanetBundle(
  planetId: string,
  zoneIndex: number,
): PlayScenarioPlanetBundle | null {
  const anchor = getPlayScenarioZonePlanetRowByPlanetId(planetId);
  const zone = clampZone(zoneIndex);
  const leveling = levelingByZone.get(zone);
  if (!leveling) return null;
  return {
    zoneIndex: zone,
    planetId,
    systemId: anchor?.systemId ?? '',
    planetLabelKo: anchor?.planetLabelKo ?? '',
    scenarioLocationKo: anchor?.scenarioLocationKo ?? '',
    leveling,
    economy: getPlayScenarioEconomyRow(zone),
  };
}

/** `PlanetMasterBalanceDetail`에 시나리오 경제·장소 메타 병합 */
export function enrichMasterBalanceWithPlayScenario(
  detail: PlanetMasterBalanceDetail,
  planetId: string,
): PlanetMasterBalanceDetail {
  const bundle = getPlayScenarioPlanetBundle(planetId, detail.zoneIndex);
  if (!bundle) return detail;
  const econ = bundle.economy;
  return {
    ...detail,
    scenarioLocationKo: bundle.scenarioLocationKo || undefined,
    growthStageKo: econ?.growthStageKo?.trim() || undefined,
    scenarioTargetItemKo: econ?.targetItemKo?.trim() || undefined,
    scenarioRequiredCredits: econ ? parseNum(econ.requiredCredits, 0) : undefined,
    scenarioMineralQty: econ ? parseNum(econ.mineralQtyTotal, 0) : undefined,
    scenarioMiningMinutes: econ ? parseNum(econ.pureMiningMinutes, 0) : undefined,
    scenarioBountyMinutes: econ ? parseNum(econ.bountyHuntMinutes, 0) : undefined,
  };
}
