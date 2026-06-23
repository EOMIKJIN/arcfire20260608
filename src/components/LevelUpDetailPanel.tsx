// ============================================================
// 레벨업 상세 패널 — 숙련도·SP·다음 레벨 EXP
// ============================================================

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LevelUpSummary } from '../types';
import { useT } from '../i18n';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../utils/theme';

const PH = OVERLAY_TOKENS.phosphorAccent;
const PH_MUTED = 'rgba(107, 212, 255, 0.62)';

type Props = {
  summary: LevelUpSummary;
};

function formatMultiplier(mult: number): string {
  return mult.toFixed(3);
}

export const LevelUpDetailPanel = memo(function LevelUpDetailPanel({ summary }: Props) {
  const t = useT();
  const profBefore = summary.proficiencyBefore;
  const profAfter = summary.proficiencyAfter;
  const effDelta = profAfter.operatingEfficiencyPct - profBefore.operatingEfficiencyPct;
  const multDelta = profAfter.proficiencyMultiplier - profBefore.proficiencyMultiplier;
  const effDeltaLabel = effDelta !== 0 ? ` (${effDelta > 0 ? '+' : ''}${effDelta}%p)` : '';
  const multDeltaLabel = multDelta !== 0 ? ` (${multDelta > 0 ? '+' : ''}${multDelta.toFixed(3)})` : '';

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>{t('levelUp.heading')}</Text>
      <Text style={styles.levelLine}>
        Lv.{summary.previousLevel} → Lv.{summary.newLevel}
      </Text>

      <View style={styles.divider} />

      <Text style={styles.row}>
        {t('levelUp.skillPoints', { count: summary.skillPointsGained })}
      </Text>
      <Text style={styles.rowMuted}>
        {t('levelUp.expToNext', { exp: summary.expRemainingForNextLevel.toLocaleString() })}
      </Text>
      <Text style={styles.rowMuted}>
        {t('levelUp.expThreshold', { exp: summary.nextLevelThresholdExp.toLocaleString() })}
      </Text>

      <View style={styles.divider} />

      <Text style={styles.subHeading}>{t('levelUp.combatProficiency')}</Text>
      <Text style={styles.row}>
        {t('levelUp.combatGrade', { from: profBefore.combatLevel, to: profAfter.combatLevel })}
      </Text>
      <Text style={styles.row}>
        {t('levelUp.operatingEff', { from: profBefore.operatingEfficiencyPct, to: profAfter.operatingEfficiencyPct, delta: effDeltaLabel })}
      </Text>
      <Text style={styles.row}>
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
    color: PH,
    marginBottom: SPACING.xs,
  },
  subHeading: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: PH_MUTED,
    marginBottom: SPACING.xs,
  },
  levelLine: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: OVERLAY_TOKENS.valueContentColor,
    fontWeight: '700',
  },
  row: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: OVERLAY_TOKENS.valueContentColor,
    marginBottom: 4,
    textAlign: 'center',
  },
  rowMuted: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: PH_MUTED,
    marginBottom: 4,
    textAlign: 'center',
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: OVERLAY_TOKENS.phosphorBorder,
    marginVertical: SPACING.sm,
  },
});
