/**
 * 전투 4축 플레이 시뮬 — 발화 충돌 · TCL/헐 · 베뉴 클리어
 * npx tsx src/combat/combatFourAxisPlaySim.test.ts
 *
 * A 허브 · B 웨이브 · C dest-org · D 퀘스트. 틱/persist/RN 없음.
 */
import assert from 'node:assert/strict';
import {
  resolveMainStageCombatEnabled,
  resolvePlanetMainStageCombatVariant,
  resolvePlanetTargetCombatLevel,
  resolveTransitCombatEncounterTargetLevel,
} from '../arcCore/balance/balanceTableRegistry';
import { PlayScenarioZonePlanets_FROM_BALANCE_CSV } from '../data/balance/generated';
import { MISSION_QUEST_COMBAT_OPS_FROM_CSV } from '../data/generated/csvMissionQuestCombatOps';
import { NPC_CAPTAINS_FROM_CSV } from '../data/generated';
import { evaluateHubMainStageCombatEntered } from '../game/waveDefense/evaluateHubMainStageCombatGate';
import { evaluatePlanetWaveCombatTrigger } from '../game/waveDefense/evaluatePlanetWaveCombatTrigger';
import {
  listPlanetWaveEnemySlots,
} from '../game/waveDefense/waveDefensePlanetEnemyIndex';
import {
  waveDefenseEnemyCount,
  waveDefenseInvaderTier,
} from '../game/waveDefense/waveDefenseFleet';
import { resolveTransitEncounterChance } from '../missions/missionCombatEncounter';
import {
  canCompleteQuestDefeatEnemy,
  resolveQuestCombatLock,
  resolveQuestLockTransitEncounterLevel,
  resolveQuestLockTransitHullPlanetId,
  shouldGuaranteeQuestTransitEncounter,
  shouldHoldWaveForQuestHubOrbit,
  type QuestCombatLock,
} from '../missions/questCombatLock';
import { applyPlanetHostileHullScale } from './planetHostileHullScale';
import { resolvePlanetIdForCombatLevel } from './transitHopDangerPolicy';
import type { MissionProgress } from '../types';

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

function active(missionId: string, objectives: Record<string, boolean>): MissionProgress {
  return { missionId, status: 'active', objectives };
}

const ENDGAME_PLANETS = new Set([
  'abyss_gate',
  'core_prime',
  'eternal_throne',
  'genesis_origin',
]);

const CORE_ROWS = PlayScenarioZonePlanets_FROM_BALANCE_CSV.filter((row) => {
  const z = Number(row.zoneIndex);
  return Number.isFinite(z) && z >= 1 && z <= 21;
});

function towardAnchorLock(anchorPlanetId: string): QuestCombatLock {
  return {
    missionId: 'sim_toward',
    objectiveId: 'sim_toward_a',
    templateId: 'pirate_fighter',
    venue: 'transit',
    encounterPolicy: 'transit_toward_anchor',
    anchorPlanetId,
  };
}

function hubOrbitLock(anchorPlanetId: string): QuestCombatLock {
  return {
    missionId: 'sim_hub',
    objectiveId: 'sim_hub_a',
    templateId: 'pirate_fighter',
    venue: 'hub_orbit',
    encounterPolicy: 'hub_orbit',
    anchorPlanetId,
  };
}

test('라이브 정책 — 전투퀘는 전부 hub_orbit · tq만 수락행성 빈 앵커', () => {
  const counts = { transit_guaranteed: 0, transit_toward_anchor: 0, hub_orbit: 0, wave_assault: 0 };
  for (const row of MISSION_QUEST_COMBAT_OPS_FROM_CSV) {
    const policy = String(row.encounterPolicy ?? '').trim();
    assert.ok(policy in counts, `알 수 없는 정책 ${policy}`);
    counts[policy as keyof typeof counts] += 1;
    const anchor = String(row.anchorPlanetId ?? '').trim();
    const oid = String(row.objectiveId ?? '');
    if (policy === 'hub_orbit' && !oid.startsWith('obj_tq_')) {
      assert.ok(anchor.length > 0, `${row.objectiveId} hub_orbit 앵커 필요`);
    }
    if (oid.startsWith('obj_tq_')) {
      assert.equal(policy, 'hub_orbit', `${oid} tq는 수락 행성 궤도`);
      assert.equal(anchor, '', `${oid} tq 앵커는 비움(클론 offerPlanetId)`);
    }
  }
  assert.equal(counts.transit_toward_anchor, 0);
  assert.equal(counts.wave_assault, 0);
  assert.equal(counts.transit_guaranteed, 0);
  assert.ok(counts.hub_orbit >= 28, `hub_orbit=${counts.hub_orbit}`);
  for (const row of MISSION_QUEST_COMBAT_OPS_FROM_CSV) {
    assert.ok(!ENDGAME_PLANETS.has(String(row.anchorPlanetId ?? '').trim()));
  }
});

