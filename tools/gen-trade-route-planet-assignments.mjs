/**
 * 교역품(tg_*) — 무역소 행성별 생산·수요 1:1 배정 + item_defs src/dst 동기화
 * 실행: node tools/gen-trade-route-planet-assignments.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

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
      rows.push(row);
      row = [];
      i += 1;
      continue;
    }
    field += ch;
    i += 1;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function stringifyCsv(rows) {
  return rows
    .map((cols) =>
      cols
        .map((v) => {
          const s = String(v ?? '');
          if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
          return s;
        })
        .join(','),
    )
    .join('\n');
}

function loadCsv(rel) {
  const raw = readFileSync(resolve(ROOT, rel), 'utf8').trim();
  const rows = parseCsv(raw);
  const header = rows[0].map((h) => String(h).replace(/^\uFEFF/, ''));
  return {
    header,
    rows: rows.slice(1).map((cols) => {
      const out = {};
      for (let i = 0; i < header.length; i += 1) out[header[i]] = cols[i] ?? '';
      return out;
    }),
  };
}

function parseAttrs(json) {
  try {
    return JSON.parse(json || '{}');
  } catch {
    return {};
  }
}

const CATEGORY_MIN_ZONE = {
  food: 1,
  mineral: 1,
  tech: 5,
  luxury: 9,
  weapon: 9,
  contraband: 15,
};

function rarityTier(baseBuyPrice) {
  if (baseBuyPrice < 1500) return 'common';
  if (baseBuyPrice < 8000) return 'uncommon';
  if (baseBuyPrice < 50000) return 'rare';
  return 'legendary';
}

const RARITY_MIN_ZONE = {
  common: 1,
  uncommon: 4,
  rare: 10,
  legendary: 16,
};

const profiles = loadCsv('tables/balance/planet_trade_route_profile.csv').rows;
const zoneRows = loadCsv('tables/balance/planet_leveling_progression.csv').rows;
const playZones = loadCsv('tables/balance/play_scenario_zone_planets.csv').rows;
const sectorPolicy = loadCsv('tables/balance/trade_port_sector_commodity_policy.csv').rows;
const itemTable = loadCsv('tables/content/item_defs.csv');

const zoneByPlanet = new Map(playZones.map((r) => [r.primaryPlanetId, Number(r.zoneIndex) || 99]));
const sectorPipe = new Map(
  sectorPolicy.map((r) => [
    r.sectorBand,
    String(r.commodityItemIdsPipe || '')
      .split('|')
      .map((s) => s.trim().toLowerCase()),
  ]),
);
const alias = { minerals: 'mineral' };

function sectorBand(zoneIndex) {
  const row = zoneRows.find((r) => Number(r.zoneIndex) === zoneIndex);
  if (row?.sectorBand) return row.sectorBand;
  const maxZone = zoneRows.reduce(
    (m, r) => Math.max(m, Number(r.zoneIndex) || 0),
    0,
  );
  if (zoneIndex > maxZone) return 'late';
  return 'early';
}

function catsForZone(zoneIndex) {
  const pipe = sectorPipe.get(sectorBand(zoneIndex)) || ['food'];
  return new Set(pipe.map((t) => alias[t] || t));
}

const profileById = new Map(profiles.map((p) => [p.planetId, p]));

const planets = profiles
  .map((p) => {
    const zoneIndex = zoneByPlanet.get(p.planetId) ?? 99;
    return {
      id: p.planetId,
      faction: String(p.tradeFactionCode).trim(),
      region: String(p.tradeRegionCode).trim(),
      zoneIndex,
      band: sectorBand(zoneIndex),
      cats: catsForZone(zoneIndex),
    };
  })
  .sort((a, b) => a.zoneIndex - b.zoneIndex);

const tgRows = itemTable.rows.filter((r) => r.id?.startsWith('tg_'));

const items = tgRows.map((row) => {
  const attrs = parseAttrs(row.attrsJson);
  const category = String(row.category || '').toLowerCase();
  const baseBuyPrice = Number(attrs.baseBuyPrice) || Number(row.basePrice) || 0;
  const tier = rarityTier(baseBuyPrice);
  const minZone = Math.max(CATEGORY_MIN_ZONE[category] ?? 1, RARITY_MIN_ZONE[tier] ?? 1);
  return {
    id: row.id,
    category,
    baseBuyPrice,
    tier,
    minZone,
    attrs,
  };
});

function supplyCandidates(item) {
  let list = planets.filter((p) => p.zoneIndex >= item.minZone && p.cats.has(item.category));
  if (list.length === 0) {
    list = planets.filter((p) => p.cats.has(item.category));
  }
  if (list.length === 0) list = [...planets];
  return list;
}

function demandCandidates(supplyPlanet, item) {
  const list = planets.filter(
    (p) =>
      p.id !== supplyPlanet.id &&
      p.faction !== supplyPlanet.faction &&
      p.zoneIndex >= Math.max(1, supplyPlanet.zoneIndex - 1) &&
      p.cats.has(item.category),
  );
  if (list.length > 0) return list;
  return planets.filter((p) => p.id !== supplyPlanet.id && p.faction !== supplyPlanet.faction);
}

const supplyLoad = new Map(planets.map((p) => [p.id, 0]));
const demandLoad = new Map(planets.map((p) => [p.id, 0]));
const assignments = [];

const sortedItems = [...items].sort(
  (a, b) => b.minZone - a.minZone || b.baseBuyPrice - a.baseBuyPrice || a.id.localeCompare(b.id),
);

for (const item of sortedItems) {
  const supplyOpts = supplyCandidates(item);
  supplyOpts.sort(
    (a, b) =>
      (supplyLoad.get(a.id) ?? 0) - (supplyLoad.get(b.id) ?? 0) ||
      a.zoneIndex - b.zoneIndex,
  );
  const supply = supplyOpts[0];
  supplyLoad.set(supply.id, (supplyLoad.get(supply.id) ?? 0) + 1);

  const demandOpts = demandCandidates(supply, item);
  demandOpts.sort(
    (a, b) =>
      (demandLoad.get(a.id) ?? 0) - (demandLoad.get(b.id) ?? 0) ||
      Math.abs(a.zoneIndex - supply.zoneIndex) - Math.abs(b.zoneIndex - supply.zoneIndex),
  );
  const demand = demandOpts[0] ?? planets.find((p) => p.id !== supply.id) ?? supply;
  demandLoad.set(demand.id, (demandLoad.get(demand.id) ?? 0) + 1);

  assignments.push({
    tgId: item.id,
    supplyPlanetId: supply.id,
    demandPlanetId: demand.id,
    rarityTier: item.tier,
    minSupplyZoneIndex: String(item.minZone),
    notesKo: `${item.category} buy@${supply.zoneIndex}→sell@${demand.zoneIndex}`,
  });
}

assignments.sort((a, b) => a.tgId.localeCompare(b.tgId));

const assignPath = resolve(ROOT, 'tables/balance/trade_route_planet_supply_assignments.csv');
writeFileSync(
  assignPath,
  `${stringifyCsv([
    [
      'tgId',
      'supplyPlanetId',
      'demandPlanetId',
      'rarityTier',
      'minSupplyZoneIndex',
      'notesKo',
    ],
    ...assignments.map((a) => [
      a.tgId,
      a.supplyPlanetId,
      a.demandPlanetId,
      a.rarityTier,
      a.minSupplyZoneIndex,
      a.notesKo,
    ]),
  ])}\n`,
  'utf8',
);

const assignByTg = new Map(assignments.map((a) => [a.tgId, a]));

for (const row of tgRows) {
  const a = assignByTg.get(row.id);
  if (!a) continue;
  const supplyProf = profileById.get(a.supplyPlanetId);
  const demandProf = profileById.get(a.demandPlanetId);
  if (!supplyProf || !demandProf) continue;

  const attrs = parseAttrs(row.attrsJson);
  attrs.srcFactionCode = supplyProf.tradeFactionCode;
  attrs.dstFactionCode = demandProf.tradeFactionCode;
  attrs.srcRegion = supplyProf.tradeRegionCode;
  attrs.dstRegion = demandProf.tradeRegionCode;
  row.attrsJson = JSON.stringify(attrs);
  row.tags = `trade_route|src_${supplyProf.tradeFactionCode}|dst_${demandProf.tradeFactionCode}`;
}

writeFileSync(
  resolve(ROOT, 'tables/content/item_defs.csv'),
  `${stringifyCsv([itemTable.header, ...itemTable.rows.map((r) => itemTable.header.map((h) => r[h] ?? ''))])}\n`,
  'utf8',
);

console.log(`[gen-trade-route-planet-assignments] ${assignments.length} items → ${assignPath}`);
console.log('\n=== 행성별 생산(구매) SKU ===');
for (const p of planets) {
  const n = assignments.filter((a) => a.supplyPlanetId === p.id).length;
  const sample = assignments.filter((a) => a.supplyPlanetId === p.id).slice(0, 3).map((a) => a.tgId);
  console.log(
    `${p.id.padEnd(22)} zone=${String(p.zoneIndex).padStart(2)} band=${p.band.padEnd(9)} supply=${String(n).padStart(2)}  ${sample.join(', ')}`,
  );
}
const loads = [...supplyLoad.values()];
console.log(
  `\nmin=${Math.min(...loads)} max=${Math.max(...loads)} avg=${(loads.reduce((s, n) => s + n, 0) / loads.length).toFixed(1)}`,
);
