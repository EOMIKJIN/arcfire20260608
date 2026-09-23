/**
 * 함장 개인미션 materialize — 통신 1회 0~1. 바 보드 Map과 분리.
 * 틱/렌더에서 전량 rebuild 금지. getMissionById는 Map O(1).
 */
import type { Mission, MissionProgress } from '../types';
import {
  BAR_INSTANCE_DISCOVERY_PLANET_PLACEHOLDER,
  BAR_INSTANCE_NEIGHBOR_SYSTEM_PLACEHOLDER,
  patchBarInstanceObjectiveTargetId,
  resolveBarInstancePlanetContext,
} from './arcCoreInstanceMissionPlanetContext';
import {
  isCaptainPersonalMissionId,
  parseCaptainPersonalMissionId,
} from './captainPersonalMissionIds';
import {
  getCaptainPersonalMissionTemplate,
  isDestBarHostPlaceholder,
  pickUsableCaptainPersonalTemplateId,
  type CaptainPersonalMissionTemplateRow,
} from './captainPersonalMissionTemplates';
import { applyResolvedClearContactToMission } from './resolveMissionClearNpcContext';
import {
  resolveBarHostCaptainIdAtPlanet,
  resolveCaptainContactLabel,
  resolveMissionContactPlanetIdForSystem,
} from './missionClearContactLookups';

export type CaptainPersonalMissionMeta = {
  instanceId: string;
  templateId: string;
  offerCaptainId: string;
  offerPlanetId: string;
};

const materializedByInstanceId = new Map<string, Mission>();
const metaByInstanceId = new Map<string, CaptainPersonalMissionMeta>();

function resolveDestDisplayPlanetId(
  template: CaptainPersonalMissionTemplateRow,
  offerPlanetId: string,
): string {
  const ctx = resolveBarInstancePlanetContext(offerPlanetId, {
    instanceId: `${offerPlanetId}:${template.id}`,
  });
  if (template.objectiveType === 'reach_planet') {
    return ctx.discoveryPlanetId ?? offerPlanetId;
  }
  return ctx.discoveryPlanetId ?? offerPlanetId;
}

function canUseTemplate(
  template: CaptainPersonalMissionTemplateRow,
  offerCaptainId: string,
  offerPlanetId: string,
): boolean {
  const ctx = resolveBarInstancePlanetContext(offerPlanetId, {
    instanceId: `${offerPlanetId}:${template.id}`,
  });
  if (template.objectiveType === 'talk_npc' && isDestBarHostPlaceholder(template.objectiveTarget)) {
    const destPlanetId = ctx.discoveryPlanetId ?? offerPlanetId;
    const destHost = resolveBarHostCaptainIdAtPlanet(destPlanetId);
    return Boolean(destHost && destHost !== offerCaptainId);
  }
  if (template.objectiveType === 'reach_planet') {
    return Boolean(ctx.discoveryPlanetId);
  }
  if (template.objectiveType === 'reach_system') {
    return true;
  }
  if (template.objectiveType === 'defeat_enemy') {
    return Boolean(template.objectiveTarget.trim());
  }
  return Boolean(template.objectiveTarget.trim());
}

function patchPersonalObjectiveTarget(
  template: CaptainPersonalMissionTemplateRow,
  offerCaptainId: string,
  offerPlanetId: string,
): string {
  const ctx = resolveBarInstancePlanetContext(offerPlanetId, {
    instanceId: `${offerPlanetId}:${template.id}`,
  });
  if (template.objectiveType === 'talk_npc' && isDestBarHostPlaceholder(template.objectiveTarget)) {
    const destPlanetId = ctx.discoveryPlanetId ?? offerPlanetId;
    return resolveBarHostCaptainIdAtPlanet(destPlanetId) ?? offerCaptainId;
  }
  return patchBarInstanceObjectiveTargetId(template.objectiveType, template.objectiveTarget, ctx);
}

