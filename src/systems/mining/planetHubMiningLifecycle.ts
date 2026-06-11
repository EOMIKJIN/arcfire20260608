// ============================================================
// 행성 허브 채굴 프레젠테이션 정리 — 메인스테이지 이탈·재진입 단일 정책
//
// 정책:
//   - 은하계 지도·시설·route_blur 등 허브를 떠나면 채굴 세션·재개 스냅샷·게이지 기준 시각을 초기화한다.
//   - 같은 행성으로 돌아와도 자동 재개하지 않는다(부분 사이클·게이지 잔상 방지).
//   - 이미 인벤에 반영된 광물·무역소 입고 실적은 playerStore persist 로만 유지한다.
// ============================================================

import { clearMiningResumeSnapshot } from './miningResumeStore';
import { flushMiningPlayerPersist } from './miningPlayerPersist';
import { stopMiningSession } from './service';
import type { MiningSessionState } from './types';

export type PlanetHubMiningTeardownReason =
  | 'hub_navigation'
  | 'route_blur'
  | 'planet_change'
  | 'manual_stop';

/** 채굴 tick·재개 스냅샷·게이지 UI 기준을 한 번에 초기화한다. */
export function teardownPlanetHubMiningPresentation(
  _reason: PlanetHubMiningTeardownReason,
  nowMs: number = Date.now(),
): { session: MiningSessionState; uiNowMs: number } {
  clearMiningResumeSnapshot();
  flushMiningPlayerPersist();
  return {
    session: stopMiningSession(),
    uiNowMs: nowMs,
  };
}
