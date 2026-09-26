// ============================================================
// 아크파이어 온라인 - 타이핑 효과 텍스트
// ============================================================

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Platform, Text, TextStyle } from 'react-native';
import { COLORS, FONTS } from '../utils/theme';
import { resolveTypewriterResetState, typewriterEpoch } from './typewriterResetState';

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
  /** 같은 문장이어도 페이지가 바뀌면 타이핑만 리셋. React key remount 금지(초상 Image 깜박임) */
  resetToken?: string;
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
  resetToken,
}: TypewriterTextProps) {
  const epoch = typewriterEpoch({ resetToken, text, active, skipAnimation });
  const [epochSeen, setEpochSeen] = useState(epoch);
  const initial = resolveTypewriterResetState({ text, active, skipAnimation });
  const [displayed, setDisplayed] = useState(initial.displayed);
  const [done, setDone] = useState(initial.done);
  const indexRef = useRef(initial.index);
  const carryMsRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const mountedRef = useRef(true);
  const onCompleteRef = useRef(onComplete);

  if (epochSeen !== epoch) {
    setEpochSeen(epoch);
    const next = resolveTypewriterResetState({ text, active, skipAnimation });
    setDisplayed(next.displayed);
    setDone(next.done);
    indexRef.current = next.index;
  }

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useLayoutEffect(() => {
    carryMsRef.current = 0;
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (!active) {
      return;
    }

    if (skipAnimation || indexRef.current >= text.length) {
      onCompleteRef.current?.();
      return;
    }

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
  }, [epoch, active, text, speed, skipAnimation]);

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
