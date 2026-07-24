import { BaseArcSubCore } from './BaseArcSubCore';
/**
 * @deprecated 판테온 12좌 재편(2026-07-24) — Economy(플루토스)로 흡수, `registerDefaultArcSubCores`
 * 미등록. 완전 셸(빈 onBoot·틱/명령 없음)이라 삭제해도 무해하지만, 감사 스크립트
 * (`tools/memory-audit/run-resident-set-audit.cjs`)가 이 파일 경로를 직접 참조하므로 파일은 보존.
 * 무역소 진열 정책 — `01_레벨업구조` · planet_leveling_progression 단일 채널.
 * 주기 동기는 `AiEconomySubCore.runPlayScenarioEconomyPass`에 위임.
 */
export class AiTradePortLevelPolicySubCore extends BaseArcSubCore {
  constructor() {
    super('trade_port_level_policy_subcore', '무역소 진열 정책');
  }

  override onBoot(): void {
    // 카탈로그 동기는 ArcMemoryGovernor.warmPlanetHubResidentSet / warmGalaxyDeparturePreflight ·
    // 일일 배치 runPlayScenarioEconomyPass(true) 로만 수행 (부트 전행성 sync 금지).
  }
}
