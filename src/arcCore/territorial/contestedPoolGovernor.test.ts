/**
 * 분쟁지역 풀 거버너(M3~M5) — 순수 결정 로직 unit tests
 * npx tsx --test src/arcCore/territorial/contestedPoolGovernor.test.ts
 */
import assert from 'node:assert/strict';
import {
  planContestedPoolRebalance,
  scoreContestedEligibilityCandidate,
  type ContestedPoolMemberInput,
} from './contestedPoolGovernor';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

function member(over: Partial<ContestedPoolMemberInput> & { planetId: string }): ContestedPoolMemberInput {
  return {
    systemId: `${over.planetId}_sys`,
    classification: 'ineligible',
    isStaticCsvRow: false,
    isActiveMember: false,
    score: 0,
    inCooldown: false,
    ...over,
  };
}

test('1) N=5(<min=8) — 같은 티어(FRONT) 안에서는 점수 높은 후보부터, stepMax=2 상한이라 이번 라운드는 2개만', () => {
  const members: ContestedPoolMemberInput[] = [
    ...[1, 2, 3, 4, 5].map((i) =>
      member({ planetId: `active_${i}`, isActiveMember: true, isStaticCsvRow: i <= 3, classification: 'eligible_front' }),
    ),
    member({ planetId: 'cand_high', classification: 'eligible_front', score: 115 }),
    member({ planetId: 'cand_mid', classification: 'eligible_front', score: 60 }),
    member({ planetId: 'cand_low', classification: 'eligible_front', score: 60 }), // 동점 → planetId 결정적
  ];
  const plan = planContestedPoolRebalance({ members, poolMin: 8, poolMax: 12, stepMax: 2 });
  assert.deepEqual(plan.demote, []);
  assert.equal(plan.promote.length, 2, 'stepMax=2 상한 — 필요(3)보다 적게, 딱 2개만 승격');
  assert.equal(plan.promote[0], 'cand_high', '가장 높은 점수부터 승격');
  assert.equal(plan.promote[1], 'cand_low', '동점(mid/low)은 planetId 사전순 — "cand_low" < "cand_mid"(l<m)');
});

test('1b) 대표님 핵심 요건(iron_remnant 재현) — 필요분(1) 내에서 점수 낮은 중립이 점수 만점 FRONT보다 먼저 승격', () => {
  const members: ContestedPoolMemberInput[] = [
    ...Array.from({ length: 7 }, (_, i) =>
      member({ planetId: `active_${i}`, isActiveMember: true, classification: 'eligible_front' }),
    ), // 7개 활성 → min8까지 딱 1개만 필요
    // iron_remnant급 — FRONT + 인접연속 + 최근전투 보너스 다 붙어 점수 125(만점)까지 나와도
    member({ planetId: 'iron_remnant', classification: 'eligible_front', score: 125 }),
    // 외곽 국경 중립 — 보너스 없이 기본값(120)뿐이라 점수만 보면 iron_remnant(125)보다 낮음
    member({ planetId: 'eternal_throne', classification: 'eligible_strategic_neutral', score: 120 }),
  ];
  const plan = planContestedPoolRebalance({ members, poolMin: 8, poolMax: 12, stepMax: 2 });
  assert.deepEqual(
    plan.promote,
    ['eternal_throne'],
    '필요분(1)만큼만 승격 — 점수는 iron_remnant(125)가 더 높아도 티어상 중립이 우선이라 eternal_throne만 선택돼야 함',
  );
});

test('1c) 중립 후보가 stepMax보다 많으면 그 라운드는 중립만으로 채우고 FRONT는 다음 라운드로', () => {
  const members: ContestedPoolMemberInput[] = [
    ...Array.from({ length: 4 }, (_, i) =>
      member({ planetId: `active_${i}`, isActiveMember: true, classification: 'eligible_front' }),
    ),
    member({ planetId: 'iron_remnant', classification: 'eligible_front', score: 999 }),
    member({ planetId: 'neutral_a', classification: 'eligible_strategic_neutral', score: 120 }),
    member({ planetId: 'neutral_b', classification: 'eligible_strategic_neutral', score: 120 }),
    member({ planetId: 'neutral_c', classification: 'eligible_strategic_neutral', score: 120 }),
  ];
  const plan = planContestedPoolRebalance({ members, poolMin: 8, poolMax: 12, stepMax: 2 });
  assert.equal(plan.promote.length, 2);
  assert.deepEqual(plan.promote, ['neutral_a', 'neutral_b']);
  assert.equal(plan.promote.includes('iron_remnant'), false);
});

test('1d) 중립 후보가 전혀 없으면(전부 소진) 그제야 FRONT가 승격 대상이 됨', () => {
  const members: ContestedPoolMemberInput[] = [
    ...Array.from({ length: 6 }, (_, i) =>
      member({ planetId: `active_${i}`, isActiveMember: true, classification: 'eligible_front' }),
    ),
    member({ planetId: 'iron_remnant', classification: 'eligible_front', score: 100 }),
    member({ planetId: 'indep_cand', classification: 'eligible_independent_front', score: 80 }),
  ];
  const plan = planContestedPoolRebalance({ members, poolMin: 8, poolMax: 12, stepMax: 2 });
  assert.deepEqual(
    plan.promote,
    ['iron_remnant', 'indep_cand'],
    '중립 후보 없음 → FRONT(1티어)가 INDEPENDENT_FRONT(2티어)보다 먼저',
  );
});

