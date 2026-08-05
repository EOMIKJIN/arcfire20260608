import React, { memo } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import type { ArcOverlayRelicLoreEntry } from '../arcOverlayStore';
import { SPACING, FONTS, COLORS } from '../../../utils/theme';
import { ArcOverlayCard } from '../ArcOverlayCard';
import { ArcOverlayFooterActions } from '../ArcOverlayFooterActions';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';
import { getLocale, isKoUi, useT } from '../../../i18n';

type Props = {
  entry: ArcOverlayRelicLoreEntry;
  onClose: () => void;
};

/** 판테온 유물 열람 카드 — 신명·비문만(거점 좌표·기술 id 노출 없음) */
export const RelicLoreOverlayContent = memo(function RelicLoreOverlayContent({
  entry,
  onClose,
}: Props) {
  const t = useT();
  const visualTheme = resolveArcOverlayVisualTheme('relicLore');
  const godName =
    !isKoUi(getLocale()) && entry.godNameEn?.trim()
      ? entry.godNameEn.trim()
      : entry.godNameKo;

  return (
    <ArcOverlayCard
      layout="panel"
      visualTheme={visualTheme}
      title={t('relic.title', { name: godName })}
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
