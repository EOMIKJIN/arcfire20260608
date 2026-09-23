import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ArcCoreAgentPack } from './arcCoreAgentPack';
import {
  ARC_CORE_CHAT_CLOUD_HARD_SKIP_MS,
  ARC_CORE_CHAT_CLOUD_TRANSIENT_SKIP_MS,
  isArcCoreChatCloudSkipped,
  markArcCoreChatCloudHardSkip,
  markArcCoreChatCloudTransientSkip,
  resetArcCoreChatCloudSkip,
} from './arcCoreChatCloudSkip';
import {
  ARC_CORE_CHAT_MAX_PACK_CHARS,
  trySerializeArcCoreChatCloudBody,
} from './arcCoreChatPackBudget';
import { ARC_CORE_INBOUND_TALK_ALERT_ID } from './arcCoreInboundTalkRequestPolicy';
import {
  readInboundTalkHubArmed,
  readInboundTalkNextEligibleAt,
  resetArcCoreInboundTalkSchedule,
  writeInboundTalkHubArmed,
  writeInboundTalkNextEligibleAt,
} from './arcCoreInboundTalkSchedule';
import {
  ARC_CORE_CHAT_OVERLAY_DISMISS_ID,
  isArcCoreChatOverlayToDismiss,
} from './arcCoreChatOverlayDismissPolicy';
import { sanitizeArcCoreChatCloudTopicIds } from './sanitizeArcCoreChatCloudTopicIds';

function stubPack(over: Partial<ArcCoreAgentPack> = {}): ArcCoreAgentPack {
  return {
    schemaVersion: 1,
    locale: 'ko',
    userText: '관측',
    workingTranscript: [],
    rollingSummary: '',
    topicStack: ['location'],
    lastArcQuestion: '',
    stance: 'observe',
    purposeId: 'keep_mouth_body',
    mode: 'react',
    nextAsk: '',
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
    policy: {
      worldWrite: false,
      maxChars: 500,
      revealShadow: false,
      persona: 'arc_core',
    },
    ...over,
  };
}

test('oversized pack is not serialized for cloud fetch', () => {
  const ok = trySerializeArcCoreChatCloudBody(stubPack());
  assert.ok(ok);
  assert.ok(ok!.length <= ARC_CORE_CHAT_MAX_PACK_CHARS);
  const huge = trySerializeArcCoreChatCloudBody(stubPack({
    rollingSummary: 'x'.repeat(ARC_CORE_CHAT_MAX_PACK_CHARS),
  }));
  assert.equal(huge, null);
});

test('hard cloud skip is 10 minutes; abort is 3 seconds', () => {
  resetArcCoreChatCloudSkip();
  const t0 = 1_700_000_000_000;
  markArcCoreChatCloudHardSkip(t0);
  assert.equal(isArcCoreChatCloudSkipped(t0 + ARC_CORE_CHAT_CLOUD_HARD_SKIP_MS - 1), true);
  assert.equal(isArcCoreChatCloudSkipped(t0 + ARC_CORE_CHAT_CLOUD_HARD_SKIP_MS), false);

  resetArcCoreChatCloudSkip();
  markArcCoreChatCloudTransientSkip(t0);
  assert.equal(isArcCoreChatCloudSkipped(t0 + ARC_CORE_CHAT_CLOUD_TRANSIENT_SKIP_MS - 1), true);
  assert.equal(isArcCoreChatCloudSkipped(t0 + ARC_CORE_CHAT_CLOUD_TRANSIENT_SKIP_MS), false);

  resetArcCoreChatCloudSkip();
  markArcCoreChatCloudHardSkip(t0);
  markArcCoreChatCloudTransientSkip(t0);
  assert.equal(isArcCoreChatCloudSkipped(t0 + 60_000), true);
});

test('cloud topic ids drop invented axes', () => {
  assert.deepEqual(
    sanitizeArcCoreChatCloudTopicIds(['location', 'hacked_axis', 'greet'], ['location']),
    ['location', 'greet'],
  );
  assert.deepEqual(
    sanitizeArcCoreChatCloudTopicIds(['not_a_topic'], ['location']),
    [],
  );
});

test('inbound schedule reset clears leftover cooldown', () => {
  writeInboundTalkHubArmed(true);
  writeInboundTalkNextEligibleAt(9_999_999);
  resetArcCoreInboundTalkSchedule();
  assert.equal(readInboundTalkHubArmed(), false);
  assert.equal(readInboundTalkNextEligibleAt(), 0);
});

test('stage-exit dismiss matches chat and inbound alert only', () => {
  assert.equal(ARC_CORE_CHAT_OVERLAY_DISMISS_ID, 'arc-core-chat');
  assert.equal(isArcCoreChatOverlayToDismiss({ kind: 'arcCoreChat', id: ARC_CORE_CHAT_OVERLAY_DISMISS_ID }), true);
  assert.equal(isArcCoreChatOverlayToDismiss({ kind: 'alert', id: ARC_CORE_INBOUND_TALK_ALERT_ID }), true);
  assert.equal(isArcCoreChatOverlayToDismiss({ kind: 'settings', id: 'keep-settings' }), false);
});
