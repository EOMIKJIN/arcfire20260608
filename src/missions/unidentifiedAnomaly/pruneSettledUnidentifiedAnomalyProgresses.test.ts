/**
 * npx tsx src/missions/unidentifiedAnomaly/pruneSettledUnidentifiedAnomalyProgresses.test.ts
 */
import assert from 'node:assert/strict';
import type { MissionProgress } from '../../types';
import { pruneSettledUnidentifiedAnomalyProgresses } from './pruneSettledUnidentifiedAnomalyProgresses';

function row(missionId: string, status: MissionProgress['status']): MissionProgress {
  return { missionId, status, objectives: {} };
}

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('하루 48행 failed 누적을 한 번에 제거한다', () => {
  const progresses: Record<string, MissionProgress> = {
    story_001: row('story_001', 'complete'),
    'arc_anom_live_1': row('arc_anom_live_1', 'active'),
  };
  for (let i = 0; i < 48; i += 1) {
    const id = `arc_anom_p_${i}`;
    progresses[id] = row(id, 'failed');
  }
  const result = pruneSettledUnidentifiedAnomalyProgresses(progresses);
  assert.equal(result.changed, true);
  assert.equal(result.prunedIds.length, 48);
  assert.equal(result.next.story_001?.status, 'complete');
  assert.equal(result.next.arc_anom_live_1?.status, 'active');
  let leftover = 0;
  const keys = Object.keys(result.next);
  for (let i = 0; i < keys.length; i += 1) {
    if (keys[i]!.startsWith('arc_anom_')) leftover += 1;
  }
  assert.equal(leftover, 1);
});

test('complete·expired 잔존 행도 지운다', () => {
  const result = pruneSettledUnidentifiedAnomalyProgresses({
    arc_anom_a_1: row('arc_anom_a_1', 'complete'),
    arc_anom_b_2: row('arc_anom_b_2', 'failed'),
    sandbox_001: row('sandbox_001', 'failed'),
  });
  assert.equal(result.next.arc_anom_a_1, undefined);
  assert.equal(result.next.arc_anom_b_2, undefined);
  assert.ok(result.next.sandbox_001);
});

test('keepMissionId 는 종료 행이어도 남긴다', () => {
  const result = pruneSettledUnidentifiedAnomalyProgresses(
    {
      arc_anom_keep_1: row('arc_anom_keep_1', 'complete'),
      arc_anom_drop_2: row('arc_anom_drop_2', 'failed'),
    },
    'arc_anom_keep_1',
  );
  assert.ok(result.next.arc_anom_keep_1);
  assert.equal(result.next.arc_anom_drop_2, undefined);
});

test('변경 없으면 동일 참조를 유지한다', () => {
  const progresses = {
    story_001: row('story_001', 'active'),
    arc_anom_live_1: row('arc_anom_live_1', 'available'),
  };
  const result = pruneSettledUnidentifiedAnomalyProgresses(progresses);
  assert.equal(result.changed, false);
  assert.equal(result.next, progresses);
});

console.log('[pruneSettledUnidentifiedAnomalyProgresses] all tests passed');
