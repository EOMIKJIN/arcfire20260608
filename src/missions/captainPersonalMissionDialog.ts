/**
 * INFO 통신 뒤 함장 개인미션 1차 대사 — 오퍼/독촉/감사.
 * 허브 [대화] 침묵 수락과 분리. 메신저 없음.
 */
import { t } from '../i18n';
import { useAppSettingsStore } from '../store/appSettingsStore';
import { getCaptainPresenceMemory, patchCaptainPersonalMemory } from '../store/orbitPresenceMemoryStore';
import { useMissionStore } from '../store/missionStore';
import { usePlayerStore } from '../store/playerStore';
import { getNpcCaptain } from '../npc/npcFleetRegistry';
import {
  isIngameDialogActive,
  presentAdHocIngameDialog,
} from '../game/ingameDialog/ingameDialogApi';
import {
  parkArcCoreAgentForIngameDialog,
  scheduleResumeArcCoreAgentAfterIngameDialog,
} from '../arcCore/chat/resumeArcCoreAgentAfterIngameDialog';
import { resolveNpcCaptainPortraitSource } from '../game/npcCaptainPortraitAssets';
import {
  allocateCaptainPersonalMissionId,
  countActiveCaptainPersonalMissions,
  isCaptainPersonalMissionId,
  parseCaptainPersonalMissionId,
} from './captainPersonalMissionIds';
import {
  evaluateCaptainPersonalOfferGate,
  kstDayKeyFromMs,
  resolvePersonalDeclineUntilDayKey,
} from './captainPersonalMissionOffer';
import { getMissionById } from './missionCatalog';
import {
  forgetCaptainPersonalMaterializedMission,
  pickAndMaterializeCaptainPersonalMission,
  resolveCaptainPersonalDestPlanetId,
  resolveCaptainPersonalTemplateMissionId,
} from './captainPersonalMissionResolver';
import { getCaptainPersonalMissionTemplate } from './captainPersonalMissionTemplates';
import type { Mission } from '../types';

export type CaptainPersonalCommKind = 'offer' | 'nudge' | 'thanks' | 'skip';

function resolvePlanetDisplayName(planetId: string, locale: 'ko' | 'en'): string {
  const id = String(planetId ?? '').trim();
  if (!id) return '';
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { resolvePlanetById } = require('../world/resolvePlanetById') as typeof import('../world/resolvePlanetById');
    const planet = resolvePlanetById(id);
    if (locale === 'en') return String(planet?.nameEn ?? planet?.name ?? id).trim() || id;
    return String(planet?.name ?? id).trim() || id;
  } catch {
    return id;
  }
}

function applyStoryTokens(
  text: string,
  tokens: Record<string, string>,
): string {
  let out = text;
  const keys = Object.keys(tokens);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i]!;
    out = out.split(`{${key}}`).join(tokens[key] ?? '');
  }
  return out;
}

function collectUsedPersonalIds(): Set<string> {
  const used = new Set<string>();
  const progresses = useMissionStore.getState().progresses;
  const ids = Object.keys(progresses);
  for (let i = 0; i < ids.length; i += 1) {
    if (isCaptainPersonalMissionId(ids[i]!)) used.add(ids[i]!);
  }
  return used;
}

function findActivePersonalMissionIdForCaptain(captainId: string): string | null {
  const progresses = useMissionStore.getState().progresses;
  const ids = Object.keys(progresses);
  for (let i = 0; i < ids.length; i += 1) {
    const id = ids[i]!;
    const row = progresses[id]!;
    if (row.status !== 'active' || !isCaptainPersonalMissionId(id)) continue;
    const parsed = parseCaptainPersonalMissionId(id);
    if (parsed?.captainId === captainId) return id;
  }
  return null;
}

function declinePersonalOffer(input: {
  captainId: string;
  instanceId: string | null;
  dayKey: string;
}): void {
  if (input.instanceId) forgetCaptainPersonalMaterializedMission(input.instanceId);
  patchCaptainPersonalMemory(input.captainId, {
    declineUntilDayKey: resolvePersonalDeclineUntilDayKey(input.dayKey),
    lastPersonalOfferDayKey: input.dayKey,
    personalThanksPending: false,
  });
}

