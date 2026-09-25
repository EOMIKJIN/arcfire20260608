import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TypewriterText } from '../../components/TypewriterText';
import { COLORS, FONTS, OVERLAY_TOKENS, SPACING } from '../../utils/theme';
import { formatArcUniversalButtonLabel } from './arcUniversalButtonLabel';
import { ArcButton } from './ArcButton';
import type { ArcOverlayVisualTheme } from './tacticalOverlayRollout';
import { resolveOverlayVisualTokens } from './overlayVisualTokens';
import { TACTICAL_OVERLAY } from './tacticalOverlayStyles';
import {
  NARRATIVE_DIALOG_LAYOUT,
  narrativeDialogTextBlockHeight,
  resolveNarrativeDialogPortraitBleedPx,
  resolveNarrativeTypewriterSpeedMs,
  type NarrativeDialogStageFillMetrics,
} from './narrativeDialogLayout';
import { useNarrativeDialogNextReveal } from './useNarrativeDialogNextReveal';
import { useT } from '../../i18n';

export type NarrativeDialogRowProps = {
  label: string;
  text: string;
  typewriterKey: string;
  typewriterSpeedMs?: number;
  onTextComplete?: () => void;
  imageSource?: ImageSourcePropType;
  /** 얼굴 레이어 안 추가 스케일(기본 1). intro CSV imageScalePct 등 */
  portraitScale?: number;
  /** 본문 최대 표시 줄 수 — 초과분은 세그먼트(다음)로 넘김 */
  maxLines?: number;
  buttonText?: string;
  /** 있으면 푸터에 primary + secondary 두 버튼 */
  secondaryButtonText?: string;
  nextDisabled?: boolean;
  onPressNext?: () => void;
  onPressSecondary?: () => void;
  /** false — intro 등 화면 하단 버튼이 진행을 담당할 때 */
  showActionButton?: boolean;
  visualTheme?: ArcOverlayVisualTheme;
  /** true면 타이핑 애니메이션 없이 즉시 전체 텍스트 표시(스킵 후 마지막 페이지) */
  skipAnimation?: boolean;
  /** false — 창 오픈 시퀀스가 끝날 때까지 타이프라이터 rAF 정지 */
  typewriterActive?: boolean;
  /** 허브 오버레이 전용 — 헤더 아래 3단 카드 + 하단 흰색. intro는 생략 */
  stageFill?: NarrativeDialogStageFillMetrics | null;
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
  buttonText: buttonTextProp,
  secondaryButtonText,
  nextDisabled = false,
  onPressNext,
  onPressSecondary,
  showActionButton = true,
  visualTheme = 'phosphor',
  skipAnimation = false,
  typewriterActive = true,
  stageFill = null,
}: NarrativeDialogRowProps) {
  const t = useT();
  const buttonText = buttonTextProp ?? t('common.next');
  const speakerLabel = label.trim() ? formatArcUniversalButtonLabel(label) : '';
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const portraitBleedPx = resolveNarrativeDialogPortraitBleedPx(windowWidth, {
    safeLeft: insets.left,
    safeRight: insets.right,
  });
  const portraitOverflowUpPx = Math.max(0, portraitBleedPx - NARRATIVE_DIALOG_LAYOUT.portraitLayerHeight);
  const ink = useMemo(() => resolveOverlayVisualTokens(visualTheme), [visualTheme]);
  const isTactical = visualTheme === 'tactical';
  const resolvedPortraitScale = Number.isFinite(portraitScale) && portraitScale > 0 ? portraitScale : 1;
  const portraitTransform =
    resolvedPortraitScale !== 1 ? [{ scale: resolvedPortraitScale }] : undefined;
  const textBlockHeight = narrativeDialogTextBlockHeight(maxLines);
  const resolvedSpeedMs = resolveNarrativeTypewriterSpeedMs(typewriterSpeedMs);
  const { revealReady, onTypingComplete } = useNarrativeDialogNextReveal(
    typewriterKey,
    onTextComplete,
  );
  const [typingLive, setTypingLive] = useState(false);
  useEffect(() => {
    if (!typewriterActive) {
      setTypingLive(false);
      return;
    }
    if (skipAnimation) {
      setTypingLive(true);
      return;
    }
    setTypingLive(false);
    const timer = setTimeout(
      () => setTypingLive(true),
      NARRATIVE_DIALOG_LAYOUT.typewriterStartDelayMs,
    );
    return () => clearTimeout(timer);
  }, [typewriterKey, typewriterActive, skipAnimation]);
  const showDualActions = Boolean(secondaryButtonText && onPressSecondary);

  const card = (
    <View
      style={[
        styles.card,
        {
          height:
            portraitBleedPx
            + NARRATIVE_DIALOG_LAYOUT.dialogueLayerHeight
            + NARRATIVE_DIALOG_LAYOUT.actionLayerHeight,
          marginTop: -portraitOverflowUpPx,
        },
        isTactical
          ? { borderColor: TACTICAL_OVERLAY.cardBorder, backgroundColor: TACTICAL_OVERLAY.cardBg }
          : null,
      ]}
    >
      {/* 1. 얼굴 레이어 — 전폭 정사각. 문서흐름 300은 대사 핀용, 남는 높이는 위로만 */}
      <View
        style={[
          styles.portraitLayer,
          { height: portraitBleedPx },
          isTactical ? { backgroundColor: TACTICAL_OVERLAY.insetBg } : null,
        ]}
      >
        {imageSource ? (
          <Image
            source={imageSource}
            style={[styles.portraitImage, portraitTransform ? { transform: portraitTransform } : null]}
            resizeMode="contain"
            resizeMethod="resize"
          />
        ) : (
          <View style={styles.portraitPlaceholder} />
        )}
      </View>

      {/* 2. 대사 레이어 */}
      <View
        style={[
          styles.dialogueLayer,
          isTactical ? { backgroundColor: TACTICAL_OVERLAY.cardBg } : null,
        ]}
      >
        <Text style={[styles.label, { color: ink.accentInk }]} numberOfLines={1}>
          {speakerLabel}
        </Text>
        <View style={[styles.textSlot, { height: textBlockHeight }]}>
          <TypewriterText
            key={typewriterKey}
            text={text}
            speed={resolvedSpeedMs}
            onComplete={showActionButton ? onTypingComplete : onTextComplete}
            style={{ ...styles.text, color: isTactical ? ink.valueInk : COLORS.ink_dark }}
            skipAnimation={skipAnimation}
            cursor={typingLive}
            active={typingLive}
          />
        </View>
      </View>

      {/* 3. 버튼 레이어 */}
      <View
        style={[
          styles.actionLayer,
          isTactical ? { backgroundColor: TACTICAL_OVERLAY.cardBg } : null,
        ]}
      >
        {showActionButton && revealReady ? (
          <View style={[styles.footer, showDualActions ? styles.footerDual : null]}>
            <ArcButton
              label={buttonText}
              visualTheme={visualTheme}
              intent="primary"
              disabled={nextDisabled}
              onPress={onPressNext}
              style={styles.nextBtn}
            />
            {showDualActions ? (
              <ArcButton
                label={secondaryButtonText!}
                visualTheme={visualTheme}
                intent="secondary"
                disabled={nextDisabled}
                onPress={onPressSecondary}
                style={styles.nextBtn}
              />
            ) : null}
          </View>
        ) : (
          <View style={styles.footerSpacer} />
        )}
      </View>
    </View>
  );

  if (!stageFill) return card;

  return (
    <View style={styles.stageFillRoot} pointerEvents="box-none">
      <View style={{ height: stageFill.headerBottomPx }} pointerEvents="none" />
      {stageFill.topWhiteMarginPx > 0 ? (
        <View style={[styles.topWhiteMargin, { height: stageFill.topWhiteMarginPx }]} pointerEvents="none" />
      ) : null}
      {card}
      {stageFill.bottomBleedPx > 0 ? (
        <View style={[styles.bottomWhite, { height: stageFill.bottomBleedPx }]} pointerEvents="none" />
      ) : null}
      <View style={[styles.reservedWhite, { height: stageFill.reservedBottomPx }]} pointerEvents="none" />
    </View>
  );
});

