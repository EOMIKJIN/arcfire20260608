// ============================================================
// 범용 시설 레벨 정책 파서 — trade_port / laboratory / tavern CSV 공통
// ============================================================

export type FacilityGenericLevelRow = {
  level: number;
  displayNameKr: string;
  upgradeDurationSec: number;
  installCostCredits: number;
  upgradeCostCredits: number;
  instantUpgradeCostCredits: number;
  requiredPlayerLevelMin: number;
  requiredStatType: string;
  requiredStatValue: number;
  notesKo: string;
  extras: Record<string, string | number>;
};

type RawRow = Record<string, string | undefined>;

const STANDARD_KEYS = new Set([
  'level',
  'displayNameKr',
  'upgradeDurationSec',
  'installCostCredits',
  'upgradeCostCredits',
  'instantUpgradeCostCredits',
  'requiredPlayerLevelMin',
  'requiredStatType',
  'requiredStatValue',
  'notesKo',
]);

function parseGenericLevelRow(raw: RawRow): FacilityGenericLevelRow {
  const extras: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (STANDARD_KEYS.has(k)) continue;
    const num = Number(v);
    extras[k] = Number.isFinite(num) && v !== '' && !k.includes('Unlock') && !k.includes('Tier')
      ? num
      : String(v ?? '');
  }
  return {
    level: Math.max(1, Math.floor(Number(raw.level) || 1)),
    displayNameKr: String(raw.displayNameKr ?? ''),
    upgradeDurationSec: Math.max(0, Math.floor(Number(raw.upgradeDurationSec) || 0)),
    installCostCredits: Math.max(0, Math.floor(Number(raw.installCostCredits) || 0)),
    upgradeCostCredits: Math.max(0, Math.floor(Number(raw.upgradeCostCredits) || 0)),
    instantUpgradeCostCredits: Math.max(0, Math.floor(Number(raw.instantUpgradeCostCredits) || 0)),
    requiredPlayerLevelMin: Math.max(0, Math.floor(Number(raw.requiredPlayerLevelMin) || 0)),
    requiredStatType: String(raw.requiredStatType ?? '').trim().toLowerCase(),
    requiredStatValue: Math.max(0, Math.floor(Number(raw.requiredStatValue) || 0)),
    notesKo: String(raw.notesKo ?? ''),
    extras,
  };
}

export function buildFacilityGenericLevelPolicy(
  csvRows: readonly RawRow[],
): {
  listRows: () => FacilityGenericLevelRow[];
  getMaxLevel: () => number;
  getLevelRow: (level: number) => FacilityGenericLevelRow | null;
  resolveUpgradeCostCredits: (currentLevel: number) => number | null;
  resolveInstantUpgradeCostCredits: (currentLevel: number) => number | null;
  resolveUpgradeDurationSec: (currentLevel: number) => number | null;
  resolveUpgradeRequiredPlayerLevel: (currentLevel: number) => number;
  resolveUpgradeRequiredStat: (currentLevel: number) => { type: string; value: number };
} {
  let cachedRows: FacilityGenericLevelRow[] | null = null;

  function listRows(): FacilityGenericLevelRow[] {
    if (cachedRows) return cachedRows;
    cachedRows = csvRows.map(parseGenericLevelRow).sort((a, b) => a.level - b.level);
    return cachedRows;
  }

  function getMaxLevel(): number {
    const rows = listRows();
    return rows.length > 0 ? rows[rows.length - 1]!.level : 10;
  }

  function getLevelRow(level: number): FacilityGenericLevelRow | null {
    const clamped = Math.max(1, Math.min(getMaxLevel(), Math.floor(level)));
    return listRows().find((r) => r.level === clamped) ?? null;
  }

  function resolveUpgradeCostCredits(currentLevel: number): number | null {
    const next = getLevelRow(currentLevel + 1);
    return next?.upgradeCostCredits ?? null;
  }

  function resolveInstantUpgradeCostCredits(currentLevel: number): number | null {
    const next = getLevelRow(currentLevel + 1);
    return next?.instantUpgradeCostCredits ?? null;
  }

  function resolveUpgradeDurationSec(currentLevel: number): number | null {
    const next = getLevelRow(currentLevel + 1);
    if (!next) return null;
    return next.upgradeDurationSec;
  }

  function resolveUpgradeRequiredPlayerLevel(currentLevel: number): number {
    const next = getLevelRow(currentLevel + 1);
    return next?.requiredPlayerLevelMin ?? 0;
  }

  function resolveUpgradeRequiredStat(currentLevel: number): { type: string; value: number } {
    const next = getLevelRow(currentLevel + 1);
    return {
      type: next?.requiredStatType ?? '',
      value: next?.requiredStatValue ?? 0,
    };
  }

  return {
    listRows,
    getMaxLevel,
    getLevelRow,
    resolveUpgradeCostCredits,
    resolveInstantUpgradeCostCredits,
    resolveUpgradeDurationSec,
    resolveUpgradeRequiredPlayerLevel,
    resolveUpgradeRequiredStat,
  };
}
