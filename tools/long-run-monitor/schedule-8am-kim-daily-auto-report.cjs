#!/usr/bin/env node
/**
 * 데일리 08:00 KST 상시 자동 보고 (영구 루프)
 *
 * 정책 (2026-06-27 · 김팀장·김경제 공통):
 * - 매일 08:00 KST 보고서 **무조건** 생성·기록 (성공/실패 구분)
 * - adb 미연결 · 보고서 생성 실패 · timeline 무변화 → **FAIL** 로 기록
 * - 앱 실행 여부와 무관 (미실행은 보고 본문에 명시, 스케줄러 자체는 성공)
 * - `schedule-8am-report-DISABLED.flag` 가 없으면 **영구 유지** (중단 = 명시적 flag 만)
 *
 * Usage:
 *   node tools/long-run-monitor/schedule-8am-kim-daily-auto-report.cjs
 *   node tools/long-run-monitor/schedule-8am-kim-daily-auto-report.cjs --now
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync, spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const logDir = path.join(__dirname, 'logs');
const handoffPath = path.join(ROOT, 'tools/kim-team-lead/reports/kim-economy-handoff.md');
const scheduleLog = path.join(logDir, 'schedule-8am-report.log');
const ledgerCsv = path.join(logDir, 'daily-8am-report-ledger.csv');
const latestSummary = path.join(logDir, 'DAILY_8AM_REPORT_LATEST.md');
const policyFile = path.join(logDir, 'DAILY_8AM_REPORT_POLICY.md');
const pidFile = path.join(logDir, 'schedule-8am-perpetual.pid');
const disableFlag = path.join(logDir, 'schedule-8am-report-DISABLED.flag');
const watchPidFile = path.join(logDir, 'watch-30m.pid');
const Package = 'com.arcfire.online';
const TimelineMarker = 'DAILY_8AM_REPORT';
const TargetTime = '08:00';

const { writeChatReportPending } = require('./dailyReportChatBrief.cjs');

const runNow = process.argv.includes('--now');

function kstNow() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 9 * 60 * 60000);
}

function formatKst(d = kstNow()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function kstDateKey(d = kstNow()) {
  return formatKst(d).slice(0, 10);
}

function todayReportFile(kst = kstNow()) {
  const dateTag = kstDateKey(kst).replace(/-/g, '');
  return path.join(logDir, `overnight-final-report-${dateTag}-0800.md`);
}

function hasReportForToday() {
  const p = todayReportFile();
  try {
    return fs.existsSync(p) && fs.statSync(p).size > 200;
  } catch {
    return false;
  }
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

function kstStamp(d = kstNow()) {
  return formatKst(d);
}

function sleepMs(ms) {
  const sec = Math.max(1, Math.ceil(ms / 1000));
  execFileSync(
    'powershell',
    ['-NoProfile', '-Command', `Start-Sleep -Seconds ${sec}`],
    { stdio: 'ignore', shell: true },
  );
}

function sh(cmd, cmdArgs, opts = {}) {
  return execFileSync(cmd, cmdArgs, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...opts,
  });
}

function shSafe(cmd, cmdArgs) {
  try {
    return sh(cmd, cmdArgs);
  } catch (e) {
    return { error: e.message || String(e) };
  }
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

function adbDevices() {
  try {
    const out = sh('adb', ['devices']);
    return out
      .split(/\r?\n/)
      .filter((ln) => /\tdevice$/.test(ln))
      .map((ln) => ln.split('\t')[0]);
  } catch {
    return [];
  }
}

function ensureLedgerHeader() {
  if (!fs.existsSync(ledgerCsv)) {
    fs.writeFileSync(
      ledgerCsv,
      'kst_date,status,report_path,fail_reason,adb_connected,app_running,pss_mb,watch_pid\n',
      'utf8',
    );
  }
}

function appendLedger(row) {
  ensureLedgerHeader();
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  fs.appendFileSync(
    ledgerCsv,
    [
      esc(row.kstDate),
      esc(row.status),
      esc(row.reportPath),
      esc(row.failReason),
      esc(row.adbConnected),
      esc(row.appRunning),
      esc(row.pssMb),
      esc(row.watchPid),
    ].join(',') + '\n',
    'utf8',
  );
}

function next8amKst(from = kstNow()) {
  const target = new Date(from);
  target.setHours(8, 0, 0, 0);
  if (from >= target) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

function waitUntilNext8am() {
  while (true) {
    if (fs.existsSync(disableFlag)) {
      log('DISABLED flag present — scheduler exiting');
      process.exit(0);
    }
    const now = kstNow();
    const target = next8amKst(now);
    if (runNow && !global.__8amRanOnce) {
      global.__8amRanOnce = true;
      return now;
    }
    // 08:00~08:14 정시 창 (구버전 2분 창은 sleep 지연 시 하루 통째 누락)
    if (now.getHours() === 8 && now.getMinutes() < 15) {
      return now;
    }
    // catch-up: 08:00~11:59 사이 오늘 보고서 없으면 즉시 보충
    if (!hasReportForToday() && now.getHours() >= 8 && now.getHours() < 12) {
      log(`CATCH_UP missing report for ${kstDateKey(now)} — running now`);
      return now;
    }
    const sec = Math.min(300, Math.max(5, (target - now) / 1000));
    log(`wait until ${TargetTime} KST next=${formatKst(target)} (~${Math.round(sec)}s)`);
    sleepMs(sec * 1000);
  }
}

function ensureWatchStack() {
  const watchPid = readPid('watch-30m.pid');
  let alive = false;
  if (watchPid && watchPid !== '?') {
    try {
      sh('powershell', [
        '-NoProfile',
        '-Command',
        `exit ([bool](Get-Process -Id ${watchPid} -ErrorAction SilentlyContinue))`,
      ]);
      alive = true;
    } catch {
      alive = false;
    }
  }
  if (alive) {
    log(`WATCH_OK pid=${watchPid}`);
    return;
  }
  log('WATCH_RESTART — ensure-daily-8am calling restart-afternoon-watch');
  try {
    sh('powershell', [
      '-NoProfile',
      '-ExecutionPolicy',
      'Bypass',
      '-File',
      path.join(__dirname, 'restart-afternoon-watch.ps1'),
    ]);
  } catch (e) {
    log(`WARN watch restart failed: ${e.message || e}`);
  }
}

function countTimelineSinceMarker() {
  const timeline = path.join(logDir, 'mem-timeline.csv');
  if (!fs.existsSync(timeline)) return 0;
  try {
    const content = fs.readFileSync(timeline, 'utf8');
    const marker = `DAILY_8AM_REPORT`;
    const idx = content.lastIndexOf(marker);
    if (idx < 0) return readTail(timeline, 500).length;
    return content.slice(idx).split(/\r?\n/).filter(Boolean).length;
  } catch {
    return 0;
  }
}

function writeFailureReport(reportFile, reasons, kst) {
  const body = [
    `# Arcfire daily 08:00 KST report — **FAIL**`,
    '',
    `Generated (KST): ${kstStamp(kst)}`,
    `Package: ${Package}`,
    '',
    '## Verdict',
    '',
    '**STATUS: FAIL**',
    '',
    '### Failure reasons',
    '',
    ...reasons.map((r) => `- ${r}`),
    '',
    '## Policy',
    '',
    'Daily 08:00 report is **mandatory**. Connection failure or empty data is recorded as FAIL.',
    'Disable only via `tools/long-run-monitor/logs/schedule-8am-report-DISABLED.flag` (explicit user/team-lead instruction).',
    '',
    '## Runtime',
    '',
    `- adb devices: ${adbDevices().join(', ') || 'NONE'}`,
    `- watch-30m PID: ${readPid('watch-30m.pid')}`,
    '',
  ].join('\n');
  fs.writeFileSync(reportFile, body, 'utf8');
}

function updateHandoff(block) {
  if (!fs.existsSync(handoffPath)) return;
  const anchor = '## 작업 요약';
  let content = fs.readFileSync(handoffPath, 'utf8');
  if (content.includes(anchor)) {
    content = content.replace(anchor, `${block.trim()}\n\n${anchor}`);
  } else {
    content += `\n${block}\n`;
  }
  fs.writeFileSync(handoffPath, content, 'utf8');
  log(`handoff updated (top) -> ${handoffPath}`);
}

function runDailyReport() {
  const kst = kstNow();
  const dateTag = kstDateKey(kst).replace(/-/g, '');
  const reportFile = todayReportFile(kst);
  const markerLine = `[${kstStamp(kst)}] ${TimelineMarker} ${kstStamp(kst)} KST`;
  fs.appendFileSync(path.join(logDir, 'incidents.log'), `${markerLine}\n`, 'utf8');

  const devices = adbDevices();
  const adbOk = devices.length > 0;
  const failReasons = [];
  if (!adbOk) failReasons.push('ADB_NO_DEVICE — 기기 미연결');

  if (adbOk) {
    ensureWatchStack();
  }

  let memLine = 'APP_NOT_RUNNING';
  let pssMb = '?';
  let glMb = '?';
  let views = '?';
  let appRunning = false;

  if (adbOk) {
    try {
      const pidApp = sh('adb', ['shell', `pidof ${Package}`]).trim();
      if (pidApp) {
        appRunning = true;
        const raw = sh('adb', ['shell', 'dumpsys', 'meminfo', Package]);
        const pss = raw.match(/TOTAL PSS:\s+(\d+)/);
        const gl = raw.match(/^\s*GL mtrack\s+(\d+)/m);
        const v = raw.match(/Views:\s+(\d+)/);
        if (pss) pssMb = (parseInt(pss[1], 10) / 1024).toFixed(1);
        if (gl) glMb = (parseInt(gl[1], 10) / 1024).toFixed(1);
        if (v) views = v[1];
        memLine = `PSS ${pssMb}MB · GL ${glMb}MB · Views ${views} · pid=${pidApp}`;
      } else {
        memLine = 'APP_NOT_RUNNING (report still delivered)';
      }
    } catch (e) {
      failReasons.push(`MEMINFO_ERROR — ${e.message || e}`);
    }
  }

  let reportOk = false;
  if (adbOk) {
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
        TimelineMarker,
        '-ReportTitle',
        'Arcfire daily 08:00 KST auto report (mandatory perpetual)',
      ]);
      reportOk = fs.existsSync(reportFile);
      if (!reportOk) failReasons.push('REPORT_FILE_MISSING — run-overnight-final-report did not create file');
    } catch (e) {
      failReasons.push(`REPORT_GEN_ERROR — ${e.message || e}`);
    }
  }

  const timelineRows = countTimelineSinceMarker();
  if (adbOk && timelineRows < 2) {
    failReasons.push(`TIMELINE_STALE — mem-timeline 신규 샘플 부족 (rows~${timelineRows})`);
  }

  let memStatus = 'OK';
  if (!adbOk) memStatus = 'FAIL';
  else if (pssMb !== '?' && parseFloat(pssMb) >= 950) memStatus = 'CRITICAL';
  else if (pssMb !== '?' && parseFloat(pssMb) >= 850) memStatus = 'WARN';
  else if (failReasons.length > 0) memStatus = 'FAIL';

  const verdict = memStatus === 'FAIL' || failReasons.some((r) => r.startsWith('REPORT')) ? 'FAIL' : memStatus;

  if (!reportOk) {
    writeFailureReport(reportFile, failReasons.length ? failReasons : ['UNKNOWN'], kst);
  } else if (failReasons.length > 0) {
    try {
      fs.appendFileSync(
        reportFile,
        `\n\n---\n\n## Daily verdict append\n\n**STATUS: ${verdict}**\n\n${failReasons.map((r) => `- ${r}`).join('\n')}\n`,
        'utf8',
      );
    } catch {
      /* ignore */
    }
  }

  const watchPid = readPid('watch-30m.pid');
  const paused = fs.existsSync(path.join(logDir, 'monitor-paused.flag'));
  const incidentTail = readTail(path.join(logDir, 'incidents.log'), 15);
  const actionable = incidentTail.filter((ln) =>
    /GL_SPIKE|PROCESS_DEATH|HARD|baseline_gl|ABNORMAL|FATAL|DAILY_8AM/.test(ln),
  );

  const rec =
    verdict === 'FAIL'
      ? '08:00 보고 FAIL — adb/타임라인 확인 · ensure-daily-8am-report 재가동'
      : memStatus === 'CRITICAL'
        ? 'PSS>=950 — hub exit / Skia dispose P0'
        : memStatus === 'WARN'
          ? 'PSS 850+ — floor watch'
          : 'daily 08:00 soak OK — review report';

  const block = [
    '',
    `## [관측] ${kstStamp(kst)} KST — **데일리 08:00 상시 자동보고** (${verdict})`,
    '',
    `- **정책**: 상시 무조건 보고 · 중단은 \`schedule-8am-report-DISABLED.flag\` 명시 시에만`,
    `- **김경제 감시**: watch-30m PID **${watchPid}** · auto-fix=${paused ? 'OFF(record-only)' : 'ON'}`,
    `- **adb**: ${adbOk ? `OK (${devices.join(', ')})` : '**FAIL — 미연결**'}`,
    `- **앱**: ${appRunning ? 'RUNNING' : 'NOT_RUNNING (보고는 정상 산출)'}`,
    `- **mem-monitor**: **${memStatus}** (${memLine})`,
    `- **report**: ${reportFile}`,
    `- **verdict**: **${verdict}**${failReasons.length ? ` — ${failReasons.join('; ')}` : ''}`,
    `- **incidents (actionable tail)**: ${actionable.length}`,
    ...(actionable.length ? actionable.map((ln) => `  - ${ln}`) : ['  - (none)']),
    `- **권장(김팀장 1안)**: ${rec}`,
    '',
    `> status: ${verdict === 'FAIL' || memStatus === 'CRITICAL' ? '**ready-for-team-lead-action**' : 'monitor-ok'} · **08:00 보고체 유지**`,
    '',
  ].join('\n');

  updateHandoff(block);

  appendLedger({
    kstDate: kstDateKey(kst),
    status: verdict,
    reportPath: reportFile,
    failReason: failReasons.join('; ') || '',
    adbConnected: adbOk ? 'yes' : 'no',
    appRunning: appRunning ? 'yes' : 'no',
    pssMb,
    watchPid,
  });

  const summary = [
    '# Daily 08:00 KST report — latest',
    '',
    `Updated (KST): ${kstStamp(kst)}`,
    `Verdict: **${verdict}**`,
    `Report: ${reportFile}`,
    `ADB: ${adbOk ? 'connected' : '**FAIL — not connected**'}`,
    `App: ${appRunning ? 'running' : 'not running'}`,
    failReasons.length ? `Failures:\n${failReasons.map((r) => `- ${r}`).join('\n')}` : '- (none)',
    '',
    'Next: automatic at next 08:00 KST unless DISABLED flag.',
  ].join('\n');
  fs.writeFileSync(latestSummary, summary, 'utf8');

  writeChatReportPending(logDir, {
    slot: '08:00 KST',
    kstLabel: formatKst(kst),
    verdict,
    memLine,
    reportFile,
    adbOk,
    watchPid,
    highlights: [
      `incidents actionable: ${actionable.length}`,
      ...(failReasons.length ? failReasons : []),
      appRunning ? '앱 실행 중' : '앱 미실행(보고서에는 명시)',
    ],
    rec,
  });

  const incEvent =
    verdict === 'FAIL'
      ? `[${kstStamp(kst)}] DAILY_8AM_REPORT_FAIL ${reportFile} ${failReasons.join('|') || 'unknown'}`
      : `[${kstStamp(kst)}] DAILY_8AM_REPORT_READY ${reportFile} verdict=${verdict}`;
  fs.appendFileSync(path.join(logDir, 'incidents.log'), `${incEvent}\n`, 'utf8');
  log(`DONE verdict=${verdict} report=${reportFile}`);
}

