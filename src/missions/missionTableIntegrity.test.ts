/**
 * Table-First 퀘스트 정본 정합 — generated 카탈로그가 런타임이 읽는 값.
 * npx tsx --test src/missions/missionTableIntegrity.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  ITEM_DEFS_FROM_CSV,
  MAIN_STORY_QUESTS_FROM_CSV,
  MISSIONS_FROM_CSV,
  MISSION_QUEST_COMBAT_OPS_FROM_CSV,
  MISSION_QUEST_PLACEMENTS_FROM_CSV,
  STAR_SYSTEMS_FROM_CSV,
} from '../data/generated';
import { CAPTAIN_PERSONAL_MISSION_TEMPLATES_FROM_CSV } from '../data/generated/csvCaptainPersonalMissions';
import { BAR_INSTANCE_TEMPLATE_PREFIX } from './missionTrack';

const OBJECTIVE_TYPES = new Set([
  'reach_system',
  'reach_planet',
  'defeat_enemy',
  'deliver_cargo',
  'buy_goods',
  'collect_item',
  'talk_npc',
]);

const CATALOG_PREFIXES = ['mission_', 'story_', 'sandbox_', 'tq_'] as const;

function isClonePlaceholder(targetId: string | undefined): boolean {
  if (!targetId) return false;
  return targetId.startsWith('__') && targetId.endsWith('__');
}

function allowedCatalogId(id: string): boolean {
  for (let i = 0; i < CATALOG_PREFIXES.length; i += 1) {
    if (id.startsWith(CATALOG_PREFIXES[i]!)) return true;
  }
  return false;
}

test('missions.csv generated — 키·목표·배치·전투 연동', () => {
  const errors: string[] = [];
  const missions = Object.values(MISSIONS_FROM_CSV);
  const objectiveOwner = new Map<string, string>();
  let tqCount = 0;

  if (!MISSIONS_FROM_CSV.story_001) {
    errors.push('story_001 누락');
  }
  if (!MISSIONS_FROM_CSV.mission_001) {
    errors.push('mission_001 누락');
  }

  for (let i = 0; i < missions.length; i += 1) {
    const mission = missions[i]!;
    if (MISSIONS_FROM_CSV[mission.id] !== mission) {
      errors.push(`키 불일치 ${mission.id}`);
    }
    if (!allowedCatalogId(mission.id)) {
      errors.push(`접두사 위반 ${mission.id}`);
    }
    if (!mission.title.trim()) {
      errors.push(`제목 없음 ${mission.id}`);
    }
    if (!mission.objectives.length) {
      errors.push(`목표 없음 ${mission.id}`);
    }
    if (mission.id.startsWith(BAR_INSTANCE_TEMPLATE_PREFIX)) tqCount += 1;
    const seenObj = new Set<string>();
    for (let j = 0; j < mission.objectives.length; j += 1) {
      const obj = mission.objectives[j]!;
      if (!obj.id || seenObj.has(obj.id)) {
        errors.push(`목표 id 중복/공백 ${mission.id}:${obj.id}`);
      }
      seenObj.add(obj.id);
      const prev = objectiveOwner.get(obj.id);
      if (prev && prev !== mission.id) {
        errors.push(`목표 id 교차 공유 ${obj.id} (${prev}, ${mission.id})`);
      }
      objectiveOwner.set(obj.id, mission.id);
      if (!OBJECTIVE_TYPES.has(obj.type)) {
        errors.push(`목표 타입 ${mission.id}:${obj.id}=${obj.type}`);
      }
      if (!obj.targetId?.trim()) {
        errors.push(`targetId 없음 ${mission.id}:${obj.id}`);
      }
      const placeholder = isClonePlaceholder(obj.targetId);
      if (
        obj.type === 'reach_system'
        && obj.targetId
        && !placeholder
        && !STAR_SYSTEMS_FROM_CSV[obj.targetId]
      ) {
        errors.push(`reach_system 성계 없음 ${mission.id}:${obj.targetId}`);
      }
      if (
        (obj.type === 'buy_goods' || obj.type === 'collect_item')
        && obj.targetId
        && !placeholder
        && !ITEM_DEFS_FROM_CSV[obj.targetId]
      ) {
        errors.push(`${obj.type} 품목 없음 ${mission.id}:${obj.targetId}`);
      }
    }
    for (let j = 0; j < mission.prerequisiteIds.length; j += 1) {
      const pre = mission.prerequisiteIds[j]!;
      if (pre && !MISSIONS_FROM_CSV[pre]) {
        errors.push(`선행 미션 없음 ${mission.id} → ${pre}`);
      }
    }
    if (mission.nextMissionId && !MISSIONS_FROM_CSV[mission.nextMissionId]) {
      errors.push(`다음 미션 없음 ${mission.id} → ${mission.nextMissionId}`);
    }
  }

  if (tqCount < 1) errors.push('tq_* 템플릿 없음');

  const placementIds = new Set<string>();
  for (let i = 0; i < MISSION_QUEST_PLACEMENTS_FROM_CSV.length; i += 1) {
    const row = MISSION_QUEST_PLACEMENTS_FROM_CSV[i]!;
    if (placementIds.has(row.id)) errors.push(`placement id 중복 ${row.id}`);
    placementIds.add(row.id);
    if (!objectiveOwner.has(row.objectiveId)) {
      errors.push(`placement 목표 없음 ${row.id}:${row.objectiveId}`);
    }
  }
  const combatIds = new Set<string>();
  for (let i = 0; i < MISSION_QUEST_COMBAT_OPS_FROM_CSV.length; i += 1) {
    const row = MISSION_QUEST_COMBAT_OPS_FROM_CSV[i]!;
    if (combatIds.has(row.id)) errors.push(`combat-op id 중복 ${row.id}`);
    combatIds.add(row.id);
    if (!objectiveOwner.has(row.objectiveId)) {
      errors.push(`combat-op 목표 없음 ${row.id}:${row.objectiveId}`);
    }
  }

  for (const [objId, missionId] of objectiveOwner) {
    if (missionId.startsWith(BAR_INSTANCE_TEMPLATE_PREFIX)) continue;
    const mission = MISSIONS_FROM_CSV[missionId];
    const obj = mission?.objectives.find((o) => o.id === objId);
    if (obj?.type === 'buy_goods') {
      const hit = MISSION_QUEST_PLACEMENTS_FROM_CSV.some((p) => p.objectiveId === objId);
      if (!hit) errors.push(`buy_goods placement 없음 ${missionId}:${objId}`);
    }
    if (obj?.type === 'defeat_enemy') {
      const hit = MISSION_QUEST_COMBAT_OPS_FROM_CSV.some((p) => p.objectiveId === objId);
      if (!hit) errors.push(`defeat_enemy combat-op 없음 ${missionId}:${objId}`);
    }
  }

  const ready = MAIN_STORY_QUESTS_FROM_CSV.filter((q) => q.contentStatus === 'ready');
  if (ready.length < 1) errors.push('ready 메인스토리 퀘스트 없음');
  for (let i = 0; i < ready.length; i += 1) {
    const bind = ready[i]!.bindMissionId;
    if (!bind || !MISSIONS_FROM_CSV[bind]) {
      errors.push(`ready 메인스토리 bind 없음 ${ready[i]!.questId} → ${bind}`);
    }
  }

  const cpIds = new Set<string>();
  for (let i = 0; i < CAPTAIN_PERSONAL_MISSION_TEMPLATES_FROM_CSV.length; i += 1) {
    const row = CAPTAIN_PERSONAL_MISSION_TEMPLATES_FROM_CSV[i]!;
    if (!row.id.startsWith('cp_')) errors.push(`cp 접두사 위반 ${row.id}`);
    if (cpIds.has(row.id)) errors.push(`cp id 중복 ${row.id}`);
    cpIds.add(row.id);
    if (!OBJECTIVE_TYPES.has(row.objectiveType)) {
      errors.push(`cp 목표 타입 ${row.id}=${row.objectiveType}`);
    }
  }
  if (cpIds.size < 1) errors.push('cp 템플릿 없음');

  const CORE_PLANET_RE = /^(arcadia_prime|vega_base|sirius_border|omega_hub|crimson_base|shadow_market|dark_haven|solar_station)$/;
  const FRONTIER_SIDE_QUESTS: { id: string; objectiveCount: number }[] = [
    { id: 'sandbox_034', objectiveCount: 5 },
    { id: 'sandbox_035', objectiveCount: 5 },
    { id: 'sandbox_036', objectiveCount: 4 },
    { id: 'sandbox_037', objectiveCount: 4 },
    { id: 'sandbox_038', objectiveCount: 4 },
  ];
  for (let n = 39; n <= 55; n += 1) {
    const stale = `sandbox_0${n}`;
    if (MISSIONS_FROM_CSV[stale]) {
      errors.push(`세부미션을 개별 퀘스트로 잔존 ${stale}`);
    }
  }
  for (let i = 0; i < FRONTIER_SIDE_QUESTS.length; i += 1) {
    const spec = FRONTIER_SIDE_QUESTS[i]!;
    const id = spec.id;
    const mission = MISSIONS_FROM_CSV[id];
    if (!mission) {
      errors.push(`프론티어 서브 누락 ${id}`);
      continue;
    }
    if (mission.objectives.length !== spec.objectiveCount) {
      errors.push(`프론티어 세부미션 수 ${id}=${mission.objectives.length} (기대 ${spec.objectiveCount})`);
    }
    if (mission.nextMissionId) {
      errors.push(`프론티어 부모는 nextMissionId 금지 ${id}→${mission.nextMissionId}`);
    }
    const offerPlanet = String(mission.offerPlanetId ?? '').trim();
    if (!offerPlanet) {
      errors.push(`프론티어 수락 행성 없음 ${id}`);
    } else {
      if (!offerPlanet.startsWith('synth_') || !offerPlanet.endsWith('_p')) {
        errors.push(`프론티어 수락 행성 위반 ${id}=${offerPlanet}`);
      }
      if (CORE_PLANET_RE.test(offerPlanet)) {
        errors.push(`프론티어 수락이 코어 21 ${id}=${offerPlanet}`);
      }
    }
    for (let j = 0; j < mission.objectives.length; j += 1) {
      const obj = mission.objectives[j]!;
      if (obj.type === 'reach_planet') {
        if (!obj.targetId.startsWith('synth_') || !obj.targetId.endsWith('_p')) {
          errors.push(`프론티어 도착 행성 위반 ${id}:${obj.id}=${obj.targetId}`);
        }
      }
      if (obj.type === 'talk_npc') {
        const sep = obj.targetId.indexOf('|');
        const planetPart = sep >= 0 ? obj.targetId.slice(sep + 1).trim() : '';
        if (!planetPart.startsWith('synth_') || !planetPart.endsWith('_p')) {
          errors.push(`프론티어 탐문 행성 위반 ${id}:${obj.id}=${obj.targetId}`);
        }
      }
    }
  }

  assert.equal(errors.length, 0, errors.join('\n'));
});
