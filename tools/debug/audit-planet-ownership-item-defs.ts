/**
 * 행성 소유권 item_defs — A(21)+synth Table-First 통합 검증
 * npx tsx tools/debug/audit-planet-ownership-item-defs.ts
 */
import { readFileSync } from 'node:fs';
import { ITEM_DEFS_FROM_CSV } from '../../src/data/generated/csvItemDefs';
import { SynthSystemColonization_FROM_BALANCE_CSV } from '../../src/data/balance/generated/csvSynthSystemColonization';

function parseBool(raw: string | undefined): boolean {
  return String(raw ?? '').trim().toLowerCase() === 'true';
}

function loadPlanetsCsvTradePortIds(): string[] {
  const text = readFileSync('tables/content/planets.csv', 'utf8').trim();
  const lines = text.split(/\r?\n/);
  const header = lines[0].split(',');
  const idIdx = header.indexOf('id');
  const tradeIdx = header.indexOf('hasTradePort');
  const ids: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (parseBool(cols[tradeIdx])) ids.push(cols[idIdx].trim());
  }
  return ids;
}

let fail = 0;

function checkOwnership(planetId: string, label: string): void {
  const itemId = `ownership_${planetId}`;
  const def = ITEM_DEFS_FROM_CSV[itemId];
  if (!def || def.type !== 'planet_ownership' || !def.tradeable) {
    console.error(`[FAIL] ${label} missing item_defs: ${itemId}`);
    fail += 1;
  }
}

const aTradePort = loadPlanetsCsvTradePortIds();
for (const planetId of aTradePort) {
  checkOwnership(planetId, 'A-planet');
}

const synthTradePort = SynthSystemColonization_FROM_BALANCE_CSV.filter((r) =>
  parseBool(String(r.hasTradePort)),
);
for (const row of synthTradePort) {
  const systemId = String(row.synthSystemId ?? '').trim();
  checkOwnership(`${systemId}_p`, 'synth');
}

console.log(`A trade-port planets: ${aTradePort.length}`);
console.log(`synth hasTradePort: ${synthTradePort.length}`);
const csvOwnership = readFileSync('tables/content/item_defs.csv', 'utf8')
  .split(/\r?\n/)
  .filter((line) => line.startsWith('ownership_')).length;
console.log(`item_defs.csv ownership rows: ${csvOwnership}`);
console.log(
  `ownership_* in ITEM_DEFS: A=${Object.keys(ITEM_DEFS_FROM_CSV).filter((id) => id.startsWith('ownership_') && !id.includes('synth')).length} synth=${Object.keys(ITEM_DEFS_FROM_CSV).filter((id) => id.startsWith('ownership_synth_')).length}`,
);

if (fail > 0) {
  console.error(`\naudit-planet-ownership-item-defs: FAIL (${fail})`);
  process.exit(1);
}

console.log('\naudit-planet-ownership-item-defs: PASS — item_defs.csv 단일 정본');
