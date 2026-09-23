/**
 * npx tsx --test src/missions/barMissionBoard.completedHistory.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  buildClearedArcInstHistoryRow,
  mergeClearedArcInstHistoryRows,
  type ClearedArcInstHistoryRow,
} from './clearedArcInstHistory';

test('완료 이력 — 보드에서 빠진 arc_inst 는 스냅샷으로 유지 · 중복 스킵', () => {
  const live: ClearedArcInstHistoryRow[] = [
    {
      mission: {
        id: 'sandbox_001',
        title: '살아 있는 완료',
        description: '',
        type: 'explore',
        objectives: [],
        rewards: { credits: 0, exp: 0 },
        prerequisiteIds: [],
        nextMissionId: null,
        dc: 0,
      },
      progress: {
        missionId: 'sandbox_001',
        status: 'complete',
        objectives: {},
        completedAt: 20,
      },
      isPrimaryActive: false,
    },
  ];
  const rows = mergeClearedArcInstHistoryRows(
    live,
    [
      { instanceId: 'arc_inst_arcadia_prime_01', title: '옛 의뢰', completedAt: 40 },
      { instanceId: 'sandbox_001', title: '중복', completedAt: 1 },
    ],
    buildClearedArcInstHistoryRow,
  );
  assert.equal(rows.length, 2);
  assert.equal(rows[1]?.mission.id, 'arc_inst_arcadia_prime_01');
  assert.equal(rows[1]?.mission.title, '옛 의뢰');
  assert.equal(rows[1]?.progress.titleSnapshot, '옛 의뢰');
});
