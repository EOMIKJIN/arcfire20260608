#!/usr/bin/env node
/**
 * planet_resource_genesis.csv — 코어 21 + 남·북 수도만.
 * synth/확장 5지표는 런타임 거리 능선(`galaxyFrontierDevelopmentRidge`) 정본.
 * 구 zone↑=스탯↑ synth 행은 쓰지 않는다 (2026-09-13).
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const GENESIS_CSV = resolve(ROOT, 'tables/balance/planet_resource_genesis.csv');

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
  synth_706_p: {
    stats: [52, 54, 50, 52, 48],
    notes: 'mercurium south-route rim capital — not core 21',
  },
  synth_732_p: {
    stats: [50, 52, 48, 54, 50],
    notes: 'aurelium north-route rim capital — not core 21',
  },
};

const manualOut = Object.entries(manualGenesis).map(([planetId, { stats: [r, p, d, t, e], notes }]) => {
  const mul = Math.round((r / 50) * 100) / 100;
  return [planetId, r, p, d, t, e, mul, notes].join(',');
});

const out = [header.join(','), ...manualOut].join('\n') + '\n';
writeFileSync(GENESIS_CSV, out, 'utf8');
console.log(`[generate-synth-resource-genesis] ${manualOut.length} core+capital rows (synth ridge is runtime)`);
