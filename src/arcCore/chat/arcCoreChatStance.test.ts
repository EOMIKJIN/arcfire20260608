import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  resolveArcCoreChatStance,
  sanitizeArcCoreChatStance,
} from './arcCoreChatStance';
import { resolveArcCoreChatWorldProposal } from './arcCoreChatWorldProposal';

const FACTS = {
  planetLabel: '아르카디아 프라임',
  spyAlertPending: false,
  hasCombatRecord: true,
};

test('stance never administers while world proposal is dark', () => {
  assert.equal(resolveArcCoreChatWorldProposal('open_trade'), null);
  assert.equal(sanitizeArcCoreChatStance('administer'), 'observe');
  assert.equal(
    resolveArcCoreChatStance({ intent: 'refuse', topicId: 'refuse', facts: FACTS }),
    'refuse',
  );
  assert.equal(
    resolveArcCoreChatStance({
      intent: 'spy',
      topicId: 'spy',
      facts: { ...FACTS, spyAlertPending: true },
    }),
    'warn',
  );
  assert.equal(
    resolveArcCoreChatStance({ intent: 'location', topicId: 'location', facts: FACTS }),
    'observe',
  );
  assert.equal(
    resolveArcCoreChatStance({ intent: 'greet', topicId: 'greet', facts: FACTS }),
    'observe',
  );
  assert.equal(
    resolveArcCoreChatStance({ intent: 'other', topicId: 'other', facts: FACTS }),
    'observe',
  );
});
