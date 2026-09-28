/**
 * 총사령관 개인의뢰 목적지 — 첫 이동 튜토리얼(베가 1홉)과 겹치지 않게
 * 2홉 이상 타성계만 배정. 바 인스턴스·일반 함장 개인의뢰는 기존 1~3홉 유지.
 */
import { getGovernorReserveCommanderById } from '../game/planetGovernor/planetGovernorReservePool';

export const GOVERNOR_QUEST_MIN_HOPS = 2;

/** 아르카디아 첫 비행 튜토리얼 목적지 — 총사령관 의뢰에서 제외 */
export const GOVERNOR_QUEST_EXCLUDE_SYSTEM_IDS: readonly string[] = ['vega_outpost'];

export function isGovernorQuestOfferCaptain(captainId: string): boolean {
  return getGovernorReserveCommanderById(captainId.trim()) != null;
}
