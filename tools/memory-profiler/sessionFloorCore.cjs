'use strict';

/**
 * 세션 PSS floor 분류 — pid 격리 · 20분 공백 분할 · 워밍 후 10분 rolling min.
 * 관측은 전 기간. FAIL은 최근 창(기본 7일) STAIRCASE만.
 */

const SESSION_GAP_MS = 20 * 60 * 1000;
const WARMUP_FRAC = 0.25;
const ROLL_MS = 10 * 60 * 1000;
const MIN_DUR_MS = 45 * 60 * 1000;
const MIN_POST_SAMPLES = 8;
const STAIR_SPAN_MB = 40;
const STAIR_RETAIN = 0.7;
const SAWTOOTH_RETAIN = 0.4;
const RECENT_MS = 7 * 24 * 60 * 60 * 1000;

function parseNum(v) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function parseTime(v) {
  const t = Date.parse(String(v).replace(' ', 'T'));
  return Number.isFinite(t) ? t : NaN;
}

function loadMemTimeline(csvText) {
  const lines = String(csvText).trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split(',');
    const rec = {};
    headers.forEach((h, idx) => {
      rec[h] = cols[idx] != null ? cols[idx].trim() : '';
    });
    const timeMs = parseTime(rec.iso_time || rec.time || rec.iso || '');
    if (!Number.isFinite(timeMs)) continue;
    rows.push({
      time: rec.iso_time || rec.time || rec.iso || '',
      timeMs,
      pid: rec.pid != null && rec.pid !== '' ? String(rec.pid) : '',
      pssMb: parseNum(rec.pss_mb ?? rec.pssMb),
      views: parseNum(rec.views),
      nativeHeapMb: parseNum(rec.native_heap_mb ?? rec.nativeHeapMb),
      glMb: parseNum(rec.gl_mtrack_mb ?? rec.glMb),
      stage: rec.stage || '',
    });
  }
  return rows;
}

function splitSessions(rows, gapMs = SESSION_GAP_MS) {
  const byPid = new Map();
  for (const r of rows) {
    if (!r.pid) continue;
    if (!byPid.has(r.pid)) byPid.set(r.pid, []);
    byPid.get(r.pid).push(r);
  }
  const sessions = [];
  for (const [pid, list] of byPid) {
    list.sort((a, b) => a.timeMs - b.timeMs);
    let cur = [list[0]];
    for (let i = 1; i < list.length; i += 1) {
      if (list[i].timeMs - list[i - 1].timeMs > gapMs) {
        sessions.push({ pid, rows: cur });
        cur = [list[i]];
      } else {
        cur.push(list[i]);
      }
    }
    sessions.push({ pid, rows: cur });
  }
  sessions.sort((a, b) => a.rows[0].timeMs - b.rows[0].timeMs);
  return sessions;
}

function rollingFloors(post, rollMs = ROLL_MS) {
  const out = [];
  for (let i = 0; i < post.length; i += 1) {
    const t = post[i].timeMs;
    let min = Infinity;
    for (let j = 0; j <= i; j += 1) {
      if (t - post[j].timeMs > rollMs) continue;
      if (post[j].pssMb == null) continue;
      if (post[j].pssMb < min) min = post[j].pssMb;
    }
    if (Number.isFinite(min)) out.push({ timeMs: t, floor: min });
  }
  return out;
}

function classifySession(session, opts = {}) {
  const minDur = opts.minDurMs ?? MIN_DUR_MS;
  const rows = session.rows;
  const t0 = rows[0].timeMs;
  const t1 = rows[rows.length - 1].timeMs;
  const dur = t1 - t0;
  const late = rows.slice(Math.floor(rows.length * 0.7));
  const lateViews = late.map((r) => r.views).filter((n) => n != null);
  const lateViewsMax = lateViews.length ? Math.max(...lateViews) : null;
  const viewsStable =
    lateViews.length >= 2
      ? Math.max(...lateViews) - Math.min(...lateViews) <= 20
      : false;

  if (dur < minDur) {
    return {
      pid: session.pid,
      t0,
      t1,
      n: rows.length,
      durMin: dur / 60000,
      class: 'SHORT',
      span: 0,
      retain: 0,
      lastFloor: null,
      minFloor: null,
      maxFloor: null,
      lateViewsMax,
      viewsStable,
    };
  }

  const warmCut = t0 + dur * (opts.warmupFrac ?? WARMUP_FRAC);
  const post = rows.filter((r) => r.timeMs >= warmCut && r.pssMb != null);
  if (post.length < (opts.minPostSamples ?? MIN_POST_SAMPLES)) {
    return {
      pid: session.pid,
      t0,
      t1,
      n: rows.length,
      durMin: dur / 60000,
      class: 'SHORT',
      span: 0,
      retain: 0,
      lastFloor: null,
      minFloor: null,
      maxFloor: null,
      lateViewsMax,
      viewsStable,
    };
  }

  const floors = rollingFloors(post, opts.rollMs ?? ROLL_MS);
  const vals = floors.map((f) => f.floor);
  const minFloor = Math.min(...vals);
  const maxFloor = Math.max(...vals);
  const lastFloor = floors[floors.length - 1].floor;
  const span = maxFloor - minFloor;
  const retain = span > 0 ? (lastFloor - minFloor) / span : 0;
  const stairSpan = opts.stairSpanMb ?? STAIR_SPAN_MB;
  const stairRetain = opts.stairRetain ?? STAIR_RETAIN;
  let klass = 'FLAT';
  if (span >= stairSpan && retain >= stairRetain) klass = 'STAIRCASE';
  else if (span >= stairSpan && retain < SAWTOOTH_RETAIN) klass = 'SAWTOOTH';
  else if (span >= stairSpan) klass = 'PARTIAL';

  return {
    pid: session.pid,
    t0,
    t1,
    n: rows.length,
    durMin: dur / 60000,
    class: klass,
    span,
    retain,
    lastFloor,
    minFloor,
    maxFloor,
    lateViewsMax,
    viewsStable,
  };
}

function auditSessionFloors(rows, opts = {}) {
  const now = opts.nowMs ?? Date.now();
  const recentMs = opts.recentMs ?? RECENT_MS;
  const sessions = splitSessions(rows, opts.gapMs);
  const classified = sessions.map((s) => classifySession(s, opts));
  const long = classified.filter((c) => c.class !== 'SHORT');
  const recentStairs = long.filter(
    (c) => c.class === 'STAIRCASE' && now - c.t1 <= recentMs,
  );
  const counts = { STAIRCASE: 0, SAWTOOTH: 0, PARTIAL: 0, FLAT: 0, SHORT: 0 };
  for (const c of classified) counts[c.class] = (counts[c.class] || 0) + 1;
  return {
    sessions: classified,
    long,
    recentStairs,
    counts,
    verdict: recentStairs.length ? 'FAIL' : 'PASS',
    now,
    recentMs,
  };
}

function iso(ms) {
  return Number.isFinite(ms) ? new Date(ms).toISOString() : '';
}

module.exports = {
  SESSION_GAP_MS,
  WARMUP_FRAC,
  ROLL_MS,
  MIN_DUR_MS,
  STAIR_SPAN_MB,
  STAIR_RETAIN,
  RECENT_MS,
  loadMemTimeline,
  splitSessions,
  rollingFloors,
  classifySession,
  auditSessionFloors,
  iso,
};
