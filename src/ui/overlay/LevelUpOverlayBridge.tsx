// ============================================================
// 레벨업 오버레이 브리지 — playerStore → arcOverlayStore
// ============================================================

import { usePathname } from 'expo-router';
import React, { memo, useEffect } from 'react';
import { usePlayerStore } from '../../store/playerStore';
import { useOrbitCapitalCombatUiStore } from '../../store/orbitCapitalCombatUiStore';
import { useArcOverlayStore } from './arcOverlayStore';

const LEVEL_UP_OVERLAY_ID = 'auto-level-up';

export const LevelUpOverlayBridge = memo(function LevelUpOverlayBridge() {
  const pathname = usePathname();
  const player = usePlayerStore((s) => s.player);
  const levelUpPending = usePlayerStore((s) => s.levelUpPending);
  const levelUpSummary = usePlayerStore((s) => s.levelUpSummary);
  const clearLevelUp = usePlayerStore((s) => s.clearLevelUp);
  const orbitCombatActive = useOrbitCapitalCombatUiStore((s) => s.active);
  const present = useArcOverlayStore((s) => s.present);
  const dismissWhere = useArcOverlayStore((s) => s.dismissWhere);

  const hideDuringCombat =
    (pathname?.includes('combat') ?? false) || orbitCombatActive;
  const shouldShow = Boolean(
    levelUpPending && levelUpSummary && player && !hideDuringCombat,
  );

  useEffect(() => {
    if (shouldShow && levelUpSummary) {
      const exists = useArcOverlayStore
        .getState()
        .stack.some((e) => e.kind === 'levelUp' && e.id === LEVEL_UP_OVERLAY_ID);
      if (!exists) {
        present({
          id: LEVEL_UP_OVERLAY_ID,
          kind: 'levelUp',
          summary: levelUpSummary,
          dismissOnBackdrop: false,
          onClose: () => clearLevelUp(),
        });
      }
    } else {
      dismissWhere((e) => e.kind === 'levelUp' && e.id === LEVEL_UP_OVERLAY_ID);
    }
  }, [shouldShow, levelUpSummary, present, dismissWhere, clearLevelUp]);

  return null;
});
