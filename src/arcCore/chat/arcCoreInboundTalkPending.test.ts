/**
 * npx tsx --test src/arcCore/chat/arcCoreInboundTalkPending.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  clearInboundTalkPending,
  consumeInboundTalkPending,
  hasInboundTalkPending,
  peekInboundTalkPending,
  resetInboundTalkPendingForTest,
  setInboundTalkPending,
} from './arcCoreInboundTalkPending';

test('inbound pending parks why until consume or clear', () => {
  resetInboundTalkPendingForTest();
  assert.equal(hasInboundTalkPending(), false);
  setInboundTalkPending({ id: 'idle', text: '요즘 어때?' });
  assert.equal(hasInboundTalkPending(), true);
  assert.equal(peekInboundTalkPending()?.id, 'idle');
  assert.equal(hasInboundTalkPending(), true);
  const snap = consumeInboundTalkPending();
  assert.equal(snap?.id, 'idle');
  assert.equal(hasInboundTalkPending(), false);
  setInboundTalkPending({ id: 'combat', text: '전투?' });
  clearInboundTalkPending();
  assert.equal(hasInboundTalkPending(), false);
  resetInboundTalkPendingForTest();
});
