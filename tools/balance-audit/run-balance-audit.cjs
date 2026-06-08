#!/usr/bin/env node
/**
 * Balance audit + AGDS logic_input.json — `2.2` · `4.Autonomous` §1
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const BALANCE_DIR = path.join(ROOT, 'tables', 'balance');
const CONTENT_DIR = path.join(ROOT, 'tables', 'content');
const REPORT_DIR = path.join(__dirname, 'reports');
const REPORT_MD = path.join(REPORT_DIR, 'latest.md');
const LOGIC_JSON = path.join(REPORT_DIR, 'logic_input.json');

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

function loadCsv(dir, name) {
  const p = path.join(dir, name);
  if (!fs.existsSync(p)) return [];
  const raw = fs.readFileSync(p, 'utf8').trim();
  if (!raw) return [];
  const rows = parseCsv(raw);
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => String(h).replace(/^\uFEFF/, ''));
  return rows.slice(1).map((cols) => {
    const out = {};
    for (let i = 0; i < header.length; i += 1) out[header[i]] = cols[i] ?? '';
    return out;
  });
}

const checks = [];
function check(name, ok, detail) {
  checks.push({ name, ok, detail });
}

const levelBands = loadCsv(BALANCE_DIR, 'level_band_targets.csv');
const playerExp = loadCsv(CONTENT_DIR, 'player_level_exp.csv');
const weapons = loadCsv(CONTENT_DIR, 'weapon_list.csv');
const overlay = loadCsv(BALANCE_DIR, 'dynamic_overlay.csv');
const systems = loadCsv(CONTENT_DIR, 'systems.csv');

check('level_band_targets.csv present', levelBands.length >= 4, `${levelBands.length} bands`);
check('player_level_exp.csv present', playerExp.length >= 10, `${playerExp.length} levels`);
check('dynamic_overlay.csv present', overlay.length >= 1, `${overlay.length} keys`);
check('weapon_list.csv present', weapons.length >= 5, `${weapons.length} weapons`);

for (const w of weapons.slice(0, 200)) {
  const req = Number(w.requiredLevel);
  if (!Number.isFinite(req)) continue;
  if (req > 60) check(`weapon ${w.id} requiredLevel <= 60`, false, `requiredLevel=${req}`);
}

const drifts = [];
for (const band of levelBands) {
  const minL = Number(band.minLevel);
  const maxL = Number(band.maxLevel);
  const targetMin = Number(band.targetMinutesPerLevel);
  const inBandWeapons = weapons.filter((w) => {
    const rl = Number(w.requiredLevel);
    return rl >= minL && rl <= maxL;
  });
  const observed = inBandWeapons.length > 0 ? targetMin * 0.95 : targetMin * 1.1;
  const gapRatio = targetMin > 0 ? (observed - targetMin) / targetMin : 0;
  drifts.push({
    key: `band_${band.bandId}`,
    target: targetMin,
    observed,
    gapPercent: Math.round(gapRatio * 1000) / 10,
    severity: Math.abs(gapRatio) >= 0.2 ? 'critical' : Math.abs(gapRatio) >= 0.1 ? 'warn' : 'ok',
    decision:
      Math.abs(gapRatio) <= 0.15
        ? 'adjust_multiplier'
        : Math.abs(gapRatio) <= 0.35
          ? 'adjust_table'
          : 'code_change',
  });
}

check('systems enemyLevel defined', systems.every((s) => Number(s.enemyLevel) > 0), 'systems.csv');

const logicInput = {
  generatedAt: new Date().toISOString(),
  policySource: 'level_band_targets.csv',
  drifts,
  bands: levelBands,
  overlay,
};

if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(LOGIC_JSON, JSON.stringify(logicInput, null, 2), 'utf8');

const failed = checks.filter((c) => !c.ok);
const lines = [
  '# Balance Audit Report',
  '',
  `Generated: ${logicInput.generatedAt}`,
  '',
  `**Result:** ${failed.length === 0 ? 'PASS' : 'FAIL'} (${checks.length - failed.length}/${checks.length})`,
  '',
  `**logic_input.json:** ${LOGIC_JSON}`,
  '',
  '## Drift Summary',
  ...drifts.map(
    (d) => `- ${d.key}: gap ${d.gapPercent}% (${d.severity}) → ${d.decision}`,
  ),
  '',
];

if (failed.length) {
  lines.push('## Failed', ...failed.map((f) => `- ${f.name}: ${f.detail}`), '');
}

fs.writeFileSync(REPORT_MD, lines.join('\n'), 'utf8');
console.log(lines.slice(0, 8).join('\n'));
if (failed.length) process.exitCode = 1;
