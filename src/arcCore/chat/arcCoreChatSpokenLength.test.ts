import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildArcCoreChatTurn } from './arcCoreChatTurn';
import {
  clipArcCoreChatSpokenLength,
  finalizeArcCoreChatSpokenReply,
  spokenLineBudgetForTurn,
} from './arcCoreChatSpokenLength';

const FACTS = {
  planetLabel: '아르카디아 프라임',
  spyAlertPending: false,
  hasCombatRecord: false,
};

test('everyday mood stays a 3-sentence budget', () => {
  const turn = buildArcCoreChatTurn('오늘 기분이 어때', [], FACTS);
  assert.equal(spokenLineBudgetForTurn(turn), 3);
});

test('asked world axis may use 6 sentences', () => {
  const turn = buildArcCoreChatTurn('12좌가 뭐야', [], FACTS);
  assert.equal(spokenLineBudgetForTurn(turn), 6);
});

test('inbound opener stays a 2-sentence budget', () => {
  const turn = {
    ...buildArcCoreChatTurn('accepted_talk', [], FACTS),
    inboundWhy: 'spy' as const,
  };
  assert.equal(spokenLineBudgetForTurn(turn), 2);
});

test('clip keeps a short reply and cuts a lecture to the budget', () => {
  assert.equal(clipArcCoreChatSpokenLength('그래. 여긴 잠잠하다.', 3), '그래. 여긴 잠잠하다.');
  const long = '하나다. 둘이다. 셋이다. 넷이다. 다섯이다. 여섯이다. 일곱이다.';
  assert.equal(clipArcCoreChatSpokenLength(long, 3), '하나다. 둘이다. 셋이다.');
  assert.equal(clipArcCoreChatSpokenLength(long, 6), '하나다. 둘이다. 셋이다. 넷이다. 다섯이다. 여섯이다.');
  assert.equal(
    clipArcCoreChatSpokenLength('하나다.둘이다.셋이다.넷이다.', 3),
    '하나다. 둘이다. 셋이다.',
  );
});

test('finalize uses everyday budget on mood talk', () => {
  const turn = buildArcCoreChatTurn('오늘 기분이 어때', [], FACTS);
  const long = '하나다. 둘이다. 셋이다. 넷이다. 다섯이다. 여섯이다.';
  assert.equal(finalizeArcCoreChatSpokenReply(long, turn), '하나다. 둘이다. 셋이다.');
});
