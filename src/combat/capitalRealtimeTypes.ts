/**
 * 실시간 전함 교전 — 스테이지·미션·이벤트 공용 타입.
 * 시뮬 본체는 `PlanetEdenRaidTestLayer`; 슬롯0/1은 통상 적(red)·아군(blue) 팀 스펙으로 전체 함선에 적용된다.
 * 교전 규약·살보 수 등은 `capitalCombatConventions.ts`, 함대 규모는 `npc/edenCapitalFleetConfig.ts`.
 */

import type { Agent, PlanetEdenRaidSim } from '../components/planet/PlanetEdenRaidTestLayer';

/** 공용 시뮬 핸들(타입 별칭 — 향후 구현 교체 시에도 import 경로만 유지) */
export type CapitalRealtimeCombatSim = PlanetEdenRaidSim;

/** 팀별 함선 외곽선·최대 HP(전투 진입 시 해당 팀 에이전트 전원에 패치) */
export type CapitalRealtimeEncounterSlot = Pick<Agent, 'team' | 'stroke' | 'maxHullHp'>;

export type CapitalRealtimeEncounterLayout = {
  slot0: CapitalRealtimeEncounterSlot;
  slot1: CapitalRealtimeEncounterSlot;
};
