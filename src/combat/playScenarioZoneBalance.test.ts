/**
 * 권장안 연동 — 존 TCL 도전 키트 진열 · 선체 스케일 · 샌드박스 수락 Lv
 * npx tsx src/combat/playScenarioZoneBalance.test.ts
 */
import assert from 'node:assert/strict';
import {
  getTradePortWeaponListingCount,
  resolvePlanetTargetCombatLevel,
  resolveTargetCombatLevelForZone,
} from '../arcCore/balance/balanceTableRegistry';
import { getPlanetLevelingRowForZone } from '../arcCore/planetBalance/planetZoneIndexRegistry';
import {
  listChallengeWeaponIdsForZone,
  resolveTradePortWeaponIdsForZone,
  resolveWeaponRequiredPilotLevel,
} from '../arcCore/balance/weaponTradeListingPolicy';
import { resolveHostileEnemyWeaponLoadout } from './hostileEnemyWeaponLoadoutFromBalance';
import { applyPlanetHostileHullScale } from './planetHostileHullScale';
import { MISSIONS_FROM_CSV } from '../data/generated/csvMissions';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('존 TCL 정본 — 시나리오 1·5·14·21', () => {
  assert.equal(resolveTargetCombatLevelForZone(1), 1);
  assert.equal(resolveTargetCombatLevelForZone(5), 9);
  assert.equal(resolveTargetCombatLevelForZone(14), 37);
  assert.equal(resolveTargetCombatLevelForZone(21), 60);
  assert.equal(resolvePlanetTargetCombatLevel('draco_haven'), 9);
});

test('레벨링 Zone21 행 — 제네시스 권장 Lv60', () => {
  const row = getPlanetLevelingRowForZone(21);
  assert.equal(Number(row.recommendedPilotLevel), 60);
  assert.equal(String(row.recommendedHullTierKey), 'battlecruiser_max');
});

test('무역 진열 상한 24 — 도전 키트 예약 여유', () => {
  assert.equal(getTradePortWeaponListingCount(), 24);
});

test('도전 키트 — 현재 존 TCL 무기가 해당 존 진열에 포함', () => {
  for (const zone of [1, 5, 7, 12, 14]) {
    const tcl = resolveTargetCombatLevelForZone(zone);
    const listed = new Set(resolveTradePortWeaponIdsForZone(zone));
    const recLv = Number(getPlanetLevelingRowForZone(zone).recommendedPilotLevel);
    for (let spawn = 0; spawn < 3; spawn += 1) {
      const loadout = resolveHostileEnemyWeaponLoadout(spawn, tcl);
      assert.ok(listed.has(loadout.laserWeaponId), `Z${zone} laser ${loadout.laserWeaponId}`);
      assert.ok(listed.has(loadout.missileWeaponId), `Z${zone} missile ${loadout.missileWeaponId}`);
      assert.ok(
        resolveWeaponRequiredPilotLevel(loadout.laserWeaponId) <= recLv + 1,
        `Z${zone} 권장Lv${recLv}에서 ${loadout.laserWeaponId} 구매 게이트`,
      );
      assert.ok(
        resolveWeaponRequiredPilotLevel(loadout.missileWeaponId) <= recLv + 1,
        `Z${zone} 권장Lv${recLv}에서 ${loadout.missileWeaponId} 구매 게이트`,
      );
    }
  }
});

test('다음 존 도전 키트 — 현재 무역소 진열에 예약(구매는 다음 권장Lv)', () => {
  const listed = new Set(resolveTradePortWeaponIdsForZone(5));
  const nextIds = listChallengeWeaponIdsForZone(5);
  assert.ok(nextIds.length >= 2);
  for (const id of nextIds) {
    assert.ok(listed.has(id), `드라코 진열에 ${id} 예약`);
  }
});

test('선체 스케일 — 초반 유지 · 헬리오스 역행 보정 · 제네시스 바닥', () => {
  const arcadia = applyPlanetHostileHullScale('arcadia_prime', {
    maxHp: 314,
    maxShield: 95,
    armor: 8,
  });
  assert.equal(arcadia.maxHp, 314);

  const helios = applyPlanetHostileHullScale('helios_core', {
    maxHp: 426,
    maxShield: 135,
    armor: 11,
  });
  assert.equal(helios.maxHp, Math.round(426 * 1.7));

  const genesis = applyPlanetHostileHullScale('genesis_origin', {
    maxHp: 80,
    maxShield: 40,
    armor: 8,
  });
  assert.ok(genesis.maxHp >= 480);
});

test('샌드박스 전투 수락 Lv = 앵커 권장 Lv', () => {
  assert.equal(MISSIONS_FROM_CSV.sandbox_001?.levelRequired, 1);
  assert.equal(MISSIONS_FROM_CSV.sandbox_003?.levelRequired, 5);
  assert.equal(MISSIONS_FROM_CSV.sandbox_013?.levelRequired, 9);
  assert.equal(MISSIONS_FROM_CSV.sandbox_015?.levelRequired, 37);
  assert.equal(MISSIONS_FROM_CSV.sandbox_017?.levelRequired, 31);
  assert.equal(MISSIONS_FROM_CSV.sandbox_029?.levelRequired, 40);
  assert.equal(MISSIONS_FROM_CSV.sandbox_032?.levelRequired, 7);
});

console.log('playScenarioZoneBalance.test.ts — all PASS');
