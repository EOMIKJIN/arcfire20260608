// ============================================================
// 아크코어 스파이 — 행성 체류 중 활성 스파이 조회
// ============================================================

import type { ArcNpcTrafficShip } from '../../store/arcNpcTrafficStore';
import { getCaptainPresenceWorldIndex } from '../captainPresence/buildCaptainPresenceWorldIndex';
import type { CaptainPresenceActivity } from '../captainPresence/captainPresenceTypes';
import { isArcCoreSpyCaptainActive } from './buildArcCoreSpyCaptainTagSet';

const SPY_INFILTRATION_ACTIVITIES: ReadonlySet<CaptainPresenceActivity> = new Set([
  'orbit_arc_transport',
  'orbit_table_patrol',
]);

function isSpyInfiltrationActivity(activity: CaptainPresenceActivity): boolean {
  return SPY_INFILTRATION_ACTIVITIES.has(activity);
}

/**
 * 행성 궤도/수송 체류 중 백엔드 T 침식을 유발하는 스파이 함장 id.
 * (전투 비참여 태그 1% 풀 · 색출 expel 제외)
 */
export function listActiveArcCoreSpyCaptainIdsAtPlanet(
  planetId: string,
  arcShips: readonly ArcNpcTrafficShip[] = [],
): readonly string[] {
  const pid = String(planetId ?? '').trim();
  if (!pid) return [];

  const index = getCaptainPresenceWorldIndex(arcShips);
  const orbitCaptainIds = index.hubOrbitCaptainIdsByPlanet.get(pid) ?? [];
  const out: string[] = [];
  for (let i = 0; i < orbitCaptainIds.length; i += 1) {
    const captainId = orbitCaptainIds[i]!;
    if (!isArcCoreSpyCaptainActive(captainId)) continue;
    const presence = index.byCaptainId.get(captainId);
    if (!presence || presence.planetId !== pid) continue;
    if (!isSpyInfiltrationActivity(presence.activity)) continue;
    out.push(captainId);
  }
  return out;
}

export function countActiveArcCoreSpiesAtPlanet(
  planetId: string,
  arcShips: readonly ArcNpcTrafficShip[] = [],
): number {
  return listActiveArcCoreSpyCaptainIdsAtPlanet(planetId, arcShips).length;
}
