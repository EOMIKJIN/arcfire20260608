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

const weaponPricePolicy = loadCsv(BALANCE_DIR, 'weapon_trade_base_price_policy.csv');
const weaponPriceKv = Object.fromEntries(weaponPricePolicy.map((r) => [r.key, r.value]));
check(
  'weapon pricing_model integrated_leveling_v2',
  weaponPriceKv.pricing_model === 'integrated_leveling_v2',
  weaponPriceKv.pricing_model ?? 'missing',
);
check(
  'arcCore weaponTradePricing entry',
  fs.existsSync(path.join(ROOT, 'src/arcCore/economy/weaponTradePricing.ts')),
  'src/arcCore/economy/weaponTradePricing.ts',
);
const tradeEngineSrc = fs.readFileSync(path.join(ROOT, 'src/engine/TradeEngine.ts'), 'utf8');
check(
  'TradeEngine imports arcCore weapon pricing',
  tradeEngineSrc.includes('arcCore/economy/weaponTradePricing'),
  'TradeEngine.ts',
);
for (const tbl of [
  'weapon_combat_reference_policy.csv',
  'weapon_family_ttk_balance_policy.csv',
  'weapon_special_combat_balance_policy.csv',
]) {
  check(`weapon balance table ${tbl}`, fs.existsSync(path.join(BALANCE_DIR, tbl)), tbl);
}
const novaRow = weapons.find((w) => w.id === 'w_missile_nova_01');
const stdRow = weapons.find((w) => w.id === 'w_missile_standard_01');
if (novaRow && stdRow) {
  const novaPrice = Number(novaRow['구매가'] ?? novaRow.purchasePrice);
  const stdPrice = Number(stdRow['구매가'] ?? stdRow.purchasePrice);
  check('nova purchasePrice > standard missile', novaPrice > stdPrice, `${novaPrice} vs ${stdPrice}`);
}

for (const w of weapons.slice(0, 200)) {
  const req = Number(w.requiredLevel ?? w['요구레벨']);
  if (!Number.isFinite(req)) continue;
  if (req > 60) check(`weapon ${w.id} requiredLevel <= 60`, false, `requiredLevel=${req}`);
}

function median(nums) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const drifts = [];
for (const band of levelBands) {
  const minL = Number(band.minLevel);
  const maxL = Number(band.maxLevel);
  const targetMin = Number(band.targetMinutesPerLevel);
  const targetCph = Number(band.targetCreditsPerHour);
  const prices = weapons
    .map((w) => {
      const rl = Number(w.requiredLevel ?? w['요구레벨']);
      const price = Number(w.purchasePrice ?? w['구매가']);
      if (!Number.isFinite(rl) || !Number.isFinite(price) || price <= 0) return null;
      if (rl < minL || rl > maxL) return null;
      return price;
    })
    .filter((n) => n != null);
  let observedAffordableGap = 0;
  let observeMethod = 'fallback_no_weapons';
  if (prices.length > 0 && targetCph > 0 && targetMin > 0) {
    const med = median(prices);
    const affordableInBandWindow = targetCph * (targetMin / 60);
    observedAffordableGap = affordableInBandWindow > 0 ? med / affordableInBandWindow : 1;
    observeMethod = 'weapon_median_vs_band_cph_window';
  }
  const gapRatio = observedAffordableGap > 0 ? observedAffordableGap - 1 : 0;
  const observed = Math.round((targetMin * observedAffordableGap) * 100) / 100;
  drifts.push({
    key: `band_${band.bandId}`,
    target: targetMin,
    observed,
    gapPercent: Math.round(gapRatio * 1000) / 10,
    observeMethod,
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
