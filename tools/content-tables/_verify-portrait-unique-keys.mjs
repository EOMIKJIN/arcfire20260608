import fs from 'node:fs';

const t = fs.readFileSync('tables/content/npc_ai_captains.csv', 'utf8');
const lines = t.split(/\r?\n/).filter((l) => l && !l.startsWith('id,'));
const keys = new Map();
const dups = [];
for (const line of lines) {
  const m = line.match(/assets\/images\/npc\/[^,"]+/);
  if (!m) continue;
  const k = m[0];
  if (keys.has(k)) dups.push(`${k} <- ${line.slice(0, 48)}`);
  else keys.set(k, 1);
}
console.log(`rows_with_key=${keys.size} dups=${dups.length}`);
if (dups.length) console.log(dups.join('\n'));
process.exit(dups.length ? 1 : 0);
