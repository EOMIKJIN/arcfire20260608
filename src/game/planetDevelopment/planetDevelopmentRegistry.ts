import type { ComponentType } from 'react';
import { PLANET_DEV_MODULE_DEFENSE_SATELLITE } from './planetDefenseSatelliteRuntime';
import { getPlanetDevelopmentCatalogRow, listPlanetDevelopmentCatalogRows } from './planetDevelopmentCatalog';

export type PlanetDevelopmentModuleContext = {
  planetId: string;
  planetName: string;
  isHomePlanet: boolean;
  onBack: () => void;
  onClose: () => void;
};

export type PlanetDevelopmentModuleRegistration = {
  id: string;
  labelKo: string;
  summaryKo: string;
  enabled: boolean;
  /** null — list 행만, 상세는 별도 라우팅 */
  DetailView?: ComponentType<PlanetDevelopmentModuleContext>;
};

const moduleRegistry = new Map<string, PlanetDevelopmentModuleRegistration>();

export function registerPlanetDevelopmentModule(reg: PlanetDevelopmentModuleRegistration): void {
  moduleRegistry.set(reg.id, reg);
}

export function getPlanetDevelopmentModule(id: string): PlanetDevelopmentModuleRegistration | null {
  return moduleRegistry.get(id) ?? null;
}

/** CSV catalog + 등록된 DetailView 병합 */
export function listPlanetDevelopmentModulesForUi(): PlanetDevelopmentModuleRegistration[] {
  return listPlanetDevelopmentCatalogRows().map((row) => {
    const reg = moduleRegistry.get(row.detailModuleKey);
    return {
      id: row.id,
      labelKo: row.labelKo,
      summaryKo: row.summaryKo,
      enabled: row.enabled,
      DetailView: reg?.DetailView,
    };
  });
}

export function resolvePlanetDevelopmentModuleIdFromCatalogKey(catalogId: string): string {
  const row = getPlanetDevelopmentCatalogRow(catalogId);
  return row?.detailModuleKey ?? catalogId;
}

export { PLANET_DEV_MODULE_DEFENSE_SATELLITE };