function writePolicyOnce() {
  if (fs.existsSync(policyFile)) return;
  const text = `# Daily 08:00 KST report — mandatory perpetual policy

> **Effective**: 2026-06-27 · **Owner**: 김팀장 + 김경제 (동일 운영)

## Rules

1. **Every day at 08:00 KST** a report is generated and logged — **no exceptions**.
2. **FAIL** if: adb not connected, report generation error, timeline has no new samples.
3. **App on/off** does not skip the report — not running is noted in the report body.
4. **No change / empty data** → still report; connection failure → **FAIL**.
5. **Do not stop** unless user or team-lead creates:
   \`tools/long-run-monitor/logs/schedule-8am-report-DISABLED.flag\`

## Artifacts

| File | Purpose |
|------|---------|
| \`overnight-final-report-YYYYMMDD-0800.md\` | Daily report |
| \`daily-8am-report-ledger.csv\` | Pass/fail ledger |
| \`DAILY_8AM_REPORT_LATEST.md\` | Latest summary |
| \`schedule-8am-report.log\` | Scheduler log |
| \`kim-economy-handoff.md\` | Handoff [관측] block |

## Start / ensure

\`\`\`powershell
npm run monitor:ensure-daily-8am
# or
node tools/long-run-monitor/schedule-8am-kim-daily-auto-report.cjs
\`\`\`

Session hook \`on-session-start-monitor-autostart.cjs\` ensures this is running.
`;
  fs.writeFileSync(policyFile, text, 'utf8');
}