test('홉 조우 확률 — 집 0 · 가까운 항로 0.05 · 먼 항로 0.70', () => {
  assert.equal(resolveTransitEncounterChance('pvp', false, undefined, null, 'arcadia'), 0);
  assert.equal(resolveTransitEncounterChance('safe', false, undefined, null, 'vega_outpost'), 0.05);
  assert.equal(resolveTransitEncounterChance('neutral', false, undefined, null, 'eternity'), 0.7);
  assert.equal(resolveTransitEncounterChance('safe', true), 0.45);
});

test('코어 21행성 — 유휴 착륙에서 허브·웨이브 이중 발화 없음', () => {
  assert.equal(CORE_ROWS.length, 21);
  for (const row of CORE_ROWS) {
    const planetId = String(row.primaryPlanetId ?? '').trim();
    const variant = resolvePlanetMainStageCombatVariant(planetId);
    const mainStage = resolveMainStageCombatEnabled(planetId);
    const hub = evaluateHubMainStageCombatEntered({
      hubOrbitHostileEntered: true,
      mainStageCombatEnabled: mainStage,
      cooldownActive: false,
      territorialTurnPending: false,
      waveDefenseActiveHere: false,
      waveDefenseSessionHere: false,
    });
    const wave = evaluatePlanetWaveCombatTrigger({
      variant,
      onSequentialList: false,
      stayBlocked: false,
      assaultActive: false,
      cooldownActive: false,
      territorialTurnPending: false,
    });
    assert.equal(hub, false, `${planetId} 유휴 상주 허브 교전 OFF`);
    if (variant === 'endgame_boss') {
      assert.equal(wave.enabled, true, `${planetId} endgame 웨이브`);
      assert.equal(wave.rule, 'csv_variant');
    } else {
      assert.equal(wave.enabled, false, `${planetId} 유휴 웨이브 OFF`);
    }
  }
});

test('분쟁 차례 — 허브 억제 · 웨이브 territorial_turn (퀘스트 없음)', () => {
  for (const row of CORE_ROWS) {
    const planetId = String(row.primaryPlanetId ?? '').trim();
    const variant = resolvePlanetMainStageCombatVariant(planetId);
    const hub = evaluateHubMainStageCombatEntered({
      hubOrbitHostileEntered: true,
      mainStageCombatEnabled: true,
      cooldownActive: false,
      territorialTurnPending: true,
      waveDefenseActiveHere: false,
      waveDefenseSessionHere: false,
    });
    const wave = evaluatePlanetWaveCombatTrigger({
      variant,
      onSequentialList: true,
      stayBlocked: true,
      assaultActive: false,
      cooldownActive: false,
      territorialTurnPending: true,
    });
    assert.equal(hub, false, `${planetId} 분쟁 중 허브`);
    assert.equal(wave.enabled, true, `${planetId} 분쟁 웨이브`);
    assert.equal(wave.rule, 'territorial_turn');
  }
});

test('hub_orbit 락 — 분쟁 웨이브 보류 · 허브 Ready · endgame은 보류 안 함', () => {
  for (const row of CORE_ROWS) {
    const planetId = String(row.primaryPlanetId ?? '').trim();
    const variant = resolvePlanetMainStageCombatVariant(planetId);
    const lock = hubOrbitLock(planetId);
    assert.equal(shouldHoldWaveForQuestHubOrbit(lock, planetId), true);
    const hub = evaluateHubMainStageCombatEntered({
      hubOrbitHostileEntered: true,
      mainStageCombatEnabled: false,
      cooldownActive: false,
      territorialTurnPending: true,
      waveDefenseActiveHere: false,
      waveDefenseSessionHere: false,
      questHubOrbitActive: true,
    });
    const wave = evaluatePlanetWaveCombatTrigger({
      variant,
      onSequentialList: true,
      stayBlocked: true,
      assaultActive: false,
      cooldownActive: false,
      territorialTurnPending: true,
      questHubOrbitHold: true,
    });
    assert.equal(hub, true, `${planetId} hub_orbit Ready`);
    if (variant === 'endgame_boss') {
      assert.equal(wave.enabled, true, `${planetId} endgame 유지`);
      assert.equal(wave.rule, 'territorial_turn');
    } else {
      assert.equal(wave.enabled, false, `${planetId} 분쟁 보류`);
      assert.equal(wave.rule, 'quest_hub_orbit_hold');
    }
  }
});

test('라이브 hub_orbit — 웨이브/항로 승으로 클리어 안 됨', () => {
  const lock = resolveQuestCombatLock(
    { mission_002: active('mission_002', { obj_002_a: false }) },
    'mission_002',
  );
  assert.equal(lock?.encounterPolicy, 'hub_orbit');
  assert.equal(lock?.anchorPlanetId, 'arcadia_prime');
  assert.equal(
    canCompleteQuestDefeatEnemy(lock, {
      venue: 'hub_orbit',
      enemyTemplateId: 'pirate_fighter',
      planetId: 'arcadia_prime',
    }),
    true,
  );
  assert.equal(
    canCompleteQuestDefeatEnemy(lock, {
      venue: 'wave_assault',
      enemyTemplateId: 'pirate_fighter',
      planetId: 'arcadia_prime',
    }),
    false,
  );
  assert.equal(
    canCompleteQuestDefeatEnemy(lock, { venue: 'transit', enemyTemplateId: 'pirate_fighter' }),
    false,
  );
});

