import type { LevelUpSummary, MissionReward } from '../../types';
import {
  presentArcOverlayAlert,
  useArcOverlayStore,
  type ArcAlertButton,
  type ArcOverlayNarrativeEntry,
} from './arcOverlayStore';

export type { ArcAlertButton, ArcOverlayEntry, ArcOverlayKind, PlanetDevelopmentInitialView } from './arcOverlayStore';
export {
  presentArcOverlayAlert,
  dismissArcOverlay,
  dismissAllArcOverlays,
  presentPlanetEconomyInfoOverlay,
  presentPlanetDevelopmentOverlay,
  presentWaveResultOverlay,
  presentSettingsOverlay,
  presentBmShopOverlay,
  useArcOverlayStore,
} from './arcOverlayStore';

export function showArcOverlayReward(payload: {
  reward: MissionReward;
  missionTitle: string;
  leveledUp?: boolean;
  newLevel?: number;
  levelUpDetail?: LevelUpSummary | null;
  onClose: () => void;
  overlayId?: string;
}): void {
  const id = payload.overlayId ?? 'arc-reward-overlay';
  useArcOverlayStore.getState().dismissWhere((e) => e.id === id);
  useArcOverlayStore.getState().present({
    id,
    kind: 'reward',
    dismissOnBackdrop: false,
    reward: payload.reward,
    missionTitle: payload.missionTitle,
    leveledUp: payload.leveledUp,
    newLevel: payload.newLevel,
    levelUpDetail: payload.levelUpDetail,
    onClose: payload.onClose,
  });
}

/** @deprecated IngameDialogHost + presentIngameDialogScene 사용. Table-First narrative 전용. */
export function showArcOverlayNarrative(
  payload: Omit<ArcOverlayNarrativeEntry, 'id' | 'kind'>,
): void {
  useArcOverlayStore.getState().present({
    kind: 'narrative',
    dismissOnBackdrop: false,
    ...payload,
  });
}

/** @deprecated dismissIngameDialog / useArcOverlayStore.dismiss 사용 */
export function dismissArcOverlayNarrative(): void {
  useArcOverlayStore.getState().dismissWhere((e) => e.kind === 'narrative');
}

/** @deprecated showArcAlert 사용 권장 */
export function showArcOverlayAlert(
  title: string,
  message?: string,
  buttons?: ArcAlertButton[],
): void {
  presentArcOverlayAlert(title, message ?? '', buttons);
}
