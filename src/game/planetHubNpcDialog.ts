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
import { ACKNOWLEDGED_HUB_DIALOG_KEYS_MAX, capBoundedStringList } from '../store/playerFlagBounds';
import { useMissionStore } from '../store/missionStore';
import { getMissionById } from '../missions/missionCatalog';
import {
  listAvailableQuestOfferCaptainIds,
  pickAvailableMainStoryMissionIdForCaptain,
  pickAvailableMainStoryOfferForPlanet,
  pickAvailableQuestMissionIdForCaptain,
  resolveMainStoryOfferDialogSceneId,
  resolveQuestMissionOfferState,
} from '../missions/barMissionBoard';
import { isMissionClearContactAtPlanet, shouldAssignClearContact } from '../missions/resolveMissionClearNpcContext';
import {
  resolveMissionContactPlanetIdForSystem,
  resolveBarHostCaptainIdAtPlanet,
} from '../missions/missionClearContactLookups';
import { isAnyNeighborReachMission } from '../missions/missionNeighborReach';
import { resolveMissionOfferOriginSystemId } from '../missions/missionNeighborReachLookups';
import { resolveSystemIdForPlanetIdFromGalaxy } from '../world/resolvePlanetSystemPosition';
import { resolveCurrentTalkNpcAt } from '../missions/talkNpcObjective';

/**
 * 메인 스토리 수락 대화 — 총사령관(talkPriority 2~3)·궤도 함장(1~5)보다 항상 우선.
 * spy_intel(-100)만 상위(planet.tsx 선행 오버라이드).
 */
const MAIN_STORY_DIALOG_PRIORITY = -50;
/** 활성 컨택 퀘스트 목적지 담당 — 오퍼레이터/일반 궤도보다 우선, 메인스토리보다 아래. */
const QUEST_CONTACT_DIALOG_PRIORITY = -40;
/** 현재 순서의 talk_npc 탐문 */
const TALK_NPC_DIALOG_PRIORITY = -45;
/** 수락 가능 sandbox 의뢰 — 궤도 없어도 허브 대화 주입. 탐문/메인보다 아래 */
const QUEST_OFFER_DIALOG_PRIORITY = -36;

export type PlanetHubDialogCandidateSource =
  | 'governor'
  | 'orbit_captain'
  | 'copresence'
  | 'spy_intel'
  | 'main_story'
  | 'quest_contact'
  | 'talk_npc'
  | 'quest_offer';

const SOURCE_TIEBREAK: Record<PlanetHubDialogCandidateSource, number> = {
  main_story: 0,
  quest_contact: 1,
  talk_npc: 1,
  quest_offer: 2,
  orbit_captain: 3,
  governor: 4,
  copresence: 5,
  spy_intel: 6,
};

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

function resolveMainStoryOfferSceneId(storyId: string, fallbackSceneId: string): string {
  const offerSceneId = resolveMainStoryOfferDialogSceneId(storyId);
  return getIngameDialogSceneById(offerSceneId) ? offerSceneId : fallbackSceneId;
}

/** missions.csv 제안 기준 — triggerId와 무관하게 메인 스토리 씬·우선순위 적용 */
function applyMainStoryDialogOfferOverlay(
  candidate: PlanetHubDialogCandidate,
  planetId: string,
): PlanetHubDialogCandidate {
  const playerLevel = usePlayerStore.getState().player?.level ?? 1;
  const progresses = useMissionStore.getState().progresses;
  const storyId = pickAvailableMainStoryMissionIdForCaptain(
    candidate.captainId,
    planetId,
    playerLevel,
    progresses,
  );
  if (!storyId) return candidate;

  return {
    ...candidate,
    source: candidate.source === 'governor' ? 'main_story' : candidate.source,
    sceneId: resolveMainStoryOfferSceneId(storyId, candidate.sceneId),
    priority: Math.min(candidate.priority, MAIN_STORY_DIALOG_PRIORITY),
  };
}

