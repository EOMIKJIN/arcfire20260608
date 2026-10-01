/**
 * 인게임 대사 고정 행 슬롯 — npx tsx --test src/components/typewriterLineSlots.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mapTypewriterDisplayToLineSlots } from './typewriterLineSlots';

test('pads empty rows to the 3-line budget', () => {
  assert.deepEqual(mapTypewriterDisplayToLineSlots('관문이다.', 3), ['관문이다.', '', '']);
});

test('keeps engine newlines as one slot each and never a 4th row', () => {
  const slots = mapTypewriterDisplayToLineSlots('첫째 줄\n둘째 줄\n셋째 줄\n잘린 넷째', 3);
  assert.equal(slots.length, 3);
  assert.deepEqual(slots, ['첫째 줄', '둘째 줄', '셋째 줄']);
});
