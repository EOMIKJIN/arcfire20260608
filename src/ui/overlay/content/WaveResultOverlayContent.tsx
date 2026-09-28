import React, { memo } from 'react';
import { Text, View } from 'react-native';
import type { ArcOverlayWaveResultEntry } from '../arcOverlayStore';
import { COLORS } from '../../../utils/theme';
import { useT } from '../../../i18n';
import { resolveCombatResultOverlayViewModel } from '../../../game/combat/combatResultOverlayView';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { ArcOverlayInfoRow } from '../ArcOverlayInfoRow';
import { resolveOverlayCompactBodyStyles } from '../overlayCompactBodyStyles';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';

type Props = {
  entry: ArcOverlayWaveResultEntry;
  onClose: () => void;
};

export const WaveResultOverlayContent = memo(function WaveResultOverlayContent({ entry, onClose }: Props) {
  const t = useT();
  const visualTheme = resolveArcOverlayVisualTheme('waveResult');
  const body = resolveOverlayCompactBodyStyles(visualTheme);
  const { outcome, wavesCleared, totalWaves, expEarned, itemRewards, creditsEarned, enemyName, destroyedLabels } = entry;
  const isWin = outcome === 'win';
  const view = resolveCombatResultOverlayViewModel({
    venue: entry.venue,
    wavesCleared,
    totalWaves,
    expEarned,
    creditsEarned,
    enemyName,
    destroyedLabels,
    itemRewards,
  });

  return (
    <ArcOverlayCard
      title={isWin ? t('waveResult.win') : t('waveResult.lose')}
      subtitle={t(view.subtitleKey)}
      titleColor={isWin ? undefined : COLORS.danger}
      layout="compact"
      visualTheme={visualTheme}
      onClose={onClose}
      footer={(
        <ArcOverlayFooterActions
          confirmOnly
          confirmLabel={t('waveResult.confirm')}
          onConfirm={onClose}
          visualTheme={visualTheme}
        />
      )}
    >
      <View style={body.divider} />
      {view.showWaves ? (
        <ArcOverlayInfoRow
          label={t('waveResult.clearedWaves')}
          value={`${wavesCleared} / ${totalWaves}`}
          visualTheme={visualTheme}
        />
      ) : null}
      {view.showEnemy && enemyName ? (
        <ArcOverlayInfoRow
          label={t('waveResult.enemy')}
          value={enemyName}
          visualTheme={visualTheme}
        />
      ) : null}
      {view.showRewardsSection ? (
        <Text style={body.sectionLabel}>{t('waveResult.rewards')}</Text>
      ) : null}
      {view.showExp ? (
        <View style={body.row}>
          <Text style={body.rowIcon}>⭐</Text>
          <Text style={body.rowText}>{t('waveResult.exp', { exp: expEarned.toLocaleString() })}</Text>
        </View>
      ) : null}
      {view.showCredits ? (
        <View style={body.row}>
          <Text style={body.rowIcon}>💰</Text>
          <Text style={body.rowText}>{t('waveResult.credits', { credits: (creditsEarned ?? 0).toLocaleString() })}</Text>
        </View>
      ) : null}
      {view.showDestroyed && destroyedLabels && destroyedLabels.length > 0 ? (
        <ArcOverlayInfoRow
          label={t('waveResult.destroyed')}
          value={destroyedLabels.join(', ')}
          visualTheme={visualTheme}
        />
      ) : null}
      {view.showItemRewards && itemRewards
        ? itemRewards.map((it, i) => (
          <View style={body.row} key={`${it.label}-${i}`}>
            <Text style={body.rowIcon}>{it.icon}</Text>
            <Text style={body.rowText}>{it.label}</Text>
          </View>
        ))
        : null}
      {view.showOtherItemsPlaceholder ? (
        <View style={body.row}>
          <Text style={body.rowIcon}>🎁</Text>
          <Text style={body.rowMuted}>{t('waveResult.otherItems')}</Text>
        </View>
      ) : null}
      {view.showNoReward ? (
        <View style={body.row}>
          <Text style={body.rowMuted}>{t('waveResult.noReward')}</Text>
        </View>
      ) : null}
    </ArcOverlayCard>
  );
});
