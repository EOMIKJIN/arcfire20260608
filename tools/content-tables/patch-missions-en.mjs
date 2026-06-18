/**
 * missions.csv / mission_objectives.csv — title_en, description_en 주입
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MISSIONS_PATH = path.join(__dirname, '../../tables/content/missions.csv');
const OBJECTIVES_PATH = path.join(__dirname, '../../tables/content/mission_objectives.csv');

const MISSION_EN = {
  mission_001: ['First Flight', 'Captain, a Federation order: travel to Vega Outpost and meet the commander.'],
  mission_002: ['Pirate Sweep', 'Destroy 1 pirate near Arcadia and return.'],
  mission_003: ['Open a Trade Route', 'Buy 10 food packs at Sola Port and deliver them to Minerva.'],
  mission_004: ['Neutral Zone Recon', 'Travel to New Eden in the neutral zone and assess the situation.'],
  mission_005: ['Toward the Heart of the Galaxy', 'Travel to Omega Station and secure a clue to the Arcfire Core.'],
  sandbox_001: ['Gate Trail Hunt', 'Ellen de Cor asked you to eliminate a pirate scout near the Arcadia gate.'],
  sandbox_002: ['Outer Route Check', 'Mark Sain asked you to verify supplies heading to the Vega access route.'],
  sandbox_003: ['Harbor Order', 'Isa Vent asked you to repel smuggler escorts near Sola Port.'],
  sandbox_004: ['High-Value Cargo Handoff', 'Tonic Rail asked you to move tech parts to a Minerva inspection post.'],
  sandbox_005: ['Mine Tunnel Guard', 'Cela Morn asked you to clear pirates on the Minerva mine approach.'],
  sandbox_006: ['Refined Ore Sample', 'Mia Bello asked you to send refined ore samples to New Eden.'],
  sandbox_007: ['Vega Raid Block', 'Herman Dol asked you to preempt a small pirate squad on Vega outskirts.'],
  sandbox_008: ['Civilian Reserve Food', 'Serin Koff asked you to send reserve food to Vega civilian escorts.'],
  sandbox_009: ['Black Market Tail', 'Lana Bel contracted tracking a cruiser loitering at New Eden docks.'],
  sandbox_010: ['Neutral Route Parts', 'New Eden Blue 07 asked you to deliver tech parts to neutral route defenses.'],
  sandbox_011: ['Iron Wreck Hunt', 'Omel Kar asked you to remove a cruiser hiding in the Iron Remnant zone.'],
  sandbox_012: ['Scrap Guild Contract', 'Sera Mion asked you to move salvage manifests to Omega.'],
  sandbox_013: ['Draco Survey Fix', 'Vector-7 asked you to destroy hostiles near an anomaly signal in Draco Nebula.'],
  sandbox_014: ['Nebula Research Sample', 'Tad Rain asked you to transport research samples to Omega Hub.'],
  sandbox_015: ['Omega Convoy Call', 'Lyndall Kendall asked you to handle a cruiser demanding tolls near Omega.'],
  sandbox_016: ['Cross-hub Supply', 'Lyndall Kendall asked you to send food and tech from Omega to Helios Core.'],
  sandbox_017: ['Solar Belt Intercept', 'Vector-7 asked you to remove an armed ship entering the Helios solar belt.'],
  sandbox_018: ['Energy Coil Transport', 'Adeline Luke asked you to send Helios coils toward Sirius Border.'],
  sandbox_019: ['Sirius Border Hunt', 'Jex Tar asked you to backtrace a bounty hunter in the border zone.'],
  sandbox_020: ['Titan Record Seal', 'Tad Rain asked you to move Titan relic plates to Perseus Memorial.'],
  sandbox_021: ['Perseus Memorial Guard', 'Sera Mion asked you to stop a bounty hunter threatening the memorial route.'],
  sandbox_022: ['Border Supply Contract', 'Jex Tar asked you to haul weapons from Sirius Border to Crimson Outpost.'],
  sandbox_023: ['Crimson First Bounty', 'Mora Sayer ordered elimination of a traitor bounty hunter near Crimson Base.'],
  sandbox_024: ['Shadow Contraband Lot', 'Mora Sayer asked you to move contraband to Shadow Market.'],
  sandbox_025: ['Dark Lift Mark', 'Kresh Park asked you to capture a bounty hunter hiding at Dark Lift.'],
  sandbox_026: ['Bloodfield Med Supply', 'Sera Mion asked you to reroute medical supplies to Blood Station.'],
  sandbox_027: ['Shadow Stalker', 'Mora Sayer ordered removal of a stalker at Shadow Nexus.'],
  sandbox_028: ['Abyss Gate Warmup', 'Lyndall Kendall asked you to secure spare tech parts bound for Abyss Gate.'],
  sandbox_029: ['Nightfall Red Contract', 'Mora Sayer ordered a bounty hunter cleared near Nightfall Citadel.'],
  sandbox_030: ['Core Outpost Supply', 'Adeline Luke asked you to send advanced tech parts to the Arcfire Core outpost.'],
};

const OBJ_EN = {
  obj_001_a: 'Travel to Vega Outpost',
  obj_002_a: 'Destroy pirate fighter (1)',
  obj_003_a: 'Buy food packs at Sola Port (10)',
  obj_003_b: 'Deliver to Minerva',
  obj_004_a: 'Arrive at New Eden',
  obj_005_a: 'Arrive at Omega Station',
  obj_s001_a: 'Destroy pirate fighter',
  obj_s002_a: 'Buy 3 food packs',
  obj_s002_b: 'Travel to Vega Outpost',
  obj_s003_a: 'Destroy pirate fighter',
  obj_s004_a: 'Buy 2 tech components',
  obj_s004_b: 'Travel to Minerva',
  obj_s005_a: 'Destroy pirate fighter',
  obj_s006_a: 'Buy 3 raw minerals',
  obj_s006_b: 'Travel to New Eden',
  obj_s007_a: 'Destroy pirate fighter',
  obj_s008_a: 'Buy 4 food packs',
  obj_s008_b: 'Travel to Sola Port',
  obj_s009_a: 'Destroy pirate cruiser',
  obj_s010_a: 'Buy 3 tech components',
  obj_s010_b: 'Travel to Iron Cross',
  obj_s011_a: 'Destroy pirate cruiser',
  obj_s012_a: 'Buy 4 raw minerals',
  obj_s012_b: 'Travel to Omega Station',
  obj_s013_a: 'Destroy pirate cruiser',
  obj_s014_a: 'Buy 2 luxury goods',
  obj_s014_b: 'Travel to Omega Station',
  obj_s015_a: 'Destroy pirate cruiser',
  obj_s016_a: 'Buy 5 food packs',
  obj_s016_b: 'Travel to Helios',
  obj_s017_a: 'Destroy pirate cruiser',
  obj_s018_a: 'Buy 4 tech components',
  obj_s018_b: 'Travel to Sirius',
  obj_s019_a: 'Destroy bounty hunter',
  obj_s020_a: 'Buy 3 luxury goods',
  obj_s020_b: 'Travel to Perseus',
  obj_s021_a: 'Destroy bounty hunter',
  obj_s022_a: 'Buy 3 weapons',
  obj_s022_b: 'Travel to Crimson Zone',
  obj_s023_a: 'Destroy bounty hunter',
  obj_s024_a: 'Buy 2 contraband',
  obj_s024_b: 'Travel to Shadow Nexus',
  obj_s025_a: 'Destroy bounty hunter',
  obj_s026_a: 'Buy 6 food packs',
  obj_s026_b: 'Travel to Blood Field',
  obj_s027_a: 'Destroy bounty hunter',
  obj_s028_a: 'Buy 5 tech components',
  obj_s028_b: 'Travel to Abyss',
  obj_s029_a: 'Destroy bounty hunter',
  obj_s030_a: 'Buy 6 tech components',
  obj_s030_b: 'Travel to Arcfire Core',
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
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
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

patchFile(MISSIONS_PATH, ['title_en', 'description_en'], (cols, idx, header) => {
  const idIdx = header.indexOf('id');
  const id = idIdx >= 0 ? cols[idIdx]?.trim() : '';
  if (!id) return;
  const en = MISSION_EN[id];
  if (!en) return;
  if (!cols[idx.title_en]?.trim()) cols[idx.title_en] = en[0];
  if (!cols[idx.description_en]?.trim()) cols[idx.description_en] = en[1];
});

patchFile(OBJECTIVES_PATH, ['description_en'], (cols, idx, header) => {
  const idIdx = header.indexOf('id');
  const id = idIdx >= 0 ? cols[idIdx]?.trim() : '';
  if (!id) return;
  const en = OBJ_EN[id];
  if (en && !cols[idx.description_en]?.trim()) cols[idx.description_en] = en;
});

console.log('patched missions.csv + mission_objectives.csv');
