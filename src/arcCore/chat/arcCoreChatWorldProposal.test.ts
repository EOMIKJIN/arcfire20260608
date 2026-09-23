import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ARC_CORE_CHAT_WORLD_PROPOSAL_LIVE,
  isArcCoreChatWorldProposalLive,
  isReservedArcCoreChatWorldProposalId,
  resolveArcCoreChatWorldProposal,
  suggestArcCoreChatWorldProposal,
} from './arcCoreChatWorldProposal';

test('world proposal stays dark so chat cannot control the world', () => {
  assert.equal(ARC_CORE_CHAT_WORLD_PROPOSAL_LIVE, false);
  assert.equal(isArcCoreChatWorldProposalLive(), false);
  assert.equal(resolveArcCoreChatWorldProposal('open_trade'), null);
  assert.equal(resolveArcCoreChatWorldProposal('grant_credit'), null);
  assert.equal(isReservedArcCoreChatWorldProposalId('open_trade'), true);
  assert.equal(isReservedArcCoreChatWorldProposalId('talk_bar'), true);
  assert.equal(isReservedArcCoreChatWorldProposalId('arm_wave'), true);
  assert.equal(isReservedArcCoreChatWorldProposalId('run_daily_ops'), false);
});

test('suggest only reserved facility doors and skips last refuse', () => {
  assert.equal(
    suggestArcCoreChatWorldProposal({ hasTradePort: true, hasShipyard: true }),
    'open_trade',
  );
  assert.equal(
    suggestArcCoreChatWorldProposal({
      hasTradePort: true,
      hasShipyard: true,
      lastRefusedProposalId: 'open_trade',
    }),
    'open_shipyard',
  );
  assert.equal(suggestArcCoreChatWorldProposal({ hasTradePort: false, hasShipyard: false }), null);
});
