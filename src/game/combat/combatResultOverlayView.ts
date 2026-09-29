/**
 * 전투 결과 카드 view-model — RN/store 없이 행 가림만 계산
 */

export type CombatResultVenue = 'wave' | 'hub_orbit' | 'transit';

export const HUB_ORBIT_COMBAT_RESULT_AUTO_DISMISS_MS = 10_000;

export type CombatResultOverlayViewModel = {
  subtitleKey:
    | 'waveResult.subtitle'
    | 'waveResult.subtitleHubOrbit'
    | 'waveResult.subtitleQuestOrbit'
    | 'waveResult.subtitleTransit';
  showWaves: boolean;
  showEnemy: boolean;
  showExp: boolean;
  showCredits: boolean;
  showDestroyed: boolean;
  showItemRewards: boolean;
  showOtherItemsPlaceholder: boolean;
  showNoReward: boolean;
  showRewardsSection: boolean;
};

export function resolveCombatResultAutoDismissMs(
  venue: CombatResultVenue,
  explicit?: number,
): number | undefined {
  if (explicit === 0) return 0;
  if (typeof explicit === 'number' && explicit > 0) return explicit;
  return venue === 'hub_orbit' ? HUB_ORBIT_COMBAT_RESULT_AUTO_DISMISS_MS : undefined;
}

export function resolveCombatResultOverlayViewModel(input: {
  venue?: CombatResultVenue;
  wavesCleared?: number;
  totalWaves?: number;
  expEarned?: number;
  creditsEarned?: number;
  enemyName?: string;
  destroyedLabels?: string[];
  itemRewards?: { icon: string; label: string }[];
  /** hub_orbit 중 퀘스트 시드 — 점유 변경 없는 일반전투 */
  questOrbit?: boolean;
}): CombatResultOverlayViewModel {
  const venue = input.venue ?? 'wave';
  const totalWaves = input.totalWaves ?? 0;
  const expEarned = input.expEarned ?? 0;
  const credits = input.creditsEarned ?? 0;
  const enemyName = input.enemyName?.trim() ?? '';
  const destroyed = input.destroyedLabels?.filter((row) => row.trim().length > 0) ?? [];
  const items = input.itemRewards ?? [];
  const showWaves = venue === 'wave' && totalWaves > 0;
  const showEnemy = enemyName.length > 0;
  const showExp = expEarned > 0;
  const showCredits = credits > 0;
  const showDestroyed = destroyed.length > 0;
  const showItemRewards = items.length > 0;
  const hasRewardRows = showExp || showCredits || showDestroyed || showItemRewards;
  const showOtherItemsPlaceholder = venue === 'wave' && !hasRewardRows;
  const showNoReward = venue !== 'wave' && !hasRewardRows;
  return {
    subtitleKey:
      venue === 'hub_orbit' && input.questOrbit
        ? 'waveResult.subtitleQuestOrbit'
        : venue === 'hub_orbit'
          ? 'waveResult.subtitleHubOrbit'
          : venue === 'transit'
            ? 'waveResult.subtitleTransit'
            : 'waveResult.subtitle',
    showWaves,
    showEnemy,
    showExp,
    showCredits,
    showDestroyed,
    showItemRewards,
    showOtherItemsPlaceholder,
    showNoReward,
    showRewardsSection: hasRewardRows || showOtherItemsPlaceholder || showNoReward,
  };
}
