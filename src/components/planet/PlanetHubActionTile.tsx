import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { FONTS, SPACING } from '../../utils/theme';
import { TACTICAL_HUB } from '../../ui/tactical/tacticalHubTokens';

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

/** 스캔 행·시설 메뉴 행 공통 타일(아이콘 + 라벨) — G-ARCHIVE tactical 톤 */
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
      <Text style={[styles.tileIcon, faded && styles.tileIconDisabled, active && styles.tileIconActive]}>
        {icon}
      </Text>
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
    backgroundColor: TACTICAL_HUB.tileBg,
    borderWidth: 1,
    borderColor: TACTICAL_HUB.tileBorder,
    borderRadius: 6,
    paddingVertical: SPACING.xs,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tilePrimary: {
    backgroundColor: TACTICAL_HUB.tilePrimaryBg,
    borderColor: TACTICAL_HUB.tilePrimaryBorder,
  },
  tileDisabled: {
    opacity: 0.38,
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
    color: TACTICAL_HUB.tileIconInk,
    marginBottom: 2,
  },
  tileIconDisabled: {
    color: TACTICAL_HUB.tileDisabledInk,
  },
  tileIconActive: {
    color: TACTICAL_HUB.tileActiveInk,
  },
  tileLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    fontWeight: FONTS.weight.bold,
    color: TACTICAL_HUB.tileLabelInk,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  tileLabelPrimary: {
    color: TACTICAL_HUB.tilePrimaryInk,
  },
  tileLabelDisabled: {
    color: TACTICAL_HUB.tileDisabledInk,
  },
  tileLabelActive: {
    color: TACTICAL_HUB.tileActiveInk,
  },
});
