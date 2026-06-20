/**
 * 행성별 소행성 궤도 수·채굴 광물 배치 리포트 (mineralDepositModel + zone tier 정책 재현)
 */
import { readFileSync, existsSync } from 'node:fs';
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
  const p = resolve(ROOT, relPath);
  if (!existsSync(p)) return [];
  const raw = readFileSync(p, 'utf8').trim();
  if (!raw) return [];
  const rows = parseCsv(raw);
  const header = rows[0].map((h) => String(h).replace(/^\uFEFF/, ''));
  return rows.slice(1).map((cols) => {
    const out = {};
    for (let j = 0; j < header.length; j += 1) out[header[j]] = cols[j] ?? '';
    return out;
  });
}

function parseNum(v, fb = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
}

function clampZone(n) {
  return Math.max(1, Math.min(21, Math.round(n)));
}

// --- 데이터 로드 ---
const systemsTs = readFileSync(resolve(ROOT, 'src/data/generated/csvSystems.ts'), 'utf8');
const planetRe = /id: "([^"]+)",\s*\n\s*systemId: "([^"]+)",\s*\n\s*name: "([^"]+)"/g;
const planetMeta = new Map();
let m;
while ((m = planetRe.exec(systemsTs)) !== null) {
  planetMeta.set(m[1], { id: m[1], systemId: m[2], name: m[3], kind: 'scenario' });
}

const members = loadCsv('tables/content/mineral_region_members.csv');
const regions = loadCsv('tables/content/mineral_regions.csv');
const itemRows = loadCsv('tables/content/item_defs.csv');
const zoneTierRows = loadCsv('tables/balance/mining_mineral_zone_tier.csv');
const playZones = loadCsv('tables/balance/play_scenario_zone_planets.csv');
const synthRows = loadCsv('tables/balance/synth_system_colonization.csv');
const hostileRows = loadCsv('tables/balance/planet_hostile_red_progression.csv');

for (const row of synthRows) {
  const id = `${String(row.synthSystemId).trim()}_p`;
  planetMeta.set(id, {
    id,
    systemId: String(row.synthSystemId).trim(),
    name: String(row.planetNameKo ?? id).trim(),
    kind: 'synth',
  });
}

const pool = itemRows
  .filter((r) => String(r.tagsPipe ?? '').split('|').includes('galactic_mineral'))
  .map((r) => {
    let attrs = {};
    try {
      attrs = JSON.parse(String(r.attrsJson ?? '{}').replace(/""/g, '"'));
    } catch {
      attrs = {};
    }
    return {
      mineralId: String(attrs.poolMineralId || r.id).trim(),
      poolWeight: parseNum(attrs.poolWeight, 1),
    };
  })
  .filter((e) => e.mineralId);

let mixSum = pool.reduce((s, e) => s + Math.max(0, e.poolWeight), 0);
const mix = {};
for (const e of pool) {
  mix[e.mineralId] = mixSum > 0 ? Math.max(0, e.poolWeight) / mixSum : 1 / pool.length;
}

const planetToRegion = new Map();
for (const row of members) {
  const pid = String(row.planetId ?? '').trim();
  const rid = String(row.regionId ?? '').trim();
  if (pid && rid && !planetToRegion.has(pid)) planetToRegion.set(pid, rid);
}

const membersByRegion = new Map();
for (const row of members) {
  const pid = String(row.planetId ?? '').trim();
  const rid = String(row.regionId ?? '').trim();
  if (!pid || !rid || planetToRegion.get(pid) !== rid) continue;
  const arr = membersByRegion.get(rid) ?? [];
  arr.push(pid);
  membersByRegion.set(rid, arr);
}

const profiles = new Map();
for (const region of regions) {
  const share = Math.max(0, parseNum(region.clusterShareOfGalaxy, 0));
  const planetIds = membersByRegion.get(region.id) ?? [];
  const n = planetIds.length;
  if (n === 0) continue;
  for (const planetId of planetIds) {
    const shareOfGalaxyByMineral = {};
    for (const mineralId of Object.keys(mix)) {
      shareOfGalaxyByMineral[mineralId] = (share * (mix[mineralId] ?? 0)) / n;
    }
    profiles.set(planetId, { planetId, regionId: region.id, shareOfGalaxyByMineral });
  }
}

