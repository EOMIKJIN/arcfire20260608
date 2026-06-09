// ============================================================
// 교역품 시장 — 전 무역소 행성 tg_* 수요·공급 재동기
// ============================================================

import { TradeRouteTransportPolicy_FROM_BALANCE_CSV } from '../../data/balance/generated';
import { listPlanetIdsWithTradePort } from '../../world/planetTradePortDb';
import { rebuildAllPlanetTradeMarkets } from '../../world/planetTradeMarketStore';

let appliedTransportPolicyVersion = -1;

function readTransportPolicyVersion(): number {
  const raw = TradeRouteTransportPolicy_FROM_BALANCE_CSV.find((r) => r.key === 'policy_version')?.value;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 1;
}

/** 아크코어 — 행성별 교역품 시장(재고·가격·수요) 갱신 */
export function runTradeRouteMarketPass(force = false): void {
  const planetIds = listPlanetIdsWithTradePort();
  const policyVersion = readTransportPolicyVersion();
  const forceForPolicy = policyVersion > appliedTransportPolicyVersion;
  rebuildAllPlanetTradeMarkets(planetIds, force || forceForPolicy);
  if (forceForPolicy) appliedTransportPolicyVersion = policyVersion;
}
