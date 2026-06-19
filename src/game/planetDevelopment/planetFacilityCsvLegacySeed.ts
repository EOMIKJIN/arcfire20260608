// ============================================================
// planets.csv 시설 플래그 → zone 카탈로그 동기화만 (dev 모듈 자동 설치 금지)
// ============================================================

import { getPlanetRecord } from '../../world/planetTradePortDb';

function planetCoreStoreState() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require('../../store/planetCoreRuntimeStore') as typeof import('../../store/planetCoreRuntimeStore');
  return mod.usePlanetCoreRuntimeStore.getState();
}

/** hasTradePort 행성 — zone 무역 카탈로그만 동기화(dev 자동 설치 없음) */
export function syncCsvTradePortCatalogForPlanet(planetId: string): boolean {
  if (!planetId) return false;
  const planet = getPlanetRecord(planetId);
  if (!planet?.hasTradePort) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { syncTradePortCatalogForPlanet } = require('../../arcCore/balance/tradePortCatalogPolicy') as typeof import('../../arcCore/balance/tradePortCatalogPolicy');
    syncTradePortCatalogForPlanet(planetId);
    return true;
  } catch {
    return false;
  }
}

/** planets.csv 무역소 — zone 카탈로그 동기화 (행성개발 Lv와 분리) */
export function seedCsvLegacyPlanetDevModulesForPlanet(planetId: string): boolean {
  return syncCsvTradePortCatalogForPlanet(planetId);
}

export function seedCsvLegacyPlanetDevModulesAll(): void {
  const store = planetCoreStoreState();
  for (const planetId of Object.keys(store.byPlanetId)) {
    seedCsvLegacyPlanetDevModulesForPlanet(planetId);
  }
}
