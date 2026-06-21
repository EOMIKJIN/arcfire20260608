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
  numberOfLines?: number;
}

export function TypewriterText({
  text,
  speed = 35,
  onComplete,
  style,
  cursor = true,
  numberOfLines,
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    indexRef.current = 0;

    timerRef.current = setInterval(() => {
      if (!mountedRef.current) return;
      if (indexRef.current < text.length) {
        const next = text.slice(0, indexRef.current + 1);
        setDisplayed(next);
        indexRef.current++;
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        if (!mountedRef.current) return;
        setDone(true);
        onComplete?.();
      }
    }, speed);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [text, speed]);

  return (
    <Text style={[defaultStyle, style]} numberOfLines={numberOfLines}>
      {displayed}
      {cursor && !done ? (
        <Text style={{ color: COLORS.ink_mid }}>▌</Text>
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
