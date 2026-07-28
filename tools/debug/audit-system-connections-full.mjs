/**
 * Full node-connection consistency audit.
 * node tools/debug/audit-system-connections-full.mjs
 */
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

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
    g.set(id, new Set(pipe));
  }
  return g;
}

function parseStarConn() {
  const p = resolve(root, 'tables/content/star_system_connections.csv');
  if (!existsSync(p)) return new Map();
  const lines = readFileSync(p, 'utf8').replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  const g = new Map();
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const [a, b] = line.split(',');
    if (!a || !b) continue;
    if (!g.has(a)) g.set(a, new Set());
    g.get(a).add(b.trim());
  }
  return g;
}

function parseCsvSystemsTs() {
  const src = readFileSync(resolve(root, 'src/data/generated/csvSystems.ts'), 'utf8');
  const g = new Map();
  const re = /"([a-z0-9_]+)":\s*\{[\s\S]*?connections:\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(src))) {
    const id = m[1];
    const conns = m[2]
      .split(',')
      .map((s) => s.replace(/["\s]/g, ''))
      .filter(Boolean);
    g.set(id, new Set(conns));
  }
  return g;
}

function parseGalaxy100() {
  const p = resolve(root, 'src/data/generated/galaxySystems100.generated.ts');
  if (!existsSync(p)) return null;
  const src = readFileSync(p, 'utf8');
  // try JSON-ish connections arrays in object literals
  const g = new Map();
  const blocks = src.split(/"id":\s*"/).slice(1);
  for (const block of blocks) {
    const id = block.slice(0, block.indexOf('"'));
    const cm = block.match(/"connections":\s*\[([^\]]*)\]/);
    if (!cm) continue;
    const conns = cm[1]
      .split(',')
      .map((s) => s.replace(/["\s]/g, ''))
      .filter(Boolean);
    g.set(id, new Set(conns));
  }
  return g.size ? g : null;
}

function asym(g) {
  const issues = [];
  for (const [a, set] of g) {
    for (const b of set) {
      if (!g.has(b)) issues.push(`${a}->${b} (target missing)`);
      else if (!g.get(b).has(a)) issues.push(`${a}->${b} (missing reverse)`);
    }
  }
  return issues;
}

function eqMaps(a, b, labelA, labelB) {
  const diffs = [];
  const ids = new Set([...a.keys(), ...b.keys()]);
  for (const id of [...ids].sort()) {
    const sa = [...(a.get(id) || [])].sort().join('|');
    const sb = [...(b.get(id) || [])].sort().join('|');
    if (sa !== sb) diffs.push({ id, [labelA]: sa, [labelB]: sb });
  }
  return diffs;
}

function buildEffectiveFromSources(planets, star) {
  // mirrors build-content-from-csv: if star has ANY rows for system, use ONLY those; else planets pipe
  const out = new Map();
  for (const id of planets.keys()) {
    if (star.has(id)) out.set(id, new Set(star.get(id)));
    else out.set(id, new Set(planets.get(id)));
  }
  return out;
}

const planets = parsePlanets();
const star = parseStarConn();
const gen = parseCsvSystemsTs();
const g100 = parseGalaxy100();
const effectiveBuild = buildEffectiveFromSources(planets, star);

const report = {
  counts: {
    planets: planets.size,
    starSystems: star.size,
    starEdges: [...star.values()].reduce((n, s) => n + s.size, 0),
    csvSystems: gen.size,
    galaxy100: g100 ? g100.size : null,
  },
  starCoverage: {
    withStarRows: [...planets.keys()].filter((k) => star.has(k)),
    withoutStarRows: [...planets.keys()].filter((k) => !star.has(k)),
  },
  planetsVsGenerated: eqMaps(planets, gen, 'planets', 'csvSystems'),
  effectiveBuildVsGenerated: eqMaps(effectiveBuild, gen, 'effectiveBuild', 'csvSystems'),
  asymmetricPlanets: asym(planets),
  asymmetricGenerated: asym(gen),
  helios: [...(planets.get('helios') || [])],
  perseus: [...(planets.get('perseus') || [])],
  heliosPerseusDirect: !!(planets.get('helios')?.has('perseus') || planets.get('perseus')?.has('helios')),
  starVsPlanetsWhereOverlapping: [...planets.keys()]
    .filter((k) => star.has(k))
    .map((id) => ({
      id,
      star: [...star.get(id)].sort().join('|'),
      planets: [...planets.get(id)].sort().join('|'),
      match: [...star.get(id)].sort().join('|') === [...planets.get(id)].sort().join('|'),
    })),
  galaxy100LegacyOverlap: g100
    ? [...planets.keys()]
        .filter((id) => g100.has(id))
        .map((id) => {
          const a = [...planets.get(id)].sort().join('|');
          const b = [...g100.get(id)].sort().join('|');
          return a === b ? null : { id, planets: a, galaxy100: b };
        })
        .filter(Boolean)
    : 'no galaxy100 parse',
};

const outPath = resolve(root, 'tools/kim-team-lead/reports/SYSTEM_CONNECTIONS_FULL_AUDIT_20260728.json');
writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify(report, null, 2));
console.log('WROTE', outPath);
