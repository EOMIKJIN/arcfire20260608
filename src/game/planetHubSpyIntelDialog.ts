// ============================================================
// 행성 허브 — 스파이 정보원 인게임 대화 (배지·씬 오버라이드)
// ============================================================

import { buildArcCoreSpyIntelAckKey } from '../arcCore/spy/tryNotifyArcCoreSpyIntelAlert';
import {
  clearPendingArcCoreSpyIntelAlert,
  getPendingArcCoreSpyIntelAlertForPlanet,
} from '../arcCore/spy/arcCoreSpyIntelAlertStore';
import { resolveArcCoreSpyPolicy } from '../arcCore/spy/arcCoreSpyPolicy';
import { presentIngameDialogScene } from './ingameDialog/ingameDialogApi';
import { usePlayerStore } from '../store/playerStore';
import type { PlanetHubNpcDialogTarget } from './planetHubNpcDialog';
import { markHubDialogBadgeAcknowledged } from './planetHubNpcDialog';

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
    onDismiss: () => {
      markHubDialogBadgeAcknowledged(ackKeys);
      clearPendingArcCoreSpyIntelAlert(planetId);
      options?.onDismiss?.();
    },
  });
}
