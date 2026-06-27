/**
 * 행성개발 비용 곡선 v2.0.2 — play_scenario_economy · 시작 500 Cr · 인플레이션 싱크
 *
 * - Lv1: 시작 어드밴티지 (무역소 500 Cr 앵커, 시설 간 v2.0 상대비 유지)
 * - Lv2~10: v2.0 원가 × 레벨 tier 배율 (초반 저·후반 고 — flat 0.01 아님)
 * - instant: v2.0 instant/upgrade 비율 유지
 * - 방위 dailyUpkeep: endgame은 v2.0 근접, early는 완만
 *
 * play_scenario 앵커 (1행성 기준 upgrade 1회 의사결정):
 *   zone3 ~5k · zone5 ~20k · zone9 ~150k · zone18 ~1.5M
 */
import fs from 'fs';
import path from 'path';

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

function escCsvField(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function serializeCsvRows(rows) {
  return `${rows.map((row) => row.map(escCsvField).join(',')).join('\n')}\n`;
}

const ROOT = path.resolve(import.meta.dirname, '../..');
const BALANCE = path.join(ROOT, 'tables/balance');

/** v2.0 정본 (CSV 2026-06-17) */
const V20 = {
  trade_port: {
    l1Install: 50_000,
    l1Instant: 25_000,
    upgrade: [0, 0, 150_000, 400_000, 900_000, 2_000_000, 4_000_000, 8_000_000, 15_000_000, 25_000_000, 50_000_000],
    instant: [0, 0, 60_000, 160_000, 360_000, 800_000, 1_600_000, 3_200_000, 6_000_000, 10_000_000, 20_000_000],
  },
  shipyard: {
    l1Install: 80_000,
    l1Instant: 40_000,
    upgrade: [0, 0, 250_000, 700_000, 1_500_000, 3_500_000, 7_000_000, 14_000_000, 28_000_000, 60_000_000, 120_000_000],
    instant: [0, 0, 100_000, 280_000, 600_000, 1_400_000, 2_800_000, 5_600_000, 11_200_000, 24_000_000, 48_000_000],
  },
  tavern: {
    l1Install: 80_000,
    l1Instant: 40_000,
    upgrade: [0, 0, 200_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000, 20_000_000, 40_000_000, 80_000_000],
    instant: [0, 0, 80_000, 200_000, 400_000, 1_000_000, 2_000_000, 4_000_000, 8_000_000, 16_000_000, 32_000_000],
  },
  laboratory: {
    l1Install: 200_000,
    l1Instant: 100_000,
    upgrade: [0, 0, 500_000, 1_200_000, 2_500_000, 5_000_000, 10_000_000, 20_000_000, 40_000_000, 75_000_000, 150_000_000],
    instant: [0, 0, 200_000, 480_000, 1_000_000, 2_000_000, 4_000_000, 8_000_000, 16_000_000, 30_000_000, 60_000_000],
  },
  defense: {
    l1Install: 100_000,
    l1Instant: 50_000,
    upgrade: [0, 0, 300_000, 800_000, 2_000_000, 5_000_000, 10_000_000, 20_000_000, 40_000_000, 80_000_000, 150_000_000],
    instant: [0, 0, 120_000, 320_000, 800_000, 2_000_000, 4_000_000, 8_000_000, 16_000_000, 32_000_000, 60_000_000],
    upkeep: [0, 100, 224, 372, 544, 740, 960, 1204, 1472, 1764, 2080],
  },
};

/** Lv1 install 앵커 (무역소=시작자금 500) */
const L1_ANCHOR = {
  trade_port: 500,
  shipyard: 800,
  tavern: 800,
  laboratory: 2000,
  defense: 1000,
};

/** 레벨 tier — v2.0 대비 배율 (후반으로 갈수록 인플레 싱크 강화) */
const TIER_MULT = {
  1: 0.01,
  2: 0.018,
  3: 0.018,
  4: 0.032,
  5: 0.032,
  6: 0.055,
  7: 0.055,
  8: 0.09,
  9: 0.09,
  10: 0.14,
};

const roundCr = (n) => Math.max(0, Math.round(n));

function scaleUpgrade(v20Upgrade, level) {
  return roundCr(v20Upgrade * TIER_MULT[level]);
}

function scaleInstant(v20Upgrade, v20Instant, newUpgrade) {
  if (v20Upgrade <= 0 || newUpgrade <= 0) return 0;
  return roundCr(newUpgrade * (v20Instant / v20Upgrade));
}

function scaleUpkeep(v20Upkeep, level) {
  const tMax = TIER_MULT[10];
  const blend = 0.2 + 0.8 * (TIER_MULT[level] / tMax);
  return roundCr(v20Upkeep * blend);
}

function l1InstantFromAnchor(anchor, v20Install, v20Instant) {
  return roundCr(anchor * (v20Instant / v20Install));
}

function buildFacilityCosts(key) {
  const src = V20[key === 'defense' ? 'defense' : key];
  const anchor = L1_ANCHOR[key === 'defense' ? 'defense' : key];
  const rows = [];
  for (let lv = 1; lv <= 10; lv += 1) {
    const install = lv === 1 ? anchor : 0;
    const upgrade = lv === 1 ? 0 : scaleUpgrade(src.upgrade[lv], lv);
    const instant =
      lv === 1
        ? l1InstantFromAnchor(anchor, src.l1Install, src.l1Instant)
        : scaleInstant(src.upgrade[lv], src.instant[lv], upgrade);
    rows.push({ level: lv, installCostCredits: install, upgradeCostCredits: upgrade, instantUpgradeCostCredits: instant });
  }
  return rows;
}

function patchCsvNumericColumns(filePath, rowPatcher) {
  const raw = fs.readFileSync(filePath, 'utf8').trimEnd();
  const lines = raw.split(/\r?\n/);
  const header = lines[0].split(',');
  const levelIdx = header.indexOf('level');
  const out = [lines[0]];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split(',');
    const lv = Number.parseInt(cols[levelIdx], 10);
    const patched = rowPatcher(lv, cols, header);
    out.push(patched.join(','));
  }
  fs.writeFileSync(filePath, `${out.join('\n')}\n`, 'utf8');
}

