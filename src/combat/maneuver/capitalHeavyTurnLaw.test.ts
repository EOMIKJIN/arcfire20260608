/**
 * npx tsx src/combat/maneuver/capitalHeavyTurnLaw.test.ts
 */
import assert from 'node:assert/strict';
import {
  CAPITAL_HEAVY_BASE_MIN_TURN_RADIUS_PX,
  CAPITAL_HEAVY_MAX_YAW_RAD_PER_MS,
  CAPITAL_HEAVY_YAW_RISE_MS,
  createCapitalHeavyTurnLaw,
  headingAlignGainForMaxYaw,
  writeCapitalHeavyTurnLaw,
} from './capitalHeavyTurnLaw';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('순항 블루급 — 요율이 이동속도/반경·절대 상한 안에 들어감', () => {
  const out = createCapitalHeavyTurnLaw();
  writeCapitalHeavyTurnLaw(0.0196, 0.0018, 0.00005, 8, out);
  assert.ok(out.maxTurnRateRadPerMs <= CAPITAL_HEAVY_MAX_YAW_RAD_PER_MS);
  assert.ok(out.minTurnRadiusPx + 1e-9 >= CAPITAL_HEAVY_BASE_MIN_TURN_RADIUS_PX);
  assert.ok(out.maxTurnRateRadPerMs < 0.0018);
  assert.ok(Math.abs(out.maxTurnRateRadPerMs * out.minTurnRadiusPx - 0.0196) < 1e-9);
});

test('표 선회가 더 느리면 표를 존중', () => {
  const out = createCapitalHeavyTurnLaw();
  writeCapitalHeavyTurnLaw(0.0196, 0.0002, 0.00001, 8, out);
  assert.equal(out.maxTurnRateRadPerMs, 0.0002);
});

test('대형 함급 — 선회 반경↑ · 요율↓', () => {
  const small = createCapitalHeavyTurnLaw();
  const large = createCapitalHeavyTurnLaw();
  writeCapitalHeavyTurnLaw(0.02, 0.0024, 0.00007, 4, small);
  writeCapitalHeavyTurnLaw(0.02, 0.0024, 0.00007, 16, large);
  assert.ok(large.minTurnRadiusPx > small.minTurnRadiusPx);
  assert.ok(large.maxTurnRateRadPerMs < small.maxTurnRateRadPerMs);
});

test('각가속은 0→최대 요 상승시간으로 캡', () => {
  const out = createCapitalHeavyTurnLaw();
  writeCapitalHeavyTurnLaw(0.0196, 0.0018, 0.00012, 8, out);
  assert.ok(out.turnAccelRadPerMs2 <= out.maxTurnRateRadPerMs / CAPITAL_HEAVY_YAW_RISE_MS + 1e-12);
  assert.ok(out.turnAccelRadPerMs2 < 0.00012);
});

test('헤딩 이득 — 약 18°에서 최대 요', () => {
  const g = headingAlignGainForMaxYaw(0.00063);
  assert.ok(Math.abs(g * 0.32 - 0.00063) < 1e-12);
  assert.ok(g < 0.01);
});

console.log('capitalHeavyTurnLaw.test.ts — ALL PASS');
