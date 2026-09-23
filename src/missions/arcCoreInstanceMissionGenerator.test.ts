import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ArcCoreInstanceMissionBoardEntry } from './arcCoreInstanceMissionTypes';
import {
  allocateUniqueArcCoreInstanceId,
  buildArcCoreInstanceId,
  dedupeArcCoreInstanceBoardEntries,
} from './arcCoreInstanceMissionIds';

function entry(
  partial: Pick<ArcCoreInstanceMissionBoardEntry, 'instanceId' | 'boardStatus'> &
    Partial<ArcCoreInstanceMissionBoardEntry>,
): ArcCoreInstanceMissionBoardEntry {
  return {
    templateMissionId: 'tq_test',
    categoryTag: 'delivery',
    offerPlanetId: 'arcadia_prime',
    offerCaptainId: null,
    registeredAtMs: 1,
    dayKeyKst: '2026-08-24',
    briefingDialogSceneId: null,
    ...partial,
  };
}

test('allocateUnique skips used _01.._10 and returns _11', () => {
  const used = new Set<string>();
  for (let seq = 0; seq < 10; seq += 1) {
    used.add(buildArcCoreInstanceId('arcadia_prime', seq));
  }
  assert.equal(used.has('arc_inst_arcadia_prime_10'), true);
  assert.equal(allocateUniqueArcCoreInstanceId('arcadia_prime', used), 'arc_inst_arcadia_prime_11');
});

test('allocateUnique does not reuse leftover _10 when listed count is 9', () => {
  const used = new Set<string>();
  for (let seq = 0; seq < 8; seq += 1) {
    used.add(buildArcCoreInstanceId('arcadia_prime', seq));
  }
  used.add(buildArcCoreInstanceId('arcadia_prime', 9));
  assert.deepEqual(
    [...used].sort(),
    [
      'arc_inst_arcadia_prime_01',
      'arc_inst_arcadia_prime_02',
      'arc_inst_arcadia_prime_03',
      'arc_inst_arcadia_prime_04',
      'arc_inst_arcadia_prime_05',
      'arc_inst_arcadia_prime_06',
      'arc_inst_arcadia_prime_07',
      'arc_inst_arcadia_prime_08',
      'arc_inst_arcadia_prime_10',
    ],
  );
  assert.equal(allocateUniqueArcCoreInstanceId('arcadia_prime', used), 'arc_inst_arcadia_prime_09');
});

test('dedupe keeps accepted over listed for the same instanceId', () => {
  const listed = entry({
    instanceId: 'arc_inst_arcadia_prime_10',
    boardStatus: 'listed',
    registeredAtMs: 90,
  });
  const accepted = entry({
    instanceId: 'arc_inst_arcadia_prime_10',
    boardStatus: 'accepted',
    registeredAtMs: 10,
  });
  const next = dedupeArcCoreInstanceBoardEntries([listed, accepted]);
  assert.equal(next.length, 1);
  assert.equal(next[0]?.boardStatus, 'accepted');
});

test('dedupe listed+listed keeps the newer registeredAtMs', () => {
  const older = entry({
    instanceId: 'arc_inst_arcadia_prime_10',
    boardStatus: 'listed',
    registeredAtMs: 1,
    templateMissionId: 'tq_old',
  });
  const newer = entry({
    instanceId: 'arc_inst_arcadia_prime_10',
    boardStatus: 'listed',
    registeredAtMs: 2,
    templateMissionId: 'tq_new',
  });
  const next = dedupeArcCoreInstanceBoardEntries([older, newer]);
  assert.equal(next.length, 1);
  assert.equal(next[0]?.templateMissionId, 'tq_new');
});
