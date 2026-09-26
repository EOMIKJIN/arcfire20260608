export const UNIDENTIFIED_ANOMALY_MISSION_PREFIX = 'arc_anom_';
export const UNIDENTIFIED_ANOMALY_TEMPLATE_PREFIX = 'tq_anom_';
export const UNIDENTIFIED_ANOMALY_TEMPLATE_ID = 'tq_anom_01';
export const ANOMALY_RESEARCHER_CAPTAIN_ID = 'npc_cpt_anomaly_researcher';
export const ANOMALY_RELIC_ITEM_ID = 'relic_quest_anomaly_01';
export const ANOMALY_THREAT_TARGET_ID = 'unidentified_object';
export const ANOMALY_RESEARCHER_OFFER_SCENE_ID = 'npc_dialog_anomaly_researcher';
export const ANOMALY_RESEARCHER_ABANDON_SCENE_ID = 'npc_dialog_anomaly_researcher_abandon';

export function isUnidentifiedAnomalyMissionId(missionId: string): boolean {
  return missionId.startsWith(UNIDENTIFIED_ANOMALY_MISSION_PREFIX);
}

/** CSV 템플릿(`tq_anom_*`) — 바 `tq_*` 보드와 분리. 런타임 클론은 `arc_anom_`. */
export function isUnidentifiedAnomalyTemplateMissionId(missionId: string): boolean {
  return missionId.startsWith(UNIDENTIFIED_ANOMALY_TEMPLATE_PREFIX);
}

export function parseUnidentifiedAnomalyMissionId(
  missionId: string,
): { planetId: string; seq: string } | null {
  if (!isUnidentifiedAnomalyMissionId(missionId)) return null;
  const rest = missionId.slice(UNIDENTIFIED_ANOMALY_MISSION_PREFIX.length);
  const cut = rest.lastIndexOf('_');
  if (cut <= 0) return null;
  const planetId = rest.slice(0, cut).trim();
  const seq = rest.slice(cut + 1).trim();
  if (!planetId || !seq) return null;
  return { planetId, seq };
}

export function buildUnidentifiedAnomalyMissionId(planetId: string, seq: string | number): string {
  return `${UNIDENTIFIED_ANOMALY_MISSION_PREFIX}${planetId}_${seq}`;
}
