/**
 * synth 성계 — 아르카디아 기준 BFS hop·유클리드 거리 vs CSV zoneIndex 상관 분석
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());

function parseCsv(text) {
  const rows = [];
  let i = 0;
  let field = '';
  let row = [];
  let inQuotes = false;
  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
      } else field += ch;
      i += 1;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (ch === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      rows.push(row);
      row = [];
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function loadCsv(rel) {
  const raw = readFileSync(resolve(ROOT, rel), 'utf8').trim();
  const rows = parseCsv(raw);
  const h = rows[0];
  return rows.slice(1).map((cols) => Object.fromEntries(h.map((k, j) => [k, cols[j] ?? ''])));
}

// galaxy100 positions + connections from generated bundle (runtime graph)
const { GALAXY_SYSTEMS, parseSynthOrdinal } = await import('../../src/data/galaxy100.ts');

const ARCADIA = 'arcadia';
const byId = GALAXY_SYSTEMS;

function bfsDistances(fromId) {
  const dist = new Map();
  const q = [fromId];
  dist.set(fromId, 0);
  for (let qi = 0; qi < q.length; qi += 1) {
    const id = q[qi];
    const d = dist.get(id);
    for (const n of byId[id]?.connections ?? []) {
      if (!byId[n] || dist.has(n)) continue;
      dist.set(n, d + 1);
      q.push(n);
    }
  }
  return dist;
}

function euclid(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

const hops = bfsDistances(ARCADIA);
const arcPos = byId[ARCADIA].position;
const synthRows = loadCsv('tables/balance/synth_system_colonization.csv');

const enriched = synthRows.map((r) => {
  const id = r.synthSystemId;
  const sys = byId[id];
  const hopFromArcadia = hops.has(id) ? hops.get(id) : 999;
  const euc = sys ? euclid(sys.position, arcPos) : null;
  return {
    id,
    ord: parseSynthOrdinal(id),
    zoneIndex: Number(r.zoneIndex),
    combat: Number(r.targetCombatLevel),
    affinity: r.enemyAffinityKind,
    name: r.systemNameKo,
    hopFromArcadia,
    euc,
  };
}).filter((r) => byId[r.id]);

enriched.sort((a, b) => a.hopFromArcadia - b.hopFromArcadia || (a.euc ?? 0) - (b.euc ?? 0));

console.log('=== 아르카디아에서 가장 가까운 synth 20 (BFS hop → euclidean) ===');
console.log('id | hop | euc | csvZone | combat | name');
for (const r of enriched.slice(0, 20)) {
  console.log(
    `${r.id} | ${String(r.hopFromArcadia).padStart(3)} | ${(r.euc ?? 0).toFixed(3)} | ${String(r.zoneIndex).padStart(2)} | ${String(r.combat).padStart(2)} | ${r.name}`,
  );
}

const s73 = enriched.find((r) => r.id === 'synth_073');
console.log('\n=== synth_073 (fresh-start seed) ===');
console.log(JSON.stringify(s73, null, 2));
console.log(`hop rank: ${enriched.findIndex((r) => r.id === 'synth_073') + 1} / ${enriched.length}`);

console.log('\n=== ordinal vs hop mismatch (ord<=20, hop>=4) ===');
for (const r of enriched.filter((x) => x.ord <= 20 && x.hopFromArcadia >= 4)) {
  console.log(r.id, 'ord', r.ord, 'hop', r.hopFromArcadia, 'zone', r.zoneIndex);
}

console.log('\n=== hop bucket → csv zoneIndex 분포 ===');
const buckets = new Map();
for (const r of enriched) {
  const b = r.hopFromArcadia >= 999 ? 'unreach' : String(r.hopFromArcadia);
  const arr = buckets.get(b) ?? [];
  arr.push(r);
  buckets.set(b, arr);
}
for (const [b, arr] of [...buckets.entries()].sort((a, c) => {
  if (a[0] === 'unreach') return 1;
  if (c[0] === 'unreach') return -1;
  return Number(a[0]) - Number(c[0]);
})) {
  const zones = arr.map((x) => x.zoneIndex);
  const avg = zones.reduce((s, x) => s + x, 0) / zones.length;
  console.log(
    `hop ${b.padStart(2)} | n=${String(arr.length).padStart(2)} | zone avg=${avg.toFixed(1)} min=${Math.min(...zones)} max=${Math.max(...zones)}`,
  );
}

console.log('\n=== 현재 CSV 규칙: zoneIndex ≈ synthOrdinal band (ord 1-8 → zone 1-2 등) ===');
const byOrd = [...enriched].sort((a, b) => a.ord - b.ord);
let ordZoneMismatch = 0;
for (const r of byOrd) {
  const expectedFromOrd = r.ord <= 8 ? 1 : r.ord <= 16 ? 2 : r.ord <= 24 ? 3 : Math.min(21, 4 + Math.floor((r.ord - 24) / 8));
  if (Math.abs(r.zoneIndex - expectedFromOrd) > 2) ordZoneMismatch += 1;
}
console.log('ordinal heuristic mismatch count:', ordZoneMismatch);
