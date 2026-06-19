// ============================================================
// 무역소 행성개발 — planets.csv 무역소 보유 행성 식별
// v2.1: parity Lv(진열 확대) 폐기 — Lv1=zone 100%, 개발↑ 진열↓
// ============================================================

import { getPlanetRecord } from '../../world/planetTradePortDb';

/** planets.csv 무역소 보유 행성(17/21) */
export function isPlanetCsvTradePortPlanet(planetId: string): boolean {
  return Boolean(getPlanetRecord(planetId)?.hasTradePort);
}
