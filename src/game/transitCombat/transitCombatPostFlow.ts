/**
 * 이동중 전투 종료 후 — 전투 화면(STAGE 3)에서 순차 연출 완료 후 worldmap 이동
 * 인게임대화(패배대사) → 전투결과 → 미션완료대화 → 레벨업 → 장비파손 등 기타
 */

import { create } from 'zustand';
import {
  isIngameDialogActive,
  presentIngameDialogScene,
} from '../ingameDialog/ingameDialogApi';
import { resolveNpcCaptainPortraitSource } from '../npcCaptainPortraitAssets';
import { getNpcCaptain } from '../../npc/npcFleetRegistry';
import { resolveNpcCaptainDisplayName } from '../../i18n/captainText';
import { runStageUiAfterIdle } from '../../navigation/stageNavGate';
import { useAppSettingsStore } from '../../store/appSettingsStore';
import { useMissionStore } from '../../store/missionStore';
import { usePlayerStore } from '../../store/playerStore';
import { useArcOverlayStore } from '../../ui/overlay/arcOverlayStore';
import { ARC_OVERLAY_DEFAULT_AUTO_DISMISS_MS } from '../../ui/overlay/overlayAlertContract';
import { setCombatEndOutcomeHold } from '../combat/combatEndOutcomeHold';
import { runCombatEndOutcomeFlow } from '../combat/runCombatEndOutcomeFlow';
import { showArcAlert } from '../../utils/showArcAlert';
import { t } from '../../i18n';
import { resolveTransitCombatEndDialogCopy } from './resolveTransitCombatEndDialog';
import {
  presentAdHocCombatEndDialog,
  presentCombatEndLeaderDialog,
  resolveStellaOperatorPortrait,
} from '../combat/presentCombatEndLeaderDialog';

export type TransitCombatPostFlowPayload = {
  kind: 'victory' | 'flee';
  enemyName?: string;
  /** 전투에 나온 적 함장(`npc_cpt_enemy_*` 등). 있으면 패배 대사+초상. */
  captainId?: string | null;
  creditGain?: number;
  expGain?: number;
  destroyedLabels?: string[];
};

const TRANSIT_LEVEL_UP_OVERLAY_ID = 'transit-post-combat-level-up';
/** compact 자동닫힘(40s)보다 살짝 길게 — 팝업이 안 떠도 후처리가 영구 대기하지 않게 */
const TRANSIT_OVERLAY_CLOSE_DEADLINE_MS = ARC_OVERLAY_DEFAULT_AUTO_DISMISS_MS + 2000;
const TRANSIT_MISSION_CLEAR_WAIT_MS = 8000;
const TRANSIT_DIALOG_IDLE_WAIT_MS = 8000;
/** 어떤 결과 면도 안 뜬 채 이 시간을 넘기면 남은 선택 연출을 건너뛰고 worldmap */
const TRANSIT_POST_FLOW_BLANK_ABORT_MS = 10000;
/**
 * 승리 후처리 «전체» 안전 데드라인 — 과거의 단계별 3중 상한을 하나로 대체.
 * 정상 경로는 결과창·레벨업·알림의 자동닫힘(각 40s)으로 끝나므로 여기 걸리지 않는다.
 * 오버레이가 외부에서 강제 제거돼 `onClose` 가 끊긴 경우에만 발동하는 고착 방지용.
 */
const TRANSIT_POST_FLOW_TOTAL_DEADLINE_MS = 150_000;

type TransitPostFlowStore = {
  running: boolean;
  setRunning: (running: boolean) => void;
};

const useTransitPostFlowStore = create<TransitPostFlowStore>((set) => ({
  running: false,
  setRunning: (running) => set({ running }),
}));

export function isTransitCombatPostFlowRunning(): boolean {
  return useTransitPostFlowStore.getState().running;
}

export function useTransitCombatPostFlowRunning(): boolean {
  return useTransitPostFlowStore((s) => s.running);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function delayCancellable(ms: number): { promise: Promise<void>; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const promise = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, ms);
  });
  return {
    promise,
    cancel: () => {
      if (timer == null) return;
      clearTimeout(timer);
      timer = null;
    },
  };
}

/** Skia/Reanimated가 IM을 안 풀어도 2.5초 안에 진행 — stageNavGate와 동일 클래스 */
async function settleUiAfterCombatPause(): Promise<void> {
  await new Promise<void>((resolve) => {
    runStageUiAfterIdle(() => resolve());
  });
  await delay(64);
}

function awaitOverlayClose(input: {
  present: (finish: () => void) => void;
  isPresented: () => boolean;
  expire: () => void;
  deadlineMs?: number;
}): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      resolve();
    };
    input.present(finish);
    if (!input.isPresented()) {
      finish();
      return;
    }
    timer = setTimeout(() => {
      input.expire();
      finish();
    }, input.deadlineMs ?? TRANSIT_OVERLAY_CLOSE_DEADLINE_MS);
  });
}

