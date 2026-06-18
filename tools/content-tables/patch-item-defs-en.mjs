/**
 * item_defs.csv에 name_en / description_en / featureDescription_en 컬럼을 주입한다.
 * 이미 값이 있으면 건너뜀. build:content-tables 전 1회성·멱등.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, '../../tables/content/item_defs.csv');

/** id → [nameEn, descriptionEn, featureDescriptionEn] */
const EN_BY_ID = {
  food: ['Food Pack', 'Compressed preserved rations. Sells anywhere.', 'Compressed preserved rations. Sells anywhere.'],
  minerals: ['Raw Minerals', 'Mined ore. Sells for high prices at refineries.', 'Mined ore. Sells for high prices at refineries.'],
  ore_mineral_1: ['Mineral Ore 1', 'Ore harvested from orbital mining.', 'Ore harvested from orbital mining.'],
  tech: ['Tech Components', 'Precision electronics. High demand on tech worlds.', 'Precision electronics. High demand on tech worlds.'],
  luxury: ['Luxury Goods', 'Rare items. Sell for premium prices on wealthy worlds.', 'Rare items. Sell for premium prices on wealthy worlds.'],
  weapon: ['Weapons', 'Small arms and ammo. High demand in conflict zones.', 'Small arms and ammo. High demand in conflict zones.'],
  contraband: ['Contraband', 'Illegal goods. Risky if caught, but highly profitable.', 'Illegal goods. Risky if caught, but highly profitable.'],
  ore_ferrite: ['Ferrite Ore', 'Basic ore for smelting and hull frames.', 'Basic ore for smelting and hull frames.'],
  ore_silicate: ['Silicate Ore', 'Raw material for glass and electronics.', 'Raw material for glass and electronics.'],
  ore_crystal: ['Energy Crystal', 'High-output components and weapons (rare).', 'High-output components and weapons (rare).'],
  ore_carbon: ['Carbon Ore', 'Carbon nano and composite material source.', 'Carbon nano and composite material source.'],
  ore_nickel: ['Nickel Ore', 'Base material for alloys and heat-resistant parts.', 'Base material for alloys and heat-resistant parts.'],
  ore_titanium: ['Titanium Ore', 'Lightweight hull and armor material.', 'Lightweight hull and armor material.'],
  ore_platinum: ['Platinum Ore', 'Advanced electronics and catalyst source.', 'Advanced electronics and catalyst source.'],
  ore_orichalcum: ['Orichalcum Ore', 'Rare alloy and endgame component ore.', 'Rare alloy and endgame component ore.'],
  ore_neutronium: ['Neutronium Ore', 'Extreme-density structural material.', 'Extreme-density structural material.'],
  ore_voidstone: ['Voidstone', 'Special energy crystal from late-zone sectors.', 'Special energy crystal from late-zone sectors.'],
};

const OWNERSHIP_EN_SUFFIX = ' / Ownership';
const OWNERSHIP_DESC_EN =
  'Planet ownership deed (non-resale). Purchasing assigns your clan to hold this planet.';

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

function escapeCsv(v) {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function main() {
  const raw = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l, i, arr) => i < arr.length - 1 || l.trim());
  if (lines.length < 2) throw new Error('item_defs.csv empty');

  const header = parseCsvLine(lines[0]).map((h) => String(h).replace(/^\uFEFF/, '').trim());
  const idIdx = header.indexOf('id');
  const nameIdx = header.indexOf('name');
  const descIdx = header.indexOf('description');
  const featIdx = header.findIndex((h) => h === '특징설명' || h === 'featureDescription');

  let nameEnIdx = header.indexOf('name_en');
  let descEnIdx = header.indexOf('description_en');
  let featEnIdx = header.indexOf('featureDescription_en');

  const newHeader = [...header];
  if (nameEnIdx < 0) {
    nameEnIdx = newHeader.length;
    newHeader.push('name_en');
  }
  if (descEnIdx < 0) {
    descEnIdx = newHeader.length;
    newHeader.push('description_en');
  }
  if (featEnIdx < 0) {
    featEnIdx = newHeader.length;
    newHeader.push('featureDescription_en');
  }

  const outLines = [newHeader.map(escapeCsv).join(',')];

  for (let li = 1; li < lines.length; li++) {
    const cols = parseCsvLine(lines[li]);
    if (!cols[idIdx]?.trim()) continue;
    while (cols.length < newHeader.length) cols.push('');

    const id = cols[idIdx].trim();
    const koName = cols[nameIdx] ?? '';
    const koDesc = cols[descIdx] ?? '';
    const koFeat = featIdx >= 0 ? cols[featIdx] ?? '' : koDesc;

    let enTriple = EN_BY_ID[id];
    if (!enTriple && id.startsWith('ownership_')) {
      const planetLabel = koName.replace(/\/소유권$/, '').trim();
      enTriple = [
        `${planetLabel}${OWNERSHIP_EN_SUFFIX}`,
        OWNERSHIP_DESC_EN,
        OWNERSHIP_DESC_EN,
      ];
    }
    if (!enTriple && id.startsWith('tg_')) {
      enTriple = [koName, koDesc, koFeat];
    }

    if (enTriple) {
      if (!cols[nameEnIdx]?.trim()) cols[nameEnIdx] = enTriple[0];
      if (!cols[descEnIdx]?.trim()) cols[descEnIdx] = enTriple[1];
      if (!cols[featEnIdx]?.trim()) cols[featEnIdx] = enTriple[2];
    }

    outLines.push(cols.map(escapeCsv).join(','));
  }

  fs.writeFileSync(CSV_PATH, `${outLines.join('\n')}\n`, 'utf8');
  console.log(`patched ${CSV_PATH} (${outLines.length - 1} data rows)`);
}

main();
