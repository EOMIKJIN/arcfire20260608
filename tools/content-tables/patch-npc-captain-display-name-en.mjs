#!/usr/bin/env node
/**
 * npc_ai_captains.csv — displayNameEn 컬럼 추가·전행 채움.
 * displayName(KO) 유지 · EN 유일성 검증.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const CSV_PATH = resolve(ROOT, 'tables/content/npc_ai_captains.csv');

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

function esc(v) {
  const s = String(v ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** id → English display name (전수 정본) */
const EN_BY_ID = {
  npc_cpt_mireille: 'Mireille Voss',
  npc_cpt_orin: 'Orin Cade',
  npc_cpt_sela: 'Sela Moran',
  npc_cpt_jex: 'Jex Tar',
  npc_cpt_vector: 'Vector-7',
  npc_cpt_kresh: 'Kresh Park',
  npc_cpt_raid_scar: 'Scar Raine',
  npc_cpt_eden_08: 'Kyle Rend',
  npc_cpt_eden_09: 'Lana Bell',
  npc_cpt_eden_10: 'Omel Kar',
  npc_cpt_vega_watch_01: 'Harman Dohl',
  npc_cpt_vega_watch_02: 'Serin Korf',
  npc_cpt_solar_guard_01: 'Isa Vent',
  npc_cpt_solar_guard_02: 'Tonic Rail',
  npc_cpt_vega_test_a: 'Vega Aux Alpha',
  npc_cpt_vega_test_b: 'Vega Aux Bravo',
  npc_cpt_vega_red_04: 'Vega Red 04',
  npc_cpt_vega_red_05: 'Vega Red 05',
  npc_cpt_vega_red_06: 'Vega Red 06',
  npc_cpt_vega_red_07: 'Vega Red 07',
  npc_cpt_vega_red_08: 'Vega Red 08',
  npc_cpt_vega_red_09: 'Vega Red 09',
  npc_cpt_vega_red_10: 'Vega Red 10',
  npc_cpt_vega_red_11: 'Vega Red 11',
  npc_cpt_vega_red_12: 'Vega Red 12',
  npc_cpt_vega_blue_07: 'Vega Blue 07',
  npc_cpt_vega_blue_08: 'Vega Blue 08',
  npc_cpt_vega_blue_09: 'Vega Blue 09',
  npc_cpt_vega_blue_10: 'Vega Blue 10',
  npc_cpt_vega_blue_11: 'Vega Blue 11',
  npc_cpt_neweden_red_07: 'New Eden Red 07',
  npc_cpt_neweden_blue_07: 'New Eden Blue 07',
  npc_cpt_arcadia_lane_01: 'Ellen de Cor',
  npc_cpt_arcadia_lane_02: 'Marc Sane',
  npc_cpt_enemy_arcadia_01: 'Kyle Dray',
  npc_cpt_enemy_arcadia_02: 'Nina Forr',
  npc_cpt_enemy_arcadia_03: 'Thor Gray',
  npc_cpt_enemy_solar_01: 'Lena Vork',
  npc_cpt_enemy_minerva_01: 'Drok Han',
  npc_cpt_enemy_vega_01: 'Zach Lynn',
  npc_cpt_enemy_eden_01: 'Vito Sanchez',
  npc_cpt_ai_clan_safe_01: 'Adeline Luke',
  npc_cpt_ai_clan_neutral_01: 'Lynn Kendall',
  npc_cpt_ai_clan_pvp_01: 'Mora Shayer',
  npc_cpt_arc_pf_01: 'Luan Verre',
  npc_cpt_arc_pf_02: 'Theo Banseong',
  npc_cpt_arc_pf_03: 'Mika Soren',
  npc_cpt_arc_pf_04: 'Joey Hilde',
  npc_cpt_arc_pf_05: 'Kai Nem',
  npc_cpt_arc_pf_06: 'Sara Olton',
  npc_cpt_arc_pf_07: 'Derek Hoon',
  npc_cpt_arc_pf_08: 'Ian Kroff',
  npc_cpt_arc_pf_09: 'Nova Lynn',
  npc_cpt_arc_pf_10: 'Jay Park',
  npc_cpt_arc_pf_11: 'Yoon Harim',
  npc_cpt_arc_pf_12: 'Reese Vega',
  npc_cpt_enemy_iron_01: 'Galen Brock',
  npc_cpt_enemy_iron_02: 'Vera Stone',
  npc_cpt_enemy_iron_03: 'Cor Endic',
  npc_cpt_enemy_draco_01: 'Ras Vale',
  npc_cpt_enemy_draco_02: 'Nia Crux',
  npc_cpt_enemy_draco_03: 'Teon Mor',
  npc_cpt_enemy_omega_01: 'Zar Rex',
  npc_cpt_enemy_omega_02: 'Mila Korn',
  npc_cpt_enemy_omega_03: 'Os Delta',
  npc_cpt_enemy_helios_01: 'Baron Sol',
  npc_cpt_enemy_helios_02: 'Iris Flare',
  npc_cpt_enemy_helios_03: 'Karn Lumen',
  npc_cpt_enemy_sirius_01: 'Drek Kalo',
  npc_cpt_enemy_sirius_02: 'Ren Vask',
  npc_cpt_enemy_sirius_03: 'Shara Mill',
  npc_cpt_enemy_titan_01: 'Or Nadin',
  npc_cpt_enemy_titan_02: 'Bel Tor',
  npc_cpt_enemy_titan_03: 'Rex Howl',
  npc_cpt_enemy_perseus_01: 'Kane Valor',
  npc_cpt_enemy_perseus_02: 'Dora Name',
  npc_cpt_enemy_perseus_03: 'Mar Onyx',
  npc_cpt_enemy_crimson_01: 'Rok Blood',
  npc_cpt_enemy_crimson_02: 'Sev Rau',
  npc_cpt_enemy_crimson_03: 'Ark Nero',
  npc_cpt_enemy_dark_01: 'Mor Vex',
  npc_cpt_enemy_dark_02: 'Sila Nox',
  npc_cpt_enemy_dark_03: 'Kas Yvon',
  npc_cpt_enemy_blood_01: 'Har Brute',
  npc_cpt_enemy_blood_02: 'Leda Cain',
  npc_cpt_enemy_blood_03: 'Vas Ron',
  npc_cpt_enemy_shadow_01: 'Nox Vale',
  npc_cpt_enemy_shadow_02: 'Maze Klein',
  npc_cpt_enemy_shadow_03: 'Jed Rown',
  npc_cpt_enemy_abyss_01: 'Kal Ordin',
  npc_cpt_enemy_abyss_02: 'Ella Void',
  npc_cpt_enemy_abyss_03: 'Nor Kadan',
  npc_cpt_enemy_nightfall_01: 'Belga Rune',
  npc_cpt_enemy_nightfall_02: 'Sern Dark',
  npc_cpt_enemy_nightfall_03: 'Ira Moon',
  npc_cpt_enemy_core_01: 'Aurel Core',
  npc_cpt_enemy_core_02: 'Seraph Zero',
  npc_cpt_enemy_core_03: 'Onyx Prime',
  npc_cpt_enemy_eternity_01: 'Chronos Vale',
  npc_cpt_enemy_eternity_02: 'Adel Nova',
  npc_cpt_enemy_eternity_03: 'Leon End',
  Player_pilot: 'Player Ship',
  npc_cpt_draco_obs_01: 'Serena Drill',
  npc_cpt_draco_escort_01: 'Dell Line',
  npc_cpt_mock_pvp_01: 'Mock Pilot 01',
  npc_cpt_mock_pvp_02: 'Mock Pilot 02',
  npc_cpt_mock_pvp_03: 'Mock Pilot 03',
  npc_cpt_mock_pvp_04: 'Mock Pilot 04',
  npc_cpt_mock_pvp_05: 'Mock Pilot 05',
  npc_cpt_mock_pvp_06: 'Mock Pilot 06',
  npc_cpt_mock_pvp_07: 'Mock Pilot 07',
  npc_cpt_mock_pvp_08: 'Mock Pilot 08',
  npc_cpt_mock_pvp_09: 'Mock Pilot 09',
  npc_cpt_mock_pvp_10: 'Mock Pilot 10',
  npc_cpt_mock_pvp_11: 'Mock Pilot 11',
  npc_cpt_mock_pvp_12: 'Mock Pilot 12',
  npc_cpt_mock_pvp_13: 'Mock Pilot 13',
  npc_cpt_mock_pvp_14: 'Mock Pilot 14',
  npc_cpt_mock_pvp_15: 'Mock Pilot 15',
  npc_cpt_mock_pvp_16: 'Mock Pilot 16',
  npc_cpt_mock_pvp_17: 'Mock Pilot 17',
  npc_cpt_mock_pvp_18: 'Mock Pilot 18',
  npc_cpt_mock_pvp_19: 'Mock Pilot 19',
  npc_cpt_tavern_ret_01: 'Hanro Crane',
  npc_cpt_tavern_ret_02: 'Mia Velo',
  npc_cpt_tavern_ret_03: 'Tad Raine',
  npc_cpt_tavern_ret_04: 'Sera Mion',
  npc_cpt_gov_minerva: 'Nika Stone',
  npc_cpt_gov_iron: 'Oren Peace',
  npc_cpt_gov_helios: 'Solar Finn',
  npc_cpt_gov_genesis: 'Arcano One',
  npc_cpt_operator_stella: 'Stella Aris',
  npc_cpt_ai_robot_default: 'AI Robot Captain (Default)',
  npc_cpt_faction_w_01: 'Aden Lyle',
  npc_cpt_faction_w_02: 'Brien Sol',
  npc_cpt_faction_w_03: 'Kael Moon',
  npc_cpt_faction_w_04: 'Darin Force',
  npc_cpt_faction_w_05: 'Era Syn',
  npc_cpt_faction_w_06: 'Pion Tech',
  npc_cpt_faction_w_07: 'Garen Hill',
  npc_cpt_faction_w_08: 'Hela Wynn',
  npc_cpt_faction_w_09: 'Ion Set',
  npc_cpt_faction_w_10: 'Jun Mar',
  npc_cpt_faction_w_11: 'Kira Ron',
  npc_cpt_faction_w_12: 'Lena Boss',
  npc_cpt_faction_s_01: 'Marcus Sol',
  npc_cpt_faction_s_02: 'Nina Drok',
  npc_cpt_faction_s_03: 'Oscar Finn',
  npc_cpt_faction_s_04: 'Petra Ull',
  npc_cpt_faction_s_05: 'Quinn Rose',
  npc_cpt_faction_s_06: 'Ras Vane',
  npc_cpt_faction_s_07: 'Silva Mott',
  npc_cpt_faction_s_08: 'Taru X',
  npc_cpt_faction_s_09: 'Ur Pain',
  npc_cpt_faction_s_10: 'Vera Sol',
  npc_cpt_faction_s_11: 'Will Crack',
  npc_cpt_faction_s_12: 'Jena Ark',
  npc_cpt_faction_e_01: 'Alma Rees',
  npc_cpt_faction_e_02: 'Ben Jo',
  npc_cpt_faction_e_03: 'Cora Min',
  npc_cpt_faction_e_04: 'Dale Hill',
  npc_cpt_faction_e_05: 'Ella Son',
  npc_cpt_faction_e_06: 'Frank No',
  npc_cpt_faction_e_07: 'Grace Ter',
  npc_cpt_faction_e_08: 'Henry Well',
  npc_cpt_faction_e_09: 'Iris Fan',
  npc_cpt_faction_e_10: 'Jack Oh',
  npc_cpt_faction_e_11: 'Kate Ru',
  npc_cpt_faction_e_12: 'Leo Pa',
  npc_cpt_faction_n_01: 'Night Ball',
  npc_cpt_faction_n_02: 'Ox Shadow',
  npc_cpt_faction_n_03: 'Pain Red',
  npc_cpt_faction_n_04: 'Quake Nick',
  npc_cpt_faction_n_05: 'Raven Sol',
  npc_cpt_faction_n_06: 'Spark Jin',
  npc_cpt_faction_n_07: 'Torque Black',
  npc_cpt_faction_n_08: 'Wolf Jad',
  npc_cpt_faction_n_09: 'Vex Dark',
  npc_cpt_faction_n_10: 'Wild Poe',
  npc_cpt_faction_n_11: 'Zero Kron',
  npc_cpt_faction_n_12: 'Zod Hay',
  npc_cpt_gov_reserve_blue_01: 'Kyle Dell',
  npc_cpt_gov_reserve_blue_02: 'Lina Orr',
  npc_cpt_gov_reserve_blue_03: 'Marcel Kin',
  npc_cpt_gov_reserve_blue_04: 'Sera Mont',
  npc_cpt_gov_reserve_blue_05: 'Tobias Lynn',
  npc_cpt_gov_reserve_blue_06: 'Yuria Beck',
  npc_cpt_gov_reserve_blue_07: 'Helena Koo',
  npc_cpt_gov_reserve_blue_08: 'Ian Cross',
  npc_cpt_gov_reserve_blue_09: 'Nova Stone',
  npc_cpt_gov_reserve_blue_10: 'Alex Dre',
  npc_cpt_gov_reserve_blue_11: 'Hansol Yul',
  npc_cpt_gov_reserve_blue_12: 'Gilbert Ahn',
  npc_cpt_gov_reserve_blue_13: 'Fenne Jang',
  npc_cpt_gov_reserve_blue_14: 'Oscar Min',
  npc_cpt_gov_reserve_blue_15: 'Karen Song',
  npc_cpt_gov_reserve_blue_16: 'Vito Dell',
  npc_cpt_gov_reserve_blue_17: 'Clara Ha',
  npc_cpt_gov_reserve_blue_18: 'Martin Neo',
  npc_cpt_gov_reserve_blue_19: 'Ella Sol',
  npc_cpt_gov_reserve_blue_20: 'Roseline Park',
  npc_cpt_gov_reserve_red_01: 'Valk Crimson',
  npc_cpt_gov_reserve_red_02: 'Sera Doom',
  npc_cpt_gov_reserve_red_03: 'Garon Mae',
  npc_cpt_gov_reserve_red_04: 'Isabel Priest',
  npc_cpt_gov_reserve_red_05: 'Darius Sol',
  npc_cpt_gov_reserve_red_06: 'Maximil Gate',
  npc_cpt_gov_reserve_red_07: 'Noah Dahl',
  npc_cpt_gov_reserve_red_08: 'Emile Corbin',
  npc_cpt_gov_reserve_red_09: 'Riley Ete',
  npc_cpt_gov_reserve_red_10: 'Victor Tau',
  npc_cpt_gov_reserve_red_11: 'Jonathan Fer',
  npc_cpt_gov_reserve_red_12: 'Clo Ome',
  npc_cpt_gov_reserve_red_13: 'Helix Flame',
  npc_cpt_gov_reserve_red_14: 'Mira Six',
  npc_cpt_gov_reserve_red_15: 'Corbin Bled',
  npc_cpt_gov_reserve_red_16: 'Arte Crimson',
  npc_cpt_gov_reserve_red_17: 'Pollex Delta',
  npc_cpt_gov_reserve_red_18: 'Ceres Yvon',
  npc_cpt_gov_reserve_red_19: 'Zero Gravi',
  npc_cpt_gov_reserve_red_20: 'End Fini',
  npc_cpt_gov_reserve_neutral_01: 'Taon Steel',
  npc_cpt_gov_reserve_neutral_02: 'Mary Clara',
  npc_cpt_gov_reserve_neutral_03: 'Torgard',
  npc_cpt_gov_reserve_neutral_04: 'Noah Genesis',
  npc_cpt_gov_reserve_neutral_05: 'Flora Iri',
  npc_cpt_arc_seed_abyss: 'Vera Convoy',
  npc_cpt_arc_seed_arcadia: 'Karan ARC',
  npc_cpt_arc_seed_arcfire_core: 'Duro ARC',
  npc_cpt_arc_seed_blood_field: 'Ella Convoy',
  npc_cpt_arc_seed_crimson_zone: 'Pion ARC',
  npc_cpt_arc_seed_dark_rift: 'Haren Convoy',
  npc_cpt_arc_seed_draco_nebula: 'Ion ARC',
  npc_cpt_arc_seed_eternity: 'Jena Convoy',
  npc_cpt_arc_seed_genesis: 'Kyle ARC',
  npc_cpt_arc_seed_helios: 'Luna Convoy',
  npc_cpt_arc_seed_iron_cross: 'Os ARC',
  npc_cpt_arc_seed_minerva: 'Sera Convoy',
  npc_cpt_arc_seed_new_eden: 'Talo ARC',
  npc_cpt_arc_seed_nightfall: 'Vion Convoy',
  npc_cpt_arc_seed_omega_station: 'Gale ARC',
  npc_cpt_arc_seed_perseus: 'Nova Convoy',
  npc_cpt_arc_seed_shadow_nexus: 'Lian ARC',
  npc_cpt_arc_seed_sirius: 'Sora Convoy',
  npc_cpt_arc_seed_solar_port: 'Teon ARC',
  npc_cpt_arc_seed_titan_gate: 'Wind Convoy',
  npc_cpt_arc_seed_vega_outpost: 'Zero ARC',
};

