/**
 * npx tsx --test src/arcCore/chat/resolveChatReplySpeaker.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  defaultNlMouthForBackchannelReason,
  resolveChatReplySpeaker,
  shouldHoldOriginMouth,
} from './resolveChatReplySpeaker';

test('everyday talk stays on the active mouth', () => {
  assert.equal(
    resolveChatReplySpeaker({ activeSpeaker: 'operator', userText: '안녕' }),
    'operator',
  );
  assert.equal(
    resolveChatReplySpeaker({ activeSpeaker: 'operator', userText: '너는 누구야' }),
    'operator',
  );
  assert.equal(
    resolveChatReplySpeaker({ activeSpeaker: 'arc_core', userText: '오늘 기분 어때' }),
    'arc_core',
  );
});

test('active quest field notes stay on the companion mouth', () => {
  assert.equal(
    resolveChatReplySpeaker({ activeSpeaker: 'operator', userText: '미션이 뭐야' }),
    'operator',
  );
  assert.equal(
    resolveChatReplySpeaker({ activeSpeaker: 'operator', userText: '스토리 줄기가 뭐야' }),
    'operator',
  );
  assert.equal(
    resolveChatReplySpeaker({ activeSpeaker: 'operator', userText: '그 함장이 말한 거' }),
    'operator',
  );
});

test('seats or origin-self hand off to the origin; inbound hold wins', () => {
  assert.equal(
    resolveChatReplySpeaker({ activeSpeaker: 'operator', userText: '12좌가 뭐야' }),
    'arc_core',
  );
  assert.equal(
    resolveChatReplySpeaker({ activeSpeaker: 'operator', userText: '아크코어는 누구야' }),
    'arc_core',
  );
  assert.equal(
    resolveChatReplySpeaker({
      activeSpeaker: 'operator',
      userText: '안녕',
      originHold: true,
    }),
    'arc_core',
  );
});

test('inbound and combat_end default to the origin mouth', () => {
  assert.equal(defaultNlMouthForBackchannelReason('inbound_request'), 'arc_core');
  assert.equal(defaultNlMouthForBackchannelReason('combat_end'), 'arc_core');
  assert.equal(defaultNlMouthForBackchannelReason('manual'), 'operator');
  assert.equal(defaultNlMouthForBackchannelReason('first_scan'), 'operator');
  assert.equal(shouldHoldOriginMouth('inbound_request'), true);
  assert.equal(shouldHoldOriginMouth('manual'), false);
  assert.equal(shouldHoldOriginMouth('first_scan'), false);
});
