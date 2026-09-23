#!/usr/bin/env node
/**
 * 4대 국가 정렬 — 코드·테이블 전수 감사 (읽기 전용)
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const REGION_BY_F = { F1: 'W', F2: 'S', F3: 'E', F4: 'N' };

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
  const raw = readFileSync(resolve(ROOT, rel), 'utf8').replace(/^\uFEFF/, '');
  const rows = parseCsv(raw);
  const header = rows[0].map((h) => h.replace(/^\uFEFF/, ''));
  return rows.slice(1).filter((r) => r.some((c) => String(c ?? '').trim())).map((cols) => {
    const out = {};
    header.forEach((h, i) => {
      out[h] = cols[i] ?? '';
    });
    return out;
  });
}

const profile = loadCsv('tables/balance/planet_trade_route_profile.csv');
const items = loadCsv('tables/content/item_defs.csv');
const assigns = loadCsv('tables/balance/trade_route_planet_supply_assignments.csv');
const planets = loadCsv('tables/content/planets.csv');
const occ = loadCsv('tables/balance/planet_occupation_seeds.csv');
const story = loadCsv('tables/content/story_scene_pages.csv');

const fByPlanet = new Map(profile.map((r) => [r.planetId, r.tradeFactionCode]));
const rByPlanet = new Map(profile.map((r) => [r.planetId, r.tradeRegionCode]));

const leftover = [];
const leftoverRe = /연합국|크림슨 군단장|서부 연방|남부 광업|seized the north|은하계 북부|독립·무역 연합/;
for (const row of story) {
  const blob = `${row.text}\n${row.text_en ?? ''}`;
  if (leftoverRe.test(blob)) leftover.push(`story ${row.sceneId} p${row.pageIndex}`);
}

let tgRegionFail = 0;
let tgTagFail = 0;
let tgCount = 0;
const tgAttrs = new Map();
for (const row of items) {
  if (row.type !== 'trade_route') continue;
  tgCount += 1;
  let attrs;
  try {
    attrs = JSON.parse(row.attrsJson || '{}');
  } catch {
    tgRegionFail += 1;
    continue;
  }
  tgAttrs.set(row.id, attrs);
  const srcOk = REGION_BY_F[attrs.srcFactionCode] === attrs.srcRegion;
  const dstOk = REGION_BY_F[attrs.dstFactionCode] === attrs.dstRegion;
  if (!srcOk || !dstOk) tgRegionFail += 1;
  const tags = String(row.tagsPipe ?? '').split('|');
  if (!tags.includes(`src_${attrs.srcFactionCode}`) || !tags.includes(`dst_${attrs.dstFactionCode}`)) {
    tgTagFail += 1;
  }
}

let profilePairFail = 0;
for (const row of profile) {
  if (REGION_BY_F[row.tradeFactionCode] !== row.tradeRegionCode) profilePairFail += 1;
}

let supplyFMismatch = 0;
let demandFMismatch = 0;
let roleWouldBeNullOnDemand = 0;
let roleWouldFlipDemandToSupply = 0;
const mismatchSamples = [];
for (const row of assigns) {
  const attrs = tgAttrs.get(row.tgId);
  if (!attrs) continue;
  const sF = fByPlanet.get(row.supplyPlanetId);
  const dF = fByPlanet.get(row.demandPlanetId);
  if (sF && sF !== attrs.srcFactionCode) {
    supplyFMismatch += 1;
    if (mismatchSamples.length < 12) {
      mismatchSamples.push(`${row.tgId} supply ${row.supplyPlanetId} planetF=${sF} attrsSrc=${attrs.srcFactionCode}`);
    }
  }
  if (dF && dF !== attrs.dstFactionCode) {
    demandFMismatch += 1;
    if (mismatchSamples.length < 12) {
      mismatchSamples.push(`${row.tgId} demand ${row.demandPlanetId} planetF=${dF} attrsDst=${attrs.dstFactionCode}`);
    }
  }
  if (dF && dF !== attrs.dstFactionCode && dF !== attrs.srcFactionCode) roleWouldBeNullOnDemand += 1;
  if (dF && dF === attrs.srcFactionCode && dF !== attrs.dstFactionCode) roleWouldFlipDemandToSupply += 1;
}

const flavorOnCore = planets.map((p) => `${p.id}:${p.factionId}`).filter((s) => /miners_guild|trade_coalition|federation/.test(s));
const occOwners = [...new Set(occ.map((r) => r.initialOwner))];

console.log(JSON.stringify({
  tgCount,
  tgRegionFail,
  tgTagFail,
  profileRows: profile.length,
  profilePairFail,
  assignRows: assigns.length,
  supplyFMismatch,
  demandFMismatch,
  roleWouldBeNullOnDemand,
  roleWouldFlipDemandToSupply,
  mismatchSamples,
  leftoverStory: leftover,
  occOwners,
  coreFlavorSample: flavorOnCore.slice(0, 12),
  coreFlavorCount: flavorOnCore.length,
}, null, 2));
