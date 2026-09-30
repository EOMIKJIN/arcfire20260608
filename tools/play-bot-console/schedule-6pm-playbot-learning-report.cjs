#!/usr/bin/env node
/**
 * 플레이봇 1일 학습 데일리 — 매일 18:00 KST 상시 보고 (영구 루프)
 *
 * - 매일 18:00 KST 학습 리포트 무조건 생성 (데이터 없으면 FAIL 기록)
 * - 시급 선별 PLAYBOT_DAILY_TRIAGE_LATEST.md · 보고이슈만 escalate (PLAYBOT_DAILY_LOOP.md)
 * - 중단은 `logs/schedule-6pm-playbot-DISABLED.flag` 명시 시에만
 *
 * Usage:
 *   node tools/play-bot-console/schedule-6pm-playbot-learning-report.cjs
 *   node tools/play-bot-console/schedule-6pm-playbot-learning-report.cjs --now
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const logDir = path.join(__dirname, 'logs');
const scheduleLog = path.join(logDir, 'schedule-6pm-playbot.log');
const latestSummary = path.join(logDir, 'DAILY_18_PLAYBOT_LEARNING_LATEST.md');
const pidFile = path.join(logDir, 'schedule-6pm-playbot.pid');
const disableFlag = path.join(logDir, 'schedule-6pm-playbot-DISABLED.flag');
const TargetTime = '18:00';
const runNow = process.argv.includes('--now');
const force = process.argv.includes('--force');

function kstNow() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 9 * 60 * 60000);
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatKst(d = kstNow()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function kstDateKey(d = kstNow()) {
  return formatKst(d).slice(0, 10);
}

function todayReportFile(kst = kstNow()) {
  const dateTag = kstDateKey(kst).replace(/-/g, '');
  return path.join(logDir, `playbot-learning-daily-${dateTag}-1800.md`);
}

function hasReportForToday() {
  const p = todayReportFile();
  try {
    return fs.existsSync(p) && fs.statSync(p).size > 120;
  } catch {
    return false;
  }
}

function hasPublishedForToday() {
  try {
    if (!fs.existsSync(latestSummary)) return false;
    const body = fs.readFileSync(latestSummary, 'utf8');
    return body.includes(kstDateKey()) && body.includes('18:00 KST');
  } catch {
    return false;
  }
}

function alreadyDeliveredToday() {
  return hasReportForToday() && hasPublishedForToday();
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
  const end = Date.now() + ms;
  while (Date.now() < end) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, Math.min(1000, end - Date.now()));
  }
}

function next6pmKst(from = kstNow()) {
  const target = new Date(from);
  target.setHours(18, 0, 0, 0);
  if (from >= target) target.setDate(target.getDate() + 1);
  return target;
}

function waitUntilNext6pm() {
  while (true) {
    if (fs.existsSync(disableFlag)) {
      log('DISABLED flag present — scheduler exiting');
      process.exit(0);
    }
    const now = kstNow();
    const target = next6pmKst(now);
    if (runNow && !global.__pb18RanOnce) {
      global.__pb18RanOnce = true;
      return now;
    }
    if (now.getHours() === 18 && now.getMinutes() < 15 && !alreadyDeliveredToday()) {
      return now;
    }
    if (now.getHours() >= 18 && now.getHours() <= 23 && !alreadyDeliveredToday()) {
      log(`CATCH_UP missing playbot 18:00 for ${kstDateKey(now)} — running now`);
      return now;
    }
    const sec = Math.min(300, Math.max(5, (target - now) / 1000));
    log(`wait until ${TargetTime} KST next=${formatKst(target)} (~${Math.round(sec)}s)`);
    sleepMs(sec * 1000);
  }
}

function writePid() {
  fs.mkdirSync(logDir, { recursive: true });
  fs.writeFileSync(pidFile, String(process.pid), 'ascii');
}

function generateReport() {
  if (!force && alreadyDeliveredToday() && !runNow) {
    log(`SKIP already delivered ${kstDateKey()}`);
    return;
  }
  const tsxCli = path.join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs');
  const writer = path.join(__dirname, 'write-daily-learning-report.ts');
  if (!fs.existsSync(tsxCli)) throw new Error(`tsx missing: ${tsxCli}`);
  const out = execFileSync(process.execPath, [tsxCli, writer], {
    cwd: ROOT,
    timeout: 60_000,
    encoding: 'utf8',
  });
  log(`REPORT ${(out || '').trim() || 'ok'} file=${todayReportFile()}`);
}

function loop() {
  if (fs.existsSync(disableFlag)) {
    log('DISABLED — exit');
    process.exit(0);
  }
  writePid();
  log(`START playbot 18:00 KST learning scheduler pid=${process.pid}`);
  if (runNow) {
    generateReport();
    if (!process.argv.includes('--loop')) return;
  }
  while (true) {
    waitUntilNext6pm();
    try {
      generateReport();
    } catch (err) {
      log(`FAIL generate ${err && err.message ? err.message : err}`);
    }
    sleepMs(70_000);
  }
}

loop();
