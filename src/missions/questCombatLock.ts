/**
 * 퀘스트 전투 락 — persist 없음. progress에서 동기 재계산.
 * 정본: docs/QUEST_COMBAT_PRIORITY_LANE_DESIGN.md
 */

import type { Mission, MissionProgress } from '../types';
import { MISSIONS_FROM_CSV } from '../data/generated/csvMissions';
import { MISSION_QUEST_COMBAT_OPS_FROM_CSV } from '../data/generated/csvMissionQuestCombatOps';
import {
  PlayScenarioZonePlanets_FROM_BALANCE_CSV,
  SynthSystemColonization_FROM_BALANCE_CSV,
} from '../data/balance/generated';
import { resolvePlanetTargetCombatLevel } from '../arcCore/balance/balanceTableRegistry';
import { missionTrackHudPriority, resolveMissionTrack } from './missionTrack';

export const QUEST_COMBAT_VENUES = ['transit', 'hub_orbit', 'wave_assault'] as const;
export type QuestCombatVenue = (typeof QUEST_COMBAT_VENUES)[number];

export const QUEST_COMBAT_ENCOUNTER_POLICIES = [
  'transit_guaranteed',
  'transit_toward_anchor',
  'hub_orbit',
  'wave_assault',
] as const;
export type QuestCombatEncounterPolicy = (typeof QUEST_COMBAT_ENCOUNTER_POLICIES)[number];

export type QuestCombatLock = {
  missionId: string;
  objectiveId: string;
  templateId: string;
  venue: QuestCombatVenue;
  encounterPolicy: QuestCombatEncounterPolicy;
  anchorPlanetId: string | null;
};

const combatOpByObjectiveId = new Map(
  MISSION_QUEST_COMBAT_OPS_FROM_CSV.map((row) => [row.objectiveId, row]),
);

/** 시나리오 주 행성 → 성계. galaxy100/RN 초상 경로를 타지 않음(노드 테스트 안전). */
let systemIdByQuestAnchorPlanet: Map<string, string> | null = null;

function getSystemIdByQuestAnchorPlanet(): Map<string, string> {
  if (systemIdByQuestAnchorPlanet) return systemIdByQuestAnchorPlanet;
  const map = new Map<string, string>();
  for (const row of PlayScenarioZonePlanets_FROM_BALANCE_CSV) {
    const planetId = String(row.primaryPlanetId ?? '').trim();
    const systemId = String(row.systemId ?? '').trim();
    if (planetId && systemId) map.set(planetId, systemId);
  }
  for (const row of SynthSystemColonization_FROM_BALANCE_CSV) {
    const systemId = String(row.synthSystemId ?? '').trim();
    if (systemId) map.set(`${systemId}_p`, systemId);
  }
  systemIdByQuestAnchorPlanet = map;
  return map;
}

export function resolveQuestAnchorSystemId(planetId: string | null | undefined): string | null {
  const id = planetId?.trim() || '';
  if (!id) return null;
  return getSystemIdByQuestAnchorPlanet().get(id) ?? null;
}

const POLICY_TO_VENUE: Record<QuestCombatEncounterPolicy, QuestCombatVenue> = {
  transit_guaranteed: 'transit',
  transit_toward_anchor: 'transit',
  hub_orbit: 'hub_orbit',
  wave_assault: 'wave_assault',
};

export function parseQuestCombatEncounterPolicy(
  raw: string | null | undefined,
): QuestCombatEncounterPolicy | null {
  const policy = String(raw ?? '').trim();
  if (policy === 'transit_guaranteed') return 'transit_guaranteed';
  if (policy === 'transit_toward_anchor') return 'transit_toward_anchor';
  if (policy === 'hub_orbit') return 'hub_orbit';
  if (policy === 'wave_assault') return 'wave_assault';
  return null;
}

export function mapQuestCombatPolicyToVenue(
  policy: QuestCombatEncounterPolicy,
): QuestCombatVenue {
  return POLICY_TO_VENUE[policy];
}

function lookupMissionForQuestLock(missionId: string): Mission | undefined {
  const fromCsv = MISSIONS_FROM_CSV[missionId];
  if (fromCsv) return fromCsv;
  if (missionId.startsWith('arc_inst_') || missionId.startsWith('cp_')) {
    // 인스턴스/개인 미션만 catalog — 노드 테스트는 CSV 행만 씀
    const { getMissionById } = require('./missionCatalog') as typeof import('./missionCatalog');
    return getMissionById(missionId);
  }
  return undefined;
}

type QuestLockBundle = {
  mission: Mission;
  progress: MissionProgress;
};

function listActiveQuestLockBundles(
  progresses: Record<string, MissionProgress>,
): QuestLockBundle[] {
  const rows: QuestLockBundle[] = [];
  for (const progress of Object.values(progresses)) {
    if (progress.status !== 'active') continue;
    const mission = lookupMissionForQuestLock(progress.missionId);
    if (!mission) continue;
    rows.push({ mission, progress });
  }
  return rows;
}

function resolveLockAnchorPlanetId(
  objectiveId: string,
  missionOfferPlanetId: string | null | undefined,
): string | null {
  const op = combatOpByObjectiveId.get(objectiveId);
  const fromOp = op?.anchorPlanetId?.trim() || '';
  if (fromOp) return fromOp;
  const fromOffer = missionOfferPlanetId?.trim() || '';
  return fromOffer || null;
}

