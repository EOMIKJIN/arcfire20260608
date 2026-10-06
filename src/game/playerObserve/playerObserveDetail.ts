// emitPlayVerb detail 문자열 정본. 앱 방출 지점과 플레이봇이 같은 형식을 쓴다.
// 순수 함수만 — store·RN import 금지 (플레이봇이 Node 에서 import).

export type ObserveCombatVenue = 'wave' | 'hub_orbit' | 'transit';
export type ObserveQuestStep = 'accept' | 'objective' | 'complete';
export type ObserveDevelopStep = 'install' | 'upgrade';

export const playerObserveDetail = {
  quest: (step: ObserveQuestStep, id: string): string => `${step}:${id}`,
  combat: (venue: ObserveCombatVenue, outcome: string): string => `${venue}:${outcome}`,
  trade: (side: 'buy' | 'sell', planetId: string): string => `${side}:${planetId}`,
  develop: (step: ObserveDevelopStep, moduleId: string, planetId: string): string =>
    `${step}:${moduleId}:${planetId}`,
  mine: (planetId: string, goodId: string): string => `${planetId}:${goodId}`,
  land: (planetId: string): string => planetId,
  level: (level: number): string => String(level),
  ship: (shipId: string): string => shipId,
  skill: (skillId: string): string => skillId,
  annex: (planetId: string): string => planetId,
  equip: (slot: string, itemId: string): string => `${slot}:${itemId}`,
  /** G6 방출 전 형식 선확정. 사유만 — 위치는 lastLand. */
  destroy: (cause: string): string => cause,
} as const;
