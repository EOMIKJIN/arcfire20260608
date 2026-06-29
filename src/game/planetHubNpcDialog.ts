import { listNpcCaptains, getNpcCaptain, getNpcCaptainByAssignedShipId } from '../npc/npcFleetRegistry';
import type { NearbyOrbitPresenceRow } from '../npc/nearbyOrbitPresenceSystem';
import {
  resolveIngameDialogFallbackSceneId,
  resolveNpcCaptainDialogSceneId,
} from './ingameDialog/resolveNpcCaptainDialogSceneId';
import { getIngameDialogSceneById } from './ingameDialog/ingameDialogSceneIndex';
import type { IngameDialogCompletionAction } from './ingameDialog/ingameDialogTypes';
import { resolvePlanetGovernorDialogCandidate } from './planetGovernor/planetGovernorRegistry';
import { usePlayerStore } from '../store/playerStore';
import { useMissionStore } from '../store/missionStore';
import { getMissionById } from '../missions/missionCatalog';
import {
  pickAvailableQuestMissionIdForCaptain,
  resolveQuestMissionOfferState,
} from '../missions/tavernMissionBoard';

export type PlanetHubDialogCandidateSource = 'governor' | 'orbit_captain' | 'copresence' | 'spy_intel';

export type PlanetHubDialogCandidate = {
  sceneId: string;
  /** 숫자 낮을수록 우선 (CSV mainStageTalkPriority) */
  priority: number;
  captainId: string;
  source: PlanetHubDialogCandidateSource;
};

export type PlanetHubNpcDialogTarget = PlanetHubDialogCandidate & {
  /** 스캔 후 대화 타일 확인 배지 — co-presence 긴장·NPC 선제 대화 힌트 */
  showInitiatedBadge: boolean;
};

const CAPTAIN_DIALOG_INDEX: Map<string, PlanetHubDialogCandidate> = (() => {
  const map = new Map<string, PlanetHubDialogCandidate>();
  for (const captain of listNpcCaptains()) {
    if (!captain.mainStageTalkEnabled) continue;
    const sceneId = resolveNpcCaptainDialogSceneId(captain);
    if (!sceneId) continue;
    map.set(captain.id, {
      sceneId,
      priority: captain.mainStageTalkPriority,
      captainId: captain.id,
      source: 'orbit_captain',
    });
  }
  return map;
})();

function isDialogSceneUnseenOnce(sceneId: string): boolean {
  const scene = getIngameDialogSceneById(sceneId);
  if (!scene || scene.triggerRepeat !== 'once') return false;
  const seen = usePlayerStore.getState().player?.flags.seenStorySceneIds ?? [];
  return !seen.includes(sceneId);
}

/** 궤도·INFO에 표시 중인 전함 함장 id (단일 목록 기준) */
export function collectPlanetHubCaptainIds(
  orbitInfoRows: readonly NearbyOrbitPresenceRow[],
): string[] {
  const ids = new Set<string>();
  for (const row of orbitInfoRows) {
    const shipId = row.linkedCapitalShipId;
    if (!shipId) continue;
    const captain = getNpcCaptainByAssignedShipId(shipId);
    if (captain) ids.add(captain.id);
  }
  return [...ids];
}

export function pickBestPlanetHubDialogCandidate(
  candidates: readonly PlanetHubDialogCandidate[],
): PlanetHubDialogCandidate | null {
  let best: PlanetHubDialogCandidate | null = null;
  for (const candidate of candidates) {
    if (!best || candidate.priority < best.priority) {
      best = candidate;
    }
  }
  return best;
}

/** co-presence 쌍 — 두 함장 중 대화 가능·우선순위 높은 scene (단일 pick 규칙) */
export function pickBestDialogSceneForCaptainPair(
  captainIdA: string,
  captainIdB: string,
): string | null {
  const candidates: PlanetHubDialogCandidate[] = [];
  const a = CAPTAIN_DIALOG_INDEX.get(captainIdA);
  const b = CAPTAIN_DIALOG_INDEX.get(captainIdB);
  if (a) candidates.push(a);
  if (b) candidates.push(b);
  return pickBestPlanetHubDialogCandidate(candidates)?.sceneId ?? null;
}

