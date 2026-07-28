/**
 * 헬리오스·타이탄 게이트 지리 우세 점령(Table-First) — unit tests
 * npx tsx --test src/arcCore/territorial/geoFlankHeliosTitanOccupation.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  getTerritorialCombatPolicy,
  listTerritorialCombatPoliciesForCampaign,
} from './arcCoreTerritorialCombatPolicy';
import { countAdjacentFriendlySystems } from './territorialSupplyLine';
import type { PlanetClanHold } from '../../types';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

test('helios_core — blue_neutral · dominant 70% · draco_front 순차4 · 아이언 측방 우세', () => {
  const policy = getTerritorialCombatPolicy('helios_core');
  assert.ok(policy, 'helios_core 정책 행이 로드돼야 함');
  assert.equal(policy!.systemId, 'helios');
  assert.equal(policy!.enabled, true);
  assert.equal(policy!.contestedZone, true);
  assert.equal(policy!.combatMode, 'blue_neutral');
  assert.equal(policy!.dominantSideWeightPct, 70);
  assert.equal(policy!.campaignGroup, 'draco_front');
  assert.equal(policy!.campaignOrder, 4);
});

test('titan_ruins — red_neutral · dominant 70% · draco_front 순차5 · 섀도우 축 우세', () => {
  const policy = getTerritorialCombatPolicy('titan_ruins');
  assert.ok(policy, 'titan_ruins 정책 행이 로드돼야 함');
  assert.equal(policy!.systemId, 'titan_gate');
  assert.equal(policy!.enabled, true);
  assert.equal(policy!.contestedZone, true);
  assert.equal(policy!.combatMode, 'red_neutral');
  assert.equal(policy!.dominantSideWeightPct, 70);
  assert.equal(policy!.campaignGroup, 'draco_front');
  assert.equal(policy!.campaignOrder, 5);
});

test('draco_front 순차 1~5 — 기존 3(draco_haven·omega_hub·shadow_market) + 신규 2(helios_core·titan_ruins), 순서 보존', () => {
  const campaign = listTerritorialCombatPoliciesForCampaign('draco_front');
  assert.equal(campaign.length, 5);
  assert.deepEqual(
    campaign.map((p) => p.planetId),
    ['draco_haven', 'omega_hub', 'shadow_market', 'helios_core', 'titan_ruins'],
  );
  assert.deepEqual(campaign.map((p) => p.campaignOrder), [1, 2, 3, 4, 5]);
});

test('기존 omega_hub·shadow_market·draco_haven 행 — 수치 무단 변경 없음(회귀 확인)', () => {
  const draco = getTerritorialCombatPolicy('draco_haven')!;
  const omega = getTerritorialCombatPolicy('omega_hub')!;
  const shadow = getTerritorialCombatPolicy('shadow_market')!;
  assert.equal(draco.combatMode, 'blue_red');
  assert.equal(draco.campaignOrder, 1);
  assert.equal(omega.combatMode, 'blue_neutral');
  assert.equal(omega.dominantSideWeightPct, 70);
  assert.equal(omega.campaignOrder, 2);
  assert.equal(shadow.combatMode, 'red_neutral');
  assert.equal(shadow.dominantSideWeightPct, 70);
  assert.equal(shadow.campaignOrder, 3);
  // 공용 파라미터(battleWeightPct 등)도 helios/titan과 동일 복제 확인 — 별도 밸런스 분기 없음
  for (const p of [draco, omega, shadow]) {
    assert.equal(p.passIntervalSec, 1200);
    assert.equal(p.battleWeightPct, 58);
    assert.equal(p.supplyIsolatedPenaltyPct, 35);
    assert.equal(p.supplyBonusPctPerNode, 6);
    assert.equal(p.supplyBonusCapPct, 18);
  }
});

test('TS 소스에 helios_core/titan_ruins 전용 if 하드코딩 분기 없음(정적 grep)', () => {
  const territorialDir = resolve(__dirname);
  const filesToCheck = [
    'runTerritorialCombatPass.ts',
    'arcCoreTerritorialCombatPolicy.ts',
    'territorialSupplyLine.ts',
    'frontPressureIndex.ts',
  ];
  const hardcodePattern = /planetId\s*===\s*['"](helios_core|titan_ruins)['"]/;
  for (const file of filesToCheck) {
    const src = readFileSync(resolve(territorialDir, file), 'utf8');
    assert.equal(
      hardcodePattern.test(src),
      false,
      `${file}에 helios_core/titan_ruins 하드코딩 분기가 있으면 안 됨`,
    );
  }
});

// ── M5(선택) — 지리 우세(combatMode)와 보급(territorialSupplyLine)이 병행 성립하는지 ──
function makeHold(planetId: string, systemId: string, occupierClanId: string): PlanetClanHold {
  return {
    planetId,
    systemId,
    occupierClanId,
    homePlayerUid: null,
    kind: occupierClanId === 'neutral' ? 'neutral' : 'clan_hold',
    capturedAt: 0,
  } as PlanetClanHold;
}

test('M5: 아이언 크로스=BLUE면 헬리오스는 BLUE 보급 인접 有(지리 우세 combatMode=blue_neutral과 병행)', () => {
  const holds: Record<string, PlanetClanHold> = {
    iron_remnant: makeHold('iron_remnant', 'iron_cross', 'balance_seed_faction_blue'),
  };
  const blueAdjacent = countAdjacentFriendlySystems({ systemId: 'helios', side: 'BLUE', holds });
  assert.ok(blueAdjacent >= 1, 'iron_cross(BLUE) 인접이 helios의 BLUE 보급으로 잡혀야 함');
});

test('M5: 섀도우 넥서스=RED면 타이탄 게이트는 RED 보급 인접 有(지리 우세 combatMode=red_neutral과 병행)', () => {
  const holds: Record<string, PlanetClanHold> = {
    shadow_market: makeHold('shadow_market', 'shadow_nexus', 'balance_seed_faction_red'),
  };
  const redAdjacent = countAdjacentFriendlySystems({ systemId: 'titan_gate', side: 'RED', holds });
  assert.ok(redAdjacent >= 1, 'shadow_nexus(RED) 인접이 titan_gate의 RED 보급으로 잡혀야 함');
});

console.log('[geoFlankHeliosTitanOccupation] all tests passed');
