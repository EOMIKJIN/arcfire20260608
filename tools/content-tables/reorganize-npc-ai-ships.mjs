#!/usr/bin/env node
/**
 * npc_ai_ships.csv 재정렬:
 * 1) 플레이어 구매 전함 (상단, tradePortListed)
 * 2) 강력한 적 전함
 * 3) NPC 전용(수송·화물·궤도·웨이브 등)
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CSV_PATH = resolve(ROOT, 'tables/content/npc_ai_ships.csv');

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      q = !q;
      continue;
    }
    if (c === ',' && !q) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += c;
  }
  out.push(cur);
  return out;
}

function serializeCsvRow(fields) {
  return fields
    .map((v) => {
      const s = String(v ?? '');
      return s.includes(',') ? `"${s.replace(/"/g, '""')}"` : s;
    })
    .join(',');
}

function loadCsv(path) {
  const text = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const header = parseCsvLine(lines[0]);
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const rows = lines.slice(1).map((line) => {
    const fields = parseCsvLine(line);
    const row = {};
    for (const h of header) row[h] = fields[idx[h]] ?? '';
    return row;
  });
  return { header, rows };
}

function cloneRow(base, patch) {
  return { ...base, ...patch };
}

function templateFrom(rows, id) {
  const found = rows.find((r) => r.id === id);
  if (!found) throw new Error(`template not found: ${id}`);
  return { ...found };
}

function categorizeRow(r) {
  const id = String(r.id ?? '').trim();
  if (id.startsWith('Player_') || id === 'player_wave_ship') return 'player';
  if (id.startsWith('npc_enemy_')) return 'enemy';
  if (
    id.startsWith('npc_mock_pvp_')
    || id.startsWith('npc_wave_invader_')
    || id.startsWith('npc_vega_red_')
    || id.startsWith('npc_vega_blue_')
    || id.startsWith('npc_neweden_')
    || id.startsWith('npc_red_fleet_')
    || id.startsWith('npc_blue_fleet_')
    || id === 'npc_ai_clan_pvp_flagship'
  ) return 'enemy_combat';
  if (
    id.startsWith('npc_arc_presence_')
    || id.startsWith('npc_faction_cargo_')
    || id.startsWith('npc_arcadia_orbit_')
    || id.startsWith('npc_vega_guard_')
    || id.startsWith('npc_solar_guard_')
    || id.startsWith('npc_vega_test_')
    || id.startsWith('npc_eden_orbit_')
    || id.startsWith('npc_ai_clan_')
    || id.startsWith('npc_draco_')
  ) return 'npc_world';
  return 'other';
}

/** 신규 플레이어 구매 전함 — 기존 NPC 스탯 베이스 */
function buildNewPlayerShips(existing) {
  const defs = [
    {
      id: 'Player_frigate_mk2',
      name: '스트라이커 Mk.II',
      templateId: 'npc_red_fleet_3',
      combatLevel: 7,
      infoLineSuffix: 'P-F2|trade:250000',
      tradePortListed: 'TRUE',
    },
    {
      id: 'Player_destroyer_mk1',
      name: '가디언 구축함',
      templateId: 'npc_blue_fleet_1',
      combatLevel: 15,
      infoLineSuffix: 'P-D1|trade:1200000',
      tradePortListed: 'TRUE',
    },
    {
      id: 'Player_destroyer_mk2',
      name: '가디언 구축함 Mk.II',
      templateId: 'npc_red_fleet_1',
      combatLevel: 25,
      infoLineSuffix: 'P-D2|trade:1800000',
      tradePortListed: 'TRUE',
    },
    {
      id: 'Player_cruiser_mk1',
      name: '오라클 순양함',
      templateId: 'npc_vega_red_8',
      combatLevel: 31,
      infoLineSuffix: 'P-C1|trade:5000000',
      tradePortListed: 'TRUE',
    },
    {
      id: 'Player_cruiser_mk2',
      name: '오라클 순양함 Mk.II',
      templateId: 'npc_vega_red_9',
      combatLevel: 40,
      infoLineSuffix: 'P-C2|trade:7500000',
      tradePortListed: 'TRUE',
    },
    {
      id: 'Player_battlecruiser_mk1',
      name: '소버린 순양전함',
      templateId: 'npc_vega_red_12',
      combatLevel: 52,
      infoLineSuffix: 'P-BC1|trade:15000000',
      tradePortListed: 'TRUE',
    },
    {
      id: 'Player_battlecruiser_apex',
      name: '소버린 순양전함·완성형',
      templateId: 'npc_vega_red_12',
      combatLevel: 60,
      patch: { maxHp: '540', maxShield: '228', armor: '16', attackBonus: '9' },
      infoLineSuffix: 'P-BCX|trade:0',
      tradePortListed: 'TRUE',
    },
    {
      id: 'Player_dreadnought_mk1',
      name: '드레드노트',
      templateId: 'npc_enemy_nightfall_01',
      combatLevel: 65,
      patch: {
        hullTypeId: 'hull_cap_siege_01',
        maxHp: '620',
        maxShield: '240',
        armor: '17',
        attackBonus: '11',
        laserWeaponId: 'w_laser_heavy_01',
        missileWeaponId: 'w_missile_nova_01',
      },
      infoLineSuffix: 'P-DR1|trade:25000000',
      tradePortListed: 'TRUE',
    },
    {
      id: 'Player_super_capital_mk1',
      name: '슈퍼캐피털',
      templateId: 'npc_enemy_core_01',
      combatLevel: 72,
      patch: {
        maxHp: '760',
        maxShield: '280',
        armor: '19',
        attackBonus: '14',
        laserWeaponId: 'w_laser_heavy_01',
        missileWeaponId: 'w_missile_guided_triple_01',
      },
      infoLineSuffix: 'P-SC1|trade:50000000',
      tradePortListed: 'TRUE',
    },
    {
      id: 'Player_apex_legend_mk1',
      name: '아펙스 레전드',
      templateId: 'npc_enemy_eternity_01',
      combatLevel: 80,
      patch: {
        maxHp: '850',
        maxShield: '310',
        armor: '20',
        attackBonus: '16',
        laserWeaponId: 'w_laser_arc_019',
        missileWeaponId: 'w_missile_arc_072',
        size: '4',
      },
      infoLineSuffix: 'P-APX|trade:100000000',
      tradePortListed: 'TRUE',
    },
  ];

  const out = [];
  for (const def of defs) {
    if (existing.some((r) => r.id === def.id)) continue;
    const t = templateFrom(existing, def.templateId);
    const row = cloneRow(t, {
      npcMode: 'combat',
      id: def.id,
      name: def.name,
      captainId: 'Player_pilot',
      homeSystemId: 'draco_nebula',
      infoLineSuffix: def.infoLineSuffix,
      tradePortListed: def.tradePortListed,
      combatLevel: String(def.combatLevel),
      portraitImageAssetKey: 'assets/images/ship/ship_001.png',
      topViewImageAssetKey: 'assets/images/ship/ship_top_002.png',
      ...(def.patch ?? {}),
    });
    out.push(row);
  }
  return out;
}