const raw = readFileSync(CSV_PATH, 'utf8');
const rows = parseCsv(raw.replace(/^\uFEFF/, ''));
if (rows.length < 2) throw new Error('empty csv');

const header = rows[0];
const idIdx = header.indexOf('id');
const nameIdx = header.indexOf('displayName');
if (idIdx < 0 || nameIdx < 0) throw new Error('missing id/displayName');

let enIdx = header.indexOf('displayNameEn');
if (enIdx < 0) {
  header.splice(nameIdx + 1, 0, 'displayNameEn');
  enIdx = nameIdx + 1;
  for (let r = 1; r < rows.length; r += 1) {
    rows[r].splice(enIdx, 0, '');
  }
}

const missing = [];
const seenEn = new Map();
for (let r = 1; r < rows.length; r += 1) {
  const id = String(rows[r][idIdx] ?? '').trim();
  if (!id) continue;
  const en = EN_BY_ID[id];
  if (!en) {
    missing.push(id);
    continue;
  }
  rows[r][enIdx] = en;
  if (seenEn.has(en)) {
    throw new Error(`duplicate EN name "${en}": ${seenEn.get(en)} vs ${id}`);
  }
  seenEn.set(en, id);
}

if (missing.length) {
  throw new Error(`missing EN for ${missing.length} ids: ${missing.slice(0, 20).join(', ')}`);
}

const out = rows.map((cols) => cols.map(esc).join(',')).join('\n') + '\n';
writeFileSync(CSV_PATH, out, 'utf8');
console.log(`[patch-npc-captain-display-name-en] rows=${rows.length - 1} uniqueEn=${seenEn.size} ok`);
