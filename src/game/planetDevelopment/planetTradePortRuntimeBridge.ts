// ============================================================
// 무역소(dev_trade_port) 레벨 → trade.tsx 런타임 연동
// v2.2: 수수료율만 개발 Lv 연동 · 진열 SKU는 zone+고급무기 가중(카탈로그 빌드 시)
// ============================================================

import { computePlanetTradeFeeBreakdown, resolvePlanetUpkeepPolicy } from '../../arcCore/economy/planetUpkeepPolicy';
import type { PlanetTradeFeeBreakdown } from '../../arcCore/economy/planetUpkeepPolicy';
import {
  resolveTradePortFeeRatePct,
} from '../../arcCore/balance/facilityTradePortLevelPolicy';
import { isPlanetCsvTradePortWorldEnabled } from './planetCsvWorldFlags';
import { isPlanetTradePortInstalled, readPlanetTradePortDetail } from './planetTradePortListing';

export function resolvePlanetTradePortDevLevel(planetId: string): number | null {
  if (isPlanetTradePortInstalled(planetId)) {
    return readPlanetTradePortDetail(planetId).level;
  }
  if (isPlanetCsvTradePortWorldEnabled(planetId)) return 1;
  return null;
}

/** dev_trade_port 설치 시 Lv별 수수료율 적용 */
export function computeTradeFeeForPlanetGross(
  planetId: string | null | undefined,
  grossCredits: number,
): PlanetTradeFeeBreakdown {
  if (!planetId) return computePlanetTradeFeeBreakdown(grossCredits);
  const level = resolvePlanetTradePortDevLevel(planetId);
  if (level == null) return computePlanetTradeFeeBreakdown(grossCredits);
  const base = resolvePlanetUpkeepPolicy();
  return computePlanetTradeFeeBreakdown(grossCredits, {
    ...base,
    tradeFeeRatePct: resolveTradePortFeeRatePct(level),
  });
}
