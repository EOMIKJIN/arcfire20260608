import { execFileSync } from 'node:child_process';

const dbPath = 'd:/arcfire20260607/tools/_tmp_RKStorage3.db';
const raw = execFileSync(
  'sqlite3',
  [dbPath, "SELECT value FROM catalystLocalStorage WHERE key='arcfire_arc_core_transport_fleet_bank_v1';"],
  { encoding: 'utf8' },
);
const data = JSON.parse(raw.trim());
const seed = 500_000;
const { balanceCredits: bal, totalInflowCredits: inflow, totalOutflowCredits: outflow, txns = [] } = data;

let buy = 0;
let profit = 0;
let loss = 0;
for (const t of txns) {
  const d = t.deltaCredits ?? 0;
  if (t.kind === 'convoy_buy') buy += -d;
  else if (t.kind === 'convoy_profit') profit += d;
  else if (t.kind === 'convoy_loss') loss += -d;
}

// In-transit inventory only exists in RAM (shipCargoById); persisted snapshot => 0 at rest.
const inTransitCost = 0;

const adjusted = bal + outflow - inTransitCost;

console.log(
  JSON.stringify(
    {
      balanceCredits: bal,
      totalInflowCredits: inflow,
      totalOutflowCredits: outflow,
      txnCount: txns.length,
      txnSums: { convoy_buy: buy, convoy_profit: profit, convoy_loss: loss },
      adjusted_after_adding_back_buy_outflow: adjusted,
      adjusted_seed_plus_net_margin: seed + profit - loss,
      cumulative_net_margin_only: inflow - seed,
      formula_check_balance: seed + profit - buy - loss,
    },
    null,
    2,
  ),
);
