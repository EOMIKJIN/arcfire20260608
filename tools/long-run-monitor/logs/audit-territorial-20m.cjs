/**
 * Live audit: contested rotation ~20m (1200s) campaign cycle.
 * Usage: node tools/long-run-monitor/logs/audit-territorial-20m.cjs [RKStorage.db]
 */
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const sqlite = 'C:/Users/eomsp/AppData/Local/Android/Sdk/platform-tools/sqlite3.exe';
const db =
  process.argv[2] ||
  path.join(__dirname, 'RKStorage-live-20260729.db');

const EXPECT_INTERVAL_SEC = 1200;
const TOLERANCE_SEC = 90; // probe 60s + slack
const STATIC_ORDER = [
  'draco_haven',
  'omega_hub',
  'shadow_market',
  'helios_core',
  'titan_ruins',
];

function q(sql) {
  return execFileSync(sqlite, [db, sql], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }).trim();
}

function fmt(ms) {
  if (!ms) return '-';
  return new Date(ms).toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' });
}

function minDiff(a, b) {
  return Math.round((b - a) / 1000);
}

const ter = JSON.parse(q("SELECT value FROM catalystLocalStorage WHERE key='arcfire_arc_core_territorial_combat_v1';"));
const war = JSON.parse(q("SELECT value FROM catalystLocalStorage WHERE key='arcfire_clan_war_foundation_v2';"));
const st = ter.data || ter;
const root = war.data || war;
const byPlanet = st.byPlanetId || {};
const campaign = (st.campaignGroups && st.campaignGroups.draco_front) || null;
const now = Date.now();

console.log('=== dump meta ===');
console.log('db=', db);
console.log('nowKST=', fmt(now));
console.log('expectIntervalSec=', EXPECT_INTERVAL_SEC, '(20m)');

console.log('\n=== campaignGroups.draco_front ===');
console.log(JSON.stringify(campaign, null, 2));
if (campaign) {
  const ageSec = Math.round((now - campaign.lastPassAtMs) / 1000);
  console.log(
    'lastPassKST=',
    fmt(campaign.lastPassAtMs),
    'ageSec=',
    ageSec,
    ageSec <= EXPECT_INTERVAL_SEC + TOLERANCE_SEC ? 'OK_fresh_or_within_window' : 'STALE_over_20m',
  );
}

const rows = Object.entries(byPlanet)
  .map(([planetId, v]) => ({
    planetId,
    lastPassAtMs: v.lastPassAtMs || 0,
    passCountInWindow: v.passCountInWindow,
    windowStartMs: v.windowStartMs,
  }))
  .sort((a, b) => a.lastPassAtMs - b.lastPassAtMs);

console.log('\n=== byPlanetId lastPass (chrono) ===');
for (const r of rows) {
  const age = Math.round((now - r.lastPassAtMs) / 1000);
  console.log(
    fmt(r.lastPassAtMs),
    r.planetId.padEnd(16),
    `age=${String(age).padStart(5)}s`,
    `count=${r.passCountInWindow}`,
  );
}

console.log('\n=== consecutive gaps (sorted lastPass) ===');
const gaps = [];
for (let i = 1; i < rows.length; i++) {
  const sec = minDiff(rows[i - 1].lastPassAtMs, rows[i].lastPassAtMs);
  gaps.push(sec);
  const ok =
    Math.abs(sec - EXPECT_INTERVAL_SEC) <= TOLERANCE_SEC
      ? 'PASS~20m'
      : Math.abs(sec - 3600) <= TOLERANCE_SEC
        ? 'LEGACY~1h'
        : 'OTHER';
  console.log(
    `${rows[i - 1].planetId} → ${rows[i].planetId}: ${sec}s (${(sec / 60).toFixed(1)}m) [${ok}]`,
  );
}

// Full-cycle estimate: time between earliest and latest among STATIC_ORDER planets
const staticRows = STATIC_ORDER.map((id) => rows.find((r) => r.planetId === id)).filter(Boolean);
console.log('\n=== static contested 5 (policy order) lastPass ===');
for (const id of STATIC_ORDER) {
  const r = byPlanet[id];
  if (!r) {
    console.log(id, 'MISSING');
    continue;
  }
  console.log(id.padEnd(16), fmt(r.lastPassAtMs), `age=${Math.round((now - r.lastPassAtMs) / 1000)}s`);
}

if (staticRows.length >= 2) {
  const span = minDiff(staticRows[0].lastPassAtMs, staticRows[staticRows.length - 1].lastPassAtMs);
  console.log(
    '\nspan earliest→latest among static5 (chrono of lastPass values):',
    span,
    's =',
    (span / 60).toFixed(1),
    'm',
  );
  console.log(
    'ideal full static rotation span for 5 planets @20m each step ≈',
    4 * EXPECT_INTERVAL_SEC,
    's (80m) between first and fifth in one cycle',
  );
}

