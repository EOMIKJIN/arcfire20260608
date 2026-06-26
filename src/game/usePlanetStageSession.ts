// ============================================================
// 행성 메인스테이지 단일 진입점 훅 — Phase 2
// ----------------------------------------------------------------------
// PlanetScreen 한 곳에서만 마운트한다. 다음을 한 인터페이스로 묶어 가독성을 확보한다.
//
//   const session = usePlanetStageSession();
//   session.lifecycle              // 'active' | 'suspending' | 'frozen' | 'resuming'
//   session.isActive               // 그래픽 루프·sim 가동 가능 여부
//   session.beginDeparture(navigate)
//                                   // 출발 시퀀스 시작. 호출 직전에 mining/combat 스냅샷을
//                                   // 동기 저장한 뒤 본 메서드를 호출하면 자원이 자동 stop
//                                   // → 1 macrotask 후 frozen → 1 macrotask 후 navigate 실행.
//   session.notifyFocusGained()    // useFocusEffect 에서 포커스 회복 시 호출.
//                                   // frozen/suspending 이면 resuming → active 자동 진행.
//
// 자원 게이트 패턴(공통 1줄):
//   useEffect(() => {
//     if (lifecycle === 'active') { startMyLoop(); return () => stopMyLoop(); }
//   }, [lifecycle, ...]);
// ============================================================

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { DEFAULT_STAGE_NAV_DRAIN_MS, runStageUiAfterIdle } from '../navigation/stageNavGate';
import {
  usePlanetStageLifecycleStore,
  selectPlanetStageLifecycle,
  type PlanetStageLifecycle,
} from './planetStageLifecycle';

export interface PlanetStageSession {
  lifecycle: PlanetStageLifecycle;
  isActive: boolean;
  isTransiting: boolean;
  beginDeparture: (navigate: () => void) => void;
  notifyFocusGained: () => void;
}

export function usePlanetStageSession(): PlanetStageSession {
  const lifecycle = usePlanetStageLifecycleStore(selectPlanetStageLifecycle);
  const beginSuspend = usePlanetStageLifecycleStore((s) => s.beginSuspend);
  const markFrozen = usePlanetStageLifecycleStore((s) => s.markFrozen);
  const consumePendingNavigation = usePlanetStageLifecycleStore((s) => s.consumePendingNavigation);
  const beginResume = usePlanetStageLifecycleStore((s) => s.beginResume);
  const finalizeResume = usePlanetStageLifecycleStore((s) => s.finalizeResume);
  const departureTapLockRef = useRef(false);

  useEffect(() => {
    if (lifecycle === 'active') departureTapLockRef.current = false;
  }, [lifecycle]);

  /** suspending → frozen — 1 macrotask 대기로 React effect cleanup(자원 stop) 완료를 보장. */
  useEffect(() => {
    if (lifecycle !== 'suspending') return;
    const t = setTimeout(() => markFrozen(), 0);
    return () => clearTimeout(t);
  }, [lifecycle, markFrozen]);

  /**
   * frozen → navigate — InteractionManager + 2×rAF 로 planet Skia/GPU teardown 완료 후 worldmap mount.
   * setTimeout(0) 만으로는 views 900+ 겹침·native floor 계단이 재현됨.
   */
  useEffect(() => {
    if (lifecycle !== 'frozen') return;
    let cancelled = false;
    let navigated = false;
    const runNavigate = () => {
      if (cancelled || navigated) return;
      navigated = true;
      const cb = consumePendingNavigation();
      if (!cb) {
        usePlanetStageLifecycleStore.getState().forceActive();
        return;
      }
      try {
        cb();
      } catch {
        /* navigate 실패 — forceActive 로 LOADING 해제 */
      } finally {
        usePlanetStageLifecycleStore.getState().forceActive();
      }
    };
    const task = runStageUiAfterIdle(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(runNavigate, DEFAULT_STAGE_NAV_DRAIN_MS);
        });
      });
    });
    /** frozen 에서 navigate 콜백이 영구 대기할 때 — LOADING 고착 방지 */
    const frozenFallback = setTimeout(runNavigate, 10000);
    return () => {
      cancelled = true;
      task.cancel();
      clearTimeout(frozenFallback);
    };
  }, [lifecycle, consumePendingNavigation]);

  /** resuming → active — 1 macrotask 대기 후 active 정착(스냅샷 consume effect 가 먼저 돌도록). */
  useEffect(() => {
    if (lifecycle !== 'resuming') return;
    const t = setTimeout(() => finalizeResume(), 0);
    return () => clearTimeout(t);
  }, [lifecycle, finalizeResume]);

  const beginDeparture = useCallback(
    (navigate: () => void) => {
      if (departureTapLockRef.current) return;
      if (usePlanetStageLifecycleStore.getState().lifecycle !== 'active') return;
      departureTapLockRef.current = true;
      beginSuspend(navigate);
      if (usePlanetStageLifecycleStore.getState().lifecycle === 'active') {
        departureTapLockRef.current = false;
      }
    },
    [beginSuspend],
  );

  const notifyFocusGained = useCallback(() => {
    beginResume();
  }, [beginResume]);

  /**
   * 반환 객체를 useMemo 로 안정화. lifecycle 가 바뀔 때만 새 객체가 만들어지며,
   * 그 외 렌더에서는 동일 참조를 유지해 호출자(planet.tsx)의 useFocusEffect/useMemo 가
   * 매 렌더마다 재등록되지 않는다. (Phase 2 회귀 — 매 렌더 focus 토글로 onPress 차단되던 문제)
   */
  return useMemo(
    () => ({
      lifecycle,
      isActive: lifecycle === 'active',
      isTransiting: lifecycle === 'suspending' || lifecycle === 'frozen',
      beginDeparture,
      notifyFocusGained,
    }),
    [lifecycle, beginDeparture, notifyFocusGained],
  );
}
