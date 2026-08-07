import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ArcOverlayRewardEntry } from '../arcOverlayStore';
import { LevelUpDetailPanel } from '../../../components/LevelUpDetailPanel';
import { formatCredits } from '../../../utils/formatCredits';
import { useT } from '../../../i18n';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { resolveOverlayCompactBodyStyles } from '../overlayCompactBodyStyles';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';

type Props = {
  entry: ArcOverlayRewardEntry;
  onClose: () => void;
};

export const RewardOverlayContent = memo(function RewardOverlayContent({ entry, onClose }: Props) {
  const t = useT();
  const visualTheme = resolveArcOverlayVisualTheme('reward');
  const body = resolveOverlayCompactBodyStyles(visualTheme);
  const { reward, missionTitle, cardTitle, leveledUp, newLevel, levelUpDetail } = entry;
  return (
    <ArcOverlayCard
      title={cardTitle ?? t('reward.missionComplete')}
      subtitle={missionTitle}
      layout="compact"
      visualTheme={visualTheme}
      onClose={onClose}
      footer={(
        <ArcOverlayFooterActions
          confirmOnly
          confirmLabel={t('reward.continue')}
          onConfirm={onClose}
          visualTheme={visualTheme}
        />
      )}
    >
      <View style={body.divider} />
      <Text style={body.sectionLabel}>{t('reward.gained')}</Text>
      <View style={body.row}>
        <Text style={body.rowIcon}>💰</Text>
        <Text style={body.rowText}>{t('reward.credits', { value: formatCredits(reward.credits, { suffix: false }) })}</Text>
      </View>
      <View style={body.row}>
        <Text style={body.rowIcon}>⭐</Text>
        <Text style={body.rowText}>{t('reward.exp', { value: reward.exp.toLocaleString() })}</Text>
      </View>
      {reward.skillPointBonus && reward.skillPointBonus > 0 ? (
        <View style={body.row}>
          <Text style={body.rowIcon}>✦</Text>
          <Text style={body.rowText}>{t('reward.skillPoint', { value: reward.skillPointBonus })}</Text>
        </View>
      ) : null}
      {levelUpDetail ? (
        <View style={body.insetBox}>
          <LevelUpDetailPanel summary={levelUpDetail} visualTheme={visualTheme} />
        </View>
      ) : leveledUp ? (
        <View style={body.insetBox}>
          <Text style={body.rowText}>{t('reward.levelUp', { level: newLevel ?? 0 })}</Text>
        </View>
      ) : null}
    </ArcOverlayCard>
  );
});
