'use strict';
/**
 * sessionStart — [기본 장기앱 실행 테스트] 모니터 + **데일리 08:00 KST 상시 보고** 자동 가동 (멱등)
 *   - start-watch-30m.ps1 — 30분 meminfo + crash logcat
 *   - ensure-daily-8am-report.ps1 — 매일 08:00 무조건 보고 (FAIL 포함 · DISABLED flag 제외 영구)
 *   - 어떤 경우에도 세션 시작을 막지 않는다(fail-open).
 * 정본: tools/long-run-monitor/logs/DAILY_8AM_REPORT_POLICY.md · WATCH_README.md
 */
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

// 프로젝트 훅은 프로젝트 루트에서 실행된다.
const ROOT = process.cwd();
const MONITOR_DIR = path.join(ROOT, 'tools', 'long-run-monitor');
const PID_FILE = path.join(MONITOR_DIR, 'logs', 'watch-30m.pid');
const START_SCRIPT = path.join(MONITOR_DIR, 'start-watch-30m.ps1');
const ENSURE_8AM_SCRIPT = path.join(MONITOR_DIR, 'ensure-daily-8am-report.ps1');

function readPid() {
  try {
    const raw = fs.readFileSync(PID_FILE, 'utf8').trim();
    const pid = parseInt(raw, 10);
    return Number.isFinite(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

/** Windows tasklist 로 해당 PID 가 살아있는지 확인(없으면 false). */
function isPidAlive(pid) {
  if (!pid) return false;
  try {
    const out = execSync(`tasklist /FI "PID eq ${pid}" /NH`, {
      encoding: 'utf8',
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return new RegExp(`\\b${pid}\\b`).test(out);
  } catch {
    return false;
  }
}

function startDetachedPs1(scriptPath) {
  const child = spawn(
    'powershell',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath],
    { detached: true, stdio: 'ignore', windowsHide: true, cwd: MONITOR_DIR },
  );
  child.unref();
}

function startMonitorDetached() {
  startDetachedPs1(START_SCRIPT);
}

function ensureDaily8amReport() {
  if (!fs.existsSync(ENSURE_8AM_SCRIPT)) return;
  startDetachedPs1(ENSURE_8AM_SCRIPT);
}

function main() {
  // stdin 소비(훅 계약)
  try {
    fs.readFileSync(0, 'utf8');
  } catch {
    /* ignore */
  }

  let note = '';
  const notes = [];
  try {
    if (!fs.existsSync(START_SCRIPT)) {
      note = '';
    } else {
      const pid = readPid();
      if (isPidAlive(pid)) {
        notes.push(`[메모리 모니터] 이미 가동 중 (PID ${pid})`);
      } else {
        startMonitorDetached();
        notes.push('[메모리 모니터] 세션 시작 시 자동 재가동 (start-watch-30m.ps1)');
      }
      ensureDaily8amReport();
      notes.push('[데일리 08:00 보고] 상시 스케줄러 ensure-daily-8am-report.ps1 가동 확인');
      note = notes.join(' · ');
    }
  } catch (e) {
    // fail-open: 세션 시작을 절대 막지 않는다.
    note = '';
  }

  process.stdout.write(JSON.stringify(note ? { additional_context: note } : {}));
}

main();