const trade = buildFacilityCosts('trade_port');
patchCsvNumericColumns(path.join(BALANCE, 'facility_trade_port_level_policy.csv'), (lv, cols, header) => {
  const r = trade[lv - 1];
  cols[header.indexOf('installCostCredits')] = String(r.installCostCredits);
  cols[header.indexOf('upgradeCostCredits')] = String(r.upgradeCostCredits);
  cols[header.indexOf('instantUpgradeCostCredits')] = String(r.instantUpgradeCostCredits);
  return cols;
});

const shipyard = buildFacilityCosts('shipyard');
patchCsvNumericColumns(path.join(BALANCE, 'facility_shipyard_level_policy.csv'), (lv, cols, header) => {
  const r = shipyard[lv - 1];
  cols[header.indexOf('installCostCredits')] = String(r.installCostCredits);
  cols[header.indexOf('upgradeCostCredits')] = String(r.upgradeCostCredits);
  cols[header.indexOf('instantUpgradeCostCredits')] = String(r.instantUpgradeCostCredits);
  return cols;
});

const tavern = buildFacilityCosts('tavern');
patchCsvNumericColumns(path.join(BALANCE, 'facility_tavern_level_policy.csv'), (lv, cols, header) => {
  const r = tavern[lv - 1];
  cols[header.indexOf('installCostCredits')] = String(r.installCostCredits);
  cols[header.indexOf('upgradeCostCredits')] = String(r.upgradeCostCredits);
  cols[header.indexOf('instantUpgradeCostCredits')] = String(r.instantUpgradeCostCredits);
  return cols;
});

const lab = buildFacilityCosts('laboratory');
patchCsvNumericColumns(path.join(BALANCE, 'facility_laboratory_level_policy.csv'), (lv, cols, header) => {
  const r = lab[lv - 1];
  cols[header.indexOf('installCostCredits')] = String(r.installCostCredits);
  cols[header.indexOf('upgradeCostCredits')] = String(r.upgradeCostCredits);
  cols[header.indexOf('instantUpgradeCostCredits')] = String(r.instantUpgradeCostCredits);
  return cols;
});

const defense = buildFacilityCosts('defense');
patchCsvNumericColumns(path.join(BALANCE, 'planet_defense_satellite_level_policy.csv'), (lv, cols, header) => {
  const r = defense[lv - 1];
  cols[header.indexOf('installCostCredits')] = String(r.installCostCredits);
  cols[header.indexOf('upgradeCostCredits')] = String(r.upgradeCostCredits);
  cols[header.indexOf('instantUpgradeCostCredits')] = String(r.instantUpgradeCostCredits);
  cols[header.indexOf('dailyUpkeepCredits')] = String(scaleUpkeep(V20.defense.upkeep[lv], lv));
  return cols;
});

const catalogPath = path.join(BALANCE, 'planet_development_catalog.csv');
const catalogParsed = parseCsv(fs.readFileSync(catalogPath, 'utf8').trimEnd());
const catHeader = catalogParsed[0].map((h) => String(h).replace(/^\uFEFF/, ''));
const idIdx = catHeader.indexOf('id');
const costIdx = catHeader.indexOf('installCostCredits');
const catalogCostById = {
  dev_trade_port: L1_ANCHOR.trade_port,
  dev_orbit_shipyard: L1_ANCHOR.shipyard,
  dev_population_dome: L1_ANCHOR.tavern,
  dev_research_lab: L1_ANCHOR.laboratory,
};
for (let i = 1; i < catalogParsed.length; i += 1) {
  const cols = catalogParsed[i];
  const id = cols[idIdx];
  if (catalogCostById[id] != null) cols[costIdx] = String(catalogCostById[id]);
}
fs.writeFileSync(catalogPath, serializeCsvRows(catalogParsed), 'utf8');

function sumPath(rows) {
  return rows.reduce((s, r) => s + r.installCostCredits + r.upgradeCostCredits, 0);
}

const report = {
  version: 'v2.0.2-tier-curve',
  l1Anchor: L1_ANCHOR,
  tierMult: TIER_MULT,
  perFacilityMaxCr: {
    trade_port: sumPath(trade),
    shipyard: sumPath(shipyard),
    tavern: sumPath(tavern),
    laboratory: sumPath(lab),
    defense: sumPath(defense),
  },
  tradePortUpgradeSteps: trade.slice(1).map((r) => r.upgradeCostCredits),
  playScenarioBands: { zone3: 5000, zone5: 20000, zone9: 150000, zone18: 1500000 },
};

const reportPath = path.join(ROOT, 'tools/balance-tables/reports/planet-dev-cost-curve-v2.0.2.json');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

console.log('[planet-dev-cost-curve v2.0.2] applied');
console.log(JSON.stringify(report, null, 2));
