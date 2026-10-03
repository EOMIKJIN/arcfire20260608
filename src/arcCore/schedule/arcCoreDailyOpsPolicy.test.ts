/**
 * 일일 배치 게이트 — 「12:00 KST 1회」 계약 + 누락 보정.
 * npx tsx src/arcCore/schedule/arcCoreDailyOpsPolicy.test.ts
 */
import assert from 'node:assert/strict';
import { shouldRunArcCoreDailyBatch } from './arcCoreDailyOpsPolicy';

function test(name: string, fn: () => void): void {
  fn();
  console.log(`PASS ${name}`);
}

/** KST 벽시계 → epoch ms */
function kst(iso: string): number {
  return Date.parse(`${iso}+09:00`);
}

test('어제 완료 · 오늘 자정 직후 → 실행 안 함(정오 대기)', () => {
  assert.equal(shouldRunArcCoreDailyBatch(kst('2026-10-03T00:04:06'), { lastBatchCompletedDayKey: '2026-10-02' }), false);
  assert.equal(shouldRunArcCoreDailyBatch(kst('2026-10-03T11:59:00'), { lastBatchCompletedDayKey: '2026-10-02' }), false);
});

test('어제 완료 · 오늘 12:00 이후 → 실행', () => {
  assert.equal(shouldRunArcCoreDailyBatch(kst('2026-10-03T12:00:00'), { lastBatchCompletedDayKey: '2026-10-02' }), true);
  assert.equal(shouldRunArcCoreDailyBatch(kst('2026-10-03T21:30:00'), { lastBatchCompletedDayKey: '2026-10-02' }), true);
});

test('오늘 이미 완료 → 실행 안 함', () => {
  assert.equal(shouldRunArcCoreDailyBatch(kst('2026-10-03T13:00:00'), { lastBatchCompletedDayKey: '2026-10-03' }), false);
});

test('이틀 이상 누락 → 시각 무관 즉시 보정', () => {
  assert.equal(shouldRunArcCoreDailyBatch(kst('2026-10-03T00:10:00'), { lastBatchCompletedDayKey: '2026-10-01' }), true);
  assert.equal(shouldRunArcCoreDailyBatch(kst('2026-10-03T08:00:00'), { lastBatchCompletedDayKey: '2026-09-20' }), true);
});

test('완료 기록 없음 · 가입 당일 → 스킵, 가입 다음날 이후 → 즉시', () => {
  const signup = kst('2026-10-03T09:00:00');
  assert.equal(shouldRunArcCoreDailyBatch(kst('2026-10-03T13:00:00'), { lastBatchCompletedDayKey: null, signupAtMs: signup }), false);
  assert.equal(shouldRunArcCoreDailyBatch(kst('2026-10-04T01:00:00'), { lastBatchCompletedDayKey: null, signupAtMs: signup }), true);
});

test('완료 기록 없음 · 가입 정보 없음 → 정오 이후만', () => {
  assert.equal(shouldRunArcCoreDailyBatch(kst('2026-10-03T11:00:00'), { lastBatchCompletedDayKey: null }), false);
  assert.equal(shouldRunArcCoreDailyBatch(kst('2026-10-03T12:01:00'), { lastBatchCompletedDayKey: null }), true);
});

console.log('[arcCoreDailyOpsPolicy] all tests passed');
