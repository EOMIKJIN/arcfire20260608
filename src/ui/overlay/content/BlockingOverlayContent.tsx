import React, { memo } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { ArcOverlayBlockingEntry } from '../arcOverlayStore';
import { FONTS } from '../../../utils/theme';
import { overlayInkColor } from '../overlayVisualTokens';
import { resolveArcOverlayVisualTheme } from '../tacticalOverlayRollout';

type Props = {
  entry: ArcOverlayBlockingEntry;
};

export const BlockingOverlayContent = memo(function BlockingOverlayContent({ entry }: Props) {
  const visualTheme = resolveArcOverlayVisualTheme('blocking');
  return (
    <Text style={[styles.label, { color: overlayInkColor(visualTheme, 'label') }]}>
      {entry.message ?? 'LOADING....'}
    </Text>
  );
});

const styles = StyleSheet.create({
  label: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    letterSpacing: 4,
    textAlign: 'center',
  },
});
