/**
 * 전선 주둔 순수 계산 — 롤 가중 비삽입
 * npx tsx --test src/arcCore/territorial/applyTheaterGarrisonAdjustments.test.ts
 */
import assert from 'node:assert/strict';
import type { ArcCoreTheaterGarrisonPolicy } from './arcCoreTheaterGarrisonPolicy';
import {
  applyTheaterBattleGarrisonPct,
  planTheaterRebuildSpend,
  resolveTheaterGarrisonCombatMul,
} from './applyTheaterGarrisonAdjustments';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

const POLICY: ArcCoreTheaterGarrisonPolicy = {
  policyId: 'test_v1',
  enabled: true,
  theaterDailyUpkeepCredits: 200,
  rebuildLocalFeeSharePct: 60,
  rebuildNationSharePct: 40,
  rebuildDailyCapPctOfTarget: 25,
  occupyRetainPct: 20,
  defendWinRetainPct: 100,
  spoilsOnOccupyCredits: 400,
  combatMulMin: 0.85,
  combatMulMax: 1.05,
  applyOnPlayerWave: false,
};

test('점령 잔존 100→20 · 방어 승리는 유지 · 현상유지는 불변', () => {
  assert.equal(applyTheaterBattleGarrisonPct({ currentPct: 100, outcome: 'occupy', policy: POLICY }), 20);
  assert.equal(applyTheaterBattleGarrisonPct({ currentPct: 80, outcome: 'defend_win', policy: POLICY }), 80);
  assert.equal(applyTheaterBattleGarrisonPct({ currentPct: 40, outcome: 'status_quo', policy: POLICY }), 40);
});

test('수비 화력 배율 — 0%=0.85 · 100%=1.05', () => {
  assert.equal(resolveTheaterGarrisonCombatMul(0, POLICY), 0.85);
  assert.equal(resolveTheaterGarrisonCombatMul(100, POLICY), 1.05);
});

test('재건 60/40 — 일 상한 25pct · 로컬 우선', () => {
  const plan = planTheaterRebuildSpend({
    currentPct: 20,
    localFeeAvailable: 1000,
    policy: POLICY,
  });
  assert.equal(plan.upkeepCredits, 40);
  assert.equal(plan.nextPct, 45);
  assert.equal(plan.rebuildLocalSpend + plan.rebuildNationSpend, 50);
  assert.ok(plan.rebuildLocalSpend >= plan.rebuildNationSpend);
});
