import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isArcCoreChatCloudHardFailReason,
  isArcCoreChatFreeTierExhaustedReason,
  parseCloudArcCoreChatReply,
} from './arcCoreChatCloudResult';

test('parses AWS Function URL body and Firebase callable wrapper', () => {
  const aws = parseCloudArcCoreChatReply({
    text: '관측 행성은 그대로다.',
    topicIds: ['location', 'location', 'safety'],
    askedQuestion: '다른 축이 필요한가?',
  });
  assert.deepEqual(aws, {
    text: '관측 행성은 그대로다.',
    topicIds: ['location', 'safety'],
    askedQuestion: '다른 축이 필요한가?',
  });
  const wrapped = parseCloudArcCoreChatReply({
    result: { text: ' wrapped ', topicIds: ['greet'] },
  });
  assert.equal(wrapped?.text, 'wrapped');
  assert.deepEqual(wrapped?.topicIds, ['greet']);
});

test('fallback and empty text stay null; no_model is not a hard skip', () => {
  assert.equal(parseCloudArcCoreChatReply({ fallback: true, reason: 'quota' }), null);
  assert.equal(parseCloudArcCoreChatReply({ text: '   ' }), null);
  assert.equal(isArcCoreChatCloudHardFailReason('quota'), false);
  // Groq 일시 실패·한도도 no_model 로 올 수 있어 10분 hard-skip 하면 안 됨
  assert.equal(isArcCoreChatCloudHardFailReason('no_model'), false);
  assert.equal(isArcCoreChatCloudHardFailReason('not_deployed'), true);
  assert.equal(isArcCoreChatFreeTierExhaustedReason('rate_limit'), true);
  assert.equal(isArcCoreChatFreeTierExhaustedReason('quota'), true);
  assert.equal(isArcCoreChatFreeTierExhaustedReason('no_model'), false);
});
