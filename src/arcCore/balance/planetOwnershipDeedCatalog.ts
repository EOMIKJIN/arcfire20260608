// ============================================================
// 행성 소유권 증서 — 무역소 진열 단일 eligibility 계약
// CSV 21행성 + B→A synth — colonization CSV·코어개방 풀 기준 (정적 GALAXY hasTradePort=false 잔재 무시)
// ============================================================

import { isPlanetCsvTradePortWorldEnabled } from '../../game/planetDevelopment/planetCsvWorldFlags';

/** 무역소 구매 탭에 `ownership_{planetId}` 를 넣을 수 있는 행성 */
export function isPlanetOwnershipDeedCatalogEligible(planetId: string): boolean {
  const id = planetId.trim();
  if (!id) return false;
  return isPlanetCsvTradePortWorldEnabled(id);
}

export function resolvePlanetOwnershipDeedItemId(planetId: string): string {
  return `ownership_${planetId.trim()}`;
}
