// ============================================================
// 행성 허브 — 스파이 정보원 인게임 대화 (배지·씬 오버라이드)
// ============================================================

import { buildArcCoreSpyIntelAckKey } from '../arcCore/spy/tryNotifyArcCoreSpyIntelAlert';
import {
  clearPendingArcCoreSpyIntelAlert,
  getPendingArcCoreSpyIntelAlertForPlanet,
} from '../arcCore/spy/arcCoreSpyIntelAlertStore';
import { resolveArcCoreSpyPolicy } from '../arcCore/spy/arcCoreSpyPolicy';
import {
  hasPlanetHubLandDialogSyncDone,
  isSpyIntelAutoOpenIdleArmed,
  markPlanetHubLandDialogSyncDone,
  resetPlanetHubSpyIntelDialogSchedule,
  setSpyIntelAutoOpenIdleArmed,
  shouldHoldSpyIntelAutoOpen,
} from '../arcCore/spy/spyIntelAutoOpenGate';
import { isIngameDialogActive, presentIngameDialogScene } from './ingameDialog/ingameDialogApi';
import { COMBAT_END_OPERATOR_AUTO_DISMISS_MS } from './ingameDialog/ingameDialogAutoDismiss';
import { runAfterIngameDialogIdle } from './ingameDialog/ingameDialogIdle';
import { usePlayerStore } from '../store/playerStore';
import type { PlanetHubNpcDialogTarget } from './planetHubNpcDialog';
import { markHubDialogBadgeAcknowledged } from './planetHubNpcDialog';

export {
  hasPlanetHubLandDialogSyncDone,
  markPlanetHubLandDialogSyncDone,
  resetPlanetHubSpyIntelDialogSchedule,
};

function isSpyIntelAcknowledged(ackKey: string): boolean {
  const keys = usePlayerStore.getState().player?.flags.acknowledgedHubDialogKeys ?? [];
  return keys.includes(ackKey);
}

export function buildHubDialogSpyIntelAckKey(planetId: string, spyCaptainId: string): string {
  return buildArcCoreSpyIntelAckKey(planetId, spyCaptainId);
}

/** 스파이 감지 알림 대기 중이면 정보원 씬으로 허브 대화 타겟 오버라이드 */
export function resolvePlanetHubSpyIntelDialogTarget(
  planetId: string,
): PlanetHubNpcDialogTarget | null {
  const pending = getPendingArcCoreSpyIntelAlertForPlanet(planetId);
  if (!pending) return null;
  if (isSpyIntelAcknowledged(pending.ackKey)) return null;

  return {
    sceneId: pending.sceneId,
    priority: -100,
    captainId: pending.informantCaptainId,
    source: 'spy_intel',
    showInitiatedBadge: true,
  };
}

export function hasUnacknowledgedPlanetHubSpyIntelAlert(planetId: string): boolean {
  return resolvePlanetHubSpyIntelDialogTarget(planetId) != null;
}

/**
 * 허브 자동 긴급보고 — 최초 도착 전 스킵, 착륙 대사 시도 후,
 * 오퍼레이터 창이 열려 있으면 idle 뒤에만 오픈 (슬롯 탈취 금지).
 */
export function schedulePlanetHubSpyIntelDialog(planetId: string): boolean {
  const pid = String(planetId ?? '').trim();
  if (!pid) return false;
  if (shouldHoldSpyIntelAutoOpen(pid)) return false;
  if (!resolveArcCoreSpyPolicy().spyIntelAutoOpenDialog) return false;
  if (!hasUnacknowledgedPlanetHubSpyIntelAlert(pid)) return false;
  if (isIngameDialogActive()) {
    if (!isSpyIntelAutoOpenIdleArmed()) {
      setSpyIntelAutoOpenIdleArmed(true);
      runAfterIngameDialogIdle(() => {
        setSpyIntelAutoOpenIdleArmed(false);
        schedulePlanetHubSpyIntelDialog(pid);
      });
    }
    return false;
  }
  return presentPlanetHubSpyIntelDialog(pid);
}

export function presentPlanetHubSpyIntelDialog(
  planetId: string,
  options?: { onDismiss?: () => void },
): boolean {
  const pending = getPendingArcCoreSpyIntelAlertForPlanet(planetId);
  if (!pending || isSpyIntelAcknowledged(pending.ackKey)) return false;

  const policy = resolveArcCoreSpyPolicy();
  const sceneId = pending.sceneId || policy.informantDialogSceneId;
  const ackKeys = [
    pending.ackKey,
    `hub_dialog_scene:${sceneId}`,
    `hub_dialog:${planetId}:${pending.informantCaptainId}`,
  ];

  return presentIngameDialogScene(sceneId, {
    autoDismissMs: COMBAT_END_OPERATOR_AUTO_DISMISS_MS,
    autoDismissMode: 'first_idle',
    onDismiss: () => {
      markHubDialogBadgeAcknowledged(ackKeys);
      clearPendingArcCoreSpyIntelAlert(planetId);
      options?.onDismiss?.();
    },
  });
}
