// ============================================================
// planets.csv 월드 시설 플래그 — listing·gates 공용 (순환 import 방지)
// 미개척(synth) 행성은 21 CSV와 달리 월드 레이어 없음 → dev 설치만
// ============================================================

import { getPlanetRecord } from '../../world/planetTradePortDb';
import { isSynthFrontierPlanetId } from '../../world/isSynthFrontierPlanetId';

function isCsvWorldFacilityPlanet(planetId: string): boolean {
  if (isSynthFrontierPlanetId(planetId)) return false;
  return Boolean(getPlanetRecord(planetId));
}

/** zone 카탈로그(무기·전함 등) — CSV 무역소 보유 행성(21행성 정본) */
export function isPlanetCsvTradePortWorldEnabled(planetId: string): boolean {
  if (!isCsvWorldFacilityPlanet(planetId)) return false;
  return Boolean(getPlanetRecord(planetId)?.hasTradePort);
}

/** zone 카탈로그 전함 — CSV 조선소 보유 행성 */
export function isPlanetCsvShipyardWorldEnabled(planetId: string): boolean {
  if (!isCsvWorldFacilityPlanet(planetId)) return false;
  return Boolean(getPlanetRecord(planetId)?.hasShipyard);
}

/** CSV 선술집 보유 행성 */
export function isPlanetCsvTavernWorldEnabled(planetId: string): boolean {
  if (!isCsvWorldFacilityPlanet(planetId)) return false;
  return Boolean(getPlanetRecord(planetId)?.hasTavern);
}
