import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const db = 'd:/arcfire20260607/tools/_tmp_RKStorage_device_now.db';
const head = readFileSync(db).subarray(0, 16);
if (head.toString('ascii', 0, 6) !== 'SQLite') {
  console.error('Not a valid SQLite file, header:', head.toString('hex'));
  process.exit(1);
}

const keys = [
  'arcfire_arc_core_vault_v1',
  'arcfire_arc_core_transport_fleet_bank_v1',
  'arcfire_blue_team_shared_vault_v1',
  'arcfire_arc_core_central_bank_ledger_v1',
  'arcfire_planet_trade_fee_ledger_v1',
];

function readKey(key) {
  const raw = execFileSync(
    'sqlite3',
    [db, `SELECT value FROM catalystLocalStorage WHERE key='${key}';`],
    { encoding: 'utf8' },
  ).trim();
  if (!raw) return null;
  return JSON.parse(raw);
}

function sumKind(txns, kind) {
  const rows = (txns ?? []).filter((t) => t.kind === kind);
  return { count: rows.length, sum: rows.reduce((s, t) => s + (t.deltaCredits ?? 0), 0) };
}

function summarizeVault(key, seed) {
  const data = readKey(key);
  if (!data) return { key, status: 'EMPTY' };
  const txns = data.txns ?? [];
  const byKind = {};
  for (const t of txns) {
    byKind[t.kind] = (byKind[t.kind] ?? 0) + (t.deltaCredits ?? 0);
  }
  const centralBankKinds = [
    'central_bank_mint',
    'central_bank_burn',
    'central_bank_spend_fleet_military',
    'central_bank_spend_planet_opening',
    'central_bank_spend_planet_development',
  ];
  const centralBank = {};
  for (const k of centralBankKinds) {
    if (byKind[k]) centralBank[k] = byKind[k];
  }
  return {
    key,
    balanceCredits: data.balanceCredits,
    seedBaseline: seed,
    surplusOverSeed: seed != null ? data.balanceCredits - seed : null,
    totalInflowCredits: data.totalInflowCredits,
    totalOutflowCredits: data.totalOutflowCredits,
    txnCount: txns.length,
    centralBankTxns: centralBank,
    topKinds: Object.fromEntries(
      Object.entries(byKind)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .slice(0, 8),
    ),
    newestTxn: txns[0] ?? null,
  };
}

console.log('=== ArcCore Central Bank / Vault (device live) ===\n');
console.log(JSON.stringify(summarizeVault('arcfire_arc_core_vault_v1', 100_000), null, 2));
console.log('\n--- central bank expenditure ledger ---');
console.log(JSON.stringify(readKey('arcfire_arc_core_central_bank_ledger_v1'), null, 2));
console.log('\n--- related vaults ---');
console.log(JSON.stringify(summarizeVault('arcfire_arc_core_transport_fleet_bank_v1', 500_000), null, 2));
console.log(JSON.stringify(summarizeVault('arcfire_blue_team_shared_vault_v1', 100_000), null, 2));

const arc = readKey('arcfire_arc_core_vault_v1');
if (arc?.txns?.length) {
  console.log('\n--- arc vault newest 5 txns (prepend order) ---');
  console.log(JSON.stringify(arc.txns.slice(0, 5), null, 2));
}
