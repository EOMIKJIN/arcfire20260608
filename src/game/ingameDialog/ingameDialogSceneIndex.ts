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

export function resolveMissionClearDialogSceneId(missionId: string): string | null {
  const specific = `mission_clear_${missionId}`;
  if (INGAME_SCENE_BY_ID.has(specific)) return specific;
  if (INGAME_SCENE_BY_ID.has('mission_clear_default')) return 'mission_clear_default';
  return null;
}
