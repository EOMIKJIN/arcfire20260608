/**
 * npx tsx --test src/arcCore/colonize/stelliumColonizeDefenseSat.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  appendDefenseSatColonizeSummaryLine,
  resolveStelliumColonizeRequiredDefenseSatLevel,
} from './stelliumColonizeDefenseSat';
import { resetStelliumColonizePolicyCacheForTest } from './stelliumColonizePolicy';

test('정보요약 — 개척선 진입 한 줄 추가, 중복 없음', () => {
  assert.equal(
    appendDefenseSatColonizeSummaryLine('inbound 드론', 'Lv1 개척선 진입가능'),
    'inbound 드론\nLv1 개척선 진입가능',
  );
  assert.equal(
    appendDefenseSatColonizeSummaryLine('inbound 드론\nLv1 개척선 진입가능', 'Lv1 개척선 진입가능'),
    'inbound 드론\nLv1 개척선 진입가능',
  );
});

test('정책 — 개척선 진입 요구 레벨은 L1', () => {
  resetStelliumColonizePolicyCacheForTest();
  assert.equal(resolveStelliumColonizeRequiredDefenseSatLevel(), 1);
});
