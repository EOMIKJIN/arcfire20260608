/**
 * npx tsx --test src/arcCore/chat/localConversationalProvider.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { remapOperatorLocalI18nKey } from './localConversationalProvider';

test('operator F5 remaps reply and clue keys; origin keys stay', () => {
  assert.equal(
    remapOperatorLocalI18nKey('arcCoreChat.reply.self', 'operator'),
    'arcCoreChat.operator.reply.self',
  );
  assert.equal(
    remapOperatorLocalI18nKey('arcCoreChat.reply.planet', 'operator'),
    'arcCoreChat.operator.reply.planet',
  );
  assert.equal(
    remapOperatorLocalI18nKey('arcCoreChat.drive.clue.mission', 'operator'),
    'arcCoreChat.operator.drive.clue.mission',
  );
  assert.equal(
    remapOperatorLocalI18nKey('arcCoreChat.reply.self', 'arc_core'),
    'arcCoreChat.reply.self',
  );
  assert.equal(
    remapOperatorLocalI18nKey('arcCoreChat.operator.reply.greet', 'operator'),
    'arcCoreChat.operator.reply.greet',
  );
});
