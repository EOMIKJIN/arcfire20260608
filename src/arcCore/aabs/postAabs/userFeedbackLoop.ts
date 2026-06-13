// ============================================================
// Post-AABS — `3.Post_AABS_Automation_Roadmap.md`
// ============================================================

import { LevelBandTargets_FROM_BALANCE_CSV } from '../../../data/balance/generated';
import { AABS_USER_DWELL_ALERT_RATIO } from '../aabsConstants';
import { enqueueDailyOpsObservation } from '../../userMod/dailyOpsObservationQueue';
import { usePlayerStore } from '../../../store/playerStore';

export type UserDwellAlert = {
  bandId: string;
  playerLevel: number;
  dwellRatio: number;
  suggestReduceDifficulty: boolean;
};

export function detectUserDwellAnomaly(
  minutesInBand: number,
  playerLevel: number,
): UserDwellAlert | null {
  const band = LevelBandTargets_FROM_BALANCE_CSV.find(
    (b) => playerLevel >= Number(b.minLevel) && playerLevel <= Number(b.maxLevel),
  );
  if (!band) return null;
  const targetMin = Number(band.targetMinutesPerLevel);
  const dwellRatio = targetMin > 0 ? minutesInBand / targetMin : 0;
  if (dwellRatio < AABS_USER_DWELL_ALERT_RATIO) return null;
  return {
    bandId: String(band.bandId),
    playerLevel,
    dwellRatio,
    suggestReduceDifficulty: true,
  };
}

export function applyUserDwellCorrection(alert: UserDwellAlert): void {
  if (!alert.suggestReduceDifficulty) return;
  void enqueueDailyOpsObservation({
    kind: 'dwell_correction',
    alert,
    observedAt: Date.now(),
  });
}

export function shouldShowOnboardingGuide(): boolean {
  const player = usePlayerStore.getState().player;
  if (!player) return false;
  return player.level <= 5 && player.skills.length === 0;
}

export function shouldSpawnMissionBalanceAssist(): boolean {
  const player = usePlayerStore.getState().player;
  if (!player) return false;
  const band = LevelBandTargets_FROM_BALANCE_CSV.find(
    (b) => player.level >= Number(b.minLevel) && player.level <= Number(b.maxLevel),
  );
  if (!band) return false;
  return player.level < Number(band.maxLevel) && player.ship.hp < player.ship.maxHp * 0.4;
}
