/**
 * 구현체(`PlanetEdenRaidTestLayer`)를 스테이지 중립 이름으로 재노출한다.
 * 신규 코드는 이 파일 경유 import를 권장한다.
 */

export {
  CAPITAL_REALTIME_TRANSIT_COMBAT_PLANET_ID,
  hasCapitalRealtimeCombatSlotsForPlanet,
  isCapitalRealtimeCombatOrbitPlanet,
} from './capitalRealtimeCombatGate';

export {
  NEW_EDEN_RAID_TEST_PLANET_ID as CAPITAL_REALTIME_COMBAT_ORBIT_TEST_PLANET_ID,
  DRACO_SEAMLESS_PVP_TEST_PLANET_ID,
  DRACO_SEAMLESS_PVP_TEST_SYSTEM_ID,
  usePlanetEdenRaidSim as useCapitalRealtimeCombatSim,
  PlanetEdenRaidSimBinder as CapitalRealtimeCombatSimBinder,
  PlanetEdenRaidSimContext as CapitalRealtimeCombatSimContext,
  usePlanetEdenRaidSimContext as useCapitalRealtimeCombatSimContext,
  PlanetEdenRaidOrbitSvg as CapitalRealtimeCombatOrbitSkia,
  /** @deprecated Skia 단일 렌더 — `CapitalRealtimeCombatOrbitSkia` 사용 */
  PlanetEdenRaidOrbitSvg as CapitalRealtimeCombatOrbitSvg,
  PlanetEdenRaidCombatHudOverlay as CapitalRealtimeCombatHudOverlay,
  type PlanetEdenRaidSim,
} from '../components/planet/PlanetEdenRaidTestLayer';
