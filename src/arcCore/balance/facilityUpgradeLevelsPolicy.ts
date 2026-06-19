import { FacilityUpgradeLevels_FROM_BALANCE_CSV } from '../../data/balance/generated';

export type FacilityUpgradeLevelRow = {
  facilityType: string;
  level: number;
  displayNameKr: string;
  statRNudgeDaily: number;
  statPNudgeDaily: number;
  statDNudgeDaily: number;
  statTNudgeDaily: number;
  statENudgeDaily: number;
  tdiContributionFormula: string;
  notesKo: string;
};

let cachedRows: FacilityUpgradeLevelRow[] | null = null;
let cachedByTypeLevel: Map<string, FacilityUpgradeLevelRow> | null = null;

function parseRow(raw: (typeof FacilityUpgradeLevels_FROM_BALANCE_CSV)[number]): FacilityUpgradeLevelRow {
  return {
    facilityType: String(raw.facility_type ?? '').trim(),
    level: Math.max(1, Math.floor(Number(raw.level) || 1)),
    displayNameKr: String(raw.display_name_kr ?? ''),
    statRNudgeDaily: Number(raw.stat_r_nudge_daily) || 0,
    statPNudgeDaily: Number(raw.stat_p_nudge_daily) || 0,
    statDNudgeDaily: Number(raw.stat_d_nudge_daily) || 0,
    statTNudgeDaily: Number(raw.stat_t_nudge_daily) || 0,
    statENudgeDaily: Number(raw.stat_e_nudge_daily) || 0,
    tdiContributionFormula: String(raw.tdi_contribution_formula ?? ''),
    notesKo: String(raw.notesKo ?? ''),
  };
}

export function listFacilityUpgradeLevelRows(): FacilityUpgradeLevelRow[] {
  if (cachedRows) return cachedRows;
  cachedRows = FacilityUpgradeLevels_FROM_BALANCE_CSV.map(parseRow);
  return cachedRows;
}

function getByTypeLevelMap(): Map<string, FacilityUpgradeLevelRow> {
  if (cachedByTypeLevel) return cachedByTypeLevel;
  cachedByTypeLevel = new Map();
  for (const row of listFacilityUpgradeLevelRows()) {
    cachedByTypeLevel.set(`${row.facilityType}:${row.level}`, row);
  }
  return cachedByTypeLevel;
}

export function getFacilityUpgradeLevelRow(
  facilityType: string,
  level: number,
): FacilityUpgradeLevelRow | null {
  if (!facilityType || level <= 0) return null;
  return getByTypeLevelMap().get(`${facilityType}:${Math.floor(level)}`) ?? null;
}

/** 시설 레벨별 일일 5대 스탯 nudge 합산(동일 스탯은 누적) */
export function resolveFacilityStatNudgesForLevel(
  facilityType: string,
  level: number,
): { resource: number; population: number; defense: number; technology: number; environment: number } {
  const row = getFacilityUpgradeLevelRow(facilityType, level);
  if (!row) {
    return { resource: 0, population: 0, defense: 0, technology: 0, environment: 0 };
  }
  return {
    resource: row.statRNudgeDaily,
    population: row.statPNudgeDaily,
    defense: row.statDNudgeDaily,
    technology: row.statTNudgeDaily,
    environment: row.statENudgeDaily,
  };
}

/** tdi_contribution_formula — `level*2` · `level*3` 등 단순 곱셈 */
export function evaluateFacilityTdiContributionFormula(formula: string, level: number): number {
  const lv = Math.max(1, Math.floor(level));
  const f = String(formula ?? '').trim().toLowerCase().replace(/\s/g, '');
  const m = f.match(/^level\*(\d+(?:\.\d+)?)$/);
  if (m) return lv * Number(m[1]);
  return 0;
}

export function resolveFacilityTdiContributionForLevel(facilityType: string, level: number): number {
  const row = getFacilityUpgradeLevelRow(facilityType, level);
  if (!row) return 0;
  return evaluateFacilityTdiContributionFormula(row.tdiContributionFormula, level);
}
