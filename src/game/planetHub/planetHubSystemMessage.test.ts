/**
 * npx tsx --test src/game/planetHub/planetHubSystemMessage.test.ts
 */
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import {
  PLANET_HUB_SYSTEM_MESSAGE_ID,
  clearPlanetHubSystemMessage,
  getPlanetHubSystemMessage,
  presentPlanetHubSystemMessage,
  resetPlanetHubSystemMessageForTests,
} from './planetHubSystemMessage';

afterEach(() => {
  resetPlanetHubSystemMessageForTests();
});

test('present 1줄 · 같은 스냅샷은 유지 · id clear', () => {
  presentPlanetHubSystemMessage({
    id: PLANET_HUB_SYSTEM_MESSAGE_ID.mining,
    text: '채굴이 진행 중입니다...',
    tone: 'progress',
  });
  const first = getPlanetHubSystemMessage();
  presentPlanetHubSystemMessage({
    id: PLANET_HUB_SYSTEM_MESSAGE_ID.mining,
    text: '채굴이 진행 중입니다...',
    tone: 'progress',
  });
  assert.equal(getPlanetHubSystemMessage(), first);
  clearPlanetHubSystemMessage('other');
  assert.equal(getPlanetHubSystemMessage()?.id, PLANET_HUB_SYSTEM_MESSAGE_ID.mining);
  clearPlanetHubSystemMessage(PLANET_HUB_SYSTEM_MESSAGE_ID.mining);
  assert.equal(getPlanetHubSystemMessage(), null);
});

test('나중 present가 현재 1줄을 교체한다', () => {
  presentPlanetHubSystemMessage({ id: 'a', text: '하나', tone: 'info' });
  presentPlanetHubSystemMessage({ id: 'b', text: '둘', tone: 'progress' });
  assert.deepEqual(getPlanetHubSystemMessage(), { id: 'b', text: '둘', tone: 'progress' });
  clearPlanetHubSystemMessage();
  assert.equal(getPlanetHubSystemMessage(), null);
});
