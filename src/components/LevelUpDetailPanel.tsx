// ============================================================
// 레벨업 상세 패널 — 숙련도·SP·다음 레벨 EXP
// ============================================================

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LevelUpSummary } from '../types';
import { COLORS, FONTS, SPACING } from '../utils/theme';

type Props = {
  summary: LevelUpSummary;
};

function formatMultiplier(mult: number): string {
  return mult.toFixed(3);
}

export const LevelUpDetailPanel = memo(function LevelUpDetailPanel({ summary }: Props) {
  const profBefore = summary.proficiencyBefore;
  const profAfter = summary.proficiencyAfter;
  const effDelta = profAfter.operatingEfficiencyPct - profBefore.operatingEfficiencyPct;
  const multDelta = profAfter.proficiencyMultiplier - profBefore.proficiencyMultiplier;

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>— 레벨 업 —</Text>
      <Text style={styles.levelLine}>
        Lv.{summary.previousLevel} → Lv.{summary.newLevel}
      </Text>

      <View style={styles.divider} />

      <Text style={styles.row}>
        스킬 포인트 +{summary.skillPointsGained}
      </Text>
      <Text style={styles.rowMuted}>
        다음 레벨까지 {summary.expRemainingForNextLevel.toLocaleString()} EXP
      </Text>
      <Text style={styles.rowMuted}>
        누적 임계 {summary.nextLevelThresholdExp.toLocaleString()} EXP
      </Text>

      <View style={styles.divider} />

      <Text style={styles.subHeading}>전투 숙련도</Text>
      <Text style={styles.row}>
        전투 등급 {profBefore.combatLevel} → {profAfter.combatLevel}
      </Text>
      <Text style={styles.row}>
        운용 효율 {profBefore.operatingEfficiencyPct}% → {profAfter.operatingEfficiencyPct}%
        {effDelta !== 0 ? ` (${effDelta > 0 ? '+' : ''}${effDelta}%p)` : ''}
      </Text>
      <Text style={styles.row}>
        숙련 계수 {formatMultiplier(profBefore.proficiencyMultiplier)} →{' '}
        {formatMultiplier(profAfter.proficiencyMultiplier)}
        {multDelta !== 0 ? ` (${multDelta > 0 ? '+' : ''}${multDelta.toFixed(3)})` : ''}
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
    color: COLORS.gold,
    marginBottom: SPACING.xs,
  },
  subHeading: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.ink_light,
    marginBottom: SPACING.xs,
  },
  levelLine: {
    fontFamily: FONTS.mono,
    fontSize: 18,
    color: COLORS.ink_dark,
    fontWeight: '700',
  },
  row: {
    fontFamily: FONTS.mono,
    fontSize: 13,
    color: COLORS.ink_dark,
    marginBottom: 4,
    textAlign: 'center',
  },
  rowMuted: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.ink_light,
    marginBottom: 4,
    textAlign: 'center',
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: COLORS.border_dark,
    marginVertical: SPACING.sm,
  },
});
