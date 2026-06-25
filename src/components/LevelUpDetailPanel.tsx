// ============================================================
// 레벨업 상세 패널 — 숙련도·SP·다음 레벨 EXP
// ============================================================

import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LevelUpSummary } from '../types';
import { useT } from '../i18n';
import { FONTS, SPACING } from '../utils/theme';
import type { ArcOverlayVisualTheme } from '../ui/overlay/tacticalOverlayRollout';
import { resolveOverlayVisualTokens } from '../ui/overlay/overlayVisualTokens';

type Props = {
  summary: LevelUpSummary;
  visualTheme?: ArcOverlayVisualTheme;
};

function formatMultiplier(mult: number): string {
  return mult.toFixed(3);
}

export const LevelUpDetailPanel = memo(function LevelUpDetailPanel({
  summary,
  visualTheme = 'phosphor',
}: Props) {
  const t = useT();
  const ink = useMemo(() => resolveOverlayVisualTokens(visualTheme), [visualTheme]);
  const profBefore = summary.proficiencyBefore;
  const profAfter = summary.proficiencyAfter;
  const effDelta = profAfter.operatingEfficiencyPct - profBefore.operatingEfficiencyPct;
  const multDelta = profAfter.proficiencyMultiplier - profBefore.proficiencyMultiplier;
  const effDeltaLabel = effDelta !== 0 ? ` (${effDelta > 0 ? '+' : ''}${effDelta}%p)` : '';
  const multDeltaLabel = multDelta !== 0 ? ` (${multDelta > 0 ? '+' : ''}${multDelta.toFixed(3)})` : '';

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, { color: ink.accentInk }]}>{t('levelUp.heading')}</Text>
      <Text style={[styles.levelLine, { color: ink.valueInk }]}>
        Lv.{summary.previousLevel} → Lv.{summary.newLevel}
      </Text>

      <View style={[styles.divider, { backgroundColor: ink.insetBorder }]} />

      <Text style={[styles.row, { color: ink.valueInk }]}>
        {t('levelUp.skillPoints', { count: summary.skillPointsGained })}
      </Text>
      <Text style={[styles.rowMuted, { color: ink.labelInk }]}>
        {t('levelUp.expToNext', { exp: summary.expRemainingForNextLevel.toLocaleString() })}
      </Text>
      <Text style={[styles.rowMuted, { color: ink.labelInk }]}>
        {t('levelUp.expThreshold', { exp: summary.nextLevelThresholdExp.toLocaleString() })}
      </Text>

      <View style={[styles.divider, { backgroundColor: ink.insetBorder }]} />

      <Text style={[styles.subHeading, { color: ink.labelInk }]}>{t('levelUp.combatProficiency')}</Text>
      <Text style={[styles.row, { color: ink.valueInk }]}>
        {t('levelUp.combatGrade', { from: profBefore.combatLevel, to: profAfter.combatLevel })}
      </Text>
      <Text style={[styles.row, { color: ink.valueInk }]}>
        {t('levelUp.operatingEff', { from: profBefore.operatingEfficiencyPct, to: profAfter.operatingEfficiencyPct, delta: effDeltaLabel })}
      </Text>
      <Text style={[styles.row, { color: ink.valueInk }]}>
        {t('levelUp.proficiencyMult', { from: formatMultiplier(profBefore.proficiencyMultiplier), to: formatMultiplier(profAfter.proficiencyMultiplier), delta: multDeltaLabel })}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
  },
  heading: {
    fontFamily: FONTS.mono,
    fontSize: 14,
    marginBottom: SPACING.xs,
  },
  subHeading: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    marginBottom: SPACING.xs,
  },
  levelLine: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    fontWeight: '700',
  },
  row: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    marginBottom: 4,
    textAlign: 'center',
  },
  rowMuted: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  divider: {
    width: '80%',
    height: 1,
    marginVertical: SPACING.sm,
  },
});
