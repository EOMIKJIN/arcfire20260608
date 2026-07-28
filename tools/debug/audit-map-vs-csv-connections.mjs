import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const src = readFileSync(resolve(root, 'src/data/generated/galaxySystems100.generated.ts'), 'utf8');

const baseIds = [
  'arcadia', 'solar_port', 'minerva', 'vega_outpost', 'new_eden', 'iron_cross',
  'draco_nebula', 'omega_station', 'helios', 'sirius', 'titan_gate', 'perseus',
  'crimson_zone', 'dark_rift', 'blood_field', 'shadow_nexus', 'abyss', 'nightfall',
  'arcfire_core', 'eternity', 'genesis',
];

function parsePlanets() {
  const lines = readFileSync(resolve(root, 'tables/content/planets.csv'), 'utf8')
    .replace(/^\uFEFF/, '')
    .trim()
    .split(/\r?\n/);
  const h = lines[0].split(',');
  const ix = Object.fromEntries(h.map((x, i) => [x, i]));
  const g = new Map();
  for (const line of lines.slice(1)) {
    const c = line.split(',');
    const id = c[ix.systemId];
    const pipe = String(c[ix.systemConnectionsPipe] || '')
      .split('|')
      .map((s) => s.trim())
      .filter(Boolean);
    g.set(id, pipe.filter((x) => baseIds.includes(x)));
  }
  return g;
}

function g100Conns(id) {
  const marker = `"id": "${id}"`;
  const idx = src.indexOf(marker);
  if (idx < 0) return null;
  const slice = src.slice(idx, idx + 2500);
  const m = slice.match(/"connections":\s*\[([^\]]*)\]/);
  if (!m) return [];
  return m[1]
    .split(',')
    .map((s) => s.replace(/["\s]/g, ''))
    .filter(Boolean);
}

const planets = parsePlanets();
const rows = [];
for (const id of baseIds) {
  const p = planets.get(id) || [];
  const g = g100Conns(id) || [];
  const gBase = g.filter((x) => baseIds.includes(x));
  const gSynth = g.filter((x) => x.startsWith('synth_'));
  const onlyPlanets = p.filter((x) => !gBase.includes(x));
  const onlyG100Base = gBase.filter((x) => !p.includes(x));
  rows.push({
    id,
    planetsCsv: p,
    g100GameplayNeighbors: gBase,
    g100SynthBridges: gSynth.length,
    droppedOnMapVsCsv: onlyPlanets,
    extraOnMapVsCsv: onlyG100Base,
    g100Degree: g.length,
  });
}

const out = {
  note: 'GALAXY_SYSTEMS(월드맵)은 STAR_SYSTEMS 복사 후 synth 브리지 + maxDegree=3 캡. 이동/분쟁은 STAR_SYSTEMS(csv) 정본.',
  rows,
  summary: {
    systemsWithDroppedCsvEdgesOnMap: rows.filter((r) => r.droppedOnMapVsCsv.length).map((r) => ({
      id: r.id,
      dropped: r.droppedOnMapVsCsv,
    })),
    systemsWithExtraBaseEdgesOnMap: rows.filter((r) => r.extraOnMapVsCsv.length).map((r) => ({
      id: r.id,
      extra: r.extraOnMapVsCsv,
    })),
  },
};

writeFileSync(
  resolve(root, 'tools/kim-team-lead/reports/SYSTEM_CONNECTIONS_MAP_VS_CSV_20260728.json'),
  JSON.stringify(out, null, 2),
);
console.log(JSON.stringify(out.summary, null, 2));
for (const r of rows) {
  console.log(
    r.id,
    'csv=',
    r.planetsCsv.join('|'),
    'mapBase=',
    r.g100GameplayNeighbors.join('|'),
    'drop=',
    r.droppedOnMapVsCsv.join('|') || '-',
    'extra=',
    r.extraOnMapVsCsv.join('|') || '-',
    'deg',
    r.g100Degree,
  );
}
