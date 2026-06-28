// ============================================================
// 행성 허브 시설 — planets.csv 월드 레이어 vs 행성개발(dev) 레이어
//
// 월드(CSV): hasTradePort 등 — 서브메뉴·zone 카탈로그·기존 밸런스 정본
// 개발(dev): Lv1 설치·업그레이드 — 수수료·고급무기 가중 등 추가 메리트만
// ============================================================

import { isPlanetDefenseSatelliteInstalled } from '../../systems/planetaryDefense/planetDefenseSatelliteLevel';
import { isPlanetOrbitShipyardInstalled } from './planetOrbitShipyardListing';
import { isPlanetTradePortInstalled } from './planetTradePortListing';
import { isPlanetResearchLabInstalled } from './planetResearchLabListing';
import { isPlanetPopulationDomeInstalled } from './planetPopulationDomeListing';
import { hasActiveQuestBuyPlacementAtPlanet } from '../../missions/questItemOpsRegistry';
import { useMissionStore } from '../../store/missionStore';
import {
  isPlanetCsvShipyardWorldEnabled,
  isPlanetCsvTavernWorldEnabled,
  isPlanetCsvTradePortWorldEnabled,
} from './planetCsvWorldFlags';

function planetHasCsvTradePort(planetId: string): boolean {
  return isPlanetCsvTradePortWorldEnabled(planetId);
}

function planetHasCsvShipyard(planetId: string): boolean {
  return isPlanetCsvShipyardWorldEnabled(planetId);
}

function planetHasCsvTavern(planetId: string): boolean {
  return isPlanetCsvTavernWorldEnabled(planetId);
}

/** 허브 ⚓ 조선소 SUB-STAGE — CSV 조선소 보유 또는 dev 설치 */
export function isPlanetHubShipyardEnabled(planetId: string): boolean {
  return planetHasCsvShipyard(planetId) || isPlanetOrbitShipyardInstalled(planetId);
}

/** 허브 🏪 무역소 SUB-STAGE — CSV·dev 무역소 또는 활성 퀘스트 구매 배치 */
export function isPlanetHubTradePortEnabled(planetId: string): boolean {
  if (planetHasCsvTradePort(planetId) || isPlanetTradePortInstalled(planetId)) return true;
  return hasActiveQuestBuyPlacementAtPlanet(
    planetId,
    useMissionStore.getState().progresses,
  );
}

/** 허브 ⚗ 연구소(skilltree) — dev 연구소 설치만 (CSV 플래그 없음) */
export function isPlanetHubResearchLabEnabled(planetId: string): boolean {
  return isPlanetResearchLabInstalled(planetId);
}

/** 허브 🍺 선술집 — CSV 선술집 또는 dev 인구 돔 */
export function isPlanetHubTavernEnabled(planetId: string): boolean {
  return planetHasCsvTavern(planetId) || isPlanetPopulationDomeInstalled(planetId);
}

/** 방위위성 — dev 설치만 */
export function isPlanetHubDefenseSatelliteActive(planetId: string): boolean {
  return isPlanetDefenseSatelliteInstalled(planetId);
}

/** zone 카탈로그(무기·전함 등) — CSV 무역소 보유 행성 */
export { isPlanetCsvTradePortWorldEnabled } from './planetCsvWorldFlags';

/** zone 카탈로그 전함 — CSV 조선소 보유 행성( dev 미설치 시 zone 티어 정본) */
export { isPlanetCsvShipyardWorldEnabled } from './planetCsvWorldFlags';
