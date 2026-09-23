import type { Mission } from '../types';
import { MISSIONS_FROM_CSV } from '../data/generated';
import type { ArcCoreInstanceMissionBoardEntry } from './arcCoreInstanceMissionTypes';
import { ARC_CORE_INSTANCE_MISSION_ID_PREFIX } from './arcCoreInstanceMissionTypes';
import {
  patchBarInstanceObjectiveTargetId,
  resolveBarInstancePlanetContext,
} from './arcCoreInstanceMissionPlanetContext';
import { resolveBarReputationBonusPct } from '../arcCore/balance/facilityBarLevelPolicy';
import {
  computeBarInstanceMissionDifficulty,
  scaleBarInstanceMissionRewards,
} from './barInstanceMissionDifficulty';
import { resolvePlanetBarDomeLevelForMissions } from './barInstanceDomeLevel';
import { applyResolvedClearContactToMission } from './resolveMissionClearNpcContext';
import {
  resolveCaptainContactLabel,
  resolveMissionContactPlanetIdForSystem,
  resolveBarHostCaptainIdAtPlanet,
} from './missionClearContactLookups';

const materializedByInstanceId = new Map<string, Mission>();
const templateByInstanceId = new Map<string, string>();

export function isArcCoreInstanceMissionId(missionId: string): boolean {
  return missionId.startsWith(ARC_CORE_INSTANCE_MISSION_ID_PREFIX);
}

export function resolveArcCoreInstanceTemplateMissionId(missionId: string): string | null {
  if (!isArcCoreInstanceMissionId(missionId)) return null;
  return templateByInstanceId.get(missionId) ?? null;
}

function cloneMissionFromTemplate(entry: ArcCoreInstanceMissionBoardEntry): Mission | undefined {
  const template = MISSIONS_FROM_CSV[entry.templateMissionId];
  if (!template) return undefined;
  const ctx = resolveBarInstancePlanetContext(entry.offerPlanetId, {
    instanceId: entry.instanceId,
  });
  const difficulty = computeBarInstanceMissionDifficulty(template, ctx, entry.offerPlanetId);
  const domeLevel = resolvePlanetBarDomeLevelForMissions(entry.offerPlanetId);
  const scaledRewards = scaleBarInstanceMissionRewards(
    template.rewards,
    difficulty.tier,
    resolveBarReputationBonusPct(domeLevel),
  );
  const cloned: Mission = {
    ...template,
    id: entry.instanceId,
    objectives: template.objectives.map((obj) => ({
      ...obj,
      targetId: patchBarInstanceObjectiveTargetId(obj.type, obj.targetId, ctx),
    })),
    prerequisiteIds: [...template.prerequisiteIds],
    rewards: scaledRewards,
    offerPlanetId: entry.offerPlanetId,
    offerCaptainId: entry.offerCaptainId ?? template.offerCaptainId,
    clearDialogSceneId: template.clearDialogSceneId,
    clearNpcCaptainId: template.clearNpcCaptainId,
    requiresClearContact: template.requiresClearContact,
    instanceDifficultyTier: difficulty.tier,
    instanceDifficultyScore: difficulty.score,
  };
  return applyResolvedClearContactToMission(
    cloned,
    resolveMissionContactPlanetIdForSystem,
    resolveBarHostCaptainIdAtPlanet,
    resolveCaptainContactLabel,
  );
}

/** 보드 hydrate·등록 후 1회 호출 — getMissionById O(1). */
export function syncArcCoreInstanceMissionMaterializedCache(
  entries: readonly ArcCoreInstanceMissionBoardEntry[],
): void {
  materializedByInstanceId.clear();
  templateByInstanceId.clear();
  for (const entry of entries) {
    if (entry.boardStatus === 'cleared') continue;
    const mission = cloneMissionFromTemplate(entry);
    if (!mission) continue;
    materializedByInstanceId.set(entry.instanceId, mission);
    templateByInstanceId.set(entry.instanceId, entry.templateMissionId);
  }
}

export function getArcCoreInstanceMaterializedMission(instanceId: string): Mission | undefined {
  return materializedByInstanceId.get(instanceId);
}

export function resolveArcCoreInstanceBriefingDialogSceneId(
  entry: Pick<ArcCoreInstanceMissionBoardEntry, 'briefingDialogSceneId' | 'templateMissionId'>,
): string | null {
  if (entry.briefingDialogSceneId) return entry.briefingDialogSceneId;
  return `mission_brief_${entry.templateMissionId}`;
}
