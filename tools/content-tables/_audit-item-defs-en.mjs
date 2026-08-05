/**
 * item_defs.csv — name_en / description_en 전수 감사 (무역소·tradeable 중심)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, '../../tables/content/item_defs.csv');
const hangul = /[\uAC00-\uD7A3]/;

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function badEn(en, ko) {
  const e = String(en ?? '').trim();
  const k = String(ko ?? '').trim();
  if (!e) return 'EMPTY';
  if (hangul.test(e)) return 'HAS_HANGUL';
  if (e === k) return 'SAME_AS_KO';
  if (/^(TODO|TBD|xxx|n\/a)$/i.test(e)) return 'PLACEHOLDER';
  return null;
}

const raw = fs.readFileSync(CSV_PATH, 'utf8');
const lines = raw.split(/\r?\n/).filter((l, i, arr) => i < arr.length - 1 || l.trim());
const header = parseCsvLine(lines[0]).map((h) => String(h).replace(/^\uFEFF/, '').trim());
const ix = Object.fromEntries(header.map((h, i) => [h, i]));
const featKey = header.includes('특징설명') ? '특징설명' : 'featureDescription';

const rows = [];
for (let li = 1; li < lines.length; li++) {
  const cols = parseCsvLine(lines[li]);
  if (!cols[ix.id]?.trim()) continue;
  const get = (k) => String(cols[ix[k]] ?? '').trim();
  const name = get('name');
  const name_en = get('name_en');
  const description = get('description');
  const description_en = get('description_en');
  const feature = get(featKey);
  const feature_en = get('featureDescription_en');
  rows.push({
    id: get('id'),
    name,
    name_en,
    description,
    description_en,
    feature,
    feature_en,
    tradeable: get('tradeable') === 'true',
    sellable: get('sellable') === 'true',
    kind: get('kind'),
    type: get('type'),
    category: get('category'),
    badName: badEn(name_en, name),
    badDesc: badEn(description_en, description),
    badFeat: badEn(feature_en, feature),
  });
}

const tradeable = rows.filter((r) => r.tradeable);
const badTradeName = tradeable.filter((r) => r.badName);
const badAllName = rows.filter((r) => r.badName);
const byPrefix = {};
for (const r of badTradeName) {
  const p = r.id.includes('_') ? r.id.split('_')[0] : r.id;
  byPrefix[p] = (byPrefix[p] || 0) + 1;
}
const kindBad = {};
for (const r of badTradeName) {
  kindBad[r.kind || '?'] = (kindBad[r.kind || '?'] || 0) + 1;
}

console.log(
  JSON.stringify(
    {
      total: rows.length,
      tradeable: tradeable.length,
      sellable: rows.filter((r) => r.sellable).length,
      badNameAll: badAllName.length,
      badNameTradeable: badTradeName.length,
      badNameReasons: badAllName.reduce((a, r) => {
        a[r.badName] = (a[r.badName] || 0) + 1;
        return a;
      }, {}),
      badTradeReasons: badTradeName.reduce((a, r) => {
        a[r.badName] = (a[r.badName] || 0) + 1;
        return a;
      }, {}),
      badTradeByKind: kindBad,
      badTradeByPrefix: byPrefix,
      sample: badTradeName.slice(0, 40).map((r) => ({
        id: r.id,
        name: r.name,
        name_en: r.name_en,
        bad: r.badName,
        kind: r.kind,
        type: r.type,
      })),
      nonTradeBadSample: badAllName
        .filter((r) => !r.tradeable)
        .slice(0, 20)
        .map((r) => ({ id: r.id, name: r.name, en: r.name_en, bad: r.badName })),
    },
    null,
    2,
  ),
);
