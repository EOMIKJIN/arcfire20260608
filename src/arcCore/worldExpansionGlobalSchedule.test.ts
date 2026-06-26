/**
 * 전역 성계 개방 일정 단위 테스트
 * npx tsx src/arcCore/worldExpansionGlobalSchedule.test.ts
 */
import assert from 'node:assert/strict';
import { GALAXY_SYSTEMS } from '../data/galaxy100';
import {
  buildDeterministicGlobalSynthUnlockSchedule,
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

console.log('All worldExpansionGlobalSchedule tests passed.');
