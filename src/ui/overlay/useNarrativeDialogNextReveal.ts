import { useCallback, useEffect, useRef, useState } from 'react';
import { NARRATIVE_DIALOG_LAYOUT } from './narrativeDialogLayout';

/**
 * 타이핑 완료 후 [ 다음 ] 버튼·pageComplete 를 짧게 지연 — 대사 종료 직후 즉시 등장 방지.
 */
export function useNarrativeDialogNextReveal(
  resetKey: string,
  onReady?: () => void,
): {
  revealReady: boolean;
  /** 타이핑은 끝났으나 버튼 reveal 대기 중 */
  awaitingReveal: boolean;
  onTypingComplete: () => void;
  skipToReady: () => void;
} {
  const [revealReady, setRevealReady] = useState(false);
  const [awaitingReveal, setAwaitingReveal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    setRevealReady(false);
    setAwaitingReveal(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [resetKey]);

  const fireReady = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setRevealReady(true);
    setAwaitingReveal(false);
    onReadyRef.current?.();
  }, []);

  const onTypingComplete = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setAwaitingReveal(true);
    timerRef.current = setTimeout(
      fireReady,
      NARRATIVE_DIALOG_LAYOUT.nextButtonRevealDelayMs,
    );
  }, [fireReady]);

  const skipToReady = useCallback(() => {
    fireReady();
  }, [fireReady]);

  return { revealReady, awaitingReveal, onTypingComplete, skipToReady };
}
