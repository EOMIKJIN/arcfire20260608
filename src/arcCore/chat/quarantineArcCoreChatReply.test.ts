import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ArcCoreAgentPack } from './arcCoreAgentPack';
import {
  quarantineArcCoreChatReply,
  sanitizeArcCoreChatAskedQuestion,
} from './quarantineArcCoreChatReply';

function pack(revealShadow = false): ArcCoreAgentPack {
  return {
    schemaVersion: 1,
    locale: 'ko',
    userText: '안녕',
    workingTranscript: [],
    rollingSummary: '',
    topicStack: ['greet'],
    lastArcQuestion: '',
    stance: 'observe',
    purposeId: 'invite_axis',
    mode: 'react',
    nextAsk: 'invite_axis',
    purposeLine: '',
    modeLine: '',
    personaFragments: [],
    knowledgeCards: [],
    toolResults: [],
    nuanceHint: '',
    spokenMax: 3,
    gm: {
      beatId: 'beat_idle',
      when: 'idle',
      track: 'idle',
      missionId: '',
      missionTitle: '',
      intentLine: '',
      steerLine: '',
      bodyHint: 'bar',
      suggestedProposalId: '',
      hasStoryBeat: false,
      worldWrite: false,
    },
    policy: { worldWrite: false, maxChars: 500, revealShadow, persona: 'arc_core' },
  };
}

test('quarantine keeps a short spoken line', () => {
  assert.equal(quarantineArcCoreChatReply('관측 행성은 그대로다.', pack()), '관측 행성은 그대로다.');
});

test('quarantine drops empty, write-done, and system leak', () => {
  assert.equal(quarantineArcCoreChatReply('   ', pack()), null);
  assert.equal(quarantineArcCoreChatReply('크레딧을 지급했다.', pack()), null);
  assert.equal(quarantineArcCoreChatReply('{ "toolResults": [] }', pack()), null);
});

test('quarantine blocks shadow nick before reveal', () => {
  assert.equal(quarantineArcCoreChatReply('짝 유저 닉은 알파다.', pack(false)), null);
  assert.ok(quarantineArcCoreChatReply('관측만 말한다.', pack(false)));
  assert.equal(sanitizeArcCoreChatAskedQuestion('짝 유저 닉은?', false), '');
  assert.equal(sanitizeArcCoreChatAskedQuestion('다른 축이 필요한가?', false), '다른 축이 필요한가?');
});
