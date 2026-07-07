import type { ArcCoreInstanceMissionCategoryTag } from './arcCoreInstanceMissionTypes';

/** 선술집 [신규 의뢰] — 행성당 ArcCore 인스턴스 최소·최대 listed 슬롯. */
export const TAVERN_INSTANCE_MIN_LISTED_PER_PLANET = 10;
export const TAVERN_INSTANCE_MAX_LISTED_PER_PLANET = 10;

/** 40% 배달 · 40% 전투(일반+현상금) · 20% 기타(항행·탐사·수리·발견). */
export const TAVERN_INSTANCE_CATEGORY_SLOTS = {
  delivery: 4,
  combat: 2,
  bounty: 2,
  other: 2,
} as const;

export type TavernInstanceBoardBucket = keyof typeof TAVERN_INSTANCE_CATEGORY_SLOTS;

/** ArcCore 카테고리 태그 → 보드 비율 버킷. */
export function resolveTavernInstanceBoardBucket(
  tag: ArcCoreInstanceMissionCategoryTag,
): TavernInstanceBoardBucket {
  if (tag === 'delivery') return 'delivery';
  if (tag === 'combat') return 'combat';
  if (tag === 'bounty') return 'bounty';
  return 'other';
}

/** listed 슬롯 합계(=10). */
export function tavernInstanceTotalListedSlots(): number {
  let sum = 0;
  for (const key of Object.keys(TAVERN_INSTANCE_CATEGORY_SLOTS) as TavernInstanceBoardBucket[]) {
    sum += TAVERN_INSTANCE_CATEGORY_SLOTS[key];
  }
  return sum;
}
