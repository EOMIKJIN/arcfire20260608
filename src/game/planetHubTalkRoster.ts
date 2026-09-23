import { t } from '../i18n';
import { resolveNpcCaptainDisplayNameNow } from '../i18n/captainText';
import { getNpcCaptain } from '../npc/npcFleetRegistry';
import { presentIngameDialogScene } from './ingameDialog/ingameDialogApi';
import { resolveNpcCaptainDialogSceneId } from './ingameDialog/resolveNpcCaptainDialogSceneId';
import { getMissionById } from '../missions/missionCatalog';
import { tryPresentPendingMissionClearDialog } from '../missions/presentPendingMissionClearDialog';
import { shouldAssignClearContact } from '../missions/resolveMissionClearNpcContext';
import { isAnyNeighborReachMission } from '../missions/missionNeighborReach';
import { resolveMissionOfferOriginSystemId } from '../missions/missionNeighborReachLookups';
import { resolveBarHostCaptainAtPlanet } from '../arcCore/captainPresence/resolveBarHostCaptainAtPlanet';
import { resolveSystemIdForPlanetIdFromGalaxy } from '../world/resolvePlanetSystemPosition';
import { useMissionStore } from '../store/missionStore';
import {
  collectHubDialogBadgeAckKeysForTalk,
  comparePlanetHubDialogCandidates,
  listPlanetHubDialogCandidates,
  markHubDialogBadgeAcknowledged,
  resolveCoPresenceInitiatedBadge,
  resolvePlanetHubNpcTalkCompletionActions,
  shouldPresentPlanetHubQuestTalkAfterComm,
  type PlanetHubCoPresenceBadgeHint,
  type PlanetHubDialogCandidate,
} from './planetHubNpcDialog';
import {
  presentPlanetHubSpyIntelDialog,
  resolvePlanetHubSpyIntelDialogTarget,
} from './planetHubSpyIntelDialog';
import {
  dismissNearbyPresenceInfoOverlay,
  HUB_TALK_ROSTER_OVERLAY_ID,
  useArcOverlayStore,
  type ArcOverlayHubTalkRosterRow,
} from '../ui/overlay/arcOverlayStore';
import { presentArcCoreBackchannel } from '../arcCore/chat/presentArcCoreBackchannel';
import {
  consumeInboundTalkPending,
  peekInboundTalkPending,
} from '../arcCore/chat/arcCoreInboundTalkPending';
import { peekStellaLifeAskPending } from '../arcCore/chat/stellaLifeAskPending';
import { isArcCoreAgentSurfaceOpen } from '../arcCore/chat/arcCoreAgentSurfaceStore';
import {
  parkArcCoreAgentForIngameDialog,
  scheduleResumeArcCoreAgentAfterIngameDialog,
} from '../arcCore/chat/resumeArcCoreAgentAfterIngameDialog';
import { useArcCoreChatStore } from '../store/arcCoreChatStore';
import { isIngameDialogActive } from './ingameDialog/ingameDialogApi';
import { presentOperatorInboundFirstComm } from './conversation/presentOperatorInboundFirstComm';
import { presentStellaLifeAskComm } from '../arcCore/chat/presentStellaLifeAskComm';
import {
  getArcCoreChatSpeakerRow,
  getOperatorNlCaptainId,
} from '../arcCore/chat/arcCoreChatTableIndex';
import { isArcCoreOriginPlayerTalkUnlocked } from '../arcCore/chat/arcCoreOriginTalkUnlock';
import { resolveDictionaryLocale } from '../i18n';
import { useAppSettingsStore } from '../store/appSettingsStore';

export const PLANET_HUB_TALK_ROSTER_MAX = 16;

const SOURCE_SUBTITLE: Record<string, string> = {
  main_story: 'hubTalk.reason.main_story',
  orbit_captain: 'hubTalk.reason.orbit_captain',
  governor: 'hubTalk.reason.governor',
  spy_intel: 'hubTalk.reason.spy_intel',
  copresence: 'hubTalk.reason.copresence',
  quest_contact: 'hubTalk.reason.quest_contact',
  talk_npc: 'hubTalk.reason.talk_npc',
};