/**
 * 궤도에 없어도 행성에 수락 가능한 메인 스토리가 있으면 대화 버튼 후보로 주입.
 * (총사령관이 다른 예비 함장으로 바뀌어도 메인 퀘스트 NPC가 우선)
 */
function listPlanetMainStoryDialogCandidates(planetId: string): PlanetHubDialogCandidate[] {
  const playerLevel = usePlayerStore.getState().player?.level ?? 1;
  const progresses = useMissionStore.getState().progresses;
  const offer = pickAvailableMainStoryOfferForPlanet(planetId, playerLevel, progresses);
  if (!offer) return [];

  const indexed = CAPTAIN_DIALOG_INDEX.get(offer.offerCaptainId);
  const captain = getNpcCaptain(offer.offerCaptainId);
  const fallbackScene =
    indexed?.sceneId
    ?? (captain ? resolveNpcCaptainDialogSceneId(captain) : null)
    ?? resolveIngameDialogFallbackSceneId();

  return [{
    captainId: offer.offerCaptainId,
    source: 'main_story',
    priority: MAIN_STORY_DIALOG_PRIORITY,
    sceneId: resolveMainStoryOfferSceneId(offer.missionId, fallbackScene),
  }];
}

export function buildHubDialogQuestContactAckKey(captainId: string, missionId: string): string {
  return `hub_quest_contact:${captainId}:${missionId}`;
}

/** 이 행성에서 활성 컨택 퀘스트가 지정한 목적지 담당 missionId */
export function pickActiveContactQuestIdForCaptain(
  captainId: string,
  planetId: string,
): string | null {
  const progresses = useMissionStore.getState().progresses;
  const localHostId = resolveBarHostCaptainIdAtPlanet(planetId);
  const landedSystemId = resolveSystemIdForPlanetIdFromGalaxy(planetId);
  const ids = Object.keys(progresses);
  for (let i = 0; i < ids.length; i += 1) {
    const progress = progresses[ids[i]!]!;
    if (progress.status !== 'active') continue;
    const mission = getMissionById(progress.missionId);
    if (!mission) continue;
    if (isAnyNeighborReachMission(mission) && shouldAssignClearContact(mission)) {
      const origin = resolveMissionOfferOriginSystemId(mission);
      if (localHostId === captainId && landedSystemId && origin && landedSystemId !== origin) {
        return progress.missionId;
      }
      continue;
    }
    if (progress.assignedClearNpcCaptainId !== captainId) continue;
    if (
      isMissionClearContactAtPlanet(
        mission,
        captainId,
        planetId,
        resolveMissionContactPlanetIdForSystem,
        resolveBarHostCaptainIdAtPlanet,
      )
    ) {
      return progress.missionId;
    }
  }
  return null;
}

/**
 * 배달·접선 퀘스트의 목적지 담당만 허브 [대화]에 올린다.
 * 일반 퀘스트(오퍼레이터)는 여기 들어오지 않는다.
 */
function pushQuestContactCandidate(
  out: PlanetHubDialogCandidate[],
  seen: Set<string>,
  captainId: string,
): void {
  if (!captainId || seen.has(captainId)) return;
  const indexed = CAPTAIN_DIALOG_INDEX.get(captainId);
  const captain = getNpcCaptain(captainId);
  const sceneId =
    indexed?.sceneId
    ?? (captain ? resolveNpcCaptainDialogSceneId(captain) : null)
    ?? resolveIngameDialogFallbackSceneId();
  seen.add(captainId);
  out.push({
    sceneId,
    priority: QUEST_CONTACT_DIALOG_PRIORITY,
    captainId,
    source: 'quest_contact',
  });
}

function applyTalkNpcDialogOverlay(
  candidate: PlanetHubDialogCandidate,
  planetId: string,
): PlanetHubDialogCandidate {
  const talk = resolveCurrentTalkNpcAt(planetId, candidate.captainId);
  if (!talk) return candidate;
  const sceneId = getIngameDialogSceneById(talk.sceneId) ? talk.sceneId : candidate.sceneId;
  return {
    ...candidate,
    source: 'talk_npc',
    sceneId,
    priority: Math.min(candidate.priority, TALK_NPC_DIALOG_PRIORITY),
  };
}

