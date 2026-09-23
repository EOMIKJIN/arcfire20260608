/**
 * npx tsx --test src/arcCore/chat/stellaQuestFieldNote.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  isStellaFieldNoteCardId,
  missionIdFromObjectiveId,
  pickStellaQuestFieldNoteCardsFromSnap,
} from './stellaQuestFieldNote';

test('objective id maps to parent mission', () => {
  assert.equal(missionIdFromObjectiveId('obj_story_001_b'), 'story_001');
  assert.equal(missionIdFromObjectiveId('obj_s034_c'), 'sandbox_034');
});

test('field note ids use table prefixes', () => {
  assert.equal(isStellaFieldNoteCardId('sqa_001_b'), true);
  assert.equal(isStellaFieldNoteCardId('sqd_story_001'), true);
  assert.equal(isStellaFieldNoteCardId('scn_hanro'), true);
  assert.equal(isStellaFieldNoteCardId('know_mission'), false);
});

test('picks aside then dossier for an active objective', () => {
  const cards = pickStellaQuestFieldNoteCardsFromSnap({
    locale: 'ko',
    userText: '한로가 말한 얼굴',
    missionId: 'story_001',
    objectiveId: 'obj_story_001_b',
    offerCaptainId: 'npc_cpt_arcadia_lane_01',
    lastCaptainId: 'npc_cpt_bar_ret_01',
    lastObjectiveId: 'obj_story_001_b',
  });
  assert.ok(cards.length >= 2);
  assert.equal(cards[0]?.id, 'sqa_001_b');
  assert.match(cards[0]?.text ?? '', /한로/);
  assert.equal(cards.some((card) => card.id === 'sqd_story_001'), true);
});

test('origin-only snap without mission yields no cards', () => {
  const cards = pickStellaQuestFieldNoteCardsFromSnap({
    locale: 'ko',
    userText: '안녕',
    missionId: '',
    objectiveId: '',
    offerCaptainId: '',
    lastCaptainId: '',
    lastObjectiveId: '',
  });
  assert.deepEqual(cards, []);
});
