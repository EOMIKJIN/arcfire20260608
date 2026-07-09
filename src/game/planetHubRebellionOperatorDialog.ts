// ============================================================
// 행성 허브 — 오퍼레이터 빈부격차·반란 인게임 대화
// ============================================================

import { getNpcCaptain } from '../npc/npcFleetRegistry';
import { resolveNpcCaptainPortraitSource } from './npcCaptainPortraitAssets';
import {
  clearPendingPlanetRebellionOperatorAlert,
  getPendingPlanetRebellionOperatorAlertForPlanet,
  type PlanetRebellionOperatorAlertPending,
} from '../arcCore/rebellion/planetRebellionOperatorAlertStore';
import { resolvePlanetRebellionOperatorDialogCopy } from '../arcCore/rebellion/resolvePlanetRebellionOperatorDialogCopy';
import {
  resolveOperatorRebellionAlertCaptainId,
  resolveOperatorCivilWarRealtimeAutoOpen,
} from '../arcCore/balance/wealthDisparityPolicy';
import { isIngameDialogActive, presentAdHocIngameDialog } from './ingameDialog/ingameDialogApi';
import { usePlayerStore } from '../store/playerStore';
import { markHubDialogBadgeAcknowledged } from './planetHubNpcDialog';

const OPERATOR_LABEL_FALLBACK_KO = '[ 안내 오퍼레이터 ]';

function isRebellionOperatorAlertAcknowledged(ackKey: string): boolean {
  const keys = usePlayerStore.getState().player?.flags.acknowledgedHubDialogKeys ?? [];
  return keys.includes(ackKey);
}

export function presentPlanetHubRebellionOperatorDialog(
  planetId: string,
  options?: { onDismiss?: () => void },
): boolean {
  const pending = getPendingPlanetRebellionOperatorAlertForPlanet(planetId);
  if (!pending || isRebellionOperatorAlertAcknowledged(pending.ackKey)) return false;
  if (isIngameDialogActive()) return false;

  const copy = resolvePlanetRebellionOperatorDialogCopy(pending);
  const captainId = resolveOperatorRebellionAlertCaptainId();
  const imageSource = resolveOperatorPortraitSource(captainId) ?? undefined;

  return presentAdHocIngameDialog({
    label: copy.label || OPERATOR_LABEL_FALLBACK_KO,
    text: copy.text,
    imageSource,
    typewriterSpeedMs: 42,
    onDismiss: () => {
      markHubDialogBadgeAcknowledged([pending.ackKey]);
      clearPendingPlanetRebellionOperatorAlert(planetId);
      options?.onDismiss?.();
    },
  });
}

function resolveOperatorPortraitSource(captainId: string) {
  const captain = getNpcCaptain(captainId);
  return resolveNpcCaptainPortraitSource(captain?.portraitImageAssetKey ?? null);
}

/**
 * 내전(simmering) — 큐 적재 직후 실시간 오퍼레이터 보고 (착륙·허브 포커스 트리거 없음).
 * 다른 인게임 대화 중이면 1회 defer 후 재시도.
 */
export function tryPresentRealtimeCivilWarSimmeringOperatorAlert(planetId: string): void {
  if (!resolveOperatorCivilWarRealtimeAutoOpen()) return;

  const pid = planetId.trim();
  if (!pid) return;

  const pending = getPendingPlanetRebellionOperatorAlertForPlanet(pid);
  if (!pending || pending.kind !== 'civil_war_simmering') return;
  if (isRebellionOperatorAlertAcknowledged(pending.ackKey)) return;

  const attempt = (): boolean => presentPlanetHubRebellionOperatorDialog(pid);

  if (attempt()) return;

  setTimeout(() => {
    attempt();
  }, 0);
}

export function hasUnacknowledgedPlanetHubRebellionOperatorAlert(planetId: string): boolean {
  const pending = getPendingPlanetRebellionOperatorAlertForPlanet(planetId);
  if (!pending) return false;
  return !isRebellionOperatorAlertAcknowledged(pending.ackKey);
}

export function peekPlanetHubRebellionOperatorAlert(
  planetId: string,
): PlanetRebellionOperatorAlertPending | null {
  const pending = getPendingPlanetRebellionOperatorAlertForPlanet(planetId);
  if (!pending || isRebellionOperatorAlertAcknowledged(pending.ackKey)) return null;
  return pending;
}
