import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveArcCoreChatOpenSpeech } from './arcCoreChatOpenSpeech';

test('opener becomes the first spoken line and replaces welcome', () => {
  const speech = resolveArcCoreChatOpenSpeech({
    openerText: '방금 스파이 경보가 떴다. 신경 쓰이나?',
    reason: 'inbound_request',
    returning: true,
    welcome: '무엇이 궁금하세요?',
    welcomeBack: '다시 돌아오셨군요.',
  });
  assert.equal(speech.reason, 'inbound_request');
  assert.match(speech.text, /스파이/);
});

test('without opener the generic welcome stays', () => {
  const first = resolveArcCoreChatOpenSpeech({
    reason: 'manual',
    returning: false,
    welcome: '무엇이 궁금하세요?',
    welcomeBack: '다시 돌아오셨군요.',
  });
  assert.equal(first.reason, 'session_welcome');
  assert.equal(first.text, '무엇이 궁금하세요?');

  const back = resolveArcCoreChatOpenSpeech({
    reason: 'manual',
    returning: true,
    welcome: '무엇이 궁금하세요?',
    welcomeBack: '다시 돌아오셨군요.',
  });
  assert.equal(back.reason, 'session_welcome_back');
});
