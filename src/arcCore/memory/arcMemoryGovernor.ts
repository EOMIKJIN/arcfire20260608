/**
 * ArcMemoryGovernor — Resident Set lazy warm · STAGE preflight 단일 진입점.
 * reclaim 모듈 추가 대신 **상주 데이터 tier** 를 통제한다.
 */

import { buildCsvStaticIndexesFull } from '../../game/buildCsvStaticIndexes';
import { emitMemProfileMarker } from '../../game/devMemoryProfileBridge';
import { forceResyncPlanetTradePortCatalog } from '../balance/tradePortCatalogPolicy';
import { runTradeRouteMarketPass } from '../economy/runTradeRouteMarketPass';
import { isPlanetCsvTradePortWorldEnabled } from '../../game/planetDevelopment/planetCsvWorldFlags';
import {
  getResidentSetTier,
  isPlanetCatalogWarmed,
  setResidentSetTier,
} from './residentSetRegistry';

let galaxyPreflightDone = false;

function planetHasTradePort(planetId: string): boolean {
  try {
    return isPlanetCsvTradePortWorldEnabled(planetId);
  } catch {
    return false;
  }
}

/** Stage 1 — 현재 행성 허브 진입·착륙 시 (카탈로그·full CSV tier) */
export function warmPlanetHubResidentSet(planetId: string | null | undefined): void {
  if (!planetId?.trim()) return;
  const pid = planetId.trim();
  setResidentSetTier('T1_planet_hub');
  buildCsvStaticIndexesFull();
  if (planetHasTradePort(pid) && !isPlanetCatalogWarmed(pid)) {
    forceResyncPlanetTradePortCatalog(pid);
  }
  emitMemProfileMarker({ stage: 'planet_hub', event: 'route_focus', detail: pid });
}

/** Stage 2 preflight — 출발 직전 (현재 행성 카탈로그 + 교역 route 1회) */
export function warmGalaxyDeparturePreflight(planetId: string | null | undefined): void {
  setResidentSetTier('T3_galaxy_preflight');
  if (planetId?.trim()) {
    const pid = planetId.trim();
    if (planetHasTradePort(pid) && !isPlanetCatalogWarmed(pid)) {
      forceResyncPlanetTradePortCatalog(pid);
    }
  }
  if (!galaxyPreflightDone) {
    runTradeRouteMarketPass(false);
    galaxyPreflightDone = true;
  }
  emitMemProfileMarker({
    stage: 'galaxy_map',
    event: 'manual',
    detail: `departure_preflight_${planetId ?? 'none'}`,
  });
}

export function markGalaxyMapResidentActive(): void {
  setResidentSetTier('T4_galaxy_map');
}

export function markBootMinimalResident(): void {
  setResidentSetTier('T0_boot_minimal');
}

export function readArcMemoryGovernorSnapshot(): {
  tier: ReturnType<typeof getResidentSetTier>;
  galaxyPreflightDone: boolean;
} {
  return { tier: getResidentSetTier(), galaxyPreflightDone };
}

/** 테스트 */
export function resetArcMemoryGovernorForTests(): void {
  galaxyPreflightDone = false;
}
