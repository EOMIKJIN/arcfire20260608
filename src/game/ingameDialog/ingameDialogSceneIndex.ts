// ============================================================
// 인게임 대화 — CSV 트리거 O(1) 인덱스 (Table-First · 부트 1회)
// ============================================================

import { STORY_SCENES_FROM_CSV } from '../../data/generated/csvStoryScenes';
import type { StorySceneDef, StoryScenePageDef } from '../../types';

function triggerIndexKey(triggerKey: string, targetId: string | null): string {
  return `${triggerKey}\0${targetId ?? '*'}`;
}

export function filterIngameDialogPages(scene: StorySceneDef): StoryScenePageDef[] {
  return scene.pages.filter((page) => page.viewMode === 'ingame_dialog');
}

export function isIngameDialogScene(scene: StorySceneDef | undefined): scene is StorySceneDef {
  return Boolean(scene && filterIngameDialogPages(scene).length > 0);
}

const INGAME_SCENE_BY_ID: ReadonlyMap<string, StorySceneDef> = (() => {
  const map = new Map<string, StorySceneDef>();
  for (const scene of Object.values(STORY_SCENES_FROM_CSV)) {
    if (!isIngameDialogScene(scene)) continue;
    map.set(scene.id, scene);
  }
  return map;
})();

const TRIGGER_INDEX: ReadonlyMap<string, readonly StorySceneDef[]> = (() => {
  const bucket = new Map<string, StorySceneDef[]>();
  for (const scene of INGAME_SCENE_BY_ID.values()) {
    const key = triggerIndexKey(scene.triggerKey, scene.triggerTargetId);
    const arr = bucket.get(key) ?? [];
    arr.push(scene);
    bucket.set(key, arr);
  }
  return bucket;
})();

export function getIngameDialogSceneById(sceneId: string): StorySceneDef | null {
  return INGAME_SCENE_BY_ID.get(sceneId) ?? null;
}

export function listIngameDialogScenesForTrigger(
  triggerKey: string,
  targetId: string | null,
): readonly StorySceneDef[] {
  const exact = TRIGGER_INDEX.get(triggerIndexKey(triggerKey, targetId));
  if (exact && exact.length > 0) return exact;
  if (targetId != null) {
    return TRIGGER_INDEX.get(triggerIndexKey(triggerKey, null)) ?? [];
  }
  return [];
}

import { resolveArcCoreInstanceTemplateMissionId } from '../../missions/arcCoreInstanceMissionResolver';
import type { MissionClearNpcSceneKind } from '../../missions/resolveMissionClearNpcContext';

/**
 * 완료 대화 씬 선택 3단 우선순위:
 * 1. 미션별 맞춤 씬(`mission_clear_${missionId}`, 기존) — 항상 최우선
 * 2. 담당 NPC 배정 시 제네릭 담당자 씬(배달/도착)
 * 3. 오퍼레이터 기본(`mission_clear_default`, 기존 폴백)
 */
export function resolveMissionClearDialogSceneId(
  missionId: string,
  assignedClearNpcCaptainId?: string | null,
  npcSceneKind?: MissionClearNpcSceneKind,
): string | null {
  const templateId = resolveArcCoreInstanceTemplateMissionId(missionId) ?? missionId;
  const specific = `mission_clear_${templateId}`;
  if (INGAME_SCENE_BY_ID.has(specific)) return specific;
  if (assignedClearNpcCaptainId) {
    const npcSceneId = npcSceneKind === 'delivery' ? 'mission_clear_npc_delivery' : 'mission_clear_npc_arrival';
    if (INGAME_SCENE_BY_ID.has(npcSceneId)) return npcSceneId;
  }
  if (INGAME_SCENE_BY_ID.has('mission_clear_default')) return 'mission_clear_default';
  return null;
}
