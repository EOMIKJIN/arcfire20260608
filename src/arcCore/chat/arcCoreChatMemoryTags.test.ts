import assert from 'node:assert/strict';
import { test } from 'node:test';
import { foldArcCoreChatRollingSummaryText } from './arcCoreChatRollingSummary';
import {
  extractArcCoreChatPreferenceTags,
  parseArcCoreChatMemoryTags,
} from './arcCoreChatMemoryTags';

test('preference tags from 좋아/싫어 phrases', () => {
  assert.deepEqual(extractArcCoreChatPreferenceTags('광물 좋아'), [{ key: '좋아', value: '광물' }]);
  assert.deepEqual(extractArcCoreChatPreferenceTags('해적 싫어'), [{ key: '싫어', value: '해적' }]);
  assert.deepEqual(extractArcCoreChatPreferenceTags('좋아:티타늄'), [{ key: '좋아', value: '티타늄' }]);
});

test('fold keeps tag prefix and latest pair', () => {
  const summary = foldArcCoreChatRollingSummaryText('', '광물 좋아', '관측했다.');
  const parsed = parseArcCoreChatMemoryTags(summary);
  assert.deepEqual(parsed.tags, [{ key: '좋아', value: '광물' }]);
  assert.match(parsed.body, /광물 좋아/);
});
