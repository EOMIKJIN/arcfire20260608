/** 플레이어 플래그 배열 상한 — persist/hydrate 계단 상승 차단 */
export const SEEN_STORY_SCENE_IDS_MAX = 96;
export const ACKNOWLEDGED_HUB_DIALOG_KEYS_MAX = 64;

export function capBoundedStringList(list: readonly string[], max: number): string[] {
  if (list.length <= max) return list as string[];
  return list.slice(list.length - max);
}
