// ============================================================
// 전함 무역 가격 — 기능·성능 우선, 수요는 TradeEngine 2차 반영
// ============================================================

import type { NpcCapitalShip } from '../../types';
import { getNpcCapitalShip, listAllNpcCapitalShipRows } from '../../npc/npcFleetRegistry';
import {
  getCapitalShipTradePricePolicyKv,
  getCapitalHullPurchaseRow,
} from './balanceTableRegistry';
import { resolveHullTierKeyForTradeCatalogShip } from './capitalShipTradeListingPolicy';
import { isWaveTestTradeShipId } from '../../economy/waveDefenseTestTradeItems';

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
  let canonicalShip: NpcCapitalShip | undefined;
  for (const s of listAllNpcCapitalShipRows()) {
    if (!s.tradePortListed) continue;
    // 웨이브 테스트함은 운영 tier 기준가 산정에서 제외(체급 대비 비정상 스탯 — 기준 오염 방지).
    if (isWaveTestTradeShipId(s.id)) continue;
    if (resolveHullTierKeyForTradeCatalogShip(s.id) !== hullTierKey) continue;
    canonicalShip = s;
    break;
  }
  if (canonicalShip) return Math.max(1, combatPerformanceScore(canonicalShip));
  const row = getCapitalHullPurchaseRow(hullTierKey);
  const minLv = parseNum(row?.requiredPilotLevelMin, 1);
  return Math.max(1, 400 + minLv * 24);
}

/** 성능 지수 기반 무역소 기준가(수요 전) */
export function resolveCapitalShipPerformanceBasePrice(npcShipId: string): number {
  const ship = getNpcCapitalShip(npcShipId);
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
