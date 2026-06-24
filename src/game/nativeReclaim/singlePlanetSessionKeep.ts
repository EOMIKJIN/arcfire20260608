import { usePlayerStore } from '../../store/playerStore';

/**
 * Tier B(프레젠테이션·nebula·memo) — RAM에 상주할 행성 id 최소 집합.
 * ArcCore planetCoreRuntime(전 행성)과 분리; nebula/memo reclaim keep 전용.
 */
export function resolveSinglePlanetSessionKeepIds(activePlanetId?: string | null): string[] {
  const id = activePlanetId?.trim();
  return id ? [id] : [];
}

/** worldmap transit — currentPlanetId 가 null 일 때 앵커 */
export function resolveActivePlanetSessionAnchorId(): string | null {
  const p = usePlayerStore.getState().player;
  if (!p) return null;
  return p.currentPlanetId ?? p.lastHubPlanetId ?? p.homePlanetId ?? null;
}
