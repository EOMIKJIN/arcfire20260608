// ============================================================
// 분쟁지역 하드 게이트 — 아군만 접한 후방·점유전투 OFF는 승격·판정 금지
// (2026-08-19) 아르카디아(occupationCombatEnabled=false)가 풀 min 땜빵으로
// 동적 편입된 뒤 NPC 자동전에 RED로 뒤집힌 회귀 차단.
// 순수 함수 — zustand/RN import 없음.
// ============================================================

import { isPlanetOccupationCombatEnabled } from '../balance/balanceTableRegistry';
import {
  resolveContestedEligibilityForSystem,
  type ContestedEligibilityClass,
  type ContestedHoldSide,
} from './contestedEligibility';
import { resolveCapitalDefenseContext } from './resolveCapitalDefenseContext';
import type { PlanetClanHold } from '../../types';

export type ContestedZoneHardGateReason =
  | 'occupation_combat_disabled'
  | 'safe_hinterland'
  | 'ineligible'
  | 'capital_ring_intact';

export type ContestedZoneHardGate = {
  blocked: boolean;
  reason: ContestedZoneHardGateReason | null;
  classification: ContestedEligibilityClass;
};

/**
 * 분쟁 로테이션·NPC 자동전 진입 여부.
 * 1) CSV occupationCombatEnabled=false — 시작 거점 등, 인접 전선처럼 보여도 금지
 * 2) safe_hinterland — 아군만 1홉 (적대 인접 0)
 * 3) ineligible — 전선/전략중립/독립국전선이 아님 (고립 포켓 포함)
 * 4) capital_ring_intact — 4대 항로 수도 + 아군 1홉 잔존(포위문 닫힘). NPC 자동전만 차단.
 */
export function resolveContestedZoneHardGate(input: {
  planetId: string;
  systemId: string;
  holdSide: ContestedHoldSide;
  holds: Readonly<Record<string, PlanetClanHold>>;
}): ContestedZoneHardGate {
  const classification = resolveContestedEligibilityForSystem({
    systemId: input.systemId,
    holdSide: input.holdSide,
    holds: input.holds,
  });
  if (!isPlanetOccupationCombatEnabled(input.planetId)) {
    return { blocked: true, reason: 'occupation_combat_disabled', classification };
  }
  if (classification === 'safe_hinterland') {
    return { blocked: true, reason: 'safe_hinterland', classification };
  }
  if (classification === 'ineligible') {
    return { blocked: true, reason: 'ineligible', classification };
  }
  const capital = resolveCapitalDefenseContext({
    planetId: input.planetId,
    systemId: input.systemId,
    holdSide: input.holdSide,
    holds: input.holds,
  });
  if (capital.mode === 'hold_defense') {
    return { blocked: true, reason: 'capital_ring_intact', classification };
  }
  return { blocked: false, reason: null, classification };
}
