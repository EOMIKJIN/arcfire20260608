/**
 * 중립 hold 런타임 보급 비대칭 P0 — unit tests
 * npx tsx --test src/arcCore/territorial/resolveEffectiveTerritorialCombatMode.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { resolveEffectiveTerritorialCombatMode } from './resolveEffectiveTerritorialCombatMode';
import { getTerritorialCombatPolicy } from './arcCoreTerritorialCombatPolicy';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('1) NEUTRAL + 블루만 인접>0 → effective=blue_neutral (CSV=blue_red 무관)', () => {
  const effective = resolveEffectiveTerritorialCombatMode({
    holdSide: 'NEUTRAL',
    policyCombatMode: 'blue_red',
    supplyAdjacency: { blue: 2, red: 0 },
  });
  assert.equal(effective, 'blue_neutral');
});

test('2) NEUTRAL + 레드만 인접>0 → effective=red_neutral (CSV=blue_red 무관)', () => {
  const effective = resolveEffectiveTerritorialCombatMode({
    holdSide: 'NEUTRAL',
    policyCombatMode: 'blue_red',
    supplyAdjacency: { blue: 0, red: 1 },
  });
  assert.equal(effective, 'red_neutral');
});

test('3) NEUTRAL + 둘다 인접>0 → effective=blue_red (CSV=red_neutral이어도 P0가 덮어씀 — 핵심 증명)', () => {
  const titan = getTerritorialCombatPolicy('titan_ruins');
  assert.ok(titan, 'titan_ruins 정책 행이 로드돼야 함');
  assert.equal(titan!.combatMode, 'red_neutral', 'CSV 원본은 red_neutral(기존행 무단변경 없음)');
  const effective = resolveEffectiveTerritorialCombatMode({
    holdSide: 'NEUTRAL',
    policyCombatMode: titan!.combatMode,
    supplyAdjacency: { blue: 1, red: 1 },
  });
  assert.equal(effective, 'blue_red', '양쪽 다 보급 有 → CSV red_neutral을 무시하고 blue_red(접전)로 오버라이드');
});

test('3b) 타이탄 시나리오 재현 — 블루만 인접(레드 보급 0)이면 CSV=red_neutral임에도 블루 우세 축(blue_neutral)', () => {
  const titan = getTerritorialCombatPolicy('titan_ruins');
  assert.ok(titan);
  const effective = resolveEffectiveTerritorialCombatMode({
    holdSide: 'NEUTRAL',
    policyCombatMode: titan!.combatMode,
    supplyAdjacency: { blue: 1, red: 0 },
  });
  assert.equal(effective, 'blue_neutral', '대표님 예시(타이탄↔블루만 유효 인접 → 블루 점령 고확률) 해소');
});

test('4) NEUTRAL + 둘다 인접=0(고립) → P0 미적용, policy.combatMode 그대로(P1 폴백)', () => {
  const effective = resolveEffectiveTerritorialCombatMode({
    holdSide: 'NEUTRAL',
    policyCombatMode: 'red_neutral',
    supplyAdjacency: { blue: 0, red: 0 },
  });
  assert.equal(effective, 'red_neutral');
});

test('5) hold가 이미 BLUE(비중립) → supplyAdjacency 무관하게 policy.combatMode 그대로(오버라이드 없음)', () => {
  const effective = resolveEffectiveTerritorialCombatMode({
    holdSide: 'BLUE',
    policyCombatMode: 'red_neutral',
    supplyAdjacency: { blue: 0, red: 5 },
  });
  assert.equal(effective, 'red_neutral');
});

test('5b) hold가 이미 RED(비중립) → supplyAdjacency 무관하게 policy.combatMode 그대로', () => {
  const effective = resolveEffectiveTerritorialCombatMode({
    holdSide: 'RED',
    policyCombatMode: 'blue_neutral',
    supplyAdjacency: { blue: 3, red: 0 },
  });
  assert.equal(effective, 'blue_neutral');
});

test('6a) resolveEffectiveTerritorialCombatMode는 planetId를 입력받지 않음 — 구조적으로 planetId 분기 불가', () => {
  const src = readFileSync(resolve(__dirname, 'resolveEffectiveTerritorialCombatMode.ts'), 'utf8');
  assert.equal(/planetId/.test(src), false, '함수 시그니처/본문에 planetId 참조가 없어야 함(전 중립 범용)');
});

test('6b) runTerritorialCombatPass.ts에 helios_core/titan_ruins 등 planetId 하드코딩 우세 분기 없음', () => {
  const src = readFileSync(resolve(__dirname, 'runTerritorialCombatPass.ts'), 'utf8');
  const hardcodePattern = /planetId\s*===\s*['"](helios_core|titan_ruins|draco_haven|omega_hub|shadow_market)['"]/;
  assert.equal(hardcodePattern.test(src), false);
});

test('6c) 배선 확인(정적) — battle 경로가 policy.combatMode가 아닌 effectiveCombatMode를 사용', () => {
  const src = readFileSync(resolve(__dirname, 'runTerritorialCombatPass.ts'), 'utf8');
  // resolveAttackerDefenderSides에 effectiveCombatMode가 두 번째 인자로 전달돼야 함
  assert.match(src, /resolveAttackerDefenderSides\(\s*holdSide,\s*effectiveCombatMode,/);
  // usesBinaryDominance 판정이 effectiveCombatMode 기준이어야 함
  assert.match(src, /usesBinaryDominance =\s*\n\s*effectiveCombatMode === 'blue_neutral'/);
  // resolveBattleHoldTarget 호출 2곳 모두 effectiveCombatMode를 combatMode로 전달
  const battleHoldTargetCalls = src.match(/resolveBattleHoldTarget\(\{\s*\n\s*combatMode: effectiveCombatMode,/g) ?? [];
  assert.equal(battleHoldTargetCalls.length, 2, 'resolveBattleHoldTarget 호출 2곳(2자접전/binary dominance) 모두 effectiveCombatMode 사용');
  // operationMeta의 dominantFaction도 effectiveCombatMode 기준
  assert.match(src, /resolveDominantFaction\(effectiveCombatMode\)/);
});

console.log('[resolveEffectiveTerritorialCombatMode] all tests passed');
