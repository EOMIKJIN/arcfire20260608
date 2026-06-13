import { PlanetDefenseSatelliteInstanceLevel_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { clampPlanetDefenseSatelliteLevel } from './planetDefenseSatelliteLevelPolicy';

export type PlanetDefenseSatelliteInstanceLevelRow = {
  instanceKey: string;
  defaultLevel: number;
  notesKo: string;
};

let cachedRows: PlanetDefenseSatelliteInstanceLevelRow[] | null = null;

function parseRow(raw: (typeof PlanetDefenseSatelliteInstanceLevel_FROM_BALANCE_CSV)[number]): PlanetDefenseSatelliteInstanceLevelRow {
  return {
    instanceKey: String(raw.instanceKey ?? '').trim(),
    defaultLevel: clampPlanetDefenseSatelliteLevel(Math.floor(Number(raw.defaultLevel) || 1)),
    notesKo: String(raw.notesKo ?? ''),
  };
}

export function listPlanetDefenseSatelliteInstanceLevelRows(): PlanetDefenseSatelliteInstanceLevelRow[] {
  if (cachedRows) return cachedRows;
  cachedRows = PlanetDefenseSatelliteInstanceLevel_FROM_BALANCE_CSV
    .map(parseRow)
    .filter((r) => r.instanceKey.length > 0);
  return cachedRows;
}

const instanceLevelIndex = (): Map<string, number> => {
  const map = new Map<string, number>();
  for (const row of listPlanetDefenseSatelliteInstanceLevelRows()) {
    map.set(row.instanceKey, row.defaultLevel);
  }
  return map;
};

let cachedIndex: Map<string, number> | null = null;

function getInstanceLevelIndex(): Map<string, number> {
  if (!cachedIndex) cachedIndex = instanceLevelIndex();
  return cachedIndex;
}

/** CSV 시드 — instanceKey(1,2,…)별 기본 레벨. 없으면 null */
export function resolveDefenseSatelliteInstanceSeedLevel(instanceKey: string): number | null {
  const level = getInstanceLevelIndex().get(String(instanceKey).trim());
  return level != null ? clampPlanetDefenseSatelliteLevel(level) : null;
}
