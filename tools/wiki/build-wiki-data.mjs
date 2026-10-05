// 게임소개페이지(위키) 데이터 재생성 — tables/content CSV → 게임소개페이지/assets/data/*.js
// node tools/wiki/build-wiki-data.mjs
// 이미지: CSV 에셋 키(assets/images/...)를 위키 기준 상대경로(../assets/images/...)로 연결. 파일 없으면 빈 값.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const CONTENT = path.join(ROOT, 'tables', 'content');
const OUT = path.join(ROOT, '게임소개페이지', 'assets', 'data');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let q = false;
  const s = text.replace(/^﻿/, '');
  for (let i = 0; i < s.length; i += 1) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') { cell += '"'; i += 1; } else if (c === '"') q = false; else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i += 1;
      row.push(cell); cell = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  const head = rows.shift() ?? [];
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}

const read = (name) => parseCsv(fs.readFileSync(path.join(CONTENT, name), 'utf8'))
  .map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, isIdLike(k) ? v : disp(v)])));

/**
 * 위키 표기 규칙 (2026-10-05 대표님): 프로젝트명은 「아크파이어」(온라인 제외),
 * PvP는 멀티플레이 의미라 오류 → 「분쟁지역」. id·에셋 경로 열은 건드리지 않는다(이미지 연결 보호).
 */
function isIdLike(key) {
  return /(^id$|Id$|Ids?Pipe$|AssetKey$|^attendantId$|^planetId$|^systemId$|Zone$|^npcMode$)/.test(key);
}
function disp(v) {
  return String(v)
    .replace(/아크파이어\s*온라인/g, '아크파이어')
    .replace(/Arc\s*[Ff]ire\s+Online/g, 'Arcfire')
    .replace(/PvP\s*(권|지대|구역|존)/g, '분쟁지역')
    .replace(/\bPv[Pp]\b|PVP/g, '분쟁지역');
}

/** 에셋 키 → 위키 상대경로 (존재할 때만) */
function img(key) {
  const k = (key ?? '').trim();
  if (!k || !k.startsWith('assets/')) return '';
  return fs.existsSync(path.join(ROOT, k)) ? `../${k}` : '';
}

const planetName = new Map();
const systemName = new Map();
const planets = read('planets.csv').map((p) => {
  planetName.set(p.id, p.name);
  systemName.set(p.systemId, p.systemName);
  return {
    id: p.id,
    name: p.name,
    nameEn: p.nameEn,
    system: p.systemName,
    systemEn: p.systemNameEn,
    zone: p.systemZone,
    faction: p.factionId,
    enemyLevel: p.systemEnemyLevel,
    tradePort: p.hasTradePort,
    shipyard: p.hasShipyard,
    bar: p.hasBar,
    desc: p.description,
    img: img(p.infoPanelPortraitAssetKey) || img(p.backdropImageAssetKey),
  };
});

const captains = read('npc_ai_captains.csv').map((c) => ({
  id: c.id,
  name: c.displayName,
  nameEn: c.displayNameEn,
  rank: c.rank,
  faction: c.factionId,
  team: c.combatTeam,
  role: c.aiRole,
  aggression: c.aiAggression,
  bio: c.bioShort,
  planet: planetName.get(c.basePlanetId) || c.basePlanetId,
  clan: c.aiClanName,
  deathEligible: c.deathEligible,
  questOnly: c.questOnly,
  img: img(c.portraitImageAssetKey),
}));

const ships = read('npc_ai_ships.csv').map((s) => ({
  id: s.id,
  name: s.name,
  nameEn: s.name_en,
  hull: s.hullTypeId,
  homeSystem: systemName.get(s.homeSystemId) || s.homeSystemId,
  hp: s.maxHp,
  shield: s.maxShield,
  armor: s.armor,
  lvl: s.combatLevel,
  size: s.sizeClass,
  archetype: s.capitalShipArchetype,
  listed: s.tradePortListed,
  npcMode: s.npcMode,
  desc: s['특징설명'],
  img: img(s.portraitImageAssetKey) || img(`assets/images/ship/${s.id}.png`),
}));

const items = read('item_defs.csv').map((i) => ({
  id: i.id,
  name: i.name,
  nameEn: i.name_en,
  desc: i.description,
  category: i.category,
  kind: i.kind,
  type: i.type,
  price: i.basePrice,
  tradeable: i.tradeable,
  sellable: i.sellable,
}));

const weapons = read('weapon_list.csv').map((w) => ({
  id: w.id,
  name: w['이름'],
  nameEn: w['영문명'],
  family: w['종류'],
  dmg: w['대미지'],
  reqLevel: w['요구레벨'],
  tier: w['등급라벨'],
  rangeClass: w['무기분류'],
  price: w['구매가'],
  desc: w['특징설명'],
  listed: w.tradePortListed,
}));

const missions = read('missions.csv').map((m) => ({
  id: m.id,
  title: m.title,
  titleEn: m.title_en,
  desc: m.description,
  type: m.type,
  lvl: m.levelRequired,
  rewardCr: m.rewardCredits,
  rewardExp: m.rewardExp,
  next: m.nextMissionId,
}));

const attendants = read('bar_attendants.csv').map((a) => ({
  id: a.attendantId,
  planet: planetName.get(a.planetId) || a.planetId,
  name: a.displayNameKo,
  nameEn: a.displayNameEn,
  tagline: a.taglineKo,
  dialogSet: a.dialogSetId,
  song: a.songId,
  enabled: a.enabled,
  img: img(a.portraitImageAssetKey),
}));

const write = (file, varName, data) => {
  fs.writeFileSync(path.join(OUT, file), `window.${varName} = ${JSON.stringify(data)};\n`, 'utf8');
  const withImg = data.filter((d) => d.img).length;
  console.log(`${file} rows=${data.length}${'img' in (data[0] ?? {}) ? ` img=${withImg}` : ''}`);
};

fs.mkdirSync(OUT, { recursive: true });
write('planets.js', 'PLANET_DATA', planets);
write('captains.js', 'CAPTAIN_DATA', captains);
write('ships.js', 'SHIP_DATA', ships);
write('items.js', 'ITEM_DATA', items);
write('weapons.js', 'WEAPON_DATA', weapons);
write('missions.js', 'MISSION_DATA', missions);
write('attendants.js', 'ATTENDANT_DATA', attendants);
fs.writeFileSync(
  path.join(OUT, 'meta.js'),
  `window.WIKI_META = ${JSON.stringify({ builtAt: new Date().toISOString().slice(0, 10), counts: { planets: planets.length, captains: captains.length, ships: ships.length, items: items.length, weapons: weapons.length, missions: missions.length, attendants: attendants.length } })};\n`,
  'utf8',
);
