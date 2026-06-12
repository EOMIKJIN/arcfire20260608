#!/usr/bin/env node
/**
 * 플레이어 전함 — 파이터/레인저(D&D3) 스타일 재조정 + 레인저 라인 추가
 * 정본: tables/content/npc_ai_ships.csv
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const CSV_PATH = resolve(ROOT, 'tables/content/npc_ai_ships.csv');

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

function rowsToCsv(rows) {
  return rows
    .map((cols) =>
      cols
        .map((c) => {
          const s = String(c ?? '');
          return s.includes(',') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        })
        .join(','),
    )
    .join('\n')
    .concat('\n');
}

/** id -> partial column overrides (capitalShipArchetype 포함) */
const PLAYER_PATCH = {
  Player_scout_ship: {
    name: '레인저',
    maxHp: 72,
    maxShield: 88,
    armor: 11,
    attackBonus: 5,
    damageDiceCount: 1,
    damageDiceSides: 8,
    damageDiceBonus: 1,
    maxMoveSpeedPxPerMs: 0.033,
    detectRangeScale: 1.18,
    laserCooldownJitterMinMs: 80,
    laserCooldownJitterMaxMs: 300,
    missileCooldownJitterMinMs: 360,
    missileCooldownJitterMaxMs: 1100,
    salvoStepMinMs: 280,
    salvoStepMaxMs: 420,
    strStat: 10,
    dexStat: 16,
    capitalShipArchetype: 'ranger',
  },
  Player_freighter: {
    strStat: 8,
    dexStat: 10,
    capitalShipArchetype: 'survival',
  },
  Player_npc_red_fleet_1: {
    maxHp: 560,
    maxShield: 210,
    armor: 16,
    attackBonus: 9,
    damageDiceCount: 3,
    damageDiceSides: 10,
    damageDiceBonus: 5,
    maxMoveSpeedPxPerMs: 0.022,
    detectRangeScale: 1.0,
    laserCooldownJitterMinMs: 130,
    laserCooldownJitterMaxMs: 460,
    missileCooldownJitterMinMs: 520,
    missileCooldownJitterMaxMs: 1750,
    laserWeaponId: 'w_laser_heavy_01',
    missileWeaponId: 'w_missile_guided_triple_01',
    strStat: 16,
    dexStat: 12,
    sizeClass: 1,
    capitalShipArchetype: 'fighter',
  },
  Player_frigate_mk2: {
    name: '스트라이커 Mk.II',
    maxHp: 400,
    maxShield: 95,
    armor: 9,
    attackBonus: 12,
    damageDiceCount: 4,
    damageDiceSides: 8,
    damageDiceBonus: 6,
    maxMoveSpeedPxPerMs: 0.03,
    detectRangeScale: 1.17,
    laserCooldownJitterMinMs: 75,
    laserCooldownJitterMaxMs: 290,
    missileCooldownJitterMinMs: 340,
    missileCooldownJitterMaxMs: 1280,
    salvoStepMinMs: 300,
    salvoStepMaxMs: 440,
    strStat: 11,
    dexStat: 18,
    capitalShipArchetype: 'ranger',
  },
  Player_destroyer_mk1: {
    name: '가디언 구축함',
    maxHp: 600,
    maxShield: 250,
    armor: 18,
    attackBonus: 10,
    damageDiceCount: 3,
    damageDiceSides: 10,
    damageDiceBonus: 6,
    maxMoveSpeedPxPerMs: 0.02,
    detectRangeScale: 0.95,
    laserCooldownJitterMinMs: 145,
    laserCooldownJitterMaxMs: 540,
    missileCooldownJitterMinMs: 580,
    missileCooldownJitterMaxMs: 2150,
    laserWeaponId: 'w_laser_heavy_01',
    missileWeaponId: 'w_missile_nova_01',
    strStat: 17,
    dexStat: 11,
    sizeClass: 1,
    capitalShipArchetype: 'fighter',
  },
  Player_destroyer_mk2: {
    maxHp: 580,
    maxShield: 220,
    armor: 17,
    attackBonus: 10,
    damageDiceCount: 3,
    damageDiceSides: 10,
    damageDiceBonus: 6,
    maxMoveSpeedPxPerMs: 0.0215,
    detectRangeScale: 1.0,
    laserCooldownJitterMinMs: 135,
    laserCooldownJitterMaxMs: 500,
    missileCooldownJitterMinMs: 540,
    missileCooldownJitterMaxMs: 1950,
    strStat: 18,
    dexStat: 12,
    sizeClass: 1,
    capitalShipArchetype: 'fighter',
  },
  Player_cruiser_mk1: {
    maxHp: 600,
    maxShield: 235,
    armor: 17,
    attackBonus: 9,
    damageDiceCount: 2,
    damageDiceSides: 12,
    damageDiceBonus: 7,
    maxMoveSpeedPxPerMs: 0.0205,
    detectRangeScale: 0.98,
    laserCooldownJitterMinMs: 140,
    laserCooldownJitterMaxMs: 520,
    missileCooldownJitterMinMs: 560,
    missileCooldownJitterMaxMs: 2050,
    strStat: 18,
    dexStat: 11,
    sizeClass: 2,
    capitalShipArchetype: 'fighter',
  },
  Player_cruiser_mk2: {
    maxHp: 610,
    maxShield: 240,
    armor: 17,
    attackBonus: 9,
    damageDiceCount: 2,
    damageDiceSides: 12,
    damageDiceBonus: 8,
    maxMoveSpeedPxPerMs: 0.0203,
    detectRangeScale: 0.98,
    strStat: 18,
    dexStat: 12,
    sizeClass: 2,
    capitalShipArchetype: 'fighter',
  },
  Player_battlecruiser_mk1: {
    maxHp: 620,
    maxShield: 245,
    armor: 18,
    attackBonus: 10,
    maxMoveSpeedPxPerMs: 0.0202,
    detectRangeScale: 0.97,
    strStat: 19,
    dexStat: 11,
    sizeClass: 2,
    capitalShipArchetype: 'fighter',
  },
  Player_battlecruiser_apex: {
    maxHp: 640,
    maxShield: 255,
    armor: 18,
    attackBonus: 11,
    strStat: 19,
    dexStat: 12,
    sizeClass: 2,
    capitalShipArchetype: 'fighter',
  },
  Player_dreadnought_mk1: {
    maxHp: 680,
    maxShield: 265,
    armor: 19,
    attackBonus: 12,
    maxMoveSpeedPxPerMs: 0.0195,
    detectRangeScale: 0.96,
    strStat: 20,
    dexStat: 10,
    sizeClass: 3,
    capitalShipArchetype: 'fighter',
  },
  Player_super_capital_mk1: {
    maxHp: 800,
    maxShield: 295,
    armor: 20,
    attackBonus: 15,
    strStat: 21,
    dexStat: 11,
    sizeClass: 3,
    capitalShipArchetype: 'fighter',
  },
  Player_apex_legend_mk1: {
    maxHp: 880,
    maxShield: 320,
    armor: 21,
    attackBonus: 17,
    strStat: 22,
    dexStat: 12,
    sizeClass: 4,
    capitalShipArchetype: 'fighter',
  },
  player_wave_ship: {
    capitalShipArchetype: 'special',
  },
};

