// ============================================================
// 행성 메인스테이지 라이프사이클 — Safety Gate 단일 진실 소스 (Phase 2)
// ----------------------------------------------------------------------
// 목적:
//  - 출발(은하지도 push)·시설 push 중에 발생하는 동시 자원 점유 → 화면 전환 충돌을
//    "확정적 시퀀스(Active → Suspending → Frozen → Resuming → Active)"로 직렬화한다.
//  - 그래픽 루프(Skia 셰이더 rAF, Reanimated frame callback)·전투 sim·채굴 인터벌 등
//    개별 자원이 한 가지 신호(`lifecycle`)만 구독하면 자동으로 stop/resume 된다.
//
// 시퀀스(출발):
//  1) `beginSuspend(navigate)` — 호출 직전 호출자(planet 화면)가 mining/combat 스냅샷을 동기 저장
//  2) lifecycle = 'suspending' → React 렌더 → 모든 자원의 useEffect 가 stop
//  3) `markFrozen()` (1 macrotask 뒤) → React 렌더 → 자원 정지 확정 단계
//  4) `consumePendingNavigation()` 로 navigate 실행 → router.push(...) 호출
//
// 시퀀스(복귀):
//  1) `beginResume()` (planet useFocusEffect 가 포커스 복귀 시 호출)
//  2) lifecycle = 'resuming' → 자원이 snapshot 소비·재가동 채비
//  3) `finalizeResume()` (1 macrotask 뒤) → lifecycle = 'active'
//
// 안전망:
//  - 동일 lifecycle 의 중복 진입은 무시(idempotent).
//  - 5초 내 frozen→navigate 가 끝나지 않으면 강제 active 복귀(완전 정지 회피).
// ============================================================

import { create } from 'zustand';

export type PlanetStageLifecycle = 'active' | 'suspending' | 'frozen' | 'resuming';

interface PlanetStageLifecycleState {
  lifecycle: PlanetStageLifecycle;
  pendingNavigation: (() => void) | null;
  suspendStartedAtMs: number | null;
  suspendSafetyTimerId: ReturnType<typeof setTimeout> | null;

  clearSuspendSafetyTimer: () => void;

  /**
   * 호출 즉시 lifecycle = 'suspending' 으로 전이. 이미 다른 전이 중이면 무시.
   * `navigate`는 frozen 도달 후 1 macrotask 뒤에 실행된다.
   */
  beginSuspend: (navigate: () => void) => void;

  /** suspending → frozen (자원 정지 확정 표시). suspending 외에는 무시. */
  markFrozen: () => void;

  /** 보관된 navigate 콜백을 1회 소비. 이미 실행되었거나 없으면 null. */
  consumePendingNavigation: () => (() => void) | null;

  /** frozen 또는 suspending 에서 lifecycle = 'resuming' 으로 전이. active 면 무시. */
  beginResume: () => void;

  /** resuming → active. 어느 상태에서 호출되어도 active 로 정착(idempotent). */
  finalizeResume: () => void;

  /** 디버깅·취소 경로. 어떤 상태에서든 강제로 active 로 되돌린다. */
  forceActive: () => void;
}

const SUSPEND_SAFETY_TIMEOUT_MS = 5000;

export const usePlanetStageLifecycleStore = create<PlanetStageLifecycleState>((set, get) => ({
  lifecycle: 'active',
  pendingNavigation: null,
  suspendStartedAtMs: null,
  suspendSafetyTimerId: null,

  clearSuspendSafetyTimer: () => {
    const id = get().suspendSafetyTimerId;
    if (id != null) clearTimeout(id);
    set({ suspendSafetyTimerId: null });
  },

  beginSuspend: (navigate) => {
    if (get().lifecycle !== 'active') return;
    get().clearSuspendSafetyTimer();
    const startedAt = Date.now();
    set({
      lifecycle: 'suspending',
      pendingNavigation: navigate,
      suspendStartedAtMs: startedAt,
    });
    const timerId = setTimeout(() => {
      const s = get();
      if (s.suspendSafetyTimerId !== timerId) return;
      if (s.lifecycle !== 'suspending') return;
      if (s.suspendStartedAtMs == null || s.suspendStartedAtMs !== startedAt) return;
      if (Date.now() - startedAt < SUSPEND_SAFETY_TIMEOUT_MS - 50) return;
      set({
        lifecycle: 'active',
        pendingNavigation: null,
        suspendStartedAtMs: null,
        suspendSafetyTimerId: null,
      });
    }, SUSPEND_SAFETY_TIMEOUT_MS);
    set({ suspendSafetyTimerId: timerId });
  },

  markFrozen: () => {
    if (get().lifecycle !== 'suspending') return;
    get().clearSuspendSafetyTimer();
    set({ lifecycle: 'frozen', suspendStartedAtMs: null });
  },

  consumePendingNavigation: () => {
    const cb = get().pendingNavigation;
    if (cb) set({ pendingNavigation: null });
    return cb;
  },

  beginResume: () => {
    const cur = get().lifecycle;
    if (cur === 'active' || cur === 'resuming') return;
    get().clearSuspendSafetyTimer();
    set({ lifecycle: 'resuming', pendingNavigation: null, suspendStartedAtMs: null });
  },

  finalizeResume: () => {
    get().clearSuspendSafetyTimer();
    set({ lifecycle: 'active', pendingNavigation: null, suspendStartedAtMs: null });
  },

  forceActive: () => {
    get().clearSuspendSafetyTimer();
    set({ lifecycle: 'active', pendingNavigation: null, suspendStartedAtMs: null });
  },
}));

export const selectPlanetStageLifecycle = (s: PlanetStageLifecycleState): PlanetStageLifecycle =>
  s.lifecycle;

export const selectPlanetStageIsActive = (s: PlanetStageLifecycleState): boolean =>
  s.lifecycle === 'active';

export const selectPlanetStageIsSuspendingOrFrozen = (s: PlanetStageLifecycleState): boolean =>
  s.lifecycle === 'suspending' || s.lifecycle === 'frozen';
