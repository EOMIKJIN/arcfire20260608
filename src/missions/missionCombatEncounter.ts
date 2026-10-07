import type { MissionProgress } from '../types';
import {
  resolveTransitHopDangerPolicy,
  resolveTransitHopDangerPolicyForSystem,
} from '../combat/transitHopDangerPolicy';
import { resolveQuestCombatLock, shouldGuaranteeQuestTransitEncounter } from './questCombatLock';

/**
 * 착륙 해적소탕(`mission_002` hub_orbit)과 겹치는 성계.
 * 일반 항로 조우 없음. 퀘스트 transit 락만 예외(현재 없음).
 */
const TRANSIT_ENCOUNTER_SUPPRESS_DEST_SYSTEM_IDS = new Set(['arcadia']);

/** 활성 전투 미션 시 transit 인카운터 확률 보정. 퀘스트 transit 락은 정책에 따라 100%. */
export function resolveTransitEncounterChance(
  zone: string,
  hasActiveCombatMission: boolean,
  progresses?: Record<string, MissionProgress>,
  activeMissionId?: string | null,
  destSystemId?: string | null,
): number {
  let combatMissionBump = hasActiveCombatMission;
  if (progresses) {
    const lock = resolveQuestCombatLock(progresses, activeMissionId);
    if (shouldGuaranteeQuestTransitEncounter(lock, destSystemId)) return 1;
    if (lock && lock.venue !== 'transit') combatMissionBump = false;
  }
  const dest = destSystemId?.trim() || '';
  if (dest && TRANSIT_ENCOUNTER_SUPPRESS_DEST_SYSTEM_IDS.has(dest)) return 0;
  // 도착 성계의 아르카디아 홉이 확률을 정한다. zone(dest-org)는 쓰지 않는다.
  void zone;
  const base = dest
    ? resolveTransitHopDangerPolicyForSystem(dest).encounterChance
    : resolveTransitHopDangerPolicy(2).encounterChance;
  if (combatMissionBump) return Math.min(1, base + 0.4);
  return base;
}
