/**
 * 은하계 지도(STAGE 2) 세션 — 정상/비정상 종료 시 직전 메인 허브 복귀.
 * moveToSystem은 currentPlanetId를 null로 두므로, 이탈·재시작 전에 lastHubPlanetId로 복원한다.
 */

import type { Player } from '../types';
import { usePlayerStore } from '../store/playerStore';
import { resolveSystemIdForPlanetId } from '../world/resolvePlanetSystemId';
import { releaseGalaxyMapStageMemory } from './stageMemoryRelease';

export const DEFAULT_RESUME_HUB_PLANET_ID = 'arcadia_prime';

export function resolveResumeHubPlanetId(player: Player): string {
  return (
    player.lastHubPlanetId
    ?? player.currentPlanetId
    ?? player.homePlanetId
    ?? DEFAULT_RESUME_HUB_PLANET_ID
  );
}

/** 행성 허브 출발(은하계 지도 진입) 직전 — 직전 메인스테이지 앵커 기록 */
export function recordHubDeparturePlanet(planetId: string | null | undefined): void {
  const id = planetId?.trim();
  if (!id) return;
  const player = usePlayerStore.getState().player;
  if (!player || player.lastHubPlanetId === id) return;
  usePlayerStore.setState({
    player: { ...player, lastHubPlanetId: id },
  });
}

/**
 * currentPlanetId가 비어 있거나 성계가 어긋난 은하맵 중간 상태 → lastHubPlanetId 허브로 복원.
 * @returns 복원 적용 여부
 */
export function resumePlayerToLastHubPlanet(options?: { persist?: boolean }): boolean {
  const player = usePlayerStore.getState().player;
  if (!player) return false;

  const hubPlanetId = resolveResumeHubPlanetId(player);
  const systemId = resolveSystemIdForPlanetId(hubPlanetId);
  if (!systemId) return false;

  const needsFix =
    player.currentPlanetId !== hubPlanetId
    || player.currentSystemId !== systemId
    || !player.currentPlanetId;

  if (!needsFix) return true;

  usePlayerStore.setState({
    player: {
      ...player,
      currentPlanetId: hubPlanetId,
      currentSystemId: systemId,
      lastHubPlanetId: hubPlanetId,
    },
  });

  if (options?.persist) {
    void usePlayerStore.getState().persist();
  }
  return true;
}

/**
 * 앱 백그라운드/비활성(알림창·홈 직전 등) — 허브 좌표만 영속.
 * STAGE 2 route_blur(프레젠테이션·제스처 tear-down)는 호출하지 않는다.
 * (2026-08-02: background에서 full release → mapInteractionReady=false 고착 → 착륙 불가 회귀)
 */
export function persistGalaxyMapSessionOnBackground(options?: { persist?: boolean }): void {
  resumePlayerToLastHubPlanet({ persist: options?.persist ?? true });
}

/** 은하계 지도 이탈·게임 종료·언마운트 — STAGE 2 정리 + 허브 좌표 복원 */
export function finalizeGalaxyMapSessionForExit(options?: { persist?: boolean }): void {
  releaseGalaxyMapStageMemory();
  resumePlayerToLastHubPlanet({ persist: options?.persist ?? true });
}
