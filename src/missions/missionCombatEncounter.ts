import type { MissionProgress } from '../types';
import { shouldGuaranteeQuestCombatEncounter } from './questItemOpsRegistry';

/** 활성 전투 미션 시 transit 인카운터 확률 보정. 퀘스트 `transit_guaranteed`는 주 미션 1건만 100%. */
export function resolveTransitEncounterChance(
  zone: string,
  hasActiveCombatMission: boolean,
  progresses?: Record<string, MissionProgress>,
  activeMissionId?: string | null,
): number {
  if (progresses && shouldGuaranteeQuestCombatEncounter(progresses, activeMissionId)) {
    return 1;
  }
  let base = 0.1;
  if (zone === 'neutral') base = 0.3;
  if (zone === 'pvp') base = 0.7;
  if (hasActiveCombatMission) return Math.min(1, base + 0.4);
  return base;
}