test('2) N=14(>max=12) — 동적 멤버만, 점수 낮은 순으로 강등(최대 2)', () => {
  const members: ContestedPoolMemberInput[] = [
    member({ planetId: 'csv_1', isActiveMember: true, isStaticCsvRow: true, classification: 'eligible_front', score: 10 }), // CSV라 강등 대상 제외돼야 함
    ...Array.from({ length: 13 }, (_, i) =>
      member({
        planetId: `dyn_${i}`,
        isActiveMember: true,
        isStaticCsvRow: false,
        classification: 'eligible_strategic_neutral',
        score: 60 + i, // dyn_0이 가장 낮은 점수
      }),
    ),
  ];
  const plan = planContestedPoolRebalance({ members, poolMin: 8, poolMax: 12, stepMax: 2 });
  assert.deepEqual(plan.promote, []);
  assert.equal(plan.demote.length, 2);
  assert.deepEqual(plan.demote, ['dyn_0', 'dyn_1'], '점수 가장 낮은 동적 멤버부터 강등');
  assert.equal(plan.demote.includes('csv_1'), false, 'CSV 정적행은 강등(store remove) 대상이면 안 됨');
});

test('3) SAFE 지속 동적 멤버는 N과 무관하게 우선 정리(demote) — CSV 정적행은 SAFE여도 제외 대상 아님', () => {
  const members: ContestedPoolMemberInput[] = [
    member({ planetId: 'csv_safe', isActiveMember: true, isStaticCsvRow: true, classification: 'safe_hinterland' }),
    member({ planetId: 'dyn_safe', isActiveMember: true, isStaticCsvRow: false, classification: 'safe_hinterland' }),
    ...Array.from({ length: 8 }, (_, i) =>
      member({ planetId: `active_${i}`, isActiveMember: true, classification: 'eligible_front' }),
    ),
  ];
  const plan = planContestedPoolRebalance({ members, poolMin: 8, poolMax: 12, stepMax: 2 });
  assert.deepEqual(plan.demote, ['dyn_safe'], 'SAFE 동적 멤버만 정리, CSV 정적행(csv_safe)은 그대로');
});

test('4) 쿨다운 중인 후보/멤버는 이번 라운드에서 건드리지 않음', () => {
  const members: ContestedPoolMemberInput[] = [
    ...Array.from({ length: 5 }, (_, i) =>
      member({ planetId: `active_${i}`, isActiveMember: true, classification: 'eligible_front' }),
    ),
    member({ planetId: 'cand_cooldown', classification: 'eligible_front', score: 999, inCooldown: true }),
    member({ planetId: 'cand_ok', classification: 'eligible_front', score: 50 }),
  ];
  const plan = planContestedPoolRebalance({ members, poolMin: 8, poolMax: 12, stepMax: 2 });
  assert.equal(plan.promote.includes('cand_cooldown'), false, '쿨다운 중 후보는 점수가 높아도 승격 제외');
  assert.ok(plan.promote.includes('cand_ok'));
});

test('5) N이 [min,max] 범위 내면 조정 없음(안정 상태)', () => {
  const members: ContestedPoolMemberInput[] = [
    ...Array.from({ length: 10 }, (_, i) =>
      member({ planetId: `active_${i}`, isActiveMember: true, classification: 'eligible_front' }),
    ),
    member({ planetId: 'cand', classification: 'eligible_front', score: 999 }),
  ];
  const plan = planContestedPoolRebalance({ members, poolMin: 8, poolMax: 12, stepMax: 2 });
  assert.deepEqual(plan.promote, []);
  assert.deepEqual(plan.demote, []);
});

test('6) ineligible 후보는 아무리 N이 부족해도 승격되지 않음', () => {
  const members: ContestedPoolMemberInput[] = [
    ...Array.from({ length: 3 }, (_, i) =>
      member({ planetId: `active_${i}`, isActiveMember: true, classification: 'eligible_front' }),
    ),
    member({ planetId: 'cand_ineligible', classification: 'ineligible', score: 999 }),
  ];
  const plan = planContestedPoolRebalance({ members, poolMin: 8, poolMax: 12, stepMax: 2 });
  assert.equal(plan.promote.includes('cand_ineligible'), false);
});

test('7) scoreContestedEligibilityCandidate — front(100)+연속(15)+최근전투(10)=125', () => {
  const score = scoreContestedEligibilityCandidate({
    classification: 'eligible_front',
    hasAdjacentActiveMember: true,
    recentPlayerCombat: true,
  });
  assert.equal(score, 125);
});

test('7b) strategic_neutral 기본 120(FRONT 100보다 높음) · independent_front 기본 80', () => {
  assert.equal(
    scoreContestedEligibilityCandidate({
      classification: 'eligible_strategic_neutral',
      hasAdjacentActiveMember: false,
      recentPlayerCombat: false,
    }),
    120,
  );
  assert.equal(
    scoreContestedEligibilityCandidate({
      classification: 'eligible_independent_front',
      hasAdjacentActiveMember: false,
      recentPlayerCombat: false,
    }),
    80,
  );
});

console.log('[contestedPoolGovernor] all tests passed');
