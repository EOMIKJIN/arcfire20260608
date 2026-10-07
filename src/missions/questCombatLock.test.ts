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
  assert.equal(lock?.venue, 'hub_orbit');
  assert.equal(lock?.encounterPolicy, 'hub_orbit');
  assert.equal(lock?.templateId, 'pirate_cruiser');
  assert.equal(lock?.anchorPlanetId, 'titan_ruins');
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

test('관문흔적추적과 해적소탕은 앵커·템플릿이 갈린다', () => {
  const trail = resolveQuestCombatLock(
    { sandbox_001: active('sandbox_001', { obj_s001_a: false }) },
    'sandbox_001',
  );
  const sweep = resolveQuestCombatLock(
    { mission_002: active('mission_002', { obj_002_a: false }) },
    'mission_002',
  );
  assert.equal(trail?.venue, 'hub_orbit');
  assert.equal(trail?.anchorPlanetId, 'solar_station');
  assert.equal(trail?.templateId, 'gate_scout');
  assert.equal(sweep?.venue, 'hub_orbit');
  assert.equal(sweep?.anchorPlanetId, 'arcadia_prime');
  assert.equal(sweep?.templateId, 'pirate_fighter');
  assert.notEqual(trail?.anchorPlanetId, sweep?.anchorPlanetId);
  assert.notEqual(trail?.templateId, sweep?.templateId);
  assert.equal(
    canCompleteQuestDefeatEnemy(trail, {
      venue: 'transit',
      enemyTemplateId: 'gate_scout',
    }),
    false,
  );
  assert.equal(
    canCompleteQuestDefeatEnemy(sweep, {
      venue: 'transit',
      enemyTemplateId: 'pirate_fighter',
    }),
    false,
  );
});

test('완료된 목표는 락을 만들지 않는다', () => {
  const lock = resolveQuestCombatLock(
    { mission_002: active('mission_002', { obj_002_a: true }) },
    'mission_002',
  );
  assert.equal(lock, null);
});

test('앵커 허브 퀘스트는 항로 보장을 켜지 않는다', () => {
  const lock = resolveQuestCombatLock(
    { mission_002: active('mission_002', { obj_002_a: false }) },
    'mission_002',
  );
  assert.equal(lock?.venue, 'hub_orbit');
  assert.equal(shouldGuaranteeQuestTransitEncounter(lock, 'nightfall'), false);
  assert.equal(shouldGuaranteeQuestTransitEncounter(lock, 'arcadia'), false);
});

test('앵커 없는 tq 템플릿은 궤도 일반전투 · 항로 보장 없음', () => {
  const lock = resolveQuestCombatLock(
    { tq_cbt_01: active('tq_cbt_01', { obj_tq_c01_a: false }) },
    'tq_cbt_01',
  );
  assert.equal(lock?.venue, 'hub_orbit');
  assert.equal(lock?.encounterPolicy, 'hub_orbit');
  assert.equal(lock?.anchorPlanetId, null);
  assert.equal(shouldGuaranteeQuestTransitEncounter(lock, 'nightfall'), false);
  assert.equal(shouldGuaranteeQuestTransitEncounter(lock, 'arcadia'), false);
});

