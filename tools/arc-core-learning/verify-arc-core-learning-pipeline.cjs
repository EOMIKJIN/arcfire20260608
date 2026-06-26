#!/usr/bin/env node
/**
 * ArcCore 학습·RTDB 파이프라인 안정성 검증 (로컬 · 네트워크 선택)
 *
 * Usage: npm run arc-core:learning:verify
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const failures = [];

function check(name, fn) {
  try {
    fn();
    console.log(`[verify] PASS ${name}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    failures.push(`${name}: ${msg}`);
    console.error(`[verify] FAIL ${name}: ${msg}`);
  }
}

function mustExist(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) throw new Error(`missing ${rel}`);
}

function run(cmd, args) {
  execFileSync(cmd, args, {
    cwd: ROOT,
    stdio: 'pipe',
    shell: process.platform === 'win32',
  });
}

check('source files', () => {
  [
    'src/firebase/firebaseAnonymousAuth.ts',
    'src/firebase/arccoreRtdbSessionFlags.ts',
    'src/arcCore/learning/pushArcCoreDailyKpiToRtdb.ts',
    'src/firebase/fetchArcCoreRtdbOnce.ts',
    'database.rules.json',
    'tools/arc-core-learning/pull-rtdb-device-kpis.cjs',
    'tools/arc-core-learning/merge-rtdb-device-kpis-into-seed.cjs',
    'tools/arc-core-learning/run-arc-core-learning-daily.cjs',
  ].forEach(mustExist);
});

check('tsc client', () => {
  run('npx', ['tsc', '--noEmit', '-p', 'tsconfig.client.json']);
});

check('territorial graph test', () => {
  run('npm', ['run', 'test:territorial-graph']);
});

check('merge-learning-state', () => {
  run('node', ['tools/arc-core-learning/merge-learning-state.cjs']);
  mustExist('tools/arc-core-learning/reports/learning-store-seed.json');
});

check('merge-rtdb-device-kpis (fixture)', () => {
  const fixtureDir = path.join(__dirname, 'reports');
  const fixture = path.join(fixtureDir, 'rtdb-device-kpis-aggregate.json');
  fs.mkdirSync(fixtureDir, { recursive: true });
  fs.writeFileSync(
    fixture,
    JSON.stringify(
      {
        schemaVersion: 1,
        aggregatedAt: Date.now(),
        deviceCount: 1,
        devices: [
          {
            authUid: 'verify-fixture',
            localDeviceId: 'verify-local',
            dayKey: '2026-06-26',
            economy: { windowTradeGross: 100, windowConvoyTrips: 2, planetsReconciled: 3 },
            updatedAt: Date.now(),
          },
        ],
        totals: { windowTradeGross: 100, windowConvoyTrips: 2, planetsReconciled: 3 },
      },
      null,
      2,
    ),
  );
  run('node', ['tools/arc-core-learning/merge-rtdb-device-kpis-into-seed.cjs']);
});

check('publish-policy dry-run', () => {
  run('node', ['tools/arc-core-learning/publish-to-rtdb.cjs', '--dry-run']);
});

check('daily pipeline dry-run', () => {
  run('node', [
    'tools/arc-core-learning/run-arc-core-learning-daily.cjs',
    '--dry-run',
    '--skip-pull',
    '--skip-sim',
  ]);
});

check('RTDB rules learning paths', () => {
  const rules = JSON.parse(fs.readFileSync(path.join(ROOT, 'database.rules.json'), 'utf8'));
  const learning = rules?.rules?.arccore?.learning;
  if (!learning?.global?.['.read']) throw new Error('learning/global read missing');
  const writeRule = learning?.devices?.$uid?.dailyKpi?.['.write'];
  if (typeof writeRule !== 'string' || !writeRule.includes('auth.uid')) {
    throw new Error('dailyKpi auth write rule missing');
  }
});

console.log('');
if (failures.length) {
  console.error(`[verify] ${failures.length} failure(s)`);
  process.exit(1);
}
console.log('[verify] ALL PASS — arc-core learning pipeline');
