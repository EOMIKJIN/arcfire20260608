/**
 * 행성 허브 Reanimated/Skia worklet 계약 (2026-06-21 원천 수립)
 *
 * SIGSEGV 근본 원인: JS 스레드에서 SharedValue.value **읽기** → WorkletRuntime::executeSync
 * → ShareableWorklet::toJSValue 크래시 (tombstone 15:20 · mqt_v_js).
 *
 * ┌──────────────┬─────────────────────────────────────────────────────────────┐
 * │ 방향         │ 허용 패턴                                                    │
 * ├──────────────┼─────────────────────────────────────────────────────────────┤
 * │ JS → UI      │ SharedValue.value = … (쓰기만) · useFrameCallback 적분    │
 * │ UI → JS      │ throttled runOnJS + aliveSv + identity 고정 bridge 콜백     │
 * │ JS/ArcCore   │ readPlanetOrbitClockMs() 미러 · JS ref 팩 버퍼 (읽기 전용)   │
 * │ UI worklet   │ SharedValue.value 읽기 · useAnimatedStyle · reaction        │
 * └──────────────┴─────────────────────────────────────────────────────────────┘
 *
 * 금지: useEffect/useLayoutEffect/useCallback(비-worklet)에서 *.value 읽기
 * 금지: runOnUI / executeSync 유도 API
 * 금지: useAnimatedReaction deps에 JS 콜백·props 넣기 (ShareableWorklet 재생성)
 */

/** UI→JS runOnJS 스로틀 — 60Hz bridge는 PSS creep·GC 톱니 유발 */
export const HUB_WORKLET_JS_BRIDGE_INTERVAL_MS = 48;

/** orbitClock UI→JS 미러 — planet.tsx useFrameCallback 전용 */
export const ORBIT_CLOCK_JS_MIRROR_INTERVAL_MS = 32;

/** JS 스레드 팩 버퍼 — SharedValue에 쓸 때 동일 배열을 ref에도 보관 */
export type JsWorkletPackMirror<T> = {
  jsRef: { current: T };
  /** SharedValue 쓰기 직전 호출 — JS ref와 UI SV를 동시 갱신 */
  publish: (next: T, writeSv: (v: T) => void) => void;
};

export function createJsWorkletPackMirror<T>(initial: T): JsWorkletPackMirror<T> {
  const jsRef = { current: initial };
  return {
    jsRef,
    publish(next, writeSv) {
      jsRef.current = next;
      writeSv(next);
    },
  };
}
