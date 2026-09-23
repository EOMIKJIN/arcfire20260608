import { create } from 'zustand';

/** 런타임 원반 1장만 유지 — data URI 다중 캐시 금지. */
type PlanetGlobeRuntimeSourceState = {
  activePlanetId: string | null;
  dataUri: string | null;
  setRuntimeUri: (planetId: string, dataUri: string) => void;
  clearIfPlanet: (planetId: string) => void;
  clearAll: () => void;
};

export const usePlanetGlobeRuntimeSourceStore = create<PlanetGlobeRuntimeSourceState>((set, get) => ({
  activePlanetId: null,
  dataUri: null,

  setRuntimeUri: (planetId, dataUri) => {
    if (!planetId || !dataUri) return;
    const cur = get();
    if (cur.activePlanetId === planetId && cur.dataUri === dataUri) return;
    set({ activePlanetId: planetId, dataUri });
  },

  clearIfPlanet: (planetId) => {
    const cur = get();
    if (cur.activePlanetId !== planetId) return;
    set({ activePlanetId: null, dataUri: null });
  },

  clearAll: () => {
    const cur = get();
    if (cur.activePlanetId == null && cur.dataUri == null) return;
    set({ activePlanetId: null, dataUri: null });
  },
}));
