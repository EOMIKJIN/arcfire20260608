// ============================================================
// 레벨업 오버레이 브리지 — playerStore → arcOverlayStore
// ============================================================

import { usePathname } from 'expo-router';
import React, { memo, useEffect, useSyncExternalStore } from 'react';
import {
  isCombatEndOutcomeHold,
  subscribeCombatEndOutcomeHold,
} from '../../game/combat/combatEndOutcomeHold';
import { useTransitCombatPostFlowRunning } from '../../game/transitCombat/transitCombatPostFlow';
import { useIngameDialogStore } from '../../store/ingameDialogStore';
import { usePlayerStore } from '../../store/playerStore';
import { useOrbitCapitalCombatUiStore } from '../../store/orbitCapitalCombatUiStore';
import { useArcOverlayStore } from './arcOverlayStore';
import { resolveArcAlertAutoDismissMs } from './overlayAlertContract';

const LEVEL_UP_OVERLAY_ID = 'auto-level-up';

export const LevelUpOverlayBridge = memo(function LevelUpOverlayBridge() {
  const pathname = usePathname();
  const player = usePlayerStore((s) => s.player);
  const levelUpPending = usePlayerStore((s) => s.levelUpPending);
  const levelUpSummary = usePlayerStore((s) => s.levelUpSummary);
  const clearLevelUp = usePlayerStore((s) => s.clearLevelUp);
  const orbitCombatActive = useOrbitCapitalCombatUiStore((s) => s.active);
  const transitPostFlowRunning = useTransitCombatPostFlowRunning();
  const combatResultOpen = useArcOverlayStore((s) => s.stack.some((e) => e.kind === 'waveResult'));
  const narrativeOpen = useArcOverlayStore((s) => s.stack.some((e) => e.kind === 'narrative'));
  const ingameDialogActive = useIngameDialogStore((s) => s.isActive());
  const combatEndHold = useSyncExternalStore(
    subscribeCombatEndOutcomeHold,
    isCombatEndOutcomeHold,
    isCombatEndOutcomeHold,
  );
  const present = useArcOverlayStore((s) => s.present);
  const dismissWhere = useArcOverlayStore((s) => s.dismissWhere);

  const hideDuringCombat =
    (pathname?.includes('combat') ?? false)
    || orbitCombatActive
    || transitPostFlowRunning
    || combatResultOpen
    || narrativeOpen
    || ingameDialogActive
    || combatEndHold;
  const shouldShow = Boolean(
    levelUpPending && levelUpSummary && player && !hideDuringCombat,
  );

  useEffect(() => {
    if (shouldShow && levelUpSummary) {
      const exists = useArcOverlayStore
        .getState()
        .stack.some((e) => e.kind === 'levelUp');
      if (!exists) {
        present({
          id: LEVEL_UP_OVERLAY_ID,
          kind: 'levelUp',
          summary: levelUpSummary,
          dismissOnBackdrop: false,
          onClose: () => clearLevelUp(),
          autoDismissMs: resolveArcAlertAutoDismissMs(),
        });
      }
    } else {
      dismissWhere((e) => e.kind === 'levelUp' && e.id === LEVEL_UP_OVERLAY_ID);
    }
  }, [shouldShow, levelUpSummary, present, dismissWhere, clearLevelUp]);

  return null;
});
