import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';
import { COLORS, FONTS, SPACING } from '../../utils/theme';
import { OVERLAY_TOKENS } from '../../utils/theme';
import { TACTICAL_OVERLAY } from './tacticalOverlayStyles';

export type ArcButtonVariant = 'primary' | 'secondary' | 'destructive' | 'panel' | 'cta' | 'tacticalPrimary' | 'tacticalSecondary';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ArcButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const ArcButton = memo(function ArcButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
}: Props) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'destructive' && styles.destructive,
        variant === 'panel' && styles.panel,
        variant === 'cta' && styles.cta,
        variant === 'tacticalPrimary' && styles.tacticalPrimary,
        variant === 'tacticalSecondary' && styles.tacticalSecondary,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      android_disableSound
    >
      <Text
        style={[
          styles.textBase,
          variant === 'primary' && styles.textPrimary,
          variant === 'secondary' && styles.textSecondary,
          variant === 'destructive' && styles.textDestructive,
          variant === 'panel' && styles.textPanel,
          variant === 'cta' && styles.textCta,
          variant === 'tacticalPrimary' && styles.textTacticalPrimary,
          variant === 'tacticalSecondary' && styles.textTacticalSecondary,
          disabled && styles.textDisabled,
        ]}
      >
        {label}
      </Text>
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
});
