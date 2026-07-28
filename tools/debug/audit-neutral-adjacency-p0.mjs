/**
 * One-shot audit: seed adjacency asymmetry (NEUTRAL neighbors ignored).
 * Run: node tools/debug/audit-neutral-adjacency-p0.mjs
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',');
  return lines.slice(1).map((line) => {
    const cols = line.split(',');
    const o = {};
    headers.forEach((h, i) => {
      o[h] = cols[i];
    });
    return o;
  });
}

const seeds = parseCsv(readFileSync(resolve(root, 'tables/balance/planet_occupation_seeds.csv'), 'utf8'));
const policies = parseCsv(
  readFileSync(resolve(root, 'tables/balance/arc_core_territorial_combat_policy.csv'), 'utf8'),
);
const systemsSrc = readFileSync(resolve(root, 'src/data/generated/csvSystems.ts'), 'utf8');

const seedBySystem = new Map();
for (const r of seeds) {
  const o = String(r.initialOwner || '').toUpperCase();
  seedBySystem.set(r.systemId, o === 'BLUE' || o === 'RED' ? o : 'NEUTRAL');
}

const connections = new Map();
const re = /"([a-z0-9_]+)":\s*\{[\s\S]*?connections:\s*\[([^\]]*)\]/g;
let m;
while ((m = re.exec(systemsSrc))) {
  const id = m[1];
  const conns = m[2]
    .split(',')
    .map((s) => s.replace(/["\s]/g, ''))
    .filter(Boolean);
  connections.set(id, conns);
}

function classify(sysId) {
  const conns = connections.get(sysId) || [];
  const detail = [];
  let blue = 0;
  let red = 0;
  let neu = 0;
  for (const c of conns) {
    const s = seedBySystem.get(c) || 'NONE';
    detail.push(`${c}=${s}`);
    if (s === 'BLUE') blue += 1;
    else if (s === 'RED') red += 1;
    else if (s === 'NEUTRAL') neu += 1;
  }
  const asym =
    blue > 0 !== red > 0 ? (blue > 0 ? 'BLUE_ONLY' : 'RED_ONLY') : blue > 0 ? 'BOTH' : 'NONE';
  return { conns, detail, blue, red, neu, asym };
}

console.log('=== 대표님 룰: 블루만 또는 레드만 (중립 연결은 무시) ===\n');
console.log('--- FOCUS ---');
for (const id of [
  'helios',
  'titan_gate',
  'omega_station',
  'shadow_nexus',
  'iron_cross',
  'perseus',
  'draco_nebula',
]) {
  const a = classify(id);
  console.log(
    `${id} self=${seedBySystem.get(id)} → ${a.asym} (B${a.blue} R${a.red} N${a.neu})`,
  );
  console.log('  ', a.detail.join(' | '));
}

console.log('\n--- POLICY (enabled) ---');
for (const r of policies) {
  if (r.enabled !== 'true') continue;
  if (r.planetId.startsWith('__')) continue;
  const a = classify(r.systemId);
  console.log(
    `${r.planetId} mode=${r.combatMode} order=${r.campaignOrder} dom=${r.dominantSideWeightPct || '-'} | seedAdj=${a.asym} | P0적용?= ${a.asym === 'BLUE_ONLY' || a.asym === 'RED_ONLY' ? 'YES→' + a.asym : 'NO(' + a.asym + ')'}`,
  );
}

console.log('\n--- 전 성계 시드 비대칭 (범용) ---');
for (const id of [...connections.keys()].sort()) {
  const a = classify(id);
  if (a.asym === 'BLUE_ONLY' || a.asym === 'RED_ONLY') {
    console.log(`${id} self=${seedBySystem.get(id) || '?'} ${a.asym} :: ${a.detail.join(', ')}`);
  }
}
