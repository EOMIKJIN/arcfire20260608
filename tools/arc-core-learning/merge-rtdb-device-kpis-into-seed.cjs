#!/usr/bin/env node
/**
 * RTDB device KPI aggregate → learning-store-seed.json kpiTimeline 병합
 *
 * Usage: node tools/arc-core-learning/merge-rtdb-device-kpis-into-seed.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const AGG = path.join(__dirname, 'reports/rtdb-device-kpis-aggregate.json');
const SEED = path.join(__dirname, 'reports/learning-store-seed.json');

function readJson(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

function kstDayKey(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function main() {
  const aggregate = readJson(AGG, null);
  if (!aggregate || !Array.isArray(aggregate.devices)) {
    console.log('[arc-core-learning] device KPI aggregate 없음 — skip');
    return;
  }

  const dayKey = kstDayKey();
  const seed =
    readJson(SEED, null) ??
    ({
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      source: 'merge-rtdb-device-kpis',
      observations: { tail: [], lastFlushDayKey: null },
      simRuns: [],
      kpiTimeline: [],
      policyHistory: [],
      lastInsights: [],
      lastUpdatedAt: Date.now(),
    });

  const entry = {
    dayKey,
    economy: {
      source: 'rtdb_devices',
      deviceCount: aggregate.deviceCount ?? aggregate.devices.length,
      windowTradeGross: aggregate.totals?.windowTradeGross ?? 0,
      windowConvoyTrips: aggregate.totals?.windowConvoyTrips ?? 0,
      planetsReconciled: aggregate.totals?.planetsReconciled ?? 0,
      aggregatedAt: aggregate.aggregatedAt ?? Date.now(),
    },
    combat: {},
  };

  const timeline = Array.isArray(seed.kpiTimeline) ? [...seed.kpiTimeline] : [];
  const idx = timeline.findIndex(
    (row) => row?.dayKey === dayKey && row?.economy?.source === 'rtdb_devices',
  );
  if (idx >= 0) timeline[idx] = entry;
  else timeline.push(entry);

  seed.kpiTimeline = timeline.slice(-90);
  seed.lastUpdatedAt = Date.now();
  seed.deviceKpiAggregate = {
    dayKey,
    deviceCount: entry.economy.deviceCount,
    totals: aggregate.totals ?? {},
    pulledAt: aggregate.aggregatedAt ?? Date.now(),
  };

  fs.mkdirSync(path.dirname(SEED), { recursive: true });
  fs.writeFileSync(SEED, JSON.stringify(seed, null, 2), 'utf8');
  console.log(
    `[arc-core-learning] merged device KPIs devices=${entry.economy.deviceCount} day=${dayKey} → ${path.relative(ROOT, SEED)}`,
  );
}

main();
