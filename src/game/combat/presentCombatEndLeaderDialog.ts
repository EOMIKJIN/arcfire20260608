/**
 * 전투 종료 — 적 리더 패배 인게임 대사(이동중 정본을 허브·웨이브와 공유)
 * 틱/렌더 금지. 종료 1회.
 */

import { type ImageSourcePropType } from 'react-native';
import { presentAdHocIngameDialog, isIngameDialogActive, dismissIngameDialog } from '../ingameDialog/ingameDialogApi';
import { COMBAT_END_OPERATOR_AUTO_DISMISS_MS } from '../ingameDialog/ingameDialogAutoDismiss';
import { resolveNpcCaptainPortraitSource } from '../npcCaptainPortraitAssets';
import { getNpcCaptain } from '../../npc/npcFleetRegistry';
import { runStageUiAfterIdle } from '../../navigation/stageNavGate';
import { useAppSettingsStore } from '../../store/appSettingsStore';
import { useArcOverlayStore } from '../../ui/overlay/arcOverlayStore';
import { t } from '../../i18n';
import { resolveTransitCombatEndDialogCopy } from '../transitCombat/resolveTransitCombatEndDialog';

const COMBAT_END_DIALOG_RETRY_MS = 5000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function settleUiAfterCombatPause(): Promise<void> {
  await new Promise<void>((resolve) => {
    runStageUiAfterIdle(() => resolve());
  });
  await delay(64);
}

async function waitForIngameDialogIdle(maxMs = 8000): Promise<void> {
  const started = Date.now();
  while (isIngameDialogActive()) {
    if (Date.now() - started > maxMs) return;
    await delay(32);
  }
}

export async function presentAdHocCombatEndDialog(input: {
  label: string;
  text: string;
  imageSource?: ImageSourcePropType;
}): Promise<boolean> {
  useArcOverlayStore.getState().dismissWhere((e) => e.kind === 'alert');
  await waitForIngameDialogIdle();
  await settleUiAfterCombatPause();

  const started = Date.now();
  while (Date.now() - started < COMBAT_END_DIALOG_RETRY_MS) {
    const completed = await new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (ok: boolean) => {
        if (settled) return;
        settled = true;
        resolve(ok);
      };
      const presented = presentAdHocIngameDialog({
        label: input.label,
        text: input.text,
        imageSource: input.imageSource,
        autoDismissMs: COMBAT_END_OPERATOR_AUTO_DISMISS_MS,
        bypassScreenShell: true,
        onDismiss: () => finish(true),
      });
      if (!presented || !isIngameDialogActive()) {
        finish(false);
        return;
      }
      setTimeout(() => {
        if (settled) return;
        dismissIngameDialog();
        finish(true);
      }, COMBAT_END_OPERATOR_AUTO_DISMISS_MS + 2000);
    });
    if (completed) return true;
    await waitForIngameDialogIdle(500);
    await delay(64);
  }
  return false;
}

export async function presentCombatEndLeaderDialog(input: {
  kind: 'defeat';
  captainId?: string | null;
  fallbackLabel?: string;
  fallbackText?: string;
}): Promise<boolean> {
  const locale = useAppSettingsStore.getState().locale;
  const captainId = input.captainId?.trim() ?? '';
  const row = captainId ? getNpcCaptain(captainId) : undefined;
  const fallbackLabel = input.fallbackLabel ?? t('combat.transitEndOperator');
  const fallbackText = input.fallbackText ?? t('combat.enemyDefeatFallback');
  const copy = resolveTransitCombatEndDialogCopy({
    kind: input.kind,
    captain: row
      ? {
          id: row.id,
          displayName: row.displayName,
          displayNameEn: row.displayNameEn,
          factionId: row.factionId,
          portraitImageAssetKey: row.portraitImageAssetKey,
        }
      : null,
    locale,
    fallbackLabel,
    fallbackText,
  });
  const imageSource = resolveNpcCaptainPortraitSource(copy.portraitAssetKey) ?? undefined;
  return presentAdHocCombatEndDialog({
    label: copy.label,
    text: copy.text,
    imageSource,
  });
}
