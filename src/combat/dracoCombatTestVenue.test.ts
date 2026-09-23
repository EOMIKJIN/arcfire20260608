/**
 * npx tsx src/combat/dracoCombatTestVenue.test.ts
 */
import assert from 'node:assert/strict';
import {
  appendDracoCombatTestAllies,
  applyDracoCombatTestWaveTrigger,
  DRACO_COMBAT_TEST_PLANET_ID,
  DRACO_COMBAT_TEST_VENUE_ENABLED,
  DRACO_TEST_CARRIER_CAPTAIN_ID,
  DRACO_TEST_CARRIER_MISSILE_WEAPON_ID,
  DRACO_TEST_DRONE_CAPTAIN_ID,
  DRACO_TEST_DRONE_MISSILE_WEAPON_ID,
  DRACO_TEST_LONG_CAPTAIN_ID,
  DRACO_TEST_SHORT_CAPTAIN_ID,
  isDracoCombatTestVenue,
  resolveDracoCombatTestDoctrine,
  resolveDracoCombatTestRuntimePatch,
} from './dracoCombatTestVenue';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('베뉴 — 시험 종료 후 전 행성 OFF (일반 CSV 전투레벨)', () => {
  assert.equal(DRACO_COMBAT_TEST_VENUE_ENABLED, false);
  assert.equal(isDracoCombatTestVenue('draco_haven'), false);
  assert.equal(isDracoCombatTestVenue('eden_city'), false);
  assert.equal(isDracoCombatTestVenue(null), false);
});

test('동료 4척 — 베뉴 OFF 이면 시드하지 않음', () => {
  const base = [{ team: 'blue' as const, npcShipId: null, captainId: 'Player_pilot' }];
  const once = appendDracoCombatTestAllies(DRACO_COMBAT_TEST_PLANET_ID, base);
  assert.equal(once.length, 1);
  assert.equal(once[0]?.captainId, 'Player_pilot');
  assert.equal(appendDracoCombatTestAllies('eden_city', base).length, 1);
});

test('로드아웃 — 장거리는 미사일만 · 단거리는 로켓+레이저 · 드론/함재기+기타', () => {
  const long = resolveDracoCombatTestRuntimePatch(DRACO_TEST_LONG_CAPTAIN_ID)!;
  const short = resolveDracoCombatTestRuntimePatch(DRACO_TEST_SHORT_CAPTAIN_ID)!;
  const drone = resolveDracoCombatTestRuntimePatch(DRACO_TEST_DRONE_CAPTAIN_ID)!;
  const carrier = resolveDracoCombatTestRuntimePatch(DRACO_TEST_CARRIER_CAPTAIN_ID)!;
  assert.ok(long.missileWeaponId.length > 0);
  assert.equal(long.closeRangeWeaponId, '');
  assert.equal(short.missileWeaponId, '');
  assert.ok(short.closeRangeWeaponId.length > 0);
  assert.equal(drone.missileWeaponId, DRACO_TEST_DRONE_MISSILE_WEAPON_ID);
  assert.equal(drone.closeRangeWeaponId, 'w_missile_arc_005');
  assert.ok(drone.laserWeaponId.length > 0);
  assert.equal(carrier.missileWeaponId, DRACO_TEST_CARRIER_MISSILE_WEAPON_ID);
  assert.equal(carrier.closeRangeWeaponId, 'w_missile_arc_005');
  assert.equal(resolveDracoCombatTestDoctrine(DRACO_TEST_LONG_CAPTAIN_ID)?.tacticId, 'long_range_hold');
  assert.equal(resolveDracoCombatTestDoctrine(DRACO_TEST_SHORT_CAPTAIN_ID)?.tacticId, 'close_assault');
  assert.equal(resolveDracoCombatTestDoctrine(DRACO_TEST_DRONE_CAPTAIN_ID)?.tacticId, 'long_range_hold');
  assert.equal(resolveDracoCombatTestDoctrine(DRACO_TEST_CARRIER_CAPTAIN_ID)?.tacticId, 'long_range_hold');
});

test('웨이브 오버레이 — 베뉴 OFF 이면 CSV 판정 그대로', () => {
  const idle = applyDracoCombatTestWaveTrigger('draco_haven', {
    enabled: false,
    rule: 'none',
    variant: 'draco_boss',
  });
  assert.equal(idle.enabled, false);
  assert.equal(idle.rule, 'none');
  assert.equal(idle.variant, 'draco_boss');
  const cd = applyDracoCombatTestWaveTrigger('draco_haven', {
    enabled: false,
    rule: 'victory_cooldown',
    variant: 'draco_boss',
  });
  assert.equal(cd.enabled, false);
  assert.equal(cd.rule, 'victory_cooldown');
});

console.log('dracoCombatTestVenue.test.ts — ALL PASS');
