// ============================================================
// 플레이어 방위위성 → NPC 자동 분쟁 어드밴티지 (웨이브 비삽입)
//
// 전투: defenderAdvantagePct에만 가산 (주둔 mul·롤 CSV 원본과 별축)
// 롤: battle에서 status_quo로 소수 포인트만 이동 (neutral_declare 유지)
// 캡: 수비 +10 / 억제 +4 — 수도 포위(+18)·주둔(0.85~1.05)·58/12/30과 겹쳐도
//     전선이 멈추지 않게 하드캡. ArcCore 자율 위성은 제외.
// ============================================================

import { getPlanetDefenseSatelliteLevelRow } from '../balance/planetDefenseSatelliteLevelPolicy';
import type { PlanetDefenseSatelliteInstalledBy } from '../../store/planetCoreMetricTypes';
import type { TerritorialCombatParticipant } from './arcCoreTerritorialCombatPolicy';
import type { TerritorialRollWeights } from './resolveSupplyEnvelope';

export const TERRITORIAL_SAT_ADVANTAGE_CAP = 10;
export const TERRITORIAL_SAT_ABSORB_CAP = 4;

export type DefenseSatelliteTerritorialBonus = {
  level: number;
  defenderAdvantagePct: number;
  statusQuoAbsorbPct: number;
  applied: boolean;
};

const EMPTY_BONUS: DefenseSatelliteTerritorialBonus = {
  level: 0,
  defenderAdvantagePct: 0,
  statusQuoAbsorbPct: 0,
  applied: false,
};

export function isPlayerInvestedDefenseSatelliteEligible(
  installedBy: PlanetDefenseSatelliteInstalledBy | undefined,
  defenderSide: TerritorialCombatParticipant,
): boolean {
  if (defenderSide === 'RED' || defenderSide === 'NEUTRAL') return false;
  if (installedBy === 'arc_core') return false;
  if (installedBy === 'player') {
    return defenderSide === 'BLUE' || defenderSide === 'INDEPENDENT';
  }
  /** 구 세이브(installedBy 없음) — 독립국 점유만 플레이어 투자로 간주 */
  return defenderSide === 'INDEPENDENT';
}

export function resolveDefenseSatelliteTerritorialBonusFromDetail(input: {
  installed: boolean;
  level: number;
  installedBy?: PlanetDefenseSatelliteInstalledBy;
  defenderSide: TerritorialCombatParticipant;
}): DefenseSatelliteTerritorialBonus {
  if (!input.installed || input.level <= 0) return EMPTY_BONUS;
  if (!isPlayerInvestedDefenseSatelliteEligible(input.installedBy, input.defenderSide)) {
    return { ...EMPTY_BONUS, level: input.level };
  }
  const row = getPlanetDefenseSatelliteLevelRow(input.level);
  if (!row) return { ...EMPTY_BONUS, level: input.level };
  return {
    level: input.level,
    defenderAdvantagePct: Math.min(TERRITORIAL_SAT_ADVANTAGE_CAP, row.territorialDefenderAdvantagePct),
    statusQuoAbsorbPct: Math.min(TERRITORIAL_SAT_ABSORB_CAP, row.territorialStatusQuoAbsorbPct),
    applied: true,
  };
}

export function applyDefenseSatelliteRollWeights(input: {
  weights: TerritorialRollWeights;
  bonus: DefenseSatelliteTerritorialBonus;
}): TerritorialRollWeights {
  const { weights, bonus } = input;
  if (!bonus.applied || bonus.statusQuoAbsorbPct <= 0) return weights;
  const absorb = Math.min(bonus.statusQuoAbsorbPct, Math.max(0, weights.battleWeightPct));
  if (absorb <= 0) return weights;
  return {
    battleWeightPct: weights.battleWeightPct - absorb,
    neutralDeclareWeightPct: weights.neutralDeclareWeightPct,
    statusQuoWeightPct: weights.statusQuoWeightPct + absorb,
  };
}

export function applyDefenseSatelliteCombatAdvantage(
  defenderAdvantagePct: number,
  bonus: DefenseSatelliteTerritorialBonus,
): number {
  if (!bonus.applied || bonus.defenderAdvantagePct <= 0) return defenderAdvantagePct;
  return defenderAdvantagePct + bonus.defenderAdvantagePct;
}
