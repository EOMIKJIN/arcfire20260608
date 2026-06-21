import type { SharedValue } from 'react-native-reanimated';

/** 행성 궤도 `orbitClockMs` — 아크코어 NPC·드론이 동일 시계 앵커를 맞출 때 사용 */
let orbitClockMsSv: SharedValue<number> | null = null;

/**
 * JS 스레드 전용 미러.
 * SharedValue.value 를 JS에서 읽으면 executeSync → ShareableWorklet SIGSEGV(2026-06-21 15:20).
 */
let orbitClockMsJsMirror = 0;

export function registerPlanetOrbitClockMs(sv: SharedValue<number> | null): void {
  orbitClockMsSv = sv;
  if (!sv) {
    orbitClockMsJsMirror = 0;
  }
}

/** UI worklet → JS 미러 (throttled runOnJS 전용) */
export function notePlanetOrbitClockMsJs(ms: number): void {
  if (Number.isFinite(ms)) {
    orbitClockMsJsMirror = ms;
  }
}

/** JS/ArcCore 전용 — SharedValue.value 직접 읽기 금지 */
export function readPlanetOrbitClockMs(): number {
  return orbitClockMsJsMirror;
}

/** @internal worklet 전용 SharedValue (렌더·useAnimatedStyle) */
export function getPlanetOrbitClockMsSharedValue(): SharedValue<number> | null {
  return orbitClockMsSv;
}
