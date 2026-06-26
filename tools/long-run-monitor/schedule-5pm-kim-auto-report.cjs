#!/usr/bin/env node
/**
 * 17:00 KST auto report — mem-timeline · incidents · kim-economy-handoff
 *
 * Usage:
 *   node tools/long-run-monitor/schedule-5pm-kim-auto-report.cjs
 *   node tools/long-run-monitor/schedule-5pm-kim-auto-report.cjs --target 17:00 --now
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const logDir = path.join(__dirname, 'logs');
const handoffPath = path.join(ROOT, 'tools/kim-team-lead/reports/kim-economy-handoff.md');
const scheduleLog = path.join(logDir, 'schedule-5pm-report.log');
const Package = 'com.arcfire.online';
const TimelineMarker = 'AFTERNOON_WATCH_START';

const args = process.argv.slice(2);
const targetTime = args.includes('--target') ? args[args.indexOf('--target') + 1] : '17:00';
const runNow = args.includes('--now');

function log(msg) {
  const line = `[${new Date().toISOString().slice(0, 19).replace('T', ' ')}] ${msg}`;
  console.log(line);
  try {
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(scheduleLog, `${line}\n`, 'utf8');
  } catch {
    /* ignore */
  }
}

function kstNow() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 9 * 60 * 60000);
}

function sleepMs(ms) {
  const sec = Math.max(1, Math.ceil(ms / 1000));
  execFileSync(
    'powershell',
    ['-NoProfile', '-Command', `Start-Sleep -Seconds ${sec}`],
    { stdio: 'ignore', shell: true },
  );
}

function waitUntilKst(hhmm) {
  const [h, m] = hhmm.split(':').map((x) => parseInt(x, 10));
  while (true) {
    const now = kstNow();
    const target = new Date(now);
    target.setHours(h, m || 0, 0, 0);
    if (now >= target) return now;
    const sec = Math.min(300, Math.max(5, (target - now) / 1000));
    log(`wait until ${hhmm} KST (~${Math.round(sec)}s)`);
    sleepMs(sec * 1000);
  }
}

function sh(cmd, cmdArgs) {
  return execFileSync(cmd, cmdArgs, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
}

function readTail(file, n) {
  try {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
    return lines.slice(-n);
  } catch {
    return [];
  }
}

function readPid(name) {
  try {
    return fs.readFileSync(path.join(logDir, name), 'utf8').trim();
  } catch {
    return '?';
  }
}

function main() {
  log(`scheduler start target=${targetTime} KST marker=${TimelineMarker}`);
  if (!runNow) waitUntilKst(targetTime);

  const kst = kstNow();
  const stamp = kst.toISOString().slice(0, 16).replace('T', ' ').replace(/:/g, '').slice(0, 13);
  const reportFile = path.join(logDir, `afternoon-watch-report-${kst.toISOString().slice(0, 10).replace(/-/g, '')}-1700.md`);

  log(`generating report -> ${reportFile}`);
  sh('powershell', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    path.join(__dirname, 'run-overnight-final-report.ps1'),
    '-Package',
    Package,
    '-ReportPath',
    reportFile,
    '-TimelineMarker',
    TimelineMarker,
    '-ReportTitle',
    'Arcfire afternoon watch 17KST Kim economy',
  ]);

  let memLine = 'APP_NOT_RUNNING';
  let pssMb = '?';
  let glMb = '?';
  let views = '?';
  try {
    const pidApp = sh('adb', ['shell', `pidof ${Package}`]).trim();
    if (pidApp) {
      const raw = sh('adb', ['shell', 'dumpsys', 'meminfo', Package]);
      const pss = raw.match(/TOTAL PSS:\s+(\d+)/);
      const gl = raw.match(/^\s*GL mtrack\s+(\d+)/m);
      const v = raw.match(/Views:\s+(\d+)/);
      if (pss) pssMb = (parseInt(pss[1], 10) / 1024).toFixed(1);
      if (gl) glMb = (parseInt(gl[1], 10) / 1024).toFixed(1);
      if (v) views = v[1];
      memLine = `PSS ${pssMb}MB · GL ${glMb}MB · Views ${views} · pid=${pidApp}`;
    }
  } catch {
    /* ignore */
  }

  const watchPid = readPid('watch-30m.pid');
  const reportPid = readPid('report-watch.pid');
  const paused = fs.existsSync(path.join(logDir, 'monitor-paused.flag'));
  const incidentTail = readTail(path.join(logDir, 'incidents.log'), 12);
  const actionable = incidentTail.filter((ln) =>
    /GL_SPIKE|PROCESS_DEATH|HARD|baseline_gl|ABNORMAL|FATAL|AFTERNOON_WATCH/.test(ln),
  );

  let memStatus = 'OK';
  if (pssMb !== '?' && parseFloat(pssMb) >= 950) memStatus = 'CRITICAL';
  else if (pssMb !== '?' && parseFloat(pssMb) >= 850) memStatus = 'WARN';

  const rec =
    memStatus === 'CRITICAL'
      ? 'PSS>=950 — hub exit / Skia dispose P0'
      : memStatus === 'WARN'
        ? 'PSS 850+ — soft reclaim floor watch'
        : 'afternoon soak OK — check RTDB dailyKpi';

  const kstLabel = kst.toISOString().slice(0, 16).replace('T', ' ');
  const block = [
    '',
    `## [관측] ${kstLabel} KST — 오후 감시 · 17:00 자동보고`,
    '',
    `- **김경제 감시**: watch-30m PID **${watchPid}** · report-watch PID **${reportPid}** · auto-fix=${paused ? 'OFF(record-only)' : 'ON'}`,
    `- **mem-monitor**: **${memStatus}** (${memLine})`,
    `- **report**: ${reportFile}`,
    `- **timeline marker**: ${TimelineMarker}`,
    `- **incidents (actionable tail)**: ${actionable.length}`,
    ...(actionable.length ? actionable.map((ln) => `  - ${ln}`) : ['  - (none)']),
    '- **ArcCore learning**: arc-core:learning:verify PASS · RTDB policy 2026-06-26',
    `- **권장(김팀장 1안)**: ${rec}`,
    '',
    `> status: ${memStatus === 'CRITICAL' ? '**ready-for-team-lead-action**' : 'monitor-ok'} · 감시 유지`,
    '',
  ].join('\n');

  if (fs.existsSync(handoffPath)) {
    const template = '## [관측] _(김경제 갱신 템플릿';
    let content = fs.readFileSync(handoffPath, 'utf8');
    if (content.includes(template)) {
      content = content.replace(template, `${block.trim()}\n\n${template}`);
    } else {
      content += block;
    }
    fs.writeFileSync(handoffPath, content, 'utf8');
    log(`handoff updated -> ${handoffPath}`);
  }

  const incStamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
  fs.appendFileSync(
    path.join(logDir, 'incidents.log'),
    `[${incStamp}] AFTERNOON_WATCH_5PM_REPORT_READY ${reportFile}\n`,
    'utf8',
  );
  log(`DONE report=${reportFile}`);
}

main();
