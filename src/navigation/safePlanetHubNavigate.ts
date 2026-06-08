import type { Href } from 'expo-router';

/**
 * 행성 허브 네비게이션 락.
 * 한 번 navigate하면 700ms 동안 모든 후속 navigate를 차단한다.
 * Android react-native-screens에서 push/back 애니메이션 진행 중에 새 navigate가 들어가면
 * FragmentManager가 크래시를 내므로, 충분한 안전 마진을 둔다.
 */
const NAV_LOCK_MS = 700;
let lastInvokeAt: number | null = null;

export function resetPlanetHubNavigationThrottle(): void {
  lastInvokeAt = null;
}

export function runThrottledPlanetHubNavigation(run: () => void): void {
  const now = Date.now();
  if (lastInvokeAt != null && now - lastInvokeAt < NAV_LOCK_MS) return;
  lastInvokeAt = now;
  try {
    run();
  } catch {
    /* 네비게이션 경합 */
  }
}

/**
 * 쓰로틀만 적용한 직접 push. 시설 4곳은 `planet.tsx` 의 suspend 시퀀스(`onFacilityNavigate`)를 쓰는 것이 기본이다.
 */
export function runThrottledPlanetHubPush(
  push: (href: Href) => void,
  href: Href,
): void {
  runThrottledPlanetHubNavigation(() => push(href));
}

/**
 * 시설 나가기(back) 등에서도 같은 락을 공유한다(시설→나가기→다른 시설 push 경합 차단).
 * push 와 동일하게 즉시 실행한다 — defer 시 위 동일 위험.
 */
export function runThrottledPlanetHubBack(back: () => void): void {
  runThrottledPlanetHubNavigation(back);
}

/**
 * 출발(은하지도 이동) 등 *호출 직전 setState 가 effect 까지 commit 되어야 안전한* 전환 전용 헬퍼.
 *
 * 메커니즘: `setTimeout(fn, 0)` — 현재 동기 작업(이벤트 핸들러)·React 자동 배치 commit·effect 가
 * 모두 끝난 뒤 다음 매크로태스크에서 push 를 실행한다.
 *
 * 왜 `requestAnimationFrame` 이 아니라 `setTimeout(0)` 인가:
 *  - RN/Hermes 의 rAF 콜백은 일부 release 빌드에서 user-gesture 컨텍스트를 보존하지 못해
 *    `router.push` 가 react-native-screens FragmentTransaction 에 정상 attach 되지 않을 수 있다.
 *  - `setTimeout(0)` 은 RN의 Timing 모듈을 거쳐 다음 tick 에 안정적으로 디스패치되며, 같은 환경에서
 *    expo-router/react-native-screens push 가 정상 동작함이 더 잘 검증되어 있다.
 *
 * 추정 추가 지연: 약 1 macrotask(1~16ms). UX 영향 미미.
 */
export function schedulePostCommitNavigation(run: () => void): void {
  setTimeout(() => {
    try {
      run();
    } catch {
      /* 네비게이션 실행 실패는 흡수 */
    }
  }, 0);
}
