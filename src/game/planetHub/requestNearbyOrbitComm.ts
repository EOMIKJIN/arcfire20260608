// ============================================================
// 근접 INFO 통신요청 — 수락: 범용 팝업 후 1차 인앱 대화 / 거부: 범용 팝업만
// 메인퀘·탐문·컨택 함장: 팝업 확인 뒤 허브 NPC 대사(수락 버튼). 그 외 개인미션·범용 통신.
// 세축 W1: 팝업 확인 시 accept · 거부 판정 즉시 refuse
// ============================================================

import { t } from '../../i18n';
import { showArcAlert } from '../../utils/showArcAlert';
import { dismissNearbyPresenceInfoOverlay } from '../../ui/overlay/arcOverlayStore';
import { getIngameDialogSceneById } from '../ingameDialog/ingameDialogSceneIndex';
import {
  resolveOrbitCommDecision,
  type OrbitCommDecision,
  type OrbitCommRowRef,
} from '../../npc/resolveOrbitCommPolicy';
import { isIngameDialogActive, presentIngameDialogScene } from '../ingameDialog/ingameDialogApi';
import { presentCaptainPersonalCommAfterAccept } from '../../missions/captainPersonalMissionDialog';
import { tryPresentPlanetHubQuestTalkAfterComm } from '../planetHubTalkRoster';
import type { IngameDialogTextContext } from '../ingameDialog/ingameDialogTypes';
import {
  parkArcCoreAgentForIngameDialog,
  scheduleResumeArcCoreAgentAfterIngameDialog,
} from '../../arcCore/chat/resumeArcCoreAgentAfterIngameDialog';
import {
  makeOrbitCommWriteId,
  mapOrbitCommRefuseReason,
  resolveOrbitCommConnectedBodyKind,
  resolveOrbitCommSceneVariant,
} from './orbitPresenceMemory';
import {
  ensureOrbitPresenceMemoryHydrated,
  getCaptainPresenceMemory,
  recordOrbitComm,
} from '../../store/orbitPresenceMemoryStore';

const ORBIT_COMM_ALERT_ID = 'nearby-orbit-comm-alert';

function refuseMessage(reason: Extract<OrbitCommDecision, { outcome: 'refuse' }>['reason']): string {
  return reason === 'unidentified'
    ? t('nearbyPresence.comm.refusedUnidentified')
    : t('nearbyPresence.comm.refusedHostile');
}

function resolvePlanetDisplayNames(planetId: string): { name: string; nameEn: string } {
  const id = String(planetId ?? '').trim();
  if (!id) return { name: '', nameEn: '' };
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { resolvePlanetById } = require('../../world/resolvePlanetById') as typeof import('../../world/resolvePlanetById');
    const planet = resolvePlanetById(id);
    const name = String(planet?.name ?? '').trim() || id;
    const nameEn = String(planet?.nameEn ?? '').trim() || name;
    return { name, nameEn };
  } catch {
    return { name: id, nameEn: id };
  }
}

function buildAcceptContext(
  decision: Extract<OrbitCommDecision, { outcome: 'accept' }>,
): IngameDialogTextContext {
  const memory = getCaptainPresenceMemory(decision.captainId);
  const lastPlanet = resolvePlanetDisplayNames(memory?.lastPlanetId ?? '');
  return {
    ...decision.context,
    orbitCommVisitCount: memory?.commCount ?? 0,
    orbitCommLastPlanetName: lastPlanet.name || undefined,
    orbitCommLastPlanetNameEn: lastPlanet.nameEn || undefined,
    orbitCommHadRefuse: Boolean(memory && memory.refuseCount > 0 && memory.commCount === 0),
  };
}

function presentAcceptedDialog(
  decision: Extract<OrbitCommDecision, { outcome: 'accept' }>,
  input: { sceneId: string; context: IngameDialogTextContext; planetId: string; writeId: string },
): boolean {
  if (isIngameDialogActive()) return false;
  const parked = parkArcCoreAgentForIngameDialog();
  const presented = presentIngameDialogScene(input.sceneId, {
    skipSeenCheck: true,
    context: input.context,
    completionActions: input.planetId
      ? [
          {
            type: 'record_orbit_comm',
            captainId: decision.captainId,
            planetId: input.planetId,
            outcome: 'accept',
            sceneId: input.sceneId,
            writeId: input.writeId,
          },
        ]
      : undefined,
  });
  if (parked) scheduleResumeArcCoreAgentAfterIngameDialog(presented);
  return presented;
}

export function requestNearbyOrbitComm(row: OrbitCommRowRef): boolean {
  if (isIngameDialogActive()) return false;

  void ensureOrbitPresenceMemoryHydrated();

  const decision = resolveOrbitCommDecision(row);
  if (decision.outcome === 'none') return false;

  const planetId = String(row.planetId ?? '').trim();

  if (decision.outcome === 'refuse') {
    if (decision.captainId && planetId) {
      recordOrbitComm({
        captainId: decision.captainId,
        planetId,
        outcome: mapOrbitCommRefuseReason(decision.reason),
        sceneId: decision.sceneId,
        writeId: makeOrbitCommWriteId(),
      });
    }
    showArcAlert(
      t('nearbyPresence.comm.refusedTitle'),
      refuseMessage(decision.reason),
      undefined,
      { id: ORBIT_COMM_ALERT_ID },
    );
    return true;
  }

  const memory = getCaptainPresenceMemory(decision.captainId);
  const variant = resolveOrbitCommSceneVariant(
    decision.sceneId,
    memory,
    (sceneId) => Boolean(getIngameDialogSceneById(sceneId)),
    planetId,
  );
  const context = buildAcceptContext(decision);
  const writeId = makeOrbitCommWriteId();
  const accepted = { ...decision, sceneId: variant.sceneId, context };
  const bodyKind = resolveOrbitCommConnectedBodyKind(
    memory?.commCount ?? 0,
    memory?.lastPlanetId,
    planetId,
  );
  const connectedBody =
    bodyKind === 'revisit_from'
      ? t('nearbyPresence.comm.connectedRevisitFrom', {
          planet: resolvePlanetDisplayNames(memory?.lastPlanetId ?? '').name
            || memory?.lastPlanetId
            || '',
        })
      : bodyKind === 'revisit'
        ? t('nearbyPresence.comm.connectedRevisit')
        : t('nearbyPresence.comm.connected');

  showArcAlert(
    t('nearbyPresence.comm.connectedTitle'),
    connectedBody,
    [
      {
        text: t('common.confirmBare'),
        onPress: () => {
          if (planetId) {
            recordOrbitComm({
              captainId: accepted.captainId,
              planetId,
              outcome: 'accept',
              sceneId: accepted.sceneId,
              writeId,
            });
          }
          dismissNearbyPresenceInfoOverlay();
          if (tryPresentPlanetHubQuestTalkAfterComm(planetId, accepted.captainId)) {
            return;
          }
          if (presentCaptainPersonalCommAfterAccept({
            captainId: accepted.captainId,
            planetId,
          })) {
            return;
          }
          presentAcceptedDialog(accepted, {
            sceneId: accepted.sceneId,
            context,
            planetId,
            writeId,
          });
        },
      },
    ],
    { id: ORBIT_COMM_ALERT_ID },
  );
  return true;
}
