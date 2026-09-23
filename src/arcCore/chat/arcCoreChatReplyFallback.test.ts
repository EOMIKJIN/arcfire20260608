import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveArcCoreChatReplyOrLastResort } from './arcCoreChatReplyFallback';

test('resolveArcCoreChatReplyOrLastResort keeps text or uses last-resort', () => {
  assert.equal(resolveArcCoreChatReplyOrLastResort('  안녕  ', 'fail'), '안녕');
  assert.equal(resolveArcCoreChatReplyOrLastResort('   ', '회신에 실패했습니다.'), '회신에 실패했습니다.');
  assert.equal(resolveArcCoreChatReplyOrLastResort('', ''), '');
});
