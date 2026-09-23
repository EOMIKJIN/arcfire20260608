import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  bindArcCoreInboundTalkWhy,
  isArcCoreSpokenQuestion,
  pickArcCoreInboundTalkWhyId,
} from './arcCoreInboundTalkWhy';
import { buildInboundOpenerTurn } from './arcCoreInboundOpenerTurn';

test('inbound why prefers spy then combat then story', () => {
  assert.equal(pickArcCoreInboundTalkWhyId({
    spyAlertPending: true,
    hasCombatRecord: true,
    hasStoryBeat: true,
    planetLabel: '아르카디아 프라임',
  }), 'spy');
  assert.equal(pickArcCoreInboundTalkWhyId({
    spyAlertPending: false,
    hasCombatRecord: true,
    hasStoryBeat: true,
    planetLabel: '아르카디아 프라임',
  }), 'combat');
  assert.equal(pickArcCoreInboundTalkWhyId({
    spyAlertPending: false,
    hasCombatRecord: false,
    hasStoryBeat: true,
    planetLabel: '아르카디아 프라임',
  }), 'story');
  assert.equal(pickArcCoreInboundTalkWhyId({
    spyAlertPending: false,
    hasCombatRecord: false,
    hasStoryBeat: false,
    planetLabel: '아르카디아 프라임',
  }), 'observe');
  assert.equal(pickArcCoreInboundTalkWhyId({
    spyAlertPending: false,
    hasCombatRecord: false,
    hasStoryBeat: false,
    planetLabel: '아르카디아 프라임',
    hasWorldChange: true,
  }), 'world');
  assert.equal(pickArcCoreInboundTalkWhyId({
    spyAlertPending: false,
    hasCombatRecord: false,
    hasStoryBeat: true,
    planetLabel: '아르카디아 프라임',
    hasWorldChange: true,
  }), 'story');
});

test('story why uses the GM steer and never writes', () => {
  const why = bindArcCoreInboundTalkWhy({
    spyAlertPending: false,
    hasCombatRecord: false,
    hasStoryBeat: true,
    planetLabel: '아르카디아 프라임',
    steerLine: '지금 줄기는 첫 비행이다. 수행은 퀘스트 창과 몸이 한다.',
    locale: 'ko',
  });
  assert.equal(why.id, 'story');
  assert.match(why.text, /첫 비행/);
  assert.equal(isArcCoreSpokenQuestion(why.text), true);
});

test('inbound why fallbacks are spoken questions', () => {
  const spy = bindArcCoreInboundTalkWhy({
    spyAlertPending: true,
    hasCombatRecord: false,
    hasStoryBeat: false,
    planetLabel: '아르카디아 프라임',
    steerLine: '',
    locale: 'ko',
  });
  assert.equal(spy.id, 'spy');
  assert.equal(isArcCoreSpokenQuestion(spy.text), true);

  const idle = bindArcCoreInboundTalkWhy({
    spyAlertPending: false,
    hasCombatRecord: false,
    hasStoryBeat: false,
    planetLabel: '',
    steerLine: '',
    locale: 'ko',
  });
  assert.equal(idle.id, 'idle');
  assert.equal(isArcCoreSpokenQuestion(idle.text), true);

  const world = bindArcCoreInboundTalkWhy({
    spyAlertPending: false,
    hasCombatRecord: false,
    hasStoryBeat: false,
    planetLabel: '아르카디아 프라임',
    steerLine: '',
    locale: 'ko',
    hasWorldChange: true,
    worldFact: '아르카디아 프라임 점유가 스텔리움 연합에서 크림슨 레기온으로 바뀌었다.',
  });
  assert.equal(world.id, 'world');
  assert.match(world.text, /점유가/);
  assert.equal(isArcCoreSpokenQuestion(world.text), true);
});

test('inbound opener turn leads with empty nextAsk', () => {
  const turn = buildInboundOpenerTurn(
    { id: 'combat', text: '방금 전투, 어땠나?' },
    { planetLabel: '아르카디아 프라임', spyAlertPending: false, hasCombatRecord: true },
  );
  assert.equal(turn.inboundWhy, 'combat');
  assert.equal(turn.drive.purposeId, 'invite_axis');
  assert.equal(turn.drive.mode, 'lead');
  assert.equal(turn.drive.nextAsk, '');
  assert.equal(turn.userText, 'accepted_talk');
});
