// ============================================================
// 아크파이어 온라인 - 플레이어 상태바 (TOP HUD)
// ============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, LAYOUT } from '../utils/theme';
import { formatCredits } from '../utils/formatCredits';
import { usePlayerStore } from '../store/playerStore';

export function PlayerStatusBar() {
  const player = usePlayerStore(s => s.player);
  if (!player) return null;

  const { ship, credits, level, exp, expToNext } = player;
  const hpPct  = ship.hp / ship.maxHp;
  const shPct  = ship.shield / ship.maxShield;
  const expPct = expToNext > 0 ? Math.min(exp / expToNext, 1) : 0;

  return (
    <View style={styles.container}>
      {/* 왼쪽: HP / 실드 */}
      <View style={styles.section}>
        <BarRow label="HP" value={ship.hp} max={ship.maxHp} pct={hpPct} color={COLORS.hp} />
        <BarRow label="SH" value={ship.shield} max={ship.maxShield} pct={shPct} color={COLORS.shield} />
      </View>

      {/* 중앙: 레벨 */}
      <View style={styles.center}>
        <Text style={styles.levelText}>Lv.{level}</Text>
        <View style={styles.expBar}>
          <View style={[styles.expFill, { width: `${expPct * 100}%` }]} />
        </View>
      </View>

      {/* 오른쪽: 크레딧 */}
      <View style={styles.section}>
        <Text style={styles.creditLabel}>크레딧</Text>
        <Text style={styles.creditValue}>{formatCredits(credits, { suffix: false })}</Text>
      </View>
    </View>
  );
}

function BarRow({
  label, value, max, pct, color,
}: { label: string; value: number; max: number; pct: number; color: string }) {
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${Math.max(0, pct) * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barValue}>{value}/{max}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: LAYOUT.hud_height,
    backgroundColor: COLORS.bg_panel,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  section: {
    flex: 1,
    justifyContent: 'center',
  },
  center: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: COLORS.ink_dark,
  },
  expBar: {
    width: 60,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginTop: 2,
    overflow: 'hidden',
  },
  expFill: {
    height: '100%',
    backgroundColor: COLORS.exp,
    borderRadius: 2,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  barLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    width: 20,
  },
  barBg: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  barValue: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_mid,
    width: 36,
    textAlign: 'right',
  },
  creditLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: COLORS.ink_light,
    textAlign: 'right',
  },
  creditValue: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: COLORS.gold,
    textAlign: 'right',
  },
});
