'use strict';

const fs = require('fs');
const path = require('path');

function parseCsv(text) {
  const rows = [];
  let field = '';
  let row = [];
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
          continue;
        }
        inQ = false;
        continue;
      }
      field += c;
      continue;
    }
    if (c === '"') {
      inQ = true;
      continue;
    }
    if (c === ',') {
      row.push(field);
      field = '';
      continue;
    }
    if (c === '\r') continue;
    if (c === '\n') {
      row.push(field);
      rows.push(row);
      field = '';
      row = [];
      continue;
    }
    field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const root = path.resolve(__dirname, '../..');
const att = parseCsv(fs.readFileSync(path.join(root, 'tables/content/bar_attendants.csv'), 'utf8'));
const turns = parseCsv(fs.readFileSync(path.join(root, 'tables/content/bar_dialog_turns.csv'), 'utf8'));

const helloBySet = new Map();
for (const r of turns.slice(1)) {
  if (!r || r.length < 9) continue;
  if (r[4] === 'attendant_hello' && String(r[2]) === '1') {
    helloBySet.set(r[1], { ko: r[8], en: r[9], turnId: r[0] });
  }
}

const byName = new Map();
const roster = [];
let enabled = 0;
const missing = [];

for (const r of att.slice(1)) {
  if (!r || r.length < 13) continue;
  if (String(r[12]).trim() !== '1') continue;
  enabled += 1;
  const id = r[0];
  const planetId = r[1];
  const nameKo = r[2];
  const nameEn = r[3];
  const setId = r[9];
  const hello = helloBySet.get(setId);
  if (!hello) missing.push(`${id} ${nameKo} ${setId}`);
  const lineKo = hello ? hello.ko : '(대사 없음)';
  const lineEn = hello ? hello.en : '';
  roster.push({ id, planetId, nameKo, nameEn, setId, lineKo, lineEn, turnId: hello?.turnId ?? '' });
  const rec = byName.get(nameKo) || { nameEn, sets: new Set(), lines: new Set(), n: 0 };
  rec.sets.add(setId);
  rec.lines.add(lineKo);
  rec.n += 1;
  byName.set(nameKo, rec);
}

const uniqueRows = [];
for (const [nameKo, rec] of byName) {
  uniqueRows.push({
    nameKo,
    nameEn: rec.nameEn,
    n: rec.n,
    sets: [...rec.sets].join(', '),
    lineKo: [...rec.lines].join(' / '),
  });
}
uniqueRows.sort((a, b) => a.nameKo.localeCompare(b.nameKo, 'ko'));

console.log(JSON.stringify({
  enabled,
  uniqueNames: uniqueRows.length,
  helloSets: [...helloBySet.keys()],
  missing,
  multi: uniqueRows.filter((r) => r.lineKo.includes(' / ') || r.sets.includes(',')),
  uniqueRows,
}, null, 2));
