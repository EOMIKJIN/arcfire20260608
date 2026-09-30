// ============================================================
// 플레이어 군사령부 → 영토 자동전 교리 (위성 함수·CSV 미경유)
// 웨이브·inbound 요격 비삽입
// ============================================================

import type { TerritorialCombatParticipant } from './arcCoreTerritorialCombatPolicy';
import {
  interpolateMilitaryCommandLevel,
  resolvePlanetMilitaryCommandPolicy,
} from '../balance/planetMilitaryCommandPolicy';

export type MilitaryCommandTerritorialBonus = {
  level: number;
  defenderAdvantagePct: number;
  applied: boolean;
};

const EMPTY: MilitaryCommandTerritorialBonus = {
  level: 0,
  defenderAdvantagePct: 0,
  applied: false,
};

export function isMilitaryCommandTerritorialEligible(
  installed: boolean,
  defenderSide: TerritorialCombatParticipant,
): boolean {
  if (!installed) return false;
  return defenderSide === 'BLUE' || defenderSide === 'INDEPENDENT';
}

export function resolveMilitaryCommandTerritorialBonusFromLevel(input: {
  installed: boolean;
  level: number;
  defenderSide: TerritorialCombatParticipant;
}): MilitaryCommandTerritorialBonus {
  if (!isMilitaryCommandTerritorialEligible(input.installed, input.defenderSide)) {
    return { ...EMPTY, level: Math.max(0, Math.floor(input.level) || 0) };
  }
  const level = Math.max(0, Math.floor(input.level) || 0);
  if (level <= 0) return EMPTY;
  const policy = resolvePlanetMilitaryCommandPolicy();
  const raw = interpolateMilitaryCommandLevel(
    level,
    policy.doctrineAdvantageL1,
    policy.doctrineAdvantageL15,
  );
  return {
    level,
    defenderAdvantagePct: Math.min(policy.doctrineAdvantageCap, Math.max(0, raw)),
    applied: true,
  };
}

export function applyMilitaryCommandCombatAdvantage(
  defenderAdvantagePct: number,
  bonus: MilitaryCommandTerritorialBonus,
): number {
  if (!bonus.applied || bonus.defenderAdvantagePct <= 0) return defenderAdvantagePct;
  return defenderAdvantagePct + bonus.defenderAdvantagePct;
}
