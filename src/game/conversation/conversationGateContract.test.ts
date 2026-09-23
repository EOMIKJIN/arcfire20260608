/**
 * npx tsx --test src/game/conversation/conversationGateContract.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  conversationOpensMessenger,
  isNlMouthRowKind,
  nlMouthCommRequiresAccept,
  nlMouthSkipsGate1,
  resolveConversationContactKind,
} from './conversationGateContract';

test('hub roster: arc_core is NL mouth, npc is script only', () => {
  assert.equal(resolveConversationContactKind('arc_core'), 'nl_mouth');
  assert.equal(resolveConversationContactKind('operator'), 'nl_mouth');
  assert.equal(resolveConversationContactKind('npc'), 'npc_script');
  assert.equal(resolveConversationContactKind('directory'), 'directory');
  assert.equal(isNlMouthRowKind('arc_core'), true);
  assert.equal(isNlMouthRowKind('npc'), false);
  assert.equal(conversationOpensMessenger('nl_mouth'), true);
  assert.equal(conversationOpensMessenger('npc_script'), false);
});

test('inbound requires accept; hub tap does not; title may skip gate 1', () => {
  assert.equal(nlMouthCommRequiresAccept('inbound_request'), true);
  assert.equal(nlMouthCommRequiresAccept('operator_life'), true);
  assert.equal(nlMouthCommRequiresAccept('hub_manual'), false);
  assert.equal(nlMouthCommRequiresAccept('combat_end'), false);
  assert.equal(nlMouthSkipsGate1('session_start'), true);
  assert.equal(nlMouthSkipsGate1('boot_chat_first'), true);
  assert.equal(nlMouthSkipsGate1('hub_manual'), true);
  assert.equal(nlMouthSkipsGate1('inbound_request'), false);
  assert.equal(nlMouthSkipsGate1('combat_end'), false);
});
