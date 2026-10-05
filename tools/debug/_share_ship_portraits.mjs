import fs from 'node:fs';
import path from 'node:path';

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQ = !inQ;
      continue;
    }
    if (ch === ',' && !inQ) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

function trailingNumber(name) {
  const m = String(name).match(/(\d+)\s*$/u);
  return m ? Number(m[1]) : null;
}

function baseName(name) {
  return String(name).replace(/\s*\d+\s*$/u, '').replace(/\s+/g, ' ').trim();
}

function pickRep(list) {
  const sorted = [...list].sort((a, b) => a.n - b.n || a.id.localeCompare(b.id));
  const one = sorted.find((r) => r.n === 1);
  return (one ?? sorted[0]).id;
}

const csvPath = 'tables/content/npc_ai_ships.csv';
const genPath = 'src/data/generated/csvNpcCapitalShips.ts';
const mapPath = 'src/game/npcCapitalShipPortraitAssets.ts';
const shipDir = 'assets/images/ship';

const raw = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
const lines = raw.split(/\r?\n/);
const header = splitCsvLine(lines[0]);
const idIdx = header.indexOf('id');
const nameIdx = header.indexOf('name');
const keyIdx = header.indexOf('portraitImageAssetKey');

const rows = [];
for (let i = 1; i < lines.length; i += 1) {
  if (!lines[i]) continue;
  const cols = splitCsvLine(lines[i]);
  const id = cols[idIdx];
  if (!id) continue;
  rows.push({ i, id, name: cols[nameIdx], n: trailingNumber(cols[nameIdx]) });
}

const repById = new Map();

const byBase = new Map();
for (const r of rows) {
  if (r.n == null) continue;
  const b = baseName(r.name);
  if (!byBase.has(b)) byBase.set(b, []);
  byBase.get(b).push(r);
}
for (const [b, list] of byBase) {
  if (list.length < 2) continue;
  const rep = pickRep(list);
  for (const r of list) repById.set(r.id, { rep, group: b });
}

const waves = rows.filter((r) => /^npc_wave_invader_t\d+$/.test(r.id));
if (waves.length > 1) {
  for (const r of waves) repById.set(r.id, { rep: 'npc_wave_invader_t1', group: '웨이브 적함' });
}

const enemy = new Map();
for (const r of rows) {
  const m = r.id.match(/^npc_enemy_([a-z]+)_(\d+)$/);
  if (!m) continue;
  const n = Number(m[2]);
  if (!enemy.has(m[1])) enemy.set(m[1], []);
  enemy.get(m[1]).push({ ...r, n });
}
for (const [stem, list] of enemy) {
  if (list.length < 2) continue;
  const rep = pickRep(list);
  for (const r of list) repById.set(r.id, { rep, group: `적함 ${stem}` });
}

const missingReps = new Set();
for (const share of repById.values()) {
  if (!fs.existsSync(path.join(shipDir, `${share.rep}.png`))) missingReps.add(share.rep);
}
if (missingReps.size > 0) {
  console.error('missing representatives', [...missingReps].join(', '));
  process.exit(1);
}

let gen = fs.readFileSync(genPath, 'utf8');
let csvChanged = 0;
let genChanged = 0;
const deleted = [];
const kept = new Set();
const groups = new Map();

for (const r of rows) {
  const share = repById.get(r.id);
  if (!share) {
    const cols = splitCsvLine(lines[r.i]);
    if (cols[keyIdx]) kept.add(cols[keyIdx]);
    continue;
  }
  const repId = share.rep;
  const repKey = `assets/images/ship/${repId}.png`;
  const own = `assets/images/ship/${r.id}.png`;
  if (!fs.existsSync(path.join(shipDir, `${repId}.png`))) {
    throw new Error(`representative missing: ${repId}`);
  }
  if (share && lines[r.i].includes(own) && own !== repKey) {
    lines[r.i] = lines[r.i].replace(own, repKey);
    csvChanged += 1;
  }
  if (share && own !== repKey) {
    const re = new RegExp(`(id: "${r.id}"[\\s\\S]*?portraitImageAssetKey: )"[^"]+"`);
    const next = gen.replace(re, `$1"${repKey}"`);
    if (next !== gen) {
      gen = next;
      genChanged += 1;
    }
    const abs = path.join(shipDir, `${r.id}.png`);
    if (fs.existsSync(abs)) {
      fs.unlinkSync(abs);
      deleted.push(r.id);
    }
  }
  kept.add(repKey);
  if (share) {
    if (!groups.has(share.group)) groups.set(share.group, { rep: repId, n: 0 });
    groups.get(share.group).n += 1;
  }
}

fs.writeFileSync(csvPath, lines.join('\n'), 'utf8');
fs.writeFileSync(genPath, gen, 'utf8');

const sorted = [...kept].sort();
const entries = sorted.map((k) => `  '${k}': require('../../${k}'),`).join('\n');
const map = `// ============================================================
// 전함 테이블 portraitImageAssetKey → Metro 정적 require
// 번호만 다른 수송선단·적함·AI 전함은 01(또는 가장 낮은 번호) 초상을 공유한다.
// 감사: npm run audit:npc-capital-ship-portraits
// 이어하기 프리페치는 기존 2장만. 나머지 초상은 조선소·구매창에서 온디맨드.
// ============================================================

import type { ImageSourcePropType } from 'react-native';

const PORTRAIT_BY_ASSET_KEY: Record<string, ImageSourcePropType> = {
${entries}
};

const CRITICAL_PREFETCH_KEYS = [
  'assets/images/ship/ship_001.png',
  'assets/images/ship/npc_test_ship_001.png',
] as const;

export function resolveNpcCapitalShipPortraitSource(
  key: string | undefined | null,
): ImageSourcePropType | null {
  if (key == null) return null;
  const k = String(key).trim();
  if (!k) return null;
  return PORTRAIT_BY_ASSET_KEY[k] ?? null;
}

/** 이어하기 로딩에서 디코드할 전함 초상. 카탈로그 전수는 넣지 않는다. */
export function listNpcCapitalPortraitSources(): ImageSourcePropType[] {
  const out: ImageSourcePropType[] = [];
  for (let i = 0; i < CRITICAL_PREFETCH_KEYS.length; i += 1) {
    const src = PORTRAIT_BY_ASSET_KEY[CRITICAL_PREFETCH_KEYS[i]];
    if (src) out.push(src);
  }
  return out;
}
`;
fs.writeFileSync(mapPath, map, 'utf8');

console.log('groups', groups.size, 'csv', csvChanged, 'gen', genChanged, 'deleted', deleted.length, 'keptKeys', sorted.length);
for (const [name, info] of groups) console.log(`  ${info.n} → ${info.rep} | ${name}`);
