// ============================================================
// 아크파이어 온라인 - 타이핑 효과 텍스트
// ============================================================

import React, { useEffect, useRef, useState } from 'react';
import { Platform, Text, TextStyle } from 'react-native';
import { COLORS, FONTS } from '../utils/theme';

interface TypewriterTextProps {
  text: string;
  speed?: number;        // ms per char
  onComplete?: () => void;
  style?: TextStyle;
  cursor?: boolean;
  /** 영화 프롤로그 등 어두운 배경용 커서 색 */
  cursorColor?: string;
  numberOfLines?: number;
  /** true면 애니메이션 없이 즉시 전체 텍스트를 표시(스킵 후 마지막 페이지 등) */
  skipAnimation?: boolean;
  /** false면 rAF를 시작하지 않음 — 오버레이 오픈 시퀀스 동안 */
  active?: boolean;
}

export function TypewriterText({
  text,
  speed = 35,
  onComplete,
  style,
  cursor = true,
  cursorColor,
  numberOfLines,
  skipAnimation = false,
  active = true,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const carryMsRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    carryMsRef.current = 0;

    if (!active) {
      setDisplayed('');
      setDone(false);
      indexRef.current = 0;
      return;
    }

    if (skipAnimation) {
      indexRef.current = text.length;
      setDisplayed(text);
      setDone(true);
      onCompleteRef.current?.();
      return;
    }

    setDisplayed('');
    setDone(false);
    indexRef.current = 0;

    const perCharMs = Math.max(1, speed);
    let lastTs = 0;

    const tick = (ts: number) => {
      if (!mountedRef.current) return;
      if (lastTs === 0) lastTs = ts;
      carryMsRef.current += ts - lastTs;
      lastTs = ts;

      let advanced = false;
      while (carryMsRef.current >= perCharMs && indexRef.current < text.length) {
        carryMsRef.current -= perCharMs;
        indexRef.current += 1;
        advanced = true;
      }

      if (advanced) {
        setDisplayed(text.slice(0, indexRef.current));
      }

      if (indexRef.current >= text.length) {
        setDone(true);
        onCompleteRef.current?.();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [active, text, speed, skipAnimation]);

  return (
    <Text style={[defaultStyle, style]} numberOfLines={numberOfLines}>
      {displayed}
      {cursor && active && !done ? (
        <Text style={{ color: cursorColor ?? COLORS.ink_mid }}>▌</Text>
      ) : null}
    </Text>
  );
}

const defaultStyle: TextStyle = {
  fontFamily: FONTS.mono,
  fontSize: FONTS.size.md,
  color: COLORS.ink_dark,
  lineHeight: 26,
  ...(Platform.OS === 'android' ? { includeFontPadding: false } : null),
};
