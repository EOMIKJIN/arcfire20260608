/**
 * 아크코어 선실행 진입어
 * npx tsx src/arcCore/chat/arcCoreBootChatFirstGate.test.ts
 */
import assert from 'node:assert/strict';
import { isArcCoreBootChatFirstStartPhrase } from './arcCoreBootChatFirstPhrases';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('시작한다 / 시작해 / start', () => {
  assert.equal(isArcCoreBootChatFirstStartPhrase('시작한다'), true);
  assert.equal(isArcCoreBootChatFirstStartPhrase('시작해'), true);
  assert.equal(isArcCoreBootChatFirstStartPhrase('  시작  '), true);
  assert.equal(isArcCoreBootChatFirstStartPhrase('Start'), true);
  assert.equal(isArcCoreBootChatFirstStartPhrase('begin'), true);
});

test('허브에서 칠 일반 문장은 진입어 아님', () => {
  assert.equal(isArcCoreBootChatFirstStartPhrase('상태를 알려줘'), false);
  assert.equal(isArcCoreBootChatFirstStartPhrase('시작한다 지금 전투'), false);
});

console.log('arcCoreBootChatFirstGate.test.ts — all PASS');
