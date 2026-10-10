import { useSyncExternalStore } from 'react';

/**
 * 시설 화면(push → back) 나가기 직전 내용 해체 — 2026-10-10 Java 힙 덤프 근거.
 * 화면이 닫히는(pop) 동안 Fabric 삭제가 일부 누락되면, 지워지지 않은 View 1개가 mParent로
 * 닫힌 화면 전체(View 50~600개 · hwui 그리기 기록)를 붙잡았다. 스택에 붙어 있는 동안
 * 내용을 먼저 언마운트해 정상 삭제시키고, 빈 화면만 닫는다.
 */
const FACILITY_EXIT_ROUTES = new Set(['trade', 'shipyard', 'bar', 'skilltree']);
/** 닫힘 애니메이션·언마운트가 끝나고도 남는 경우를 위한 안전 해제 */
const EXIT_FLAG_MAX_MS = 3000;

let exitingRoute: string | null = null;
let clearTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isFacilityExitRoute(route: string | null | undefined): route is string {
  return route != null && FACILITY_EXIT_ROUTES.has(route);
}

/**
 * STAGE 출발(replace) — 떠나는 화면(StageShell)의 내용을 다음 화면 마운트 전에 내린다.
 * 화면 전환 순간 이전·다음 화면이 겹쳐 PSS가 튀던 문제(2026-10-10 지도→전투 666) 완화.
 * StageShell 언마운트 시 자동 해제.
 */
export function beginStageExitTeardown(route: string): void {
  beginFacilityExitTeardown(route);
}

/** 떠나는 화면 내용 해체 → 2×rAF → navigate (StageShell 소유 route만) */
export function navigateAfterStageExitTeardown(route: string, navigate: () => void): void {
  beginStageExitTeardown(route);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      try {
        navigate();
      } catch {
        clearFacilityExitTeardown(route);
      }
    });
  });
}

export function beginFacilityExitTeardown(route: string): void {
  exitingRoute = route;
  if (clearTimer) clearTimeout(clearTimer);
  clearTimer = setTimeout(() => clearFacilityExitTeardown(route), EXIT_FLAG_MAX_MS);
  emit();
}

/** 같은 시설을 다시 열면(focus) 즉시 해제 */
export function clearFacilityExitTeardown(route?: string): void {
  if (exitingRoute == null) return;
  if (route != null && exitingRoute !== route) return;
  exitingRoute = null;
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }
  emit();
}

export function useFacilityExitTeardown(route: string): boolean {
  return useSyncExternalStore(subscribe, () => exitingRoute === route);
}
