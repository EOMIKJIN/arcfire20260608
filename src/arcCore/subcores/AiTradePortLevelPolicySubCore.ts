import { BaseArcSubCore } from './BaseArcSubCore';
import { syncTradePortCatalogFromBalance } from '../balance/tradePortCatalogPolicy';

/**
 * 무역소 진열 정책 — `01_레벨업구조` · planet_leveling_progression 단일 채널.
 * 주기 동기는 `AiEconomySubCore.runPlayScenarioEconomyPass`에 위임.
 */
export class AiTradePortLevelPolicySubCore extends BaseArcSubCore {
  constructor() {
    super('trade_port_level_policy_subcore', '무역소 진열 정책');
  }

  override onBoot(): void {
    syncTradePortCatalogFromBalance(true);
  }
}
