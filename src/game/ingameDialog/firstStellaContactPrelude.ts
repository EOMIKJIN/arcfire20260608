/** 착륙 직후 첫 스텔라 대사(`ingame_dialog_01`)만 연락 팝업을 앞에 둔다. */

export const FIRST_STELLA_LAND_DIALOG_SCENE_ID = 'ingame_dialog_01';

type LandSceneRef = {
  id: string;
  triggerRepeat: string;
};

export function isUnseenFirstStellaLandScene(
  scenes: readonly LandSceneRef[],
  seenSceneIds: readonly string[],
): boolean {
  for (let i = 0; i < scenes.length; i += 1) {
    const scene = scenes[i]!;
    if (scene.triggerRepeat === 'once' && seenSceneIds.includes(scene.id)) continue;
    return scene.id === FIRST_STELLA_LAND_DIALOG_SCENE_ID;
  }
  return false;
}
