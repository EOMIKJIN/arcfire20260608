import { trimNativeBitmapCachesAsync } from 'arcfire-native-memory';
import { runCombatSkiaPresentationReclaim } from '../../combat/combatSkiaPresentationReclaim';

/**
 * 전투 orbit(웨이브 디펜스 combat phase 포함) 활성 "중"에만 도는 안전 reclaim.
 * 5분 soft·15분 deep 주기 reclaim은 mid-frame Skia/worklet 레이스 회피를 위해 전투 중
 * 전면 skip되는데, 그 사이 module Path/Paint/maskfilter 캐시(색상·틴트·붓·PictureRecorder 등)와
 * native_heap(Fresco 비트맵 캐시)이 인카운터가 길어질수록 계속 상주할 수 있다(7/7 native_heap
 * 주도 하드실링 인시던트 — GL은 정상이었는데 native_heap+views만 급증한 케이스로 확인).
 *
 * 여기서 부르는 두 가지는 mid-frame에도 안전한 것만 골랐다:
 * - `runCombatSkiaPresentationReclaim` — lazy 재생성 getter 패턴이라 다음 draw 시 자동 재생성.
 * - `trimNativeBitmapCachesAsync`(Fresco) — 현재 마운트된 Image가 참조 중인 비트맵은 안 건드리고
 *   "안 쓰는 재사용 풀"만 비움(RN Image key 리마운트가 아님) — 화면 끊김 없이 안전하다고 판단.
 *   (네이티브 Fresco 내부 동작은 TS 브릿지 시그니처 기반 추론 — 실기 검증 필요)
 * dodge overlay 강제 해제(signalHubSkiaNativeReclaim)·RN 백드롭 remount(Image key 리마운트)는
 * 전투 중 시각적 끊김 위험이 있어 여전히 여기서 호출하지 않는다.
 */
export function runPlanetHubCombatSafeReclaimPass(reason: string): void {
  runCombatSkiaPresentationReclaim();
  void trimNativeBitmapCachesAsync();

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[MEM] runPlanetHubCombatSafeReclaimPass reason=${reason}`);
  }
}
