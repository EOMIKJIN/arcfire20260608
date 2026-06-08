// ============================================================
// 플레이어 전투 숙련도 — 생성·정규화 (docs/_player-combat-proficiency-system.md)
// ============================================================

import type { PlayerCombatProficiency } from '../types';
import {
  resolveCombatLevel,
  resolveOperatingEfficiencyPct,
  resolveProficiencyMultiplier,
} from './pilotProficiency';

export function createPlayerCombatProficiency(
  playerLevel: number,
  updatedAt = Date.now(),
): PlayerCombatProficiency {
  const combatLevel = resolveCombatLevel(playerLevel);
  const proficiencyMultiplier = resolveProficiencyMultiplier(combatLevel);
  return {
    combatLevel,
    proficiencyMultiplier,
    operatingEfficiencyPct: resolveOperatingEfficiencyPct(combatLevel),
    updatedAt,
  };
}

export function normalizePlayerCombatProficiency(
  raw: Partial<PlayerCombatProficiency> | undefined | null,
  playerLevel: number,
): PlayerCombatProficiency {
  const expected = createPlayerCombatProficiency(playerLevel);
  if (!raw || typeof raw !== 'object') return expected;
  const combatLevel = resolveCombatLevel(
    Number.isFinite(raw.combatLevel) ? Number(raw.combatLevel) : playerLevel,
  );
  const proficiencyMultiplier = resolveProficiencyMultiplier(combatLevel);
  return {
    combatLevel,
    proficiencyMultiplier,
    operatingEfficiencyPct: resolveOperatingEfficiencyPct(combatLevel),
    updatedAt:
      typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt)
        ? raw.updatedAt
        : expected.updatedAt,
  };
}
