import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { MissionProgress } from '../types';
import {
  canCompleteQuestDefeatEnemy,
  isQuestHubOrbitLockAtPlanet,
  resolveQuestCombatLock,
  shouldGuaranteeQuestTransitEncounter,
} from './questCombatLock';

function active(
  missionId: string,
  objectives: Record<string, boolean>,
): MissionProgress {
  return { missionId, status: 'active', objectives };
}

test('핀 전투 미션이 락을 잡는다', () => {
  const lock = resolveQuestCombatLock(
    {
      mission_002: active('mission_002', { obj_002_a: false }),
      sandbox_013: active('sandbox_013', { obj_s013_a: false }),
    },
    'sandbox_013',
  );
  assert.equal(lock?.missionId, 'sandbox_013');
  assert.equal(lock?.venue, 'transit');
  assert.equal(lock?.encounterPolicy, 'transit_guaranteed');
  assert.equal(lock?.templateId, 'pirate_cruiser');
  assert.equal(lock?.anchorPlanetId, 'draco_haven');
});

test('핀이 없으면 tutorial 이 sandbox 보다 앞선다', () => {
  const lock = resolveQuestCombatLock(
    {
      sandbox_001: active('sandbox_001', { obj_s001_a: false }),
      mission_002: active('mission_002', { obj_002_a: false }),
    },
    null,
  );
  assert.equal(lock?.missionId, 'mission_002');
  assert.equal(lock?.templateId, 'pirate_fighter');
  assert.equal(lock?.anchorPlanetId, 'arcadia_prime');
});

test('완료된 목표는 락을 만들지 않는다', () => {
  const lock = resolveQuestCombatLock(
    { mission_002: active('mission_002', { obj_002_a: true }) },
    'mission_002',
  );
  assert.equal(lock, null);
});

test('transit_guaranteed 는 목적지와 무관하게 보장', () => {
  const lock = resolveQuestCombatLock(
    { mission_002: active('mission_002', { obj_002_a: false }) },
    'mission_002',
  );
  assert.equal(shouldGuaranteeQuestTransitEncounter(lock, 'nightfall'), true);
  assert.equal(shouldGuaranteeQuestTransitEncounter(lock, 'arcadia'), true);
});

test('클리어는 베뉴+템플릿이 맞을 때만', () => {
  const lock = resolveQuestCombatLock(
    { mission_002: active('mission_002', { obj_002_a: false }) },
    'mission_002',
  );
  assert.equal(
    canCompleteQuestDefeatEnemy(lock, { venue: 'transit', enemyTemplateId: 'pirate_fighter' }),
    true,
  );
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
    canCompleteQuestDefeatEnemy(lock, { venue: 'transit', enemyTemplateId: 'pirate_cruiser' }),
    false,
  );
});

test('transit_toward_anchor 는 앵커 성계 홉만 보장', () => {
  const lock = {
    missionId: 'x',
    objectiveId: 'y',
    templateId: 'pirate_fighter',
    venue: 'transit' as const,
    encounterPolicy: 'transit_toward_anchor' as const,
    anchorPlanetId: 'arcadia_prime',
  };
  assert.equal(shouldGuaranteeQuestTransitEncounter(lock, 'arcadia'), true);
  assert.equal(shouldGuaranteeQuestTransitEncounter(lock, 'nightfall'), false);
  assert.equal(shouldGuaranteeQuestTransitEncounter(lock, null), false);
});

test('행성 id 만으로는 항로 퀘스트를 끝내지 못한다', () => {
  const lock = resolveQuestCombatLock(
    { sandbox_013: active('sandbox_013', { obj_s013_a: false }) },
    'sandbox_013',
  );
  assert.equal(
    canCompleteQuestDefeatEnemy(lock, { venue: 'hub_orbit', planetId: 'draco_haven' }),
    false,
  );
  assert.equal(isQuestHubOrbitLockAtPlanet(lock, 'draco_haven'), false);
});
