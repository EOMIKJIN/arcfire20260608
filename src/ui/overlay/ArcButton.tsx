import React, { memo, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { COLORS, FONTS, SPACING } from '../../utils/theme';
import { OVERLAY_TOKENS } from '../../utils/theme';
import { resolveOverlayVisualTokens } from './overlayVisualTokens';
import type { ArcOverlayVisualTheme } from './tacticalOverlayRollout';
import { TACTICAL_OVERLAY } from './tacticalOverlayStyles';
import { formatArcUniversalButtonLabel } from './arcUniversalButtonLabel';
import { bindUiSfxPressIn, type UiSfxCue } from '../../audio';

export type ArcButtonVariant = 'primary' | 'secondary' | 'destructive' | 'panel' | 'cta' | 'tacticalPrimary' | 'tacticalSecondary';
export type ArcButtonIntent = 'primary' | 'secondary' | 'cta';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ArcButtonVariant;
  /** variant 미지정 시 visualTheme + intent 로 자동 결정 */
  visualTheme?: ArcOverlayVisualTheme;
  intent?: ArcButtonIntent;
  disabled?: boolean;
  /**
   * 불가피한 비용(네비 게이트·persist·네트워크) 구간과 동시 표시.
   * 즉각 전환 버튼에는 쓰지 말 것. busy 중에는 라벨 대신 스피너.
   */
  busy?: boolean;
  /** UI SFX cue — onPressIn(클릭연출)과 동기. 리소스 미등록 시 silent. */
  sfxCue?: UiSfxCue | null;
  style?: StyleProp<ViewStyle>;
  /** 시설 탭 등 좁은 슬롯 — `[라벨]`·패딩 축소·중앙 정렬 */
  compact?: boolean;
};

export const ArcButton = memo(function ArcButton({
  label,
  onPress,
  variant,
  visualTheme,
  intent = 'primary',
  disabled = false,
  busy = false,
  sfxCue = 'ui_click',
  style,
  compact = false,
}: Props) {
  const resolvedVariant = useMemo(() => {
    if (variant) return variant;
    if (visualTheme) return resolveOverlayVisualTokens(visualTheme).buttons[intent];
    return 'primary';
  }, [variant, visualTheme, intent]);

  const spinnerColor =
    resolvedVariant === 'cta' || resolvedVariant === 'tacticalPrimary'
      ? COLORS.bg_primary
      : resolvedVariant === 'primary'
        ? OVERLAY_TOKENS.phosphorAccent
        : COLORS.ink_dark;

  const onPressIn = useMemo(
    () =>
      bindUiSfxPressIn({
        cue: sfxCue ?? 'ui_click',
        silent: disabled || busy || sfxCue === null,
      }),
    [busy, disabled, sfxCue],
  );

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        resolvedVariant === 'primary' && styles.primary,
        resolvedVariant === 'secondary' && styles.secondary,
        resolvedVariant === 'destructive' && styles.destructive,
        resolvedVariant === 'panel' && styles.panel,
        resolvedVariant === 'cta' && styles.cta,
        resolvedVariant === 'tacticalPrimary' && styles.tacticalPrimary,
        resolvedVariant === 'tacticalSecondary' && styles.tacticalSecondary,
        compact && styles.baseCompact,
        pressed && !disabled && !busy && styles.pressed,
        (disabled || busy) && styles.disabled,
        style,
      ]}
      onPressIn={onPressIn}
      onPress={onPress}
      disabled={disabled || busy}
      android_disableSound
    >
      {busy ? (
        <ActivityIndicator color={spinnerColor} size="small" />
      ) : (
        <Text
          style={[
            styles.textBase,
            resolvedVariant === 'primary' && styles.textPrimary,
            resolvedVariant === 'secondary' && styles.textSecondary,
            resolvedVariant === 'destructive' && styles.textDestructive,
            resolvedVariant === 'panel' && styles.textPanel,
            resolvedVariant === 'cta' && styles.textCta,
            resolvedVariant === 'tacticalPrimary' && styles.textTacticalPrimary,
            resolvedVariant === 'tacticalSecondary' && styles.textTacticalSecondary,
            compact && styles.textCompact,
            disabled && styles.textDisabled,
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={compact ? 0.72 : 0.85}
        >
          {formatArcUniversalButtonLabel(label, { compact })}
        </Text>
      )}
    </Pressable>
  );
});

const PH = OVERLAY_TOKENS.phosphorAccent;

const styles = StyleSheet.create({
  base: {
    borderWidth: 1.5,
    borderRadius: 6,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseCompact: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: 4,
    minWidth: 0,
    borderWidth: 1,
  },
  primary: {
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    backgroundColor: OVERLAY_TOKENS.phosphorBtnBg,
  },
  secondary: {
    borderColor: 'rgba(230, 238, 255, 0.22)',
    backgroundColor: 'rgba(230, 238, 255, 0.06)',
  },
  destructive: {
    borderColor: 'rgba(227, 107, 107, 0.45)',
    backgroundColor: 'rgba(227, 107, 107, 0.12)',
  },
  panel: {
    borderColor: COLORS.border_dark,
    backgroundColor: COLORS.bg_secondary,
    borderRadius: 4,
  },
  cta: {
    borderColor: COLORS.ink_dark,
    backgroundColor: COLORS.ink_dark,
    borderRadius: 4,
  },
  tacticalPrimary: {
    borderColor: TACTICAL_OVERLAY.btnPrimaryBorder,
    backgroundColor: TACTICAL_OVERLAY.btnPrimaryBg,
    borderRadius: 4,
  },
  tacticalSecondary: {
    borderColor: TACTICAL_OVERLAY.btnSecondaryBorder,
    backgroundColor: TACTICAL_OVERLAY.btnSecondaryBg,
    borderRadius: 4,
  },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.45 },
  textBase: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 1,
  },
  textPrimary: {
    color: PH,
    textShadowColor: 'rgba(107, 212, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  textSecondary: {
    color: 'rgba(230, 238, 255, 0.88)',
    textShadowColor: 'rgba(107, 212, 255, 0.2)',
  },
  textDestructive: {
    color: COLORS.danger,
    textShadowColor: 'rgba(227, 107, 107, 0.35)',
  },
  textPanel: {
    color: COLORS.ink_dark,
    letterSpacing: 0,
    textShadowRadius: 0,
  },
  textCta: {
    color: COLORS.bg_primary,
    letterSpacing: 0.5,
    textShadowRadius: 0,
  },
  textTacticalPrimary: {
    color: TACTICAL_OVERLAY.btnPrimaryInk,
    letterSpacing: 0.5,
    textShadowRadius: 0,
    textShadowColor: 'transparent',
  },
  textTacticalSecondary: {
    color: TACTICAL_OVERLAY.btnSecondaryInk,
    letterSpacing: 0.5,
    textShadowRadius: 0,
    textShadowColor: 'transparent',
  },
  textDisabled: {
    textShadowRadius: 0,
  },
  textCompact: {
    letterSpacing: 0,
    textAlign: 'center',
    alignSelf: 'stretch',
    fontSize: FONTS.size.xs,
  },
});