function tryPresentBarNeighborMissionClear(planetId: string, captainId: string): boolean {
  const host = resolveBarHostCaptainAtPlanet(planetId);
  if (!host || host.id !== captainId) return false;
  const landedSystemId = resolveSystemIdForPlanetIdFromGalaxy(planetId);
  const store = useMissionStore.getState();
  const pending = store.pendingMissionClearDialog;
  if (pending) {
    const pendingMission = getMissionById(pending.missionId);
    if (
      pendingMission
      && isAnyNeighborReachMission(pendingMission)
      && shouldAssignClearContact(pendingMission)
    ) {
      return tryPresentPendingMissionClearDialog();
    }
  }
  const ids = Object.keys(store.progresses);
  for (let i = 0; i < ids.length; i += 1) {
    const progress = store.progresses[ids[i]!]!;
    if (progress.status !== 'active') continue;
    const mission = getMissionById(progress.missionId);
    if (!mission || !isAnyNeighborReachMission(mission) || !shouldAssignClearContact(mission)) {
      continue;
    }
    const origin = resolveMissionOfferOriginSystemId(mission);
    if (origin && landedSystemId === origin) continue;
    let allDone = mission.objectives.length > 0;
    for (let j = 0; j < mission.objectives.length; j += 1) {
      if (!progress.objectives[mission.objectives[j]!.id]) {
        allDone = false;
        break;
      }
    }
    if (!allDone) continue;
    if (!store.requeueMissionClearDialogIfReady(progress.missionId)) continue;
    return tryPresentPendingMissionClearDialog();
  }
  return false;
}

type RosterSession = {
  planetId: string;
  hints: readonly PlanetHubCoPresenceBadgeHint[];
  captainIds: readonly string[];
};

let lastRosterSession: RosterSession | null = null;

export function rememberPlanetHubTalkRosterSession(
  planetId: string,
  presentCaptainIds: readonly string[],
  hints: readonly PlanetHubCoPresenceBadgeHint[] = [],
): void {
  lastRosterSession = { planetId, hints, captainIds: presentCaptainIds };
}

function sourceSubtitle(source: string): string {
  const key = SOURCE_SUBTITLE[source];
  return key ? t(key) : t('hubTalk.reason.orbit_captain');
}

function toNpcRow(
  candidate: PlanetHubDialogCandidate,
  planetId: string,
  hints: readonly PlanetHubCoPresenceBadgeHint[],
): ArcOverlayHubTalkRosterRow {
  const captain = getNpcCaptain(candidate.captainId);
  const displayName = resolveNpcCaptainDisplayNameNow(captain) || candidate.captainId;
  const spy = candidate.source === 'spy_intel';
  return {
    rowKey: `npc:${candidate.captainId}`,
    kind: 'npc',
    displayName,
    subtitle: sourceSubtitle(candidate.source),
    showInitiatedBadge: spy || resolveCoPresenceInitiatedBadge(candidate, planetId, hints),
    captainId: candidate.captainId,
    sceneId: candidate.sceneId,
    source: candidate.source,
  };
}

export function listPlanetHubTalkRosterRows(
  planetId: string,
  presentCaptainIds: readonly string[],
  hints: readonly PlanetHubCoPresenceBadgeHint[] = [],
): ArcOverlayHubTalkRosterRow[] {
  const locale = resolveDictionaryLocale(useAppSettingsStore.getState().locale);
  const operator = getArcCoreChatSpeakerRow('operator');
  const origin = getArcCoreChatSpeakerRow('arc_core');
  // 플레이어 선제 NL은 오퍼레이터만. 근원체 명단은 스토리 이벤트 해금 후.
  const rows: ArcOverlayHubTalkRosterRow[] = [
    {
      rowKey: 'operator',
      kind: 'operator',
      displayName: locale === 'en'
        ? (operator?.displayNameEn || operator?.displayNameKo || t('conversation.operatorName'))
        : (operator?.displayNameKo || t('conversation.operatorName')),
      subtitle: t('hubTalk.operatorSubtitle'),
      showInitiatedBadge: false,
    },
  ];
  if (isArcCoreOriginPlayerTalkUnlocked()) {
    rows.push({
      rowKey: 'arc_core',
      kind: 'arc_core',
      displayName: locale === 'en'
        ? (origin?.displayNameEn || t('arcCoreShadow.boss.concealedName'))
        : (origin?.displayNameKo || t('arcCoreShadow.boss.concealedName')),
      subtitle: t('hubTalk.arcCoreSubtitle'),
      showInitiatedBadge: false,
    });
  }

  const npc: PlanetHubDialogCandidate[] = [];
  const seen = new Set<string>();
  const operatorCaptainId = getOperatorNlCaptainId();
  const spy = resolvePlanetHubSpyIntelDialogTarget(planetId);
  if (spy && spy.captainId !== operatorCaptainId) {
    npc.push(spy);
    seen.add(spy.captainId);
  }
  for (const candidate of listPlanetHubDialogCandidates(planetId, presentCaptainIds)) {
    if (seen.has(candidate.captainId)) continue;
    if (candidate.captainId === operatorCaptainId) continue;
    seen.add(candidate.captainId);
    npc.push(candidate);
  }
  npc.sort(comparePlanetHubDialogCandidates);

  const room = PLANET_HUB_TALK_ROSTER_MAX - rows.length;
  for (let i = 0; i < npc.length && i < room; i += 1) {
    rows.push(toNpcRow(npc[i]!, planetId, hints));
  }
  return rows;
}

