// ============================================================
// 아크파이어 온라인 — 이어하기 우주 항로 로딩 (직접 진입 시: 프리로드 + 최소 표시)
// ============================================================

import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../src/utils/theme';
import { StageShell } from '../../src/stages/StageShell';
import {
  CONTINUE_SESSION_MIN_LOADING_MS,
  runContinueSessionPrewarm,
} from '../../src/game/continueSessionPrewarm';
import { ContinueSessionLoadingView } from '../../src/game/continueSessionLoadingView';
import { runStageNavAfterTeardown } from '../../src/navigation/stageNavGate';

export default function ContinueWarpScreen() {
  const { width, height } = useWindowDimensions();
  const rawTarget = useLocalSearchParams<{ target?: string | string[] }>().target;
  const target = useMemo(
    () => (Array.isArray(rawTarget) ? rawTarget[0] : rawTarget) ?? 'planet',
    [rawTarget],
  );
  const nextRoute = useMemo(() => {
    if (target === 'planet') return '/(game)/planet' as const;
    return '/(game)/planet' as const;
  }, [target]);
  const minHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navScheduledRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const minHold = new Promise<void>((r) => {
        minHoldTimerRef.current = setTimeout(() => {
          minHoldTimerRef.current = null;
          r();
        }, CONTINUE_SESSION_MIN_LOADING_MS);
      });
      try {
        await Promise.all([runContinueSessionPrewarm(), minHold]);
      } catch {
        /* 프리로드 실패해도 진입은 허용 */
        await minHold;
      }
      if (cancelled || navScheduledRef.current) return;
      navScheduledRef.current = true;
      runStageNavAfterTeardown({
        teardown: () => {},
        navigate: () => router.replace(nextRoute),
        isMounted: () => isMountedRef.current && !cancelled,
      });
    })();
    return () => {
      cancelled = true;
      if (minHoldTimerRef.current) {
        clearTimeout(minHoldTimerRef.current);
        minHoldTimerRef.current = null;
      }
    };
  }, [nextRoute]);

  return (
    <StageShell routeName="continue_warp" background="none">
      <View style={[styles.root, { width, height }]}>
        <ContinueSessionLoadingView width={width} height={height} phaseLabel="불러오는 중…" />
      </View>
    </StageShell>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.bg_primary,
  },
});
