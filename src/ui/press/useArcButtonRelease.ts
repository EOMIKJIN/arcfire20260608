import { useCallback, useEffect, useMemo, useRef } from 'react';
import { bindUiSfxPressIn, type UiSfxCue } from '../../audio';

/**
 * 범용 버튼 클릭 계약
 * - 눌림(onPressIn): SFX·pressed 연출만
 * - 뗌(onPress): 동작만. RN Pressable onPress = 대상 위에서 손가락을 뗄 때
 * - 닫힘/전환은 뗌이 한 프레임 그려진 뒤에 실행(언마운트가 눌림으로 착시되는 것 방지)
 */
export const ARC_BUTTON_RELEASE_COMMIT_MS = 48;

type Opts = {
  onPress?: () => void;
  disabled?: boolean;
  /** true면 눌림 SFX만 생략 (dimmed 등). 동작 차단은 disabled */
  silentSfx?: boolean;
  sfxCue?: UiSfxCue | null;
};

export function useArcButtonReleaseHandlers(opts: Opts): {
  onPressIn: () => void;
  onPressOut: () => void;
  onPress: () => void;
} {
  const actionRef = useRef(opts.onPress);
  actionRef.current = opts.onPress;
  const disabled = Boolean(opts.disabled);
  const pendingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (!timerRef.current) return;
      clearTimeout(timerRef.current);
      timerRef.current = null;
      if (pendingRef.current) {
        pendingRef.current = false;
        actionRef.current?.();
      }
    };
  }, []);

  const onPressIn = useMemo(
    () =>
      bindUiSfxPressIn({
        cue: opts.sfxCue ?? 'ui_click',
        silent: disabled || Boolean(opts.silentSfx) || opts.sfxCue === null,
      }),
    [disabled, opts.silentSfx, opts.sfxCue],
  );

  const onPressOut = useCallback(() => {
    /* 뗌 시각 — Pressable `pressed`가 false. 동작은 onPress에서만. */
  }, []);

  const onPress = useCallback(() => {
    if (disabled || pendingRef.current || !actionRef.current) return;
    pendingRef.current = true;
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      pendingRef.current = false;
      actionRef.current?.();
    }, ARC_BUTTON_RELEASE_COMMIT_MS);
  }, [disabled]);

  return { onPressIn, onPressOut, onPress };
}
