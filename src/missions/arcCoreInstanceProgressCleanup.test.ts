/**
 * npx tsx --test src/missions/arcCoreInstanceProgressCleanup.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { MissionProgress } from '../types';
import { allocateUniqueArcCoreInstanceId } from './arcCoreInstanceMissionIds';
import {
  collectArcCoreInstanceProgressIds,
  pruneOrphanArcInstProgresses,
  shouldReconcileOrphanArcInstWithBoard,
} from './arcCoreInstanceProgressCleanup';

function progress(
  missionId: string,
  status: MissionProgress['status'],
): MissionProgress {
  return {
    missionId,
    status,
    objectives: { a: status === 'complete' },
    completedAt: status === 'complete' ? 10 : undefined,
  };
}

test('collectArcCoreInstanceProgressIds — arc_inst 만', () => {
  const ids = collectArcCoreInstanceProgressIds({
    story_001: progress('story_001', 'complete'),
    arc_inst_arcadia_prime_01: progress('arc_inst_arcadia_prime_01', 'complete'),
    sandbox_001: progress('sandbox_001', 'active'),
  });
  assert.deepEqual(ids, ['arc_inst_arcadia_prime_01']);
});

test('prune — 보드에 없는 complete/failed 만 제거 · 활성·정적 id 유지', () => {
  const board = new Set(['arc_inst_arcadia_prime_02']);
  const result = pruneOrphanArcInstProgresses({
    progresses: {
      story_001: progress('story_001', 'complete'),
      sandbox_001: progress('sandbox_001', 'complete'),
      arc_inst_arcadia_prime_01: progress('arc_inst_arcadia_prime_01', 'complete'),
      arc_inst_arcadia_prime_02: progress('arc_inst_arcadia_prime_02', 'complete'),
      arc_inst_arcadia_prime_03: progress('arc_inst_arcadia_prime_03', 'active'),
      arc_inst_arcadia_prime_04: progress('arc_inst_arcadia_prime_04', 'failed'),
    },
    boardInstanceIds: board,
    resolveTitle: (id) => (id.endsWith('_01') ? '옛 의뢰' : undefined),
    prevCount: 2,
    prevSnapshots: [],
  });
  assert.equal(result.changed, true);
  assert.deepEqual(result.prunedIds.sort(), [
    'arc_inst_arcadia_prime_01',
    'arc_inst_arcadia_prime_04',
  ]);
  assert.ok(result.nextProgresses.story_001);
  assert.ok(result.nextProgresses.sandbox_001);
  assert.ok(result.nextProgresses.arc_inst_arcadia_prime_02);
  assert.ok(result.nextProgresses.arc_inst_arcadia_prime_03);
  assert.equal(result.nextProgresses.arc_inst_arcadia_prime_01, undefined);
  assert.equal(result.clearedArcInstCount, 3);
  assert.equal(result.clearedArcInstSnapshots.length, 1);
  assert.equal(result.clearedArcInstSnapshots[0]?.title, '옛 의뢰');
});

test('shouldReconcile — 초회 빈 보드·미하이드는 금지', () => {
  assert.equal(
    shouldReconcileOrphanArcInstWithBoard({
      hydrated: false,
      loadedFromStorage: false,
      entryCount: 0,
    }),
    false,
  );
  assert.equal(
    shouldReconcileOrphanArcInstWithBoard({
      hydrated: true,
      loadedFromStorage: false,
      entryCount: 0,
    }),
    false,
  );
  assert.equal(
    shouldReconcileOrphanArcInstWithBoard({
      hydrated: true,
      loadedFromStorage: true,
      entryCount: 0,
    }),
    true,
  );
  assert.equal(
    shouldReconcileOrphanArcInstWithBoard({
      hydrated: true,
      loadedFromStorage: false,
      entryCount: 2,
    }),
    true,
  );
});

test('allocateUnique — 진행 키 extra 도 회피', () => {
  const used = new Set<string>();
  const extra = ['arc_inst_arcadia_prime_01'];
  assert.equal(
    allocateUniqueArcCoreInstanceId('arcadia_prime', used, extra),
    'arc_inst_arcadia_prime_02',
  );
});
