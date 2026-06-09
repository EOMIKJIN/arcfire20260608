import React, { memo } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { ArcOverlayBlockingEntry } from '../arcOverlayStore';
import { COLORS, FONTS } from '../../../utils/theme';

type Props = {
  entry: ArcOverlayBlockingEntry;
};

export const BlockingOverlayContent = memo(function BlockingOverlayContent({ entry }: Props) {
  return (
    <Text style={styles.label}>{entry.message ?? 'LOADING....'}</Text>
  );
});

const styles = StyleSheet.create({
  label: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    letterSpacing: 4,
    color: COLORS.ink_light,
    textAlign: 'center',
  },
});
