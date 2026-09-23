// ============================================================
// 코어 행성 정보창 초상 — planets.csv / STAR_SYSTEMS 정본 키
// GALAXY_SYSTEMS_PRECOMPUTED 는 재생성 전까지 구키(null)를 가질 수 있다.
// ============================================================

import { STAR_SYSTEMS } from './systems';

let csvPortraitKeyByPlanetId: Map<string, string> | null = null;

function buildCsvPlanetInfoPortraitKeyIndex(): Map<string, string> {
  const map = new Map<string, string>();
  for (const system of Object.values(STAR_SYSTEMS)) {
    const planets = system.planets;
    for (let i = 0; i < planets.length; i += 1) {
      const planet = planets[i];
      const key = String(planet.infoPanelPortraitAssetKey ?? '').trim();
      if (key) map.set(planet.id, key);
    }
  }
  return map;
}

/** 모듈 1회 — 코어 21행 규모. 틱/렌더에서 재빌드 금지. */
export function getCsvPlanetInfoPortraitKeyIndex(): ReadonlyMap<string, string> {
  if (!csvPortraitKeyByPlanetId) {
    csvPortraitKeyByPlanetId = buildCsvPlanetInfoPortraitKeyIndex();
  }
  return csvPortraitKeyByPlanetId;
}

export function resolveCsvPlanetInfoPortraitAssetKey(planetId: string): string | null {
  const id = planetId.trim();
  if (!id) return null;
  return getCsvPlanetInfoPortraitKeyIndex().get(id) ?? null;
}
