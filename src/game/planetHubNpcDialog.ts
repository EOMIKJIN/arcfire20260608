import { listNpcCaptains, getNpcCaptainByAssignedShipId } from '../npc/npcFleetRegistry';
import { captainMatchesPlanetOrbitTable } from '../npc/captainOrbitTableMatch';
import type { NearbyOrbitPresenceRow } from '../npc/nearbyOrbitPresenceSystem';
import {
  resolveIngameDialogFallbackSceneId,
  resolveNpcCaptainDialogSceneId,
} from './ingameDialog/resolveNpcCaptainDialogSceneId';
import { resolvePlanetGovernorDialogCandidate } from './planetGovernor/planetGovernorRegistry';

type DialogCandidate = {
  sceneId: string;
  priority: number;
  captainId: string;
};

const CAPTAIN_DIALOG_INDEX: Map<string, DialogCandidate> = (() => {
  const map = new Map<string, DialogCandidate>();
  for (const captain of listNpcCaptains()) {
    if (!captain.mainStageTalkEnabled) continue;
    const sceneId = resolveNpcCaptainDialogSceneId(captain);
    if (!sceneId) continue;
    map.set(captain.id, {
      sceneId,
      priority: captain.mainStageTalkPriority,
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

function pickBestDialogCandidate(candidates: readonly DialogCandidate[]): DialogCandidate | null {
  let best: DialogCandidate | null = null;
  for (const candidate of candidates) {
    if (!best || candidate.priority < best.priority) {
      best = candidate;
    }
  }
  return best;
}

/**
 * 메인스테이지 대화 버튼 — 우선순위(숫자 낮음) 최고 NPC 대화 씬.
 * 행성 총사령관은 궤도 가시 여부와 무관하게 후보에 포함된다.
 */
export function resolvePlanetHubNpcDialogSceneId(
  planetId: string,
  presentCaptainIds: readonly string[],
): string {
  const candidates: DialogCandidate[] = [];

  const governor = resolvePlanetGovernorDialogCandidate(planetId);
  if (governor) candidates.push(governor);

  for (const captainId of presentCaptainIds) {
    const candidate = CAPTAIN_DIALOG_INDEX.get(captainId);
    if (candidate) candidates.push(candidate);
  }

  const best = pickBestDialogCandidate(candidates);
  if (best) return best.sceneId;
  return resolveIngameDialogFallbackSceneId();
}
