/**
 * npx tsx src/missions/unidentifiedAnomaly/unidentifiedAnomalyTestRotation.test.ts
 */
import assert from 'node:assert/strict';
import { inspectUnidentifiedAnomalySchedule } from './inspectUnidentifiedAnomalySchedule';
import {
  isUnidentifiedAnomalyMapListedSystemId,
  listUnidentifiedAnomalyVisibleSystemIds,
} from './selectUnidentifiedAnomalyTestSite';
import {
  collectCooldownPlanetIds,
  isEligibleAnomalySite,
  pickWeightedAnomalySite,
} from './selectUnidentifiedAnomalySite';
import {
  addAnomalyDayKeyDays,
  anomalyKstDayKey,
  isAnomalyPlanetOnCooldown,
  resolveAnomalyIdentifyChancePct,
  resolveAnomalyUnacceptedTtlMs,
  resolveUnidentifiedAnomalyPolicy,
  rollAnomalyPayloadKind,
  setUnidentifiedAnomalyPolicyForTest,
} from './unidentifiedAnomalyPolicy';

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

test('정본 한도·TTL·밴드는 CSV를 쓴다', () => {
  const p = resolveUnidentifiedAnomalyPolicy();
  assert.equal(p.concurrent, 1);
  assert.equal(p.dailySpawn, 2);
  assert.equal(p.unacceptedTtlHours, 12);
  assert.equal(p.cooldownDays, 3);
  assert.equal(p.bandWeightEarly, 0);
  assert.equal(p.bandWeightLate, 8);
  assert.equal(resolveAnomalyUnacceptedTtlMs(p), 12 * 60 * 60 * 1000);
});

test('식별 주사위는 early 0 · late = 100×8/12', () => {
  const p = resolveUnidentifiedAnomalyPolicy();
  assert.equal(resolveAnomalyIdentifyChancePct('early', p), 0);
  assert.equal(resolveAnomalyIdentifyChancePct('late', p), Math.floor((100 * 8) / 12));
  assert.equal(resolveAnomalyIdentifyChancePct('mid', p), Math.floor((100 * 3) / 12));
});

test('해소 3일(KST)은 쿨다운, 당일 키 비교', () => {
  const now = Date.parse('2026-09-25T03:00:00+09:00');
  const today = anomalyKstDayKey(now);
  const twoDaysAgo = Date.parse(`${addAnomalyDayKeyDays(today, -2)}T12:00:00+09:00`);
  const threeDaysAgo = Date.parse(`${addAnomalyDayKeyDays(today, -3)}T12:00:00+09:00`);
  assert.equal(isAnomalyPlanetOnCooldown(twoDaysAgo, now, 3), true);
  assert.equal(isAnomalyPlanetOnCooldown(threeDaysAgo, now, 3), false);
  const blocked = collectCooldownPlanetIds(
    [{ planetId: 'nightfall', resolvedAtMs: twoDaysAgo }],
    now,
  );
  assert.equal(blocked.has('nightfall'), true);
});

test('early 밴드는 자격 제외, late는 포함', () => {
  assert.equal(
    isEligibleAnomalySite({ planetId: 'arcadia', sectorBand: 'early' }, new Set()),
    false,
  );
  assert.equal(
    isEligibleAnomalySite({ planetId: 'genesis', sectorBand: 'late' }, new Set()),
    true,
  );
  assert.equal(
    isEligibleAnomalySite({ planetId: 'genesis', sectorBand: 'late' }, new Set(['genesis'])),
    false,
  );
});

test('일일 추첨은 가중·시드가 같으면 동일하다', () => {
  const sites = [
    { planetId: 'a', systemId: 'sa', sectorBand: 'mid_early', weight: 1 },
    { planetId: 'b', systemId: 'sb', sectorBand: 'late', weight: 8 },
  ];
  const x = pickWeightedAnomalySite(sites, '2026-09-25:0');
  const y = pickWeightedAnomalySite(sites, '2026-09-25:0');
  assert.ok(x);
  assert.equal(x?.planetId, y?.planetId);
});

test('미수락 12h 후 만료·다음 스폰', () => {
  const t0 = 1_000_000;
  const ttl = resolveAnomalyUnacceptedTtlMs();
  const active = inspectUnidentifiedAnomalySchedule(
    { activeExpiresAtMs: t0 + ttl, nextSpawnAtMs: t0 + ttl },
    t0 + ttl,
  );
  assert.equal(active.settleDue, true);
  assert.equal(active.spawnDue, true);
});

test('payloadKind는 relic 고정이 아니다', () => {
  const kinds = new Set([
    rollAnomalyPayloadKind('arc_anom_x_1', 50),
    rollAnomalyPayloadKind('arc_anom_x_2', 50),
    rollAnomalyPayloadKind('arc_anom_x_3', 50),
    rollAnomalyPayloadKind('arc_anom_x_4', 50),
    rollAnomalyPayloadKind('arc_anom_x_5', 50),
    rollAnomalyPayloadKind('arc_anom_x_6', 50),
    rollAnomalyPayloadKind('arc_anom_x_7', 50),
    rollAnomalyPayloadKind('arc_anom_x_8', 50),
  ]);
  assert.equal(kinds.has('relic') || kinds.has('threat'), true);
  assert.equal(rollAnomalyPayloadKind('arc_anom_x_1', 100), 'relic');
  assert.equal(rollAnomalyPayloadKind('arc_anom_x_1', 0), 'threat');
});

test('정책 테스트 오버라이드 후 복구', () => {
  setUnidentifiedAnomalyPolicyForTest({ bandWeightEarly: 4 });
  assert.equal(resolveAnomalyIdentifyChancePct('early'), Math.floor((100 * 4) / (4 + 1 + 3 + 8)));
  setUnidentifiedAnomalyPolicyForTest(null);
  assert.equal(resolveAnomalyIdentifyChancePct('early'), 0);
});

console.log('[unidentifiedAnomalyTestRotation] all tests passed');
