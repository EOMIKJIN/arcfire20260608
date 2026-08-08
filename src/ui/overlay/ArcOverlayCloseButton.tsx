import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { FONTS, OVERLAY_TOKENS, SPACING } from '../../utils/theme';
import type { ArcOverlayVisualTheme } from './tacticalOverlayPreview';
import { TACTICAL_OVERLAY } from './tacticalOverlayStyles';
import { bindUiSfxPressIn } from '../../audio';

type Props = {
  onPress: () => void;
  visualTheme?: ArcOverlayVisualTheme;
  accessibilityLabel?: string;
};

/** 범용 오버레이 헤더 우상단 ✕ — BM 상점(`bmShopOverlayStyles.closeBtn`)과 동일 톤 */
export const ArcOverlayCloseButton = memo(function ArcOverlayCloseButton({
  onPress,
  visualTheme = 'phosphor',
  accessibilityLabel = 'Close',
}: Props) {
  const isTactical = visualTheme === 'tactical';
  const onPressIn = useMemo(() => bindUiSfxPressIn({ cue: 'ui_close' }), []);
  return (
    <Pressable
      style={[styles.btn, isTactical ? styles.btnTactical : null]}
      onPressIn={onPressIn}
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      android_disableSound
    >
      <Text style={[styles.text, isTactical ? styles.textTactical : null]}>✕</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderWidth: 1,
    borderColor: OVERLAY_TOKENS.phosphorBorder,
    borderRadius: 4,
  },
  btnTactical: {
    borderColor: TACTICAL_OVERLAY.insetBorder,
    backgroundColor: TACTICAL_OVERLAY.insetBg,
  },
  text: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: OVERLAY_TOKENS.phosphorAccent,
  },
  textTactical: {
    color: TACTICAL_OVERLAY.valueInk,
  },
});
