/**
 * npx tsx --test src/galaxyMap/galaxyMapQuestAcceptMarks.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { MissionProgress } from '../types';
import {
  EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS,
  diamondPathD,
  resolveGalaxyMapQuestAcceptMarks,
  resolveObjectiveDestSystemId,
  resolveQuestMarkCenter,
  GALAXY_MAP_QUEST_MARK_ABOVE_GAP_PX,
  GALAXY_MAP_QUEST_MARK_HALF_PX,
  GALAXY_MAP_QUEST_MARK_PAIR_DX_PX,
} from './galaxyMapQuestAcceptMarks';

function progress(
  missionId: string,
  status: MissionProgress['status'],
  objectives: Record<string, boolean> = {},
): MissionProgress {
  return { missionId, status, objectives };
}

test('flag off → empty even if story_001 is active', () => {
  const marks = resolveGalaxyMapQuestAcceptMarks({
    enabled: false,
    progresses: { story_001: progress('story_001', 'active') },
  });
  assert.equal(marks, EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS);
});

test('unaccepted / empty progress is not marked', () => {
  const empty = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    progresses: {},
  });
  assert.equal(empty, EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS);

  const open = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    progresses: {},
  });
  assert.equal(open.arcadia, undefined);
  assert.equal(open.solar_port, undefined);
  assert.equal(open.synth_052, undefined);
});

test('accepted story_001 dest is solar_port (not offer arcadia)', () => {
  const marks = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    progresses: { story_001: progress('story_001', 'active') },
  });
  assert.equal(marks.solar_port?.main, true);
  assert.equal(marks.solar_port?.side, false);
  assert.equal(marks.arcadia, undefined);
});

test('story_001 next objective moves dest to arcadia', () => {
  const marks = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    progresses: {
      story_001: progress('story_001', 'active', {
        obj_story_001_a: true,
        obj_story_001_b: true,
      }),
    },
  });
  assert.deepEqual(marks, { arcadia: { main: true, side: false } });
});

test('accepted story_002 dest is minerva even if fog-hidden would hide it', () => {
  const marks = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    progresses: { story_002: progress('story_002', 'active') },
  });
  assert.deepEqual(marks, { minerva: { main: true, side: false } });
});

test('complete / no remaining objective drops dest', () => {
  const done = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    progresses: { story_001: progress('story_001', 'complete') },
  });
  assert.equal(done, EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS);

  const allDone = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    progresses: {
      story_001: progress('story_001', 'active', {
        obj_story_001_a: true,
        obj_story_001_b: true,
        obj_story_001_c: true,
        obj_story_001_d: true,
        obj_story_001_e: true,
      }),
    },
  });
  assert.equal(allDone, EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS);
});

test('defeat_enemy without planet is unmarked', () => {
  const marks = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    progresses: {
      story_002: progress('story_002', 'active', {
        obj_story_002_a: true,
        obj_story_002_b: true,
      }),
    },
  });
  assert.equal(marks, EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS);
});

test('named side dest marks; bar board does not; tutorial mission_001 is green on vega', () => {
  const marks = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    progresses: {
      sandbox_034: progress('sandbox_034', 'active'),
      sandbox_038: progress('sandbox_038', 'active'),
      sandbox_001: progress('sandbox_001', 'active'),
      mission_001: progress('mission_001', 'active'),
    },
  });
  assert.deepEqual(marks.synth_075, { main: false, side: true });
  assert.deepEqual(marks.synth_052, { main: false, side: true });
  assert.equal(marks.solar_port, undefined);
  assert.deepEqual(marks.vega_outpost, { main: false, side: false, tutorial: true });
  assert.equal(marks.arcadia, undefined);
});

test('tutorial combat and buy objectives mark their anchor systems', () => {
  const combat = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    progresses: { mission_002: progress('mission_002', 'active') },
  });
  assert.deepEqual(combat.arcadia, { main: false, side: false, tutorial: true });

  const buy = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    progresses: { mission_003: progress('mission_003', 'active') },
  });
  assert.deepEqual(buy.solar_port, { main: false, side: false, tutorial: true });
});

test('wave2 named side 056 dest is synth_054', () => {
  const marks = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    progresses: { sandbox_056: progress('sandbox_056', 'active') },
  });
  assert.deepEqual(marks, { synth_054: { main: false, side: true } });
});

test('main + side can share a system as a pair', () => {
  const marks = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    progresses: {
      story_001: progress('story_001', 'active', {
        obj_story_001_a: true,
        obj_story_001_b: true,
      }),
      sandbox_038: progress('sandbox_038', 'active'),
    },
  });
  assert.deepEqual(marks.arcadia, { main: true, side: false });
  assert.deepEqual(marks.synth_052, { main: false, side: true });
});

test('talk_npc captain|planet resolves dest system', () => {
  const systemId = resolveObjectiveDestSystemId({
    id: 't',
    description: '',
    type: 'talk_npc',
    targetId: 'npc_cpt_story_noah_frick|minerva_deep',
    complete: false,
  });
  assert.equal(systemId, 'minerva');
});

test('diamond sits above the node; pair is left main / right side', () => {
  const solo = resolveQuestMarkCenter(100, 100, 8, 'solo');
  assert.equal(solo.x, 100);
  assert.equal(
    solo.y,
    100 - 8 - GALAXY_MAP_QUEST_MARK_ABOVE_GAP_PX - GALAXY_MAP_QUEST_MARK_HALF_PX,
  );
  const main = resolveQuestMarkCenter(100, 100, 8, 'main');
  const side = resolveQuestMarkCenter(100, 100, 8, 'side');
  assert.equal(main.x, 100 - GALAXY_MAP_QUEST_MARK_PAIR_DX_PX);
  assert.equal(side.x, 100 + GALAXY_MAP_QUEST_MARK_PAIR_DX_PX);
  assert.equal(main.y, side.y);
  assert.ok(solo.y < 100 - 8);
  const stacked = resolveQuestMarkCenter(100, 100, 8, 'tutorial');
  assert.equal(stacked.x, 100);
  assert.ok(stacked.y < solo.y);
});

test('diamond path is a closed quad', () => {
  const d = diamondPathD(10, 20, 2);
  assert.equal(d, 'M10.0 18.0L12.0 20.0L10.0 22.0L8.0 20.0Z');
});
