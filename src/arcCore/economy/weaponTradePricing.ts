// ============================================================
// 아크코어 무역소 무기 가격 — 단일 진입점(전 행성 공통)
//
// 정본 테이블:
// - tables/balance/weapon_trade_base_price_policy.csv (상·하한·구간 계수)
// - tables/balance/weapon_combat_reference_policy.csv (D&D3 TTK 참조)
// - tables/balance/weapon_family_ttk_balance_policy.csv (패밀리 TTK)
// - tables/balance/weapon_special_combat_balance_policy.csv (노바 등 특수)
// - tables/content/weapon_list.csv (스탯·구매가 하한)
//
// 런타임:
// - 진열: syncTradePortCatalogFromBalance → AiEconomySubCore
// - 구매가: resolveIntegratedWeaponTradePrice → TradeEngine.generateMarketByItemIds
// - 일 1회: runMarketMicroAdjustPass → weapon 카테고리 demandMul
// ============================================================

export {
  resolveIntegratedWeaponTradePrice,
  weaponPerformanceScore,
} from '../../economy/integratedWeaponTradePricing';
