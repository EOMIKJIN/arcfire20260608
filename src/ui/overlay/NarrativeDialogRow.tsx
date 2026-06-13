import React, { memo } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type NativeSyntheticEvent,
  type TextLayoutEventData,
} from 'react-native';
import { TypewriterText } from '../../components/TypewriterText';
import { COLORS, FONTS, OVERLAY_TOKENS, SPACING } from '../../utils/theme';
import { ArcButton } from './ArcButton';

export type NarrativeDialogRowProps = {
  label: string;
  text: string;
  typewriterKey: string;
  typewriterSpeedMs?: number;
  onTextComplete?: () => void;
  imageSource?: ImageSourcePropType;
  portraitScale?: number;
  measureTextRaw?: string;
  onMeasureTextLayout?: (e: NativeSyntheticEvent<TextLayoutEventData>) => void;
  buttonText?: '[ 다음 ]' | '[ 확인 ]';
  nextDisabled?: boolean;
  onPressNext?: () => void;
  /** false — intro 등 화면 하단 버튼이 진행을 담당할 때 */
  showActionButton?: boolean;
};

export const NarrativeDialogRow = memo(function NarrativeDialogRow({
  label,
  text,
  typewriterKey,
  typewriterSpeedMs = 28,
  onTextComplete,
  imageSource,
  portraitScale = 1,
  measureTextRaw,
  onMeasureTextLayout,
  buttonText = '[ 다음 ]',
  nextDisabled = false,
  onPressNext,
  showActionButton = true,
}: NarrativeDialogRowProps) {
  const portraitTransform = portraitScale !== 1 ? [{ scale: portraitScale }] : undefined;

  return (
    <View style={styles.row}>
      {imageSource ? (
        <View style={[styles.portraitCard, portraitTransform ? { transform: portraitTransform } : null]}>
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
        {showActionButton ? (
          <View style={styles.footer}>
            <ArcButton
              label={buttonText}
              variant="primary"
              disabled={nextDisabled}
              onPress={onPressNext}
              style={styles.nextBtn}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    width: '100%',
    maxWidth: OVERLAY_TOKENS.narrativeMaxWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: OVERLAY_TOKENS.phosphorCardBg,
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
    padding: SPACING.md,
    minHeight: 187,
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    color: OVERLAY_TOKENS.phosphorAccent,
    marginBottom: SPACING.xs,
  },
  text: {
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: COLORS.ink_dark,
    lineHeight: 22,
    flexShrink: 1,
  },
  measureText: {
    position: 'absolute',
    opacity: 0,
    left: 0,
    right: 0,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    lineHeight: 22,
  },
  footer: {
    marginTop: SPACING.sm,
    alignItems: 'flex-end',
  },
  nextBtn: {
    minWidth: 96,
  },
});
