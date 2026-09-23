#!/usr/bin/env node
/**
 * tables/ CSV 로케일 컬럼·충전율 스캔 (조사 전용).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else q = !q;
    } else if (c === ',' && !q) {
      out.push(cur);
      cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function walk(dir, acc) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, acc);
    else if (name.endsWith('.csv')) acc.push(full);
  }
  return acc;
}

function isEnCol(h) {
  return (
    /_en$/i.test(h) ||
    /En$/.test(h) ||
    /^영문명$/.test(h) ||
    /^textEn$/.test(h) ||
    /^name_en$/.test(h)
  );
}

function isLikelyTextCol(h) {
  if (isEnCol(h)) return false;
  return /^(name|title|description|desc|label|text|displayName|rank|bio|summary|personality|governorTitle|systemName|systemDescription|godName|notes|특징설명|이름|등급라벨|무기분류|효과설명|effectDescription|bioShort|labelKo|nameKo|textKo|descriptionKo)$/i.test(
    h,
  ) || /(Ko|Name|Title|Description|Label|Text|Rank|Bio)$/.test(h);
}

const files = walk(path.join(ROOT, 'tables'), []).filter(
  (f) => !f.replace(/\\/g, '/').includes('/_audit/'),
);

const rows = [];
for (const full of files) {
  const rel = path.relative(ROOT, full).replace(/\\/g, '/');
  const raw = fs.readFileSync(full, 'utf8').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter((l, i, a) => !(i === a.length - 1 && l === ''));
  if (!lines.length) continue;
  const headers = parseCsvLine(lines[0]).map((h) => h.trim());
  const data = lines.slice(1).filter((l) => l.trim() && !l.startsWith('#'));
  const enCols = headers.filter(isEnCol);
  const textCols = headers.filter(isLikelyTextCol);
  const fill = {};
  for (const col of enCols) {
    const idx = headers.indexOf(col);
    let filled = 0;
    for (const line of data) {
      const cells = parseCsvLine(line);
      if (String(cells[idx] ?? '').trim()) filled += 1;
    }
    fill[col] = {
      filled,
      total: data.length,
      pct: data.length ? Math.round((filled * 1000) / data.length) / 10 : 0,
    };
  }
  rows.push({
    rel,
    dataRows: data.length,
    enCols,
    textCols,
    fill,
  });
}

rows.sort((a, b) => b.dataRows - a.dataRows);
const withEn = rows.filter((r) => r.enCols.length);
const textNoEn = rows.filter((r) => !r.enCols.length && r.textCols.length);
const numeric = rows.filter((r) => !r.enCols.length && !r.textCols.length);

const out = {
  csvFiles: rows.length,
  totalDataRows: rows.reduce((s, r) => s + r.dataRows, 0),
  filesWithEnCols: withEn.length,
  filesTextNoEn: textNoEn.length,
  filesNumeric: numeric.length,
  withEn: withEn.map((r) => ({
    rel: r.rel,
    rows: r.dataRows,
    enCols: r.enCols,
    fill: r.fill,
  })),
  textNoEn: textNoEn.map((r) => ({
    rel: r.rel,
    rows: r.dataRows,
    textCols: r.textCols,
  })),
};

process.stdout.write(JSON.stringify(out, null, 2));
