import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function split(line) {
  const o = [];
  let c = '';
  let q = false;
  for (const ch of line) {
    if (ch === '"') {
      q = !q;
      continue;
    }
    if (ch === ',' && !q) {
      o.push(c);
      c = '';
      continue;
    }
    c += ch;
  }
  o.push(c);
  return o;
}

const raw = fs.readFileSync(path.join(root, 'tables/content/npc_ai_captains.csv'), 'utf8');
const lines = raw.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.length);
const h = split(lines[0]);
const idx = Object.fromEntries(h.map((k, i) => [k, i]));
const done = new Set(
  fs
    .readdirSync(path.join(root, 'assets/images/npc'))
    .filter((f) => f.startsWith('npc_cpt_') && f.endsWith('.png'))
    .map((f) => f.replace(/\.png$/, '')),
);
done.add('npc_cpt_operator_stella');

const rows = [];
for (const line of lines.slice(1)) {
  const cols = split(line);
  const id = cols[idx.id];
  if (!id) continue;
  if (done.has(id)) continue;
  const key = cols[idx.portraitImageAssetKey] || '';
  if (key.includes(`${id}.png`)) continue;
  rows.push({
    id,
    name: cols[idx.displayName],
    en: cols[idx.displayNameEn],
    rank: cols[idx.rank],
    faction: cols[idx.factionId],
    profile: cols[idx.profileKo] || '',
  });
}

const out = path.join(root, 'tools/content-tables/_portrait-remaining.json');
fs.writeFileSync(out, JSON.stringify(rows, null, 2));
console.log(`remaining=${rows.length}`);
console.log(rows.map((r) => r.id).join('\n'));
