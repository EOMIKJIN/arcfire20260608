// ============================================================
// 분쟁지역 총사령관 [전투전술영향] 역전 판정 (대표님 승인 2026-07-19)
//
// - 전투 승패가 1차 확정된 뒤, 패배 진영 총사령관이 전술 등급 우위만큼
//   1회 재판정으로 결과를 뒤집을 수 있다.
// - 역전 확률 = clamp((패자 등급 − 승자 등급) × 2, 0, 20)%  (등급 -5..+5)
// - 총사령관 전용 능력 — NEUTRAL(총사령관 없음)은 역전 불가.
// - 성계 상주 슬롯(RED/BLUE 각 1명 영구)은 최초 분쟁 시점에 배정된다.
// ============================================================

import {
  ensurePlanetGovernorSideSlotCaptain,
} from '../../game/planetGovernor/planetGovernorAssignmentStore';
import { getGovernorReserveCommanderById } from '../../game/planetGovernor/planetGovernorReservePool';

export type TacticsReversalSide = 'BLUE' | 'RED' | 'NEUTRAL';

export type TacticsReversalOutcome = {
  reversed: boolean;
  reversalChancePct: number;
  winnerCaptainId: string | null;
  loserCaptainId: string | null;
  winnerGrade: number;
  loserGrade: number;
};

const REVERSAL_PCT_PER_GRADE = 2;
const REVERSAL_PCT_MAX = 20;

function clampGrade(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-5, Math.min(5, Math.round(value)));
}

/** 성계 슬롯 총사령관의 전술 등급 조회(최초 분쟁이면 슬롯 배정 포함). NEUTRAL → 총사령관 없음 */
function resolveSideCommander(
  planetId: string,
  side: TacticsReversalSide,
): { captainId: string; grade: number } | null {
  if (side !== 'BLUE' && side !== 'RED') return null;
  const captainId = ensurePlanetGovernorSideSlotCaptain(planetId, side);
  if (!captainId) return null;
  const row = getGovernorReserveCommanderById(captainId);
  return { captainId, grade: clampGrade(row?.combatTacticsGrade ?? 0) };
}

/**
 * 1차 승패 확정 후 1회 역전 재판정.
 * 패자 총사령관이 없거나(중립) 등급 우위가 없으면 역전 없음.
 */
export function resolveGovernorTacticsReversal(input: {
  planetId: string;
  winnerSide: TacticsReversalSide;
  loserSide: TacticsReversalSide;
  random?: () => number;
}): TacticsReversalOutcome {
  const { planetId, winnerSide, loserSide } = input;
  const random = input.random ?? Math.random;

  const winner = resolveSideCommander(planetId, winnerSide);
  const loser = resolveSideCommander(planetId, loserSide);

  const base: TacticsReversalOutcome = {
    reversed: false,
    reversalChancePct: 0,
    winnerCaptainId: winner?.captainId ?? null,
    loserCaptainId: loser?.captainId ?? null,
    winnerGrade: winner?.grade ?? 0,
    loserGrade: loser?.grade ?? 0,
  };

  // 총사령관 전용 능력 — 패자 측에 총사령관이 없으면(중립 등) 역전 불가
  if (!loser) return base;

  const chancePct = Math.max(
    0,
    Math.min(REVERSAL_PCT_MAX, (loser.grade - (winner?.grade ?? 0)) * REVERSAL_PCT_PER_GRADE),
  );
  if (chancePct <= 0) return { ...base, reversalChancePct: 0 };

  return {
    ...base,
    reversalChancePct: chancePct,
    reversed: random() * 100 < chancePct,
  };
}
