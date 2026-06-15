// ============================================================
// 행성 허브 GPU/Skia 레이어 수명 — planetSessionRegistry 보조 축
// ============================================================

export type PlanetGpuTier = 'T0' | 'T1' | 'T2' | 'T3';

type GpuLayerEntry = {
  id: string;
  tier: PlanetGpuTier;
  mountedAt: number;
};

const layers = new Map<string, GpuLayerEntry>();

export function registerGpuLayer(id: string, tier: PlanetGpuTier): void {
  layers.set(id, { id, tier, mountedAt: Date.now() });
}

export function unregisterGpuLayer(id: string): void {
  layers.delete(id);
}

export function hasRegisteredGpuLayer(id: string): boolean {
  return layers.has(id);
}

export function listRegisteredGpuLayerIds(): string[] {
  return [...layers.keys()];
}

export function releaseAllPlanetGpuLayers(_reason: 'route_blur' | 'planet_change'): void {
  layers.clear();
}

export function debugPlanetGpuLayerSnapshot(): { id: string; tier: PlanetGpuTier }[] {
  return [...layers.values()].map(({ id, tier }) => ({ id, tier }));
}

export function debugCountPlanetGpuLayers(): number {
  return layers.size;
}
