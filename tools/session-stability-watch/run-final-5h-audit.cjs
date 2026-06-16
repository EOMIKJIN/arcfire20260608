#!/usr/bin/env node
/**
 * 5시간 세션 종료 — 메모리·경제·전수 검수 + 안정화 판정
 * node tools/session-stability-watch/run-final-5h-audit.cjs --session <id>
 */
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const REPORT_DIR = path.join(__dirname, 'reports');
const MEM_TIMELINE = path.join(ROOT, 'tools/long-run-monitor/logs/mem-timeline.csv');
const INCIDENTS = path.join(ROOT, 'tools/long-run-monitor/logs/incidents.log');
const REMEDIATION = path.join(ROOT, 'tools/long-run-monitor/logs/remediation.log');
const ALERTS = path.join(ROOT, 'tools/long-run-monitor/logs/mem-alerts.log');

function arg(name, fallback = '') {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function readText(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

function runNpm(script) {
  const proc = spawnSync('npm', ['run', script], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 20 * 1024 * 1024,
  });
  return {
    script,
    exit: proc.status ?? 1,
    ok: (proc.status ?? 1) === 0,
    tail: (proc.stdout || proc.stderr || '').slice(-1200),
  };
}

function parsePassFail(md) {
  if (!md) return 'UNKNOWN';
  if (/\*\*Overall:\*\*\s*PASS/i.test(md) || /^# .*\n\n\*\*Overall:\*\* PASS/m.test(md)) return 'PASS';
  if (/\*\*Overall:\*\*\s*FAIL/i.test(md) || /Overall: FAIL/i.test(md)) return 'FAIL';
  if (/\*\*Overall:\*\*\s*WARN/i.test(md)) return 'WARN';
  if (/PASS/.test(md) && !/FAIL/.test(md)) return 'PASS';
  return 'UNKNOWN';
}

function analyzeMemTimeline(sinceIso) {
  const raw = readText(MEM_TIMELINE).trim();
  if (!raw) return { rows: 0, glMax: null, glSpikes: 0, processDeaths: 0, hubActivations: 0 };

  const since = sinceIso ? Date.parse(sinceIso) : 0;
  const lines = raw.split(/\r?\n/).filter(Boolean).slice(1);
  let glMax = 0;
  let glSpikes = 0;
  let processDeaths = 0;
  let hubActivations = 0;
  let rows = 0;

  for (const line of lines) {
    const cols = line.split(',');
    const iso = cols[0];
    const t = Date.parse(String(iso).replace(' ', 'T'));
    if (since && Number.isFinite(t) && t < since) continue;
    rows += 1;
    const note = cols[cols.length - 1] ?? '';
    const gl = Number(cols[4]);
    if (Number.isFinite(gl) && gl > glMax) glMax = gl;
    if (note.includes('GL_SPIKE')) glSpikes += 1;
    if (note.includes('PROCESS_NOT_RUNNING')) processDeaths += 1;
    if (note.includes('HUB_ACTIVATION')) hubActivations += 1;
  }

  return { rows, glMax: rows ? glMax : null, glSpikes, processDeaths, hubActivations };
}

function countLinesSince(file, sinceIso) {
  const raw = readText(file);
  if (!raw) return 0;
  const since = sinceIso ? Date.parse(sinceIso) : 0;
  return raw.split(/\r?\n/).filter((line) => {
    if (!line.trim()) return false;
    const m = line.match(/^\[([^\]]+)\]/);
    if (!m) return true;
    const t = Date.parse(m[1].replace(' ', 'T'));
    return !since || !Number.isFinite(t) || t >= since;
  }).length;
}

function main() {
  const sessionId = arg('session', 'unknown');
  const sessionStartIso = arg('start', '');
  const durationHours = Number(arg('hours', '5')) || 5;

  fs.mkdirSync(REPORT_DIR, { recursive: true });

  const audits = [
    runNpm('audit:memory:all'),
    runNpm('audit:balance-ops'),
    runNpm('audit:planet-economy-3h'),
    runNpm('audit:team-lead:daily'),
    runNpm('audit:daily'),
    runNpm('audit:skia-memory'),
  ];

  const memoryMd = readText(path.join(ROOT, 'tools/memory-audit/reports/latest.md'));
  const skiaMd = readText(path.join(ROOT, 'tools/memory-audit/reports/skia-worklet-latest.md'));
  const balanceMd = readText(path.join(ROOT, 'tools/balance-ops-audit/reports/latest.md'));
  const planetMd = readText(path.join(ROOT, 'tools/planet-economy-3h-audit/reports/latest.md'));
  const teamLeadMd = readText(path.join(ROOT, 'tools/kim-team-lead/reports/daily-review-latest.md'));
  const dailyMd = readText(path.join(ROOT, 'tools/daily-perf-audit/reports/latest.md'));

  const memTrend = analyzeMemTimeline(sessionStartIso);
  const incidents = countLinesSince(INCIDENTS, sessionStartIso);
  const remediations = countLinesSince(REMEDIATION, sessionStartIso);
  const alerts = countLinesSince(ALERTS, sessionStartIso);

  const sessionTimeline = readText(path.join(REPORT_DIR, `session-timeline-${sessionId}.csv`));
  const economyTicks = sessionTimeline ? Math.max(0, sessionTimeline.split(/\r?\n/).length - 2) : 0;

  const memoryPass = parsePassFail(memoryMd) === 'PASS' || /All checks passed/i.test(memoryMd);
  const skiaPass = parsePassFail(skiaMd) === 'PASS' || /PASS/i.test(skiaMd);
  const balancePass = parsePassFail(balanceMd) === 'PASS';
  const planetPass = parsePassFail(planetMd) === 'PASS';
  const teamLeadPass = /PASS|OK/i.test(teamLeadMd) && !/FAIL/i.test(teamLeadMd);

  const glCritical = memTrend.glMax != null && memTrend.glMax >= 80;
  const glLeakSuspect = memTrend.glSpikes >= 3;
  const crashed = memTrend.processDeaths > 0;

  const blockers = [];
  if (!memoryPass) blockers.push('memory-audit');
  if (!skiaPass) blockers.push('skia-memory-audit');
  if (!balancePass) blockers.push('balance-ops');
  if (!planetPass) blockers.push('planet-economy-3h');
  if (glCritical) blockers.push('gl_critical_80mb');
  if (glLeakSuspect) blockers.push('gl_spike_3x');
  if (crashed) blockers.push('process_death');

  const stabilized = blockers.length === 0;
  const verdict = stabilized ? 'STABLE' : blockers.some((b) => b.startsWith('gl_') || b === 'process_death') ? 'UNSTABLE' : 'STABLE_WITH_WARN';

  const iso = new Date().toISOString();
  const reportPath = path.join(REPORT_DIR, `session-final-${sessionId}.md`);
  const latestPath = path.join(REPORT_DIR, 'session-final-latest.md');

  const md = `# Arcfire 5h Session Stability Report

Generated: ${iso}
Session: **${sessionId}**
Duration: ~${durationHours}h
Economy ticks (30m): ${economyTicks}

## Verdict: **${verdict}**

${stabilized ? '✅ 장기 세션 안정화 기준 충족' : `⚠️ 조치 필요: ${blockers.join(', ')}`}

## Runtime memory (long-run monitor)

| 항목 | 값 |
|------|-----|
| Timeline samples (session) | ${memTrend.rows} |
| GL max (MB) | ${memTrend.glMax ?? 'n/a'} |
| GL_SPIKE count | ${memTrend.glSpikes} |
| HUB_ACTIVATION | ${memTrend.hubActivations} |
| PROCESS_NOT_RUNNING | ${memTrend.processDeaths} |
| mem-alerts | ${alerts} |
| incidents | ${incidents} |
| remediations | ${remediations} |

## Static audits

| Audit | npm exit | parsed |
|-------|----------|--------|
| audit:memory:all | ${audits[0].exit} | ${memoryPass ? 'PASS' : 'FAIL/WARN'} |
| audit:balance-ops | ${audits[1].exit} | ${balancePass ? 'PASS' : 'FAIL/WARN'} |
| audit:planet-economy-3h | ${audits[2].exit} | ${planetPass ? 'PASS' : 'FAIL/WARN'} |
| audit:team-lead:daily | ${audits[3].exit} | ${teamLeadPass ? 'PASS' : 'FAIL/WARN'} |
| audit:daily | ${audits[4].exit} | — |
| audit:skia-memory | ${audits[5].exit} | ${skiaPass ? 'PASS' : 'FAIL/WARN'} |

## Economy session timeline

\`${sessionTimeline ? `tools/session-stability-watch/reports/session-timeline-${sessionId}.csv` : 'no ticks recorded'}\`

## Blockers

${blockers.length ? blockers.map((b) => `- ${b}`).join('\n') : '- none'}

## References

- memory: \`tools/memory-audit/reports/latest.md\`
- skia: \`tools/memory-audit/reports/skia-worklet-latest.md\`
- balance-ops: \`tools/balance-ops-audit/reports/latest.md\`
- planet-economy: \`tools/planet-economy-3h-audit/reports/latest.md\`
- team-lead: \`tools/kim-team-lead/reports/daily-review-latest.md\`
- mem-timeline: \`tools/long-run-monitor/logs/mem-timeline.csv\`

---
*자동 생성 — 김팀장 세션 감시*
`;

  fs.writeFileSync(reportPath, md, 'utf8');
  fs.writeFileSync(latestPath, md, 'utf8');

  const payload = {
    sessionId,
    verdict,
    stabilized,
    blockers,
    reportPath: path.relative(ROOT, reportPath),
    latestPath: path.relative(ROOT, latestPath),
    memTrend,
    economyTicks,
    iso,
  };

  console.log(JSON.stringify(payload));
  process.exit(stabilized ? 0 : 1);
}

main();