/** 신규 레인저 라인 — 파이터 동급 체급 대응 */
const NEW_RANGER_ROWS = [
  {
    id: 'Player_hunter_mk1',
    name: '헌터 구축함',
    hullTypeId: 'hull_cap_raider_01',
    maxHp: 450,
    maxShield: 125,
    armor: 10,
    attackBonus: 12,
    damageDiceCount: 4,
    damageDiceSides: 8,
    damageDiceBonus: 6,
    maxMoveSpeedPxPerMs: 0.0285,
    detectRangeScale: 1.14,
    laserCooldownJitterMinMs: 75,
    laserCooldownJitterMaxMs: 280,
    missileCooldownJitterMinMs: 340,
    missileCooldownJitterMaxMs: 1200,
    infoLineSuffix: 'P-H1|trade:1200000',
    expReward: 115,
    combatLevel: 15,
    proficiencyMultiplier: 1.12,
    strStat: 11,
    dexStat: 18,
    sizeClass: 1,
  },
  {
    id: 'Player_hunter_mk2',
    name: '헌터 구축함 Mk.II',
    hullTypeId: 'hull_cap_raider_01',
    maxHp: 480,
    maxShield: 135,
    armor: 11,
    attackBonus: 13,
    damageDiceCount: 4,
    damageDiceSides: 8,
    damageDiceBonus: 7,
    maxMoveSpeedPxPerMs: 0.0295,
    detectRangeScale: 1.15,
    laserCooldownJitterMinMs: 72,
    laserCooldownJitterMaxMs: 270,
    missileCooldownJitterMinMs: 320,
    missileCooldownJitterMaxMs: 1150,
    infoLineSuffix: 'P-H2|trade:1800000',
    expReward: 130,
    combatLevel: 25,
    proficiencyMultiplier: 1.13,
    strStat: 11,
    dexStat: 19,
    sizeClass: 1,
  },
  {
    id: 'Player_shadow_cruiser_mk1',
    name: '섀도우 순양함',
    hullTypeId: 'hull_cap_patrol_01',
    maxHp: 470,
    maxShield: 140,
    armor: 11,
    attackBonus: 13,
    damageDiceCount: 4,
    damageDiceSides: 8,
    damageDiceBonus: 7,
    maxMoveSpeedPxPerMs: 0.0275,
    detectRangeScale: 1.16,
    laserCooldownJitterMinMs: 70,
    laserCooldownJitterMaxMs: 260,
    missileCooldownJitterMinMs: 310,
    missileCooldownJitterMaxMs: 1100,
    infoLineSuffix: 'P-SC1|trade:5000000',
    expReward: 135,
    combatLevel: 31,
    proficiencyMultiplier: 1.15,
    strStat: 12,
    dexStat: 19,
    sizeClass: 2,
  },
  {
    id: 'Player_shadow_cruiser_mk2',
    name: '섀도우 순양함 Mk.II',
    hullTypeId: 'hull_cap_patrol_01',
    maxHp: 490,
    maxShield: 148,
    armor: 12,
    attackBonus: 14,
    damageDiceCount: 4,
    damageDiceSides: 8,
    damageDiceBonus: 8,
    maxMoveSpeedPxPerMs: 0.028,
    detectRangeScale: 1.17,
    infoLineSuffix: 'P-SC2|trade:7500000',
    expReward: 135,
    combatLevel: 40,
    proficiencyMultiplier: 1.15,
    strStat: 12,
    dexStat: 20,
    sizeClass: 2,
  },
  {
    id: 'Player_raptor_bc_mk1',
    name: '랩터 순양전함',
    hullTypeId: 'hull_cap_raider_01',
    maxHp: 500,
    maxShield: 155,
    armor: 12,
    attackBonus: 14,
    damageDiceCount: 4,
    damageDiceSides: 8,
    damageDiceBonus: 8,
    maxMoveSpeedPxPerMs: 0.0278,
    detectRangeScale: 1.18,
    infoLineSuffix: 'P-RBC1|trade:15000000',
    expReward: 138,
    combatLevel: 52,
    proficiencyMultiplier: 1.15,
    strStat: 12,
    dexStat: 20,
    sizeClass: 2,
  },
  {
    id: 'Player_raptor_bc_apex',
    name: '랩터 순양전함·완성형',
    hullTypeId: 'hull_cap_raider_01',
    maxHp: 520,
    maxShield: 165,
    armor: 13,
    attackBonus: 15,
    damageDiceCount: 4,
    damageDiceSides: 8,
    damageDiceBonus: 9,
    maxMoveSpeedPxPerMs: 0.0282,
    detectRangeScale: 1.19,
    infoLineSuffix: 'P-RBCX|trade:0',
    expReward: 138,
    combatLevel: 60,
    proficiencyMultiplier: 1.15,
    strStat: 13,
    dexStat: 21,
    sizeClass: 2,
  },
  {
    id: 'Player_phantom_dreadnought_mk1',
    name: '팬텀 드레드노트',
    hullTypeId: 'hull_cap_patrol_01',
    maxHp: 540,
    maxShield: 175,
    armor: 13,
    attackBonus: 15,
    damageDiceCount: 4,
    damageDiceSides: 8,
    damageDiceBonus: 9,
    maxMoveSpeedPxPerMs: 0.027,
    detectRangeScale: 1.2,
    laserCooldownJitterMinMs: 68,
    laserCooldownJitterMaxMs: 250,
    missileCooldownJitterMinMs: 300,
    missileCooldownJitterMaxMs: 1050,
    infoLineSuffix: 'P-PDR1|trade:25000000',
    expReward: 192,
    combatLevel: 65,
    proficiencyMultiplier: 1.21,
    strStat: 13,
    dexStat: 21,
    sizeClass: 3,
  },
  {
    id: 'Player_phantom_super_capital_mk1',
    name: '팬텀 슈퍼캐피털',
    hullTypeId: 'hull_cap_raider_01',
    maxHp: 580,
    maxShield: 190,
    armor: 14,
    attackBonus: 16,
    damageDiceCount: 4,
    damageDiceSides: 8,
    damageDiceBonus: 10,
    maxMoveSpeedPxPerMs: 0.0268,
    detectRangeScale: 1.21,
    infoLineSuffix: 'P-PSC1|trade:50000000',
    expReward: 280,
    combatLevel: 72,
    proficiencyMultiplier: 1.31,
    strStat: 13,
    dexStat: 22,
    sizeClass: 3,
  },
  {
    id: 'Player_phantom_apex_legend_mk1',
    name: '팬텀 레전드',
    hullTypeId: 'hull_cap_patrol_01',
    maxHp: 620,
    maxShield: 205,
    armor: 15,
    attackBonus: 18,
    damageDiceCount: 4,
    damageDiceSides: 8,
    damageDiceBonus: 11,
    maxMoveSpeedPxPerMs: 0.0265,
    detectRangeScale: 1.22,
    laserWeaponId: 'w_laser_arc_019',
    missileWeaponId: 'w_missile_arc_072',
    infoLineSuffix: 'P-PAPX|trade:100000000',
    expReward: 320,
    combatLevel: 80,
    proficiencyMultiplier: 1.33,
    strStat: 14,
    dexStat: 23,
    sizeClass: 4,
  },
];

