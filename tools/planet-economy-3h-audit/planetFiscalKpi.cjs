'use strict';
/** 행성 재정 KPI — audit CJS (src/arcCore/economy/planetFiscalKpi.ts 와 동기) */

const DEFAULT = { warnRatio: 20, failRatio: 50 };

function loadFiscalPolicy(loadCsv) {
  const rows = loadCsv('tables/balance/arc_core_planet_upkeep_policy.csv');
  const kv = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const warn = Number(kv.fiscal_fee_upkeep_warn_ratio);
  const fail = Number(kv.fiscal_fee_upkeep_fail_ratio);
  return {
    warnRatio: Number.isFinite(warn) && warn > 0 ? warn : DEFAULT.warnRatio,
    failRatio: Number.isFinite(fail) && fail > 0 ? fail : DEFAULT.failRatio,
  };
}

function computeFeeUpkeepGini(ratios) {
  const values = ratios.filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
  if (values.length < 2) return 0;
  const n = values.length;
  let sum = 0;
  for (const v of values) sum += v;
  if (sum <= 0) return 0;
  let num = 0;
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) num += Math.abs(values[i] - values[j]);
  }
  return Math.round((num / (2 * n * sum)) * 1000) / 1000;
}

function buildPlanetFiscalSnapshot(inputs, policy = DEFAULT) {
  const rows = inputs.map((row) => {
    const fees = Math.max(0, Math.floor(row.dailyArcFeeCredits));
    const upkeep = Math.max(0, Math.floor(row.dailyUpkeepCredits));
    if (upkeep <= 0) {
      return { ...row, feeUpkeepRatio: null, status: fees > 0 ? 'warn' : 'ok' };
    }
    const ratio = fees / upkeep;
    let status = 'ok';
    if (ratio < 1) status = 'deficit';
    else if (ratio >= policy.failRatio) status = 'fail';
    else if (ratio >= policy.warnRatio) status = 'warn';
    return { ...row, feeUpkeepRatio: Math.round(ratio * 100) / 100, status };
  });
  const ratios = rows.map((r) => r.feeUpkeepRatio).filter((n) => n != null);
  const maxFeeUpkeepRatio = ratios.length ? Math.max(...ratios) : 0;
  const minFeeUpkeepRatio = ratios.length ? Math.min(...ratios) : 0;
  const gini = computeFeeUpkeepGini(ratios);
  const warnCount = rows.filter((r) => r.status === 'warn').length;
  const failCount = rows.filter((r) => r.status === 'fail').length;
  const deficitCount = rows.filter((r) => r.status === 'deficit').length;
  let overall = 'ok';
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

module.exports = { loadFiscalPolicy, buildPlanetFiscalSnapshot, computeFeeUpkeepGini };
