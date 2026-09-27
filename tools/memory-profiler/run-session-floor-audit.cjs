#!/usr/bin/env node
'use strict';

/**
 * 세션 PSS floor 상설 감사.
 * 전 기간 관측. FAIL은 최근 7일 STAIRCASE만 (과거 계단을 영구 실패로 두지 않음).
 * audit:memory:all 에 넣지 않는다 — 정적 패턴 감사와 장기 soak 관측을 섞지 않기 위함.
 */

const fs = require('fs');
const path = require('path');
const { loadMemTimeline, auditSessionFloors, iso } = require('./sessionFloorCore.cjs');

function writeReport(audit, outPath) {
  const { long, recentStairs, counts, verdict, recentMs } = audit;
  const recentDays = Math.round(recentMs / (24 * 60 * 60 * 1000));
  const med = (arr) => {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  };
  const stairSpans = long.filter((c) => c.class === 'STAIRCASE').map((c) => c.span);
  const viewsHigh = long.filter((c) => c.lateViewsMax != null && c.lateViewsMax >= 450);
  const viewsStable = long.filter((c) => c.viewsStable);
  const lines = [
    '# Session PSS floor audit',
    '',
    `- generated: ${new Date().toISOString()}`,
    `- verdict: **${verdict}** (FAIL = last ${recentDays}d STAIRCASE only)`,
    `- sessions_long: ${long.length} · SHORT excluded`,
    `- class: STAIRCASE ${counts.STAIRCASE} / SAWTOOTH ${counts.SAWTOOTH} / PARTIAL ${counts.PARTIAL} / FLAT ${counts.FLAT} / SHORT ${counts.SHORT}`,
    `- recent_staircase: ${recentStairs.length}`,
    `- median_stair_span_mb: ${stairSpans.length ? med(stairSpans).toFixed(1) : '-'}`,
    `- late_views≥450: ${viewsHigh.length}/${long.length} · views_stable: ${viewsStable.length}/${long.length}`,
    `- contract: pid + 20min gap · drop first 25% · 10min rolling min · stair span≥40 & retain≥0.7`,
    '',
    '## Recent STAIRCASE (FAIL window)',
    '',
  ];
  if (!recentStairs.length) {
    lines.push('없음.');
  } else {
    lines.push('| start | end | pid | span | retain | last_floor | late_views | views_stable |');
    lines.push('|---|---|---|---|---|---|---|---|');
    for (const c of recentStairs.slice(0, 20)) {
      lines.push(
        `| ${iso(c.t0)} | ${iso(c.t1)} | ${c.pid} | ${c.span.toFixed(1)} | ${c.retain.toFixed(2)} | ${c.lastFloor != null ? c.lastFloor.toFixed(1) : '-'} | ${c.lateViewsMax ?? '-'} | ${c.viewsStable ? 'Y' : 'N'} |`,
      );
    }
  }
  lines.push('');
  lines.push('## Long sessions (latest 30)');
  lines.push('');
  lines.push('| start | pid | class | span | retain | n | late_views |');
  lines.push('|---|---|---|---|---|---|---|');
  const latest = [...long].sort((a, b) => b.t1 - a.t1).slice(0, 30);
  for (const c of latest) {
    lines.push(
      `| ${iso(c.t0)} | ${c.pid} | ${c.class} | ${c.span.toFixed(1)} | ${c.retain.toFixed(2)} | ${c.n} | ${c.lateViewsMax ?? '-'} |`,
    );
  }
  lines.push('');
  lines.push(
    '김팀장: 최근 STAIRCASE면 런타임 추측 패치 전에 실기 시설 팝 views·reclaim 실측. 과거 계단만으로는 완료 FAIL 아님.',
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');
}

function main() {
  const root = path.resolve(__dirname, '../..');
  const timelinePath =
    process.env.ARCFIRE_SESSION_FLOOR_TIMELINE ||
    path.join(root, 'tools/long-run-monitor/logs/mem-timeline.csv');
  if (!fs.existsSync(timelinePath)) {
    console.error(`session-floor: missing ${timelinePath}`);
    process.exitCode = 1;
    return;
  }
  const rows = loadMemTimeline(fs.readFileSync(timelinePath, 'utf8'));
  const audit = auditSessionFloors(rows);
  const out = path.join(__dirname, 'reports/latest-session-floor-audit.md');
  writeReport(audit, out);
  console.log(`session-floor audit: ${out}`);
  console.log(
    `verdict=${audit.verdict} long=${audit.long.length} stair=${audit.counts.STAIRCASE} recent_stair=${audit.recentStairs.length}`,
  );
  if (audit.verdict === 'FAIL') process.exitCode = 1;
}

if (require.main === module) {
  main();
}

module.exports = { main, writeReport };
