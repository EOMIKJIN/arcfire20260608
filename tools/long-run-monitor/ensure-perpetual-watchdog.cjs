#!/usr/bin/env node
'use strict';
/**
 * 영구 워치독 멱등 기동 — PowerShell 창 깜빡임 없음 (Node 전용)
 * Cursor sessionStart · Windows ArcfirePerpetualDetection · npm run monitor:ensure-perpetual
 */
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');

const SCRIPT_ROOT = __dirname;
const logDir = path.join(SCRIPT_ROOT, 'logs');
const disableFlag = path.join(logDir, 'perpetual-detection-DISABLED.flag');
const overnightFlag = path.join(logDir, 'overnight-exception-shutdown.flag');
const pidFile = path.join(logDir, 'perpetual-watchdog.pid');
const runner = path.join(SCRIPT_ROOT, 'run-perpetual-detection-watchdog.ps1');
const ensureLog = path.join(logDir, 'perpetual-watchdog-ensure.log');
const forceRestart = process.argv.includes('--force-restart');

function log(msg) {
  const line = `[${new Date().toISOString().replace('T', ' ').slice(0, 19)}] ${msg}`;
  try {
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(ensureLog, `${line}\n`, 'utf8');
  } catch {
    /* ignore */
  }
}

function isAlive(pid) {
  const n = Number.parseInt(String(pid), 10);
  if (!Number.isFinite(n) || n <= 0) return false;
  try {
    process.kill(n, 0);
    return true;
  } catch {
    return false;
  }
}

function readExistingPid() {
  try {
    return Number.parseInt(fs.readFileSync(pidFile, 'utf8').trim(), 10) || 0;
  } catch {
    return 0;
  }
}

function sleepMs(ms) {
  try {
    const { execFileSync } = require('child_process');
    execFileSync(
      process.execPath,
      [
        '-e',
        `Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,${Math.max(1, Math.floor(ms))})`,
      ],
      { stdio: 'ignore', windowsHide: true, timeout: ms + 5000 },
    );
  } catch {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      /* fallback */
    }
  }
}

function powershellPath() {
  return process.env.SystemRoot != null
    ? path.join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
    : 'powershell.exe';
}

function spawnHiddenWatchdog() {
  // stderr를 파일로 남겨 spawn 즉사 원인을 진단 가능하게 한다 (기존 'ignore'는 무증상 실패였음)
  let errFd = null;
  try {
    errFd = fs.openSync(path.join(logDir, 'perpetual-watchdog-spawn-stderr.log'), 'a');
  } catch {
    /* ignore */
  }
  const child = spawn(
    powershellPath(),
    [
      '-NoProfile',
      '-NonInteractive',
      '-NoLogo',
      '-ExecutionPolicy',
      'Bypass',
      '-WindowStyle',
      'Hidden',
      '-File',
      runner,
    ],
    {
      detached: true,
      stdio: ['ignore', 'ignore', errFd == null ? 'ignore' : errFd],
      windowsHide: true,
      cwd: SCRIPT_ROOT,
    },
  );
  child.on('error', (err) => {
    log(`SPAWN_ERROR direct ${err && err.message ? err.message : String(err)}`);
  });
  if (errFd != null) {
    child.on('spawn', () => {
      try {
        fs.closeSync(errFd);
      } catch {
        /* ignore */
      }
    });
  }
  return child;
}

/**
 * 폴백 1: WMI(Win32_Process.Create) 경유 기동.
 * Cursor 훅 등 부모가 Job Object(kill-on-close) 안에서 돌면 detached 자식도 부모 종료와 함께
 * 정리되어 "died immediately"가 된다. WMI 생성 프로세스는 WmiPrvSE(서비스) 소속이라 job을 벗어난다.
 */
function spawnWatchdogViaWmi() {
  const cmdLine = `"${powershellPath()}" -NoProfile -NonInteractive -NoLogo -ExecutionPolicy Bypass -WindowStyle Hidden -File "${runner}"`;
  const psCommand =
    `$r = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{ CommandLine = '${cmdLine.replace(/'/g, "''")}'; CurrentDirectory = '${SCRIPT_ROOT.replace(/'/g, "''")}' }; ` +
    'if ($r.ReturnValue -eq 0) { Write-Output ("WMI_PID=" + $r.ProcessId) } else { Write-Output ("WMI_RC=" + $r.ReturnValue) }';
  try {
    const out = execFileSync(
      powershellPath(),
      ['-NoProfile', '-NonInteractive', '-NoLogo', '-Command', psCommand],
      { encoding: 'utf8', windowsHide: true, timeout: 20000 },
    ).trim();
    log(`ENSURE_FALLBACK_WMI ${out}`);
    const m = out.match(/WMI_PID=(\d+)/);
    return m ? Number.parseInt(m[1], 10) : 0;
  } catch (err) {
    log(`ENSURE_FALLBACK_WMI_ERROR ${err && err.message ? err.message : String(err)}`);
    return 0;
  }
}

