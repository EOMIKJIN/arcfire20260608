import { pickTransitSpaceCdIndex } from './transitCombatParallaxPlan';

/** 150² 흰 연기(알파). Screen 전용 — 풀화면 cover 금지. */
export const TRANSIT_SPACE_CD_SOURCES = [
  require('../../assets/images/planet/space_cd01.png'),
  require('../../assets/images/planet/space_cd02.png'),
  require('../../assets/images/planet/space_cd03.png'),
] as const;

export function resolveTransitSpaceCdSource(destSystemId: string) {
  return TRANSIT_SPACE_CD_SOURCES[pickTransitSpaceCdIndex(destSystemId)]!;
}