function listPlanetSandboxOfferDialogCandidates(planetId: string): PlanetHubDialogCandidate[] {
  const playerLevel = usePlayerStore.getState().player?.level ?? 1;
  const progresses = useMissionStore.getState().progresses;
  const captainIds = listAvailableQuestOfferCaptainIds(planetId, playerLevel, progresses);
  const out: PlanetHubDialogCandidate[] = [];
  for (let i = 0; i < captainIds.length; i += 1) {
    const captainId = captainIds[i]!;
    const indexed = CAPTAIN_DIALOG_INDEX.get(captainId);
    const captain = getNpcCaptain(captainId);
    const sceneId =
      indexed?.sceneId
      ?? (captain ? resolveNpcCaptainDialogSceneId(captain) : null)
      ?? resolveIngameDialogFallbackSceneId();
    out.push({
      captainId,
      source: 'quest_offer',
      priority: QUEST_OFFER_DIALOG_PRIORITY,
      sceneId,
    });
  }
  return out;
}

function listPlanetTalkNpcDialogCandidates(planetId: string): PlanetHubDialogCandidate[] {
  const talk = resolveCurrentTalkNpcAt(planetId);
  if (!talk) return [];
  const indexed = CAPTAIN_DIALOG_INDEX.get(talk.captainId);
  const captain = getNpcCaptain(talk.captainId);
  const fallback =
    (getIngameDialogSceneById(talk.sceneId) ? talk.sceneId : null)
    ?? indexed?.sceneId
    ?? (captain ? resolveNpcCaptainDialogSceneId(captain) : null)
    ?? resolveIngameDialogFallbackSceneId();
  return [{
    captainId: talk.captainId,
    source: 'talk_npc',
    priority: TALK_NPC_DIALOG_PRIORITY,
    sceneId: fallback,
  }];
}

function listPlanetQuestContactDialogCandidates(planetId: string): PlanetHubDialogCandidate[] {
  const progresses = useMissionStore.getState().progresses;
  const out: PlanetHubDialogCandidate[] = [];
  const seen = new Set<string>();
  const landedSystemId = resolveSystemIdForPlanetIdFromGalaxy(planetId);
  const localHostId = resolveBarHostCaptainIdAtPlanet(planetId);
  const ids = Object.keys(progresses);
  for (let i = 0; i < ids.length; i += 1) {
    const progress = progresses[ids[i]!]!;
    if (progress.status !== 'active') continue;
    const mission = getMissionById(progress.missionId);
    if (!mission) continue;
    if (isAnyNeighborReachMission(mission) && shouldAssignClearContact(mission)) {
      const origin = resolveMissionOfferOriginSystemId(mission);
      if (localHostId && landedSystemId && origin && landedSystemId !== origin) {
        pushQuestContactCandidate(out, seen, localHostId);
      }
      continue;
    }
    const captainId = progress.assignedClearNpcCaptainId?.trim();
    if (!captainId) continue;
    if (
      !isMissionClearContactAtPlanet(
        mission,
        captainId,
        planetId,
        resolveMissionContactPlanetIdForSystem,
        resolveBarHostCaptainIdAtPlanet,
      )
    ) {
      continue;
    }
    pushQuestContactCandidate(out, seen, captainId);
  }
  return out;
}

/** 궤도·INFO에 표시 중인 전함 함장 id (단일 목록 기준) */
export function collectPlanetHubCaptainIds(
  orbitInfoRows: readonly NearbyOrbitPresenceRow[],
): string[] {
  const ids = new Set<string>();
  for (const row of orbitInfoRows) {
    if (row.captainId) {
      ids.add(row.captainId);
      continue;
    }
    const shipId = row.linkedCapitalShipId;
    if (!shipId) continue;
    const captain = getNpcCaptainByAssignedShipId(shipId);
    if (captain) ids.add(captain.id);
  }
  return [...ids];
}

