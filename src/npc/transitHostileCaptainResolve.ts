// ============================================================
// 이동중 전투 적 함장 — 목적지 성계 `npc_cpt_enemy_*` + 적대 조직
// 시드 1회 조회 전용(틱/렌더 금지). 전용적 인덱스 모듈 1회.
// ============================================================

import {
  resolvePlanetIdForCombatLevel,
} from '../combat/transitHopDangerPolicy';
import {
  resolveTransitHopCaptainForSystem,
  resolveTransitHopCombatLevelForSystem,
} from '../combat/transitHopCombatLevel';
import type { NpcCaptain } from '../types';

/**
 * 홉 레벨 범위 안 전용적 → 같은 범위의 전 성계 전용적 → CSV 폴백 → 레벨 최근접.
 * 출항 때 발급한 번호로 시드·전투가 같은 함장을 고른다.
 */
export function resolveTransitHostileCaptainForSystem(
  systemId: string | null,
): NpcCaptain | undefined {
  return resolveTransitHopCaptainForSystem(systemId);
}

/** 이번 성계에서 고른 함장 레벨을 홉 대역에 맞춘 전투 레벨. 무기·선체 공통. */
export function resolveTransitHostileCombatLevelForSystem(
  systemId: string | null,
): number {
  return resolveTransitHopCombatLevelForSystem(systemId);
}

/** @deprecated `resolveTransitHostileCaptainForSystem` — 호환 별칭 */
export function resolveTransitPirateCaptainForSystem(
  systemId: string | null,
): NpcCaptain | undefined {
  return resolveTransitHostileCaptainForSystem(systemId);
}

export function resolveTransitHostileHullScalePlanetId(
  combatSystemId: string | null,
  _captainId: string | null,
): string {
  const level = resolveTransitHostileCombatLevelForSystem(combatSystemId);
  return resolvePlanetIdForCombatLevel(level);
}

export {
  pickTransitHostileCaptain,
  resolveTransitHostileHullScalePlanetIdForCaptain,
  captainBelongsToTransitSystem,
} from './pickTransitHostileCaptain';
export type { TransitHostileCaptainPickOpts } from './pickTransitHostileCaptain';
