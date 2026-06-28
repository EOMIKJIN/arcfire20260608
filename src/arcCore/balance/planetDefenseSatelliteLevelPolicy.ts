import { PlanetDefenseSatelliteLevelPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { resolvePlanetFacilityUpgradeDurationSec } from './facilityUpgradeDurationPolicy';

export type PlanetDefenseSatelliteLevelRow = {
  level: number;
  hpMax: number;
  defenseZoneDiameterPx: number;
  interceptHitPct: number;
  interceptDwellSec: number;
  upgradeDurationSec: number;
  installCostCredits: number;
  upgradeCostCredits: number;
  instantUpgradeCostCredits: number;
  grantsSecondSatellite: boolean;
  interceptMissileCount: number;
  /** [v3] 레벨별 1일 유지비(크레딧) — 행성 유지비 개발도 비례 가산분 */
  dailyUpkeepCredits: number;
  notesKo: string;
};

function parseBool(raw: string | undefined): boolean {
  const v = String(raw ?? '').trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes';
}

function parseLevelRow(raw: (typeof PlanetDefenseSatelliteLevelPolicy_FROM_BALANCE_CSV)[number]): PlanetDefenseSatelliteLevelRow {
  const legacyHit = Number((raw as { interceptChancePct?: string }).interceptChancePct);
  const hitRaw = Number(raw.interceptHitPct);
  const interceptHitPct = Number.isFinite(hitRaw) && hitRaw > 0
    ? hitRaw
    : (Number.isFinite(legacyHit) ? legacyHit : 0);
  return {
    level: Math.max(1, Math.floor(Number(raw.level) || 1)),
    hpMax: Math.max(1, Math.floor(Number(raw.hpMax) || 100)),
    defenseZoneDiameterPx: Math.max(1, Math.floor(Number(raw.defenseZoneDiameterPx) || 150)),
    interceptHitPct: Math.max(0, interceptHitPct),
    interceptDwellSec: Math.max(0.05, Number(raw.interceptDwellSec) || 3),
    upgradeDurationSec: Math.max(0, Math.floor(Number(raw.upgradeDurationSec) || 0)),
    installCostCredits: Math.max(0, Math.floor(Number(raw.installCostCredits) || 0)),
    upgradeCostCredits: Math.max(0, Math.floor(Number(raw.upgradeCostCredits) || 0)),
    instantUpgradeCostCredits: Math.max(0, Math.floor(Number(raw.instantUpgradeCostCredits) || 0)),
    grantsSecondSatellite: parseBool(raw.grantsSecondSatellite),
    interceptMissileCount: Math.max(1, Math.floor(Number(raw.interceptMissileCount) || 1)),
    dailyUpkeepCredits: Math.max(0, Math.floor(Number((raw as { dailyUpkeepCredits?: string }).dailyUpkeepCredits) || 0)),
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

/** @deprecated `interceptHitPct` 사용 — 하위 호환 alias */
export function resolveDefenseSatelliteInterceptChancePct(level: number): number {
  return getPlanetDefenseSatelliteLevelRow(level)?.interceptHitPct ?? 0;
}

export function resolveDefenseSatelliteInterceptHitPct(level: number): number {
  return getPlanetDefenseSatelliteLevelRow(level)?.interceptHitPct ?? 0;
}

/** Lv.1 최초 설치 비용 — `planet_defense_satellite_level_policy.csv` L1.installCostCredits */
export function resolveDefenseSatelliteInstallCostCredits(): number {
  return getPlanetDefenseSatelliteLevelRow(1)?.installCostCredits ?? 0;
}

/** 현재 레벨 → 다음 레벨 업그레이드 비용(다음 레벨 행의 upgradeCostCredits) */
export function resolveDefenseSatelliteUpgradeCostCredits(currentLevel: number): number | null {
  const next = getPlanetDefenseSatelliteLevelRow(currentLevel + 1);
  if (!next) return null;
  return next.upgradeCostCredits;
}

/** 현재 레벨 → 다음 레벨 즉시 완료 비용 */
export function resolveDefenseSatelliteInstantUpgradeCostCredits(currentLevel: number): number | null {
  const next = getPlanetDefenseSatelliteLevelRow(currentLevel + 1);
  if (!next) return null;
  return next.instantUpgradeCostCredits;
}

/** 다음 레벨 업그레이드 소요 시간(초) — v3.1 facility_upgrade_duration_steps.csv 정본 */
export function resolveDefenseSatelliteUpgradeDurationSec(currentLevel: number): number | null {
  return resolvePlanetFacilityUpgradeDurationSec('defense_satellite', currentLevel);
}

/** [v3] 레벨별 1일 유지비(크레딧) — 미설치(level<=0)는 0 */
export function resolveDefenseSatelliteDailyUpkeepCredits(level: number): number {
  if (!Number.isFinite(level) || level <= 0) return 0;
  return getPlanetDefenseSatelliteLevelRow(level)?.dailyUpkeepCredits ?? 0;
}

/** 방어 영역 반경(px) — 위성 중심 · 전투·허브 링 공통 (지름 ÷ 2) */
export function resolveDefenseSatelliteZoneRadiusPx(level: number): number {
  const row = getPlanetDefenseSatelliteLevelRow(level);
  if (!row) return 60;
  return Math.max(1, Math.floor(row.defenseZoneDiameterPx / 2));
}

/** 레벨 기준 가동 위성 수 — Lv10+ 2기, 그 외 1기 */
export function resolveDefenseSatelliteActiveCountForLevel(level: number): number {
  const row = getPlanetDefenseSatelliteLevelRow(level);
  if (!row) return 1;
  return row.grantsSecondSatellite || level >= 10 ? 2 : 1;
}
