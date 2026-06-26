#!/usr/bin/env node
/**
 * balance-ops learning-state.json → arc-core learning store seed JSON
 * RN 부트 없이 CI/로컬 audit KPI를 learning 스키마로 변환한다.
 *
 * Usage: node tools/arc-core-learning/merge-learning-state.cjs
 * Output: tools/arc-core-learning/reports/learning-store-seed.json
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const LEARNING_STATE = path.join(ROOT, 'tools/balance-ops-audit/reports/learning-state.json');
const OUT_DIR = path.join(__dirname, 'reports');
const OUT_JSON = path.join(OUT_DIR, 'learning-store-seed.json');

function readJson(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

function main() {
  const state = readJson(LEARNING_STATE, null);
  if (!state || !Array.isArray(state.snapshots) || state.snapshots.length === 0) {
    console.error('[arc-core-learning] learning-state.json missing or empty');
    process.exit(1);
  }

  const snapshots = state.snapshots;
  const kpiTimeline = snapshots.slice(-90).map((snap) => {
    const ts = snap.timestamp ?? new Date().toISOString();
    const dayKey = ts.slice(0, 10);
    return {
      dayKey,
      economy: {
        f2pWhaleRatio: snap.whaleF2pRatio,
        simKpiStatus: snap.kpiStatus,
        deltaId: snap.deltaId ?? null,
        bandDrift: snap.maxGapPercent,
      },
      combat: {},
      _source: { timestamp: ts, overall: snap.overall },
    };
  });

  const last = snapshots[snapshots.length - 1];
  const seed = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: 'tools/balance-ops-audit/reports/learning-state.json',
    observations: { tail: [], lastFlushDayKey: null },
    simRuns: [],
    kpiTimeline,
    policyHistory: last.deltaId
      ? [{ packId: last.deltaId, ingestedAt: Date.now(), source: 'ci' }]
      : [],
    lastInsights: state.lastInsights ?? [],
    lastUpdatedAt: Date.now(),
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(seed, null, 2), 'utf8');
  console.log(
    `[arc-core-learning] merged ${kpiTimeline.length} KPI entries → ${path.relative(ROOT, OUT_JSON)}`,
  );
}

main();