function markPersonalOfferAccepted(captainId: string, dayKey: string): void {
  patchCaptainPersonalMemory(captainId, {
    lastPersonalOfferDayKey: dayKey,
    personalThanksPending: false,
  });
}

function presentOfferPages(input: {
  mission: Mission;
  captainId: string;
  planetId: string;
  dayKey: string;
  captainName: string;
}): boolean {
  const locale = useAppSettingsStore.getState().locale === 'en' ? 'en' : 'ko';
  const templateId = input.mission.instanceTemplateMissionId
    ?? resolveCaptainPersonalTemplateMissionId(input.mission.id)
    ?? '';
  const template = getCaptainPersonalMissionTemplate(templateId);
  if (!template) {
    forgetCaptainPersonalMaterializedMission(input.mission.id);
    return false;
  }
  const captain = getNpcCaptain(input.captainId);
  const imageSource = resolveNpcCaptainPortraitSource(captain?.portraitImageAssetKey ?? null) ?? undefined;
  const memory = getCaptainPresenceMemory(input.captainId);
  const destPlanetId = resolveCaptainPersonalDestPlanetId(templateId, input.planetId);
  const destName = resolvePlanetDisplayName(destPlanetId, locale)
    || (locale === 'en' ? 'the next hub' : '다음 거점');
  const lastPlanet = resolvePlanetDisplayName(memory?.lastPlanetId ?? '', locale)
    || (locale === 'en' ? 'another orbit' : '다른 궤도');
  const planetName = resolvePlanetDisplayName(input.planetId, locale) || input.planetId;
  const reward = t('nearbyPresence.personal.rewardLine', {
    credits: template.rewardCredits,
    exp: template.rewardExp,
  });
  const tokens = {
    captain: input.captainName,
    planet: planetName,
    lastPlanet,
    dest: destName,
    reward,
    credits: String(template.rewardCredits),
    exp: String(template.rewardExp),
  };
  const story1 = applyStoryTokens(locale === 'en' ? template.story1En : template.story1, tokens);
  const story2 = applyStoryTokens(locale === 'en' ? template.story2En : template.story2, tokens);
  const ask = applyStoryTokens(locale === 'en' ? template.askEn : template.ask, tokens);
  const pages = [story1, story2, ask];
  let pageIndex = 0;

  const showPage = (): boolean => {
    const isLast = pageIndex >= pages.length - 1;
    const text = pages[pageIndex] ?? '';
    return presentAdHocIngameDialog({
      label: input.captainName,
      text,
      imageSource,
      buttonText: isLast ? t('dialog.accept') : t('dialog.next'),
      secondaryButtonText: isLast ? t('dialog.later') : undefined,
      showAcceptCancelChoice: isLast,
      abortOnStageLeave: true,
      autoDismissMs: 0,
      completionActions: isLast
        ? [
            {
              type: 'accept_quest_mission',
              missionId: input.mission.id,
              planetId: input.planetId,
              expectCaptainId: input.captainId,
            },
          ]
        : undefined,
      onDismiss: () => {
        if (!isLast) {
          pageIndex += 1;
          showPage();
          return;
        }
        markPersonalOfferAccepted(input.captainId, input.dayKey);
      },
      onCancel: () => {
        if (isLast) {
          declinePersonalOffer({
            captainId: input.captainId,
            instanceId: input.mission.id,
            dayKey: input.dayKey,
          });
          return;
        }
        forgetCaptainPersonalMaterializedMission(input.mission.id);
      },
    });
  };

  return showPage();
}

function presentOnePage(input: {
  captainId: string;
  captainName: string;
  text: string;
  onDismiss?: () => void;
}): boolean {
  const captain = getNpcCaptain(input.captainId);
  const imageSource = resolveNpcCaptainPortraitSource(captain?.portraitImageAssetKey ?? null) ?? undefined;
  return presentAdHocIngameDialog({
    label: input.captainName,
    text: input.text,
    imageSource,
    buttonText: t('dialog.ok'),
    abortOnStageLeave: true,
    autoDismissMs: 0,
    onDismiss: input.onDismiss,
  });
}

