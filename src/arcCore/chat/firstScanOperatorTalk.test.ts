/**
 * npx tsx --test src/arcCore/chat/firstScanOperatorTalk.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { KO_DICTIONARY } from '../../i18n/locales/ko';
import {
  FIRST_SCAN_BACKCHANNEL_REASON,
  composeFirstScanReply,
  countSessionUserTurns,
  firstScanTriggerId,
  hintFirstScanTalkKind,
  isFirstScanSession,
} from './firstScanOperatorTalk';

const authored = {
  self: 'SELF',
  location: 'LOC',
  war: 'WAR',
  other: 'OTHER',
  close: 'CLOSE',
  closeAgain: 'AGAIN',
};

test('first-scan copy stays Stella and invites one beat', () => {
  const opener = KO_DICTIONARY['arcCoreChat.firstScan.opener'] ?? '';
  assert.match(opener, /스텔라/);
  assert.doesNotMatch(opener, /근원체|아크코어 근원/);
  assert.match(opener, /한 줄/);
  assert.match(KO_DICTIONARY['arcCoreChat.firstScan.close'] ?? '', /엘렌/);
});

test('canonical first questions map to Stella beats', () => {
  assert.equal(hintFirstScanTalkKind('누구냐'), 'self');
  assert.equal(hintFirstScanTalkKind('너는 누구야'), 'self');
  assert.equal(hintFirstScanTalkKind('여기가 어디냐'), 'location');
  assert.equal(hintFirstScanTalkKind('전쟁이냐'), 'war');
  assert.equal(hintFirstScanTalkKind('크림슨이 뭐야'), 'war');
  assert.equal(hintFirstScanTalkKind('배고파'), 'other');
});

test('session detect and user-turn count stay bounded', () => {
  assert.equal(firstScanTriggerId('arcadia_prime'), 'scan:arcadia_prime');
  assert.equal(
    isFirstScanSession([{ reason: FIRST_SCAN_BACKCHANNEL_REASON }]),
    true,
  );
  assert.equal(isFirstScanSession([{ reason: 'manual' }]), false);
  assert.equal(
    countSessionUserTurns([{ role: 'arc' }, { role: 'user' }, { role: 'user' }]),
    2,
  );
});

test('turn 1 answers; turn 2 closes toward Ellen; turn 3 cuts', () => {
  const turn1 = composeFirstScanReply({
    userText: '누구냐',
    pipelineReply: 'PIPELINE',
    userTurnCount: 1,
    authored,
  });
  assert.equal(turn1, 'SELF');

  const turn2 = composeFirstScanReply({
    userText: '전쟁이냐',
    pipelineReply: 'PIPELINE',
    userTurnCount: 2,
    authored,
  });
  assert.equal(turn2, 'WAR\nCLOSE');

  const unknown = composeFirstScanReply({
    userText: '배고파',
    pipelineReply: 'PIPELINE',
    userTurnCount: 1,
    authored,
  });
  assert.equal(unknown, 'PIPELINE');

  const cut = composeFirstScanReply({
    userText: '또',
    pipelineReply: 'PIPELINE',
    userTurnCount: 3,
    authored,
  });
  assert.equal(cut, 'AGAIN');
});
