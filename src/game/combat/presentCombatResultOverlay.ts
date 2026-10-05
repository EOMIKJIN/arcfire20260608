/**
 * 전투 결과 범용 present — 웨이브 · 허브 궤도(일반) · 이동중
 * UI 셸은 기존 `waveResult` compact 카드. 장소(venue)만 필드·자막을 가린다.
 */

import { usePlayerStore } from '../../store/playerStore';
import { useArcOverlayStore, presentWaveResultOverlay } from '../../ui/overlay/arcOverlayStore';
import { ARC_OVERLAY_DEFAULT_AUTO_DISMISS_MS } from '../../ui/overlay/overlayAlertContract';
import {
  resolveCombatResultAutoDismissMs,
  type CombatResultVenue,
} from './combatResultOverlayView';

export type { CombatResultVenue } from './combatResultOverlayView';
export {
  HUB_ORBIT_COMBAT_RESULT_AUTO_DISMISS_MS,
  resolveCombatResultAutoDismissMs,
  resolveCombatResultOverlayViewModel,
} from './combatResultOverlayView';
export type { CombatResultOverlayViewModel } from './combatResultOverlayView';

const COMBAT_RESULT_LEVEL_UP_OVERLAY_ID = 'combat-result-level-up';

export type PresentCombatResultInput = {
  outcome: 'win' | 'lose' | 'draw';
  venue?: CombatResultVenue;
  wavesCleared?: number;
  totalWaves?: number;
  expEarned?: number;
  creditsEarned?: number;
  enemyName?: string;
  destroyedLabels?: string[];
  itemRewards?: { icon: string; label: string }[];
  questOrbit?: boolean;
  autoDismissMs?: number;
  onClose: () => void;
};

export function presentCombatResultOverlay(input: PresentCombatResultInput): void {
  const venue = input.venue ?? 'wave';
  presentWaveResultOverlay({
    outcome: input.outcome,
    venue,
    wavesCleared: input.wavesCleared ?? 0,
    totalWaves: input.totalWaves ?? 0,
    expEarned: input.expEarned ?? 0,
    creditsEarned: input.creditsEarned,
    enemyName: input.enemyName,
    destroyedLabels: input.destroyedLabels,
    itemRewards: input.itemRewards,
    questOrbit: input.questOrbit,
    autoDismissMs: resolveCombatResultAutoDismissMs(venue, input.autoDismissMs),
    onClose: input.onClose,
  });
}

/** 결과창 이후 레벨업 — 허브는 orbitCombatActive가 켜져 있어 브리지가 가리므로 직접 present */
export function presentPendingCombatLevelUpThen(onDone: () => void): void {
  const ps = usePlayerStore.getState();
  if (!ps.levelUpPending || !ps.levelUpSummary || !ps.player) {
    onDone();
    return;
  }
  const summary = ps.levelUpSummary;
  // 대사 session 은 이미 비었는데 narrative 잔여가 있으면 compact 가 가려지고 autodismiss 도 멈춘다.
  useArcOverlayStore.getState().dismissWhere((e) => e.kind === 'narrative');
  useArcOverlayStore.getState().dismissWhere((e) => e.kind === 'levelUp');
  useArcOverlayStore.getState().present({
    id: COMBAT_RESULT_LEVEL_UP_OVERLAY_ID,
    kind: 'levelUp',
    summary,
    dismissOnBackdrop: false,
    autoDismissMs: ARC_OVERLAY_DEFAULT_AUTO_DISMISS_MS,
    onClose: () => {
      usePlayerStore.getState().clearLevelUp();
      onDone();
    },
  });
}
