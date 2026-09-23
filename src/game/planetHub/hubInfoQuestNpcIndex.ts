/**
 * INFO 퀘스트 NPC 정적 인덱스 — CSV 1회. 틱 없음.
 * questOnly · missionTrigger · missions.csv 의뢰/클리어/talk_npc.
 */

import { MISSIONS_FROM_CSV, NPC_CAPTAINS_FROM_CSV } from '../../data/generated';
import { parseTalkNpcTarget } from '../../missions/talkNpcTarget';

let configuredQuestCaptainIds: ReadonlySet<string> | null = null;

function addId(out: Set<string>, raw: string | null | undefined): void {
  const id = String(raw ?? '').trim();
  if (id) out.add(id);
}

export function getConfiguredQuestCaptainIdSet(): ReadonlySet<string> {
  if (configuredQuestCaptainIds) return configuredQuestCaptainIds;
  const ids = new Set<string>();
  for (let i = 0; i < NPC_CAPTAINS_FROM_CSV.length; i += 1) {
    const captain = NPC_CAPTAINS_FROM_CSV[i]!;
    if (captain.questOnly) addId(ids, captain.id);
    if (String(captain.mainStageMissionTriggerId ?? '').trim()) addId(ids, captain.id);
  }
  const missions = Object.values(MISSIONS_FROM_CSV);
  for (let i = 0; i < missions.length; i += 1) {
    const mission = missions[i]!;
    addId(ids, mission.offerCaptainId);
    addId(ids, mission.clearNpcCaptainId);
    const objectives = mission.objectives;
    for (let j = 0; j < objectives.length; j += 1) {
      const obj = objectives[j]!;
      if (obj.type !== 'talk_npc') continue;
      addId(ids, parseTalkNpcTarget(obj.targetId).captainId);
    }
  }
  configuredQuestCaptainIds = ids;
  return ids;
}
