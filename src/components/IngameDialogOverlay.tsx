import React from 'react';
import {
  Image,
  type ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type NativeSyntheticEvent,
  type TextLayoutEventData,
} from 'react-native';
import { TypewriterText } from './TypewriterText';
import { COLORS, FONTS, SPACING } from '../utils/theme';

const INGAME_DIALOG_NEXT_HIT_SLOP = { top: 8, bottom: 8, left: 10, right: 10 } as const;

type Props = {
  visible: boolean;
  label: string;
  text: string;
  typewriterKey: string;
  buttonText: '[ 다음 ]' | '[ 확인 ]';
  onPressNext: () => void;
  nextDisabled?: boolean;
  onTextComplete?: () => void;
  typewriterSpeedMs?: number;
  imageSource?: ImageSourcePropType;
  measureTextRaw?: string;
  onMeasureTextLayout?: (e: NativeSyntheticEvent<TextLayoutEventData>) => void;
  align?: 'center' | 'bottom';
};

export function IngameDialogOverlay({
  visible,
  label,
  text,
  typewriterKey,
  buttonText,
  onPressNext,
  nextDisabled = false,
  onTextComplete,
  typewriterSpeedMs = 28,
  imageSource,
  measureTextRaw,
  onMeasureTextLayout,
  align = 'center',
}: Props) {
  if (!visible) return null;
  return (
    <View style={[styles.overlay, align === 'bottom' ? styles.overlayBottom : null]} pointerEvents="auto">
      <View style={styles.row}>
        {imageSource ? (
          <View style={styles.portraitCard}>
            <Image source={imageSource} style={styles.portrait} resizeMode="contain" />
          </View>
        ) : (
          <View style={styles.portraitPlaceholder} />
        )}
        <View style={styles.hud}>
          <Text style={styles.label}>{label}</Text>
          <TypewriterText
            key={typewriterKey}
            text={text}
            speed={Math.max(1, typewriterSpeedMs)}
            onComplete={onTextComplete}
            style={styles.text}
          />
          {measureTextRaw ? (
            <Text
              style={styles.measureText}
              numberOfLines={undefined}
              onTextLayout={onMeasureTextLayout}
            >
              {measureTextRaw}
            </Text>
          ) : null}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={onPressNext}
              hitSlop={INGAME_DIALOG_NEXT_HIT_SLOP}
              style={[styles.nextBtn, nextDisabled && styles.nextBtnDisabled]}
              disabled={nextDisabled}
            >
              <Text style={styles.nextText}>{buttonText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 40,
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  overlayBottom: {
    justifyContent: 'flex-end',
    paddingBottom: 72,
    backgroundColor: 'rgba(3, 8, 17, 0.55)',
  },
  row: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(8,12,20,0.86)',
  },
  portraitCard: {
    width: 145,
    height: 187,
    backgroundColor: '#05070d',
  },
  portrait: {
    width: '100%',
    height: '100%',
  },
  portraitPlaceholder: {
    width: 145,
    height: 187,
  },
  hud: {
    flex: 1,
    height: 184,
    padding: SPACING.md,
    backgroundColor: 'transparent',
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.xs,
    color: '#D6E4FF',
    marginBottom: SPACING.xs,
    letterSpacing: 1,
  },
  text: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: '#FFFFFF',
    lineHeight: 20,
    minHeight: 62,
  },
  measureText: {
    position: 'absolute',
    opacity: 0,
    left: SPACING.md,
    right: SPACING.md,
    top: SPACING.md + FONTS.size.xs + SPACING.xs,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'flex-end',
    transform: [{ translateY: -15 }],
  },
  nextBtn: {
    minWidth: 34,
    minHeight: 24,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(107, 212, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnDisabled: {
    opacity: 0.35,
  },
  nextText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    color: '#6BD4FF',
    fontWeight: FONTS.weight.bold,
    letterSpacing: 1,
    textShadowColor: 'rgba(107, 212, 255, 0.45)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});

