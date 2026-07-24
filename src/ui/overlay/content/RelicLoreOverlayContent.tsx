import React, { memo } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import type { ArcOverlayRelicLoreEntry } from '../arcOverlayStore';
import { SPACING, FONTS, COLORS } from '../../../utils/theme';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';

type Props = {
  entry: ArcOverlayRelicLoreEntry;
  onClose: () => void;
};

/** 판테온 유물 열람 카드 — 신명·비문만(거점 좌표·기술 id 노출 없음) */
export const RelicLoreOverlayContent = memo(function RelicLoreOverlayContent({
  entry,
  onClose,
}: Props) {
  const visualTheme = resolveArcOverlayVisualTheme('relicLore');

  return (
    <ArcOverlayCard
      layout="panel"
      visualTheme={visualTheme}
      title={`〔유물〕${entry.godNameKo}`}
      onClose={onClose}
      footer={
        <ArcOverlayFooterActions
          visualTheme={visualTheme}
          onCancel={onClose}
          onConfirm={onClose}
        />
      }
    >
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.lore}>{entry.loreBodyKo}</Text>
      </ScrollView>
    </ArcOverlayCard>
  );
});

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: SPACING.xs,
  },
  lore: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    lineHeight: 20,
    color: COLORS.ink_dark,
  },
});
