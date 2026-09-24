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
  resolveQuestMarkCenter,
  GALAXY_MAP_QUEST_MARK_ABOVE_GAP_PX,
  GALAXY_MAP_QUEST_MARK_HALF_PX,
  GALAXY_MAP_QUEST_MARK_PAIR_DX_PX,
} from './galaxyMapQuestAcceptMarks';

function progress(
  missionId: string,
  status: MissionProgress['status'],
): MissionProgress {
  return { missionId, status, objectives: {} };
}

test('flag off → empty even if story_001 is open', () => {
  const marks = resolveGalaxyMapQuestAcceptMarks({
    enabled: false,
    visibleSystemIds: ['arcadia'],
    progresses: {},
  });
  assert.equal(marks, EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS);
});

test('empty progress + visible arcadia → main on arcadia', () => {
  const marks = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    visibleSystemIds: ['arcadia', 'vega'],
    progresses: {},
  });
  assert.deepEqual(marks, { arcadia: { main: true, side: false } });
});

test('unaccepted ready main at vega_outpost is marked before accept', () => {
  const marks = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    visibleSystemIds: ['vega_outpost'],
    progresses: {},
  });
  assert.deepEqual(marks, { vega_outpost: { main: true, side: false } });
});

test('system not on the map list is not marked', () => {
  const marks = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    visibleSystemIds: ['vega'],
    progresses: {},
  });
  assert.equal(marks, EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS);
});

test('fog-hidden offer systems stay unmarked', () => {
  const marks = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    visibleSystemIds: ['arcadia'],
    progresses: {},
  });
  assert.equal(marks.arcadia?.main, true);
  assert.equal(marks.vega_outpost, undefined);
  assert.equal(marks.synth_052, undefined);
  assert.equal(marks.synth_070, undefined);
  assert.equal(marks.synth_078, undefined);
});

test('accepted/in-progress mission drops; other unaccepted on same system stay', () => {
  const active = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    visibleSystemIds: ['arcadia'],
    progresses: { story_001: progress('story_001', 'active') },
  });
  assert.equal(active.arcadia?.main, true);

  const allArcadiaTaken = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    visibleSystemIds: ['arcadia'],
    progresses: {
      story_001: progress('story_001', 'complete'),
      story_002: progress('story_002', 'complete'),
      story_003: progress('story_003', 'complete'),
      story_005: progress('story_005', 'active'),
    },
  });
  assert.equal(allArcadiaTaken, EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS);
});

test('named side 038 marks synth_052; bar 001 does not mark solar', () => {
  const marks = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    visibleSystemIds: ['synth_052', 'solar_port'],
    progresses: {},
  });
  assert.deepEqual(marks.synth_052, { main: false, side: true });
  assert.equal(marks.solar_port, undefined);
});

test('unaccepted sides mark before level gate (034 at L-agnostic)', () => {
  const marks = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    visibleSystemIds: ['synth_052', 'synth_070', 'synth_078', 'arcadia'],
    progresses: {},
  });
  assert.equal(marks.synth_052?.side, true);
  assert.equal(marks.synth_070?.side, true);
  assert.equal(marks.synth_078?.side, true);
  assert.equal(marks.arcadia?.main, true);
});

test('accepted side is cleared', () => {
  const marks = resolveGalaxyMapQuestAcceptMarks({
    enabled: true,
    visibleSystemIds: ['synth_078'],
    progresses: { sandbox_034: progress('sandbox_034', 'active') },
  });
  assert.equal(marks, EMPTY_GALAXY_MAP_QUEST_ACCEPT_MARKS);
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
});

test('diamond path is a closed quad', () => {
  const d = diamondPathD(10, 20, 2);
  assert.equal(d, 'M10.0 18.0L12.0 20.0L10.0 22.0L8.0 20.0Z');
});
