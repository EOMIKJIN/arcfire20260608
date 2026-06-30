#!/usr/bin/env node
/**
 * synth_system_colonization.csv → planet_resource_genesis.csv
 *
 * R(자원) 설계 원칙 (2026-06-27):
 * - R = 일반(저가) 광물·에너지 풍부도 + 거주 쾌적성. zone 난이도 ≠ 저자원.
 * - 희귀/고급 광물은 mining_zone_mineral_pool · poolWeight로만 제한.
 * - scenario 21행성: lore·planets.csv·무역/광물 지역 수동 정본.
 * - synth: 미개척 개척지 — zone에 완만히만 연동(저zone=14% 같은 빈곤 곡선 금지).
 */
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

/** synth 미개척 — R 하한 34+, zone 21에서 ~62 (구 10~70 빈곤 곡선 폐기) */
function genesisFromZone(planetId, zoneIndex) {
  const z = Math.max(1, Math.min(21, Number(zoneIndex) || 1));
  const seed = planetIdSeed(planetId);
  const jitter = (pseudoRandom(seed) - 0.5) * 6;
  const resource = clamp100(36 + ((z - 1) / 20) * 28 + jitter);
  const population = clamp100(44 + ((z - 1) / 20) * 14 + (pseudoRandom(seed + 3) - 0.5) * 8);
  const defense = clamp100(40 + ((z - 1) / 20) * 18 + (pseudoRandom(seed + 7) - 0.5) * 6);
  const technology = clamp100(42 + ((z - 1) / 20) * 16 + (pseudoRandom(seed + 11) - 0.5) * 8);
  const environment = clamp100(42 + ((z - 1) / 20) * 12 + (pseudoRandom(seed + 19) - 0.5) * 10);
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

/** [R,P,D,T,E] — planets.csv lore · 무역/광물 region · zone≠R */
const manualGenesis = {
  arcadia_prime: {
    stats: [50, 54, 42, 44, 58],
    notes: 'starter gateway — common ore abundant rare zone-gated',
  },
  vega_base: {
    stats: [36, 46, 55, 48, 42],
    notes: 'military outpost — moderate sustain not mining hub',
  },
  solar_station: {
    stats: [50, 56, 44, 50, 46],
    notes: 'galactic trade hub — common goods throughput',
  },
  minerva_deep: {
    stats: [52, 44, 48, 46, 38],
    notes: 'mining center — rich common/strategic ore underground',
  },
  draco_haven: {
    stats: [36, 46, 42, 54, 50],
    notes: 'nebula research — energy lab not ore exporter',
  },
  eden_city: {
    stats: [48, 58, 46, 52, 52],
    notes: 'commercial capital — trade politics high population',
  },
  iron_remnant: {
    stats: [26, 40, 52, 44, 34],
    notes: 'war remnant scavengers — harsh low yield',
  },
  sirius_border: {
    stats: [38, 44, 50, 46, 42],
    notes: 'frontier last safe — moderate border sustain',
  },
  perseus_memorial: {
    stats: [32, 42, 54, 48, 44],
    notes: 'memorial battlefield — scarred moderate',
  },
  crimson_base: {
    stats: [34, 38, 56, 42, 34],
    notes: 'pvp mercenary base — high risk harsh',
  },
  blood_station: {
    stats: [28, 36, 58, 40, 32],
    notes: 'brutal battlefield station — depleted scars',
  },
  helios_core: {
    stats: [50, 44, 42, 56, 48],
    notes: 'stellar energy center — solar battery production',
  },
  titan_ruins: {
    stats: [30, 40, 44, 52, 46],
    notes: 'ancient gate ruins — archaeology salvage',
  },
  omega_hub: {
    stats: [48, 54, 46, 50, 44],
    notes: 'galactic route nexus — 24h trade hub',
  },
  nightfall_citadel: {
    stats: [30, 36, 52, 48, 30],
    notes: 'dark fortress — eternal night low habitability',
  },
  shadow_market: {
    stats: [40, 42, 46, 50, 38],
    notes: 'illegal trade crossroads — traffic not mining',
  },
  dark_haven: {
    stats: [32, 38, 48, 52, 36],
    notes: 'warped space secret base — void harsh',
  },
  abyss_gate: {
    stats: [40, 34, 56, 54, 32],
    notes: 'abyss final gate — late pvp choke',
  },
  core_prime: {
    stats: [55, 46, 58, 56, 48],
    notes: 'crimson capital — galactic energy converge',
  },
  eternal_throne: {
    stats: [58, 42, 60, 58, 46],
    notes: 'ancient empire throne — endgame rich',
  },
  genesis_origin: {
    stats: [65, 44, 62, 60, 52],
    notes: 'cosmic origin endgame — myth tier deposits',
  },
};

const manualOut = Object.entries(manualGenesis).map(([planetId, { stats: [r, p, d, t, e], notes }]) => {
  const mul = Math.round((r / 50) * 100) / 100;
  return [planetId, r, p, d, t, e, mul, notes].join(',');
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
    `synth zone ${row.zoneIndex} colonizable frontier`,
  ].join(',');
});

const out = [header.join(','), ...manualOut, ...synthOut].join('\n') + '\n';
writeFileSync(GENESIS_CSV, out, 'utf8');
console.log(`[generate-synth-resource-genesis] ${synthOut.length} synth + ${manualOut.length} manual rows`);
