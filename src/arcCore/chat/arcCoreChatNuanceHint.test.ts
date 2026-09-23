import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hintArcCoreChatNuance } from './arcCoreChatNuanceHint';

test('nuance hint is conservative', () => {
  assert.equal(hintArcCoreChatNuance('여기 어디야?'), '');
  assert.equal(hintArcCoreChatNuance('참 잘했다'), 'irony');
  assert.equal(hintArcCoreChatNuance('농담이지 ㅋㅋ'), 'joke');
});
