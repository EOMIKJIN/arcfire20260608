import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const csvPath = resolve(ROOT, 'tables/content/npc_ai_captains.csv');

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
      if (row.some((c) => c !== '')) rows.push(row);
      row = [];
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field.length || row.length) {
    row.push(field);
    if (row.some((c) => c !== '')) rows.push(row);
  }
  return rows;
}

const F_RE = /여성|여자|그녀|여인/;
const M_RE = /남성|남자(?!를)|그\s*는|그\s*의\s*(얼굴|손|원칙|습관|부대|함대|명령|기록|보고서)/;
const ENTITY_RE = /개체|파견 개체|고대 감시|하이브리드|무성|중성/;

const rows = parseCsv(readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, ''));
const header = rows[0];
const iId = header.indexOf('id');
const iName = header.indexOf('displayName');
const iEn = header.indexOf('displayNameEn');
const iProfile = header.indexOf('profileKo');

const out = [];
for (const r of rows.slice(1)) {
  const id = r[iId];
  const profile = r[iProfile] || '';
  const f = F_RE.test(profile);
  const m = M_RE.test(profile);
  const entity = ENTITY_RE.test(profile);
  let expected = 'androgynous';
  let why = 'no explicit gender in profileKo';
  if (f && m) {
    expected = 'androgynous';
    why = 'both female and male markers — treat androgynous';
  } else if (f) {
    expected = 'female';
    why = (profile.match(F_RE) || [])[0] || 'female marker';
  } else if (m) {
    expected = 'male';
    why = (profile.match(M_RE) || [])[0] || 'male marker';
  } else if (entity) {
    expected = 'androgynous';
    why = 'entity/ancient — androgynous';
  }
  out.push({
    id,
    name: r[iName],
    en: r[iEn],
    expected,
    why,
    profile: profile.slice(0, 180),
    file: `d:/arcfire20260607/assets/images/npc/${id}.png`,
  });
}

const counts = { female: 0, male: 0, androgynous: 0 };
for (const x of out) counts[x.expected] += 1;
const dest = resolve(ROOT, 'tools/content-tables/_captain-gender-expected.json');
writeFileSync(dest, JSON.stringify({ counts, n: out.length, rows: out }, null, 2));
console.log(JSON.stringify(counts));
console.log('androgynous_ids=' + out.filter((x) => x.expected === 'androgynous').map((x) => x.id).join(','));
