import fs from 'node:fs';

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

const raw = fs.readFileSync('tables/content/npc_ai_ships.csv', 'utf8').replace(/^\uFEFF/, '');
const lines = raw.split(/\r?\n/).filter(Boolean);
const header = splitCsvLine(lines[0]);
const idIdx = header.indexOf('id');
const keyIdx = header.indexOf('portraitImageAssetKey');
const nameIdx = header.indexOf('name');
const shared = new Set([
  'assets/images/ship/ship_001.png',
  'assets/images/ship/npc_test_ship_001.png',
]);
for (let i = 1; i < lines.length; i += 1) {
  const cols = splitCsvLine(lines[i]);
  const id = cols[idIdx];
  const key = cols[keyIdx];
  const own = `assets/images/ship/${id}.png`;
  if (shared.has(key) || !fs.existsSync(own)) {
    console.log([id, cols[nameIdx], key, fs.existsSync(own) ? 'png' : 'missing'].join('\t'));
  }
}
