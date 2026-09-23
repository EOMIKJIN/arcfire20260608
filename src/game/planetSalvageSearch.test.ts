/**
 * npx tsx --test src/game/planetSalvageSearch.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  resolvePlanetSalvageSearchOutcome,
  resolveSalvageMineralCashCredits,
  rollSalvageMineralCashHit,
} from './planetSalvageSearch';
import {
  nextSalvageSearchDailyUsage,
  resolveSalvageSearchDailyUsage,
} from './planetSalvageSearchDaily';
import {
  resolvePlanetSalvageSearchPolicy,
  setPlanetSalvageSearchPolicyForTest,
} from './planetSalvageSearchPolicy';

const KST_2026_09_21_NOON = Date.parse('2026-09-21T03:00:00.000Z');
const KST_2026_09_21_BEFORE_MIDNIGHT = Date.parse('2026-09-21T14:59:59.000Z');
const KST_2026_09_22_MIDNIGHT = Date.parse('2026-09-21T15:00:00.000Z');
const KST_2026_09_22_NOON = Date.parse('2026-09-22T03:00:00.000Z');

test('수색 정책 — 현금 50% · 일 100회 · 시세 배율 1', () => {
  const policy = resolvePlanetSalvageSearchPolicy();
  assert.equal(policy.enabled, true);
  assert.equal(policy.mineralCashChancePct, 50);
  assert.equal(policy.dailySearchCap, 100);
  assert.equal(policy.cashPriceMul, 1);
});

test('광물 시세 CR — 카탈로그 앵커 · ore_mineral_1 는 10', () => {
  assert.equal(resolveSalvageMineralCashCredits('ore_ferrite'), 10);
  assert.equal(resolveSalvageMineralCashCredits('ore_silicate'), 12);
  assert.equal(resolveSalvageMineralCashCredits('ore_carbon'), 16);
  assert.equal(resolveSalvageMineralCashCredits('ore_nickel'), 21);
  assert.equal(resolveSalvageMineralCashCredits('ore_mineral_1'), 10);
});

test('cash_price_mul=0 이면 시세 CR 없음', () => {
  setPlanetSalvageSearchPolicyForTest({ cashPriceMul: 0 });
  try {
    assert.equal(resolveSalvageMineralCashCredits('ore_ferrite'), null);
  } finally {
    setPlanetSalvageSearchPolicyForTest(null);
  }
});

test('현금 롤 — 0% 없음 · 100% 항상 · 50% 는 0과 100 사이', () => {
  assert.equal(rollSalvageMineralCashHit('p', 'w', 0, 0, '2026-09-21'), false);
  assert.equal(rollSalvageMineralCashHit('p', 'w', 0, 100, '2026-09-21'), true);
  let hits = 0;
  for (let i = 0; i < 40; i += 1) {
    if (rollSalvageMineralCashHit('p', 'w', i, 50, '2026-09-21')) hits += 1;
  }
  assert.ok(hits > 0 && hits < 40);
});

test('일일 한도 — 100회 소진 · 다음날 리셋', () => {
  const empty = resolveSalvageSearchDailyUsage({}, KST_2026_09_21_NOON);
  assert.equal(empty.capped, false);
  assert.equal(empty.remaining, 100);
  const atCap = { salvageSearchDayKey: empty.dayKey, salvageSearchCountToday: 100 };
  const last = resolveSalvageSearchDailyUsage(atCap, KST_2026_09_21_NOON);
  assert.equal(last.capped, true);
  assert.equal(nextSalvageSearchDailyUsage(atCap, KST_2026_09_21_NOON), null);
  const nextDay = resolveSalvageSearchDailyUsage(
    { salvageSearchDayKey: empty.dayKey, salvageSearchCountToday: 100 },
    KST_2026_09_22_NOON,
  );
  assert.equal(nextDay.capped, false);
  assert.equal(nextDay.count, 0);
});

test('KST 자정 직전/직후 — 한도 리셋', () => {
  const before = resolveSalvageSearchDailyUsage({}, KST_2026_09_21_BEFORE_MIDNIGHT);
  const atCap = { salvageSearchDayKey: before.dayKey, salvageSearchCountToday: 100 };
  assert.equal(resolveSalvageSearchDailyUsage(atCap, KST_2026_09_21_BEFORE_MIDNIGHT).capped, true);
  const after = resolveSalvageSearchDailyUsage(atCap, KST_2026_09_22_MIDNIGHT);
  assert.equal(after.capped, false);
  assert.notEqual(after.dayKey, before.dayKey);
});

test('enabled=false 이면 한도 미적용 · 소진은 시드용으로 유지', () => {
  setPlanetSalvageSearchPolicyForTest({ enabled: false });
  try {
    const empty = resolveSalvageSearchDailyUsage({}, KST_2026_09_21_NOON);
    const atCap = { salvageSearchDayKey: empty.dayKey, salvageSearchCountToday: 100 };
    assert.equal(resolveSalvageSearchDailyUsage(atCap, KST_2026_09_21_NOON).capped, false);
    const next = nextSalvageSearchDailyUsage(atCap, KST_2026_09_21_NOON);
    assert.ok(next);
    assert.equal(next?.salvageSearchCountToday, 101);
  } finally {
    setPlanetSalvageSearchPolicyForTest(null);
  }
});

test('결과 — 같은 일·회차는 동일 · 재진입 시퀀스 반복 없음', () => {
  const a = resolvePlanetSalvageSearchOutcome('p', 'w', 3, '2026-09-21');
  const remount = resolvePlanetSalvageSearchOutcome('p', 'w', 3, '2026-09-21');
  assert.deepEqual(a, remount);
  const first = resolvePlanetSalvageSearchOutcome('p', 'w', 1, '2026-09-21');
  const second = resolvePlanetSalvageSearchOutcome('p', 'w', 2, '2026-09-21');
  assert.ok(first.kind === 'relic' || first.kind === 'cash' || first.kind === 'item');
  assert.ok(second.kind === 'relic' || second.kind === 'cash' || second.kind === 'item');
});

test('enabled=false 이면 광물은 아이템(유물 분기는 유지)', () => {
  setPlanetSalvageSearchPolicyForTest({ enabled: true, mineralCashChancePct: 100 });
  let cashSeed = 1;
  let cashOutcome = resolvePlanetSalvageSearchOutcome('p', 'w', cashSeed, '2026-09-21');
  for (let i = 1; i <= 40 && cashOutcome.kind !== 'cash'; i += 1) {
    cashSeed = i;
    cashOutcome = resolvePlanetSalvageSearchOutcome('p', 'w', cashSeed, '2026-09-21');
  }
  assert.equal(cashOutcome.kind, 'cash');
  setPlanetSalvageSearchPolicyForTest({ enabled: false, mineralCashChancePct: 100 });
  try {
    const off = resolvePlanetSalvageSearchOutcome('p', 'w', cashSeed, '2026-09-21');
    assert.equal(off.kind, 'item');
    assert.equal(off.itemId, cashOutcome.itemId);
  } finally {
    setPlanetSalvageSearchPolicyForTest(null);
  }
});
