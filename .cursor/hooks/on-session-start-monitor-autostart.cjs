'use strict';

/**

 * sessionStart — 영구 실시간 이상탐지 (PowerShell 창 없음)

 *   ensure-perpetual-watchdog.cjs — 워치독 살아 있으면 spawn 자체 생략

 * fail-open

 */

const fs = require('fs');

const path = require('path');

const { spawn } = require('child_process');



const MONITOR_DIR = path.join(process.cwd(), 'tools', 'long-run-monitor');

const ENSURE_CJS = path.join(MONITOR_DIR, 'ensure-perpetual-watchdog.cjs');

const DISABLE_FLAG = path.join(MONITOR_DIR, 'logs', 'perpetual-detection-DISABLED.flag');

const OVERNIGHT_FLAG = path.join(MONITOR_DIR, 'logs', 'overnight-exception-shutdown.flag');

const PID_FILE = path.join(MONITOR_DIR, 'logs', 'perpetual-watchdog.pid');



function isOvernightShutdownActive() {

  try {

    if (!fs.existsSync(OVERNIGHT_FLAG)) return false;

    const raw = fs.readFileSync(OVERNIGHT_FLAG, 'utf8');

    const m = raw.match(/resume_at_kst=(.+)/);

    if (!m) return true;

    const resume = new Date(m[1].trim().replace(' ', 'T') + '+09:00');

    if (Number.isNaN(resume.getTime())) return true;

    return Date.now() < resume.getTime();

  } catch {

    return false;

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



function readWatchdogPid() {

  try {

    return Number.parseInt(fs.readFileSync(PID_FILE, 'utf8').trim(), 10) || 0;

  } catch {

    return 0;

  }

}



function main() {

  try {

    fs.readFileSync(0, 'utf8');

  } catch {

    /* ignore */

  }



  const noteBase =

    '[영구 실시간 탐지] ensure-perpetual-watchdog — 5분 주기 스택·incident→김팀장 handoff · PC 재부팅=monitor:register-perpetual';



  if (fs.existsSync(DISABLE_FLAG)) {

    process.stdout.write(JSON.stringify({}));

    return;

  }



  if (isOvernightShutdownActive()) {

    process.stdout.write(JSON.stringify({ additional_context: '[영구 실시간 탐지] overnight exception shutdown — resume ~08:00 KST' }));

    return;

  }



  const existing = readWatchdogPid();

  if (isAlive(existing)) {

    process.stdout.write(JSON.stringify({ additional_context: `${noteBase} (pid=${existing} OK)` }));

    return;

  }



  try {

    if (fs.existsSync(ENSURE_CJS)) {

      spawn(process.execPath, [ENSURE_CJS], {

        detached: true,

        stdio: 'ignore',

        windowsHide: true,

        cwd: process.cwd(),

      }).unref();

    }

  } catch {

    process.stdout.write(JSON.stringify({}));

    return;

  }



  process.stdout.write(JSON.stringify({ additional_context: noteBase }));

}



main();

