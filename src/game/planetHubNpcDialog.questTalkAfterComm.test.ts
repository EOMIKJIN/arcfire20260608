/**
 * npx tsx --test src/game/planetHubNpcDialog.questTalkAfterComm.test.ts
 * barMissionBoard / planetHubNpcDialog는 RN 체인을 끌어 여기서 import하지 않는다.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MISSIONS_FROM_CSV, STORY_SCENES_FROM_CSV } from '../data/generated';
import { resolveCurrentMainStoryOfferMissionId } from '../missions/mainStory/resolveMainStoryProgression';

const ELLEN = 'npc_cpt_arcadia_lane_01';
const ARCADIA = 'arcadia_prime';

test('메인퀘 오퍼 — 아르카디아 엘렌 + story_dialog 씬이 있다', () => {
  const offerId = resolveCurrentMainStoryOfferMissionId({});
  assert.equal(offerId, 'story_001');

  const mission = MISSIONS_FROM_CSV.story_001;
  assert.ok(mission);
  assert.equal(mission.offerCaptainId, ELLEN);
  assert.equal(mission.offerPlanetId, ARCADIA);

  const scene = STORY_SCENES_FROM_CSV.story_dialog_story_001;
  assert.ok(scene);
  assert.ok((scene.pages?.length ?? 0) >= 1);
  assert.equal(scene.pages[0]?.speakerNpcCaptainId, ELLEN);
});