function isTransitPostFlowSurfaceVisible(): boolean {
  if (isIngameDialogActive()) return true;
  const stack = useArcOverlayStore.getState().stack;
  return stack.some((e) => e.kind === 'alert' || e.kind === 'reward' || e.kind === 'levelUp' || e.kind === 'waveResult');
}

function noteTransitPostFlowSurface(seen: { value: boolean }): void {
  if (isTransitPostFlowSurfaceVisible()) seen.value = true;
}

function shouldAbortBlankTransitPostFlow(
  startedAt: number,
  seen: { value: boolean },
): boolean {
  return !seen.value && Date.now() - startedAt >= TRANSIT_POST_FLOW_BLANK_ABORT_MS;
}

async function waitForIngameDialogIdle(maxMs = TRANSIT_DIALOG_IDLE_WAIT_MS): Promise<void> {
  const started = Date.now();
  while (isIngameDialogActive()) {
    if (Date.now() - started > maxMs) return;
    await delay(32);
  }
}

async function waitForArcOverlayKindsIdle(
  kinds: Array<'alert' | 'reward' | 'levelUp' | 'waveResult'>,
  maxMs = 20000,
): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    const stack = useArcOverlayStore.getState().stack;
    const blocking = stack.some((e) => kinds.includes(e.kind as 'alert' | 'reward' | 'levelUp' | 'waveResult'));
    if (!blocking) return;
    await delay(32);
  }
}

function presentLevelUpIfPending(): Promise<void> {
  const ps = usePlayerStore.getState();
  if (!ps.levelUpPending || !ps.levelUpSummary || !ps.player) {
    return Promise.resolve();
  }
  const summary = ps.levelUpSummary;
  return awaitOverlayClose({
    present: (finish) => {
      useArcOverlayStore.getState().dismissWhere((e) => e.id === TRANSIT_LEVEL_UP_OVERLAY_ID);
      useArcOverlayStore.getState().present({
        id: TRANSIT_LEVEL_UP_OVERLAY_ID,
        kind: 'levelUp',
        summary,
        dismissOnBackdrop: false,
        autoDismissMs: ARC_OVERLAY_DEFAULT_AUTO_DISMISS_MS,
        onClose: () => {
          usePlayerStore.getState().clearLevelUp();
          finish();
        },
      });
    },
    isPresented: () => useArcOverlayStore.getState().stack.some((e) => e.id === TRANSIT_LEVEL_UP_OVERLAY_ID),
    expire: () => {
      useArcOverlayStore.getState().dismissWhere((e) => e.id === TRANSIT_LEVEL_UP_OVERLAY_ID);
      usePlayerStore.getState().clearLevelUp();
    },
  });
}

async function presentMissionClearWhenReady(): Promise<void> {
  await waitForIngameDialogIdle();
  await waitForArcOverlayKindsIdle(['alert', 'reward', 'levelUp', 'waveResult']);

  const started = Date.now();
  while (Date.now() - started < TRANSIT_MISSION_CLEAR_WAIT_MS) {
    const pending = useMissionStore.getState().pendingMissionClearDialog;
    if (!pending) return;

    if (isIngameDialogActive()) {
      await delay(32);
      continue;
    }

    const missionId = pending.missionId;
    const priorOnDismiss = pending.options?.onDismiss;
    const completed = await Promise.race([
      new Promise<boolean>((resolve) => {
        const ok = presentIngameDialogScene(pending.sceneId, {
          ...pending.options,
          skipSeenCheck: true,
          bypassScreenShell: true,
          onDismiss: () => {
            priorOnDismiss?.();
            resolve(true);
          },
        });
        if (!ok || !isIngameDialogActive()) {
          resolve(false);
          return;
        }
      }),
      delay(TRANSIT_MISSION_CLEAR_WAIT_MS).then(() => false),
    ]);

    if (completed) {
      continue;
    }

    if (useMissionStore.getState().pendingMissionDialogId === missionId) {
      useMissionStore.getState().finalizeMissionCompletion(missionId);
    }
    return;
  }
}

function showDestroyedEquipmentAlert(labels: string[]): Promise<void> {
  if (labels.length === 0) {
    return Promise.resolve();
  }
  return awaitOverlayClose({
    present: (finish) => {
      showArcAlert(
        t('combat.durabilityDestroyedTitle'),
        t('combat.durabilityDestroyedBody', { items: labels.join(', ') }),
        [{ text: t('combat.confirm'), onPress: () => finish() }],
      );
    },
    isPresented: () => useArcOverlayStore.getState().stack.some((e) => e.kind === 'alert'),
    expire: () => {
      useArcOverlayStore.getState().dismissWhere((e) => e.kind === 'alert');
    },
  });
}

