/**
 * npx tsx --test src/missions/missionExpireRealtimeWatch.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { MissionProgress } from '../types';
import {
  inspectMissionExpireSchedule,
  resolveEarliestActiveExpiresAtMs,
} from './missionExpireRealtimeWatch';

function active(id: string, expiresAtMs?: number): MissionProgress {
  return {
    missionId: id,
    status: 'active',
    objectives: {},
    ...(expiresAtMs != null ? { expiresAtMs } : {}),
  };
}

test('earliest — active + expiresAt 만', () => {
  const bag: Record<string, MissionProgress> = {
    a: active('a', 9000),
    b: active('b', 3000),
    c: { missionId: 'c', status: 'complete', objectives: {}, expiresAtMs: 1000 },
    d: active('d'),
  };
  assert.equal(resolveEarliestActiveExpiresAtMs(bag), 3000);
});

test('inspect — 기한 지난 건 due · 다음은 미래만', () => {
  const bag: Record<string, MissionProgress> = {
    due: active('due', 1000),
    later: active('later', 9000),
    none: active('none'),
  };
  const out = inspectMissionExpireSchedule(bag, 2000);
  assert.equal(out.due, true);
  assert.equal(out.nextAtMs, 9000);
});

test('inspect — 전부 미래면 due 없음', () => {
  const out = inspectMissionExpireSchedule(
    { live: active('live', 8000) },
    2000,
  );
  assert.equal(out.due, false);
  assert.equal(out.nextAtMs, 8000);
});