export function planetHubTalkRosterHasBadge(
  planetId: string,
  presentCaptainIds: readonly string[],
  hints: readonly PlanetHubCoPresenceBadgeHint[] = [],
): boolean {
  const rows = listPlanetHubTalkRosterRows(planetId, presentCaptainIds, hints);
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i]!.showInitiatedBadge) return true;
  }
  return false;
}

export function presentPlanetHubTalkRoster(
  planetId: string,
  presentCaptainIds: readonly string[],
  hints: readonly PlanetHubCoPresenceBadgeHint[] = [],
): void {
  if (isIngameDialogActive()) return;
  const rows = listPlanetHubTalkRosterRows(planetId, presentCaptainIds, hints);
  rememberPlanetHubTalkRosterSession(planetId, presentCaptainIds, hints);
  const store = useArcOverlayStore.getState();
  store.dismissWhere((e) => e.id === HUB_TALK_ROSTER_OVERLAY_ID);
  store.present({
    id: HUB_TALK_ROSTER_OVERLAY_ID,
    kind: 'hubTalkRoster',
    planetId,
    rows,
    dismissOnBackdrop: true,
  });
}

/** 에이전트 NL 「함장과 대화」 — 허브에서 기억한 세션, 없으면 현재 행성 프레즌스. */
export function presentPlanetHubTalkRosterFromAgent(): boolean {
  if (isIngameDialogActive()) return false;
  const remembered = lastRosterSession;
  if (remembered?.planetId) {
    presentPlanetHubTalkRoster(remembered.planetId, remembered.captainIds, remembered.hints);
    return true;
  }
  const { usePlayerStore } = require('../store/playerStore') as typeof import('../store/playerStore');
  const planetId = usePlayerStore.getState().player?.currentPlanetId?.trim() ?? '';
  if (!planetId) return false;
  const { resolveSystemIdForPlanetIdFromGalaxy } =
    require('../world/resolvePlanetSystemPosition') as typeof import('../world/resolvePlanetSystemPosition');
  const { resolvePlanetNearbyPresence } = require('../npc') as typeof import('../npc');
  const systemId = resolveSystemIdForPlanetIdFromGalaxy(planetId) ?? '';
  const presence = systemId ? resolvePlanetNearbyPresence(planetId, systemId) : [];
  const captainIds: string[] = [];
  for (let i = 0; i < presence.length; i++) {
    const cid = String((presence[i] as { captainId?: string }).captainId ?? '').trim();
    if (cid) captainIds.push(cid);
  }
  presentPlanetHubTalkRoster(planetId, captainIds);
  return true;
}

/**
 * INFO 통신 확인 뒤 — 메인퀘 수락·탐문·컨택은 허브 NPC 1차 대사(수락 버튼 포함).
 * 해당 없으면 false → 개인미션·범용 궤도 통신으로 넘긴다.
 */
export function tryPresentPlanetHubQuestTalkAfterComm(
  planetId: string,
  captainId: string,
): boolean {
  if (!shouldPresentPlanetHubQuestTalkAfterComm(captainId, planetId)) return false;
  dismissNearbyPresenceInfoOverlay();
  return openPlanetHubTalkByCaptainId(planetId, captainId);
}

