import { PlanetDefenseSatelliteLevelPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

export type PlanetDefenseSatelliteLevelRow = {
  level: number;
  interceptChancePct: number;
  interceptMissileCount: number;
  upgradeCostCredits: number;
  notesKo: string;
};

function parseLevelRow(raw: (typeof PlanetDefenseSatelliteLevelPolicy_FROM_BALANCE_CSV)[number]): PlanetDefenseSatelliteLevelRow {
  return {
    level: Math.max(1, Math.floor(Number(raw.level) || 1)),
    interceptChancePct: Math.max(0, Number(raw.interceptChancePct) || 0),
    interceptMissileCount: Math.max(1, Math.floor(Number(raw.interceptMissileCount) || 1)),
    upgradeCostCredits: Math.max(0, Math.floor(Number(raw.upgradeCostCredits) || 0)),
    notesKo: String(raw.notesKo ?? ''),
  };
}

let cachedRows: PlanetDefenseSatelliteLevelRow[] | null = null;

export function listPlanetDefenseSatelliteLevelRows(): PlanetDefenseSatelliteLevelRow[] {
  if (cachedRows) return cachedRows;
  cachedRows = PlanetDefenseSatelliteLevelPolicy_FROM_BALANCE_CSV
    .map(parseLevelRow)
    .sort((a, b) => a.level - b.level);
  return cachedRows;
}

export function getPlanetDefenseSatelliteMaxLevel(): number {
  const rows = listPlanetDefenseSatelliteLevelRows();
  return rows.length > 0 ? rows[rows.length - 1]!.level : 10;
}

export function clampPlanetDefenseSatelliteLevel(level: number): number {
  const maxLevel = getPlanetDefenseSatelliteMaxLevel();
  return Math.max(1, Math.min(maxLevel, Math.floor(level)));
}

export function getPlanetDefenseSatelliteLevelRow(level: number): PlanetDefenseSatelliteLevelRow | null {
  const clamped = clampPlanetDefenseSatelliteLevel(level);
  return listPlanetDefenseSatelliteLevelRows().find((r) => r.level === clamped) ?? null;
}

/** 레벨별 요격 확률(%) — 테이블 정본 */
export function resolveDefenseSatelliteInterceptChancePct(level: number): number {
  return getPlanetDefenseSatelliteLevelRow(level)?.interceptChancePct ?? 0;
}

/** 레벨별 요격미사일 발사 수 — 디폴트 1 */
export function resolveDefenseSatelliteInterceptMissileCount(level: number): number {
  return getPlanetDefenseSatelliteLevelRow(level)?.interceptMissileCount ?? 1;
}

/** 추후 업그레이드 UI — 현재 레벨에서 다음 레벨로 올릴 비용 */
export function resolveDefenseSatelliteUpgradeCostCredits(currentLevel: number): number | null {
  const next = getPlanetDefenseSatelliteLevelRow(currentLevel + 1);
  if (!next) return null;
  return next.upgradeCostCredits;
}

/** 0..1 확률 */
export function resolveDefenseSatelliteInterceptChance01(level: number): number {
  return resolveDefenseSatelliteInterceptChancePct(level) / 100;
}

/**
 * strikeId·planetId 기반 결정론 롤 — 동일 공습 재현 시 결과 일치.
 */
export function rollDefenseSatelliteInterceptSuccess(
  strikeId: string,
  planetId: string,
  level: number,
): boolean {
  const chance = resolveDefenseSatelliteInterceptChance01(level);
  if (chance <= 0) return false;
  if (chance >= 1) return true;
  let hash = 0;
  const seed = `${strikeId}:${planetId}:defense_intercept`;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const roll = (hash % 1_000_000) / 1_000_000;
  return roll < chance;
}
