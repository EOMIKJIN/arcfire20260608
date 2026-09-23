/**
 * npx tsx --test src/firebase/userCloudSyncSchedule.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { resolveCloudSyncRetryWaitMs } from './userCloudSyncSchedule';

test('클라우드 간격 — 경과 충분하면 재예약 0', () => {
  assert.equal(resolveCloudSyncRetryWaitMs(200_000, 50_000, 120_000), 0);
});

test('클라우드 간격 — 창 안이면 남은 ms', () => {
  assert.equal(resolveCloudSyncRetryWaitMs(100_000, 50_000, 120_000), 70_000);
});
