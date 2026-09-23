import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  delayMsForChatTurnChunk,
  splitArcCoreChatReplyTurns,
} from './splitArcCoreChatReplyTurns';

test('split keeps a single sentence', () => {
  assert.deepEqual(splitArcCoreChatReplyTurns('아르카디아에 있다.'), ['아르카디아에 있다.']);
});

test('split caps at four turns and delay stays bounded', () => {
  const text = '하나다. 둘이다. 셋이다. 넷이다. 다섯이다.';
  const parts = splitArcCoreChatReplyTurns(text);
  assert.equal(parts.length, 4);
  assert.match(parts[3]!, /다섯이다/);
  const delay = delayMsForChatTurnChunk(parts[0]!);
  assert.ok(delay >= 280 && delay <= 900);
});
