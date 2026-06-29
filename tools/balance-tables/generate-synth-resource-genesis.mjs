#!/usr/bin/env node
/** synth_system_colonization.csv → planet_resource_genesis.csv synth_* 행 자동 생성 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const SYNTH_CSV = resolve(ROOT, 'tables/balance/synth_system_colonization.csv');
const GENESIS_CSV = resolve(ROOT, 'tables/balance/planet_resource_genesis.csv');

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

function clamp100(n) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function planetIdSeed(planetId) {
  let s = 0;
  for (let i = 0; i < planetId.length; i += 1) s += planetId.charCodeAt(i) * (i + 17);
  return s;
}

function pseudoRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function genesisFromZone(planetId, zoneIndex) {
  const z = Math.max(1, Math.min(21, Number(zoneIndex) || 1));
  const seed = planetIdSeed(planetId);
  const jitter = (pseudoRandom(seed) - 0.5) * 8;
  const resource = clamp100(10 + ((z - 1) / 20) * 60 + jitter);
  const population = clamp100(42 + ((z - 1) / 20) * 18 + (pseudoRandom(seed + 3) - 0.5) * 10);
  const defense = clamp100(38 + ((z - 1) / 20) * 22 + (pseudoRandom(seed + 7) - 0.5) * 8);
  const technology = clamp100(40 + ((z - 1) / 20) * 24 + (pseudoRandom(seed + 11) - 0.5) * 10);
  const environment = clamp100(44 + ((z - 1) / 20) * 16 + (pseudoRandom(seed + 19) - 0.5) * 12);
  const depositWeightMul = Math.round((resource / 50) * 100) / 100;
  return { resource, population, defense, technology, environment, depositWeightMul };
}

if (!existsSync(SYNTH_CSV)) {
  console.warn('[generate-synth-resource-genesis] skip — no synth csv');
  process.exit(0);
}

const synthRaw = readFileSync(SYNTH_CSV, 'utf8').trim();
const synthRows = parseCsv(synthRaw);
const synthHeader = synthRows[0];
const synthData = synthRows.slice(1).map((cols) => {
  const o = {};
  synthHeader.forEach((h, i) => {
    o[h] = cols[i] ?? '';
  });
  return o;
});

const header = [
  'planetId',
  'genesisResourcePct',
  'genesisPopulationPct',
  'genesisDefensePct',
  'genesisTechnologyPct',
  'genesisEnvironmentPct',
  'depositWeightMul',
  'notesKo',
];

const manualGenesis = {
  arcadia_prime: [18, 48, 42, 44, 52],
  vega_base: [14, 46, 55, 48, 40],
  solar_station: [22, 52, 44, 50, 46],
  minerva_deep: [52, 44, 48, 46, 38],
  draco_haven: [28, 46, 42, 54, 50],
  eden_city: [24, 58, 46, 52, 48],
  iron_remnant: [20, 40, 52, 44, 36],
  sirius_border: [26, 44, 50, 46, 42],
  perseus_memorial: [24, 42, 54, 48, 44],
  crimson_base: [32, 38, 56, 42, 34],
  blood_station: [30, 36, 58, 40, 32],
  helios_core: [48, 44, 42, 56, 50],
  titan_ruins: [22, 40, 44, 52, 48],
  omega_hub: [28, 54, 46, 50, 44],
  nightfall_citadel: [34, 36, 52, 48, 38],
  shadow_market: [36, 42, 46, 50, 40],
  dark_haven: [38, 38, 48, 52, 42],
  abyss_gate: [42, 34, 56, 54, 36],
  core_prime: [55, 46, 58, 56, 48],
  eternal_throne: [58, 42, 60, 58, 46],
  genesis_origin: [65, 44, 62, 60, 52],
};

const manualOut = Object.entries(manualGenesis).map(([planetId, [r, p, d, t, e]]) => {
  const mul = Math.round((r / 50) * 100) / 100;
  return [planetId, r, p, d, t, e, mul, 'scenario'].join(',');
});

const synthOut = synthData.map((row) => {
  const planetId = `${row.synthSystemId}_p`;
  const g = genesisFromZone(planetId, row.zoneIndex);
  return [
    planetId,
    g.resource,
    g.population,
    g.defense,
    g.technology,
    g.environment,
    g.depositWeightMul,
    `synth zone ${row.zoneIndex}`,
  ].join(',');
});

const out = [header.join(','), ...manualOut, ...synthOut].join('\n') + '\n';
writeFileSync(GENESIS_CSV, out, 'utf8');
console.log(`[generate-synth-resource-genesis] ${synthOut.length} synth + ${manualOut.length} manual rows`);