test('클리어는 베뉴+템플릿이 맞을 때만', () => {
  const lock = resolveQuestCombatLock(
    { mission_002: active('mission_002', { obj_002_a: false }) },
    'mission_002',
  );
  assert.equal(
    canCompleteQuestDefeatEnemy(lock, { venue: 'transit', enemyTemplateId: 'pirate_fighter' }),
    false,
  );
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
    canCompleteQuestDefeatEnemy(lock, {
      venue: 'hub_orbit',
      enemyTemplateId: 'pirate_cruiser',
      planetId: 'arcadia_prime',
    }),
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

test('아이언 잔해 사냥은 레므난트 궤도에만 잠긴다', () => {
  const lock = resolveQuestCombatLock(
    { sandbox_011: active('sandbox_011', { obj_s011_a: false }) },
    'sandbox_011',
  );
  assert.equal(lock?.venue, 'hub_orbit');
  assert.equal(lock?.anchorPlanetId, 'iron_remnant');
  assert.equal(isQuestHubOrbitLockAtPlanet(lock, 'iron_remnant'), true);
  assert.equal(isQuestHubOrbitLockAtPlanet(lock, 'eden_city'), false);
});

test('행성 id 만으로는 퀘스트를 끝내지 못한다', () => {
  const lock = resolveQuestCombatLock(
    { sandbox_013: active('sandbox_013', { obj_s013_a: false }) },
    'sandbox_013',
  );
  assert.equal(
    canCompleteQuestDefeatEnemy(lock, { venue: 'hub_orbit', planetId: 'titan_ruins' }),
    false,
  );
  assert.equal(isQuestHubOrbitLockAtPlanet(lock, 'titan_ruins'), true);
  assert.equal(isQuestHubOrbitLockAtPlanet(lock, 'draco_haven'), false);
  assert.equal(isQuestHubOrbitLockAtPlanet(lock, 'arcadia_prime'), false);
});

test('미네르바 본편은 지금 세부미션이 격파일 때만 드록 한을 연다', () => {
  const beforeBar = resolveQuestCombatLock(
    {
      story_002: active('story_002', {
        obj_story_002_a: true,
        obj_story_002_b: false,
      }),
    },
    'story_002',
  );
  assert.equal(beforeBar, null);
  const onEscort = resolveQuestCombatLock(
    {
      story_002: active('story_002', {
        obj_story_002_a: true,
        obj_story_002_b: true,
        obj_story_002_c: false,
      }),
    },
    'story_002',
  );
  assert.equal(onEscort?.objectiveId, 'obj_story_002_c');
  assert.equal(onEscort?.venue, 'hub_orbit');
  assert.equal(onEscort?.anchorPlanetId, 'minerva_deep');
  assert.equal(isQuestHubOrbitLockAtPlanet(onEscort, 'minerva_deep'), true);
});

test('미네르바 샌드박스 전투는 본편 밀수조와 앵커가 갈린다', () => {
  const story = resolveQuestCombatLock(
    {
      story_002: active('story_002', {
        obj_story_002_a: true,
        obj_story_002_b: true,
        obj_story_002_c: false,
      }),
    },
    'story_002',
  );
  const mine = resolveQuestCombatLock(
    { sandbox_005: active('sandbox_005', { obj_s005_a: false }) },
    'sandbox_005',
  );
  const convoy = resolveQuestCombatLock(
    { sandbox_032: active('sandbox_032', { obj_s032_a: false }) },
    'sandbox_032',
  );
  assert.equal(story?.anchorPlanetId, 'minerva_deep');
  assert.equal(story?.templateId, 'pirate_fighter');
  assert.equal(mine?.anchorPlanetId, 'iron_remnant');
  assert.equal(convoy?.anchorPlanetId, 'helios_core');
  assert.notEqual(mine?.anchorPlanetId, story?.anchorPlanetId);
  assert.notEqual(convoy?.anchorPlanetId, story?.anchorPlanetId);
  assert.notEqual(mine?.anchorPlanetId, convoy?.anchorPlanetId);
});

test('베가·드라코 샌드박스 전투는 본편 앵커와 갈린다', () => {
  const vegaStory = resolveQuestCombatLock(
    { story_004: active('story_004', { obj_story_004_a: false }) },
    'story_004',
  );
  const vegaSandbox = resolveQuestCombatLock(
    { sandbox_007: active('sandbox_007', { obj_s007_a: false }) },
    'sandbox_007',
  );
  const dracoStory = resolveQuestCombatLock(
    { story_006: active('story_006', { obj_story_006_a: false }) },
    'story_006',
  );
  const dracoSandbox = resolveQuestCombatLock(
    { sandbox_013: active('sandbox_013', { obj_s013_a: false }) },
    'sandbox_013',
  );
  assert.equal(vegaStory?.anchorPlanetId, 'vega_base');
  assert.equal(vegaSandbox?.anchorPlanetId, 'eden_city');
  assert.equal(dracoStory?.anchorPlanetId, 'draco_haven');
  assert.equal(dracoSandbox?.anchorPlanetId, 'titan_ruins');
});