/**
 * 통신 accept 팝업 확인 직후. true면 기존 함장 CSV 씬을 열지 않는다.
 */
export function presentCaptainPersonalCommAfterAccept(input: {
  captainId: string;
  planetId: string;
}): boolean {
  if (isIngameDialogActive()) return false;
  const presented = presentCaptainPersonalCommAfterAcceptInner(input);
  return presented;
}

function presentCaptainPersonalCommAfterAcceptInner(input: {
  captainId: string;
  planetId: string;
}): boolean {
  const captainId = input.captainId.trim();
  const planetId = input.planetId.trim();
  if (!captainId || !planetId) return false;

  const captain = getNpcCaptain(captainId);
  if (!captain) return false;

  const locale = useAppSettingsStore.getState().locale === 'en' ? 'en' : 'ko';
  const captainName =
    (locale === 'en' ? captain.displayNameEn : captain.displayName)?.trim()
    || captain.displayName
    || captainId;
  const dayKey = kstDayKeyFromMs();
  const memory = getCaptainPresenceMemory(captainId);
  const progresses = useMissionStore.getState().progresses;
  const activeId = findActivePersonalMissionIdForCaptain(captainId);

  if (activeId) {
    const mission = getMissionById(activeId);
    const title = locale === 'en'
      ? (mission?.titleEn || mission?.title || activeId)
      : (mission?.title || activeId);
    return presentPersonalWithPark(() => presentOnePage({
      captainId,
      captainName,
      text: t('nearbyPresence.personal.nudge', { title }),
    }));
  }

  if (memory?.personalThanksPending === true) {
    return presentPersonalWithPark(() => presentOnePage({
      captainId,
      captainName,
      text: t('nearbyPresence.personal.thanks'),
      onDismiss: () => {
        patchCaptainPersonalMemory(captainId, { personalThanksPending: false });
      },
    }));
  }

  const playerLevel = usePlayerStore.getState().player?.level ?? 1;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { pickAvailableMainStoryMissionIdForCaptain } = require('./barMissionBoard') as typeof import('./barMissionBoard');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { pickActiveContactQuestIdForCaptain } = require('../game/planetHubNpcDialog') as typeof import('../game/planetHubNpcDialog');
  const hasOfferableMainStory = Boolean(
    pickAvailableMainStoryMissionIdForCaptain(captainId, planetId, playerLevel, progresses),
  );
  const hasActiveTalkContact = Boolean(pickActiveContactQuestIdForCaptain(captainId, planetId));
  const gate = evaluateCaptainPersonalOfferGate({
    commAccepted: true,
    talkEnabled: captain.mainStageTalkEnabled === true,
    isHostileRefuse: false,
    isFlagship: false,
    isOrbitFill: captain.arcOrbitPresenceFill === true,
    hasOfferableMainStory,
    hasActiveTalkContact,
    captainActivePersonalCount: countActiveCaptainPersonalMissions(progresses, captainId),
    accountActivePersonalCount: countActiveCaptainPersonalMissions(progresses),
    dayKey,
    declineUntilDayKey: memory?.declineUntilDayKey,
    lastPersonalOfferDayKey: memory?.lastPersonalOfferDayKey,
    templateAvailable: true,
  });
  if (!gate.ok) return false;

  const instanceId = allocateCaptainPersonalMissionId(captainId, collectUsedPersonalIds());
  const mission = pickAndMaterializeCaptainPersonalMission({
    captainId,
    planetId,
    dayKey,
    instanceId,
  });
  if (!mission) return false;

  const presented = presentPersonalWithPark(() => presentOfferPages({
    mission,
    captainId,
    planetId,
    dayKey,
    captainName,
  }));
  if (!presented) {
    forgetCaptainPersonalMaterializedMission(instanceId);
    return false;
  }
  return true;
}

function presentPersonalWithPark(show: () => boolean): boolean {
  const parked = parkArcCoreAgentForIngameDialog();
  const presented = show();
  if (parked) scheduleResumeArcCoreAgentAfterIngameDialog(presented);
  return presented;
}