test('C 홉 전투 레벨 — 플레이어 레벨과 무관 · 같은 성계는 같은 레벨', () => {
  for (const row of CORE_ROWS) {
    const systemId = String(row.systemId ?? '').trim();
    const low = resolveTransitCombatEncounterTargetLevel(systemId, 1);
    const high = resolveTransitCombatEncounterTargetLevel(systemId, 80);
    assert.equal(low, high, systemId);
    assert.ok(low >= 1 && low <= 60, `${systemId} ${low}`);
  }
  assert.equal(resolveTransitCombatEncounterTargetLevel('arcadia', 40), 1);
  assert.equal(resolveTransitCombatEncounterTargetLevel('eternity', 40), 35);
});

test('D 항로 락 TCL/헐 — tq는 궤도 일반전투 · toward_anchor 오프로드는 dest-org', () => {
  const lock = resolveQuestCombatLock(
    { tq_cbt_01: active('tq_cbt_01', { obj_tq_c01_a: false }) },
    'tq_cbt_01',
  );
  assert.equal(lock?.venue, 'hub_orbit');
  assert.equal(shouldGuaranteeQuestTransitEncounter(lock, 'eternity'), false);
  assert.equal(resolveQuestLockTransitEncounterLevel(lock, 40), null);
  assert.equal(resolveQuestLockTransitHullPlanetId(lock), null);

  const toward = towardAnchorLock('arcadia_prime');
  assert.equal(shouldGuaranteeQuestTransitEncounter(toward, 'arcadia'), true);
  assert.equal(shouldGuaranteeQuestTransitEncounter(toward, 'eternity'), false);
  const questSeedActive = shouldGuaranteeQuestTransitEncounter(toward, 'eternity');
  const encounterLevel = questSeedActive
    ? resolveQuestLockTransitEncounterLevel(toward, 40)
    : resolveTransitCombatEncounterTargetLevel('eternity', 40);
  assert.equal(encounterLevel, 35);
  assert.notEqual(encounterLevel, 1);
  const hullPlanetId = questSeedActive
    ? resolveQuestLockTransitHullPlanetId(toward)
    : resolvePlanetIdForCombatLevel(encounterLevel ?? 1);
  assert.equal(hullPlanetId, 'titan_ruins');
});

test('웨이브 티어 공식 · 슬롯 있으면 공식 미사용 · 동시 12캡', () => {
  assert.equal(waveDefenseInvaderTier(1, 1), 1);
  assert.equal(waveDefenseInvaderTier(9, 1), 5);
  assert.equal(waveDefenseInvaderTier(60, 1), 30);
  assert.equal(waveDefenseEnemyCount(1), 3);
  assert.equal(waveDefenseEnemyCount(2), 6);
  assert.equal(waveDefenseEnemyCount(3), 12);
  assert.equal(waveDefenseEnemyCount(9), 12);
  assert.ok(listPlanetWaveEnemySlots('draco_haven').length > 0);
  assert.equal(listPlanetWaveEnemySlots('genesis_origin').length, 0);
});

test('선체 스케일 — 아르카디아 1.0 · 제네시스 바닥', () => {
  const arcadia = applyPlanetHostileHullScale('arcadia_prime', {
    maxHp: 314,
    maxShield: 40,
    armor: 8,
  });
  assert.equal(arcadia.maxHp, 314);
  const genesis = applyPlanetHostileHullScale('genesis_origin', {
    maxHp: 80,
    maxShield: 40,
    armor: 8,
  });
  assert.ok(genesis.maxHp >= 480, `genesis hp=${genesis.maxHp}`);
});

test('드라코 — 상주 허브 자동교전 폐기 · 웨이브 슬롯은 유지', () => {
  assert.equal(resolveMainStageCombatEnabled('draco_haven'), false);
  const residentCombatRed = NPC_CAPTAINS_FROM_CSV.some(
    (c) =>
      c.basePlanetId === 'draco_haven'
      && c.operationalState === 'combat'
      && (c.combatTeam === 'red' || c.combatTeam === 'orange'),
  );
  assert.equal(residentCombatRed, false);
  assert.ok(listPlanetWaveEnemySlots('draco_haven').length > 0);
});

test('hub_orbit 락은 항로 TCL 경로에 안 섞임 (venue 게이트)', () => {
  const lock = resolveQuestCombatLock(
    { mission_002: active('mission_002', { obj_002_a: false }) },
    'mission_002',
  );
  assert.equal(lock?.venue, 'hub_orbit');
  assert.equal(resolvePlanetTargetCombatLevel('draco_haven'), 9);
  assert.equal(resolveQuestLockTransitEncounterLevel(lock, 40), null);
  assert.equal(resolveQuestLockTransitEncounterLevel(hubOrbitLock('draco_haven'), 40), null);
});

console.log('combatFourAxisPlaySim.test.ts — all PASS');
