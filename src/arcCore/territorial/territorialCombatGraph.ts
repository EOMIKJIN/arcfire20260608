// ============================================================
// 성계 노드 그래프 → 접전 combatMode 검증 (occupation seeds 기준)
// ============================================================

import { PlanetOccupationSeeds_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { STAR_SYSTEMS_FROM_CSV } from '../../data/generated/csvSystems';
import type { TerritorialCombatMode } from './arcCoreTerritorialCombatPolicy';

type SeedOwner = 'BLUE' | 'RED' | 'NEUTRAL';

function parseSeedOwner(raw: string): SeedOwner {
  const o = String(raw ?? '').trim().toUpperCase();
  if (o === 'RED') return 'RED';
  if (o === 'BLUE') return 'BLUE';
  return 'NEUTRAL';
}

/** 인접 성계(1홉) occupation 시드에 BLUE/RED 존재 여부 */
export function resolveAdjacentSystemFactionPresence(systemId: string): {
  hasBlue: boolean;
  hasRed: boolean;
} {
  const sys = STAR_SYSTEMS_FROM_CSV[systemId];
  if (!sys) return { hasBlue: false, hasRed: false };

  let hasBlue = false;
  let hasRed = false;
  for (const connId of sys.connections) {
    for (const row of PlanetOccupationSeeds_FROM_BALANCE_CSV) {
      if (row.systemId !== connId) continue;
      const owner = parseSeedOwner(row.initialOwner);
      if (owner === 'BLUE') hasBlue = true;
      if (owner === 'RED') hasRed = true;
    }
  }
  return { hasBlue, hasRed };
}

/** 그래프 기준 권장 combatMode */
export function inferTerritorialCombatModeFromGraph(
  systemId: string,
): TerritorialCombatMode {
  const { hasBlue, hasRed } = resolveAdjacentSystemFactionPresence(systemId);
  if (hasBlue && hasRed) return 'blue_red';
  if (hasBlue && !hasRed) return 'blue_neutral';
  if (hasRed && !hasBlue) return 'red_neutral';
  return 'blue_red';
}

export function validateTerritorialCombatModeForSystem(input: {
  systemId: string;
  combatMode: TerritorialCombatMode;
}): { ok: boolean; expected: TerritorialCombatMode } {
  const expected = inferTerritorialCombatModeFromGraph(input.systemId);
  return { ok: expected === input.combatMode, expected };
}
