import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseTalkNpcTarget, resolveTalkNpcSceneId } from './talkNpcTarget';

test('parseTalkNpcTarget splits captain and planet', () => {
  assert.deepEqual(parseTalkNpcTarget('npc_cpt_bar_ret_01|solar_station'), {
    captainId: 'npc_cpt_bar_ret_01',
    planetId: 'solar_station',
  });
  assert.deepEqual(parseTalkNpcTarget('npc_cpt_arcadia_lane_01'), {
    captainId: 'npc_cpt_arcadia_lane_01',
    planetId: null,
  });
});

test('talk scene id follows story_dialog_{objectiveId}', () => {
  assert.equal(resolveTalkNpcSceneId('obj_story_001_b'), 'story_dialog_obj_story_001_b');
});
