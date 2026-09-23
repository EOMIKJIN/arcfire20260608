import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  foldArcCoreChatRollingSummary,
  getArcCoreChatLastQuestion,
  getArcCoreChatRollingSummary,
  getArcCoreChatTopicStack,
  isArcCoreChatFollowUp,
  pushArcCoreChatTopic,
  rememberArcCoreChatAskedFromReply,
  resetArcCoreChatDialogueState,
} from './arcCoreChatDialogueState';

test('topic stack caps at 4 and follow-up detects short replies', () => {
  resetArcCoreChatDialogueState();
  pushArcCoreChatTopic('greet');
  pushArcCoreChatTopic('location');
  pushArcCoreChatTopic('spy');
  pushArcCoreChatTopic('combat');
  pushArcCoreChatTopic('self');
  assert.deepEqual([...getArcCoreChatTopicStack()], ['location', 'spy', 'combat', 'self']);
  assert.equal(isArcCoreChatFollowUp('그건 왜?'), true);
  assert.equal(isArcCoreChatFollowUp('여기 어디야'), false);
});

test('last question is taken from the reply', () => {
  resetArcCoreChatDialogueState();
  rememberArcCoreChatAskedFromReply('관측했다. 다른 것이 필요한가?');
  assert.equal(getArcCoreChatLastQuestion(), '다른 것이 필요한가?');
});

test('fresh session can keep rolling summary and last question', () => {
  resetArcCoreChatDialogueState();
  foldArcCoreChatRollingSummary('여기 어디야', '아르카디아다.');
  rememberArcCoreChatAskedFromReply('관측했다. 다른 것이 필요한가?');
  assert.match(getArcCoreChatRollingSummary(), /아르카디아/);
  resetArcCoreChatDialogueState({ keepMemory: true });
  assert.equal(getArcCoreChatTopicStack().length, 0);
  assert.match(getArcCoreChatRollingSummary(), /아르카디아/);
  assert.equal(getArcCoreChatLastQuestion(), '다른 것이 필요한가?');
  resetArcCoreChatDialogueState();
  assert.equal(getArcCoreChatRollingSummary(), '');
  assert.equal(getArcCoreChatLastQuestion(), '');
});
