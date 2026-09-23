import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ARC_CORE_INBOUND_DND_DEFAULT,
  isHourInDndWindow,
  isInboundTalkDndBlocked,
} from './arcCoreInboundTalkDnd';

test('default DND never blocks', () => {
  assert.equal(isInboundTalkDndBlocked(new Date('2026-08-21T03:00:00'), ARC_CORE_INBOUND_DND_DEFAULT), false);
});

test('overnight window wraps midnight', () => {
  assert.equal(isHourInDndWindow(3, 0, 7), true);
  assert.equal(isHourInDndWindow(10, 0, 7), false);
  assert.equal(isHourInDndWindow(23, 22, 7), true);
  assert.equal(isHourInDndWindow(8, 22, 7), false);
});
