import { MISSION_COMBAT_CAPTAINS_FROM_CSV } from '../data/generated';
import { getNpcCaptain, resolveTransitPirateCaptainForSystem } from '../npc/npcFleetRegistry';
import type { NpcCaptain } from '../types';

export type MissionCombatCaptainResolveInput = {
  enemyTemplateId: string;
  planetId?: string | null;
  systemId?: string | null;
};

function pickBestCaptainRow(
  enemyTemplateId: string,
  planetId: string | null | undefined,
): string | null {
  const candidates = MISSION_COMBAT_CAPTAINS_FROM_CSV.filter(
    (row) => row.enemyTemplateId === enemyTemplateId,
  );
  if (candidates.length === 0) return null;

  let bestCaptainId: string | null = null;
  let bestPriority = -1;

  const consider = (rows: typeof candidates) => {
    for (const row of rows) {
      if (row.priority < bestPriority) continue;
      if (row.priority === bestPriority && bestCaptainId) continue;
      bestCaptainId = row.captainId;
      bestPriority = row.priority;
    }
  };

  if (planetId) {
    consider(candidates.filter((row) => row.planetId === planetId));
  }
  if (bestCaptainId) return bestCaptainId;

  consider(candidates.filter((row) => row.planetId == null || row.planetId === ''));
  return bestCaptainId;
}

/** `mission_combat_captains.csv` — enemyTemplateId + planetId 우선, default 행 폴백. */
export function resolveMissionCombatCaptain(
  input: MissionCombatCaptainResolveInput,
): NpcCaptain | undefined {
  const captainId = pickBestCaptainRow(input.enemyTemplateId, input.planetId ?? null);
  if (!captainId) return undefined;
  return getNpcCaptain(captainId);
}

/** 테이블 매핑 → 레거시 transit 해적 휴리스틱 폴백. */
export function resolveCombatEnemyCaptain(
  input: MissionCombatCaptainResolveInput,
): NpcCaptain | undefined {
  const fromMissionTable = resolveMissionCombatCaptain(input);
  if (fromMissionTable) return fromMissionTable;
  return resolveTransitPirateCaptainForSystem(input.systemId ?? null);
}