const {
  height,
  portraitLayerHeight,
  dialogueLayerHeight,
  actionLayerHeight,
  lineHeight,
  labelLineHeight,
  dialoguePadTopPx,
  dialoguePadBottomPx,
  labelMarginBottomPx,
  hudHorizontalPadPx,
  dialogueIndentPx,
} = NARRATIVE_DIALOG_LAYOUT;

const STAGE_FILL_WHITE_BG = TACTICAL_OVERLAY.cardBg;

const styles = StyleSheet.create({
  stageFillRoot: {
    flex: 1,
    width: '100%',
    alignSelf: 'stretch',
  },
  topWhiteMargin: {
    alignSelf: 'stretch',
    backgroundColor: STAGE_FILL_WHITE_BG,
  },
  bottomWhite: {
    alignSelf: 'stretch',
    backgroundColor: STAGE_FILL_WHITE_BG,
  },
  reservedWhite: {
    alignSelf: 'stretch',
    backgroundColor: STAGE_FILL_WHITE_BG,
  },
  card: {
    width: '100%',
    height,
    alignSelf: 'stretch',
    flexDirection: 'column',
    borderWidth: 0,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: OVERLAY_TOKENS.phosphorCardBg,
  },
  portraitLayer: {
    width: '100%',
    height: portraitLayerHeight,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#05070d',
    overflow: 'hidden',
  },
  portraitImage: {
    width: '100%',
    height: '100%',
  },
  portraitPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#05070d',
  },
  dialogueLayer: {
    width: '100%',
    height: dialogueLayerHeight,
    flexShrink: 0,
    paddingTop: dialoguePadTopPx,
    paddingBottom: dialoguePadBottomPx,
    paddingLeft: hudHorizontalPadPx,
    paddingRight: hudHorizontalPadPx,
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: OVERLAY_TOKENS.phosphorCardBg,
  },
  actionLayer: {
    width: '100%',
    height: actionLayerHeight,
    flexShrink: 0,
    paddingHorizontal: hudHorizontalPadPx,
    paddingBottom: SPACING.sm,
    justifyContent: 'flex-end',
    backgroundColor: OVERLAY_TOKENS.phosphorCardBg,
  },
  label: {
    flexShrink: 0,
    fontFamily: FONTS.mono,
    fontSize: FONTS.size.sm,
    lineHeight: labelLineHeight,
    color: OVERLAY_TOKENS.phosphorAccent,
    marginBottom: labelMarginBottomPx,
    paddingLeft: dialogueIndentPx,
    textAlign: NARRATIVE_DIALOG_LAYOUT.textAlign,
    ...androidTextFix,
  },
  textSlot: {
    flexShrink: 0,
    alignSelf: 'stretch',
    width: '100%',
    justifyContent: 'flex-start',
    overflow: 'hidden',
    paddingLeft: dialogueIndentPx,
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
    alignItems: 'flex-end',
  },
  footerDual: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  footerSpacer: {
    flexShrink: 0,
    height: 44,
  },
  nextBtn: {
    minWidth: 96,
  },
});
