// ============================================================
// 분쟁 최종 판정 검증 — 확연한 비논리만 교정 (가중 중첩 금지)
// R1 로컬 완승 고정 · R2 은하열세+로컬열세의 점유 이전 거부
// 마지노선 HARD·플레이어 웨이브·2자 접전 주사위는 호출측에서 제외
// ============================================================

import type { FactionPowerKpiCompact } from './factionPowerTypes';

export const TERRITORIAL_BLOWOUT_RATIO = 1.5;

export type TerritorialBlowoutLock = {
  winner: 'attacker' | 'defender';
  locked: boolean;
};

function warSide(raw: string): 'BLUE' | 'RED' | null {
  const s = String(raw ?? '').trim().toUpperCase();
  if (s === 'BLUE') return 'BLUE';
  if (s === 'RED') return 'RED';
  return null;
}

function galaxyScore(kpi: FactionPowerKpiCompact): number {
  let score = 0;
  if (kpi.bluePlanets !== kpi.redPlanets) score += kpi.bluePlanets > kpi.redPlanets ? 1 : -1;
  if (kpi.bluePgp !== kpi.redPgp) score += kpi.bluePgp > kpi.redPgp ? 1 : -1;
  if (kpi.blueFleet !== kpi.redFleet) score += kpi.blueFleet > kpi.redFleet ? 1 : -1;
  return score;
}

/** R1 — 함대 비가 확연하면 잡음·전술 역전으로 승패를 뒤집지 않음 */
export function resolveTerritorialLocalBlowoutWinner(input: {
  attackerPower: number;
  defenderPower: number;
  rolledWinner: 'attacker' | 'defender';
}): TerritorialBlowoutLock {
  const atk = Number.isFinite(input.attackerPower) ? input.attackerPower : 0;
  const def = Number.isFinite(input.defenderPower) ? input.defenderPower : 0;
  const hi = Math.max(atk, def);
  const lo = Math.max(1, Math.min(atk, def));
  if (hi / lo < TERRITORIAL_BLOWOUT_RATIO) {
    return { winner: input.rolledWinner, locked: false };
  }
  return { winner: atk >= def ? 'attacker' : 'defender', locked: true };
}

/**
 * R2 — 점유가 넘어갈 새 측이 학습 KPI 2축 이상 열세이고, 이번 전투 함대도 열세면 이전 거부.
 * 로컬 함대가 우세한 약세 측 승리는 허용(편파 스노우볼 방지).
 */
export function shouldVetoWeakerHoldTransfer(input: {
  kpi: FactionPowerKpiCompact | null | undefined;
  previousSide: string;
  newSide: string;
  attackerSide: string;
  defenderSide: string;
  attackerPower: number;
  defenderPower: number;
}): boolean {
  if (!input.kpi) return false;
  const prev = warSide(input.previousSide);
  const next = warSide(input.newSide);
  if (!next || prev === next) return false;

  const score = galaxyScore(input.kpi);
  const galaxyWeaker = next === 'BLUE' ? score <= -2 : score >= 2;
  if (!galaxyWeaker) return false;

  const newIsAttacker = warSide(input.attackerSide) === next;
  const localWeaker = newIsAttacker
    ? input.attackerPower < input.defenderPower
    : input.defenderPower < input.attackerPower;
  return localWeaker;
}
