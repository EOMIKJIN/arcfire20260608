// ============================================================
// 전함 무역 가격 — 기능·성능 우선, 수요는 TradeEngine 2차 반영
// ============================================================

import type { NpcCapitalShip } from '../../types';
import { NPC_CAPITAL_SHIPS_FROM_CSV } from '../../data/generated';
import {
  getCapitalShipTradePricePolicyKv,
  getCapitalHullPurchaseRow,
} from './balanceTableRegistry';
import { resolveHullTierKeyForTradeCatalogShip } from './capitalShipTradeListingPolicy';

function parseNum(raw: string | number | undefined, fallback = 0): number {
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function policyNum(key: string, fallback: number): number {
  const kv = getCapitalShipTradePricePolicyKv();
  return parseNum(kv.get(key), fallback);
}

function combatPerformanceScore(ship: NpcCapitalShip): number {
  const c = ship.combat;
  const diceMean = c.damageDice.count * ((c.damageDice.sides + 1) / 2) + c.damageDice.bonus;
  return (
    c.maxHp * policyNum('hp_weight', 1)
    + c.maxShield * policyNum('shield_weight', 0.55)
    + c.armor * policyNum('armor_weight', 8)
    + diceMean * policyNum('damage_weight', 12)
    + c.attackBonus * 6
  );
}

function tierBaselinePerformanceScore(hullTierKey: string): number {
  const canonicalId = NPC_CAPITAL_SHIPS_FROM_CSV.find(
    (s) => resolveHullTierKeyForTradeCatalogShip(s.id) === hullTierKey && s.tradePortListed,
  )?.id;
  const ship = canonicalId
    ? NPC_CAPITAL_SHIPS_FROM_CSV.find((s) => s.id === canonicalId)
    : undefined;
  if (ship) return Math.max(1, combatPerformanceScore(ship));
  const row = getCapitalHullPurchaseRow(hullTierKey);
  const minLv = parseNum(row?.requiredPilotLevelMin, 1);
  return Math.max(1, 400 + minLv * 24);
}

/** 성능 지수 기반 무역소 기준가(수요 전) */
export function resolveCapitalShipPerformanceBasePrice(npcShipId: string): number {
  const ship = NPC_CAPITAL_SHIPS_FROM_CSV.find((s) => s.id === npcShipId);
  if (!ship) return 1;

  const tier = resolveHullTierKeyForTradeCatalogShip(npcShipId);
  const tierRow = getCapitalHullPurchaseRow(tier);
  let tierBase = parseNum(tierRow?.purchaseCredits, 0);
  if (tierBase <= 0) {
    const upgraded = getCapitalHullPurchaseRow('frigate_upgraded');
    tierBase = Math.floor(parseNum(upgraded?.purchaseCredits, 250_000) * 0.4);
  }

  const perf = combatPerformanceScore(ship);
  const baseline = tierBaselinePerformanceScore(tier);
  const rawRatio = perf / baseline;
  const ratioMin = policyNum('perf_ratio_min', 0.88);
  const ratioMax = policyNum('perf_ratio_max', 1.14);
  const ratio = Math.max(ratioMin, Math.min(ratioMax, rawRatio));

  return Math.max(1, Math.floor(tierBase * ratio));
}
