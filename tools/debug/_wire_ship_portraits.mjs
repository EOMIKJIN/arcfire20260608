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

const csvPath = 'tables/content/npc_ai_ships.csv';
const genPath = 'src/data/generated/csvNpcCapitalShips.ts';
const mapPath = 'src/game/npcCapitalShipPortraitAssets.ts';
const raw = fs.readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
const lines = raw.split(/\r?\n/);
const header = splitCsvLine(lines[0]);
const idIdx = header.indexOf('id');
const keyIdx = header.indexOf('portraitImageAssetKey');
let csvChanged = 0;
const keys = new Set([
  'assets/images/ship/ship_001.png',
  'assets/images/ship/npc_test_ship_001.png',
]);
for (let i = 1; i < lines.length; i += 1) {
  if (!lines[i]) continue;
  const cols = splitCsvLine(lines[i]);
  const id = cols[idIdx];
  if (!id) continue;
  const file = `assets/images/ship/${id}.png`;
  if (!fs.existsSync(file)) {
    if (cols[keyIdx]) keys.add(cols[keyIdx]);
    continue;
  }
  const oldKey = cols[keyIdx];
  if (oldKey && oldKey !== file && lines[i].includes(oldKey)) {
    lines[i] = lines[i].replace(oldKey, file);
    csvChanged += 1;
  }
  keys.add(file);
}
fs.writeFileSync(csvPath, lines.join('\n'), 'utf8');

let gen = fs.readFileSync(genPath, 'utf8');
let genChanged = 0;
for (const key of keys) {
  const id = path.basename(key, '.png');
  if (id === 'ship_001' || id === 'npc_test_ship_001') continue;
  const re = new RegExp(`(id: "${id}"[\\s\\S]*?portraitImageAssetKey: )"[^"]+"`);
  if (!re.test(gen)) continue;
  const next = gen.replace(re, `$1"${key}"`);
  if (next !== gen) {
    gen = next;
    genChanged += 1;
  }
}
fs.writeFileSync(genPath, gen, 'utf8');

const sorted = [...keys].sort();
const entries = sorted
  .map((k) => `  '${k}': require('../../${k}'),`)
  .join('\n');
const map = `// ============================================================
// 전함 테이블 portraitImageAssetKey → Metro 정적 require
// 새 이미지 추가 시: assets 복사 + 아래 맵에 동일 키 문자열로 등록
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
console.log('csvChanged', csvChanged, 'genChanged', genChanged, 'map', sorted.length);
