import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(process.cwd());

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

function regionForZone(zoneIndex) {
  return zoneIndex <= 4 ? 'region_core_belt' : 'region_frontier_rim';
}

const zoneRows = parseCsv(readFileSync(resolve(ROOT, 'tables/balance/play_scenario_zone_planets.csv'), 'utf8')).slice(1);
const synthRows = parseCsv(readFileSync(resolve(ROOT, 'tables/balance/synth_system_colonization.csv'), 'utf8')).slice(1);

const lines = ['regionId,planetId,notesKo'];
for (const cols of zoneRows) {
  const zoneIndex = Number(cols[0]) || 1;
  const planetId = String(cols[1] ?? '').trim();
  if (!planetId) continue;
  lines.push(`${regionForZone(zoneIndex)},${planetId},scenario zone ${zoneIndex}`);
}
for (const cols of synthRows) {
  const synthSystemId = String(cols[0] ?? '').trim();
  const zoneIndex = Number(cols[9]) || 1;
  if (!synthSystemId) continue;
  lines.push(`${regionForZone(zoneIndex)},${synthSystemId}_p,synth zone ${zoneIndex}`);
}

writeFileSync(resolve(ROOT, 'tables/content/mineral_region_members.csv'), `${lines.join('\n')}\n`, 'utf8');
console.log(`[gen-mineral-region-members] ${lines.length - 1} rows`);
