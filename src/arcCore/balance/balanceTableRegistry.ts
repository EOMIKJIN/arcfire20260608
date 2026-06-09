// ============================================================
// tables/balance CSV — 런타임 조회 정본(모듈 레벨 1회 인덱스)
// ============================================================

import {
  CapitalHullPurchasePolicy_FROM_BALANCE_CSV,
  CapitalShipTradePricePolicy_FROM_BALANCE_CSV,
  HostileEnemyWeaponLoadoutPolicy_FROM_BALANCE_CSV,
  PlanetHostileRedProgression_FROM_BALANCE_CSV,
  PlanetOccupationSeeds_FROM_BALANCE_CSV,
  PlayScenarioEconomy_FROM_BALANCE_CSV,
  PlayScenarioZonePlanets_FROM_BALANCE_CSV,
  SynthSystemColonization_FROM_BALANCE_CSV,
  TradeRouteDailyMarketPolicy_FROM_BALANCE_CSV,
  TradeRouteDistributionPolicy_FROM_BALANCE_CSV,
  TradeRouteEconomyPolicy_FROM_BALANCE_CSV,
  EconomyPriceMicroPolicy_FROM_BALANCE_CSV,
  WeaponTradeBasePricePolicy_FROM_BALANCE_CSV,
  WorldExpansionTimingPolicy_FROM_BALANCE_CSV,
} from '../../data/balance/generated';

