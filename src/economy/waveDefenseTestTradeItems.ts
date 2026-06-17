// ============================================================
// 웨이브 디펜스 테스트 아이템 — 상점 거래가 강제 1 (테스트 단계 한정)
// ------------------------------------------------------------
// 무역소 런타임 가격은 CSV purchasePrice/infoLineSuffix가 아니라
//  - 무기: resolveIntegratedWeaponTradePrice (min 800 클램프)
//  - 전함: resolveCapitalShipPerformanceBasePrice (hull tier × 성능)
// 로 계산되므로, 테스트 3종을 "거래가 1"로 노출하려면 이 화이트리스트로
// 가격 경로에서만 1을 강제한다. 운영 아이템 가격에는 영향이 없다.
// 정본 동기: tools/content-tables/weapon-trade-listing-rules.mjs(WAVE_TEST_TRADE_ALLOWLIST)
// ============================================================

/** 웨이브 디펜스 테스트 무기 id(weapon_list.csv id) */
export const WAVE_TEST_TRADE_WEAPON_IDS: ReadonlySet<string> = new Set([
  'w_laser_wave',
  'w_missile_wave',
]);

/** 웨이브 디펜스 테스트 전함 id(npc_ai_ships.csv id) */
export const WAVE_TEST_TRADE_SHIP_IDS: ReadonlySet<string> = new Set(['player_wave_ship']);

export function isWaveTestTradeWeaponId(weaponId: string | null | undefined): boolean {
  return WAVE_TEST_TRADE_WEAPON_IDS.has(String(weaponId ?? '').trim());
}

export function isWaveTestTradeShipId(npcShipId: string | null | undefined): boolean {
  return WAVE_TEST_TRADE_SHIP_IDS.has(String(npcShipId ?? '').trim());
}

/** 테스트 단계 강제 거래가(크레딧) */
export const WAVE_TEST_TRADE_PRICE_CREDITS = 1;