function incompleteDefeatOnBundle(
  bundle: QuestLockBundle,
): { objectiveId: string; templateId: string; policy: QuestCombatEncounterPolicy } | null {
  for (const objective of bundle.mission.objectives) {
    if (objective.type !== 'defeat_enemy') continue;
    if (bundle.progress.objectives[objective.id] === true) continue;
    const op = combatOpByObjectiveId.get(objective.id);
    const policy = parseQuestCombatEncounterPolicy(op?.encounterPolicy);
    if (!policy) continue;
    const templateId = objective.targetId?.trim() || '';
    if (!templateId) continue;
    return { objectiveId: objective.id, templateId, policy };
  }
  return null;
}

function lockFromBundle(
  bundle: QuestLockBundle,
  picked: { objectiveId: string; templateId: string; policy: QuestCombatEncounterPolicy },
): QuestCombatLock {
  return {
    missionId: bundle.mission.id,
    objectiveId: picked.objectiveId,
    templateId: picked.templateId,
    venue: mapQuestCombatPolicyToVenue(picked.policy),
    encounterPolicy: picked.policy,
    anchorPlanetId: resolveLockAnchorPlanetId(picked.objectiveId, bundle.mission.offerPlanetId),
  };
}

/**
 * 활성 미완료 defeat_enemy 1건.
 * 핀 미션 우선 → 트랙(tutorial > main_story > quest) → 번들 순.
 */
export function resolveQuestCombatLock(
  progresses: Record<string, MissionProgress>,
  activeMissionId?: string | null,
): QuestCombatLock | null {
  const bundles = listActiveQuestLockBundles(progresses);
  if (bundles.length === 0) return null;

  const pinId = activeMissionId?.trim() || '';
  if (pinId) {
    const pinned = bundles.find((bundle) => bundle.mission.id === pinId);
    if (pinned) {
      const picked = incompleteDefeatOnBundle(pinned);
      if (picked) return lockFromBundle(pinned, picked);
    }
  }

  let best: { bundle: QuestLockBundle; picked: NonNullable<ReturnType<typeof incompleteDefeatOnBundle>>; rank: number } | null = null;
  for (const bundle of bundles) {
    const picked = incompleteDefeatOnBundle(bundle);
    if (!picked) continue;
    const rank = missionTrackHudPriority(resolveMissionTrack(bundle.mission.id));
    if (!best || rank < best.rank) {
      best = { bundle, picked, rank };
    }
  }
  return best ? lockFromBundle(best.bundle, best.picked) : null;
}

export function isQuestHubOrbitLockAtPlanet(
  lock: QuestCombatLock | null,
  planetId: string | null | undefined,
): boolean {
  if (!lock || lock.venue !== 'hub_orbit') return false;
  const pid = planetId?.trim() || '';
  return Boolean(pid && lock.anchorPlanetId === pid);
}

export function shouldGuaranteeQuestTransitEncounter(
  lock: QuestCombatLock | null,
  destSystemId?: string | null,
): boolean {
  if (!lock || lock.venue !== 'transit') return false;
  if (lock.encounterPolicy === 'transit_guaranteed') return true;
  if (lock.encounterPolicy !== 'transit_toward_anchor') return false;
  const dest = destSystemId?.trim() || '';
  if (!dest || !lock.anchorPlanetId) return false;
  return resolveQuestAnchorSystemId(lock.anchorPlanetId) === dest;
}

export function shouldHoldWaveForQuestHubOrbit(
  lock: QuestCombatLock | null,
  planetId: string | null | undefined,
): boolean {
  return isQuestHubOrbitLockAtPlanet(lock, planetId);
}

export function resolveQuestLockTransitEncounterLevel(
  lock: QuestCombatLock | null,
  playerLevel: number | null | undefined,
): number | null {
  if (!lock || lock.venue !== 'transit' || !lock.anchorPlanetId) return null;
  const tcl = resolvePlanetTargetCombatLevel(lock.anchorPlanetId);
  if (playerLevel == null || !Number.isFinite(Number(playerLevel))) return tcl;
  return Math.min(tcl, Math.max(1, Math.floor(Number(playerLevel))));
}

export function resolveQuestLockTransitHullPlanetId(
  lock: QuestCombatLock | null,
): string | null {
  if (!lock || lock.venue !== 'transit') return null;
  return lock.anchorPlanetId;
}

export function canCompleteQuestDefeatEnemy(
  lock: QuestCombatLock | null,
  opts: {
    venue: QuestCombatVenue;
    enemyTemplateId?: string | null;
    planetId?: string | null;
  },
): boolean {
  if (!lock) return false;
  if (lock.venue !== opts.venue) return false;
  const templateId = opts.enemyTemplateId?.trim() || '';
  if (!templateId || templateId !== lock.templateId) return false;
  if (lock.venue === 'transit') return true;
  const planetId = opts.planetId?.trim() || '';
  return Boolean(planetId && lock.anchorPlanetId && planetId === lock.anchorPlanetId);
}

export function resolveQuestCombatAnchorFromLock(
  progresses: Record<string, MissionProgress>,
  activeMissionId: string | null | undefined,
  fallbackPlanetId: string | null | undefined,
): string | null {
  const lock = resolveQuestCombatLock(progresses, activeMissionId);
  if (lock?.anchorPlanetId) return lock.anchorPlanetId;
  if (lock) {
    const mission = lookupMissionForQuestLock(lock.missionId);
    if (mission?.offerPlanetId) return mission.offerPlanetId;
  }
  return fallbackPlanetId ?? null;
}
