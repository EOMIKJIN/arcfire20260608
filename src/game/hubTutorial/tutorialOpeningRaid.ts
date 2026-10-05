/**
 * 아르카디아 오프닝 습격 게이트.
 * 틱·setInterval 없음. 전투 루프는 기존 시계로 20초를 한 번 비교한다.
 */

import { waitCombatEndHold } from '../combatEndHold';
import { presentCombatEndLeaderDialog } from '../combat/presentCombatEndLeaderDialog';
import { runCombatEndOutcomeFlow } from '../combat/runCombatEndOutcomeFlow';
import { presentIngameDialogScene } from '../ingameDialog/ingameDialogApi';
import { markIngameDialogSceneSeen, runIntroSeenAndStartFirstMissionPolicy } from '../ingameDialog/ingameDialogCompletion';
import { useOrbitCapitalCombatUiStore } from '../../store/orbitCapitalCombatUiStore';
import { usePlayerStore } from '../../store/playerStore';
import { STELLA_HUB_TUTORIAL_SCENE_IDS } from './stellaHubTutorialGuideLogic';
import {
  TUTORIAL_OPENING_RAID_PLANET_ID,
  buildTutorialOpeningRaidSeedSlots,
  type TutorialOpeningRaidSeedSlot,
} from './tutorialOpeningRaidLogic';

export {
  TUTORIAL_OPENING_RAID_CONDITION_ID,
  TUTORIAL_OPENING_RAID_DRAW_MS,
  TUTORIAL_OPENING_RAID_PLANET_ID,
  shouldTutorialOpeningRaidDraw,
} from './tutorialOpeningRaidLogic';

let gateOpen = false;
let latched = false;
let drawPending = false;
let retryPending = false;
let endReleasePending = false;
const listeners = new Set<() => void>();

function emitGate(): void {
  for (const listener of listeners) listener();
}

export function subscribeTutorialOpeningRaidGate(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getTutorialOpeningRaidGateOpen(): boolean {
  return gateOpen;
}

export function isTutorialOpeningRaidLatched(): boolean {
  return latched;
}

export function isTutorialOpeningRaidRetryPending(): boolean {
  return retryPending;
}

export function armTutorialOpeningRaid(): void {
  retryPending = false;
  if (gateOpen) return;
  gateOpen = true;
  emitGate();
}

export function armTutorialOpeningRaidDraw(): void {
  drawPending = true;
}

export function consumeTutorialOpeningRaidDraw(): boolean {
  if (!drawPending) return false;
  drawPending = false;
  return true;
}

export function takeTutorialOpeningRaidSeedSlots(
  planetId: string,
  playerFlagshipNpcShipId: string | null,
): TutorialOpeningRaidSeedSlot[] | null {
  if (!gateOpen) return null;
  if (planetId !== TUTORIAL_OPENING_RAID_PLANET_ID) return null;
  latched = true;
  return buildTutorialOpeningRaidSeedSlots(playerFlagshipNpcShipId);
}

/**
 * 종료 연출 동안 캔버스를 유지한다.
 * 게이트를 먼저 닫으면 파괴 화염·종료 홀드가 그려지기 전에 전투가 사라진다.
 */
export function holdTutorialOpeningRaidCanvasForEnd(kind: 'draw' | 'lose'): void {
  latched = false;
  drawPending = false;
  retryPending = kind === 'lose';
  endReleasePending = true;
}

/** 홀드와 적 리더 대사가 끝난 뒤 허브로 돌린다. */
export function releaseTutorialOpeningRaidCanvasAfterEnd(): void {
  if (!endReleasePending) return;
  endReleasePending = false;
  gateOpen = false;
  emitGate();
}

/** 20초 전 플레이어 격파. 재탑승 안내는 추후. 캔버스는 종료 연출 뒤 내린다. */
export function noteTutorialOpeningRaidPlayerDefeat(): void {
  if (!latched && !gateOpen) return;
  holdTutorialOpeningRaidCanvasForEnd('lose');
}

export function rearmTutorialOpeningRaidAfterDefeat(): void {
  if (!retryPending) return;
  retryPending = false;
  if (gateOpen) return;
  gateOpen = true;
  emitGate();
}

function presentStellaThenRemainingGuide(): void {
  const openRest = (): void => {
    const seen = usePlayerStore.getState().player?.flags.seenStorySceneIds ?? [];
    if (seen.includes(STELLA_HUB_TUTORIAL_SCENE_IDS.a2)) return;
    if (seen.includes(STELLA_HUB_TUTORIAL_SCENE_IDS.d2)) return;
    presentIngameDialogScene(STELLA_HUB_TUTORIAL_SCENE_IDS.a2, { bypassScreenShell: true });
  };
  const opened = presentIngameDialogScene(STELLA_HUB_TUTORIAL_SCENE_IDS.e3, {
    bypassScreenShell: true,
    onDismiss: openRest,
  });
  if (!opened) {
    markIngameDialogSceneSeen(STELLA_HUB_TUTORIAL_SCENE_IDS.e3);
    openRest();
  }
}

export async function presentTutorialOpeningRaidDrawOutcome(input: {
  enemyName?: string;
  leaderCaptainId?: string | null;
}): Promise<void> {
  useOrbitCapitalCombatUiStore.getState().setEndHoldActive(true);
  await waitCombatEndHold();
  useOrbitCapitalCombatUiStore.getState().setEndHoldActive(false);
  await presentCombatEndLeaderDialog({
    kind: 'defeat',
    captainId: input.leaderCaptainId,
  });
  releaseTutorialOpeningRaidCanvasAfterEnd();
  runCombatEndOutcomeFlow({
    result: {
      venue: 'hub_orbit',
      outcome: 'draw',
      expEarned: 0,
      creditsEarned: 0,
      enemyName: input.enemyName,
    },
    missionClearEnabled: false,
    onBackchannel: null,
    onResultClosed: () => {
      runIntroSeenAndStartFirstMissionPolicy();
    },
    onFinished: () => {
      presentStellaThenRemainingGuide();
    },
  });
}
