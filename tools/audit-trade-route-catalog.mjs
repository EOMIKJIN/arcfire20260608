import { readFileSync } from 'node:fs';
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

function loadCsv(rel) {
  const raw = readFileSync(resolve(ROOT, rel), 'utf8').trim();
  const rows = parseCsv(raw);
  const header = rows[0].map((h) => String(h).replace(/^\uFEFF/, ''));
  return rows.slice(1).map((cols) => {
    const out = {};
    for (let i = 0; i < header.length; i += 1) out[header[i]] = cols[i] ?? '';
    return out;
  });
}

function parseAttrs(json) {
  try {
    return JSON.parse(json || '{}');
  } catch {
    return {};
  }
}

const profiles = loadCsv('tables/balance/planet_trade_route_profile.csv');
const assignments = loadCsv('tables/balance/trade_route_planet_supply_assignments.csv');
const supplyByPlanet = new Map();
for (const row of assignments) {
  const pid = row.supplyPlanetId;
  if (!supplyByPlanet.has(pid)) supplyByPlanet.set(pid, []);
  supplyByPlanet.get(pid).push(row.tgId);
}
const items = loadCsv('tables/content/item_defs.csv').filter((r) => r.id?.startsWith('tg_'));
const zoneRows = loadCsv('tables/balance/planet_leveling_progression.csv');
const playZones = loadCsv('tables/balance/play_scenario_zone_planets.csv');
const sectorPolicy = loadCsv('tables/balance/trade_port_sector_commodity_policy.csv');

const planetName = new Map(playZones.map((r) => [r.planetId, r.nameKo || r.planetId]));
const zoneByPlanet = new Map(playZones.map((r) => [r.planetId, Number(r.zoneIndex) || 1]));

const sectorPipe = new Map(
  sectorPolicy.map((r) => [
    r.sectorBand,
    String(r.commodityItemIdsPipe || '')
      .split('|')
      .map((s) => s.trim().toLowerCase()),
  ]),
);
const alias = { minerals: 'mineral' };

function catsForBand(band) {
  const pipe = sectorPipe.get(band) || sectorPipe.get('early') || ['food'];
  return new Set(pipe.map((t) => alias[t] || t));
}

function sectorBand(pid) {
  const zi = zoneByPlanet.get(pid) ?? 99;
  const row = zoneRows.find((r) => Number(r.zoneIndex) === zi);
  return row?.sectorBand || 'early';
}

const profileMap = new Map(profiles.map((p) => [p.planetId, p]));

function resolveRole(planetId, attrs) {
  const prof = profileMap.get(planetId);
  if (!prof) return null;
  if (attrs.srcFactionCode === prof.tradeFactionCode) return 'supply';
  if (attrs.dstFactionCode === prof.tradeFactionCode) return 'demand';
  return null;
}

function listTgForPlanetByRole(planetId, role) {
  const prof = profileMap.get(planetId);
  if (!prof) return [];
  const allowed = catsForBand(sectorBand(planetId));
  const factionKey = role === 'supply' ? 'srcFactionCode' : 'dstFactionCode';
  const out = [];
  for (const row of items) {
    const attrs = parseAttrs(row.attrsJson);
    if (!attrs.tradeRoute) continue;
    const cat = (row.category || '').toLowerCase();
    if (!allowed.has(cat)) continue;
    if (attrs[factionKey] !== prof.tradeFactionCode) continue;
    out.push({
      id: row.id,
      name: row.name,
      attrs,
      role: resolveRole(planetId, attrs),
    });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}

function listSupplyBuyCatalog(planetId) {
  const assigned = (supplyByPlanet.get(planetId) ?? []).map((id) => {
    const row = items.find((r) => r.id === id);
    if (!row) return null;
    const attrs = parseAttrs(row.attrsJson);
    return { id, name: row.name, attrs, role: 'supply' };
  }).filter(Boolean);
  if (assigned.length > 0) return assigned.sort((a, b) => a.id.localeCompare(b.id));
  return listTgForPlanetByRole(planetId, 'supply');
}

function listDemandImportMarket(planetId) {
  return listTgForPlanetByRole(planetId, 'demand');
}

console.log('=== tg_003 배양 액상 육류 (src F3 → dst F1) ===');
for (const p of profiles) {
  const it = [...listSupplyBuyCatalog(p.planetId), ...listDemandImportMarket(p.planetId)].find((x) => x.id === 'tg_003');
  if (!it) continue;
  console.log(
    `${p.planetId.padEnd(20)} faction=${p.tradeFactionCode} region=${p.tradeRegionCode} role=${it.role?.padEnd(6) ?? 'null'} name=${planetName.get(p.planetId) ?? ''}`,
  );
}

console.log('\n=== arcadia_prime 교역품 역할 요약 ===');
const arcSupplyBuy = listSupplyBuyCatalog('arcadia_prime');
const arcDemandImport = listDemandImportMarket('arcadia_prime');
console.log(`구매탭 정적(생산) ${arcSupplyBuy.length}종, 수요지 수입시장 ${arcDemandImport.length}종`);
console.log('구매탭 정적 예시:', arcSupplyBuy.slice(0, 5).map((x) => x.id).join(', ') || '(없음)');
console.log('수입(재고>0시 구매탭) 예시:', arcDemandImport.slice(0, 5).map((x) => x.id).join(', '));

let supplyBuyTotal = 0;
let demandImportTotal = 0;

for (const p of profiles) {
  supplyBuyTotal += listSupplyBuyCatalog(p.planetId).length;
  demandImportTotal += listDemandImportMarket(p.planetId).length;
}

console.log('\n=== 전 행성 tg_* 분배 (신규 규칙) ===');
console.log(`구매탭 정적(생산지 supply) ${supplyBuyTotal}건`);
console.log(`수요지 수입시장(demand, 재고>0만 구매탭) ${demandImportTotal}건`);

console.log('\n=== 교역로 정의 없이 진열 가능한 행성 (프로필 없음) ===');
const tradePortPlanets = playZones.filter((r) => String(r.hasTradePort).toLowerCase() === 'true');
const noProfile = tradePortPlanets.filter((r) => !profileMap.has(r.planetId));
console.log(noProfile.length ? noProfile.map((r) => r.planetId).join(', ') : '(없음)');

const ratio = 0.7;
console.log('\n=== 생산지 동일 행성 재판매 정책 (전 행성 supply 품목) ===');
let supplySkuTotal = 0;
for (const p of profiles) {
  const supplyItems = listSupplyBuyCatalog(p.planetId);
  supplySkuTotal += supplyItems.length;
  if (supplyItems.length === 0) continue;
  const sample = supplyItems[0];
  const buy = sample.attrs.baseBuyPrice;
  const sell = Math.floor(buy * ratio);
  console.log(
    `${p.planetId.padEnd(20)} F${p.tradeFactionCode} supply=${supplyItems.length}종 예:${sample.id} buy=${buy} localSell=${sell} (-30%)`,
  );
}
console.log(`프로필 행성 ${profiles.length}개 · supply SKU 합계 ${supplySkuTotal} (모두 동일 재판매 규칙)`);

console.log('\n=== src==dst 팩션 교역품 (동일 팩션 내 순환) ===');
for (const row of items) {
  const a = parseAttrs(row.attrsJson);
  if (a.srcFactionCode && a.srcFactionCode === a.dstFactionCode) {
    console.log(row.id, a.srcFactionCode, row.name);
  }
}