function buildDefaultRangerRow(spec) {
  return {
    npcMode: 'combat',
    id: spec.id,
    name: spec.name,
    hullTypeId: spec.hullTypeId,
    captainId: 'Player_pilot',
    homeSystemId: 'draco_nebula',
    maxHp: spec.maxHp,
    maxShield: spec.maxShield,
    armor: spec.armor,
    attackBonus: spec.attackBonus,
    damageDiceCount: spec.damageDiceCount,
    damageDiceSides: spec.damageDiceSides,
    damageDiceBonus: spec.damageDiceBonus,
    maxMoveSpeedPxPerMs: spec.maxMoveSpeedPxPerMs,
    accelPxPerMs2: 0.000044,
    maxTurnRateRadPerMs: 0.00235,
    turnAccelRadPerMs2: 0.000068,
    detectRangeScale: spec.detectRangeScale,
    laserCooldownJitterMinMs: spec.laserCooldownJitterMinMs ?? 70,
    laserCooldownJitterMaxMs: spec.laserCooldownJitterMaxMs ?? 260,
    missileCooldownJitterMinMs: spec.missileCooldownJitterMinMs ?? 310,
    missileCooldownJitterMaxMs: spec.missileCooldownJitterMaxMs ?? 1100,
    salvoStepMinMs: 300,
    salvoStepMaxMs: 440,
    engageStartDelayMinMs: 0,
    engageStartDelayMaxMs: 850,
    laserWeaponId: spec.laserWeaponId ?? 'w_laser_light_01',
    missileWeaponId: spec.missileWeaponId ?? 'w_missile_guided_triple_01',
    closeRangeWeaponId: 'w_missile_arc_005',
    auxWeaponId: '',
    infoLineSuffix: spec.infoLineSuffix,
    arcTrafficDwellRadPerSec: 0.46,
    arcTrafficPhaseDurationMul: 2,
    arcTrafficPlanetDwellSecMin: 60,
    arcTrafficPlanetDwellSecMax: 600,
    portraitImageAssetKey: 'assets/images/ship/ship_001.png',
    topViewImageAssetKey: 'assets/images/ship/ship_top_002.png',
    tradePortListed: 'TRUE',
    strStat: spec.strStat,
    dexStat: spec.dexStat,
    sizeClass: spec.sizeClass,
    expReward: spec.expReward,
    combatLevel: spec.combatLevel,
    size: 3,
    proficiencyMultiplier: spec.proficiencyMultiplier,
    capitalShipArchetype: 'ranger',
  };
}

