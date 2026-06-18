import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ArcOverlayRewardEntry } from '../arcOverlayStore';
import { LevelUpDetailPanel } from '../../../components/LevelUpDetailPanel';
import { formatCredits } from '../../../utils/formatCredits';
import { useT } from '../../../i18n';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';
import { ArcButton } from '../ArcButton';
import { phosphorOverlay } from './phosphorOverlayStyles';

type Props = {
  entry: ArcOverlayRewardEntry;
  onClose: () => void;
};

export const RewardOverlayContent = memo(function RewardOverlayContent({ entry, onClose }: Props) {
  const t = useT();
  const { reward, missionTitle, leveledUp, newLevel, levelUpDetail } = entry;
  return (
    <View style={phosphorOverlay.card}>
      <Text style={phosphorOverlay.title}>{t('reward.missionComplete')}</Text>
      <Text style={phosphorOverlay.subtitle}>{missionTitle}</Text>
      <View style={phosphorOverlay.divider} />
      <Text style={phosphorOverlay.sectionLabel}>{t('reward.gained')}</Text>
      <View style={phosphorOverlay.row}>
        <Text style={phosphorOverlay.rowIcon}>💰</Text>
        <Text style={phosphorOverlay.rowText}>{t('reward.credits', { value: formatCredits(reward.credits, { suffix: false }) })}</Text>
      </View>
      <View style={phosphorOverlay.row}>
        <Text style={phosphorOverlay.rowIcon}>⭐</Text>
        <Text style={phosphorOverlay.rowText}>{t('reward.exp', { value: reward.exp.toLocaleString() })}</Text>
      </View>
      {reward.skillPointBonus && reward.skillPointBonus > 0 ? (
        <View style={phosphorOverlay.row}>
          <Text style={phosphorOverlay.rowIcon}>✦</Text>
          <Text style={phosphorOverlay.rowText}>{t('reward.skillPoint', { value: reward.skillPointBonus })}</Text>
        </View>
      ) : null}
      {levelUpDetail ? (
        <View style={styles.levelUpBox}>
          <LevelUpDetailPanel summary={levelUpDetail} />
        </View>
      ) : leveledUp ? (
        <View style={styles.levelUpBox}>
          <Text style={styles.levelUpText}>{t('reward.levelUp', { level: newLevel ?? 0 })}</Text>
        </View>
      ) : null}
      <ArcButton label={t('reward.continue')} variant="primary" onPress={onClose} style={phosphorOverlay.closeBtn} />
    </View>
  );
});

const styles = StyleSheet.create({
  levelUpBox: {
    marginTop: SPACING.md,
    backgroundColor: OVERLAY_TOKENS.phosphorCardInsetBg,
    borderWidth: 1,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    borderRadius: 4,
    padding: SPACING.sm,
    width: '100%',
    alignItems: 'center',
  },
  levelUpText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: OVERLAY_TOKENS.phosphorAccent,
    textShadowColor: 'rgba(107, 212, 255, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
