import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ArcOverlayRewardEntry } from '../arcOverlayStore';
import { LevelUpDetailPanel } from '../../../components/LevelUpDetailPanel';
import { formatCredits } from '../../../utils/formatCredits';
import { COLORS, FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';
import { ArcButton } from '../ArcButton';

type Props = {
  entry: ArcOverlayRewardEntry;
  onClose: () => void;
};

export const RewardOverlayContent = memo(function RewardOverlayContent({ entry, onClose }: Props) {
  const { reward, missionTitle, leveledUp, newLevel, levelUpDetail } = entry;
  return (
    <View style={styles.card}>
      <Text style={styles.header}>✦ 미션 완료 ✦</Text>
      <Text style={styles.missionTitle}>{missionTitle}</Text>
      <View style={styles.divider} />
      <Text style={styles.rewardHeader}>— 보상 획득 —</Text>
      <View style={styles.rewardRow}>
        <Text style={styles.rewardIcon}>💰</Text>
        <Text style={styles.rewardText}>크레딧 +{formatCredits(reward.credits, { suffix: false })}</Text>
      </View>
      <View style={styles.rewardRow}>
        <Text style={styles.rewardIcon}>⭐</Text>
        <Text style={styles.rewardText}>경험치 +{reward.exp.toLocaleString()}</Text>
      </View>
      {reward.skillPointBonus && reward.skillPointBonus > 0 ? (
        <View style={styles.rewardRow}>
          <Text style={styles.rewardIcon}>✦</Text>
          <Text style={styles.rewardText}>스킬 포인트 +{reward.skillPointBonus}</Text>
        </View>
      ) : null}
      {levelUpDetail ? (
        <View style={styles.levelUpBox}>
          <LevelUpDetailPanel summary={levelUpDetail} />
        </View>
      ) : leveledUp ? (
        <View style={styles.levelUpBox}>
          <Text style={styles.levelUpText}>🎉 LEVEL UP! → Lv.{newLevel}</Text>
        </View>
      ) : null}
      <ArcButton label="[ 계속 ]" variant="panel" onPress={onClose} style={styles.closeBtn} />
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: OVERLAY_TOKENS.cardMaxWidth,
    backgroundColor: COLORS.bg_panel,
    borderWidth: 2,
    borderColor: COLORS.border_dark,
    borderRadius: 4,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  header: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xl,
    fontWeight: FONTS.weight.bold,
    color: COLORS.gold,
    marginBottom: SPACING.sm,
  },
  missionTitle: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: COLORS.ink_dark,
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  rewardHeader: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: COLORS.ink_light,
    marginBottom: SPACING.sm,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    width: '100%',
  },
  rewardIcon: { fontSize: 16, marginRight: SPACING.sm },
  rewardText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: COLORS.ink_dark,
  },
  levelUpBox: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.bg_secondary,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderRadius: 4,
    padding: SPACING.sm,
    width: '100%',
    alignItems: 'center',
  },
  levelUpText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.gold,
  },
  closeBtn: {
    marginTop: SPACING.lg,
    alignSelf: 'stretch',
  },
});
