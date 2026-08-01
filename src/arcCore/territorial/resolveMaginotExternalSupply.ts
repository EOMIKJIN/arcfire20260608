// ============================================================
// 마지노선(N≤5 HARD) · 외부팩션(F2 남부·F4 북부) 국가보급 — 대표님 정본(2026-08-01)
// N = 21코어 시나리오 성계(planet_occupation_seeds, synth 제외) 중 BLUE/RED 각각 점유 수.
// N<=5(floorSystems) → HARD(마지노선 붕괴 직전) · N>=10(paritySystems) → COOL(대등, 외부보급 감쇠) ·
// 그 사이 → SUPPORT(수복 추진). 블루·레드 대칭 — 각자 자기 N으로 독립 평가.
// HARD 전선 수복(약세 팩션이 적 홀드를 칠 때) 최종 점유 확률 ≥80%를 기존 binary-dominance 메커니즘
// (resolveBinaryDominantHoldTarget, envelope task에서 이미 검증된 경로) 재사용으로 보장한다.
// 순수 함수 — zustand/RN import 없음(tsx --test 호환). 행성 식별자를 입력받지 않음(구조적 하드코딩 불가).
// ============================================================

import { PlanetOccupationSeeds_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { resolveHoldFactionSide } from './territorialFactionSide';
import type { PlanetClanHold } from '../../types';

/** 21코어 시나리오 성계 대표 planetId(occupation seed CSV, synth 제외) — M1 */
export function listScenarioCorePlanetIds(): string[] {
  const out: string[] = [];
  for (const row of PlanetOccupationSeeds_FROM_BALANCE_CSV) {
    const planetId = String(row.planetId ?? '').trim();
    const systemId = String(row.systemId ?? '').trim();
    if (!planetId || !systemId || systemId.startsWith('synth_')) continue;
    out.push(planetId);
  }
  return out;
}

/** 21코어 중 side가 점유한 성계 수(N) — 독립국·순수 NEUTRAL은 어느 쪽에도 안 잡힘 — M1 */
export function countFactionSystemsInCore(
  holds: Readonly<Record<string, PlanetClanHold>>,
  side: 'BLUE' | 'RED',
): number {
  let count = 0;
  for (const planetId of listScenarioCorePlanetIds()) {
    if (resolveHoldFactionSide(holds[planetId]?.occupierClanId) === side) count += 1;
  }
  return count;
}

export type MaginotBand = 'hard' | 'support' | 'cool';

/** N ≤ floorSystems → hard · N ≥ paritySystems → cool · 그 사이 → support — M2 */
export function resolveMaginotBand(input: {
  n: number;
  floorSystems: number;
  paritySystems: number;
}): MaginotBand {
  const { n, floorSystems, paritySystems } = input;
  if (n <= floorSystems) return 'hard';
  if (n >= paritySystems) return 'cool';
  return 'support';
}

export type MaginotReclaimDecision = {
  /** true면 호출측이 effectiveCombatMode를 (약세 팩션)_neutral로 강제하고 dominantSideWeightPct를
   *  hardFinalOccupyPct로 오버라이드해야 함(기존 binary-dominance 경로 재사용) */
  forceHardReclaim: boolean;
  /** forceHardReclaim=true일 때 적용할 최종 점유 확률(%) */
  hardFinalOccupyPct: number;
  /** SUPPORT일 때만 0 초과 — rollDecision battle 가중 가산치(HARD/COOL은 0) */
  supportBattleWeightBoostPct: number;
};

/**
 * 반대 팩션(현재 hold 보유측)에 대한 **opposingSide**(잠재적 수복측)의 밴드·보급선으로 판정.
 * holdSide가 NEUTRAL인 경우는 호출측이 이 함수를 부르지 않음(수복 개념 아님 — envelope/P0 담당).
 * 보급선(minAdjacentFriendlyForReclaim) 미충족이면 밴드와 무관하게 보정 없음(원정 불가 물리학 유지).
 */
export function resolveMaginotReclaimDecision(input: {
  opposingSideBand: MaginotBand;
  opposingSideAdjacentFriendlyCount: number;
  minAdjacentFriendlyForReclaim: number;
  hardFinalOccupyPct: number;
  supportBattleWeightBoostPct: number;
}): MaginotReclaimDecision {
  const {
    opposingSideBand,
    opposingSideAdjacentFriendlyCount,
    minAdjacentFriendlyForReclaim,
    hardFinalOccupyPct,
    supportBattleWeightBoostPct,
  } = input;

  const hasSupplyLine = opposingSideAdjacentFriendlyCount >= minAdjacentFriendlyForReclaim;
  if (!hasSupplyLine || opposingSideBand === 'cool') {
    return { forceHardReclaim: false, hardFinalOccupyPct, supportBattleWeightBoostPct: 0 };
  }
  if (opposingSideBand === 'hard') {
    return { forceHardReclaim: true, hardFinalOccupyPct, supportBattleWeightBoostPct: 0 };
  }
  return { forceHardReclaim: false, hardFinalOccupyPct, supportBattleWeightBoostPct };
}
