import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  bindArcCoreChatGmSession,
  findArcCoreChatGmBeatRow,
  listArcCoreChatGmBeatRows,
} from './arcCoreChatGmBeat';
import { resolveArcCoreChatDialogueDrive } from './arcCoreChatDialogueDrive';
import { resolveLocalConversationalReplySpec } from './localConversationalReplySpec';
import { buildArcCoreChatTurn } from './arcCoreChatTurn';

test('gm beat table covers active, offer, and idle without write', () => {
  const ids = listArcCoreChatGmBeatRows().map((row) => row.id);
  assert.ok(ids.includes('beat_tutorial_active'));
  assert.ok(ids.includes('beat_story_offer'));
  assert.ok(ids.includes('beat_idle'));
  assert.equal(findArcCoreChatGmBeatRow('story_available')?.suggestedProposalId, 'open_mission');
  assert.equal(findArcCoreChatGmBeatRow('idle')?.suggestedProposalId, '');
});

test('bind prefers tutorial then story then quest then offer', () => {
  const tutorial = bindArcCoreChatGmSession({
    activeMissionId: 'mission_001',
    progresses: { mission_001: { missionId: 'mission_001', status: 'active' } },
    locale: 'ko',
  });
  assert.equal(tutorial.when, 'tutorial_active');
  assert.equal(tutorial.beatId, 'beat_tutorial_active');
  assert.equal(tutorial.hasStoryBeat, true);
  assert.equal(tutorial.worldWrite, false);
  assert.match(tutorial.steerLine, /첫 비행/);

  const story = bindArcCoreChatGmSession({
    activeMissionId: 'story_001',
    progresses: { story_001: { missionId: 'story_001', status: 'active' } },
    locale: 'ko',
  });
  assert.equal(story.when, 'story_active');
  assert.match(story.steerLine, /살인/);

  const quest = bindArcCoreChatGmSession({
    activeMissionId: 'sandbox_001',
    progresses: { sandbox_001: { missionId: 'sandbox_001', status: 'active' } },
    locale: 'ko',
  });
  assert.equal(quest.when, 'quest_active');
  assert.match(quest.steerLine, /관문 흔적/);

  const offer = bindArcCoreChatGmSession({
    activeMissionId: null,
    progresses: {},
    locale: 'ko',
  });
  assert.equal(offer.when, 'story_available');
  assert.equal(offer.missionId, 'story_001');
  assert.equal(offer.suggestedProposalId, 'open_mission');
  assert.equal(offer.worldWrite, false);

  const idle = bindArcCoreChatGmSession({
    activeMissionId: null,
    progresses: { story_001: { missionId: 'story_001', status: 'complete' } },
    locale: 'en',
  });
  assert.equal(idle.when, 'idle');
  assert.equal(idle.hasStoryBeat, false);
  assert.equal(idle.suggestedProposalId, '');
});

test('greet with a story beat stays a greeting and does not administer', () => {
  const turn = buildArcCoreChatTurn('안녕 반가워', [], {
    planetLabel: '아르카디아 프라임',
    spyAlertPending: false,
    hasCombatRecord: false,
    hasStoryBeat: true,
  });
  assert.equal(turn.drive.purposeId, 'invite_axis');
  assert.equal(turn.drive.mode, 'react');
  assert.equal(turn.stance, 'observe');
  assert.deepEqual(
    resolveLocalConversationalReplySpec(turn, {
      topicId: 'greet',
      lastArcQuestion: '',
      followUp: false,
      knowledgeCards: [],
      toolResults: [],
      steerLine: '지금 줄기는 첫 비행이다. 수행은 퀘스트 창과 몸이 한다.',
    }),
    {
      key: 'arcCoreChat.reply.greet',
    },
  );
});

test('location with a story beat still answers location, never writes', () => {
  const drive = resolveArcCoreChatDialogueDrive({
    intent: 'location',
    topicId: 'location',
    facts: {
      planetLabel: '아르카디아 프라임',
      spyAlertPending: false,
      hasCombatRecord: false,
      hasStoryBeat: true,
    },
    alreadyCovered: {
      greeted: false,
      location: false,
      spy: false,
      combat: false,
      other: false,
    },
  });
  assert.equal(drive.purposeId, 'anchor_location');
  assert.equal(drive.mode, 'react');
  assert.equal(drive.clueTopic, null);
});
