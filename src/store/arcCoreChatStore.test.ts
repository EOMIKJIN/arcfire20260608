import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ARC_CORE_CHAT_MAX_MESSAGES,
  ARC_CORE_CHAT_MAX_TEXT,
  ARC_CORE_CHAT_SESSION_WELCOME_REASON,
  clampArcCoreChatText,
  filterArcCoreChatReplyPrior,
  hasArchivedArcCoreChatConversation,
  normalizeArcCoreChatPayload,
} from './arcCoreChatStore';

test('clampArcCoreChatText cuts at max text', () => {
  assert.equal(clampArcCoreChatText('ab').length, 2);
  const long = '한'.repeat(ARC_CORE_CHAT_MAX_TEXT + 20);
  assert.equal(clampArcCoreChatText(long).length, ARC_CORE_CHAT_MAX_TEXT);
});

test('normalizeArcCoreChatPayload FIFO 40 and drops bad roles', () => {
  const messages = [];
  for (let i = 0; i < 50; i += 1) {
    messages.push({ id: `m${i}`, role: 'user', text: `t${i}`, atMs: i });
  }
  messages.push({ id: 'bad', role: 'admin', text: 'no', atMs: 1 });
  const parsed = normalizeArcCoreChatPayload({ messages, lastFired: [] });
  assert.equal(parsed.messages.length, ARC_CORE_CHAT_MAX_MESSAGES);
  assert.equal(parsed.messages[0]?.text, 't10');
  assert.equal(parsed.messages[39]?.text, 't49');
});

test('normalizeArcCoreChatPayload lastFired cap 16 and broken json shape', () => {
  const lastFired = [];
  for (let i = 0; i < 20; i += 1) {
    lastFired.push({ key: 'combat_end', id: `w${i}`, atMs: i });
  }
  const parsed = normalizeArcCoreChatPayload({ lastFired, messages: 'nope' });
  assert.equal(parsed.lastFired.length, 16);
  assert.equal(parsed.lastFired[0]?.id, 'w4');
  assert.deepEqual(normalizeArcCoreChatPayload(null).messages, []);
  assert.equal(normalizeArcCoreChatPayload(null).rollingSummary, '');
  assert.equal(normalizeArcCoreChatPayload(null).lastArcQuestion, '');
});

test('v1 payload hydrates empty rolling summary; v2 keeps 400 cap', () => {
  const v1 = normalizeArcCoreChatPayload({
    schemaVersion: 1,
    messages: [{ id: 'u', role: 'user', text: '안녕', atMs: 1 }],
    lastFired: [],
  });
  assert.equal(v1.rollingSummary, '');
  assert.equal(v1.lastArcQuestion, '');
  assert.equal(v1.judgment.pendingProposalId, '');
  assert.equal(v1.judgment.counts.length, 0);
  const withQ = normalizeArcCoreChatPayload({
    lastArcQuestion: `${'q'.repeat(250)}?`,
  });
  assert.equal(withQ.lastArcQuestion.length, 200);
  const long = normalizeArcCoreChatPayload({
    rollingSummary: `${'이전 / '.repeat(80)}끝`,
  });
  assert.ok(long.rollingSummary.length <= 400);
  assert.match(long.rollingSummary, /끝/);
});

test('normalize keeps speakerId and defaults the active mouth to operator', () => {
  const parsed = normalizeArcCoreChatPayload({
    schemaVersion: 3,
    messages: [
      { id: 'a', role: 'arc', text: '연결됐어.', atMs: 1, speakerId: 'operator' },
      { id: 'b', role: 'arc', text: '몸은 나다.', atMs: 2, speakerId: 'nope' },
    ],
  });
  assert.equal(parsed.activeSpeakerId, 'operator');
  assert.equal(parsed.operatorIntroPlayed, false);
  assert.equal(parsed.messages[0]?.speakerId, 'operator');
  assert.equal(parsed.messages[1]?.speakerId, undefined);
  const kept = normalizeArcCoreChatPayload({
    activeSpeakerId: 'arc_core',
    operatorIntroPlayed: true,
  });
  assert.equal(kept.activeSpeakerId, 'arc_core');
  assert.equal(kept.operatorIntroPlayed, true);
});

test('hasArchivedArcCoreChatConversation looks at user turns only', () => {
  assert.equal(hasArchivedArcCoreChatConversation([]), false);
  assert.equal(
    hasArchivedArcCoreChatConversation([
      { id: 'a', role: 'arc', text: '무엇이 궁금하세요?', atMs: 1, reason: 'session_welcome' },
    ]),
    false,
  );
  assert.equal(
    hasArchivedArcCoreChatConversation([
      { id: 'u', role: 'user', text: '안녕', atMs: 2 },
    ]),
    true,
  );
});

test('filterArcCoreChatReplyPrior drops session welcome', () => {
  const prior = filterArcCoreChatReplyPrior([
    {
      id: 'w',
      role: 'arc',
      text: '무엇이 궁금하세요?',
      atMs: 1,
      reason: ARC_CORE_CHAT_SESSION_WELCOME_REASON,
    },
    { id: 'u', role: 'user', text: '여기 어디야?', atMs: 2 },
    { id: 'a', role: 'arc', text: '에덴에 있다.', atMs: 3 },
  ]);
  assert.equal(prior.length, 2);
  assert.equal(prior[0]?.text, '여기 어디야?');
  assert.equal(prior[1]?.text, '에덴에 있다.');
});

test('v4 payload hydrates empty life; schema 5 keeps anchors', () => {
  const v4 = normalizeArcCoreChatPayload({
    schemaVersion: 4,
    messages: [],
  });
  assert.equal(v4.schemaVersion, 5);
  assert.equal(v4.life.anchors.length, 0);
  assert.equal(v4.life.cognition.recall, 50);
  const v5 = normalizeArcCoreChatPayload({
    schemaVersion: 5,
    life: { anchors: ['호출은 짧게'], cognition: { recall: 62 } },
  });
  assert.equal(v5.life.anchors[0], '호출은 짧게');
  assert.equal(v5.life.cognition.recall, 62);
});

test('normalize clamps fat life and FIFO before backup copy', () => {
  const messages = Array.from({ length: 50 }, (_, i) => ({
    id: `m${i}`,
    role: 'user',
    text: `t${i}`,
    atMs: i,
  }));
  const parsed = normalizeArcCoreChatPayload({
    schemaVersion: 5,
    messages,
    life: {
      narrative: '가'.repeat(240),
      anchors: Array.from({ length: 8 }, () => '나'.repeat(40)),
      digests: Array.from({ length: 20 }, (_, i) => ({
        d: `2026-08-${String(10 + (i % 18)).padStart(2, '0')}`,
        mood: 80,
        driveId: 'duty',
        done: ['다'.repeat(24), 'E'.repeat(24)],
      })),
    },
  });
  assert.equal(parsed.messages.length, ARC_CORE_CHAT_MAX_MESSAGES);
  assert.ok(parsed.life.anchors.length <= 6);
  assert.ok(parsed.life.digests.length <= 14);
});
