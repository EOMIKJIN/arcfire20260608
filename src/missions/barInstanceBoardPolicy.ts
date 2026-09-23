import type { ArcCoreInstanceMissionCategoryTag } from './arcCoreInstanceMissionTypes';

/** 바 [신규 의뢰] — 행성당 최소 listed (CSV 바·돔 L1~4). */
export const BAR_INSTANCE_MIN_LISTED_PER_PLANET = 10;
/** PSS 상한 — 돔 L15. 35칸 화장 바운티를 의뢰로 복제하지 않는다. */
export const BAR_INSTANCE_MAX_LISTED_PER_PLANET = 16;

/** L1 기준 40% 배달 · 40% 전투(일반+현상금) · 20% 기타. */
export const BAR_INSTANCE_CATEGORY_SLOTS = {
  delivery: 4,
  combat: 2,
  bounty: 2,
  other: 2,
} as const;

export type BarInstanceBoardBucket = keyof typeof BAR_INSTANCE_CATEGORY_SLOTS;

export type BarInstanceCategorySlotCounts = Record<BarInstanceBoardBucket, number>;

export type BarInstanceBoardLayout = {
  level: number;
  maxListed: number;
  slots: BarInstanceCategorySlotCounts;
};

/** ArcCore 카테고리 태그 → 보드 비율 버킷. */
export function resolveBarInstanceBoardBucket(
  tag: ArcCoreInstanceMissionCategoryTag,
): BarInstanceBoardBucket {
  if (tag === 'delivery') return 'delivery';
  if (tag === 'combat') return 'combat';
  if (tag === 'bounty') return 'bounty';
  return 'other';
}

/** listed 슬롯 합계 — 레벨 무관 L1 기준(10). */
export function barInstanceTotalListedSlots(): number {
  let sum = 0;
  for (const key of Object.keys(BAR_INSTANCE_CATEGORY_SLOTS) as BarInstanceBoardBucket[]) {
    sum += BAR_INSTANCE_CATEGORY_SLOTS[key];
  }
  return sum;
}

/**
 * 돔 레벨 → 신규 의뢰 listed 상한.
 * L1~4=10 · L5~8=12 · L9~14=14 · L15=16
 */
export function resolveBarInstanceListedCap(domeLevel: number): number {
  const lv = Math.max(0, Math.floor(Number(domeLevel) || 0));
  if (lv >= 15) return 16;
  if (lv >= 9) return 14;
  if (lv >= 5) return 12;
  return BAR_INSTANCE_MIN_LISTED_PER_PLANET;
}

/**
 * 추가 칸은 현상금·전투에 우선 배분 (L5/L9 희귀 가중).
 * L1: 4/2/2/2 · L5: 4/3/3/2 · L9: 5/3/4/2 · L15: 5/4/5/2
 */
export function resolveBarInstanceCategorySlotsForLevel(
  domeLevel: number,
): BarInstanceCategorySlotCounts {
  const cap = resolveBarInstanceListedCap(domeLevel);
  if (cap >= 16) {
    return { delivery: 5, combat: 4, bounty: 5, other: 2 };
  }
  if (cap >= 14) {
    return { delivery: 5, combat: 3, bounty: 4, other: 2 };
  }
  if (cap >= 12) {
    return { delivery: 4, combat: 3, bounty: 3, other: 2 };
  }
  return { delivery: 4, combat: 2, bounty: 2, other: 2 };
}

/** L5+ 전투·현상금 템플릿을 상위 DC 쪽으로 좁힌다. */
export function shouldBiasHarderBarInstanceTemplates(
  domeLevel: number,
  bucket: BarInstanceBoardBucket,
): boolean {
  if (domeLevel < 5) return false;
  return bucket === 'bounty' || bucket === 'combat';
}

export function resolveBarInstanceHarderTemplateCutRatio(domeLevel: number): number {
  return domeLevel >= 9 ? 0.4 : 0.55;
}