/** 채팅 이름 요청 — 명단 세션 없이 기존 씬만 연다. 새 NPC 생성 없음. */
export function openPlanetHubTalkByCaptainId(planetId: string, captainId: string): boolean {
  const pid = planetId.trim();
  const cid = captainId.trim();
  if (!pid || !cid) return false;
  if (isIngameDialogActive()) return false;

  const candidates = listPlanetHubDialogCandidates(pid, [cid]);
  let sceneId = '';
  let source = '';
  for (let i = 0; i < candidates.length; i++) {
    if (candidates[i]!.captainId === cid) {
      sceneId = candidates[i]!.sceneId;
      source = candidates[i]!.source;
      break;
    }
  }
  if (!sceneId) {
    const captain = getNpcCaptain(cid);
    sceneId = captain ? resolveNpcCaptainDialogSceneId(captain) ?? '' : '';
  }
  if (!sceneId) return false;

  const parked = parkArcCoreAgentForIngameDialog();
  let presented = false;
  if (source === 'spy_intel') {
    presented = presentPlanetHubSpyIntelDialog(pid);
  } else if (tryPresentBarNeighborMissionClear(pid, cid)) {
    presented = true;
  } else {
    const completionActions = resolvePlanetHubNpcTalkCompletionActions(cid, pid);
    presented = presentIngameDialogScene(sceneId, {
      skipSeenCheck: true,
      completionActions,
      onDismiss: () => {
        markHubDialogBadgeAcknowledged(
          collectHubDialogBadgeAckKeysForTalk({
            planetId: pid,
            captainId: cid,
            sceneId,
            coPresenceHints: lastRosterSession?.hints ?? [],
          }),
        );
      },
    });
  }
  if (parked) scheduleResumeArcCoreAgentAfterIngameDialog(presented);
  return presented;
}

/** 허브 [대화] — 선연락 pending이면 인사·용건 1차 후 메신저. 없으면 메신저만. */
export function presentHubNlMouthThenMessenger(
  kind: 'operator' | 'arc_core' = 'operator',
): boolean {
  if (isIngameDialogActive()) return false;
  if (isArcCoreAgentSurfaceOpen()) {
    useArcCoreChatStore.getState().setActiveSpeakerId(
      kind === 'operator' ? 'operator' : 'arc_core',
    );
    return true;
  }

  const lifeAsk = peekStellaLifeAskPending();
  if (lifeAsk && kind === 'operator') {
    return presentStellaLifeAskComm(lifeAsk);
  }

  const parked = peekInboundTalkPending();
  if (parked && kind === 'operator') {
    return presentOperatorInboundFirstComm({
      askText: parked.text,
      onAccept: () => {
        consumeInboundTalkPending();
        void presentArcCoreBackchannel({
          reason: 'inbound_request',
          forceFreshSession: true,
          openerText: parked.text,
          speakerId: 'operator',
        });
      },
      onCancel: () => {
        consumeInboundTalkPending();
      },
    });
  }

  void presentArcCoreBackchannel({
    reason: 'manual',
    speakerId: kind === 'operator' ? 'operator' : 'arc_core',
  });
  return true;
}

export function openPlanetHubTalkRosterRow(row: ArcOverlayHubTalkRosterRow): void {
  const session = lastRosterSession;
  const planetId = session?.planetId ?? '';
  useArcOverlayStore.getState().dismissWhere((e) => e.id === HUB_TALK_ROSTER_OVERLAY_ID);

  if (row.kind === 'arc_core' && !isArcCoreOriginPlayerTalkUnlocked()) {
    return;
  }
  if (row.kind === 'operator' || row.kind === 'arc_core') {
    presentHubNlMouthThenMessenger(row.kind);
    return;
  }
  if (!planetId || !row.captainId || !row.sceneId) return;

  const parked = parkArcCoreAgentForIngameDialog();
  let presented = false;
  if (row.source === 'spy_intel') {
    presented = presentPlanetHubSpyIntelDialog(planetId);
  } else if (row.captainId && tryPresentBarNeighborMissionClear(planetId, row.captainId)) {
    presented = true;
  } else {
    const hints = session?.hints ?? [];
    const completionActions = resolvePlanetHubNpcTalkCompletionActions(row.captainId, planetId);
    presented = presentIngameDialogScene(row.sceneId, {
      completionActions,
      onDismiss: () => {
        markHubDialogBadgeAcknowledged(
          collectHubDialogBadgeAckKeysForTalk({
            planetId,
            captainId: row.captainId!,
            sceneId: row.sceneId!,
            coPresenceHints: hints,
          }),
        );
      },
    });
  }
  if (parked) scheduleResumeArcCoreAgentAfterIngameDialog(presented);
}
