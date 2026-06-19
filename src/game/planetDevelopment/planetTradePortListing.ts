import { readFacilityModuleDetail, isFacilityModuleInstalled } from './planetFacilityModuleRuntime';
import type { PlanetFacilityModuleDetail } from '../../store/planetCoreMetricTypes';

export const PLANET_DEV_MODULE_TRADE_PORT = 'dev_trade_port';

export function readPlanetTradePortDetail(planetId: string): PlanetFacilityModuleDetail {
  return readFacilityModuleDetail(planetId, PLANET_DEV_MODULE_TRADE_PORT);
}

export function isPlanetTradePortInstalled(planetId: string): boolean {
  return isFacilityModuleInstalled(planetId, PLANET_DEV_MODULE_TRADE_PORT);
}
