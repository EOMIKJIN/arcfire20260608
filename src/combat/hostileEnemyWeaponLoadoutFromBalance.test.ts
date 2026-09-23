/**
 * 적 무기 로드아웃 — 존 combatLevel 곡선
 * npx tsx src/combat/hostileEnemyWeaponLoadoutFromBalance.test.ts
 */
import assert from 'node:assert/strict';
import {
  resolveCombatEncounterTargetLevel,
  resolvePlanetTargetCombatLevel,
  resolvePlayScenarioPrimaryPlanetId,
  resolveTransitCombatEncounterTargetLevel,
} from '../arcCore/balance/balanceTableRegistry';
import {
  resolveHostileEnemyWeaponLoadout,
  resolveHostileWeaponRequiredLevel,
} from './hostileEnemyWeaponLoadoutFromBalance';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('A/B/C 3패턴 유지', () => {
  const a = resolveHostileEnemyWeaponLoadout(0, 1);
  const b = resolveHostileEnemyWeaponLoadout(1, 1);
  const c = resolveHostileEnemyWeaponLoadout(2, 1);
  const a3 = resolveHostileEnemyWeaponLoadout(3, 1);
  assert.deepEqual(a, a3);
  assert.notDeepEqual(a, b);
  assert.notDeepEqual(b, c);
});

test('후반 레벨 무기는 초반보다 requiredLevel 높음', () => {
  const early = resolveHostileEnemyWeaponLoadout(1, 1);
  const late = resolveHostileEnemyWeaponLoadout(1, 60);
  const earlyLv = resolveHostileWeaponRequiredLevel(early.missileWeaponId);
  const lateLv = resolveHostileWeaponRequiredLevel(late.missileWeaponId);
  assert.ok(lateLv > earlyLv, `late ${lateLv} > early ${earlyLv}`);
  assert.ok(lateLv >= 20, `late missile requiredLevel ${lateLv}`);
});

test('장거리 미사일 게이트는 정책값 13 유지', () => {
  const mid12 = resolveHostileEnemyWeaponLoadout(1, 12);
  const mid13 = resolveHostileEnemyWeaponLoadout(1, 13);
  assert.ok(
    resolveHostileWeaponRequiredLevel(mid13.missileWeaponId)
      >= resolveHostileWeaponRequiredLevel(mid12.missileWeaponId),
  );
});

test('행성 목표 레벨 — 아르카디아1 · 이터니티60', () => {
  assert.equal(resolvePlanetTargetCombatLevel('arcadia_prime'), 1);
  assert.equal(resolvePlanetTargetCombatLevel('eternal_throne'), 60);
});

test('차원항로 __transit__ 는 성계 시나리오 레벨', () => {
  assert.equal(resolveCombatEncounterTargetLevel('__transit__'), 1);
  assert.equal(resolveCombatEncounterTargetLevel('__transit__', 'arcadia'), 1);
  assert.equal(resolveCombatEncounterTargetLevel('__transit__', 'eternity'), 60);
  assert.equal(resolveCombatEncounterTargetLevel('__transit__', 'draco_nebula'), 9);
  assert.equal(resolveCombatEncounterTargetLevel('eternal_throne', 'ignored'), 60);
});

test('이동중 TCL — 목적지 상한 · 플레이어 캡', () => {
  assert.equal(resolveTransitCombatEncounterTargetLevel('crimson_zone', 8), 8);
  assert.equal(resolveTransitCombatEncounterTargetLevel('crimson_zone', 40), 25);
  assert.equal(resolveTransitCombatEncounterTargetLevel('eternity'), 60);
});

test('이동중 TCL — 신스 캠프 성계는 colonization 행', () => {
  assert.equal(resolveCombatEncounterTargetLevel('__transit__', 'synth_011'), 18);
  assert.equal(resolvePlayScenarioPrimaryPlanetId('synth_011'), 'synth_011_p');
  assert.equal(resolveTransitCombatEncounterTargetLevel('synth_011', 10), 10);
  assert.equal(resolveTransitCombatEncounterTargetLevel('synth_011', 40), 18);
});

console.log('hostileEnemyWeaponLoadoutFromBalance.test.ts — all PASS');
