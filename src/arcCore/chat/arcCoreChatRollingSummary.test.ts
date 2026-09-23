import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ARC_CORE_CHAT_ROLLING_SUMMARY_MAX,
  clampArcCoreChatRollingSummary,
  extractArcCoreChatAskedQuestion,
  foldArcCoreChatRollingSummaryText,
} from './arcCoreChatRollingSummary';

test('fold rolling summary stays at 400 and keeps the latest pair', () => {
  let summary = '';
  for (let i = 0; i < 20; i += 1) {
    summary = foldArcCoreChatRollingSummaryText(summary, `유저${i} 질문입니다`, `아크${i} 관측입니다`);
  }
  assert.ok(summary.length <= ARC_CORE_CHAT_ROLLING_SUMMARY_MAX);
  assert.match(summary, /유저19/);
  assert.equal(clampArcCoreChatRollingSummary('짧음'), '짧음');
});

test('asked question is the last question clause', () => {
  assert.equal(extractArcCoreChatAskedQuestion('관측했다. 다른 것이 필요한가?'), '다른 것이 필요한가?');
  assert.equal(extractArcCoreChatAskedQuestion('관측만 말한다.'), '');
});
