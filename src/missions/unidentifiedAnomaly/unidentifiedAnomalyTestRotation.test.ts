/**
 * npx tsx src/missions/unidentifiedAnomaly/unidentifiedAnomalyTestRotation.test.ts
 */
import assert from 'node:assert/strict';
import { inspectUnidentifiedAnomalySchedule } from './inspectUnidentifiedAnomalySchedule';
import {
  isUnidentifiedAnomalyMapListedSystemId,
  listUnidentifiedAnomalyVisibleSystemIds,
  selectUnidentifiedAnomalyTestSite,
} from './selectUnidentifiedAnomalyTestSite';
import {
  UNIDENTIFIED_ANOMALY_TEST_ACTIVE_MS,
  UNIDENTIFIED_ANOMALY_TEST_INTERVAL_MS,
} from './unidentifiedAnomalyTestPolicy';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('지도 표시∩안개만 후보이고 정렬된다', () => {
  const ids = listUnidentifiedAnomalyVisibleSystemIds(
    ['vega_base', 'arcadia', 'hidden'],
    ['arcadia'],
    new Set(['arcadia', 'vega_base']),
  );
  assert.deepEqual(ids, ['arcadia', 'vega_base']);
});

test('코어 성계는 해금 목록과 무관하게 지도 표시 대상이다', () => {
  assert.equal(isUnidentifiedAnomalyMapListedSystemId('arcadia', []), true);
});

test('로테이션은 직전 성계 다음으로 돈다', () => {
  const vis = ['arcadia', 'draco_hub', 'vega_base'];
  assert.equal(selectUnidentifiedAnomalyTestSite(vis, null), 'arcadia');
  assert.equal(selectUnidentifiedAnomalyTestSite(vis, 'arcadia'), 'draco_hub');
  assert.equal(selectUnidentifiedAnomalyTestSite(vis, 'vega_base'), 'arcadia');
});

test('보이는 성계가 없으면 스폰 후보 없음', () => {
  assert.equal(selectUnidentifiedAnomalyTestSite([], 'arcadia'), null);
});

test('활성 10분 후 만료·30분 후 다음 스폰', () => {
  const t0 = 1_000_000;
  const active = inspectUnidentifiedAnomalySchedule(
    {
      activeExpiresAtMs: t0 + UNIDENTIFIED_ANOMALY_TEST_ACTIVE_MS,
      nextSpawnAtMs: t0 + UNIDENTIFIED_ANOMALY_TEST_INTERVAL_MS,
    },
    t0 + UNIDENTIFIED_ANOMALY_TEST_ACTIVE_MS,
  );
  assert.equal(active.settleDue, true);
  assert.equal(active.spawnDue, false);
  const later = inspectUnidentifiedAnomalySchedule(
    { activeExpiresAtMs: null, nextSpawnAtMs: t0 + UNIDENTIFIED_ANOMALY_TEST_INTERVAL_MS },
    t0 + UNIDENTIFIED_ANOMALY_TEST_INTERVAL_MS,
  );
  assert.equal(later.spawnDue, true);
});

test('테스트 주기는 30분·유지는 10분', () => {
  assert.equal(UNIDENTIFIED_ANOMALY_TEST_INTERVAL_MS, 30 * 60 * 1000);
  assert.equal(UNIDENTIFIED_ANOMALY_TEST_ACTIVE_MS, 10 * 60 * 1000);
});

console.log('[unidentifiedAnomalyTestRotation] all tests passed');
