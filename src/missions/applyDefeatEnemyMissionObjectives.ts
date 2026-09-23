/**
 * defeat_enemy 완료 — 베뉴+템플릿 일치만. 행성 id 단독 완료 금지.
 */

import { useMissionStore } from '../store/missionStore';
import {
  canCompleteQuestDefeatEnemy,
  resolveQuestCombatLock,
  type QuestCombatVenue,
} from './questCombatLock';

export function applyDefeatEnemyMissionObjectives(opts: {
  venue: QuestCombatVenue;
  enemyTemplateId?: string | null;
  planetId?: string | null;
}): void {
  const state = useMissionStore.getState();
  const lock = resolveQuestCombatLock(state.progresses, state.activeMissionId);
  if (!canCompleteQuestDefeatEnemy(lock, opts)) return;
  state.completeObjective(lock!.missionId, lock!.objectiveId);
}
