import { useEffect, useRef } from 'react';
import { InteractionManager } from 'react-native';
import { getCurrentUserEnsured } from '../auth';
import { useAppBootStore } from '../../store/appBootStore';

const TRANSIENT_RESTORE_ERRORS = new Set(['consume_failed', 'user_read_timeout', 'restore_failed']);
const PENDING_RESTORE_RETRY_MS = 6_000;
const PENDING_RESTORE_MAX_RETRIES = 2;

/**
 * 부트 체인·타이틀 게이트와 분리 — bootReady + UI 유휴 후 device uid 기준 pending 복구.
 * player 유무와 무관(초기화 직후·CLI 예약 복구).
 */
export function GameSaveRestorePendingConsumer() {
  const bootReady = useAppBootStore((s) => s.bootReady);
  const attemptedUidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!bootReady) return;

    let cancelled = false;

    const runConsume = async (uid: string, retryIndex: number): Promise<void> => {
      if (cancelled) return;
      const m = await import('./gameSaveBackupService');
      const result = await m.consumePendingAdminGameSaveRestore(uid);
      if (cancelled) return;

      const transient =
        result.kind === 'failed' &&
        !!result.error &&
        TRANSIENT_RESTORE_ERRORS.has(result.error);

      if (transient && retryIndex < PENDING_RESTORE_MAX_RETRIES) {
        setTimeout(() => {
          void runConsume(uid, retryIndex + 1);
        }, PENDING_RESTORE_RETRY_MS);
        return;
      }

      attemptedUidRef.current = uid;
    };

    const handle = InteractionManager.runAfterInteractions(() => {
      void (async () => {
        try {
          const authUser = await getCurrentUserEnsured();
          const uid = authUser.uid?.trim();
          if (!uid || uid === 'local-guest') return;
          if (attemptedUidRef.current === uid) return;
          await runConsume(uid, 0);
        } catch {
          /* pending 유지 — 설정에서 수동 복구 가능 */
        }
      })();
    });

    return () => {
      cancelled = true;
      handle.cancel();
    };
  }, [bootReady]);

  return null;
}
