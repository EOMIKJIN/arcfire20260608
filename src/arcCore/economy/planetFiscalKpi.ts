// ============================================================
// 행성 재정 KPI — 수수료/유지비·Gini·WARN/FAIL (일 1회 배치·감사 공용)
// ============================================================

export type PlanetFiscalRowInput = {
  planetId: string;
  dailyArcFeeCredits: number;
  dailyUpkeepCredits: number;
};

export type PlanetFiscalRow = PlanetFiscalRowInput & {
  feeUpkeepRatio: number | null;
  status: 'ok' | 'warn' | 'fail' | 'deficit';
};

export type PlanetFiscalPolicy = {
  warnRatio: number;
  failRatio: number;
};

export type PlanetFiscalSnapshot = {
  rows: PlanetFiscalRow[];
  maxFeeUpkeepRatio: number;
  minFeeUpkeepRatio: number;
  gini: number;
  warnCount: number;
  failCount: number;
  deficitCount: number;
  overall: 'ok' | 'warn' | 'fail';
};

export const DEFAULT_PLANET_FISCAL_POLICY: PlanetFiscalPolicy = {
  warnRatio: 20,
  failRatio: 50,
};

export function resolvePlanetFiscalPolicyFromKv(
  get: (key: string) => string | undefined,
): PlanetFiscalPolicy {
  const warn = Number(get('fiscal_fee_upkeep_warn_ratio'));
  const fail = Number(get('fiscal_fee_upkeep_fail_ratio'));
  return {
    warnRatio: Number.isFinite(warn) && warn > 0 ? warn : DEFAULT_PLANET_FISCAL_POLICY.warnRatio,
    failRatio: Number.isFinite(fail) && fail > 0 ? fail : DEFAULT_PLANET_FISCAL_POLICY.failRatio,
  };
}

export function computeFeeUpkeepGini(ratios: number[]): number {
  const values = ratios.filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
  if (values.length < 2) return 0;
  const n = values.length;
  let sum = 0;
  for (const v of values) sum += v;
  if (sum <= 0) return 0;
  let num = 0;
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      num += Math.abs(values[i] - values[j]);
    }
  }
  return Math.round((num / (2 * n * sum)) * 1000) / 1000;
}

export function buildPlanetFiscalSnapshot(
  inputs: PlanetFiscalRowInput[],
  policy: PlanetFiscalPolicy = DEFAULT_PLANET_FISCAL_POLICY,
): PlanetFiscalSnapshot {
  const rows: PlanetFiscalRow[] = inputs.map((row) => {
    const fees = Math.max(0, Math.floor(row.dailyArcFeeCredits));
    const upkeep = Math.max(0, Math.floor(row.dailyUpkeepCredits));
    if (upkeep <= 0) {
      return { ...row, feeUpkeepRatio: null, status: fees > 0 ? 'warn' : 'ok' };
    }
    const ratio = fees / upkeep;
    let status: PlanetFiscalRow['status'] = 'ok';
    if (ratio < 1) status = 'deficit';
    else if (ratio >= policy.failRatio) status = 'fail';
    else if (ratio >= policy.warnRatio) status = 'warn';
    return { ...row, feeUpkeepRatio: Math.round(ratio * 100) / 100, status };
  });

  const ratios = rows
    .map((r) => r.feeUpkeepRatio)
    .filter((n): n is number => n != null && Number.isFinite(n));
  const maxFeeUpkeepRatio = ratios.length ? Math.max(...ratios) : 0;
  const minFeeUpkeepRatio = ratios.length ? Math.min(...ratios) : 0;
  const gini = computeFeeUpkeepGini(ratios);
  const warnCount = rows.filter((r) => r.status === 'warn').length;
  const failCount = rows.filter((r) => r.status === 'fail').length;
  const deficitCount = rows.filter((r) => r.status === 'deficit').length;

  let overall: PlanetFiscalSnapshot['overall'] = 'ok';
  if (failCount > 0 || maxFeeUpkeepRatio >= policy.failRatio) overall = 'fail';
  else if (warnCount > 0 || deficitCount > 0 || gini >= 0.55) overall = 'warn';

  return {
    rows,
    maxFeeUpkeepRatio,
    minFeeUpkeepRatio,
    gini,
    warnCount,
    failCount,
    deficitCount,
    overall,
  };
}

export function countFiscalWarnStreak(
  timeline: Array<{ economy?: { fiscalOverall?: string } }>,
  minStreak = 3,
): number {
  let streak = 0;
  for (let i = timeline.length - 1; i >= 0; i -= 1) {
    const o = timeline[i]?.economy?.fiscalOverall;
    if (o === 'warn' || o === 'fail') streak += 1;
    else break;
  }
  return streak >= minStreak ? streak : streak;
}
