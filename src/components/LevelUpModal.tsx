// ============================================================
// 레벨업 전역 모달
// ============================================================

import React, { memo } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import type { LevelUpSummary } from '../types';
import { COLORS, FONTS, SPACING } from '../utils/theme';
import { LevelUpDetailPanel } from './LevelUpDetailPanel';

type Props = {
  visible: boolean;
  summary: LevelUpSummary;
  onClose: () => void;
};

export const LevelUpModal = memo(function LevelUpModal({ visible, summary, onClose }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.header}>✦ LEVEL UP ✦</Text>
          <LevelUpDetailPanel summary={summary} />
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>[ 확인 ]</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6, 10, 20, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: 300,
    maxWidth: '100%',
    backgroundColor: COLORS.bg_panel,
    borderWidth: 2,
    borderColor: COLORS.border_dark,
    borderRadius: 4,
    padding: SPACING.xl,
    alignItems: 'center',
  },
  header: {
    fontFamily: FONTS.mono,
    fontSize: 16,
    color: COLORS.gold,
    marginBottom: SPACING.md,
    fontWeight: '700',
  },
  closeBtn: {
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border_dark,
    borderRadius: 4,
  },
  closeBtnText: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    color: COLORS.ink_dark,
  },
});
