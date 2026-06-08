import { useCallback } from 'react';
import { router, type Href } from 'expo-router';
import { runThrottledPlanetHubNavigation } from './safePlanetHubNavigate';

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
 */
export function useSafeRouterBack(options?: SafeRouterBackOptions): () => void {
  const fallback = options?.fallbackReplace;
  return useCallback(() => {
    runThrottledPlanetHubNavigation(() => {
      try {
        if (router.canGoBack()) {
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
  }, [fallback]);
}