const zoneByPlanet = new Map();
for (const row of playZones) {
  zoneByPlanet.set(String(row.primaryPlanetId).trim(), clampZone(parseNum(row.zoneIndex, 1)));
}
for (const row of hostileRows) {
  const pid = String(row.planetId ?? '').trim();
  if (pid && !zoneByPlanet.has(pid)) {
    zoneByPlanet.set(pid, clampZone(parseNum(row.zoneIndex, 1)));
  }
}
for (const row of synthRows) {
  const pid = `${String(row.synthSystemId).trim()}_p`;
  if (!zoneByPlanet.has(pid)) zoneByPlanet.set(pid, clampZone(parseNum(row.zoneIndex, 1)));
}

function findZoneTier(zoneIndex) {
  const z = clampZone(zoneIndex);
  for (const row of zoneTierRows) {
    const min = parseNum(row.zoneIndexMin, 1);
    const max = parseNum(row.zoneIndexMax, 99);
    if (z >= min && z <= max) return row;
  }
  return zoneTierRows[0];
}

function listZoneAllowed(zoneIndex) {
  const row = findZoneTier(zoneIndex);
  return String(row?.allowedMineralIdsPipe ?? 'ore_ferrite')
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

function zonePrimary(zoneIndex) {
  const row = findZoneTier(zoneIndex);
  const p = String(row?.primaryMineralId ?? '').trim();
  const allowed = listZoneAllowed(zoneIndex);
  return p && allowed.includes(p) ? p : allowed[0] ?? 'ore_ferrite';
}

function mineableIds(planetId, zoneIndex) {
  const profile = profiles.get(planetId);
  if (!profile) return [];
  const allowed = new Set(listZoneAllowed(zoneIndex));
  const ranked = Object.entries(profile.shareOfGalaxyByMineral)
    .filter(([, s]) => Number.isFinite(s) && s > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .filter((id) => allowed.has(id));
  if (ranked.length > 0) return ranked;
  return [zonePrimary(zoneIndex)];
}

function pseudoRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function planetIdSeed(planetId) {
  let s = 0;
  for (let i = 0; i < planetId.length; i += 1) s += planetId.charCodeAt(i) * (i + 17);
  return s;
}

const planetCoreById = new Map();
const coreRe = /id: "([^"]+)",[\s\S]*?coreResource: (\d+),[\s\S]*?corePopulation: (\d+),[\s\S]*?coreDefense: (\d+),[\s\S]*?coreTechnology: (\d+),[\s\S]*?coreEnvironment: (\d+)/g;
let cm;
while ((cm = coreRe.exec(systemsTs)) !== null) {
  planetCoreById.set(cm[1], {
    coreResource: parseNum(cm[2], 50),
    corePopulation: parseNum(cm[3], 50),
    coreDefense: parseNum(cm[4], 50),
    coreTechnology: parseNum(cm[5], 50),
    coreEnvironment: parseNum(cm[6], 50),
  });
}

function orbitCount(planetId) {
  const profile = profiles.get(planetId);
  if (!profile) return 0;
  const core = planetCoreById.get(planetId) ?? {
    coreResource: 50,
    corePopulation: 50,
    coreDefense: 50,
    coreTechnology: 50,
    coreEnvironment: 50,
  };
  const score = (
    core.coreEnvironment * 0.45
    + core.coreResource * 0.35
    + core.coreTechnology * 0.15
    + core.coreDefense * 0.05
  ) / 100;
  const combined = score + pseudoRandom(planetIdSeed(planetId)) * 0.12;
  if (combined < 0.38) return 1;
  if (combined < 0.72) return 2;
  return 3;
}

function displayKindCap(zoneIndex) {
  const z = clampZone(zoneIndex);
  if (z <= 1) return 1;
  if (z <= 10) return 2;
  return 3;
}