function playerSortKey(r) {
  const order = [
    'Player_scout_ship',
    'Player_freighter',
    'Player_npc_red_fleet_1',
    'Player_frigate_mk2',
    'Player_destroyer_mk1',
    'Player_destroyer_mk2',
    'Player_cruiser_mk1',
    'Player_cruiser_mk2',
    'Player_battlecruiser_mk1',
    'Player_battlecruiser_apex',
    'Player_dreadnought_mk1',
    'Player_super_capital_mk1',
    'Player_apex_legend_mk1',
    'player_wave_ship',
  ];
  const i = order.indexOf(r.id);
  return i >= 0 ? i : 900 + Number(r.combatLevel || 0);
}

function waveTierNum(id) {
  const m = String(id).match(/npc_wave_invader_t(\d+)/);
  return m ? Number(m[1]) : null;
}

function enemySortKey(r) {
  const waveN = waveTierNum(r.id);
  if (waveN != null) return 50 + waveN;
  const cl = Number(r.combatLevel || 0);
  const hp = Number(r.maxHp || 0);
  return cl * 10000 + hp;
}

function main() {
  const { header, rows } = loadCsv(CSV_PATH);
  const newPlayers = buildNewPlayerShips(rows);
  const all = [...rows, ...newPlayers];

  const playerIds = new Set([
    'Player_scout_ship',
    'Player_npc_red_fleet_1',
    'Player_frigate_mk2',
    'Player_destroyer_mk1',
    'Player_destroyer_mk2',
    'Player_cruiser_mk1',
    'Player_cruiser_mk2',
    'Player_battlecruiser_mk1',
    'Player_battlecruiser_apex',
    'Player_dreadnought_mk1',
    'Player_super_capital_mk1',
    'Player_apex_legend_mk1',
  ]);

  for (const r of all) {
    if (playerIds.has(r.id)) {
      r.tradePortListed = 'TRUE';
      r.captainId = 'Player_pilot';
      r.npcMode = 'combat';
    } else if (r.id === 'Player_freighter' || r.id === 'player_wave_ship') {
      r.tradePortListed = 'FALSE';
    } else {
      r.tradePortListed = 'FALSE';
    }
  }

  const players = all.filter((r) => r.id.startsWith('Player_') || r.id === 'player_wave_ship');
  const enemies = all.filter((r) => {
    const c = categorizeRow(r);
    return c === 'enemy' || c === 'enemy_combat';
  });
  const npcWorld = all.filter((r) => {
    const c = categorizeRow(r);
    return c === 'npc_world' || c === 'other';
  });

  players.sort((a, b) => playerSortKey(a) - playerSortKey(b));
  enemies.sort((a, b) => enemySortKey(a) - enemySortKey(b) || String(a.id).localeCompare(b.id));
  npcWorld.sort((a, b) => String(a.id).localeCompare(b.id));

  const sectionComment = (label) => [{ __section: label }];
  const ordered = [
    ...sectionComment('PLAYER_PURCHASABLE'),
    ...players,
    ...sectionComment('ENEMY_COMBAT'),
    ...enemies,
    ...sectionComment('NPC_WORLD'),
    ...npcWorld,
  ].filter((r) => !r.__section);

  const outLines = [serializeCsvRow(header)];
  let lastSection = '';
  const emit = (section, row) => {
    if (section !== lastSection) {
      // CSV는 주석 미지원 — 섹션 구분은 id 접두 정렬로만 유지
      lastSection = section;
    }
    outLines.push(serializeCsvRow(header.map((h) => row[h] ?? '')));
  };

  for (const r of players) emit('player', r);
  for (const r of enemies) emit('enemy', r);
  for (const r of npcWorld) emit('npc', r);

  writeFileSync(CSV_PATH, `\uFEFF${outLines.join('\n')}\n`, 'utf8');
  console.log(`Wrote ${ordered.length} rows (+${newPlayers.length} new player ships)`);
  console.log(`Player shop: ${players.filter((p) => p.tradePortListed === 'TRUE').map((p) => p.id).join(', ')}`);
}

main();
