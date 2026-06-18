/**
 * planets.csv — systemNameEn, systemDescriptionEn, nameEn, descriptionEn 주입
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLANETS_PATH = path.join(__dirname, '../../tables/content/planets.csv');

/** systemId → [systemNameEn, systemDescriptionEn, planetNameEn, planetDescriptionEn] */
const PLANETS_EN = {
  arcadia: [
    'Arcadia',
    'Gateway of the Arcfire galaxy. Starting point for new pilots.',
    'Arcadia Prime',
    'A peaceful planet of vast grasslands.',
  ],
  solar_port: [
    'Solar Port',
    'The galaxy\'s largest trade hub. A bustling port city.',
    'Solar Station',
    'A massive space station in place of a planet.',
  ],
  minerva: [
    'Minerva',
    'Mining center. Famous for rich mineral resources.',
    'Minerva Deep',
    'Underground mines cover the entire planet.',
  ],
  vega_outpost: [
    'Vega Outpost',
    'Federation military outpost. Trained pilots gather here.',
    'Vega Base',
    'A city built around a military base.',
  ],
  new_eden: [
    'New Eden',
    'A free trade zone belonging to no faction.',
    'Eden City',
    'A lawless place. You can buy anything.',
  ],
  iron_cross: [
    'Iron Cross',
    'A system scarred by an ancient war.',
    'Iron Remnant',
    'A settlement of survivors among the wreckage.',
  ],
  draco_nebula: [
    'Draco Nebula',
    'A mysterious system hidden inside a dense nebula.',
    'Draco Haven',
    'A special research facility powered by nebula energy.',
  ],
  omega_station: [
    'Omega Station',
    'Midpoint of the galaxy. All routes cross here.',
    'Omega Hub',
    'A large space station operating around the clock.',
  ],
  helios: [
    'Helios',
    'A system with stellar energy collection facilities.',
    'Helios Core',
    'Center of solar battery production.',
  ],
  sirius: [
    'Sirius',
    'Border between neutral and PvP zones. Danger draws near.',
    'Sirius Border',
    'The last safe settlement on the frontier.',
  ],
  titan_gate: [
    'Titan Gate',
    'Ruins of a massive gate left by the ancient Titan race.',
    'Titan Ruins',
    'Traces of an ancient civilization. Researchers visit constantly.',
  ],
  perseus: [
    'Perseus',
    'A fierce battleground where heroes made their names.',
    'Perseus Memorial',
    'A memorial planet honoring past heroes.',
  ],
  crimson_zone: [
    'Crimson Zone',
    '⚠ PvP zone. You may be attacked by other pilots.',
    'Crimson Base',
    'Pirate and mercenary stronghold. High risk, high reward.',
  ],
  dark_rift: [
    'Dark Rift',
    '⚠ PvP zone. Spatial distortion is severe.',
    'Dark Haven',
    'A secret base inside warped space.',
  ],
  blood_field: [
    'Blood Field',
    '⚠ PvP zone. A brutal battlefield, as the name suggests.',
    'Blood Station',
    'A floating station filled with scars of battle.',
  ],
  shadow_nexus: [
    'Shadow Nexus',
    '⚠ PvP zone. A crossroads in the dark.',
    'Shadow Market',
    'Center of illegal trade.',
  ],
  abyss: [
    'Abyss',
    '⚠ PvP zone. Edge of the abyss. Survive here and become legend.',
    'Abyss Gate',
    'The last gate toward the final zone.',
  ],
  nightfall: [
    'Nightfall',
    '⚠ PvP zone. Eternal night rules this system.',
    'Nightfall Citadel',
    'A fortress ruled by lords of darkness.',
  ],
  arcfire_core: [
    'Arcfire Core',
    '★ Endgame. Heart of the Arcfire galaxy. Only legendary pilots reach it.',
    'Core Prime',
    'A sacred planet where galactic energy gathers.',
  ],
  eternity: [
    'Eternity',
    '★ Endgame. A system where time seems to stand still.',
    'Eternal Throne',
    'Throne of the ancient empire that once ruled the galaxy.',
  ],
  genesis: [
    'Genesis',
    '★ Endgame. Beginning and end of all things. Arcfire Online\'s final destination.',
    'Genesis Origin',
    'Origin of the universe. Those who arrive here become myth.',
  ],
};

function parseCsvLine(line) {
  const out = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      out.push(field);
      field = '';
    } else {
      field += ch;
    }
  }
  out.push(field);
  return out;
}

function escapeCsv(v) {
  const s = String(v ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function patchFile(filePath, extraCols, fillRow) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter((l, i, arr) => i < arr.length - 1 || l.trim());
  const header = parseCsvLine(lines[0]).map((h) => String(h).replace(/^\uFEFF/, '').trim());
  const colIdx = {};
  for (const col of extraCols) {
    let idx = header.indexOf(col);
    if (idx < 0) {
      idx = header.length;
      header.push(col);
    }
    colIdx[col] = idx;
  }
  const outLines = [header.map(escapeCsv).join(',')];
  for (let li = 1; li < lines.length; li++) {
    const cols = parseCsvLine(lines[li]);
    if (!cols.some((c) => String(c ?? '').trim())) continue;
    while (cols.length < header.length) cols.push('');
    fillRow(cols, colIdx, header);
    outLines.push(cols.map(escapeCsv).join(','));
  }
  fs.writeFileSync(filePath, `${outLines.join('\n')}\n`, 'utf8');
}

patchFile(
  PLANETS_PATH,
  ['systemNameEn', 'systemDescriptionEn', 'nameEn', 'descriptionEn'],
  (cols, idx, header) => {
    const systemIdIdx = header.indexOf('systemId');
    const systemId = systemIdIdx >= 0 ? cols[systemIdIdx]?.trim() : '';
    if (!systemId) return;
    const en = PLANETS_EN[systemId];
    if (!en) return;
    if (!cols[idx.systemNameEn]?.trim()) cols[idx.systemNameEn] = en[0];
    if (!cols[idx.systemDescriptionEn]?.trim()) cols[idx.systemDescriptionEn] = en[1];
    if (!cols[idx.nameEn]?.trim()) cols[idx.nameEn] = en[2];
    if (!cols[idx.descriptionEn]?.trim()) cols[idx.descriptionEn] = en[3];
  },
);

console.log('patched planets.csv');