export function comparePlanetHubDialogCandidates(
  a: PlanetHubDialogCandidate,
  b: PlanetHubDialogCandidate,
): number {
  if (a.priority !== b.priority) return a.priority - b.priority;
  return SOURCE_TIEBREAK[a.source] - SOURCE_TIEBREAK[b.source];
}

export function pickBestPlanetHubDialogCandidate(
  candidates: readonly PlanetHubDialogCandidate[],
): PlanetHubDialogCandidate | null {
  let best: PlanetHubDialogCandidate | null = null;
  for (const candidate of candidates) {
    if (!best) {
      best = candidate;
      continue;
    }
    if (candidate.priority < best.priority) {
      best = candidate;
      continue;
    }
    if (candidate.priority > best.priority) continue;
    if (SOURCE_TIEBREAK[candidate.source] < SOURCE_TIEBREAK[best.source]) {
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
 * 행성 허브 대화 후보 — 메인 스토리(행성 단위) > 총사령관 + 궤도 가시 함장.
 * co-presence는 badge만, scene pick 중복 없음.
 */
export function listPlanetHubDialogCandidates(
  planetId: string,
  presentCaptainIds: readonly string[],
): PlanetHubDialogCandidate[] {
  const candidates: PlanetHubDialogCandidate[] = [
    ...listPlanetMainStoryDialogCandidates(planetId),
    ...listPlanetTalkNpcDialogCandidates(planetId),
    ...listPlanetQuestContactDialogCandidates(planetId),
    ...listPlanetSandboxOfferDialogCandidates(planetId),
  ];
  const storyCaptainIds = new Set(candidates.map((c) => c.captainId));

  const governor = resolvePlanetGovernorDialogCandidate(planetId);
  if (governor && !storyCaptainIds.has(governor.captainId)) {
    candidates.push(
      applyTalkNpcDialogOverlay(
        applyMainStoryDialogOfferOverlay(
          {
            sceneId: governor.sceneId,
            priority: governor.priority,
            captainId: governor.captainId,
            source: 'governor',
          },
          planetId,
        ),
        planetId,
      ),
    );
  }

  for (const captainId of presentCaptainIds) {
    if (storyCaptainIds.has(captainId)) continue;
    const candidate = CAPTAIN_DIALOG_INDEX.get(captainId);
    if (candidate) {
      candidates.push(applyTalkNpcDialogOverlay(
        applyMainStoryDialogOfferOverlay(candidate, planetId),
        planetId,
      ));
    }
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

export function buildHubDialogMainStoryOfferAckKey(captainId: string, missionId: string): string {
  return `hub_main_story:${captainId}:${missionId}`;
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
      acknowledgedHubDialogKeys: capBoundedStringList(merged, ACKNOWLEDGED_HUB_DIALOG_KEYS_MAX),
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
  const storyMissionId = pickAvailableMainStoryMissionIdForCaptain(
    input.captainId,
    input.planetId,
    playerLevel,
    progresses,
  );
  if (storyMissionId) {
    keys.add(buildHubDialogMainStoryOfferAckKey(input.captainId, storyMissionId));
  }
  const questMissionId = pickAvailableQuestMissionIdForCaptain(
    input.captainId,
    input.planetId,
    playerLevel,
    progresses,
  );
  if (questMissionId) {
    keys.add(buildHubDialogQuestOfferAckKey(input.captainId, questMissionId));
  }
  const contactMissionId = pickActiveContactQuestIdForCaptain(input.captainId, input.planetId);
  if (contactMissionId) {
    keys.add(buildHubDialogQuestContactAckKey(input.captainId, contactMissionId));
  }
  return [...keys];
}

export function resolveCoPresenceInitiatedBadge(
  target: PlanetHubDialogCandidate,
  planetId: string,
  coPresenceHints: readonly PlanetHubCoPresenceBadgeHint[],
): boolean {
  const playerLevel = usePlayerStore.getState().player?.level ?? 1;
  const progresses = useMissionStore.getState().progresses;
  const storyMissionId = pickAvailableMainStoryMissionIdForCaptain(
    target.captainId,
    planetId,
    playerLevel,
    progresses,
  );
  if (
    storyMissionId
    && !isHubDialogBadgeAcknowledged(
      buildHubDialogMainStoryOfferAckKey(target.captainId, storyMissionId),
    )
  ) {
    return true;
  }

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

  const contactMissionId = pickActiveContactQuestIdForCaptain(target.captainId, planetId);
  if (
    contactMissionId
    && !isHubDialogBadgeAcknowledged(buildHubDialogQuestContactAckKey(target.captainId, contactMissionId))
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
 * 스캔 후 대화 버튼 — 우선순위 NPC + 선제 대화 배지 (메인스토리·co-presence·once 씬·event 트리거).
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
 * 대화 종료 시 미션 수락 — 메인 스토리 우선, 없으면 서브(의뢰).
 * 1) 수락 가능 story_* (offerCaptain / offerPlanet)
 * 2) npc_ai_captains.mainStageMissionTriggerId (sandbox 등, available일 때만)
 * 3) missions.csv offerCaptainId + offerPlanetId (sandbox)
 */
export function resolvePlanetHubNpcTalkCompletionActions(
  captainId: string,
  planetId: string,
): IngameDialogCompletionAction[] {
  const playerLevel = usePlayerStore.getState().player?.level ?? 1;
  const progresses = useMissionStore.getState().progresses;

  const actions: IngameDialogCompletionAction[] = [];
  const talk = resolveCurrentTalkNpcAt(planetId, captainId);
  if (talk) {
    actions.push({
      type: 'complete_talk_npc',
      captainId,
      planetId,
    });
  }

  const storyId = pickAvailableMainStoryMissionIdForCaptain(
    captainId,
    planetId,
    playerLevel,
    progresses,
  );
  if (storyId) {
    actions.push({
      type: 'accept_main_story_mission',
      missionId: storyId,
      planetId,
      expectCaptainId: captainId,
    });
    return actions;
  }

  const captain = getNpcCaptain(captainId);
  const overrideId = String(captain?.mainStageMissionTriggerId ?? '').trim();

  if (overrideId) {
    const mission = getMissionById(overrideId);
    if (mission) {
      const state = resolveQuestMissionOfferState(mission, playerLevel, progresses[overrideId]);
      if (
        state === 'available'
        && (!mission.offerCaptainId || mission.offerCaptainId === captainId)
        && (!mission.offerPlanetId || mission.offerPlanetId === planetId)
      ) {
        actions.push({
          type: 'accept_quest_mission',
          missionId: overrideId,
          planetId,
          expectCaptainId: captainId,
        });
        return actions;
      }
    }
  }

  const questMissionId = pickAvailableQuestMissionIdForCaptain(
    captainId,
    planetId,
    playerLevel,
    progresses,
  );
  if (questMissionId) {
    actions.push({
      type: 'accept_quest_mission',
      missionId: questMissionId,
      planetId,
      expectCaptainId: captainId,
    });
  }
  return actions;
}

/**
 * INFO 통신 수락 뒤 — 예전 허브 [대화] 명단과 같은 메인퀘/탐문/컨택 대사를 열지 여부.
 * 일반 궤도 통신·함장 개인미션과 분리한다.
 */
export function shouldPresentPlanetHubQuestTalkAfterComm(
  captainId: string,
  planetId: string,
): boolean {
  const cid = captainId.trim();
  const pid = planetId.trim();
  if (!cid || !pid) return false;

  const actions = resolvePlanetHubNpcTalkCompletionActions(cid, pid);
  for (let i = 0; i < actions.length; i += 1) {
    const type = actions[i]!.type;
    if (
      type === 'accept_main_story_mission'
      || type === 'accept_quest_mission'
      || type === 'complete_talk_npc'
    ) {
      return true;
    }
  }

  const candidates = listPlanetHubDialogCandidates(pid, [cid]);
  for (let i = 0; i < candidates.length; i += 1) {
    const row = candidates[i]!;
    if (row.captainId !== cid) continue;
    if (row.source === 'main_story' || row.source === 'talk_npc' || row.source === 'quest_contact') {
      return true;
    }
  }
  return false;
}
