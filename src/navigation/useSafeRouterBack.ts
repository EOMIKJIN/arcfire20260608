import { useCallback } from 'react';
import { BackHandler } from 'react-native';
import { router, useFocusEffect, usePathname, type Href } from 'expo-router';
import { abortAllIngameDialogOnLeave } from '../game/ingameDialog/ingameDialogApi';
import { runThrottledPlanetHubNavigation } from './safePlanetHubNavigate';
import {
  beginFacilityExitTeardown,
  clearFacilityExitTeardown,
  isFacilityExitRoute,
} from './facilityExitTeardown';

export type SafeRouterBackOptions = {
  /** `canGoBack()`이 false일 때(예: 단일 스택) 이동할 경로 */
  fallbackReplace?: Href;
};

/**
 * 시설(무역소·조선소 등)에서 나가기·은하계 지도 ☰ 메뉴 등 모든 뒤로가기.
 *
 * 핵심: 행성 허브 push 락(`runThrottledPlanetHubNavigation`)을 **공유**한다.
 * 이렇게 하면 시설→나가기→다른 시설 push 시퀀스에서 700ms 안에 두 번째 동작이
 * 시도되어도 자동 차단되어 push/back 애니메이션 경합 크래시를 막는다.
 *
 * 시설 화면: 내용 해체(StageShell 빈 View) → 2×rAF → back. 안드로이드 하드웨어 뒤로가기도 같은 경로.
 */
export function useSafeRouterBack(options?: SafeRouterBackOptions): () => void {
  const fallback = options?.fallbackReplace;
  const pathname = usePathname();
  const lastSegment = pathname.split('/').filter(Boolean).pop() ?? null;
  const teardownRoute = isFacilityExitRoute(lastSegment) ? lastSegment : null;

  const back = useCallback(() => {
    runThrottledPlanetHubNavigation(() => {
      try {
        abortAllIngameDialogOnLeave();
        if (router.canGoBack()) {
          if (teardownRoute) {
            beginFacilityExitTeardown(teardownRoute);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                try {
                  router.back();
                } catch {
                  clearFacilityExitTeardown(teardownRoute);
                }
              });
            });
            return;
          }
          router.back();
          return;
        }
        if (fallback != null) {
          router.replace(fallback);
        }
      } catch {
        /* 연타·경합 시 네이티브 예외 무시 */
      }
    });
  }, [fallback, teardownRoute]);

  useFocusEffect(
    useCallback(() => {
      if (!teardownRoute) return undefined;
      /** 다시 연 시설 — 이전 나가기 표시가 남아 있으면 해제 */
      clearFacilityExitTeardown(teardownRoute);
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        back();
        return true;
      });
      return () => sub.remove();
    }, [teardownRoute, back]),
  );

  return back;
}
