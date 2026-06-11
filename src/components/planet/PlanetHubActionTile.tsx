import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { COLORS, FONTS, OVERLAY_TOKENS, SPACING } from '../../utils/theme';

/** 스캔·무역소 등 메인스테이지 하단 액션 타일 공통 높이 */
export const PLANET_HUB_ACTION_TILE_MIN_HEIGHT_PX = 52;

type Props = {
  label: string;
  icon: string;
  onPress?: () => void;
  primary?: boolean;
  disabled?: boolean;
  dimmed?: boolean;
  active?: boolean;
  showBadge?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** 스캔 행·시설 메뉴 행 공통 타일(아이콘 + 라벨) */
export const PlanetHubActionTile = memo(function PlanetHubActionTile({
  label,
  icon,
  onPress,
  primary = false,
  disabled = false,
  dimmed = false,
  active = false,
  showBadge = false,
  style,
}: Props) {
  const faded = disabled || dimmed;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.tile,
        primary && styles.tilePrimary,
        faded && styles.tileDisabled,
        pressed && !disabled && styles.tilePressed,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      android_disableSound
    >
      {showBadge ? <View style={styles.badgeDot} /> : null}
      <Text style={[styles.tileIcon, faded && styles.tileIconDisabled]}>{icon}</Text>
      <Text
        style={[
          styles.tileLabel,
          primary && styles.tileLabelPrimary,
          faded && styles.tileLabelDisabled,
          active && styles.tileLabelActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  tile: {
    width: '100%',
    minHeight: PLANET_HUB_ACTION_TILE_MIN_HEIGHT_PX,
    backgroundColor: COLORS.bg_panel,
    borderWidth: 1,
    borderColor: COLORS.border_dark,
    borderRadius: 6,
    paddingVertical: SPACING.xs,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tilePrimary: {
    backgroundColor: COLORS.ink_dark,
    borderColor: COLORS.ink_dark,
  },
  tileDisabled: {
    opacity: 0.35,
  },
  tilePressed: {
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
    zIndex: 2,
  },
  tileIcon: {
    fontSize: 14,
    lineHeight: 16,
    color: OVERLAY_TOKENS.phosphorAccent,
    marginBottom: 2,
  },
  tileIconDisabled: {
    color: COLORS.ink_light,
  },
  tileLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: OVERLAY_TOKENS.phosphorAccent,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  tileLabelPrimary: {
    color: COLORS.bg_primary,
  },
  tileLabelDisabled: {
    color: COLORS.ink_light,
  },
  tileLabelActive: {
    color: '#7BE8FF',
  },
});