function cloneMissionFromTemplate(meta: CaptainPersonalMissionMeta): Mission | undefined {
  const template = getCaptainPersonalMissionTemplate(meta.templateId);
  if (!template) return undefined;
  const targetId = patchPersonalObjectiveTarget(template, meta.offerCaptainId, meta.offerPlanetId);
  const cloned: Mission = {
    id: meta.instanceId,
    title: template.title,
    titleEn: template.titleEn,
    description: template.description,
    descriptionEn: template.descriptionEn,
    type: template.type,
    objectives: [
      {
        id: `obj_${meta.instanceId}_a`,
        description: template.objectiveDesc,
        descriptionEn: template.objectiveDescEn,
        type: template.objectiveType,
        targetId,
        quantity: template.objectiveQty,
        complete: false,
      },
    ],
    rewards: {
      credits: template.rewardCredits,
      exp: template.rewardExp,
      items: [],
      skillPointBonus: 0,
    },
    prerequisiteIds: [],
    nextMissionId: null,
    dc: template.dc,
    offerCaptainId: meta.offerCaptainId,
    offerPlanetId: meta.offerPlanetId,
    levelRequired: template.levelRequired,
    timeLimitHours: template.timeLimitHours,
    instanceTemplateMissionId: template.id,
  };
  return applyResolvedClearContactToMission(
    cloned,
    resolveMissionContactPlanetIdForSystem,
    resolveBarHostCaptainIdAtPlanet,
    resolveCaptainContactLabel,
  );
}

export function registerCaptainPersonalMissionMeta(meta: CaptainPersonalMissionMeta): void {
  if (!isCaptainPersonalMissionId(meta.instanceId)) return;
  metaByInstanceId.set(meta.instanceId, {
    instanceId: meta.instanceId,
    templateId: meta.templateId.trim(),
    offerCaptainId: meta.offerCaptainId.trim(),
    offerPlanetId: meta.offerPlanetId.trim(),
  });
}

export function materializeCaptainPersonalMission(
  meta: CaptainPersonalMissionMeta,
): Mission | undefined {
  registerCaptainPersonalMissionMeta(meta);
  const mission = cloneMissionFromTemplate(meta);
  if (!mission) {
    materializedByInstanceId.delete(meta.instanceId);
    return undefined;
  }
  materializedByInstanceId.set(meta.instanceId, mission);
  return mission;
}

export function getCaptainPersonalMaterializedMission(instanceId: string): Mission | undefined {
  const hit = materializedByInstanceId.get(instanceId);
  if (hit) return hit;
  const meta = metaByInstanceId.get(instanceId);
  if (!meta) return undefined;
  return materializeCaptainPersonalMission(meta);
}

export function resolveCaptainPersonalTemplateMissionId(instanceId: string): string | null {
  return metaByInstanceId.get(instanceId)?.templateId ?? null;
}

export function forgetCaptainPersonalMaterializedMission(instanceId: string): void {
  materializedByInstanceId.delete(instanceId);
  metaByInstanceId.delete(instanceId);
}

export function clearCaptainPersonalMaterializedCache(): void {
  materializedByInstanceId.clear();
  metaByInstanceId.clear();
}

export function rematerializeCaptainPersonalMissionsFromProgresses(
  progresses: Readonly<Record<string, MissionProgress>>,
): void {
  const ids = Object.keys(progresses);
  for (let i = 0; i < ids.length; i += 1) {
    const progress = progresses[ids[i]!]!;
    const missionId = String(progress.missionId ?? ids[i] ?? '').trim();
    if (!isCaptainPersonalMissionId(missionId)) continue;
    const parsed = parseCaptainPersonalMissionId(missionId);
    const templateId = String(progress.captainPersonalTemplateId ?? '').trim();
    const offerPlanetId = String(progress.captainPersonalOfferPlanetId ?? '').trim();
    if (!parsed || !templateId || !offerPlanetId) continue;
    materializeCaptainPersonalMission({
      instanceId: missionId,
      templateId,
      offerCaptainId: parsed.captainId,
      offerPlanetId,
    });
  }
}

export function resolveCaptainPersonalDestPlanetId(
  templateId: string,
  offerPlanetId: string,
): string {
  const template = getCaptainPersonalMissionTemplate(templateId);
  if (!template) return offerPlanetId;
  return resolveDestDisplayPlanetId(template, offerPlanetId);
}

export function pickAndMaterializeCaptainPersonalMission(input: {
  captainId: string;
  planetId: string;
  dayKey: string;
  instanceId: string;
}): Mission | undefined {
  const templateId = pickUsableCaptainPersonalTemplateId(
    input.captainId,
    input.planetId,
    input.dayKey,
    (id) => {
      const template = getCaptainPersonalMissionTemplate(id);
      return template ? canUseTemplate(template, input.captainId, input.planetId) : false;
    },
  );
  if (!templateId) return undefined;
  return materializeCaptainPersonalMission({
    instanceId: input.instanceId,
    templateId,
    offerCaptainId: input.captainId,
    offerPlanetId: input.planetId,
  });
}

export {
  BAR_INSTANCE_DISCOVERY_PLANET_PLACEHOLDER,
  BAR_INSTANCE_NEIGHBOR_SYSTEM_PLACEHOLDER,
};
