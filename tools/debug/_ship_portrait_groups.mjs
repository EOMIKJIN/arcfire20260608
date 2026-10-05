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
const nameIdx = header.indexOf('name');
const rows = [];
for (let i = 1; i < lines.length; i += 1) {
  const c = splitCsvLine(lines[i]);
  rows.push({ id: c[idIdx], name: c[nameIdx] });
}

function baseName(name) {
  return name
    .replace(/\s*\d+\s*$/u, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const groups = new Map();
for (const r of rows) {
  const b = baseName(r.name);
  if (!groups.has(b)) groups.set(b, []);
  groups.get(b).push(r);
}
const multi = [...groups.entries()].filter(([, list]) => list.length > 1);
console.log('multi_groups', multi.length);
for (const [b, list] of multi) {
  console.log(`\n[${list.length}] ${b}`);
  for (const r of list) console.log(`  ${r.id} | ${r.name}`);
}