/**
 * 이동중 전투 화면에서 호출 — 연출 전부 끝난 뒤 true 반환 (worldmap replace는 호출측)
 */
export async function runTransitCombatPostFlow(payload: TransitCombatPostFlowPayload): Promise<boolean> {
  if (useTransitPostFlowStore.getState().running) return false;
  useTransitPostFlowStore.getState().setRunning(true);
  const flowStartedAt = Date.now();
  const sawSurface = { value: false };

  try {
    await settleUiAfterCombatPause();

    const locale = useAppSettingsStore.getState().locale;
    const captainId = payload.captainId?.trim() ?? '';
    const captain = captainId ? getNpcCaptain(captainId) : undefined;
    const fallbackText =
      payload.kind === 'victory'
        ? t('combat.transitEndVictoryBody', {
            credits: payload.creditGain ?? 0,
            exp: payload.expGain ?? 0,
          })
        : t('combat.transitEndFleeBody');
    const overlayEnemyName =
      payload.enemyName?.trim()
      || (captain ? resolveNpcCaptainDisplayName(captain, locale) : '')
      || t('combat.headerTitle');

    if (payload.kind === 'victory') {
      await presentCombatEndLeaderDialog({
        kind: 'defeat',
        captainId,
        fallbackLabel: t('combat.transitEndOperator'),
        fallbackText,
      });
    } else {
      const copy = resolveTransitCombatEndDialogCopy({
        kind: 'flee',
        captain: captain
          ? {
              id: captain.id,
              displayName: captain.displayName,
              displayNameEn: captain.displayNameEn,
              factionId: captain.factionId,
              portraitImageAssetKey: captain.portraitImageAssetKey,
            }
          : null,
        locale,
        fallbackLabel: t('combat.transitEndOperator'),
        fallbackText,
      });
      const imageSource = copy.usedCaptain
        ? resolveNpcCaptainPortraitSource(copy.portraitAssetKey) ?? undefined
        : resolveStellaOperatorPortrait();
      await presentAdHocCombatEndDialog({
        label: copy.label,
        text: copy.text,
        imageSource,
      });
    }
    noteTransitPostFlowSurface(sawSurface);
    await waitForIngameDialogIdle();
    noteTransitPostFlowSurface(sawSurface);

    if (payload.kind === 'victory') {
      // 결과창 이후는 공통 파이프라인 — 폴링 없이 onClose 콜백으로 잇는다.
      // 단일 데드라인만 둔다(과거의 3중 상한 대체). 정상 경로는 사용자 입력·자동닫힘으로 끝난다.
      // 150s cap은 레이스 승리 후 반드시 cancel — 미클리어 setTimeout 잔류 금지.
      const postFlowCap = delayCancellable(TRANSIT_POST_FLOW_TOTAL_DEADLINE_MS);
      try {
        await Promise.race([
          new Promise<void>((resolve) => {
            runCombatEndOutcomeFlow({
              result: {
                venue: 'transit',
                outcome: 'win',
                expEarned: payload.expGain ?? 0,
                creditsEarned: payload.creditGain ?? 0,
                enemyName: overlayEnemyName,
                destroyedLabels: payload.destroyedLabels,
              },
              // 백채널은 현재 웨이브 종료에만 있다(U-3). 차등 확정 전까지 현행 유지.
              onBackchannel: null,
              onFinished: resolve,
            });
          }),
          postFlowCap.promise,
        ]);
      } finally {
        postFlowCap.cancel();
      }
      return true;
    }

    // 이탈(flee) — 결과창 계약에 `flee` outcome 이 아직 없다(U-4). 확정 전까지 현행 유지.
    await presentLevelUpIfPending();
    noteTransitPostFlowSurface(sawSurface);
    await waitForArcOverlayKindsIdle(['levelUp']);
    noteTransitPostFlowSurface(sawSurface);

    if (shouldAbortBlankTransitPostFlow(flowStartedAt, sawSurface)) {
      await presentMissionClearWhenReady();
      await showDestroyedEquipmentAlert(payload.destroyedLabels ?? []);
      return true;
    }

    await presentMissionClearWhenReady();
    await waitForIngameDialogIdle();

    await showDestroyedEquipmentAlert(payload.destroyedLabels ?? []);
    await waitForArcOverlayKindsIdle(['alert']);
    await waitForIngameDialogIdle();

    return true;
  } finally {
    setCombatEndOutcomeHold(false);
    useTransitPostFlowStore.getState().setRunning(false);
  }
}
