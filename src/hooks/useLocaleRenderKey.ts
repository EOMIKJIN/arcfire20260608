// ============================================================
// locale 변경 즉시 반영 + freezeOnBlur 스택 stale UI 방어
//   (game)/_layout `freezeOnBlur: true` — blur 중 locale 변경 시
//   unfocus 복귀 전까지 리렌더가 동결될 수 있음.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAppSettingsStore } from '../store/appSettingsStore';

/**
 * Root View / StageShell `key` 용. locale 변경 시 즉시 갱신하고,
 * blur 동안 바뀐 locale 은 focus 복귀 시 한 번 더 동기화한다.
 */
export function useLocaleRenderKey(): string {
  const locale = useAppSettingsStore((s) => s.locale);
  const syncedLocale = useRef(locale);
  const [epoch, setEpoch] = useState(0);

  const syncLocale = useCallback(() => {
    if (syncedLocale.current === locale) return;
    syncedLocale.current = locale;
    setEpoch((n) => n + 1);
  }, [locale]);

  useEffect(() => {
    syncLocale();
  }, [syncLocale]);

  useFocusEffect(
    useCallback(() => {
      syncLocale();
    }, [syncLocale]),
  );

  return `${locale}:${epoch}`;
}