function parseNum(raw: string | number | undefined, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function parseBool(raw: string | undefined): boolean {
  return String(raw ?? '').trim().toLowerCase() === 'true';
}

let hostileByPlanetId: Map<string, (typeof PlanetHostileRedProgression_FROM_BALANCE_CSV)[number]> | null =
  null;
let synthBySystemId: Map<string, (typeof SynthSystemColonization_FROM_BALANCE_CSV)[number]> | null =
  null;
let occupationByPlanetId: Map<string, (typeof PlanetOccupationSeeds_FROM_BALANCE_CSV)[number]> | null =
  null;
let hullByTierKey: Map<string, (typeof CapitalHullPurchasePolicy_FROM_BALANCE_CSV)[number]> | null =
  null;
let weaponTradePolicyKv: Map<string, string> | null = null;
let tradeRouteEconomyPolicyKv: Map<string, string> | null = null;
let tradeRouteDistributionPolicyKv: Map<string, string> | null = null;
let tradeRouteDailyMarketPolicyKv: Map<string, string> | null = null;
let capitalShipTradePricePolicyKv: Map<string, string> | null = null;
let hostileLoadoutPolicyKv: Map<string, string> | null = null;

function getHostileByPlanetId(): Map<string, (typeof PlanetHostileRedProgression_FROM_BALANCE_CSV)[number]> {
  if (!hostileByPlanetId) {
    hostileByPlanetId = new Map(
      PlanetHostileRedProgression_FROM_BALANCE_CSV.map((row) => [row.planetId, row] as const),
    );
  }
  return hostileByPlanetId;
}

function getSynthBySystemId(): Map<string, (typeof SynthSystemColonization_FROM_BALANCE_CSV)[number]> {
  if (!synthBySystemId) {
    synthBySystemId = new Map(
      SynthSystemColonization_FROM_BALANCE_CSV.map((row) => [row.synthSystemId, row] as const),
    );
  }
  return synthBySystemId;
}

function getOccupationByPlanetId(): Map<string, (typeof PlanetOccupationSeeds_FROM_BALANCE_CSV)[number]> {
  if (!occupationByPlanetId) {
    occupationByPlanetId = new Map(
      PlanetOccupationSeeds_FROM_BALANCE_CSV.map((row) => [row.planetId, row] as const),
    );
  }
  return occupationByPlanetId;
}

function getHullByTierKey(): Map<string, (typeof CapitalHullPurchasePolicy_FROM_BALANCE_CSV)[number]> {
  if (!hullByTierKey) {
    hullByTierKey = new Map(
      CapitalHullPurchasePolicy_FROM_BALANCE_CSV.map((row) => [row.hullTierKey, row] as const),
    );
  }
  return hullByTierKey;
}

function getWeaponTradePolicyKv(): Map<string, string> {
  if (!weaponTradePolicyKv) {
    weaponTradePolicyKv = new Map(
      WeaponTradeBasePricePolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return weaponTradePolicyKv;
}

function getTradeRouteEconomyPolicyKv(): Map<string, string> {
  if (!tradeRouteEconomyPolicyKv) {
    tradeRouteEconomyPolicyKv = new Map(
      TradeRouteEconomyPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return tradeRouteEconomyPolicyKv;
}

function getTradeRouteDistributionPolicyKv(): Map<string, string> {
  if (!tradeRouteDistributionPolicyKv) {
    tradeRouteDistributionPolicyKv = new Map(
      TradeRouteDistributionPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return tradeRouteDistributionPolicyKv;
}

export function getTradeRouteImportSeedStockPct(): number {
  const kv = getTradeRouteDistributionPolicyKv();
  return Math.max(0, Math.min(1, parseNum(kv.get('import_seed_stock_pct'), 0.35)));
}

export function getTradeRouteConvoyChannelShare(): number {
  const kv = getTradeRouteDistributionPolicyKv();
  return Math.max(0, parseNum(kv.get('convoy_channel_share'), 0.65));
}

export function getTradeRoutePlayerChannelShare(): number {
  const kv = getTradeRouteDistributionPolicyKv();
  return Math.max(0, parseNum(kv.get('player_channel_share'), 0.35));
}

export function getTradeRouteImportBuyPriceRatio(): number {
  const kv = getTradeRouteDistributionPolicyKv();
  return Math.max(0, Math.min(1, parseNum(kv.get('import_buy_price_ratio'), 0.55)));
}

/** 생산지 동일 행성 재판매 — 구매가 대비 비율(0.70 = −30%) */
export function getTradeRouteLocalOriginResaleBuyRatio(): number {
  const kv = getTradeRouteDistributionPolicyKv();
  return Math.max(0.05, Math.min(1, parseNum(kv.get('local_origin_resale_buy_ratio'), 0.7)));
}

function getTradeRouteDailyMarketPolicyKv(): Map<string, string> {
  if (!tradeRouteDailyMarketPolicyKv) {
    tradeRouteDailyMarketPolicyKv = new Map(
      TradeRouteDailyMarketPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return tradeRouteDailyMarketPolicyKv;
}

export function getTradeRouteDailyMarketPolicyNum(key: string, fallback: number): number {
  return parseNum(getTradeRouteDailyMarketPolicyKv().get(key), fallback);
}

/** 교역품 행성 기준가 대비 허용 밴드(±%) — 10이면 300→270~330 */
export function getTradeRouteMaxPriceBandPct(): number {
  return Math.max(1, Math.min(25, getTradeRouteDailyMarketPolicyNum('max_price_band_pct', 10)));
}

function getCapitalShipTradePricePolicyKvInternal(): Map<string, string> {
  if (!capitalShipTradePricePolicyKv) {
    capitalShipTradePricePolicyKv = new Map(
      CapitalShipTradePricePolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return capitalShipTradePricePolicyKv;
}

export function getCapitalShipTradePricePolicyKv(): Map<string, string> {
  return getCapitalShipTradePricePolicyKvInternal();
}

function getHostileLoadoutPolicyKv(): Map<string, string> {
  if (!hostileLoadoutPolicyKv) {
    hostileLoadoutPolicyKv = new Map(
      HostileEnemyWeaponLoadoutPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return hostileLoadoutPolicyKv;
}

export function getPlanetHostileRedProgressionRow(planetId: string) {
  return getHostileByPlanetId().get(planetId) ?? null;
}

export function getPlayScenarioZonePlanetRow(planetId: string) {
  return PlayScenarioZonePlanets_FROM_BALANCE_CSV.find((r) => r.primaryPlanetId === planetId) ?? null;
}

export function getPlayScenarioEconomyRowForZone(zoneIndex: number) {
  const z = Math.max(1, Math.min(21, Math.round(zoneIndex)));
  return PlayScenarioEconomy_FROM_BALANCE_CSV.find((r) => Number(r.zoneIndex) === z) ?? null;
}

export function getSynthSystemColonizationRow(synthSystemId: string) {
  return getSynthBySystemId().get(synthSystemId) ?? null;
}

export function getPlanetOccupationSeedRow(planetId: string) {
  return getOccupationByPlanetId().get(planetId) ?? null;
}

export function getCapitalHullPurchaseRow(hullTierKey: string) {
  return getHullByTierKey().get(hullTierKey) ?? null;
}

/** hostile_red에 있으면 CSV 값; 없으면 기존 NPC 기반 전투 허용(레거시) */
export function resolveMainStageCombatEnabled(planetId: string): boolean {
  const row = getPlanetHostileRedProgressionRow(planetId);
  if (row) return parseBool(row.mainStageCombatEnabled);
  return true;
}

export function resolvePlanetEnemyAffinityKind(planetId: string): string {
  const hostile = getPlanetHostileRedProgressionRow(planetId);
  if (hostile?.enemyAffinityKind) return hostile.enemyAffinityKind;
  const synthPlanetMatch = /^synth_(\d{3})_p$/.exec(planetId);
  if (synthPlanetMatch) {
    const synthId = `synth_${synthPlanetMatch[1]}`;
    const synth = getSynthSystemColonizationRow(synthId);
    if (synth?.enemyAffinityKind) return synth.enemyAffinityKind;
  }
  return 'light';
}

export function resolvePlanetTargetCombatLevel(planetId: string): number {
  const hostile = getPlanetHostileRedProgressionRow(planetId);
  if (hostile) return parseNum(hostile.targetCombatLevel, 1);
  const synthPlanetMatch = /^synth_(\d{3})_p$/.exec(planetId);
  if (synthPlanetMatch) {
    const synth = getSynthSystemColonizationRow(`synth_${synthPlanetMatch[1]}`);
    if (synth) return parseNum(synth.targetCombatLevel, 1);
  }
  return 1;
}

export function getWeaponTradePriceBounds(): { min: number; max: number } {
  const kv = getWeaponTradePolicyKv();
  return {
    min: parseNum(kv.get('min_price_credits'), 800),
    max: parseNum(kv.get('max_price_credits'), 12_000_000),
  };
}

export function getWeaponCatalogStockBounds(): { min: number; max: number } {
  const kv = getWeaponTradePolicyKv();
  return {
    min: parseNum(kv.get('catalog_stock_min'), 1),
    max: parseNum(kv.get('catalog_stock_max'), 60),
  };
}

export function getTradePortCapitalListingCount(): number {
  const kv = getWeaponTradePolicyKv();
  return Math.max(1, Math.floor(parseNum(kv.get('trade_port_capital_listing_count'), 10)));
}

export function getCapitalShipTradeStockBounds(): { min: number; max: number } {
  const kv = getWeaponTradePolicyKv();
  return {
    min: parseNum(kv.get('capital_ship_stock_min'), 10),
    max: parseNum(kv.get('capital_ship_stock_max'), 15),
  };
}

export function getTradeRouteTempBankSeedCredits(): number {
  const kv = getTradeRouteEconomyPolicyKv();
  return parseNum(kv.get('temp_bank_seed_credits'), 500_000);
}

export function getTradeRouteConvoyCargoBounds(): { min: number; max: number } {
  const kv = getTradeRouteEconomyPolicyKv();
  return {
    min: parseNum(kv.get('convoy_cargo_units_min'), 2),
    max: parseNum(kv.get('convoy_cargo_units_max'), 8),
  };
}

export function getTradeRouteStockBounds(): { min: number; max: number } {
  const kv = getTradeRouteEconomyPolicyKv();
  return {
    min: parseNum(kv.get('trade_route_stock_min'), 20),
    max: parseNum(kv.get('trade_route_stock_max'), 90),
  };
}

export function getTradeRouteMarketPriceVariancePct(): number {
  const kv = getTradeRouteEconomyPolicyKv();
  return parseNum(kv.get('market_price_variance_pct'), 12);
}

export function getTradeRouteTxnHistoryLimit(): number {
  const kv = getTradeRouteEconomyPolicyKv();
  return Math.max(20, parseNum(kv.get('txn_history_limit'), 120));
}

export function resolvePlanetHostileShipCount(planetId: string): number | null {
  const hostile = getPlanetHostileRedProgressionRow(planetId);
  if (hostile) return Math.max(1, parseNum(hostile.hostileShipCount, 1));
  const synthMatch = /^synth_(\d{3})_p$/.exec(planetId);
  if (synthMatch) {
    const synth = getSynthSystemColonizationRow(`synth_${synthMatch[1]}`);
    if (synth) return Math.max(1, parseNum(synth.hostileShipCount, 1));
  }
  return null;
}

export function resolvePlanetTargetEngageSec(planetId: string): number {
  const hostile = getPlanetHostileRedProgressionRow(planetId);
  if (hostile) return Math.max(8, parseNum(hostile.targetEngageSec, 32));
  return 32;
}

export function resolvePlanetMainStageCombatVariant(planetId: string): string {
  const hostile = getPlanetHostileRedProgressionRow(planetId);
  return hostile?.mainStageCombatVariant?.trim() || 'default';
}

export function isPlanetOccupationCombatEnabled(planetId: string): boolean {
  const row = getPlanetOccupationSeedRow(planetId);
  if (!row) return false;
  return parseBool(row.occupationCombatEnabled);
}

export function resolveVirtualPlayerDensityPlanetType(
  zone: 'safe' | 'neutral' | 'pvp' | 'endgame' | string | undefined,
): string {
  if (zone === 'safe') return 'safe';
  if (zone === 'pvp') return 'pvp';
  if (zone === 'endgame') return 'endgame';
  if (zone === 'neutral') return 'neutral';
  return 'default';
}

export function getWorldExpansionTimingPolicy() {
  const row = WorldExpansionTimingPolicy_FROM_BALANCE_CSV[0];
  const minDays = parseNum(row?.minUnlockIntervalDays, 3);
  const maxDays = parseNum(row?.maxUnlockIntervalDays, 5);
  const legacySynthColonizationCount = parseNum(row?.legacySynthColonizationCount, 79);
  const avgDays = (minDays + maxDays) / 2;
  return {
    minDays,
    maxDays,
    legacySynthColonizationCount,
    prodUnlockIntervalSec: Math.round(avgDays * 24 * 60 * 60),
  };
}

let economyPriceMicroPolicyKv: Map<string, string> | null = null;

function getEconomyPriceMicroPolicyKv(): Map<string, string> {
  if (!economyPriceMicroPolicyKv) {
    economyPriceMicroPolicyKv = new Map(
      EconomyPriceMicroPolicy_FROM_BALANCE_CSV.map((row) => [row.key, row.value] as const),
    );
  }
  return economyPriceMicroPolicyKv;
}

export function getEconomyPriceMicroPolicyNum(key: string, fallback: number): number {
  return parseNum(getEconomyPriceMicroPolicyKv().get(key), fallback);
}

export function getTradeRoutePriceElasticity(): number {
  const kv = getTradeRouteEconomyPolicyKv();
  return parseNum(kv.get('price_elasticity'), 0.35);
}

export function getTradeRouteTargetStockMid(): number {
  const kv = getTradeRouteEconomyPolicyKv();
  return parseNum(kv.get('target_stock_mid'), 55);
}

export function getHostileLoadoutPolicyValue(key: string): string | undefined {
  return getHostileLoadoutPolicyKv().get(key);
}
