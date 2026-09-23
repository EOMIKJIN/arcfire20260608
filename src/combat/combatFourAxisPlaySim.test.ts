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

test('라이브 정책 — transit_guaranteed만 · 신규 베뉴 0행', () => {
  const counts = { transit_guaranteed: 0, transit_toward_anchor: 0, hub_orbit: 0, wave_assault: 0 };
  for (const row of MISSION_QUEST_COMBAT_OPS_FROM_CSV) {
    const policy = String(row.encounterPolicy ?? '').trim();
    assert.ok(policy in counts, `알 수 없는 정책 ${policy}`);
    counts[policy as keyof typeof counts] += 1;
  }
  assert.equal(counts.transit_toward_anchor, 0);
  assert.equal(counts.hub_orbit, 0);
  assert.equal(counts.wave_assault, 0);
  assert.ok(counts.transit_guaranteed >= 25, `guaranteed=${counts.transit_guaranteed}`);
  for (const row of MISSION_QUEST_COMBAT_OPS_FROM_CSV) {
    assert.ok(!ENDGAME_PLANETS.has(String(row.anchorPlanetId ?? '').trim()));
  }
});

test('존 dest-org 확률 — 0.1 / 0.3 / 0.7 유지', () => {
  assert.equal(resolveTransitEncounterChance('safe', false), 0.1);
  assert.equal(resolveTransitEncounterChance('neutral', false), 0.3);
  assert.equal(resolveTransitEncounterChance('pvp', false), 0.7);
  assert.equal(resolveTransitEncounterChance('safe', true), 0.5);
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
    if (variant === 'endgame_boss') {
      assert.equal(wave.enabled, true, `${planetId} endgame 웨이브`);
      assert.equal(wave.rule, 'csv_variant');
    } else {
      assert.equal(wave.enabled, false, `${planetId} 유휴 웨이브 OFF`);
    }
    if (hub && wave.enabled) {
      assert.equal(variant, 'endgame_boss', `${planetId} 허브+웨이브 동시 — 세션 전 endgame만`);
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

test('라이브 transit_guaranteed — 허브/웨이브 승으로 클리어 안 됨', () => {
  const lock = resolveQuestCombatLock(
    { mission_002: active('mission_002', { obj_002_a: false }) },
    'mission_002',
  );
  assert.equal(lock?.encounterPolicy, 'transit_guaranteed');
  assert.equal(lock?.anchorPlanetId, 'arcadia_prime');
  assert.equal(
    canCompleteQuestDefeatEnemy(lock, {
      venue: 'hub_orbit',
      enemyTemplateId: 'pirate_fighter',
      planetId: 'arcadia_prime',
    }),
    false,
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
    true,
  );
});

test('C dest-org TCL — 21성계 min(player, destTCL) · 퀘스트 락 없이 dest 픽', () => {
  for (const row of CORE_ROWS) {
    const systemId = String(row.systemId ?? '').trim();
    const destTcl = resolvePlanetTargetCombatLevel(String(row.primaryPlanetId ?? '').trim());
    assert.equal(resolveTransitCombatEncounterTargetLevel(systemId, 1), 1, systemId);
    assert.equal(resolveTransitCombatEncounterTargetLevel(systemId, destTcl), destTcl, systemId);
    assert.equal(resolveTransitCombatEncounterTargetLevel(systemId, destTcl + 20), destTcl, systemId);
  }
});

test('D 항로 락 TCL/헐 — 보장 홉만 앵커 · toward_anchor 오프로드는 dest-org', () => {
  const lock = resolveQuestCombatLock(
    { mission_002: active('mission_002', { obj_002_a: false }) },
    'mission_002',
  );
  assert.equal(shouldGuaranteeQuestTransitEncounter(lock, 'eternity'), true);
  assert.equal(resolveQuestLockTransitEncounterLevel(lock, 40), 1);
  assert.equal(resolveQuestLockTransitHullPlanetId(lock), 'arcadia_prime');

  const toward = towardAnchorLock('arcadia_prime');
  assert.equal(shouldGuaranteeQuestTransitEncounter(toward, 'arcadia'), true);
  assert.equal(shouldGuaranteeQuestTransitEncounter(toward, 'eternity'), false);
  const questSeedActive = shouldGuaranteeQuestTransitEncounter(toward, 'eternity');
  const encounterLevel = questSeedActive
    ? resolveQuestLockTransitEncounterLevel(toward, 40)
    : resolveTransitCombatEncounterTargetLevel('eternity', 40);
  assert.equal(encounterLevel, 40);
  assert.notEqual(encounterLevel, 1);
  const hullPlanetId = questSeedActive
    ? resolveQuestLockTransitHullPlanetId(toward)
    : 'eternal_throne';
  assert.equal(hullPlanetId, 'eternal_throne');
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

test('transit 락은 허브/웨이브 TCL 경로에 안 섞임 (venue 게이트)', () => {
  const lock = resolveQuestCombatLock(
    { mission_002: active('mission_002', { obj_002_a: false }) },
    'mission_002',
  );
  assert.equal(lock?.venue, 'transit');
  assert.equal(resolvePlanetTargetCombatLevel('draco_haven'), 9);
  assert.equal(resolveQuestLockTransitEncounterLevel(lock, 40), 1);
  assert.equal(resolveQuestLockTransitEncounterLevel(hubOrbitLock('draco_haven'), 40), null);
});

console.log('combatFourAxisPlaySim.test.ts — all PASS');
