// ============================================================
// 행성 점령지 총사령관 — CSV O(1) 조회 (Table-First · 부트 1회)
// ============================================================

import {
  PLANET_GOVERNOR_COMMANDERS_FROM_CSV,
  type PlanetGovernorCommanderRow,
} from '../../data/generated';
import { getIngameDialogSceneById } from '../ingameDialog/ingameDialogSceneIndex';

const GOVERNOR_BY_PLANET_ID: ReadonlyMap<string, PlanetGovernorCommanderRow> = (() => {
  const map = new Map<string, PlanetGovernorCommanderRow>();
  for (const row of PLANET_GOVERNOR_COMMANDERS_FROM_CSV) {
    if (map.has(row.planetId)) {
      console.warn(
        `planetGovernorRegistry: duplicate planetId ${row.planetId} (keep first)`,
      );
      continue;
    }
    map.set(row.planetId, row);
  }
  return map;
})();

export function getPlanetGovernorCommander(
  planetId: string,
): PlanetGovernorCommanderRow | null {
  return GOVERNOR_BY_PLANET_ID.get(planetId) ?? null;
}

export function listPlanetGovernorCommanders(): readonly PlanetGovernorCommanderRow[] {
  return PLANET_GOVERNOR_COMMANDERS_FROM_CSV;
}

/** 행성 체류 대화 — governor 테이블 talkEnabled + 유효 dialogSceneId */
export function resolvePlanetGovernorDialogCandidate(
  planetId: string,
): { sceneId: string; priority: number; captainId: string } | null {
  const gov = getPlanetGovernorCommander(planetId);
  if (!gov?.talkEnabled) return null;
  const sceneId = String(gov.dialogSceneId ?? '').trim();
  if (!sceneId || !getIngameDialogSceneById(sceneId)) return null;
  return {
    sceneId,
    priority: gov.talkPriority,
    captainId: gov.governorCaptainId,
  };
}

/** 인스턴스 미션 연동용 태그 (후속 미션 시스템에서 planetId → tag 조회) */
export function resolvePlanetGovernorInstanceMissionTag(planetId: string): string | null {
  const tag = String(getPlanetGovernorCommander(planetId)?.instanceMissionTag ?? '').trim();
  return tag || null;
}

/** 적대 행성 진입 전투 — governor 함장 id (hostileEntryCombatEnabled) */
export function resolvePlanetGovernorHostileCombatCaptainId(planetId: string): string | null {
  const gov = getPlanetGovernorCommander(planetId);
  if (!gov?.hostileEntryCombatEnabled) return null;
  const captainId = String(gov.governorCaptainId ?? '').trim();
  return captainId || null;
}
