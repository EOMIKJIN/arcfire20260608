import React, { memo } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { TypewriterText } from '../../components/TypewriterText';
import { COLORS, FONTS, OVERLAY_TOKENS, SPACING } from '../../utils/theme';
import { ArcButton } from './ArcButton';
import {
  NARRATIVE_DIALOG_LAYOUT,
  narrativeDialogTextBlockHeight,
} from './narrativeDialogLayout';

export type NarrativeDialogRowProps = {
  label: string;
  text: string;
  typewriterKey: string;
  typewriterSpeedMs?: number;
  onTextComplete?: () => void;
  imageSource?: ImageSourcePropType;
  portraitScale?: number;
  /** 본문 최대 표시 줄 수 — 초과분은 세그먼트(다음)로 넘김 */
  maxLines?: number;
  buttonText?: string;
  nextDisabled?: boolean;
  onPressNext?: () => void;
  /** false — intro 등 화면 하단 버튼이 진행을 담당할 때 */
  showActionButton?: boolean;
};

const androidTextFix = Platform.OS === 'android' ? { includeFontPadding: false } : null;

export const NarrativeDialogRow = memo(function NarrativeDialogRow({
  label,
  text,
  typewriterKey,
  typewriterSpeedMs = 28,
  onTextComplete,
  imageSource,
  portraitScale = 1,
  maxLines = NARRATIVE_DIALOG_LAYOUT.maxLinesDefault,
  buttonText = '[ 다음 ]',
  nextDisabled = false,
  onPressNext,
  showActionButton = true,
}: NarrativeDialogRowProps) {
  const portraitTransform = portraitScale !== 1 ? [{ scale: portraitScale }] : undefined;
  const textBlockHeight = narrativeDialogTextBlockHeight(maxLines);

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
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <View style={[styles.textSlot, { minHeight: textBlockHeight }]}>
          <TypewriterText
            key={typewriterKey}
            text={text}
            speed={Math.max(1, typewriterSpeedMs)}
            onComplete={onTextComplete}
            style={styles.text}
          />
        </View>
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
        ) : (
          <View style={styles.footerSpacer} />
        )}
      </View>
    </View>
  );
});

const { height, portraitWidth, lineHeight, labelLineHeight } = NARRATIVE_DIALOG_LAYOUT;

const styles = StyleSheet.create({
  row: {
    width: '100%',
    height,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: OVERLAY_TOKENS.phosphorCardBg,
  },
  portraitCard: {
    width: portraitWidth,
    height,
    backgroundColor: '#05070d',
  },
  portrait: {
    width: '100%',
    height: '100%',
  },
  portraitPlaceholder: {
    width: portraitWidth,
    height,
  },
  hud: {
    flex: 1,
    height,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    paddingLeft: NARRATIVE_DIALOG_LAYOUT.hudHorizontalPadPx,
    paddingRight: NARRATIVE_DIALOG_LAYOUT.hudHorizontalPadPx,
    flexDirection: 'column',
  },
  label: {
    flexShrink: 0,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    lineHeight: labelLineHeight,
    color: OVERLAY_TOKENS.phosphorAccent,
    marginBottom: SPACING.xs,
    ...androidTextFix,
  },
  textSlot: {
    flex: 1,
    flexShrink: 0,
    alignSelf: 'stretch',
    width: '100%',
    justifyContent: 'flex-start',
  },
  text: {
    alignSelf: 'stretch',
    width: '100%',
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.md,
    color: COLORS.ink_dark,
    lineHeight,
    ...androidTextFix,
  },
  footer: {
    flexShrink: 0,
    paddingTop: SPACING.xs,
    alignItems: 'flex-end',
  },
  footerSpacer: {
    flexShrink: 0,
    height: SPACING.xs,
  },
  nextBtn: {
    minWidth: 96,
  },
});
