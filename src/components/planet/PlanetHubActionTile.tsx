import React, { memo, useId } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { FONTS, SPACING } from '../../utils/theme';
import { TACTICAL_HUB } from '../../ui/tactical/tacticalHubTokens';
import { PlanetHubActionIcon } from '../../ui/tactical/PlanetHubActionIcon';
import type { PlanetHubActionIconSpec } from '../../ui/tactical/planetHubActionIcons';

/** 스캔·무역소 등 메인스테이지 하단 액션 타일 공통 높이 */
export const PLANET_HUB_ACTION_TILE_MIN_HEIGHT_PX = 52;

const TILE_RADIUS = 6;
const TILE_ICON_SIZE_PX = 18;

function resolveTileIconColor(
  faded: boolean,
  active: boolean,
  primary: boolean,
  pressed: boolean,
): string {
  if (faded) return TACTICAL_HUB.tileDisabledInk;
  if (active || pressed) return TACTICAL_HUB.tileIconLedActive;
  if (primary) return TACTICAL_HUB.tilePrimaryInk;
  return TACTICAL_HUB.tileIconInk;
}

function resolveTileLabelColor(
  faded: boolean,
  active: boolean,
  primary: boolean,
  pressed: boolean,
): string {
  if (faded) return TACTICAL_HUB.tileLabelDisabledInk;
  if (active || pressed) return TACTICAL_HUB.tileLabelLedActive;
  if (primary) return TACTICAL_HUB.tileLabelPrimaryInk;
  return TACTICAL_HUB.tileLabelInk;
}

type Props = {
  label: string;
  icon: PlanetHubActionIconSpec;
  onPress?: () => void;
  primary?: boolean;
  disabled?: boolean;
  dimmed?: boolean;
  active?: boolean;
  showBadge?: boolean;
  style?: StyleProp<ViewStyle>;
};

type TileGradientProps = {
  gradId: string;
  primary: boolean;
};

/** 상단 광원 — y0→y1 수직 그라데이션 (Skia/루프 없음 · 1회 SVG) */
const TileTopLightGradient = memo(function TileTopLightGradient({ gradId, primary }: TileGradientProps) {
  const top = primary ? TACTICAL_HUB.tilePrimaryGradTop : TACTICAL_HUB.tileGradTop;
  const mid = primary ? TACTICAL_HUB.tilePrimaryGradMid : TACTICAL_HUB.tileGradMid;
  const bottom = primary ? TACTICAL_HUB.tilePrimaryGradBottom : TACTICAL_HUB.tileGradBottom;

  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={top} stopOpacity="1" />
          <Stop offset="0.30" stopColor={mid} stopOpacity="1" />
          <Stop offset="1" stopColor={bottom} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" rx={TILE_RADIUS} ry={TILE_RADIUS} fill={`url(#${gradId})`} />
    </Svg>
  );
});

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
  const gradId = useId().replace(/:/g, '');
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
      {({ pressed }) => (
        <>
          <View style={styles.tileBg} pointerEvents="none">
            <TileTopLightGradient gradId={gradId} primary={primary} />
            <View style={styles.tileTopSheen} />
          </View>
          <View style={styles.tileIconWrap}>
            <PlanetHubActionIcon
              spec={icon}
              size={TILE_ICON_SIZE_PX}
              color={resolveTileIconColor(faded, active, primary, pressed && !disabled)}
            />
          </View>
          <Text
            style={[
              styles.tileLabel,
              {
                color: resolveTileLabelColor(faded, active, primary, pressed && !disabled),
              },
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {showBadge ? <View style={styles.badgeDot} pointerEvents="none" /> : null}
        </>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  tile: {
    width: '100%',
    height: PLANET_HUB_ACTION_TILE_MIN_HEIGHT_PX,
    borderWidth: 1,
    borderColor: TACTICAL_HUB.tileBorder,
    borderRadius: TILE_RADIUS,
    paddingVertical: SPACING.xs,
    paddingHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  tilePrimary: {
    borderColor: TACTICAL_HUB.tilePrimaryBorder,
  },
  tileBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: TILE_RADIUS,
    overflow: 'hidden',
  },
  tileTopSheen: {
    position: 'absolute',
    top: 0,
    left: 10,
    right: 10,
    height: StyleSheet.hairlineWidth,
    backgroundColor: TACTICAL_HUB.tileTopSheen,
    borderRadius: 1,
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
    zIndex: 20,
    elevation: 20,
  },
  tileIconWrap: {
    height: TILE_ICON_SIZE_PX,
    marginBottom: 2,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  tileLabel: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    fontWeight: FONTS.weight.bold,
    letterSpacing: 0.3,
    textAlign: 'center',
    zIndex: 1,
  },
});
