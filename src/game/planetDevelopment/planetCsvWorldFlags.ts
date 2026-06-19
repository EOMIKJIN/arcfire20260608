// ============================================================
// planets.csv 월드 시설 플래그 — listing·gates 공용 (순환 import 방지)
// ============================================================

import { getPlanetRecord } from '../../world/planetTradePortDb';

/** zone 카탈로그(무기·전함 등) — CSV 무역소 보유 행성 */
export function isPlanetCsvTradePortWorldEnabled(planetId: string): boolean {
  return Boolean(getPlanetRecord(planetId)?.hasTradePort);
}

/** zone 카탈로그 전함 — CSV 조선소 보유 행성 */
export function isPlanetCsvShipyardWorldEnabled(planetId: string): boolean {
  return Boolean(getPlanetRecord(planetId)?.hasShipyard);
}

/** CSV 선술집 보유 행성 */
export function isPlanetCsvTavernWorldEnabled(planetId: string): boolean {
  return Boolean(getPlanetRecord(planetId)?.hasTavern);
}
