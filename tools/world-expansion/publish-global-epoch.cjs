#!/usr/bin/env node
/**
 * 전역 성계 개방 epoch → Firebase RTDB arccore/worldExpansion/master/state publish
 *
 * Usage:
 *   npm run world-expansion:publish-epoch
 *   npm run world-expansion:publish-epoch -- --epoch 2026-06-18 --generation 2 --dry-run
 *   npm run world-expansion:publish-epoch -- --reset-launch --epoch 2026-07-01
 *
 * Options:
 *   --epoch YYYY-MM-DD     epochDayKey (1일차 개방 시작일)
 *   --generation N         resetGeneration (정식 출시·시즌 리셋 시 증가)
 *   --systems-per-day N    하루 개방 synth 수 (기본 1)
 *   --time-zone TZ         기본 Asia/Seoul
 *   --notes TEXT           운영 메모
 *   --reset-launch         generation+1 + 오늘(KST) epoch ( --epoch 로 덮어쓰기 가능)
 *   --dry-run              RTDB write 없이 payload 출력
 *   --cli                  firebase database:update (기본: GOOGLE_APPLICATION_CREDENTIALS 없을 때)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const CSV_PATH = path.join(ROOT, 'tables/balance/world_expansion_timing_policy.csv');
const PAYLOAD_OUT = path.join(ROOT, 'tools/world-expansion/reports/rtdb-world-expansion-payload.json');

const dryRun = process.argv.includes('--dry-run');
const resetLaunch = process.argv.includes('--reset-launch');

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  if (i < 0 || i + 1 >= process.argv.length) return null;
  return process.argv[i + 1];
}

function readCsvEpochDefaults() {
  const raw = fs.readFileSync(CSV_PATH, 'utf8').trim().split(/\r?\n/);
  const header = raw[0].split(',');
  const row = raw[1].split(',');
  const map = Object.fromEntries(header.map((h, i) => [h.trim(), (row[i] ?? '').trim()]));
  return {
    epochDayKey: map.epochDayKey || '2026-06-01',
    timeZone: map.timeZone || 'Asia/Seoul',
    resetGeneration: Number(map.resetGeneration || '1') || 1,
    systemsPerDay: Number(map.systemsPerDay || '1') || 1,
  };
}

function formatKstDayKey(d = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function buildPayload() {
  const csv = readCsvEpochDefaults();
  let epochDayKey = argValue('--epoch') || csv.epochDayKey;
  let resetGeneration = Number(argValue('--generation') ?? csv.resetGeneration) || csv.resetGeneration;
  const systemsPerDay = Number(argValue('--systems-per-day') ?? csv.systemsPerDay) || csv.systemsPerDay;
  const timeZone = argValue('--time-zone') || csv.timeZone;
  const notes = argValue('--notes') || undefined;

  if (resetLaunch) {
    resetGeneration = (Number(argValue('--generation')) || csv.resetGeneration) + 1;
    if (!argValue('--epoch')) epochDayKey = formatKstDayKey();
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(epochDayKey)) {
    throw new Error(`invalid --epoch: ${epochDayKey}`);
  }

  const now = Date.now();
  return {
    schemaVersion: 1,
    epochDayKey,
    timeZone,
    resetGeneration,
    systemsPerDay,
    globalScheduleEnabled: true,
    updatedAt: now,
    ...(notes ? { notes } : {}),
  };
}

function publishWithFirebaseCli(payload) {
  const rel = 'arccore/worldExpansion/master/state';
  const tmp = path.join(ROOT, 'tools/world-expansion/reports/.rtdb-world-expansion-tmp.json');
  fs.mkdirSync(path.dirname(tmp), { recursive: true });
  fs.writeFileSync(tmp, JSON.stringify(payload));
  execFileSync(
    'firebase',
    ['database:update', rel, tmp, '--force', '--project', process.env.FIREBASE_PROJECT_ID || 'arcfire-online'],
    { stdio: 'inherit', cwd: ROOT },
  );
}

function main() {
  const payload = buildPayload();
  fs.mkdirSync(path.dirname(PAYLOAD_OUT), { recursive: true });
  fs.writeFileSync(PAYLOAD_OUT, JSON.stringify({ 'worldExpansion/master/state': payload }, null, 2));

  console.log('--- World Expansion RTDB publish ---');
  console.log(JSON.stringify(payload, null, 2));
  console.log(`payload: ${PAYLOAD_OUT}`);

  if (dryRun) {
    console.log('[dry-run] RTDB write skipped');
    return;
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        databaseURL: process.env.FIREBASE_DATABASE_URL || 'https://arcfire-online-default-rtdb.firebaseio.com',
      });
    }
    admin.database().ref('arccore/worldExpansion/master/state').set(payload);
    console.log('[admin] published ok');
    return;
  }

  publishWithFirebaseCli(payload);
  console.log('[cli] published ok');
}

main();