// Infer rotation order from lastPass chronology among STATIC + dynamics
const chronoIds = rows.map((r) => r.planetId);
console.log('\n=== observed lastPass order (oldest→newest) ===');
console.log(chronoIds.join(' → '));

// Check if static members appear as sequential campaign steps (~20m apart) when sorted by lastPass
const staticChrono = rows.filter((r) => STATIC_ORDER.includes(r.planetId));
console.log('\n=== static-only chrono ===');
console.log(staticChrono.map((r) => r.planetId).join(' → '));
let staticGapsOk = 0;
let staticGapsBad = 0;
for (let i = 1; i < staticChrono.length; i++) {
  const sec = minDiff(staticChrono[i - 1].lastPassAtMs, staticChrono[i].lastPassAtMs);
  const ok = Math.abs(sec - EXPECT_INTERVAL_SEC) <= TOLERANCE_SEC;
  if (ok) staticGapsOk++;
  else staticGapsBad++;
  console.log(
    `${staticChrono[i - 1].planetId} → ${staticChrono[i].planetId}: ${sec}s [${ok ? 'PASS~20m' : 'FAIL'}]`,
  );
}

// Recent territorial ops from war foundation
const ops = (root.operations || []).filter((o) => o.ext && o.ext.source === 'arc_core_territorial');
const recent = ops
  .slice()
  .sort((a, b) => (a.startedAt || 0) - (b.startedAt || 0))
  .slice(-40);

console.log('\n=== recent arc_core_territorial ops (last 40, chrono) ===');
const opByPlanet = {};
for (const o of recent) {
  const t = o.startedAt || o.updatedAt || 0;
  const ext = o.ext || {};
  const line = `${fmt(t)} ${String(o.targetPlanetId).padEnd(16)} dec=${ext.decision} ${ext.previousSide}->${ext.newSide || ext.factionSide || '-'}`;
  console.log(line);
  const pid = o.targetPlanetId;
  if (!opByPlanet[pid]) opByPlanet[pid] = [];
  opByPlanet[pid].push(t);
}

console.log('\n=== per-planet op gaps (same planet, last few) ===');
for (const pid of [...STATIC_ORDER, 'sirius_border']) {
  const ts = (opByPlanet[pid] || []).slice().sort((a, b) => a - b);
  if (ts.length < 2) {
    console.log(pid, 'ops_in_window=', ts.length);
    continue;
  }
  for (let i = 1; i < ts.length; i++) {
    const sec = minDiff(ts[i - 1], ts[i]);
    const ok =
      Math.abs(sec - EXPECT_INTERVAL_SEC * STATIC_ORDER.length) <= TOLERANCE_SEC * 2 ||
      Math.abs(sec - EXPECT_INTERVAL_SEC) <= TOLERANCE_SEC ||
      Math.abs(sec - 3600 * STATIC_ORDER.length) <= 180
        ? `note=${(sec / 60).toFixed(1)}m`
        : `gap=${(sec / 60).toFixed(1)}m`;
    // Same planet should recur every full campaign length (~ N * 20m if N members)
    console.log(pid, `${(sec / 60).toFixed(1)}m between ops [${ok}]`);
  }
}

const gapVerdict =
  staticGapsOk >= 2 && staticGapsBad === 0
    ? 'PASS'
    : staticGapsOk > 0
      ? 'PARTIAL'
      : gaps.some((g) => Math.abs(g - EXPECT_INTERVAL_SEC) <= TOLERANCE_SEC)
        ? 'PASS_MIXED'
        : 'FAIL';

console.log('\n=== VERDICT ===');
console.log(
  JSON.stringify(
    {
      expectIntervalSec: EXPECT_INTERVAL_SEC,
      campaignLastOrderIndex: campaign && campaign.lastOrderIndex,
      campaignNextPreview: campaign && campaign.nextPreviewOrderIndex,
      staticGapsOk,
      staticGapsBad,
      chronoOrder: chronoIds,
      gapVerdict,
      note:
        'Campaign runs 1 planet per passInterval. Full static5 cycle ≈ 100m (5×20m). Same-planet revisit ≈ campaign length.',
    },
    null,
    2,
  ),
);

fs.writeFileSync(
  path.join(__dirname, 'territorial-20m-audit-out.json'),
  JSON.stringify(
    {
      now,
      campaign,
      byPlanet,
      rows,
      gaps,
      staticGapsOk,
      staticGapsBad,
      gapVerdict,
      chronoIds,
    },
    null,
    2,
  ),
);
console.log('\nwrote territorial-20m-audit-out.json');
