import { useWorldStore } from '../store/worldStore';

/** 행성 id → 소속 성계 id (월드 스토어 O(1) 스캔) */
export function resolveSystemIdForPlanetId(planetId: string): string | null {
  const id = planetId.trim();
  if (!id) return null;
  const systems = useWorldStore.getState().systems;
  for (const sys of Object.values(systems)) {
    if (sys.planets.some((p) => p.id === id)) return sys.id;
  }
  return null;
}
