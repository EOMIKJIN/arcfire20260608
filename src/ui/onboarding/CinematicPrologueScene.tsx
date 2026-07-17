import React, { memo, useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { TypewriterText } from '../../components/TypewriterText';
import { FONTS } from '../../utils/theme';
import { CINEMATIC_PROLOGUE as CP } from './cinematicPrologueTokens';

type Props = {
  pageKey: number;
  label: string;
  text: string;
  typewriterSpeedMs: number;
  fadeInEnabled?: boolean;
  fadeInDurationMs?: number;
  onTextComplete: () => void;
  onPressAdvance: () => void;
};

/** 검은 화면 + 흰 자막 — 영화 프롤로그 연출 (범용 오버레이·Tactical UI 미사용) */
export const CinematicPrologueScene = memo(function CinematicPrologueScene({
  pageKey,
  label,
  text,
  typewriterSpeedMs,
  fadeInEnabled = true,
  fadeInDurationMs = CP.fadeDefaultMs,
  onTextComplete,
  onPressAdvance,
}: Props) {
  const { height } = useWindowDimensions();
  const letterboxH = Math.round(height * CP.letterboxHeightPct);
  const fadeAnim = useRef(new Animated.Value(fadeInEnabled ? 0 : 1)).current;

  useEffect(() => {
    if (!fadeInEnabled) {
      fadeAnim.setValue(1);
      return;
    }
    fadeAnim.setValue(0);
    // useNativeDriver 금지(본 페이드 한정) — 네이티브 드라이버는 애니메이션 종료 후 JS 값이 0에
    // 머물러, 타이핑 완료 등 리렌더 커밋 시 opacity가 0으로 덮여 "검은 화면 후 전체 텍스트"
    // 깜빡임이 발생했다(2026-07-17 intro 재시작 증상 근본 원인). 700ms 단발 텍스트 페이드라
    // JS 드라이버 성능 부담 없음.
    const anim = Animated.timing(fadeAnim, {
      toValue: 1,
      duration: Math.max(200, fadeInDurationMs),
      useNativeDriver: false,
    });
    anim.start(({ finished }) => {
      if (finished) fadeAnim.setValue(1);
    });
    return () => anim.stop();
  }, [pageKey, fadeInEnabled, fadeInDurationMs, fadeAnim]);

  return (
    <View style={styles.root}>
      <View style={[styles.letterbox, { height: letterboxH }]} />

      <Pressable style={styles.contentBand} onPress={onPressAdvance}>
        <Animated.View style={[styles.contentInner, { opacity: fadeAnim }]}>
          {label.trim().length > 0 ? (
            <Text style={styles.chapter}>{label.trim()}</Text>
          ) : null}
          <TypewriterText
            key={pageKey}
            text={text}
            speed={Math.max(1, typewriterSpeedMs)}
            onComplete={onTextComplete}
            style={styles.body}
            cursorColor={CP.cursorInk}
          />
        </Animated.View>
      </Pressable>

      <View style={[styles.letterbox, { height: letterboxH }]} />
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CP.screenBg,
  },
  letterbox: {
    backgroundColor: CP.screenBg,
    flexShrink: 0,
  },
  contentBand: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  contentInner: {
    width: '100%',
    maxWidth: CP.contentMaxWidth,
    alignItems: 'center',
  },
  chapter: {
    fontFamily: FONTS.mono,
    fontSize: CP.chapterFontSize,
    color: CP.chapterInk,
    letterSpacing: CP.chapterLetterSpacing,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 28,
  },
  body: {
    fontFamily: FONTS.mono,
    fontSize: CP.bodyFontSize,
    lineHeight: CP.bodyLineHeight,
    color: CP.bodyInk,
    letterSpacing: CP.bodyLetterSpacing,
    textAlign: 'center',
  },
});
