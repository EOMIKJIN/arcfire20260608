/**
 * 존별 광물 풀·드랍 확률 분포 리포트 (mining_zone_mineral_pool + drop_weight)
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

function loadCsv(relPath) {
  const raw = readFileSync(resolve(ROOT, relPath), 'utf8').trim();
  const rows = parseCsv(raw);
  const header = rows[0].map((h) => String(h).replace(/^\uFEFF/, ''));
  return rows.slice(1).map((cols) => {
    const out = {};
    for (let j = 0; j < header.length; j += 1) out[header[j]] = cols[j] ?? '';
    return out;
  });
}

const catalog = loadCsv('tables/balance/mining_mineral_catalog.csv');
const poolRows = loadCsv('tables/balance/mining_zone_mineral_pool.csv');
const dropRows = loadCsv('tables/balance/mining_drop_weight_policy.csv');
const playZones = loadCsv('tables/balance/play_scenario_zone_planets.csv');
const byId = Object.fromEntries(catalog.map((r) => [r.mineralId, r]));

function zonePool(z) {
  for (const row of poolRows) {
    const a = Number(row.zoneIndexMin);
    const b = Number(row.zoneIndexMax);
    if (z >= a && z <= b) {
      const out = [];
      for (let i = Number(row.mineralIndexMin); i <= Number(row.mineralIndexMax); i += 1) {
        const e = catalog.find((c) => Number(c.mineralIndex) === i);
        if (e) out.push(e.mineralId);
      }
      return out;
    }
  }
  return [];
}

function primaryPct(z) {
  for (const row of dropRows) {
    if (z >= Number(row.zoneIndexMin) && z <= Number(row.zoneIndexMax)) return Number(row.primaryWeightPct);
  }
  return 70;
}

function dropDist(z) {
  const pool = zonePool(z);
  if (!pool.length) return {};
  const primary = pool[0];
  const pw = primaryPct(z) / 100;
  const sec = pool.slice(1);
  const d = {};
  d[primary] = (d[primary] ?? 0) + pw;
  if (sec.length) {
    const sw = (1 - pw) / sec.length;
    for (const id of sec) d[id] = (d[id] ?? 0) + sw;
  }
  return d;
}

function displayKindCap(z) {
  if (z <= 1) return 1;
  if (z <= 10) return 2;
  return 3;
}

console.log('=== Zone pool sizes ===');
for (let z = 1; z <= 21; z += 1) {
  const p = zonePool(z);
  console.log(
    `Zone ${String(z).padStart(2)}: ${p.length} kinds — ${p.map((id) => byId[id]?.displayNameKo ?? id).join(', ')}`,
  );
}

console.log('\n=== Drop probability ===');
for (let z = 1; z <= 21; z += 1) {
  const d = dropDist(z);
  const parts = Object.entries(d).map(
    ([k, v]) => `${byId[k]?.displayNameKo ?? k}:${(v * 100).toFixed(1)}%`,
  );
  console.log(`Zone ${String(z).padStart(2)}: primary ${primaryPct(z)}% | ${parts.join(' ')}`);
}

console.log('\n=== Scenario planets (zone 1-5) ===');
for (const row of playZones) {
  const z = Number(row.zoneIndex);
  if (z > 5) continue;
  const pid = row.primaryPlanetId;
  const pool = zonePool(z);
  const cap = Math.min(displayKindCap(z), pool.length);
  console.log(
    `zone=${z} ${pid} pool=${pool.length} displayCap=${cap} primary=${byId[pool[0]]?.displayNameKo ?? pool[0]}`,
  );
}
