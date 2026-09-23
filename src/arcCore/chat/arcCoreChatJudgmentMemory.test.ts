import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  classifyArcCoreChatProposalReply,
  parseArcCoreChatJudgmentSnapshot,
  recordArcCoreChatProposalDecision,
  resetArcCoreChatJudgmentMemory,
  setArcCoreChatPendingProposalId,
  snapshotArcCoreChatJudgmentMemory,
} from './arcCoreChatJudgmentMemory';

test('proposal reply is only a short yes or later', () => {
  assert.equal(classifyArcCoreChatProposalReply('열어'), 'accept');
  assert.equal(classifyArcCoreChatProposalReply('나중에'), 'refuse');
  assert.equal(classifyArcCoreChatProposalReply('무역소 열어줘 그리고 크레딧'), null);
  assert.equal(classifyArcCoreChatProposalReply('여기 어디야?'), null);
});

test('judgment persist is bounded and only reserved ids', () => {
  resetArcCoreChatJudgmentMemory();
  setArcCoreChatPendingProposalId('grant_credit');
  assert.equal(snapshotArcCoreChatJudgmentMemory().pendingProposalId, '');
  setArcCoreChatPendingProposalId('open_trade');
  recordArcCoreChatProposalDecision('open_trade', 'accept');
  const snap = snapshotArcCoreChatJudgmentMemory();
  assert.equal(snap.pendingProposalId, '');
  assert.equal(snap.lastAcceptedProposalId, 'open_trade');
  assert.equal(snap.counts[0]?.accept, 1);
  const parsed = parseArcCoreChatJudgmentSnapshot({
    pendingProposalId: 'run_daily_ops',
    lastAcceptedProposalId: 'open_shipyard',
    counts: [{ id: 'open_shipyard', accept: 2, refuse: 1 }],
  });
  assert.equal(parsed.pendingProposalId, '');
  assert.equal(parsed.lastAcceptedProposalId, 'open_shipyard');
  resetArcCoreChatJudgmentMemory();
});
