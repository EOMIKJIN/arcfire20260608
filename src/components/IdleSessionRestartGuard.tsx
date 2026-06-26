import React, { memo, useEffect, useMemo, useRef } from 'react';
import { AppState, PanResponder, StyleSheet, View, type AppStateStatus } from 'react-native';
import { showArcNotificationAlert } from '../utils/showArcAlert';
import { showStageTransitionRestartAlert } from '../navigation/stageTransitionStuckWatchdog';
import { t } from '../i18n';
import {
  IDLE_SESSION_CHECK_INTERVAL_MS,
  IDLE_SESSION_RESTART_GRACE_MS,
  IDLE_SESSION_RESTART_MS,
} from '../game/idleSessionRestartPolicy';
import { reloadAppSessionAsync } from '../game/reloadAppSession';
import { useAppBootStore } from '../store/appBootStore';

const IDLE_RESTART_ALERT_ID = 'idle-session-restart-notice';

let lastUserInteractionMs = Date.now();

/** 테스트·감사 훅 — 마지막 조작 시각 주입 */
export function __setLastUserInteractionMsForTests(ms: number): void {
  lastUserInteractionMs = ms;
}

export function noteIdleSessionUserInteraction(): void {
  lastUserInteractionMs = Date.now();
}

/**
 * 포그라운드 1시간 무조작 → 안내 알림 → 세션 재시작.
 * 백그라운드 구간은 idle 카운트에 포함하지 않는다.
 */
export const IdleSessionRestartGuard = memo(function IdleSessionRestartGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const bootReady = useAppBootStore((s) => s.bootReady);
  const restartScheduledRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: () => {
          noteIdleSessionUserInteraction();
          return false;
        },
        onMoveShouldSetPanResponderCapture: () => {
          noteIdleSessionUserInteraction();
          return false;
        },
      }),
    [],
  );

  useEffect(() => {
    if (!bootReady) return;

    const onAppState = (next: AppStateStatus) => {
      appStateRef.current = next;
      if (next === 'active') {
        noteIdleSessionUserInteraction();
      }
    };
    const sub = AppState.addEventListener('change', onAppState);

    const scheduleRestart = () => {
      if (restartScheduledRef.current) return;
      restartScheduledRef.current = true;
      showArcNotificationAlert(
        t('idleSession.restart.title'),
        t('idleSession.restart.body'),
        { id: IDLE_RESTART_ALERT_ID },
      );
      setTimeout(() => {
        void reloadAppSessionAsync('idle_1h').then((ok) => {
          if (!ok) {
            restartScheduledRef.current = false;
            showStageTransitionRestartAlert();
          }
        });
      }, IDLE_SESSION_RESTART_GRACE_MS);
    };

    const tick = () => {
      if (restartScheduledRef.current) return;
      if (appStateRef.current !== 'active') return;
      if (Date.now() - lastUserInteractionMs < IDLE_SESSION_RESTART_MS) return;
      scheduleRestart();
    };

    const intervalId = setInterval(tick, IDLE_SESSION_CHECK_INTERVAL_MS);
    return () => {
      sub.remove();
      clearInterval(intervalId);
    };
  }, [bootReady]);

  return (
    <View style={styles.root} {...panResponder.panHandlers}>
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1 },
});