/** 폴백 2: 등록된 Windows 스케줄 작업(ArcfirePerpetualDetection) 실행 — Task Scheduler 서비스 소속으로 기동 */
function spawnWatchdogViaSchtasks() {
  try {
    execFileSync('schtasks.exe', ['/Run', '/TN', 'ArcfirePerpetualDetection'], {
      encoding: 'utf8',
      windowsHide: true,
      timeout: 15000,
    });
    log('ENSURE_FALLBACK_SCHTASKS run requested');
    return true;
  } catch (err) {
    log(`ENSURE_FALLBACK_SCHTASKS_ERROR ${err && err.message ? err.message : String(err)}`);
    return false;
  }
}

/** pid 파일이 살아있는 pid를 가리킬 때까지 대기 (runner가 시작 직후 자기 PID를 기록) */
function waitForAliveWatchdog(totalWaitMs) {
  const deadline = Date.now() + totalWaitMs;
  while (Date.now() < deadline) {
    const pid = readExistingPid();
    if (isAlive(pid)) return pid;
    sleepMs(1000);
  }
  return 0;
}

function isOvernightShutdownActive() {
  try {
    if (!fs.existsSync(overnightFlag)) return false;
    const raw = fs.readFileSync(overnightFlag, 'utf8');
    const m = raw.match(/resume_at_kst=(.+)/);
    if (!m) return true;
    const resume = new Date(m[1].trim().replace(' ', 'T') + '+09:00');
    if (Number.isNaN(resume.getTime())) return true;
    return Date.now() < resume.getTime();
  } catch {
    return false;
  }
}

function main() {
  if (fs.existsSync(disableFlag)) {
    log('ENSURE_SKIP perpetual-detection-DISABLED.flag');
    process.exit(0);
  }

  if (isOvernightShutdownActive()) {
    log('ENSURE_SKIP overnight-exception-shutdown.flag (resume ~08:00 KST)');
    process.exit(0);
  }

  const existing = readExistingPid();
  if (isAlive(existing) && !forceRestart) {
    log(`ENSURE_OK watchdog pid=${existing}`);
    process.exit(0);
  }

  if (forceRestart && isAlive(existing)) {
    try {
      process.kill(existing);
    } catch {
      /* ignore */
    }
    sleepMs(1000);
  }

  if (!isAlive(existing)) {
    try {
      fs.unlinkSync(pidFile);
    } catch {
      /* ignore */
    }
  }

  // 1차: 직접 spawn (기존 경로)
  const child = spawnHiddenWatchdog();
  child.unref();
  let startedPid = waitForAliveWatchdog(6000);
  if (!isAlive(startedPid) && child.pid && isAlive(child.pid)) {
    startedPid = child.pid;
    fs.writeFileSync(pidFile, String(startedPid), 'ascii');
  }
  if (isAlive(startedPid)) {
    log(`ENSURE_STARTED watchdog pid=${startedPid}`);
    process.exit(0);
  }

  // 2차: WMI Create — 부모 Job Object(kill-on-close)에 자식이 딸려 죽는 환경 우회
  log('ENSURE_RETRY direct spawn died — trying WMI fallback');
  const wmiPid = spawnWatchdogViaWmi();
  startedPid = waitForAliveWatchdog(6000);
  if (!isAlive(startedPid) && isAlive(wmiPid)) {
    startedPid = wmiPid;
    fs.writeFileSync(pidFile, String(startedPid), 'ascii');
  }
  if (isAlive(startedPid)) {
    log(`ENSURE_STARTED watchdog pid=${startedPid} (via WMI)`);
    process.exit(0);
  }

  // 3차: 등록된 스케줄 작업 실행 (Task Scheduler 서비스 소속)
  log('ENSURE_RETRY WMI failed — trying schtasks fallback');
  if (spawnWatchdogViaSchtasks()) {
    startedPid = waitForAliveWatchdog(10000);
    if (isAlive(startedPid)) {
      log(`ENSURE_STARTED watchdog pid=${startedPid} (via schtasks)`);
      process.exit(0);
    }
  }

  log('ENSURE_FAIL watchdog died immediately (direct+WMI+schtasks all failed)');
  process.exit(1);
}

main();
