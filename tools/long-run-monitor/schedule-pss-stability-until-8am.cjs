#!/usr/bin/env node
'use strict';

/**
 * 창 시작 후 08:00 KST까지 대기 → PSS 안정화 판정.
 * 숨은 프로세스. 앱 무영향.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { writeMarker, nextOrToday8amKstMs, loadMarker } = require('./run-pss-stability-window-judge.cjs');

const LOG_DIR = path.join(__dirname, 'logs');
const PID_FILE = path.join(LOG_DIR, 'pss-stability-until-8am.pid');
const LOG = path.join(LOG_DIR, 'pss-stability-until-8am.log');

function log(msg) {
  const line = `[${new Date().toISOString().replace('T', ' ').slice(0, 19)}] ${msg}`;
  try {
    fs.appendFileSync(LOG, `${line}\n`, 'utf8');
  } catch {
    /* ignore */
  }
  console.log(msg);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  fs.mkdirSync(LOG_DIR, { recursive: true });
  fs.writeFileSync(PID_FILE, String(process.pid), 'ascii');
  const endMs = loadMarker()?.endMs || nextOrToday8amKstMs();
  log(`WAIT until ${new Date(endMs).toISOString()} pid=${process.pid}`);
  while (Date.now() < endMs) {
    const left = endMs - Date.now();
    await sleep(Math.min(60_000, Math.max(5_000, left)));
  }
  log('JUDGE start');
  const child = spawn(process.execPath, [path.join(__dirname, 'run-pss-stability-window-judge.cjs')], {
    stdio: 'inherit',
    windowsHide: true,
  });
  child.on('exit', (code) => {
    log(`JUDGE exit=${code}`);
    try {
      writeMarker({ sleeperDone: true });
    } catch {
      /* ignore */
    }
  });
}

main().catch((err) => {
  log(`FAIL ${err && err.message ? err.message : err}`);
  process.exit(1);
});
