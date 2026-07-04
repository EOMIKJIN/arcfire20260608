'use strict';
const Database = require('better-sqlite3');
const path = require('path');

const DB = process.argv[2] || path.join(__dirname, 'logs/_rkstorage_pull3.db');
const RED = [
  'omega_hub',
  'sirius_border',
  'perseus_memorial',
  'crimson_base',
  'dark_haven',
  'blood_station',
  'abyss_gate',
  'nightfall_citadel',
  'core_prime',
];
const MODULES = [
  'defense_satellite',
  'dev_orbit_shipyard',
  'dev_trade_port',
  'dev_research_lab',
  'dev_population_dome',
];

const db = new Database(DB, { readonly: true });
const row = db.prepare("SELECT value FROM catalystLocalStorage WHERE key = 'arcfire_planet_core_runtime_v1'").get();
const data = JSON.parse(row.value);
const by = data.byPlanetId || {};

const budgetRow = db
  .prepare("SELECT value FROM catalystLocalStorage WHERE key = 'arcfire_arc_core_planet_dev_budget_v1'")
  .get();
const budget = budgetRow ? JSON.parse(budgetRow.value) : null;

const vaultRow = db
  .prepare("SELECT value FROM catalystLocalStorage WHERE key = 'arcfire_arc_core_vault_v1'")
  .get();
let vaultBalance = null;
if (vaultRow) {
  try {
    const v = JSON.parse(vaultRow.value);
    vaultBalance = v.balance ?? v.credits ?? v.state?.balance;
  } catch {
    /* ignore */
  }
}

const dailyOps = db
  .prepare("SELECT value FROM catalystLocalStorage WHERE key = 'arcfire_arc_core_daily_ops_v1'")
  .get();
let lastBatch = null;
if (dailyOps) {
  try {
    lastBatch = JSON.parse(dailyOps.value);
  } catch {
    /* ignore */
  }
}

function moduleSummary(mod) {
  if (!mod || typeof mod !== 'object') return null;
  const out = {};
  if ('installed' in mod) out.installed = mod.installed;
  if ('level' in mod) out.level = mod.level;
  if (mod.upgradeJob) {
    out.upgradeJob = {
      endsAtMs: mod.upgradeJob.endsAtMs,
      fundingSource: mod.upgradeJob.fundingSource,
    };
  }
  if (mod.installJob) {
    out.installJob = {
      endsAtMs: mod.installJob.endsAtMs,
      fundingSource: mod.installJob.fundingSource,
    };
  }
  if (mod.lastFundingSource) out.lastFundingSource = mod.lastFundingSource;
  return Object.keys(out).length ? out : null;
}

console.log(JSON.stringify({ budget, vaultBalance, lastBatch }, null, 2));
console.log('\n--- RED planets development.byModuleId ---\n');

let installedCount = 0;
let arcVaultSpendCount = 0;
const report = [];

for (const pid of RED) {
  const slot = by[pid];
  if (!slot) {
    report.push({ planetId: pid, status: 'NO_RUNTIME_SLOT' });
    continue;
  }
  const dev = slot.detail?.development?.byModuleId || {};
  const modules = {};
  for (const mid of MODULES) {
    const s = moduleSummary(dev[mid]);
    if (s) modules[mid] = s;
    if (s?.installed) installedCount += 1;
    const fs =
      s?.upgradeJob?.fundingSource ||
      s?.installJob?.fundingSource ||
      s?.lastFundingSource;
    if (fs === 'arc_core_vault') arcVaultSpendCount += 1;
  }
  const anyJob = MODULES.some((mid) => {
    const m = dev[mid];
    return m?.upgradeJob || m?.installJob;
  });
  report.push({
    planetId: pid,
    core: {
      R: slot.resource,
      P: slot.population,
      D: slot.defense,
      T: slot.technology,
      E: slot.environment,
    },
    modules,
    anyActiveJob: anyJob,
    moduleCount: Object.keys(modules).length,
  });
}

console.log(JSON.stringify(report, null, 2));
console.log('\n--- summary ---');
console.log(
  JSON.stringify(
    {
      redPlanetsWithRuntime: report.filter((r) => r.core).length,
      totalInstalledModuleFlags: installedCount,
      arcVaultFundingRefs: arcVaultSpendCount,
    },
    null,
    2,
  ),
);

console.log('\n--- crimson_base raw byModuleId ---');
console.log(JSON.stringify(by.crimson_base?.detail?.development?.byModuleId, null, 2));
console.log('\n--- nightfall_citadel raw ---');
console.log(JSON.stringify(by.nightfall_citadel?.detail?.development?.byModuleId, null, 2));

const ledgerRow = db.prepare("SELECT value FROM catalystLocalStorage WHERE key = 'arcfire_arc_core_central_bank_ledger_v1'").get();
if (ledgerRow) console.log('\n--- central bank ledger ---\n', ledgerRow.value);

db.close();
