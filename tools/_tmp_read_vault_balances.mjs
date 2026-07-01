import { execFileSync } from 'node:child_process';

const db = 'd:/arcfire20260607/tools/_tmp_RKStorage_live.db';
const keys = [
  'arcfire_arc_core_vault_v1',
  'arcfire_arc_core_transport_fleet_bank_v1',
  'arcfire_blue_team_shared_vault_v1',
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
  const sum = rows.reduce((s, t) => s + (t.deltaCredits ?? 0), 0);
  return { count: rows.length, sum };
}

for (const key of keys) {
  const data = readKey(key);
  if (!data) {
    console.log(`${key}: EMPTY\n---`);
    continue;
  }
  const txns = data.txns ?? [];
  const seed = key.includes('arc_core_vault')
    ? 100_000
    : key.includes('fleet')
      ? 500_000
      : null;
  const netFromSeed = seed != null ? data.balanceCredits - seed : null;
  console.log(
    JSON.stringify(
      {
        key,
        balanceCredits: data.balanceCredits,
        seedBaseline: seed,
        netAccumulatedSinceSeed: netFromSeed,
        totalInflowCredits: data.totalInflowCredits,
        totalOutflowCredits: data.totalOutflowCredits,
        txnCount: txns.length,
        convoy_net_margin_share: sumKind(txns, 'convoy_net_margin_share'),
        trade_fee_convoy: sumKind(txns, 'trade_fee_convoy'),
        trade_fee: sumKind(txns, 'trade_fee'),
        lastTxn: txns.slice(-1)[0] ?? null,
      },
      null,
      2,
    ),
  );
  console.log('---');
}

const arc = readKey('arcfire_arc_core_vault_v1');
if (arc) {
  const byKind = {};
  for (const t of arc.txns ?? []) {
    byKind[t.kind] = (byKind[t.kind] ?? 0) + (t.deltaCredits ?? 0);
  }
  console.log(JSON.stringify({ arcVaultByKindDelta: byKind }, null, 2));
}
