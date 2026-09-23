import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Use generated JSON-like TS via dynamic import after register
const { GALAXY_SYSTEMS, GAMEPLAY_SYSTEM_IDS, LEGACY_VISIBLE_TOTAL_SYSTEMS, parseSynthOrdinal, isExpansionGatewayOrdinal } =
  await import('../../src/data/galaxy100.ts');

const all = Object.values(GALAXY_SYSTEMS);
const legacyCount = Math.max(0, LEGACY_VISIBLE_TOTAL_SYSTEMS - GAMEPLAY_SYSTEM_IDS.size);

function kind(s) {
  if (GAMEPLAY_SYSTEM_IDS.has(s.id)) return 'core21';
  const ord = parseSynthOrdinal(s.id);
  if (ord == null) return 'other';
  if (ord <= legacyCount) return 'legacy_unexplored';
  if (isExpansionGatewayOrdinal(ord, legacyCount)) return 'gateway';
  return 'undiscovered';
}

const xs = all.map((s) => s.position.x);
const ys = all.map((s) => s.position.y);
const minX = Math.min(...xs);
const maxX = Math.max(...xs);
const minY = Math.min(...ys);
const maxY = Math.max(...ys);

function stats(list) {
  if (!list.length) return null;
  const x = list.map((s) => s.position.x);
  const y = list.map((s) => s.position.y);
  return {
    n: list.length,
    minX: +Math.min(...x).toFixed(3),
    maxX: +Math.max(...x).toFixed(3),
    minY: +Math.min(...y).toFixed(3),
    maxY: +Math.max(...y).toFixed(3),
    cx: +(x.reduce((a, b) => a + b, 0) / x.length).toFixed(3),
    cy: +(y.reduce((a, b) => a + b, 0) / y.length).toFixed(3),
  };
}

const groups = { core21: [], legacy_unexplored: [], gateway: [], undiscovered: [] };
for (const s of all) groups[kind(s)].push(s);
const visible = [...groups.core21, ...groups.legacy_unexplored, ...groups.gateway];

const vx = visible.map((s) => s.position.x);
const vy = visible.map((s) => s.position.y);
const vMinX = Math.min(...vx);
const vMaxX = Math.max(...vx);
const vMinY = Math.min(...vy);
const vMaxY = Math.max(...vy);
const vW = vMaxX - vMinX;
const vH = vMaxY - vMinY;
const vCx = (vMinX + vMaxX) / 2;
const vCy = (vMinY + vMaxY) / 2;
const halfW = vW / 2;
const halfH = vH / 2;

function cell9Equal(x, y) {
  const nx = (x - minX) / (maxX - minX + 1e-9);
  const ny = (y - minY) / (maxY - minY + 1e-9);
  const col = Math.min(2, Math.max(0, Math.floor(nx * 3)));
  const row = Math.min(2, Math.max(0, Math.floor(ny * 3)));
  return row * 3 + col + 1;
}

function cell9Centered(x, y) {
  const col = x < vCx - halfW ? 0 : x > vCx + halfW ? 2 : 1;
  const row = y < vCy - halfH ? 0 : y > vCy + halfH ? 2 : 1;
  return row * 3 + col + 1;
}

function tally(fn) {
  const t = {};
  for (let z = 1; z <= 9; z++) t[z] = { all: 0, vis: 0, core: 0, legacy: 0, gw: 0, und: 0 };
  for (const s of all) {
    const z = fn(s.position.x, s.position.y);
    const k = kind(s);
    t[z].all += 1;
    if (k === 'core21') t[z].core += 1;
    if (k === 'legacy_unexplored') t[z].legacy += 1;
    if (k === 'gateway') t[z].gw += 1;
    if (k === 'undiscovered') t[z].und += 1;
    if (k !== 'undiscovered') t[z].vis += 1;
  }
  return t;
}

const c4 = { NW: 0, NE: 0, SW: 0, SE: 0 };
const c4v = { NW: 0, NE: 0, SW: 0, SE: 0 };
const c4u = { NW: 0, NE: 0, SW: 0, SE: 0 };
for (const s of all) {
  const z =
    s.position.y < vCy
      ? s.position.x < vCx
        ? 'NW'
        : 'NE'
      : s.position.x < vCx
        ? 'SW'
        : 'SE';
  c4[z] += 1;
  if (kind(s) !== 'undiscovered') c4v[z] += 1;
  else c4u[z] += 1;
}

const gws = groups.gateway.map((s) => ({
  id: s.id,
  x: +s.position.x.toFixed(3),
  y: +s.position.y.toFixed(3),
  z9eq: cell9Equal(s.position.x, s.position.y),
  z9c: cell9Centered(s.position.x, s.position.y),
  toCenter: s.connections.filter((id) => {
    const t = GALAXY_SYSTEMS[id];
    if (!t) return false;
    const k = kind(t);
    return k === 'core21' || k === 'legacy_unexplored';
  }).length,
  degree: s.connections.length,
}));

let crossEq = 0;
const byOuterEq = {};
const samplesEq = [];
for (const s of all) {
  const z0 = cell9Equal(s.position.x, s.position.y);
  if (z0 !== 5) continue;
  for (const cid of s.connections) {
    const t = GALAXY_SYSTEMS[cid];
    if (!t) continue;
    const z1 = cell9Equal(t.position.x, t.position.y);
    if (z1 === 5) continue;
    crossEq += 1;
    byOuterEq[z1] = (byOuterEq[z1] || 0) + 1;
    if (samplesEq.length < 30) {
      samplesEq.push({ from: s.id, to: cid, toZone: z1, toKind: kind(t) });
    }
  }
}

const out = {
  total: all.length,
  bboxAll: {
    minX: +minX.toFixed(3),
    maxX: +maxX.toFixed(3),
    minY: +minY.toFixed(3),
    maxY: +maxY.toFixed(3),
    w: +(maxX - minX).toFixed(3),
    h: +(maxY - minY).toFixed(3),
  },
  groups: {
    core21: stats(groups.core21),
    legacy: stats(groups.legacy_unexplored),
    gateway: stats(groups.gateway),
    undiscovered: stats(groups.undiscovered),
    visibleNow: stats(visible),
  },
  visibleBBox: {
    minX: +vMinX.toFixed(3),
    maxX: +vMaxX.toFixed(3),
    minY: +vMinY.toFixed(3),
    maxY: +vMaxY.toFixed(3),
    w: +vW.toFixed(3),
    h: +vH.toFixed(3),
    cx: +vCx.toFixed(3),
    cy: +vCy.toFixed(3),
  },
  grid9_equalFullBBox: tally(cell9Equal),
  grid9_centerIsVisibleBBox: tally(cell9Centered),
  grid4_atVisibleCenter: { all: c4, vis: c4v, und: c4u },
  gatewayCount: gws.length,
  gateways: gws,
  edgesFromZone5EqualToOuter: { count: crossEq, byZone: byOuterEq, samples: samplesEq },
};

console.log(JSON.stringify(out, null, 2));
