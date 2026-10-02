/**
 * L0 허브 가이드 A1–D2 — 시설 안내는 인게임 대사창.
 * C [대화]만 본기능 2게이트(통신 → 메신저 또는 클로징). 틱 없음.
 * persist는 once 씬 seen + bar 표식 1키.
 */
import { isQuestMissionId } from '../../missions/missionTrack';
import { usePlayerStore } from '../../store/playerStore';
import {
  isArcCoreAgentSurfaceOpen,
  useArcCoreAgentSurfaceStore,
} from '../../arcCore/chat/arcCoreAgentSurfaceStore';
import { registerPlanetSessionResource } from '../planetSessionRegistry';
import {
  isIngameDialogActive,
  presentIngameDialogScene,
} from '../ingameDialog/ingameDialogApi';
import { runAfterIngameDialogIdle } from '../ingameDialog/ingameDialogIdle';
import {
  STELLA_HUB_TUTORIAL_HOME_PLANET_ID,
  STELLA_HUB_TUTORIAL_SCENE_IDS,
  isStellaHubTutorialAwaitingTalk,
  isStellaHubTutorialInProgress,
  resolveStellaHubTutorialPresent,
  type StellaHubTutorialEvent,
  type StellaHubTutorialPresent,
} from './stellaHubTutorialGuideLogic';

export {
  STELLA_HUB_TUTORIAL_HOME_PLANET_ID,
  STELLA_HUB_TUTORIAL_SCENE_IDS,
  isStellaHubTutorialAwaitingTalk,
  isStellaHubTutorialComplete,
  isStellaHubTutorialInProgress,
  resolveStellaHubTutorialPresent,
} from './stellaHubTutorialGuideLogic';
export type {
  StellaHubTutorialEvent,
  StellaHubTutorialPresent,
} from './stellaHubTutorialGuideLogic';

const S = STELLA_HUB_TUTORIAL_SCENE_IDS;

function readSeenSceneIds(): string[] {
  return usePlayerStore.getState().player?.flags.seenStorySceneIds ?? [];
}

function isHomePlanet(planetId?: string | null): boolean {
  const fromEvent = (planetId ?? '').trim();
  if (fromEvent) return fromEvent === STELLA_HUB_TUTORIAL_HOME_PLANET_ID;
  const current = (usePlayerStore.getState().player?.currentPlanetId ?? '').trim();
  return current === STELLA_HUB_TUTORIAL_HOME_PLANET_ID;
}

export function shouldPresentStellaHubTutorialTalkTwoGate(planetId?: string | null): boolean {
  if (!isHomePlanet(planetId)) return false;
  return isStellaHubTutorialAwaitingTalk(readSeenSceneIds());
}

/** 메신저 전면 차단은 하지 않는다. C 단계는 본기능 2게이트. */
export function shouldBlockMessengerForStellaHubTutorial(_planetId?: string | null): boolean {
  return false;
}

export function scheduleStellaHubTutorialTalkDoneOnAgentClose(planetId?: string | null): void {
  const pid = (planetId ?? '').trim();
  let wasOpen = isArcCoreAgentSurfaceOpen();
  if (!wasOpen) {
    notifyStellaHubTutorial('talk_done', pid || undefined);
    return;
  }
  let released = false;
  let releaseToken: { release: () => void } | null = null;
  const finish = (): void => {
    if (released) return;
    released = true;
    releaseToken?.release();
    notifyStellaHubTutorial('talk_done', pid || undefined);
  };
  const unsub = useArcCoreAgentSurfaceStore.subscribe((s) => {
    const open = s.mounted && s.front === 'agent';
    if (wasOpen && !open) {
      unsub();
      finish();
    }
    wasOpen = open;
  });
  releaseToken = registerPlanetSessionResource({
    ownerId: 'stella_hub_tut_talk_done',
    planetId: pid || null,
    dispose: () => {
      unsub();
      released = true;
    },
  });
}

export function shouldHoldBarAcceptForStellaHubTutorial(
  missionId: string,
  planetId?: string | null,
): boolean {
  if (!isQuestMissionId(missionId)) return false;
  if (!isHomePlanet(planetId)) return false;
  return isStellaHubTutorialInProgress(readSeenSceneIds());
}

function presentGuideScene(plan: StellaHubTutorialPresent): boolean {
  const completion = require('../ingameDialog/ingameDialogCompletion') as typeof import('../ingameDialog/ingameDialogCompletion');
  if (plan.markOnly) {
    completion.markIngameDialogSceneSeen(plan.markOnly);
    return true;
  }

  const onDismiss = (): void => {
    if (plan.chainOnDismiss === 'a4') {
      presentIngameDialogScene(S.a4, { bypassScreenShell: true });
      return;
    }
    if (plan.chainOnDismiss === 'd2') {
      presentIngameDialogScene(S.d2, {
        bypassScreenShell: true,
        onDismiss: () => {
          completion.runIntroSeenAndStartFirstMissionPolicy();
        },
      });
      return;
    }
    if (plan.chainOnDismiss === 'start_first_mission') {
      completion.runIntroSeenAndStartFirstMissionPolicy();
    }
  };

  const options = {
    bypassScreenShell: true,
    skipSeenCheck: plan.skipSeenCheck === true,
    onDismiss: plan.chainOnDismiss ? onDismiss : undefined,
  };

  if (isIngameDialogActive()) {
    runAfterIngameDialogIdle(() => {
      presentIngameDialogScene(plan.sceneId, options);
    });
    return true;
  }
  return presentIngameDialogScene(plan.sceneId, options);
}

export function notifyStellaHubTutorial(
  event: StellaHubTutorialEvent,
  planetId?: string | null,
): boolean {
  if (!isHomePlanet(planetId)) return false;
  const plan = resolveStellaHubTutorialPresent(event, readSeenSceneIds());
  if (!plan) return false;
  return presentGuideScene(plan);
}
