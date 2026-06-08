// ============================================================
// 아크파이어 온라인 - 보상 모달
// ============================================================

import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { MissionReward } from '../types';
import { COLORS, FONTS, SPACING } from '../utils/theme';

interface RewardModalProps {
  visible: boolean;
  reward: MissionReward;
  missionTitle: string;
  leveledUp?: boolean;
  newLevel?: number;
  onClose: () => void;
}

export function RewardModal({
  visible, reward, missionTitle, leveledUp, newLevel, onClose,
}: RewardModalProps) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.header}>✦ 미션 완료 ✦</Text>
          <Text style={styles.missionTitle}>{missionTitle}</Text>

          <View style={styles.divider} />

          <Text style={styles.rewardHeader}>— 보상 획득 —</Text>

          <View style={styles.rewardRow}>
            <Text style={styles.rewardIcon}>💰</Text>
            <Text style={styles.rewardText}>크레딧 +{reward.credits.toLocaleString()}</Text>
          </View>

          <View style={styles.rewardRow}>
            <Text style={styles.rewardIcon}>⭐</Text>
            <Text style={styles.rewardText}>경험치 +{reward.exp.toLocaleString()}</Text>
          </View>

          {reward.skillPointBonus && reward.skillPointBonus > 0 && (
            <View style={styles.rewardRow}>
              <Text style={styles.rewardIcon}>✦</Text>
              <Text style={styles.rewardText}>스킬 포인트 +{reward.skillPointBonus}</Text>
            </View>
          )}

          {leveledUp && (
            <View style={styles.levelUpBox}>
              <Text style={styles.levelUpText}>🎉 LEVEL UP! → Lv.{newLevel}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>[ 계속 ]</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(245,240,232,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 300,
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
    padding: SPACING.md,
  },
  closeBtnText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.lg,
    color: COLORS.ink_dark,
    fontWeight: FONTS.weight.bold,
  },
});
