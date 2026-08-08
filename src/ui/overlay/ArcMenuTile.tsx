import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { COLORS, FONTS, OVERLAY_TOKENS, SPACING } from '../../utils/theme';
import { bindUiSfxPressIn } from '../../audio';

type Props = {
  label: string;
  onPress?: () => void;
  primary?: boolean;
  disabled?: boolean;
  showBadge?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** 행성 메인 4열 메뉴 타일 — ArcButton 과 동일 phosphor/panel 토큰 계열 */
export const ArcMenuTile = memo(function ArcMenuTile({
  label,
  onPress,
  primary = false,
  disabled = false,
  showBadge = false,
  style,
}: Props) {
  const onPressIn = useMemo(
    () => bindUiSfxPressIn({ cue: 'ui_click', silent: disabled }),
    [disabled],
  );
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tile,
        primary && styles.tilePrimary,
        disabled && styles.tileDisabled,
        pressed && !disabled && styles.pressed,
        style,
      ]}
      onPressIn={onPressIn}
      onPress={onPress}
      disabled={disabled}
      android_disableSound
    >
      {showBadge ? <View style={styles.badgeDot} /> : null}
      <Text style={[styles.label, primary && styles.labelPrimary, disabled && styles.labelDisabled]}>
        {label}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  tile: {
    position: 'relative',
    width: '18%',
    backgroundColor: COLORS.bg_panel,
    borderWidth: 1,
    borderColor: COLORS.border_dark,
    borderRadius: 6,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
  },
  tilePrimary: {
    backgroundColor: COLORS.ink_dark,
    borderColor: COLORS.ink_dark,
  },
  tileDisabled: {
    opacity: 0.35,
  },
  pressed: {
    opacity: 0.88,
  },
  badgeDot: {
    position: 'absolute',
    top: -5.6,
    right: -5.6,
    width: 11.2,
    height: 11.2,
    borderRadius: 5.6,
    backgroundColor: '#8A1538',
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: OVERLAY_TOKENS.phosphorAccent,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  labelPrimary: {
    color: COLORS.bg_primary,
    textShadowRadius: 0,
  },
  labelDisabled: {
    color: COLORS.ink_faint,
  },
});