/**
 * 행성 허브 대화 후보 — 총사령관 + 궤도 가시 함장 (co-presence는 badge만, scene pick 중복 없음).
 */
export function listPlanetHubDialogCandidates(
  planetId: string,
  presentCaptainIds: readonly string[],
): PlanetHubDialogCandidate[] {
  const candidates: PlanetHubDialogCandidate[] = [];

  const governor = resolvePlanetGovernorDialogCandidate(planetId);
  if (governor) {
    candidates.push({
      sceneId: governor.sceneId,
      priority: governor.priority,
      captainId: governor.captainId,
      source: 'governor',
    });
  }

  for (const captainId of presentCaptainIds) {
    const candidate = CAPTAIN_DIALOG_INDEX.get(captainId);
    if (candidate) candidates.push(candidate);
  }

  return candidates;
}

export type PlanetHubCoPresenceBadgeHint = {
  kind: 'dialog_tension' | 'dialog_neutral';
  captainIdA: string;
  captainIdB: string;
  interactionInstanceKey?: string;
};

export function buildHubDialogCaptainAckKey(planetId: string, captainId: string): string {
  return `hub_dialog:${planetId}:${captainId}`;
}

export function buildHubDialogCoPresenceAckKey(interactionInstanceKey: string): string {
  return `hub_copresence:${interactionInstanceKey}`;
}

export function buildHubDialogQuestOfferAckKey(captainId: string, missionId: string): string {
  return `hub_quest:${captainId}:${missionId}`;
}

function isHubDialogBadgeAcknowledged(key: string): boolean {
  const keys = usePlayerStore.getState().player?.flags.acknowledgedHubDialogKeys ?? [];
  return keys.includes(key);
}

/** 대화 종료 후 레드점 해제 — planet.tsx onDismiss에서 호출 */
export function markHubDialogBadgeAcknowledged(keys: readonly string[]): void {
  const snapshot = usePlayerStore.getState().player;
  if (!snapshot || keys.length === 0) return;
  const prev = snapshot.flags.acknowledgedHubDialogKeys ?? [];
  const merged = [...prev];
  let changed = false;
  for (const key of keys) {
    if (!key || merged.includes(key)) continue;
    merged.push(key);
    changed = true;
  }
  if (!changed) return;
  usePlayerStore.getState().setPlayer({
    ...snapshot,
    flags: {
      ...snapshot.flags,
      acknowledgedHubDialogKeys: merged,
    },
  });
  void usePlayerStore.getState().persist();
}

export function collectHubDialogBadgeAckKeysForTalk(input: {
  planetId: string;
  captainId: string;
  sceneId: string;
  coPresenceHints: readonly PlanetHubCoPresenceBadgeHint[];
}): string[] {
  const keys = new Set<string>([
    `hub_dialog_scene:${input.sceneId}`,
  ]);
  for (const hint of input.coPresenceHints) {
    if (hint.captainIdA !== input.captainId && hint.captainIdB !== input.captainId) continue;
    if (hint.interactionInstanceKey) {
      keys.add(buildHubDialogCoPresenceAckKey(hint.interactionInstanceKey));
    }
  }
  const playerLevel = usePlayerStore.getState().player?.level ?? 1;
  const progresses = useMissionStore.getState().progresses;
  const questMissionId = pickAvailableQuestMissionIdForCaptain(
    input.captainId,
    input.planetId,
    playerLevel,
    progresses,
  );
  if (questMissionId) {
    keys.add(buildHubDialogQuestOfferAckKey(input.captainId, questMissionId));
  }
  return [...keys];
}

