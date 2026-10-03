/**
 * npx tsx --test src/navigation/earlyWarImmersionGate.test.ts
 */
import assert from 'node:assert/strict';
import {
  isEarlyWarImmersionOverlayLocked,
  resetEarlyWarImmersionGateForTest,
  syncEarlyWarImmersionTutorialComplete,
} from './earlyWarImmersionGate';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } finally {
    resetEarlyWarImmersionGateForTest();
  }
}

test('미러 없음 → 추가 잠금 없음', () => {
  assert.equal(isEarlyWarImmersionOverlayLocked(), false);
});

test('튜토리얼 미완료 → 잠금', () => {
  syncEarlyWarImmersionTutorialComplete(false);
  assert.equal(isEarlyWarImmersionOverlayLocked(), true);
});

test('튜토리얼 완료 → 잠금 해제', () => {
  syncEarlyWarImmersionTutorialComplete(true);
  assert.equal(isEarlyWarImmersionOverlayLocked(), false);
});

test('플레이어 없음(null) → 추가 잠금 없음', () => {
  syncEarlyWarImmersionTutorialComplete(false);
  syncEarlyWarImmersionTutorialComplete(null);
  assert.equal(isEarlyWarImmersionOverlayLocked(), false);
});

console.log('earlyWarImmersionGate.test.ts — all PASS');
