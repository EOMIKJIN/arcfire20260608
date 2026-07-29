/**
 * 전역 성계 개방 — 세대/epoch mismatch(hardReset) 판정 단위 테스트
 * npx tsx src/arcCore/worldExpansionGlobalResetDetection.test.ts
 */
import assert from 'node:assert/strict';
import { resolveWorldExpansionHardReset } from './worldExpansionGlobalResetDetection';

function test(name: string, fn: () => void): void {
  fn();
  console.log(`PASS ${name}`);
}

const POLICY = { resetGeneration: 3, epochDayKey: '2026-08-01' };

test('applied 없음(과거 기록 없음) + 정책 존재 → hardReset=true', () => {
  assert.equal(resolveWorldExpansionHardReset(null, POLICY), true);
});

test('resetGeneration 다름 → hardReset=true', () => {
  assert.equal(
    resolveWorldExpansionHardReset({ resetGeneration: 2, epochDayKey: '2026-08-01' }, POLICY),
    true,
  );
});

test('epochDayKey 다름 → hardReset=true', () => {
  assert.equal(
    resolveWorldExpansionHardReset({ resetGeneration: 3, epochDayKey: '2026-07-01' }, POLICY),
    true,
  );
});

test('세대·epoch 동일(일상 진행) → hardReset=false', () => {
  assert.equal(
    resolveWorldExpansionHardReset({ resetGeneration: 3, epochDayKey: '2026-08-01' }, POLICY),
    false,
  );
});

test('applied === undefined(미하이드레이트, 동기 캐시 레이스) → 안전 기본값 false', () => {
  assert.equal(resolveWorldExpansionHardReset(undefined, POLICY), false);
});

console.log('All worldExpansionGlobalResetDetection tests passed.');
