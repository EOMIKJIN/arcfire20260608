import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isArcCoreChatCasualTalk,
  isArcCoreChatHumanFirstTurn,
  isArcCoreChatWorldSeeking,
} from './arcCoreChatCasualTalk';

test('mood questions stay casual and do not count as world seeking', () => {
  assert.equal(isArcCoreChatCasualTalk('오늘 기분이 어때'), true);
  assert.equal(isArcCoreChatWorldSeeking('오늘 기분이 어때'), false);
  assert.equal(isArcCoreChatCasualTalk('날씨 어때'), true);
  assert.equal(isArcCoreChatCasualTalk('심심해'), true);
});

test('world-seeking talk is not casual smalltalk', () => {
  assert.equal(isArcCoreChatWorldSeeking('요즘 무슨 일 있어?'), true);
  assert.equal(isArcCoreChatCasualTalk('요즘 무슨 일 있어?'), false);
  assert.equal(isArcCoreChatWorldSeeking('요즘 어때'), true);
  assert.equal(isArcCoreChatCasualTalk('요즘 어때'), false);
});

test('named talk request is not human-first smalltalk', () => {
  assert.equal(
    isArcCoreChatHumanFirstTurn({
      intent: 'other',
      topicId: 'other',
      userText: '미라와 대화하고 싶다',
    }),
    false,
  );
});

test('human-first is the default unless a system axis or world-seeking', () => {
  assert.equal(
    isArcCoreChatHumanFirstTurn({ intent: 'other', topicId: 'other', userText: '오늘 뭐 했어' }),
    true,
  );
  assert.equal(
    isArcCoreChatHumanFirstTurn({ intent: 'other', topicId: 'smalltalk', userText: '오늘 기분이 어때' }),
    true,
  );
  assert.equal(
    isArcCoreChatHumanFirstTurn({ intent: 'location', topicId: 'location', userText: '여기 어디야?' }),
    false,
  );
  assert.equal(
    isArcCoreChatHumanFirstTurn({ intent: 'other', topicId: 'other', userText: '요즘 무슨 일 있어?' }),
    false,
  );
  assert.equal(
    isArcCoreChatHumanFirstTurn({ intent: 'other', topicId: 'other', userText: '그냥 이야기하자' }),
    true,
  );
  assert.equal(
    isArcCoreChatHumanFirstTurn({ intent: 'other', topicId: 'nations', userText: '크림슨 레기온이 뭐야' }),
    false,
  );
  assert.equal(
    isArcCoreChatHumanFirstTurn({ intent: 'other', topicId: 'routes', userText: '4대 항로가 뭐야' }),
    false,
  );
  assert.equal(
    isArcCoreChatHumanFirstTurn({ intent: 'other', topicId: 'setting', userText: '이 게임 세계관' }),
    false,
  );
});
