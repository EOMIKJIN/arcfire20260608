'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  parseLogcatPid,
  parseLogcatClock,
  auditCloseEvent,
  dedupeRetentionResults,
  auditRetention,
} = require('./retentionAuditCore.cjs');
const { splitSessions, classifySession, auditSessionFloors } = require('./sessionFloorCore.cjs');

const TH = {
  recoveryWindowMin: 15,
  minSamplesAfterClose: 2,
  glRecoverMinDeltaMb: 12,
  pssRetainedWarnMb: 35,
  nativeRetainedWarnMb: 25,
  viewsDuplicateTreeMin: 450,
  baselineStaleMaxMin: 3,
  coldViewsMax: 50,
};

function sample(overrides) {
  return {
    timeMs: 1_000_000,
    pid: '100',
    pssMb: 500,
    nativeMb: 200,
    views: 300,
    glMb: 40,
    stage: 'planet_hub',
    event: 'tick',
    ...overrides,
  };
}

describe('logcat parse', () => {
  it('reads pid and full timestamp', () => {
    const line =
      '09-20 19:52:23.282 31917 32354 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=42.3';
    assert.equal(parseLogcatPid(line), '31917');
    assert.equal(parseLogcatClock(line, '2026'), Date.parse('2026-09-20T19:52:23.282'));
  });
});

describe('D-1 same pid', () => {
  it('does not use another pid as baseline/after', () => {
    const close = { timeMs: 1_800_000, pid: '100', stage: 'planet_hub', event: 'route_blur' };
    const samples = [
      sample({ timeMs: 1_700_000, pid: '100', pssMb: 500, views: 300 }),
      sample({ timeMs: 1_750_000, pid: '100', pssMb: 505, views: 300 }),
      sample({ timeMs: 1_760_000, pid: '999', pssMb: 200, views: 20 }),
      sample({ timeMs: 1_850_000, pid: '999', pssMb: 210, views: 20 }),
      sample({ timeMs: 1_900_000, pid: '100', pssMb: 510, views: 300 }),
      sample({ timeMs: 2_000_000, pid: '100', pssMb: 508, views: 300 }),
    ];
    const r = auditCloseEvent(close, samples, TH);
    assert.equal(r.status, 'PASS');
    assert.equal(r.baseline.pssMb, 505);
    assert.ok(r.pssDelta < 35);
  });
});

describe('D-2 cold baseline', () => {
  it('skips views<50 cold start as baseline', () => {
    const close = { timeMs: 1_800_000, pid: '100', stage: 'planet_hub', event: 'route_blur' };
    const samples = [
      sample({ timeMs: 1_700_000, pid: '100', pssMb: 463.6, views: 13 }),
      sample({ timeMs: 1_790_000, pid: '100', pssMb: 463.6, views: 13 }),
      sample({ timeMs: 1_900_000, pid: '100', pssMb: 670, views: 300 }),
      sample({ timeMs: 2_000_000, pid: '100', pssMb: 668, views: 300 }),
    ];
    const r = auditCloseEvent(close, samples, TH);
    assert.equal(r.status, 'INSUFFICIENT_SAMPLES');
    assert.equal(r.reason, 'cold_baseline');
  });
});

describe('D-3 stale baseline', () => {
  it('rejects baseline older than 3 minutes', () => {
    const close = { timeMs: 2_000_000, pid: '100', stage: 'planet_hub', event: 'route_blur' };
    const samples = [
      sample({ timeMs: 1_000_000, pid: '100', pssMb: 500, views: 300 }),
      sample({ timeMs: 1_100_000, pid: '100', pssMb: 500, views: 300 }),
      sample({ timeMs: 2_100_000, pid: '100', pssMb: 700, views: 300 }),
      sample({ timeMs: 2_200_000, pid: '100', pssMb: 690, views: 300 }),
    ];
    const r = auditCloseEvent(close, samples, TH);
    assert.equal(r.status, 'INSUFFICIENT_SAMPLES');
    assert.equal(r.reason, 'stale_baseline');
  });
});

describe('D-4 pair dedupe', () => {
  it('collapses identical measurement pairs', () => {
    const a = {
      status: 'RETENTION_FAIL',
      close: { pid: '100' },
      baseline: { pssMb: 500.04 },
      afterPssMin: 706.3,
      afterNatMin: 220.1,
      flags: ['PSS_FLOOR_UP'],
    };
    const b = { ...a, close: { pid: '100', stage: 'other' } };
    const out = dedupeRetentionResults([a, b]);
    assert.equal(out.length, 1);
  });
});

