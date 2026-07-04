/**
 * synth 행성소유권 — item_defs.csv 단일 정본 검증
 * npx tsx tools/debug/audit-synth-ownership-item-defs.ts
 */
import { readFileSync } from 'node:fs';
import { ITEM_DEFS_FROM_CSV } from '../../src/data/generated/csvItemDefs';
import { SynthSystemColonization_FROM_BALANCE_CSV } from '../../src/data/balance/generated/csvSynthSystemColonization';

function parseBool(raw: string | undefined): boolean {
  return String(raw ?? '').trim().toLowerCase() === 'true';
}

let fail = 0;
const tradePortSynth = SynthSystemColonization_FROM_BALANCE_CSV.filter((r) =>
  parseBool(String(r.hasTradePort)),
);

for (const row of tradePortSynth) {
  const systemId = String(row.synthSystemId ?? '').trim();
  const planetId = `${systemId}_p`;
  const itemId = `ownership_${planetId}`;
  const def = ITEM_DEFS_FROM_CSV[itemId];
  if (!def || def.type !== 'planet_ownership' || !def.tradeable) {
    console.error(`[FAIL] ITEM_DEFS missing: ${itemId}`);
    fail += 1;
  }
  const csvText = readFileSync('tables/content/item_defs.csv', 'utf8');
  if (!csvText.includes(itemId)) {
    console.error(`[FAIL] item_defs.csv missing row: ${itemId} — run npm run build:content-tables`);
    fail += 1;
  }
}

const synthOwnershipCount = Object.keys(ITEM_DEFS_FROM_CSV).filter((id) =>
  id.startsWith('ownership_synth_'),
).length;
const csvOwnershipCount = readFileSync('tables/content/item_defs.csv', 'utf8')
  .split(/\r?\n/)
  .filter((line) => line.startsWith('ownership_')).length;

console.log(`synth colonization hasTradePort: ${tradePortSynth.length}`);
console.log(`item_defs.csv ownership rows: ${csvOwnershipCount}`);
console.log(`ITEM_DEFS ownership_synth_*: ${synthOwnershipCount}`);

if (fail > 0 || synthOwnershipCount !== tradePortSynth.length) {
  console.error(`\naudit-synth-ownership-item-defs: FAIL`);
  process.exit(1);
}

console.log('\naudit-synth-ownership-item-defs: PASS — item_defs.csv 단일 정본');