function main() {
  writePolicyOnce();
  fs.mkdirSync(logDir, { recursive: true });
  fs.writeFileSync(pidFile, String(process.pid), 'utf8');

  log(`PERPETUAL_START pid=${process.pid} target=${TargetTime} KST policy=${policyFile}`);

  process.on('SIGINT', () => {
    log('SIGINT — scheduler stopping (use DISABLED flag for policy stop)');
    try {
      fs.unlinkSync(pidFile);
    } catch {
      /* ignore */
    }
    process.exit(0);
  });

  while (true) {
    if (fs.existsSync(disableFlag)) {
      log('DISABLED flag — exiting perpetual loop');
      try {
        fs.unlinkSync(pidFile);
      } catch {
        /* ignore */
      }
      break;
    }
    waitUntilNext8am();
    try {
      runDailyReport();
    } catch (e) {
      log(`FATAL runDailyReport: ${e.message || e}`);
      const kst = kstNow();
      const reportFile = path.join(
        logDir,
        `overnight-final-report-${kstDateKey(kst).replace(/-/g, '')}-0800-FAIL.md`,
      );
      writeFailureReport(reportFile, [`SCHEDULER_EXCEPTION — ${e.message || e}`], kst);
      appendLedger({
        kstDate: kstDateKey(kst),
        status: 'FAIL',
        reportPath: reportFile,
        failReason: e.message || String(e),
        adbConnected: 'unknown',
        appRunning: 'unknown',
        pssMb: '?',
        watchPid: readPid('watch-30m.pid'),
      });
      fs.appendFileSync(
        path.join(logDir, 'incidents.log'),
        `[${kstStamp(kst)}] DAILY_8AM_REPORT_FAIL ${reportFile} SCHEDULER_EXCEPTION\n`,
        'utf8',
      );
    }
    global.__8amRanOnce = true;
    sleepMs(120_000);
  }
}

main();
