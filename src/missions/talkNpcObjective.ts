import { getNpcCaptain } from '../npc/npcFleetRegistry';
import { useMissionStore } from '../store/missionStore';
import { listActiveMissionBundles } from './missionActiveBundles';
import { getCurrentSequentialObjective } from './missionObjectiveSequence';
import { parseTalkNpcTarget, resolveTalkNpcSceneId } from './talkNpcTarget';

export { parseTalkNpcTarget, resolveTalkNpcSceneId } from './talkNpcTarget';

export type CurrentTalkNpc = {
  missionId: string;
  objectiveId: string;
  captainId: string;
  planetId: string | null;
  sceneId: string;
};

export function resolveCurrentTalkNpcAt(
  planetId: string,
  captainId?: string | null,
): CurrentTalkNpc | null {
  const pid = (planetId ?? '').trim();
  if (!pid) return null;
  const wantCaptain = (captainId ?? '').trim();
  const bundles = listActiveMissionBundles(useMissionStore.getState().progresses);
  for (let i = 0; i < bundles.length; i += 1) {
    const bundle = bundles[i]!;
    const current = getCurrentSequentialObjective(bundle.mission, bundle.progress);
    if (!current || current.type !== 'talk_npc') continue;
    const parsed = parseTalkNpcTarget(current.targetId);
    if (!parsed.captainId) continue;
    if (parsed.planetId && parsed.planetId !== pid) continue;
    if (wantCaptain && parsed.captainId !== wantCaptain) continue;
    return {
      missionId: bundle.mission.id,
      objectiveId: current.id,
      captainId: parsed.captainId,
      planetId: parsed.planetId,
      sceneId: resolveTalkNpcSceneId(current.id),
    };
  }
  return null;
}

/** 바 입구 — 현재 탐문 대상이 이 행성 바 함장이면 그 목표. */
export function isTalkNpcBarConversation(
  planetId: string,
  hostCaptainId?: string | null,
): CurrentTalkNpc | null {
  const talk = resolveCurrentTalkNpcAt(planetId);
  if (!talk) return null;
  if (hostCaptainId && talk.captainId === hostCaptainId) return talk;
  const captain = getNpcCaptain(talk.captainId);
  if (captain?.barPlanetIds.includes(planetId)) return talk;
  return null;
}
