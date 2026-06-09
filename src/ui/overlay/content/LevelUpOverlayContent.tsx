import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ArcOverlayLevelUpEntry } from '../arcOverlayStore';
import { LevelUpDetailPanel } from '../../../components/LevelUpDetailPanel';
import { COLORS, FONTS, OVERLAY_TOKENS, SPACING } from '../../../utils/theme';
import { ArcButton } from '../ArcButton';

type Props = {
  entry: ArcOverlayLevelUpEntry;
  onClose: () => void;
};

export const LevelUpOverlayContent = memo(function LevelUpOverlayContent({ entry, onClose }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.header}>✦ LEVEL UP ✦</Text>
      <LevelUpDetailPanel summary={entry.summary} />
      <ArcButton label="[ 확인 ]" variant="panel" onPress={onClose} style={styles.closeBtn} />
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
    fontSize: 16,
    color: COLORS.gold,
    marginBottom: SPACING.md,
    fontWeight: '700',
  },
  closeBtn: {
    marginTop: SPACING.lg,
    alignSelf: 'stretch',
  },
});
