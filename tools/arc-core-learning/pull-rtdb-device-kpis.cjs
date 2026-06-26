#!/usr/bin/env node
/**
 * RTDB arccore/learning/devices/{uid}/dailyKpi → 집계 JSON (CI 학습 입력)
 *
 * Prerequisites: firebase login · firebase use arcfire-49d69
 *
 * Usage:
 *   npm run arc-core:rtdb:pull-kpis
 *   npm run arc-core:rtdb:pull-kpis -- --dry-run
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const OUT = path.join(ROOT, 'tools/arc-core-learning/reports/rtdb-device-kpis-aggregate.json');
const dryRun = process.argv.includes('--dry-run');

function main() {
  let raw = '';
  try {
    raw = execFileSync(
      'firebase',
      ['database:get', '/arccore/learning/devices', '--project', 'arcfire-49d69'],
      { cwd: ROOT, encoding: 'utf8', shell: process.platform === 'win32' },
    );
  } catch (e) {
    console.error('[arc-core-rtdb] pull failed — firebase login & rules 확인');
    process.exit(1);
  }

  if (raw.trim() === 'null' || !raw.trim()) {
    console.log('[arc-core-rtdb] no device KPI data yet');
    if (!dryRun) {
      fs.mkdirSync(path.dirname(OUT), { recursive: true });
      fs.writeFileSync(OUT, JSON.stringify({ devices: [], aggregatedAt: Date.now() }, null, 2));
    }
    return;
  }

  const devicesTree = JSON.parse(raw);
  const devices = [];
  for (const [authUid, node] of Object.entries(devicesTree)) {
    const kpi = node?.dailyKpi;
    if (!kpi || typeof kpi !== 'object') continue;
    devices.push({
      authUid,
      localDeviceId: typeof kpi.localDeviceId === 'string' ? kpi.localDeviceId : null,
      dayKey: kpi.dayKey,
      economy: kpi.economy ?? {},
      updatedAt: kpi.updatedAt ?? 0,
    });
  }

  const payload = {
    schemaVersion: 1,
    aggregatedAt: Date.now(),
    deviceCount: devices.length,
    devices,
    totals: {
      windowTradeGross: devices.reduce((s, d) => s + (Number(d.economy?.windowTradeGross) || 0), 0),
      windowConvoyTrips: devices.reduce((s, d) => s + (Number(d.economy?.windowConvoyTrips) || 0), 0),
      planetsReconciled: devices.reduce((s, d) => s + (Number(d.economy?.planetsReconciled) || 0), 0),
    },
  };

  if (dryRun) {
    console.log('[arc-core-rtdb] dry-run devices=', devices.length);
    console.log(JSON.stringify(payload.totals, null, 2));
    return;
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
  console.log(`[arc-core-rtdb] pulled ${devices.length} device KPI(s) → ${path.relative(ROOT, OUT)}`);
}

main();
