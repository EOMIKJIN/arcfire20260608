import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  mergeArcCoreChatKnowledgeTopics,
  resolveArcCoreChatPackTopic,
  resolveInboundOpenerPackTopic,
} from './arcCoreChatPackTopic';

test('§3-1 거긴 안전한가 keeps location and adds safety cores', () => {
  const resolved = resolveArcCoreChatPackTopic('거긴 안전한가?', ['location']);
  assert.equal(resolved.topicId, 'safety');
  assert.deepEqual(resolved.cardTopicIds, ['location', 'safety']);
  assert.deepEqual(resolved.toolNames, ['get_location', 'get_planet_cores']);
});

test('bare follow-up stays on the last topic', () => {
  const resolved = resolveArcCoreChatPackTopic('그건?', ['location']);
  assert.equal(resolved.topicId, 'location');
  assert.deepEqual(resolved.toolNames, ['get_location']);
});

test('fresh location does not pull safety tools', () => {
  const resolved = resolveArcCoreChatPackTopic('여기 어디야?', []);
  assert.equal(resolved.topicId, 'location');
  assert.deepEqual(resolved.toolNames, ['get_location']);
});

test('canon questions pack nations routes or setting not location', () => {
  const crimson = resolveArcCoreChatPackTopic('크림슨이 어디야', []);
  assert.equal(crimson.topicId, 'nations');
  assert.deepEqual(crimson.cardTopicIds, ['nations']);
  const routes = resolveArcCoreChatPackTopic('4대 항로', []);
  assert.equal(routes.topicId, 'routes');
  const setting = resolveArcCoreChatPackTopic('싱글플레이야?', []);
  assert.equal(setting.topicId, 'setting');
  const here = resolveArcCoreChatPackTopic('안녕, 여기 어디야?', []);
  assert.equal(here.topicId, 'location');
});

test('inbound opener pack seeds why axis not handshake other', () => {
  assert.equal(resolveArcCoreChatPackTopic('accepted_talk', []).topicId, 'other');
  const spy = resolveInboundOpenerPackTopic('spy');
  assert.equal(spy.topicId, 'spy');
  assert.deepEqual(spy.cardTopicIds, ['spy']);
  assert.deepEqual(spy.toolNames, ['get_spy_alert']);
  const idle = resolveInboundOpenerPackTopic('idle');
  assert.equal(idle.topicId, 'smalltalk');
  assert.deepEqual(idle.toolNames, []);
});

test('everyday pack keeps companion knowledge and asked world keeps its card', () => {
  assert.deepEqual(
    mergeArcCoreChatKnowledgeTopics({
      cardTopicIds: ['other'],
      clueTopic: null,
      humanFirst: true,
    }),
    ['smalltalk', 'other'],
  );
  assert.deepEqual(
    mergeArcCoreChatKnowledgeTopics({
      cardTopicIds: ['seats'],
      clueTopic: null,
      humanFirst: false,
    }),
    ['seats', 'smalltalk'],
  );
});
