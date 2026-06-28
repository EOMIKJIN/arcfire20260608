#!/usr/bin/env node
'use strict';
/**
 * 영구 워치독 멱등 기동 — PowerShell 창 깜빡임 없음 (Node 전용)
 * Cursor sessionStart · Windows ArcfirePerpetualDetection · npm run monitor:ensure-perpetual
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const SCRIPT_ROOT = __dirname;
const logDir = path.join(SCRIPT_ROOT, 'logs');
const disableFlag = path.join(logDir, 'perpetual-detection-DISABLED.flag');
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

function spawnHiddenWatchdog() {
  const ps =
    process.env.SystemRoot != null
      ? path.join(process.env.SystemRoot, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
      : 'powershell.exe';
  return spawn(
    ps,
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
      stdio: 'ignore',
      windowsHide: true,
      cwd: SCRIPT_ROOT,
    },
  );
}

function main() {
  if (fs.existsSync(disableFlag)) {
    log('ENSURE_SKIP perpetual-detection-DISABLED.flag');
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

  const child = spawnHiddenWatchdog();
  child.unref();
  sleepMs(3000);

  let startedPid = readExistingPid();
  if (!isAlive(startedPid)) {
    sleepMs(2000);
    startedPid = readExistingPid();
  }
  if (!isAlive(startedPid) && child.pid && isAlive(child.pid)) {
    startedPid = child.pid;
    fs.writeFileSync(pidFile, String(startedPid), 'ascii');
  }

  if (isAlive(startedPid)) {
    log(`ENSURE_STARTED watchdog pid=${startedPid}`);
    process.exit(0);
  }

  log('ENSURE_FAIL watchdog died immediately');
  process.exit(1);
}

main();