describe('original GL flag', () => {
  it('flags GL when drop is below recover delta and baseline GL>40', () => {
    const close = { timeMs: 1_800_000, pid: '100', stage: 'planet_hub', event: 'route_blur' };
    const samples = [
      sample({ timeMs: 1_700_000, glMb: 80, pssMb: 500, views: 300 }),
      sample({ timeMs: 1_750_000, glMb: 80, pssMb: 500, views: 300 }),
      sample({ timeMs: 1_900_000, glMb: 75, pssMb: 502, views: 300 }),
      sample({ timeMs: 2_000_000, glMb: 74, pssMb: 501, views: 300 }),
    ];
    const r = auditCloseEvent(close, samples, TH);
    assert.equal(r.status, 'RETENTION_FAIL');
    assert.ok(r.flags.some((f) => f.startsWith('GL_NOT_RECOVERED')));
  });
});

describe('session floor', () => {
  it('splits pid reuse after 20min gap', () => {
    const t0 = Date.parse('2026-09-20T00:00:00Z');
    const rows = [
      { timeMs: t0, pid: '1', pssMb: 400 },
      { timeMs: t0 + 60_000, pid: '1', pssMb: 401 },
      { timeMs: t0 + 25 * 60_000, pid: '1', pssMb: 800 },
    ];
    const sessions = splitSessions(rows, 20 * 60 * 1000);
    assert.equal(sessions.length, 2);
  });

  it('classifies rising floor as STAIRCASE', () => {
    const t0 = Date.parse('2026-09-20T00:00:00Z');
    const rows = [];
    for (let i = 0; i < 60; i += 1) {
      rows.push({
        timeMs: t0 + i * 60_000,
        pid: '7',
        pssMb: 400 + i * 3,
        views: 300,
      });
    }
    const c = classifySession({ pid: '7', rows });
    assert.equal(c.class, 'STAIRCASE');
    assert.ok(c.span >= 40);
    assert.ok(c.retain >= 0.7);
  });

  it('FAIL only on recent staircase', () => {
    const now = Date.parse('2026-09-27T00:00:00Z');
    const old0 = Date.parse('2026-07-01T00:00:00Z');
    const new0 = Date.parse('2026-09-25T00:00:00Z');
    const mk = (t0, pid) => {
      const rows = [];
      for (let i = 0; i < 60; i += 1) {
        rows.push({ timeMs: t0 + i * 60_000, pid, pssMb: 400 + i * 3, views: 300 });
      }
      return rows;
    };
    const oldOnly = auditSessionFloors(mk(old0, '1'), { nowMs: now });
    assert.equal(oldOnly.verdict, 'PASS');
    assert.equal(oldOnly.counts.STAIRCASE, 1);
    const recent = auditSessionFloors(mk(new0, '2'), { nowMs: now });
    assert.equal(recent.verdict, 'FAIL');
    assert.equal(recent.recentStairs.length, 1);
  });
});

describe('auditRetention wiring', () => {
  it('infers logcat pid from nearby sample', () => {
    const memRows = [
      { iso_time: '2026-09-20 19:51:53', pid: '31917', pss_mb: '520', views: '280', gl_mb: '40', native_heap_mb: '200' },
      { iso_time: '2026-09-20 19:52:13', pid: '31917', pss_mb: '522', views: '280', gl_mb: '40', native_heap_mb: '200' },
      { iso_time: '2026-09-20 19:53:23', pid: '31917', pss_mb: '525', views: '280', gl_mb: '40', native_heap_mb: '200' },
      { iso_time: '2026-09-20 19:54:23', pid: '31917', pss_mb: '524', views: '280', gl_mb: '40', native_heap_mb: '200' },
    ];
    const logcatText =
      '09-20 19:52:23.282 31917 32354 I ReactNativeJS: [MEM_PROFILE] stage=planet_hub event=route_blur hermes_mb=42.3';
    const { results } = auditRetention({
      profileRows: [],
      memRows,
      logcatText,
      thresholds: TH,
    });
    const judged = results.filter((r) => r.status !== 'INSUFFICIENT_SAMPLES');
    assert.equal(judged.length, 1);
    assert.equal(judged[0].close.pid, '31917');
    assert.equal(judged[0].status, 'PASS');
  });
});