function displayMineralPool(planetId, zoneIndex) {
  const pool = mineableIds(planetId, zoneIndex);
  const primary = zonePrimary(zoneIndex);
  if (pool.length <= 1) return [primary];
  const kinds = Math.min(3, pool.length, displayKindCap(zoneIndex));
  const ordered = [primary, ...pool.filter((id) => id !== primary)];
  const seed = planetIdSeed(planetId);
  const picked = [];
  const used = new Set();
  for (let i = 0; i < kinds; i += 1) {
    const start = Math.floor(pseudoRandom(seed + i * 41) * ordered.length);
    for (let j = 0; j < ordered.length; j += 1) {
      const id = ordered[(start + j) % ordered.length];
      if (used.has(id)) continue;
      used.add(id);
      picked.push(id);
      break;
    }
  }
  return picked.length > 0 ? picked : [primary];
}

function assignedMinerals(planetId, count, zoneIndex) {
  if (count <= 0) return [];
  const displayPool = displayMineralPool(planetId, zoneIndex);
  const seed = planetIdSeed(planetId);
  return Array.from({ length: count }, (_, slotIndex) => {
    const roll = pseudoRandom(seed + slotIndex * 97 + 13);
    const idx = Math.min(displayPool.length - 1, Math.floor(roll * displayPool.length));
    return displayPool[idx] ?? displayPool[0] ?? 'ore_ferrite';
  });
}

const MINERAL_KO = {
  ore_ferrite: '페라이트',
  ore_silicate: '실리케이트',
  ore_crystal: '에너지결정',
};

const allPlanetIds = [...new Set(members.map((r) => String(r.planetId ?? '').trim()).filter(Boolean))];
const rows = allPlanetIds.map((planetId) => {
  const meta = planetMeta.get(planetId) ?? {
    id: planetId,
    systemId: '—',
    name: planetId,
    kind: 'unknown',
  };
  const zone = zoneByPlanet.get(planetId) ?? 1;
  const profile = profiles.get(planetId);
  const orbits = orbitCount(planetId);
  const minerals = assignedMinerals(planetId, orbits, zone);
  const primary = zonePrimary(zone);
  return {
    planetId,
    name: meta.name,
    systemId: meta.systemId,
    kind: meta.kind,
    zone,
    region: profile?.regionId ?? '—',
    mineable: profile ? 'O' : 'X',
    orbits,
    primary,
    slotMinerals: minerals,
    allowed: listZoneAllowed(zone).join('|'),
  };
});

rows.sort((a, b) => a.zone - b.zone || a.planetId.localeCompare(b.planetId));

console.log('| Zone | 구분 | 행성ID | 행성명 | 성계 | 지역 | 궤도수 | 주력광물 | 슬롯1 | 슬롯2 | 슬롯3 | 슬롯4 | 슬롯5+ | 판매가(cr) |');
console.log('|---:|:---:|---|---|---|---|---:|---|:---:|:---:|:---:|:---:|:---:|---:|');
for (const r of rows) {
  const short = (id) => (id ? id.replace('ore_', '') : '—');
  const s = r.slotMinerals.map(short);
  const extra = s.length > 5 ? s.slice(5).join('/') : '—';
  const primaryKo = MINERAL_KO[r.primary] ?? r.primary;
  const kind = r.kind === 'scenario' ? '시나리오' : r.kind === 'synth' ? '합성' : '?';
  console.log(
    `| ${r.zone} | ${kind} | ${r.planetId} | ${r.name} | ${r.systemId} | ${r.region.replace('region_', '')} | ${r.orbits} | ${primaryKo} | ${short(s[0])} | ${short(s[1])} | ${short(s[2])} | ${short(s[3])} | ${extra} | 100 |`,
  );
}

const mineableCount = rows.filter((r) => r.mineable === 'O').length;
console.log(`\n총 ${rows.length}행성 · 채굴 가능 ${mineableCount} · 매장 없음 ${rows.length - mineableCount}`);
