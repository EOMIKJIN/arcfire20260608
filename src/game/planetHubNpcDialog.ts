import { STORY_SCENES_FROM_CSV } from '../data/generated/csvStoryScenes';
import { listNpcCaptains, getNpcCaptainByAssignedShipId } from '../npc/npcFleetRegistry';
import { captainMatchesPlanetOrbitTable } from '../npc/captainOrbitTableMatch';
import type { NearbyOrbitPresenceRow } from '../npc/nearbyOrbitPresenceSystem';

type DialogCandidate = {
  sceneId: string;
  priority: number;
  captainId: string;
};

const CAPTAIN_DIALOG_INDEX: Map<string, DialogCandidate> = (() => {
  const map = new Map<string, DialogCandidate>();
  for (const captain of listNpcCaptains()) {
    if (!captain.mainStageTalkEnabled) continue;
    const sceneId = captain.arcOrbitPresenceFill
      ? 'npc_dialog_arc_transport_temp'
      : `npc_dialog_${captain.id.replace(/^npc_cpt_/, '')}`;
    const scene = STORY_SCENES_FROM_CSV[sceneId];
    if (!scene?.pages.some((page) => page.viewMode === 'ingame_dialog')) continue;
    map.set(captain.id, {
      sceneId,
      priority: captain.arcOrbitPresenceFill ? 80 : 10,
      captainId: captain.id,
    });
  }
  return map;
})();

/** 궤도·아크 수송 등 현재 행성에 보이는 함장 id 수집 */
export function collectPlanetHubCaptainIds(
  planetId: string,
  systemId: string,
  arcShipsAtPlanet: readonly { captainId: string }[],
  nearbyRows: readonly NearbyOrbitPresenceRow[],
): string[] {
  const ids = new Set<string>();
  for (const ship of arcShipsAtPlanet) {
    ids.add(ship.captainId);
  }
  for (const row of nearbyRows) {
    const shipId = row.linkedCapitalShipId;
    if (!shipId) continue;
    const captain = getNpcCaptainByAssignedShipId(shipId);
    if (captain && captainMatchesPlanetOrbitTable(captain, planetId, systemId)) ids.add(captain.id);
  }
  return [...ids];
}

/** 메인스테이지 대화 버튼 — 우선순위가 가장 높은(숫자 낮음) NPC 대화 씬 */
export function resolvePlanetHubNpcDialogSceneId(presentCaptainIds: readonly string[]): string {
  let best: DialogCandidate | null = null;
  for (const captainId of presentCaptainIds) {
    const candidate = CAPTAIN_DIALOG_INDEX.get(captainId);
    if (!candidate) continue;
    if (!best || candidate.priority < best.priority) {
      best = candidate;
    }
  }
  const fallback = STORY_SCENES_FROM_CSV.npc_dialog_default;
  if (best) return best.sceneId;
  if (fallback?.pages.some((page) => page.viewMode === 'ingame_dialog')) {
    return 'npc_dialog_default';
  }
  return 'npc_dialog_orbit_captain_temp';
}