function resolveCoPresenceInitiatedBadge(
  target: PlanetHubDialogCandidate,
  planetId: string,
  coPresenceHints: readonly PlanetHubCoPresenceBadgeHint[],
): boolean {
  const playerLevel = usePlayerStore.getState().player?.level ?? 1;
  const progresses = useMissionStore.getState().progresses;
  const questMissionId = pickAvailableQuestMissionIdForCaptain(
    target.captainId,
    planetId,
    playerLevel,
    progresses,
  );
  if (
    questMissionId
    && !isHubDialogBadgeAcknowledged(buildHubDialogQuestOfferAckKey(target.captainId, questMissionId))
  ) {
    return true;
  }

  for (const hint of coPresenceHints) {
    if (hint.kind !== 'dialog_tension') continue;
    if (hint.captainIdA !== target.captainId && hint.captainIdB !== target.captainId) continue;
    const ackKey = hint.interactionInstanceKey
      ? buildHubDialogCoPresenceAckKey(hint.interactionInstanceKey)
      : null;
    if (!ackKey || !isHubDialogBadgeAcknowledged(ackKey)) return true;
  }

  if (isDialogSceneUnseenOnce(target.sceneId)) return true;

  const captain = getNpcCaptain(target.captainId);
  const eventTriggerId = String(captain?.mainStageEventTriggerId ?? '').trim();
  if (eventTriggerId && !isHubDialogBadgeAcknowledged(`hub_event:${target.captainId}:${eventTriggerId}`)) {
    return true;
  }

  return false;
}

/**
 * 스캔 후 대화 버튼 — 우선순위 NPC + 선제 대화 배지 (co-presence·once 씬·event 트리거).
 */
export function resolvePlanetHubNpcDialogTarget(
  planetId: string,
  presentCaptainIds: readonly string[],
  coPresenceHints: readonly PlanetHubCoPresenceBadgeHint[] = [],
): PlanetHubNpcDialogTarget | null {
  const best = pickBestPlanetHubDialogCandidate(
    listPlanetHubDialogCandidates(planetId, presentCaptainIds),
  );
  if (!best) return null;
  return {
    ...best,
    showInitiatedBadge: resolveCoPresenceInitiatedBadge(best, planetId, coPresenceHints),
  };
}

/**
 * 메인스테이지 대화 버튼 — 우선순위(숫자 낮음) 최고 NPC 대화 씬.
 */
export function resolvePlanetHubNpcDialogSceneId(
  planetId: string,
  presentCaptainIds: readonly string[],
): string {
  const target = resolvePlanetHubNpcDialogTarget(planetId, presentCaptainIds);
  if (target) return target.sceneId;
  return resolveIngameDialogFallbackSceneId();
}

/**
 * 대화 종료 시 인스턴스 미션 수락 — 선술집과 동일 offer·state 정본.
 * 1) npc_ai_captains.mainStageMissionTriggerId (명시 오버라이드)
 * 2) missions.csv offerCaptainId + offerPlanetId (Table-First 기본)
 * available 상태일 때만 completion action 부착.
 */
export function resolvePlanetHubNpcTalkCompletionActions(
  captainId: string,
  planetId: string,
): IngameDialogCompletionAction[] {
  const playerLevel = usePlayerStore.getState().player?.level ?? 1;
  const progresses = useMissionStore.getState().progresses;

  const captain = getNpcCaptain(captainId);
  const overrideId = String(captain?.mainStageMissionTriggerId ?? '').trim();

  let missionId: string | null = overrideId || null;
  if (!missionId) {
    missionId = pickAvailableQuestMissionIdForCaptain(
      captainId,
      planetId,
      playerLevel,
      progresses,
    );
  } else {
    const mission = getMissionById(missionId);
    if (!mission) return [];
    const state = resolveQuestMissionOfferState(mission, playerLevel, progresses[missionId]);
    if (state !== 'available') return [];
    if (mission.offerCaptainId && mission.offerCaptainId !== captainId) return [];
    if (mission.offerPlanetId && mission.offerPlanetId !== planetId) return [];
  }

  if (!missionId) return [];
  return [{ type: 'accept_quest_mission', missionId, planetId, expectCaptainId: captainId }];
}
