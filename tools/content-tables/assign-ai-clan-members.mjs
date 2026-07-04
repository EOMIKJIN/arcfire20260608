/**
 * npc_ai_captains.csv — aiClanId / aiClanRole 배정 (국가 거버너 제외)
 * node tools/content-tables/assign-ai-clan-members.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());
const CAPTAIN_CSV = resolve(ROOT, 'tables', 'content', 'npc_ai_captains.csv');
const REGISTRY_CSV = resolve(ROOT, 'tables', 'content', 'ai_clan_registry.csv');

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
      } else {
        field += ch;
      }
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

function escapeCsvField(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(rows) {
  return rows.map((row) => row.map(escapeCsvField).join(',')).join('\n') + '\n';
}

function loadTable(path) {
  const raw = readFileSync(path, 'utf8').trim();
  const rows = parseCsv(raw);
  const header = rows[0].map((h) => h.replace(/^\uFEFF/, ''));
  const data = rows.slice(1).map((cols) => {
    const out = {};
    for (let i = 0; i < header.length; i += 1) out[header[i]] = cols[i] ?? '';
    return out;
  });
  return { header, data };
}

const LEADER_BY_CAPTAIN = new Map();
for (const row of loadTable(REGISTRY_CSV).data) {
  LEADER_BY_CAPTAIN.set(row.leaderCaptainId, row.clanId);
}

const FACTION_CLANS = {
  federation: ['ai_clan_federation_patrol', 'ai_clan_safe_convoy'],
  federation_military: ['ai_clan_federation_patrol', 'ai_clan_border_watch'],
  border_watch: ['ai_clan_border_watch', 'ai_clan_safe_convoy'],
  miners_guild: ['ai_clan_miners_convoy'],
  independent: ['ai_clan_neutral_circuit', 'ai_clan_free_traders'],
  trade_coalition: ['ai_clan_free_traders', 'ai_clan_neutral_circuit'],
  pirates: ['ai_clan_crimson_raiders', 'ai_clan_void_marauders'],
  scavengers: ['ai_clan_scrap_collectors', 'ai_clan_void_marauders'],
  void_walkers: ['ai_clan_void_marauders', 'ai_clan_crimson_raiders'],
  scientists: ['ai_clan_research_convoy'],
  archaeologists: ['ai_clan_research_convoy'],
  energy_corp: ['ai_clan_safe_convoy', 'ai_clan_federation_patrol'],
  black_market: ['ai_clan_void_marauders'],
  dark_lords: ['ai_clan_void_marauders', 'ai_clan_crimson_raiders'],
  ancients: ['ai_clan_void_marauders'],
  unknown: ['ai_clan_void_marauders'],
};

function isExcluded(row) {
  const id = row.id;
  if (!id || id.startsWith('npc_cpt_gov_')) return true;
  if (id === 'Player_pilot' || id === 'npc_cpt_ai_robot_default') return true;
  if (id.startsWith('npc_cpt_operator_')) return true;
  if (id.startsWith('npc_cpt_arc_pf_')) return true;
  if (id.startsWith('npc_cpt_arc_seed_')) return true;
  if (id.startsWith('npc_cpt_faction_')) return true;
  if (id.startsWith('npc_cpt_mock_pvp_')) return true;
  if (String(row.arcOrbitPresenceFill).toUpperCase() === 'TRUE') return true;
  return false;
}

function pickClanForFaction(factionId, captainId) {
  const options = FACTION_CLANS[factionId];
  if (!options?.length) return '';
  let hash = 0;
  for (let i = 0; i < captainId.length; i += 1) hash = (hash * 31 + captainId.charCodeAt(i)) >>> 0;
  return options[hash % options.length];
}

function resolveRole(row) {
  if (String(row.aiClanLeader).toUpperCase() === 'TRUE') return 'leader';
  const role = String(row.aiRole ?? '').trim();
  if (role === 'fleet_leader' || role === 'patrol') return 'officer';
  return 'member';
}

const { header: origHeader, data } = loadTable(CAPTAIN_CSV);
const header = [...origHeader];
if (!header.includes('aiClanId')) header.splice(header.indexOf('aiClanZone') + 1, 0, 'aiClanId', 'aiClanRole');
else {
  const idx = header.indexOf('aiClanId');
  if (header[idx + 1] !== 'aiClanRole') header.splice(idx + 1, 0, 'aiClanRole');
}

let assigned = 0;
let excluded = 0;
const outRows = [header];

for (const row of data) {
  const next = { ...row };
  if (LEADER_BY_CAPTAIN.has(row.id)) {
    next.aiClanId = LEADER_BY_CAPTAIN.get(row.id);
    next.aiClanRole = 'leader';
    assigned += 1;
  } else if (isExcluded(row)) {
    next.aiClanId = '';
    next.aiClanRole = 'none';
    excluded += 1;
  } else {
    const clanId = pickClanForFaction(String(row.factionId ?? '').trim(), row.id);
    next.aiClanId = clanId;
    next.aiClanRole = clanId ? resolveRole(row) : 'none';
    if (clanId) assigned += 1;
  }
  outRows.push(header.map((col) => next[col] ?? ''));
}

writeFileSync(CAPTAIN_CSV, rowsToCsv(outRows), 'utf8');
console.log(`assign-ai-clan-members: assigned=${assigned} excluded=${excluded} total=${data.length}`);