const rows = parseCsv(readFileSync(CSV_PATH, 'utf8').trim());
const hdr = rows[0].map((h) => String(h).replace(/^\uFEFF/, ''));
if (!hdr.includes('capitalShipArchetype')) {
  hdr.push('capitalShipArchetype');
}
const archIdx = hdr.indexOf('capitalShipArchetype');
const idIdx = hdr.indexOf('id');

const out = [hdr];
const existingIds = new Set();
let patched = 0;

for (const cols of rows.slice(1)) {
  const rowObj = Object.fromEntries(hdr.slice(0, cols.length).map((h, i) => [h, cols[i] ?? '']));
  while (cols.length < hdr.length - 1) cols.push('');
  const id = String(rowObj.id ?? cols[idIdx] ?? '').trim();
  existingIds.add(id);

  const patch = PLAYER_PATCH[id];
  if (patch) {
    for (const [k, v] of Object.entries(patch)) {
      rowObj[k] = String(v);
    }
    patched += 1;
  } else if (!rowObj.capitalShipArchetype) {
    rowObj.capitalShipArchetype = 'neutral';
  }

  const nextCols = hdr.map((h) => rowObj[h] ?? '');
  out.push(nextCols);
}

// player_wave_ship 뒤에 레인저 라인 삽입
const insertAfterId = 'player_wave_ship';
const insertIdx = out.findIndex((cols, i) => i > 0 && String(cols[idIdx]).trim() === insertAfterId);
let added = 0;
const newRows = NEW_RANGER_ROWS.map(buildDefaultRangerRow).filter((r) => {
  if (existingIds.has(r.id)) return false;
  existingIds.add(r.id);
  added += 1;
  return true;
});

if (insertIdx >= 0 && newRows.length > 0) {
  const asCols = newRows.map((r) => hdr.map((h) => r[h] ?? ''));
  out.splice(insertIdx + 1, 0, ...asCols);
}

const UTF8_BOM = '\uFEFF';
writeFileSync(CSV_PATH, UTF8_BOM + rowsToCsv(out), 'utf8');
console.log(`rebalance-player-capital-ships: patched=${patched} added=${added} rows=${out.length - 1}`);
