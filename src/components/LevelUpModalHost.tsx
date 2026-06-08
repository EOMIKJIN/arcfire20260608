// ============================================================
// 레벨업 모달 호스트 — 전투 중 숨김 (docs/_player-combat-proficiency-system.md §7)
// ============================================================

import React, { memo, useCallback } from 'react';
import { usePathname } from 'expo-router';
import { usePlayerStore } from '../store/playerStore';
import { useOrbitCapitalCombatUiStore } from '../store/orbitCapitalCombatUiStore';
import { LevelUpModal } from './LevelUpModal';

export const LevelUpModalHost = memo(function LevelUpModalHost() {
  const pathname = usePathname();
  const player = usePlayerStore((s) => s.player);
  const levelUpPending = usePlayerStore((s) => s.levelUpPending);
  const levelUpSummary = usePlayerStore((s) => s.levelUpSummary);
  const clearLevelUp = usePlayerStore((s) => s.clearLevelUp);
  const orbitCombatActive = useOrbitCapitalCombatUiStore((s) => s.active);

  const hideDuringCombat =
    (pathname?.includes('combat') ?? false) || orbitCombatActive;

  const visible = Boolean(
    levelUpPending && levelUpSummary && player && !hideDuringCombat,
  );

  const handleClose = useCallback(() => {
    clearLevelUp();
  }, [clearLevelUp]);

  if (!levelUpSummary) return null;

  return (
    <LevelUpModal
      visible={visible}
      summary={levelUpSummary}
      onClose={handleClose}
    />
  );
});
