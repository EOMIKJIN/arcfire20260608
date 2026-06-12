import { usePlayerStore } from '../../store/playerStore';

/**
 * 장거리 미사일 목표 행성 — 플레이어가 **체류(착륙) 중인 행성**만.
 * 성계 이동·은하맵(`currentPlanetId === null`)이면 스케줄 슬롯을 소비하지 않는다.
 */
export function resolveArcCoreMessageTargetPlanetId(): string | null {
  const planetId = usePlayerStore.getState().player?.currentPlanetId ?? null;
  if (!planetId || typeof planetId !== 'string') return null;
  const trimmed = planetId.trim();
  return trimmed.length > 0 ? trimmed : null;
}
