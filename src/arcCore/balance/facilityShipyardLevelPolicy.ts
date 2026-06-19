import { FacilityShipyardLevelPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';

export type FacilityShipyardLevelRow = {
  level: number;
  displayNameKr: string;
  cumulativeHullTierKeys: string[];
  mineralUpgradeCap: number;
  buildSpeedBonusPct: number;
  upgradeDurationSec: number;
  installCostCredits: number;
  upgradeCostCredits: number;
  instantUpgradeCostCredits: number;
  requiredPlayerLevelMin: number;
  notesKo: string;
};

function parseHullTierKeys(raw: string | undefined): string[] {
  const text = String(raw ?? '').trim();
  if (!text) return [];
  return text.split('|').map((s) => s.trim()).filter(Boolean);
}

function parseLevelRow(raw: (typeof FacilityShipyardLevelPolicy_FROM_BALANCE_CSV)[number]): FacilityShipyardLevelRow {
  return {
    level: Math.max(1, Math.floor(Number(raw.level) || 1)),
    displayNameKr: String(raw.displayNameKr ?? ''),
    cumulativeHullTierKeys: parseHullTierKeys(raw.cumulativeHullTierKeys),
    mineralUpgradeCap: Math.max(0, Math.floor(Number(raw.mineralUpgradeCap) || 0)),
    buildSpeedBonusPct: Number(raw.buildSpeedBonusPct) || 0,
    upgradeDurationSec: Math.max(0, Math.floor(Number(raw.upgradeDurationSec) || 0)),
    installCostCredits: Math.max(0, Math.floor(Number(raw.installCostCredits) || 0)),
    upgradeCostCredits: Math.max(0, Math.floor(Number(raw.upgradeCostCredits) || 0)),
    instantUpgradeCostCredits: Math.max(0, Math.floor(Number(raw.instantUpgradeCostCredits) || 0)),
    requiredPlayerLevelMin: Math.max(0, Math.floor(Number(raw.requiredPlayerLevelMin) || 0)),
    notesKo: String(raw.notesKo ?? ''),
  };
}

let cachedRows: FacilityShipyardLevelRow[] | null = null;

export function listFacilityShipyardLevelRows(): FacilityShipyardLevelRow[] {
  if (cachedRows) return cachedRows;
  cachedRows = FacilityShipyardLevelPolicy_FROM_BALANCE_CSV
    .map(parseLevelRow)
    .sort((a, b) => a.level - b.level);
  return cachedRows;
}

export function getFacilityShipyardMaxLevel(): number {
  const rows = listFacilityShipyardLevelRows();
  return rows.length > 0 ? rows[rows.length - 1]!.level : 10;
}

export function clampFacilityShipyardLevel(level: number): number {
  const maxLevel = getFacilityShipyardMaxLevel();
  return Math.max(1, Math.min(maxLevel, Math.floor(level)));
}

export function getFacilityShipyardLevelRow(level: number): FacilityShipyardLevelRow | null {
  const clamped = clampFacilityShipyardLevel(level);
  return listFacilityShipyardLevelRows().find((r) => r.level === clamped) ?? null;
}

/** 레벨별 누적 건조 hullTierKey — `facility_shipyard_level_policy.csv` 정본 */
export function resolveShipyardBuiltHullTierKeysForLevel(level: number): string[] {
  if (!Number.isFinite(level) || level <= 0) return [];
  return getFacilityShipyardLevelRow(level)?.cumulativeHullTierKeys ?? [];
}

export function resolveShipyardMineralUpgradeCapForLevel(level: number): number {
  if (!Number.isFinite(level) || level <= 0) return 0;
  return getFacilityShipyardLevelRow(level)?.mineralUpgradeCap ?? 0;
}

/** 현재 레벨 → 다음 레벨 업그레이드 비용(다음 레벨 행) */
export function resolveShipyardUpgradeCostCredits(currentLevel: number): number | null {
  const next = getFacilityShipyardLevelRow(currentLevel + 1);
  if (!next) return null;
  return next.upgradeCostCredits;
}

export function resolveShipyardInstantUpgradeCostCredits(currentLevel: number): number | null {
  const next = getFacilityShipyardLevelRow(currentLevel + 1);
  if (!next) return null;
  return next.instantUpgradeCostCredits;
}

export function resolveShipyardUpgradeDurationSec(currentLevel: number): number | null {
  const next = getFacilityShipyardLevelRow(currentLevel + 1);
  if (!next) return null;
  return next.upgradeDurationSec;
}

/** L→L+1 업그레이드 시 필요 파일럿 레벨(목표 레벨 행) */
export function resolveShipyardUpgradeRequiredPlayerLevel(currentLevel: number): number {
  const next = getFacilityShipyardLevelRow(currentLevel + 1);
  return next?.requiredPlayerLevelMin ?? 0;
}
