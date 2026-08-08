import React, { memo, useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { FONTS, SPACING } from '../../utils/theme';
import { CINEMATIC_PROLOGUE as CP } from './cinematicPrologueTokens';
import { bindUiSfxPressIn } from '../../audio';

type Props = {
  pageCount: number;
  pageIndex: number;
  skipLabel: string;
  nextLabel: string;
  showSkip: boolean;
  disabled: boolean;
  /** 최종 전환 등 실비용 구간 — 다음 버튼에만 스피너 */
  busy?: boolean;
  onSkip: () => void;
  onNext: () => void;
};

export const CinematicPrologueFooter = memo(function CinematicPrologueFooter({
  pageCount,
  pageIndex,
  skipLabel,
  nextLabel,
  showSkip,
  disabled,
  busy = false,
  onSkip,
  onNext,
}: Props) {
  const silent = disabled || busy;
  const onSkipPressIn = useMemo(
    () => bindUiSfxPressIn({ cue: 'ui_click', silent }),
    [silent],
  );
  const onNextPressIn = useMemo(
    () => bindUiSfxPressIn({ cue: 'ui_click', silent }),
    [silent],
  );
  return (
    <View style={styles.footer}>
      <View style={styles.progressRow}>
        {pageCount > 1
          ? Array.from({ length: pageCount }, (_, i) => (
              <View
                key={`prologue-dot-${i}`}
                style={[styles.dot, i === pageIndex ? styles.dotActive : styles.dotIdle]}
              />
            ))
          : null}
      </View>

      <View style={styles.actionsRow}>
        {showSkip ? (
          <Pressable
            onPressIn={onSkipPressIn}
            onPress={onSkip}
            disabled={disabled || busy}
            style={({ pressed }) => [styles.controlHit, pressed && styles.controlPressed]}
            accessibilityRole="button"
          >
            <Text style={[styles.controlText, (disabled || busy) && styles.controlDisabled]}>{skipLabel}</Text>
          </Pressable>
        ) : (
          <View style={styles.controlHit} />
        )}
        <Pressable
          onPressIn={onNextPressIn}
          onPress={onNext}
          disabled={disabled || busy}
          style={({ pressed }) => [styles.controlHit, styles.controlHitEnd, pressed && styles.controlPressed]}
          accessibilityRole="button"
        >
          {busy ? (
            <ActivityIndicator color={CP.controlInkEmphasis} size="small" />
          ) : (
            <Text style={[styles.controlTextEmphasis, disabled && styles.controlDisabled]}>{nextLabel}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  footer: {
    backgroundColor: CP.screenBg,
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    minHeight: 8,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  dotIdle: {
    backgroundColor: CP.dotIdle,
  },
  dotActive: {
    backgroundColor: CP.dotActive,
    width: 18,
    borderRadius: 2.5,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlHit: {
    minWidth: 96,
    paddingVertical: SPACING.sm,
  },
  controlHitEnd: {
    alignItems: 'flex-end',
  },
  controlPressed: {
    opacity: 0.72,
  },
  controlText: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: CP.controlInk,
    letterSpacing: 1,
  },
  controlTextEmphasis: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: CP.controlInkEmphasis,
    letterSpacing: 1,
  },
  controlDisabled: {
    opacity: 0.35,
  },
});
