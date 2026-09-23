import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FONTS, SPACING } from '../utils/theme';
import { TACTICAL_HUB as TH } from '../ui/tactical/tacticalHubTokens';
import { PLANET_MAIN_TOPBAR_ICON_BORDER_RADIUS } from '../stages/planetMainStageLayout';

type Props = {
  onZoomOut: () => void;
  onZoomIn: () => void;
  canZoomOut: boolean;
  canZoomIn: boolean;
  zoomOutA11y: string;
  zoomInA11y: string;
};

function ZoomKey({
  label,
  disabled,
  onPress,
  a11y,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
  a11y: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={styles.hit}
      accessibilityLabel={a11y}
    >
      <View style={styles.sizeLock}>
        <Text style={[styles.label, styles.ghost]}>[ − ]</Text>
      </View>
      <View pointerEvents="none" style={[styles.chrome, disabled && styles.chromeOff]}>
        <Text style={styles.label}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

function GalaxyMapZoomControlsInner({
  onZoomOut,
  onZoomIn,
  canZoomOut,
  canZoomIn,
  zoomOutA11y,
  zoomInA11y,
}: Props) {
  return (
    <View pointerEvents="box-none" style={styles.bar}>
      <ZoomKey
        label="−"
        disabled={!canZoomOut}
        onPress={onZoomOut}
        a11y={zoomOutA11y}
      />
      <ZoomKey
        label="+"
        disabled={!canZoomIn}
        onPress={onZoomIn}
        a11y={zoomInA11y}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: SPACING.sm,
    zIndex: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
  },
  /** 터치 = 기존 btn 박스. sizeLock이 그 크기를 고정한다. */
  hit: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sizeLock: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: { opacity: 0 },
  chrome: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderWidth: 1,
    borderColor: TH.controlBtnBorder,
    backgroundColor: TH.controlBtnBg,
    borderRadius: PLANET_MAIN_TOPBAR_ICON_BORDER_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scale: 0.8 }],
  },
  chromeOff: { opacity: 0.4 },
  label: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    fontWeight: FONTS.weight.bold,
    color: TH.chromeInk,
  },
});

export const GalaxyMapZoomControls = memo(GalaxyMapZoomControlsInner);
