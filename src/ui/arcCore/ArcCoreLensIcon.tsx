import React, { memo } from 'react';
import { Image, StyleSheet } from 'react-native';
import { ARC_CORE_LENS_SOURCE } from '../../game/arcCoreSymbolAssets';

type Props = {
  size: number;
  accessibilityLabel?: string;
};

/** 아크코어 상징 — 정적 PNG 1장. 마운트당 Image 1개, 틱 할당 없음. */
export const ArcCoreLensIcon = memo(function ArcCoreLensIcon({
  size,
  accessibilityLabel,
}: Props) {
  return (
    <Image
      source={ARC_CORE_LENS_SOURCE}
      style={[styles.icon, { width: size, height: size }]}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    />
  );
});

const styles = StyleSheet.create({
  icon: {
    flexShrink: 0,
  },
});
