#!/usr/bin/env node
'use strict';

/**
 * 지정 창(기본: 마커 start → 당일 08:00 KST) mem-timeline PSS 안정화 판정.
 * 런타임 앱 무변경. 김경제 관측용.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const {
  loadMemTimeline,
  auditSessionFloors,
  iso,
} = require('../memory-profiler/sessionFloorCore.cjs');

const LOG_DIR = path.join(__dirname, 'logs');
const MARKER = path.join(LOG_DIR, 'pss-stability-window-latest.json');
const TIMELINE = path.join(LOG_DIR, 'mem-timeline.csv');
const HANDOFF = path.join(__dirname, '../kim-team-lead/reports/kim-economy-handoff.md');
const SOFT_DELTA_MB = 25;
const FAIL_DELTA_MB = 40;
const VIEWS_IDLE_MAX = 380;
const VIEWS_FAIL = 450;

function kstNow(d = new Date()) {
  return new Date(d.getTime() + 9 * 60 * 60 * 1000);
}

function kstStamp(d = new Date()) {
  const k = kstNow(d);
  const y = k.getUTCFullYear();
  const m = String(k.getUTCMonth() + 1).padStart(2, '0');
  const day = String(k.getUTCDate()).padStart(2, '0');
  const hh = String(k.getUTCHours()).padStart(2, '0');
  const mm = String(k.getUTCMinutes()).padStart(2, '0');
  const ss = String(k.getUTCSeconds()).padStart(2, '0');
  return `${y}-${m}-${day} ${hh}:${mm}:${ss}`;
}

function kstDateKey(d = new Date()) {
  return kstStamp(d).slice(0, 10);
}

function nextOrToday8amKstMs(from = new Date()) {
  const k = kstNow(from);
  const y = k.getUTCFullYear();
  const mo = k.getUTCMonth();
  const day = k.getUTCDate();
  const eightUtc = Date.UTC(y, mo, day, 8, 0, 0) - 9 * 60 * 60 * 1000;
  if (from.getTime() < eightUtc) return eightUtc;
  return eightUtc + 24 * 60 * 60 * 1000;
}

function loadMarker() {
  try {
    return JSON.parse(fs.readFileSync(MARKER, 'utf8'));
  } catch {
    return null;
  }
}

function writeMarker(partial) {
  const prev = loadMarker() || {};
  const next = { ...prev, ...partial, updatedAtKst: kstStamp() };
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.writeFileSync(MARKER, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
  return next;
}

function judgeWindow({ startMs, endMs, preview }) {
  if (!fs.existsSync(TIMELINE)) {
    return { verdict: 'NO_DATA', reason: 'mem-timeline missing', sessions: [] };
  }
  const all = loadMemTimeline(fs.readFileSync(TIMELINE, 'utf8'));
  const rows = all.filter((r) => r.timeMs >= startMs && r.timeMs <= endMs);
  const pids = [...new Set(rows.map((r) => r.pid).filter(Boolean))];
  const audit = auditSessionFloors(rows, {
    nowMs: endMs,
    recentMs: endMs - startMs + 60 * 1000,
    minDurMs: 45 * 60 * 1000,
  });
  const long = [...audit.long].sort((a, b) => b.durMin - a.durMin);
  const primary = long[0] || audit.sessions.filter((s) => s.class !== 'SHORT').sort((a, b) => b.n - a.n)[0] || null;
  const stairs = audit.sessions.filter((s) => s.class === 'STAIRCASE');
  const viewsHigh = audit.sessions.filter((s) => s.lateViewsMax != null && s.lateViewsMax >= VIEWS_FAIL);
  const floorDelta = primary && primary.lastFloor != null && primary.minFloor != null
    ? primary.lastFloor - primary.minFloor
    : null;

  const flags = [];
  if (rows.length < 8) flags.push('INSUFFICIENT_SAMPLES');
  if (pids.length >= 3) flags.push('PID_CHURN');
  if (stairs.length) flags.push('STAIRCASE');
  if (floorDelta != null && floorDelta >= FAIL_DELTA_MB) flags.push('PSS_FLOOR_UP');
  if (viewsHigh.length) flags.push('VIEWS_RETAINED');

  let verdict = 'STABLE';
  if (flags.includes('INSUFFICIENT_SAMPLES')) verdict = preview ? 'WATCHING' : 'NO_DATA';
  else if (flags.includes('STAIRCASE') || flags.includes('PSS_FLOOR_UP') || flags.includes('VIEWS_RETAINED') || flags.includes('PID_CHURN')) {
    verdict = 'UNSTABLE';
  } else if (
    (floorDelta != null && floorDelta >= SOFT_DELTA_MB)
    || (primary && primary.lateViewsMax != null && primary.lateViewsMax > VIEWS_IDLE_MAX)
    || pids.length > 1
    || (primary && primary.class === 'PARTIAL')
  ) {
    verdict = 'WATCH';
  }

  return {
    verdict,
    flags,
    preview: Boolean(preview),
    startMs,
    endMs,
    sampleN: rows.length,
    pids,
    primary,
    stairs,
    floorDelta,
    counts: audit.counts,
    sessions: audit.sessions,
    first: rows[0] || null,
    last: rows[rows.length - 1] || null,
  };
}

function writeReports(j) {
  const dateTag = kstDateKey(new Date(j.endMs)).replace(/-/g, '');
  const outMd = path.join(LOG_DIR, `pss-stability-window-${dateTag}-0800.md`);
  const leadMd = path.join(__dirname, '../kim-team-lead/reports/pss-stability-window-20260927.md');
  const lines = [
    '# PSS 안정화 판정 — 창 감시',
    '',
    `- generated: ${new Date().toISOString()}`,
    `- window: ${kstStamp(new Date(j.startMs))} → ${kstStamp(new Date(j.endMs))} KST`,
    `- verdict: **${j.verdict}**${j.preview ? ' (preview)' : ''}`,
    `- flags: ${j.flags.length ? j.flags.join(', ') : '-'}`,
    `- samples: ${j.sampleN} · pids: ${j.pids.join(', ') || '-'}`,
    `- class: STAIRCASE ${j.counts.STAIRCASE} / SAWTOOTH ${j.counts.SAWTOOTH} / PARTIAL ${j.counts.PARTIAL} / FLAT ${j.counts.FLAT} / SHORT ${j.counts.SHORT}`,
    `- primary: pid=${j.primary ? j.primary.pid : '-'} class=${j.primary ? j.primary.class : '-'} span=${j.primary ? j.primary.span.toFixed(1) : '-'} retain=${j.primary && j.primary.retain != null ? j.primary.retain.toFixed(2) : '-'} Δfloor=${j.floorDelta != null ? j.floorDelta.toFixed(1) : '-'} late_views=${j.primary && j.primary.lateViewsMax != null ? j.primary.lateViewsMax : '-'}`,
    `- last sample: ${j.last ? `${j.last.time} pid=${j.last.pid} pss=${j.last.pssMb} views=${j.last.views}` : '-'}`,
    '',
    '기준: 창 안 pid+20분 세션 · 워밍 25% 제외 · 10분 rolling min · stair span≥40 & retain≥0.7 · floor Δ +25 soft / +40 FAIL · views idle≤380 / ≥450 FAIL.',
    '',
  ];
  if (j.sessions.length) {
    lines.push('| start | pid | class | span | retain | n | late_views |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const c of j.sessions) {
      lines.push(
        `| ${iso(c.t0)} | ${c.pid} | ${c.class} | ${Number(c.span || 0).toFixed(1)} | ${Number(c.retain || 0).toFixed(2)} | ${c.n} | ${c.lateViewsMax ?? '-'} |`,
      );
    }
    lines.push('');
  }
  const body = `${lines.join('\n')}\n`;
  fs.mkdirSync(path.dirname(outMd), { recursive: true });
  fs.writeFileSync(outMd, body, 'utf8');
  fs.mkdirSync(path.dirname(leadMd), { recursive: true });
  fs.writeFileSync(leadMd, body, 'utf8');

  if (!j.preview) {
    const block = [
      '',
      `## [관측] ${kstStamp()} KST — PSS 창 안정화 판정 (**${j.verdict}**)`,
      '',
      `- window ${kstStamp(new Date(j.startMs))} → ${kstStamp(new Date(j.endMs))} · samples=${j.sampleN} · pids=${j.pids.join(',') || '-'}`,
      `- primary ${j.primary ? `pid=${j.primary.pid} ${j.primary.class} Δfloor=${j.floorDelta != null ? j.floorDelta.toFixed(1) : '-'}` : '없음'}`,
      `- flags: ${j.flags.length ? j.flags.join(', ') : '-'}`,
      `- 리포트: \`tools/long-run-monitor/logs/pss-stability-window-${dateTag}-0800.md\``,
      `- 코드 수정 금지`,
      '',
    ].join('\n');
    try {
      fs.appendFileSync(HANDOFF, block, 'utf8');
    } catch {
      /* ignore */
    }
  }
  return { outMd, leadMd };
}

