import { runCombatSkiaPresentationReclaim } from '../../combat/combatSkiaPresentationReclaim';

/**
 * 전투 orbit(웨이브 디펜스 combat phase 포함) 활성 "중"에만 도는 안전 reclaim.
 * 5분 soft·15분 deep 주기 reclaim은 mid-frame Skia/worklet 레이스 회피를 위해 전투 중
 * 전면 skip되는데, 그 사이 module Path/Paint/maskfilter 캐시(색상·틴트·붓·PictureRecorder 등)가
 * 인카운터가 길어질수록 계속 상주할 수 있다. 이 함수는 그 캐시들만 lazy 재생성 가능한
 * getter 패턴으로 dispose하므로(다음 draw 호출 시 자동 재생성) mid-frame에도 안전하다.
 * dodge overlay 해제(signalHubSkiaNativeReclaim)·Fresco trim·RN 백드롭 remount는 전투 중
 * 시각적 끊김·race 위험이 있어 여기서 호출하지 않는다.
 */
export function runPlanetHubCombatSafeReclaimPass(reason: string): void {
  runCombatSkiaPresentationReclaim();

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    // eslint-disable-next-line no-console
    console.log(`[MEM] runPlanetHubCombatSafeReclaimPass reason=${reason}`);
  }
}
