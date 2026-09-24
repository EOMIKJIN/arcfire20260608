/**
 * 미확인 이상현상 clone — tq_anom_01 → arc_anom_{planetId}_{seq}.
 * timeLimitHours=48 반드시 복사. 바 보드·arc_inst_ 와 분리.
 */
import type { Mission, MissionObjective } from '../../types';
import { MISSIONS_FROM_CSV } from '../../data/generated';
import {
  ANOMALY_RELIC_ITEM_ID,
  ANOMALY_RESEARCHER_CAPTAIN_ID,
  UNIDENTIFIED_ANOMALY_TEMPLATE_ID,
  isUnidentifiedAnomalyMissionId,
} from './unidentifiedAnomalyIds';
import type { UnidentifiedAnomalyPayloadKind } from './unidentifiedAnomalyPolicy';

const materializedByInstanceId = new Map<string, Mission>();
const RELIC_OBJECTIVE_ID = 'obj_tq_anom_01_a';
const THREAT_OBJECTIVE_ID = 'obj_tq_anom_01_t';

function pickTemplateObjective(template: Mission, objectiveId: string): MissionObjective | undefined {
  const rows = template.objectives;
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i]!.id === objectiveId) return rows[i];
  }
  return undefined;
}

function cloneObjectives(
  template: Mission,
  payloadKind: UnidentifiedAnomalyPayloadKind,
): MissionObjective[] {
  if (payloadKind === 'threat') {
    const threat = pickTemplateObjective(template, THREAT_OBJECTIVE_ID);
    if (threat) {
      return [{ ...threat, complete: false }];
    }
  }
  const relic = pickTemplateObjective(template, RELIC_OBJECTIVE_ID) ?? template.objectives[0];
  if (!relic) return [];
  return [
    {
      ...relic,
      type: 'collect_item',
      targetId: ANOMALY_RELIC_ITEM_ID,
      quantity: 1,
      complete: false,
    },
  ];
}

export function materializeUnidentifiedAnomalyMission(opts: {
  instanceId: string;
  planetId: string;
  payloadKind: UnidentifiedAnomalyPayloadKind;
}): Mission | null {
  if (!isUnidentifiedAnomalyMissionId(opts.instanceId)) return null;
  const template = MISSIONS_FROM_CSV[UNIDENTIFIED_ANOMALY_TEMPLATE_ID];
  if (!template) return null;
  const mission: Mission = {
    ...template,
    id: opts.instanceId,
    objectives: cloneObjectives(template, opts.payloadKind),
    prerequisiteIds: [],
    nextMissionId: null,
    offerPlanetId: opts.planetId,
    offerCaptainId: ANOMALY_RESEARCHER_CAPTAIN_ID,
    timeLimitHours: template.timeLimitHours ?? 48,
    instanceTemplateMissionId: UNIDENTIFIED_ANOMALY_TEMPLATE_ID,
  };
  materializedByInstanceId.set(opts.instanceId, mission);
  return mission;
}

export function getUnidentifiedAnomalyMaterializedMission(instanceId: string): Mission | undefined {
  return materializedByInstanceId.get(instanceId);
}

export function forgetUnidentifiedAnomalyMaterializedMission(instanceId: string): void {
  materializedByInstanceId.delete(instanceId);
}

export function rematerializeUnidentifiedAnomalyMissionsFromProgresses(
  progresses: Record<string, { missionId: string }>,
  resolveMeta: (missionId: string) => { planetId: string; payloadKind: UnidentifiedAnomalyPayloadKind } | null,
): void {
  const ids = Object.keys(progresses);
  for (let i = 0; i < ids.length; i += 1) {
    const missionId = progresses[ids[i]!]!.missionId;
    if (!isUnidentifiedAnomalyMissionId(missionId)) continue;
    if (materializedByInstanceId.has(missionId)) continue;
    const meta = resolveMeta(missionId);
    if (!meta) continue;
    materializeUnidentifiedAnomalyMission({
      instanceId: missionId,
      planetId: meta.planetId,
      payloadKind: meta.payloadKind,
    });
  }
}
