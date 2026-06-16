#!/usr/bin/env node
/**
 * 30분 주기 경제·밸런스 경량 점검 — 장기 세션 감시용
 * node tools/session-stability-watch/run-economy-balance-tick.cjs --session <id> --tick <n>
 */
'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const REPORT_DIR = path.join(__dirname, 'reports');
const MEM_TIMELINE = path.join(ROOT, 'tools/long-run-monitor/logs/mem-timeline.csv');
const ALERTS_LOG = path.join(ROOT, 'tools/long-run-monitor/logs/mem-alerts.log');
const INCIDENTS_LOG = path.join(ROOT, 'tools/long-run-monitor/logs/incidents.log');

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

function parseOverallPass(md) {
  if (!md) return 'UNKNOWN';
  if (/\*\*Overall:\*\*\s*PASS/i.test(md)) return 'PASS';
  if (/\*\*Overall:\*\*\s*FAIL/i.test(md)) return 'FAIL';
  if (/\*\*Overall:\*\*\s*WARN/i.test(md)) return 'WARN';
  return 'UNKNOWN';
}

function lastMemTimelineRow() {
  const raw = readText(MEM_TIMELINE).trim();
  if (!raw) return null;
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return null;
  const header = lines[0].split(',');
  const cols = lines[lines.length - 1].split(',');
  const out = {};
  for (let i = 0; i < header.length; i += 1) out[header[i]] = cols[i] ?? '';
  return out;
}

function countRecentAlerts(sinceIso) {
  const raw = readText(ALERTS_LOG);
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

function runNpm(script) {
  const proc = spawnSync('npm', ['run', script], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    maxBuffer: 16 * 1024 * 1024,
  });
  return { exit: proc.status ?? 1, stdout: proc.stdout ?? '', stderr: proc.stderr ?? '' };
}

function ensureDir() {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

function appendTimelineCsv(sessionId, row) {
  const csvPath = path.join(REPORT_DIR, `session-timeline-${sessionId}.csv`);
  const header =
    'iso_time,tick,balance_ops_exit,balance_ops_overall,planet_economy_exit,planet_economy_overall,gl_mb,pss_mb,delta_gl_mb,views,alert_count_since_start,note';
  if (!fs.existsSync(csvPath)) fs.writeFileSync(csvPath, `${header}\n`, 'utf8');
  fs.appendFileSync(csvPath, `${row.join(',')}\n`, 'utf8');
  return csvPath;
}

function main() {
  const sessionId = arg('session', new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-'));
  const tick = Number(arg('tick', '1')) || 1;
  const sessionStartIso = arg('start', new Date().toISOString());

  ensureDir();

  const balanceOps = runNpm('audit:balance-ops');
  const balanceMd = readText(path.join(ROOT, 'tools/balance-ops-audit/reports/latest.md'));
  const balanceOverall = parseOverallPass(balanceMd);

  const planetEco = runNpm('audit:planet-economy-3h');
  const planetMd = readText(path.join(ROOT, 'tools/planet-economy-3h-audit/reports/latest.md'));
  const planetOverall = parseOverallPass(planetMd);

  const mem = lastMemTimelineRow();
  const glMb = mem?.gl_mb ?? '';
  const pssMb = mem?.pss_mb ?? '';
  const deltaGl = mem?.delta_gl_mb ?? '';
  const views = mem?.views ?? '';
  const alertCount = countRecentAlerts(sessionStartIso);

  const iso = new Date().toISOString();
  const note =
    balanceOverall === 'PASS' && planetOverall === 'PASS'
      ? 'economy_ok'
      : `balance=${balanceOverall};planet=${planetOverall}`;

  const csvPath = appendTimelineCsv(sessionId, [
    iso,
    tick,
    balanceOps.exit,
    balanceOverall,
    planetEco.exit,
    planetOverall,
    glMb,
    pssMb,
    deltaGl,
    views,
    alertCount,
    note,
  ]);

  const tickMd = path.join(REPORT_DIR, `tick-${sessionId}-${String(tick).padStart(2, '0')}.md`);
  const body = `# Session Economy Tick ${tick}

Generated: ${iso}
Session: ${sessionId}

## Audits

| Audit | exit | overall |
|-------|------|---------|
| balance-ops | ${balanceOps.exit} | ${balanceOverall} |
| planet-economy-3h | ${planetEco.exit} | ${planetOverall} |

## Device memory (latest long-run timeline)

| gl_mb | pss_mb | delta_gl_mb | views |
|-------|--------|-------------|-------|
| ${glMb || 'n/a'} | ${pssMb || 'n/a'} | ${deltaGl || 'n/a'} | ${views || 'n/a'} |

Alerts since session start: ${alertCount}

Timeline CSV: \`${path.relative(ROOT, csvPath)}\`
`;
  fs.writeFileSync(tickMd, body, 'utf8');

  const summary = {
    sessionId,
    tick,
    iso,
    balanceOpsExit: balanceOps.exit,
    balanceOverall,
    planetEcoExit: planetEco.exit,
    planetOverall,
    glMb,
    pssMb,
    alertCount,
    tickMd: path.relative(ROOT, tickMd),
    timelineCsv: path.relative(ROOT, csvPath),
  };

  console.log(JSON.stringify(summary));
  process.exit(balanceOps.exit === 0 && planetEco.exit === 0 ? 0 : 1);
}

main();
