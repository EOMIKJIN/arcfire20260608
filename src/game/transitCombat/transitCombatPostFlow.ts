/**
 * 이동중 전투 종료 후 — 전투 화면(STAGE 3)에서 순차 연출 완료 후 worldmap 이동
 * 인게임대화 → 전투결과(승리) → 레vel업(조건부) → 미션완료대화 → 장비파손 알림
 */

import { InteractionManager } from 'react-native';
import { create } from 'zustand';
import {
  presentAdHocIngameDialog,
  isIngameDialogActive,
  presentIngameDialogScene,
} from '../ingameDialog/ingameDialogApi';
import { useMissionStore } from '../../store/missionStore';
import { usePlayerStore } from '../../store/playerStore';
import { useArcOverlayStore } from '../../ui/overlay/arcOverlayStore';
import { showArcOverlayReward } from '../../ui/overlay/showArcOverlay';
import { showArcAlert } from '../../utils/showArcAlert';
import { t } from '../../i18n';

export type TransitCombatPostFlowPayload = {
  kind: 'victory' | 'flee';
  enemyName?: string;
  creditGain?: number;
  expGain?: number;
  destroyedLabels?: string[];
};

const TRANSIT_VICTORY_REWARD_OVERLAY_ID = 'transit-post-combat-result';
const TRANSIT_LEVEL_UP_OVERLAY_ID = 'transit-post-combat-level-up';

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

async function settleUiAfterCombatPause(): Promise<void> {
  await new Promise<void>((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => resolve());
    });
  });
  await delay(64);
}

async function waitForIngameDialogIdle(maxMs = 20000): Promise<void> {
  const started = Date.now();
  while (isIngameDialogActive()) {
    if (Date.now() - started > maxMs) return;
    await delay(32);
  }
}

async function waitForArcOverlayKindsIdle(
  kinds: Array<'alert' | 'reward' | 'levelUp'>,
  maxMs = 20000,
): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < maxMs) {
    const stack = useArcOverlayStore.getState().stack;
    const blocking = stack.some((e) => kinds.includes(e.kind as 'alert' | 'reward' | 'levelUp'));
    if (!blocking) return;
    await delay(32);
  }
}

function dismissAlertOverlays(): void {
  useArcOverlayStore.getState().dismissWhere((e) => e.kind === 'alert');
}

function presentVictoryResultOverlay(payload: TransitCombatPostFlowPayload): Promise<void> {
  if (payload.kind !== 'victory') {
    return Promise.resolve();
  }
  const creditGain = payload.creditGain ?? 0;
  const expGain = payload.expGain ?? 0;
  const enemyName = payload.enemyName?.trim() || t('combat.headerTitle');

  return new Promise((resolve) => {
    useArcOverlayStore.getState().dismissWhere((e) => e.id === TRANSIT_VICTORY_REWARD_OVERLAY_ID);
    showArcOverlayReward({
      overlayId: TRANSIT_VICTORY_REWARD_OVERLAY_ID,
      cardTitle: t('combat.battleResultTitle'),
      reward: { credits: creditGain, exp: expGain },
      missionTitle: t('combat.victoryTitle', { name: enemyName }),
      leveledUp: false,
      onClose: () => resolve(),
    });
  });
}

async function presentAdHocTransitDialog(label: string, text: string): Promise<void> {
  dismissAlertOverlays();
  await waitForArcOverlayKindsIdle(['alert']);
  await waitForIngameDialogIdle();
  await settleUiAfterCombatPause();

  const started = Date.now();
  while (Date.now() - started < 12000) {
    const completed = await new Promise<boolean>((resolve) => {
      const ok = presentAdHocIngameDialog({
        label,
        text,
        onDismiss: () => resolve(true),
      });
      if (!ok) resolve(false);
    });
    if (completed) return;
    await waitForIngameDialogIdle(500);
    await delay(64);
  }
}

function presentLevelUpIfPending(): Promise<void> {
  const ps = usePlayerStore.getState();
  if (!ps.levelUpPending || !ps.levelUpSummary || !ps.player) {
    return Promise.resolve();
  }
  const summary = ps.levelUpSummary;
  return new Promise((resolve) => {
    useArcOverlayStore.getState().dismissWhere((e) => e.id === TRANSIT_LEVEL_UP_OVERLAY_ID);
    useArcOverlayStore.getState().present({
      id: TRANSIT_LEVEL_UP_OVERLAY_ID,
      kind: 'levelUp',
      summary,
      dismissOnBackdrop: false,
      onClose: () => {
        usePlayerStore.getState().clearLevelUp();
        resolve();
      },
    });
  });
}

async function presentMissionClearWhenReady(): Promise<void> {
  await waitForIngameDialogIdle();
  await waitForArcOverlayKindsIdle(['alert', 'reward', 'levelUp']);

  const started = Date.now();
  while (Date.now() - started < 20000) {
    const pending = useMissionStore.getState().pendingMissionClearDialog;
    if (!pending) return;

    if (isIngameDialogActive()) {
      await delay(32);
      continue;
    }

    const missionId = pending.missionId;
    const priorOnDismiss = pending.options?.onDismiss;
    const completed = await new Promise<boolean>((resolve) => {
      const ok = presentIngameDialogScene(pending.sceneId, {
        ...pending.options,
        skipSeenCheck: true,
        onDismiss: () => {
          priorOnDismiss?.();
          resolve(true);
        },
      });
      if (!ok) resolve(false);
    });

    if (completed) {
      useMissionStore.setState({ pendingMissionClearDialog: null });
      return;
    }

    if (useMissionStore.getState().pendingMissionDialogId === missionId) {
      useMissionStore.getState().finalizeMissionCompletion(missionId);
    }
    useMissionStore.setState({ pendingMissionClearDialog: null });
    return;
  }
}

function showDestroyedEquipmentAlert(labels: string[]): Promise<void> {
  if (labels.length === 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    showArcAlert(
      t('combat.durabilityDestroyedTitle'),
      t('combat.durabilityDestroyedBody', { items: labels.join(', ') }),
      [{ text: t('combat.confirm'), onPress: () => resolve() }],
    );
  });
}

/**
 * 이동중 전투 화면에서 호출 — 연출 전부 끝난 뒤 true 반환 (worldmap replace는 호출측)
 */
export async function runTransitCombatPostFlow(payload: TransitCombatPostFlowPayload): Promise<boolean> {
  if (useTransitPostFlowStore.getState().running) return false;
  useTransitPostFlowStore.getState().setRunning(true);

  try {
    await settleUiAfterCombatPause();

    const dialogText =
      payload.kind === 'victory'
        ? t('combat.transitEndVictoryBody', {
            credits: payload.creditGain ?? 0,
            exp: payload.expGain ?? 0,
          })
        : t('combat.transitEndFleeBody');

    await presentAdHocTransitDialog(t('combat.transitEndOperator'), dialogText);
    await waitForIngameDialogIdle();

    if (payload.kind === 'victory') {
      await presentVictoryResultOverlay(payload);
      await waitForArcOverlayKindsIdle(['reward']);
    }

    await presentLevelUpIfPending();
    await waitForArcOverlayKindsIdle(['levelUp']);

    await presentMissionClearWhenReady();
    await waitForIngameDialogIdle();

    await showDestroyedEquipmentAlert(payload.destroyedLabels ?? []);
    await waitForArcOverlayKindsIdle(['alert']);
    await waitForIngameDialogIdle();

    return true;
  } finally {
    useTransitPostFlowStore.getState().setRunning(false);
  }
}
