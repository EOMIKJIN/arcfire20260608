import React, { memo, useMemo } from 'react';
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
import type { ArcOverlayVisualTheme } from './tacticalOverlayRollout';
import { resolveOverlayVisualTokens } from './overlayVisualTokens';
import { TACTICAL_OVERLAY } from './tacticalOverlayStyles';
import {
  NARRATIVE_DIALOG_LAYOUT,
  narrativeDialogTextBlockHeight,
  resolveNarrativeTypewriterSpeedMs,
} from './narrativeDialogLayout';
import { useNarrativeDialogNextReveal } from './useNarrativeDialogNextReveal';

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
  visualTheme?: ArcOverlayVisualTheme;
};

const androidTextFix = Platform.OS === 'android' ? { includeFontPadding: false } : null;

export const NarrativeDialogRow = memo(function NarrativeDialogRow({
  label,
  text,
  typewriterKey,
  typewriterSpeedMs,
  onTextComplete,
  imageSource,
  portraitScale = 1,
  maxLines = NARRATIVE_DIALOG_LAYOUT.maxLinesDefault,
  buttonText = '[ 다음 ]',
  nextDisabled = false,
  onPressNext,
  showActionButton = true,
  visualTheme = 'phosphor',
}: NarrativeDialogRowProps) {
  const ink = useMemo(() => resolveOverlayVisualTokens(visualTheme), [visualTheme]);
  const isTactical = visualTheme === 'tactical';
  const portraitTransform = portraitScale !== 1 ? [{ scale: portraitScale }] : undefined;
  const textBlockHeight = narrativeDialogTextBlockHeight(maxLines);
  const resolvedSpeedMs = resolveNarrativeTypewriterSpeedMs(typewriterSpeedMs);
  const { revealReady, onTypingComplete } = useNarrativeDialogNextReveal(
    typewriterKey,
    onTextComplete,
  );

  return (
    <View
      style={[
        styles.row,
        isTactical
          ? { borderColor: TACTICAL_OVERLAY.cardBorder, backgroundColor: TACTICAL_OVERLAY.cardBg }
          : null,
      ]}
    >
      {imageSource ? (
        <View
          style={[
            styles.portraitCard,
            isTactical ? { backgroundColor: TACTICAL_OVERLAY.insetBg } : null,
            portraitTransform ? { transform: portraitTransform } : null,
          ]}
        >
          <Image
            source={imageSource}
            style={styles.portrait}
            resizeMode="contain"
            resizeMethod="resize"
          />
        </View>
      ) : (
        <View
          style={[
            styles.portraitPlaceholder,
            isTactical ? { backgroundColor: TACTICAL_OVERLAY.insetBg } : null,
          ]}
        />
      )}
      <View style={styles.hud}>
        <Text style={[styles.label, { color: ink.accentInk }]} numberOfLines={1}>
          {label}
        </Text>
        <View style={[styles.textSlot, { minHeight: textBlockHeight }]}>
          <TypewriterText
            key={typewriterKey}
            text={text}
            speed={resolvedSpeedMs}
            onComplete={showActionButton ? onTypingComplete : onTextComplete}
            style={{ ...styles.text, color: isTactical ? ink.valueInk : COLORS.ink_dark }}
          />
        </View>
        {showActionButton && revealReady ? (
          <View style={styles.footer}>
            <ArcButton
              label={buttonText}
              visualTheme={visualTheme}
              intent="primary"
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
    textAlign: NARRATIVE_DIALOG_LAYOUT.textAlign,
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
    textAlign: NARRATIVE_DIALOG_LAYOUT.textAlign,
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