function main() {
  const preview = process.argv.includes('--preview');
  const startOnly = process.argv.includes('--start');
  const now = Date.now();
  if (startOnly) {
    const last = fs.existsSync(TIMELINE)
      ? loadMemTimeline(fs.readFileSync(TIMELINE, 'utf8')).slice(-1)[0]
      : null;
    const marker = writeMarker({
      status: 'WATCHING',
      startMs: now,
      startKst: kstStamp(new Date(now)),
      endMs: nextOrToday8amKstMs(new Date(now)),
      endKst: kstStamp(new Date(nextOrToday8amKstMs(new Date(now)))),
      baseline: last
        ? { time: last.time, pid: last.pid, pssMb: last.pssMb, views: last.views, glMb: last.glMb }
        : null,
    });
    console.log(`pss-window START ${marker.startKst} → ${marker.endKst}`);
    if (marker.baseline) {
      console.log(`baseline pid=${marker.baseline.pid} pss=${marker.baseline.pssMb} views=${marker.baseline.views} @ ${marker.baseline.time}`);
    }
    if (!process.argv.includes('--no-sleeper')) {
      const child = spawn(process.execPath, [path.join(__dirname, 'schedule-pss-stability-until-8am.cjs')], {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
      });
      child.unref();
      console.log('sleeper=detached → 08:00 judge');
    }
    return;
  }

  const marker = loadMarker();
  const startMs = marker?.startMs || now - 6 * 60 * 60 * 1000;
  const endMs = preview ? now : (marker?.endMs || nextOrToday8amKstMs(new Date(startMs)));
  const j = judgeWindow({ startMs, endMs, preview });
  const paths = writeReports(j);
  if (!preview) writeMarker({ status: j.verdict, judgedAtKst: kstStamp(), verdict: j.verdict, flags: j.flags });
  console.log(`pss-window verdict=${j.verdict} samples=${j.sampleN} flags=${j.flags.join(',') || '-'}`);
  console.log(`report=${paths.outMd}`);
}

if (require.main === module) main();

module.exports = { judgeWindow, loadMarker, writeMarker, nextOrToday8amKstMs };
