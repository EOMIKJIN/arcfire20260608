/**
 * 퀘스트 유물 효과 — v1 no-op. 추후 quest_relic_effects.csv 만 채운다.
 */

export type QuestRelicEffect = {
  effectId: string;
  itemId: string;
};

export function resolveQuestRelicEffect(_itemId: string): QuestRelicEffect | null {
  return null;
}

export function onQuestRelicAcquired(_itemId: string): void {
  resolveQuestRelicEffect(_itemId);
}

/** 회수·포기 시 효과 해제 자리. v1 no-op. */
export function onQuestRelicLost(_itemId: string): void {
  resolveQuestRelicEffect(_itemId);
}
