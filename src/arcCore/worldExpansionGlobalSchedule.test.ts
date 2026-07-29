/**
 * 전역 성계 개방 일정 단위 테스트
 * npx tsx src/arcCore/worldExpansionGlobalSchedule.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GALAXY_SYSTEMS, GAMEPLAY_SYSTEM_IDS } from '../data/galaxy100';
import {
  buildDeterministicGlobalSynthUnlockSchedule,
  buildGlobalSynthUnlockTargetIds,
  calendarDaysBetweenDayKeys,
  computeGlobalSynthUnlockTargetCount,
} from './worldExpansionGlobalSchedule';
import type { ArcCoreWorldExpansionGlobalPolicy } from './worldExpansionGlobalPolicy';

const POLICY: ArcCoreWorldExpansionGlobalPolicy = {
  globalScheduleEnabled: true,
  epochDayKey: '2026-06-01',
  timeZone: 'Asia/Seoul',
  resetGeneration: 1,
  systemsPerDay: 1,
  source: 'csv',
};

function test(name: string, fn: () => void): void {
  fn();
  console.log(`PASS ${name}`);
}

test('calendarDaysBetweenDayKeys', () => {
  assert.equal(calendarDaysBetweenDayKeys('2026-06-01', '2026-06-01'), 0);
  assert.equal(calendarDaysBetweenDayKeys('2026-06-01', '2026-06-09'), 8);
});

test('9일차 설치 유저는 9개 synth 목표', () => {
  const day9Ms = Date.parse('2026-06-09T12:00:00+09:00');
  assert.equal(computeGlobalSynthUnlockTargetCount(POLICY, day9Ms), 9);
});

test('deterministic schedule is stable', () => {
  const a = buildDeterministicGlobalSynthUnlockSchedule(GALAXY_SYSTEMS, 5);
  const b = buildDeterministicGlobalSynthUnlockSchedule(GALAXY_SYSTEMS, 5);
  assert.deepEqual(a, b);
  assert.equal(a.length, 5);
  assert.equal(new Set(a).size, 5);
});

test('before epoch returns 0 unlocks', () => {
  const beforeMs = Date.parse('2026-05-31T12:00:00+09:00');
  assert.equal(computeGlobalSynthUnlockTargetCount(POLICY, beforeMs), 0);
});

test('2026-06-26 epoch 기준일 — 당일 1개 synth 목표', () => {
  const launchPolicy: ArcCoreWorldExpansionGlobalPolicy = {
    ...POLICY,
    epochDayKey: '2026-06-26',
    resetGeneration: 2,
  };
  const launchDayMs = Date.parse('2026-06-26T12:00:00+09:00');
  assert.equal(computeGlobalSynthUnlockTargetCount(launchPolicy, launchDayMs), 1);
  const schedule = buildDeterministicGlobalSynthUnlockSchedule(GALAXY_SYSTEMS, 1);
  assert.equal(schedule.length, 1);
  assert.equal(schedule[0], 'synth_002');
});

// ── M5(service-launch-world-expansion-reset-20260729) — hardReset 재개방 시나리오 ──

test('(a) 세대 bump(hardReset) — 기존 다수 unlock이 targetCount로 축소(초과분 무시)', () => {
  const manyAlreadyUnlocked = ['synth_002', 'synth_005', 'synth_009', 'synth_012', 'synth_020'];
  const schedule = buildDeterministicGlobalSynthUnlockSchedule(
    GALAXY_SYSTEMS,
    2, // hardReset 후 epoch 목표 2개
    undefined,
    manyAlreadyUnlocked,
    false, // preserveAlreadyUnlocked=false → 접두 고정 끔
  );
  assert.equal(schedule.length, 2, 'hardReset이면 기존 5개가 아니라 targetCount(2)로 정확히 제한돼야 함');
});

test('(a-대조) 동일 입력이라도 preserveAlreadyUnlocked=true(기본값)면 기존 회귀 동작 유지 — 5개 그대로', () => {
  const manyAlreadyUnlocked = ['synth_002', 'synth_005', 'synth_009', 'synth_012', 'synth_020'];
  const schedule = buildDeterministicGlobalSynthUnlockSchedule(
    GALAXY_SYSTEMS,
    2,
    undefined,
    manyAlreadyUnlocked,
    // preserveAlreadyUnlocked 생략 → 기본 true
  );
  assert.equal(schedule.length, 5, '일상 진행(preserve)은 이미 열린 5개를 되돌리지 않아야 함(회귀 금지)');
  for (const id of manyAlreadyUnlocked) assert.ok(schedule.includes(id));
});

test('(b) 세대 동일 + 일수+1(정상 진행) — 1개만 추가되고 기존 유지', () => {
  const already = ['synth_002', 'synth_005', 'synth_009'];
  const { targetSynthIds } = buildGlobalSynthUnlockTargetIds(
    GALAXY_SYSTEMS,
    { ...POLICY, epochDayKey: '2026-06-01' },
    Date.parse('2026-06-04T12:00:00+09:00'), // epoch+3일 → target=4
    already,
    true,
  );
  assert.equal(targetSynthIds.length, 4);
  for (const id of already) assert.ok(targetSynthIds.includes(id), `${id} 유지돼야 함`);
  const added = targetSynthIds.filter((id) => !already.includes(id));
  assert.equal(added.length, 1, '정상 진행은 1개만 새로 추가돼야 함');
});

test('(c) epoch 전날(hardReset 여부 무관) → targetCount=0 → synth 전부 잠금(빈 스케줄)', () => {
  const beforeMs = Date.parse('2026-05-31T12:00:00+09:00');
  const targetCount = computeGlobalSynthUnlockTargetCount(POLICY, beforeMs);
  assert.equal(targetCount, 0);
  const schedule = buildDeterministicGlobalSynthUnlockSchedule(
    GALAXY_SYSTEMS,
    targetCount,
    undefined,
    ['synth_002', 'synth_005'], // hardReset 상황이라도 targetCount=0이면 전부 무시
    false,
  );
  assert.deepEqual(schedule, []);
});

test('(d) GAMEPLAY_SYSTEM_IDS(21코어)는 baseline에 이미 포함 — synth 스케줄 결과물에 절대 나오지 않음', () => {
  const schedule = buildDeterministicGlobalSynthUnlockSchedule(GALAXY_SYSTEMS, 15);
  for (const id of schedule) {
    assert.equal(GAMEPLAY_SYSTEM_IDS.has(id), false, `${id}는 21코어가 아니라 synth여야 함`);
  }
});

test('(d-2) 정적 확인 — reconcileGlobalSynthUnlocks의 toRemove가 21코어(baseline)를 제외함(worldStore.ts 소스)', () => {
  const src = readFileSync(resolve(__dirname, '../store/worldStore.ts'), 'utf8');
  assert.match(
    src,
    /const baseline = new Set\(DEFAULT_UNLOCKED_SYSTEM_IDS\);/,
    'reconcileGlobalSynthUnlocks가 21코어 baseline Set을 만들어야 함',
  );
  assert.match(
    src,
    /!baseline\.has\(id\)/,
    'toRemove/currentSynthUnlocked 계산에서 baseline(21코어)을 제외하는 필터가 있어야 함(hardReset이라도 21코어는 절대 잠기지 않음)',
  );
});

console.log('All worldExpansionGlobalSchedule tests passed.');
