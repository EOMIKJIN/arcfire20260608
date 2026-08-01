/**
 * 보급 3성계 포위 우세 — unit tests (task_id=supply-envelope-occupy-rebellion-neutral-20260801)
 * npx tsx --test src/arcCore/territorial/resolveSupplyEnvelope.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  applySupplyEnvelopeDecisionWeights,
  resolveSupplyEnvelope,
  resolveSupplyEnvelopeDominantOverridePct,
} from './resolveSupplyEnvelope';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('1) blue=3,red=0,threshold=3 → blue_strong', () => {
  assert.equal(resolveSupplyEnvelope({ adjacency: { blue: 3, red: 0 }, threshold: 3 }), 'blue_strong');
});

test('1b) red=3,blue=0,threshold=3 → red_strong(대칭)', () => {
  assert.equal(resolveSupplyEnvelope({ adjacency: { blue: 0, red: 3 }, threshold: 3 }), 'red_strong');
});

test('2) blue=2,red=0(threshold=3 미달) → none — 1개나 3개나 같은 70%였던 기존 갭(G1) 해소 확인', () => {
  assert.equal(resolveSupplyEnvelope({ adjacency: { blue: 2, red: 0 }, threshold: 3 }), 'none');
});

test('3) blue=4,red=1(반대 보급>0, 전선) → none — 포위 아님, 접전', () => {
  assert.equal(resolveSupplyEnvelope({ adjacency: { blue: 4, red: 1 }, threshold: 3 }), 'none');
});

test('4) 연결 수 < threshold인 성계는 구조적으로 STRONG 불가(blue=2가 연결 전체, threshold=3)', () => {
  // 연결이 2개뿐인 성계는 blue가 최대 2로 threshold(3)를 못 넘음 — resolveSupplyEnvelope 자체가 이미 자연 폴백
  assert.equal(resolveSupplyEnvelope({ adjacency: { blue: 2, red: 0 }, threshold: 3 }), 'none');
});

test('5) NEUTRAL+STRONG → battle 상향, status_quo 그만큼 하향, neutral_declare는 무변경', () => {
  const weights = applySupplyEnvelopeDecisionWeights({
    holdSide: 'NEUTRAL',
    envelope: 'blue_strong',
    weights: { battleWeightPct: 58, neutralDeclareWeightPct: 12, statusQuoWeightPct: 30 },
    envelopeBattleWeightBoostPct: 20,
    envelopeNeutralDeclareMul: 0,
  });
  assert.deepEqual(weights, { battleWeightPct: 78, neutralDeclareWeightPct: 12, statusQuoWeightPct: 10 });
});

test('6) 아이언 회귀 재현 — BLUE hold + blueEnv=3·redEnv=0(STRONG) → neutral_declare=0, status_quo가 흡수', () => {
  const weights = applySupplyEnvelopeDecisionWeights({
    holdSide: 'BLUE',
    envelope: 'blue_strong',
    weights: { battleWeightPct: 58, neutralDeclareWeightPct: 12, statusQuoWeightPct: 30 },
    envelopeBattleWeightBoostPct: 20,
    envelopeNeutralDeclareMul: 0,
  });
  assert.deepEqual(weights, { battleWeightPct: 58, neutralDeclareWeightPct: 0, statusQuoWeightPct: 42 });
});

test('7) BLUE hold + blueEnv=3·redEnv≥1(전선, 포위 아님) → 기존 neutral_declare 가중 유지', () => {
  const weights = applySupplyEnvelopeDecisionWeights({
    holdSide: 'BLUE',
    envelope: 'none', // redEnv>=1이면 resolveSupplyEnvelope가 이미 'none' 반환
    weights: { battleWeightPct: 58, neutralDeclareWeightPct: 12, statusQuoWeightPct: 30 },
    envelopeBattleWeightBoostPct: 20,
    envelopeNeutralDeclareMul: 0,
  });
  assert.deepEqual(weights, { battleWeightPct: 58, neutralDeclareWeightPct: 12, statusQuoWeightPct: 30 });
});

test('8) RED hold + blue_strong(반대측 STRONG) → RED hold는 조정 대상 아님(동측 아님)', () => {
  const weights = applySupplyEnvelopeDecisionWeights({
    holdSide: 'RED',
    envelope: 'blue_strong',
    weights: { battleWeightPct: 58, neutralDeclareWeightPct: 12, statusQuoWeightPct: 30 },
    envelopeBattleWeightBoostPct: 20,
    envelopeNeutralDeclareMul: 0,
  });
  assert.deepEqual(weights, { battleWeightPct: 58, neutralDeclareWeightPct: 12, statusQuoWeightPct: 30 });
});

test('9) resolveSupplyEnvelopeDominantOverridePct — NEUTRAL+STRONG일 때만 occupyHighWeightPct 반환', () => {
  assert.equal(
    resolveSupplyEnvelopeDominantOverridePct({ holdSide: 'NEUTRAL', envelope: 'blue_strong', occupyHighWeightPct: 88 }),
    88,
  );
  assert.equal(
    resolveSupplyEnvelopeDominantOverridePct({ holdSide: 'NEUTRAL', envelope: 'none', occupyHighWeightPct: 88 }),
    null,
  );
  assert.equal(
    resolveSupplyEnvelopeDominantOverridePct({ holdSide: 'BLUE', envelope: 'blue_strong', occupyHighWeightPct: 88 }),
    null,
    'BLUE hold는 이미 점유 상태라 오버라이드 대상 아님(A는 NEUTRAL 전용)',
  );
});

test('10) planetId를 입력받지 않음(구조적 하드코딩 불가) — 소스에 planetId 참조 없음', () => {
  const src = readFileSync(resolve(__dirname, 'resolveSupplyEnvelope.ts'), 'utf8');
  assert.equal(/planetId/.test(src), false);
});

test('11) M2/M3/M4 배선 확인(정적) — runTerritorialCombatPass.ts가 rollDecision·dominant%에 envelope 보정을 실제로 사용', () => {
  const src = readFileSync(resolve(__dirname, 'runTerritorialCombatPass.ts'), 'utf8');
  assert.match(
    src,
    /battleWeightPct: envelopeAdjustedWeights\.battleWeightPct,\s*\n\s*neutralDeclareWeightPct: envelopeAdjustedWeights\.neutralDeclareWeightPct,\s*\n\s*statusQuoWeightPct: envelopeAdjustedWeights\.statusQuoWeightPct,/,
    'rollDecision이 envelope 보정 가중치를 써야 함(CSV 원본 policy.battleWeightPct 등 직접 사용 아님)',
  );
  assert.match(
    src,
    /policy: policyForDominance,/,
    'resolveBattleHoldTarget이 envelope로 오버라이드된 policyForDominance를 써야 함',
  );
  assert.equal(
    /if\s*\(\s*planetId\s*===\s*['"]iron_remnant['"]\s*\)/.test(src),
    false,
    'iron_remnant 등 planetId 하드코딩 분기가 있으면 안 됨',
  );
});

test('12) M5 배선 확인(정적) — 반란 일일패스가 envelopeFactionMul(보정 배율)을 shouldRebellionOverthrowSucceed에 실제로 전달', () => {
  const src = readFileSync(
    resolve(__dirname, '../planetCore/runPlanetRebellionResolutionDailyPass.ts'),
    'utf8',
  );
  assert.match(src, /envelopeFactionMul,\s*\n\s*rollPolicy,/);
  assert.match(src, /getArcCoreSupplyEnvelopePolicy/);
});

console.log('[resolveSupplyEnvelope] all tests passed');
