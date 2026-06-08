import type { SharedValue } from 'react-native-reanimated';

/** 행성 궤도 `orbitClockMs` — 아크코어 NPC 스냅샷이 동일 시계로 앵커를 맞출 때만 사용 */
let orbitClockMsSv: SharedValue<number> | null = null;

export function registerPlanetOrbitClockMs(sv: SharedValue<number> | null): void {
  orbitClockMsSv = sv;
}

export function readPlanetOrbitClockMs(): number {
  return orbitClockMsSv?.value ?? 0;
}
