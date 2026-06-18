/**
 * npc_ai_ships.csv — tradePortListed Player 함선 name_en 주입
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, '../../tables/content/npc_ai_ships.csv');

const EN_BY_ID = {
  Player_scout_ship: 'Starter Ranger CM.I',
  Player_npc_red_fleet_1: 'Starter Fighter Mk.I',
  Player_frigate_mk2: 'Striker Mk.II',
  Player_destroyer_mk1: 'Guardian Destroyer',
  Player_destroyer_mk2: 'Guardian Destroyer Mk.II',
  Player_cruiser_mk1: 'Oracle Cruiser',
  Player_cruiser_mk2: 'Oracle Cruiser Mk.II',
  Player_battlecruiser_mk1: 'Sovereign Battlecruiser',
  Player_battlecruiser_apex: 'Sovereign Battlecruiser Apex',
  Player_dreadnought_mk1: 'Dreadnought',
  Player_super_capital_mk1: 'Super Capital',
  Player_apex_legend_mk1: 'Apex Legend',
  player_wave_ship: 'Wave Defense Battleship',
  Player_hunter_mk1: 'Hunter Destroyer',
  Player_hunter_mk2: 'Hunter Destroyer Mk.II',
  Player_shadow_cruiser_mk1: 'Shadow Cruiser',
  Player_shadow_cruiser_mk2: 'Shadow Cruiser Mk.II',
  Player_raptor_bc_mk1: 'Raptor Battlecruiser',
  Player_raptor_bc_apex: 'Raptor Battlecruiser Apex',
  Player_phantom_dreadnought_mk1: 'Phantom Dreadnought',
  Player_phantom_super_capital_mk1: 'Phantom Super Capital',
  Player_phantom_apex_legend_mk1: 'Phantom Legend',
};

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
      } else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function escapeCsv(v) {
  const s = String(v ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function main() {
  const raw = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l, i, arr) => i < arr.length - 1 || l.trim());
  const header = parseCsvLine(lines[0]).map((h) => String(h).replace(/^\uFEFF/, '').trim());
  const idIdx = header.indexOf('id');
  const tradeIdx = header.indexOf('tradePortListed');
  let nameEnIdx = header.indexOf('name_en');
  const newHeader = [...header];
  if (nameEnIdx < 0) {
    nameEnIdx = newHeader.length;
    newHeader.push('name_en');
  }
  const outLines = [newHeader.map(escapeCsv).join(',')];
  let patched = 0;
  for (let li = 1; li < lines.length; li++) {
    const cols = parseCsvLine(lines[li]);
    while (cols.length < newHeader.length) cols.push('');
    const id = cols[idIdx]?.trim();
    const listed = String(cols[tradeIdx] ?? '').trim().toUpperCase() === 'TRUE';
    if (listed && EN_BY_ID[id] && !cols[nameEnIdx]?.trim()) {
      cols[nameEnIdx] = EN_BY_ID[id];
      patched++;
    }
    outLines.push(cols.map(escapeCsv).join(','));
  }
  fs.writeFileSync(CSV_PATH, `${outLines.join('\n')}\n`, 'utf8');
  console.log(`patched ${patched} npc ship name_en rows`);
}

main();
