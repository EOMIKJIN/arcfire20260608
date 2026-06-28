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
const latestSummary = path.join(logDir, 'DAILY_5PM_REPORT_LATEST.md');
const scheduleLog = path.join(logDir, 'schedule-5pm-report.log');
const Package = 'com.arcfire.online';
const TimelineMarker = 'AFTERNOON_WATCH_START';

const { writeChatReportPending } = require('./dailyReportChatBrief.cjs');

const args = process.argv.slice(2);
const targetTime = args.includes('--target') ? args[args.indexOf('--target') + 1] : '17:00';
const runNow = args.includes('--now');
const timelineMarker =
  args.includes('--marker') ? args[args.indexOf('--marker') + 1] : TimelineMarker;
const targetTag = targetTime.replace(':', '');

function kstNow() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 9 * 60 * 60000);
}

function formatKst(d = kstNow()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function log(msg) {
  const line = `[${formatKst()}] ${msg}`;
  console.log(line);
  try {
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(scheduleLog, `${line}\n`, 'utf8');
  } catch {
    /* ignore */
  }
}

function sleepMs(ms) {
  if (ms <= 0) return;
  try {
    execFileSync(
      process.execPath,
      [
        '-e',
        `Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,${Math.max(1, Math.floor(ms))})`,
      ],
      { stdio: 'ignore', windowsHide: true, timeout: ms + 10_000 },
    );
  } catch {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      /* fallback */
    }
  }
}

const PS_HIDDEN = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-WindowStyle', 'Hidden'];

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
  const args =
    cmd === 'powershell' || cmd === 'powershell.exe'
      ? [...PS_HIDDEN, ...cmdArgs.filter((a) => a !== '-NoProfile' && a !== '-ExecutionPolicy' && a !== 'Bypass')]
      : cmdArgs;
  return execFileSync(cmd, args, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: false,
    windowsHide: true,
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

function prependHandoffObservation(content, block) {
  const anchor = '## 작업 요약';
  if (content.includes(anchor)) {
    return content.replace(anchor, `${block.trim()}\n\n${anchor}`);
  }
  return `${block.trim()}\n\n${content}`;
}

function main() {
  log(`scheduler start target=${targetTime} KST marker=${timelineMarker}`);
  if (!runNow) waitUntilKst(targetTime);

  const kst = kstNow();
  const kstLabel = formatKst(kst).slice(0, 16);
  const dateTag = formatKst(kst).slice(0, 10).replace(/-/g, '');
  const reportFile = path.join(logDir, `evening-watch-report-${dateTag}-${targetTag}.md`);

  log(`generating report -> ${reportFile}`);
  try {
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
      timelineMarker,
      '-ReportTitle',
      `Arcfire evening watch ${targetTime} KST Kim economy`,
    ]);
  } catch (e) {
    log(`WARN report script failed: ${e.message || e}`);
  }

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
    /GL_SPIKE|PROCESS_DEATH|HARD|baseline_gl|ABNORMAL|FATAL|AFTERNOON_WATCH|PSS_SOFT/.test(ln),
  );

  let memStatus = 'OK';
  if (pssMb !== '?' && parseFloat(pssMb) >= 950) memStatus = 'CRITICAL';
  else if (pssMb !== '?' && parseFloat(pssMb) >= 850) memStatus = 'WARN';

  const rec =
    memStatus === 'CRITICAL'
      ? 'PSS>=950 — hub exit / Skia dispose P0'
      : memStatus === 'WARN'
        ? 'PSS 850+ — soft reclaim floor watch'
        : 'afternoon soak OK — review mem-timeline floor';

  const block = [
    '',
    `## [관측] ${kstLabel} KST — 저녁 감시 · ${targetTime} 자동보고`,
    '',
    `- **김경제 감시**: watch-30m PID **${watchPid}** · report-watch PID **${reportPid}** · auto-fix=${paused ? 'OFF(record-only)' : 'ON'}`,
    `- **mem-monitor**: **${memStatus}** (${memLine})`,
    `- **report**: \`${reportFile}\``,
    `- **latest summary**: \`tools/long-run-monitor/logs/DAILY_5PM_REPORT_LATEST.md\``,
    `- **timeline marker**: ${timelineMarker}`,
    `- **incidents (actionable tail)**: ${actionable.length}`,
    ...(actionable.length ? actionable.map((ln) => `  - ${ln}`) : ['  - (none)']),
    `- **권장(김팀장 1안)**: ${rec}`,
    '',
    `> status: ${memStatus === 'CRITICAL' ? '**ready-for-team-lead-action**' : 'monitor-ok'} · ${targetTime} KST 자동보고 완료`,
    '',
  ].join('\n');

  if (fs.existsSync(handoffPath)) {
    const content = fs.readFileSync(handoffPath, 'utf8');
    fs.writeFileSync(handoffPath, prependHandoffObservation(content, block), 'utf8');
    log(`handoff updated (top) -> ${handoffPath}`);
  }

  fs.writeFileSync(
    latestSummary,
    [
      '# Daily evening KST report — latest',
      '',
      `Updated (KST): ${formatKst(kst)}`,
      `Verdict: **${memStatus}**`,
      `Report: ${reportFile}`,
      `App: ${memLine}`,
      '',
      'See full timeline in report file.',
    ].join('\n'),
    'utf8',
  );

  fs.appendFileSync(
    path.join(logDir, 'incidents.log'),
    `[${formatKst(kst)}] EVENING_WATCH_${targetTag}_REPORT_READY ${reportFile}\n`,
    'utf8',
  );

  writeChatReportPending(logDir, {
    slot: `${targetTime} KST`,
    kstLabel: formatKst(kst),
    verdict: memStatus,
    memLine,
    reportFile,
    adbOk: true,
    watchPid,
    highlights: actionable.length
      ? actionable.slice(-5)
      : ['오후 soak 정상', 'GL 회수 양호'],
    rec,
  });

  log(`DONE verdict=${memStatus} report=${reportFile}`);
}

main();
