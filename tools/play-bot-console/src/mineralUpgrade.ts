/**
 * A-11 광물 강화 — 사람과 같은 과정(대표님 2026-10-10 「진행하라」).
 * 채굴로 광물 종류별로 모은다 → 조선소에서 실기 비용·상한으로 강화 → 함선별 저장(함선이 바뀌면 0부터).
 * 판단은 장비와 같은 기준(전투력 상승). 강화에 쓸 광물은 팔지 않고 남긴다.
 */
import {
  getFinalMineralUpgradeCap,
  getMineralUpgradeCost,
  listMineralUpgradeStats,
  mineralUpgradeCostCreditValue,
  type MineralUpgradeCost,
} from '../../../src/game/shipyardMineralUpgrade/mineralUpgradeModel';
import { HullUpgradeCost_FROM_BALANCE_CSV } from '../../../src/data/balance/generated/csvHullUpgradeCost';
import { findHullTierKeyForListedShip } from '../../../src/arcCore/balance/capitalShipTradeListingPolicy';
import { resolveMineralCatalogSellPrice } from '../../../src/arcCore/economy/mineralTradePricing';
import { playerCombatPower, playerCombatSig, STARTER_HULL_SHIP_ID } from './liveCombat';
import type { WorldState } from './types';

/** 장비·스킬과 같은 문턱 — 이 미만 상승은 전투 가치 없음. */
const MIN_GAIN = 0.005;

const UPGRADE_ORES = new Set(HullUpgradeCost_FROM_BALANCE_CSV.map((c) => String(c.oreId)));

/** 강화 후에도 남길 크레딧(연료·수리) — 트윈 행동 상수 */
const UPGRADE_CASH_FLOOR = 800;

const creditValueOf = (cost: MineralUpgradeCost) =>
  mineralUpgradeCostCreditValue(cost, (oreId) => resolveMineralCatalogSellPrice(oreId) ?? 0);

export type MineralUpgradePick = {
  statId: string;
  targetLevel: number;
  cost: MineralUpgradeCost;
  gain: number;
  affordable: boolean;
};

export function oreCount(world: WorldState, oreId: string): number {
  return world.oreCargo?.[oreId] ?? 0;
}

export function addOre(world: WorldState, oreId: string): void {
  const cargo = { ...(world.oreCargo ?? {}) };
  cargo[oreId] = (cargo[oreId] ?? 0) + 1;
  world.oreCargo = cargo;
  world.mineralCargo = (world.mineralCargo ?? 0) + 1;
}

let pickKey = '';
let pickRows: MineralUpgradePick[] = [];

/** 상한 안의 다음 강화 후보 — 전투력 상승 큰 순. 함선·레벨·장착·강화·광물이 바뀔 때만 다시 잰다. */
export function mineralUpgradeCandidates(world: WorldState): MineralUpgradePick[] {
  const ores = world.oreCargo ?? {};
  let key = `${playerCombatSig(world)}|c:${Math.floor(world.credits / 1000)}`;
  for (const id of Object.keys(ores)) key += `|o:${id}=${ores[id]}`;
  if (key === pickKey) return pickRows;
  pickKey = key;
  // 실기 상한 = min(전투 레벨 상한, 조선소 상한, 함선 등급 상한). 트윈에는 행성 조선소 레벨이 없어 조선소 상한은 뺀다.
  const hullTierKey = findHullTierKeyForListedShip(world.hullShipId || STARTER_HULL_SHIP_ID);
  const cap = getFinalMineralUpgradeCap(world.level, 0, hullTierKey);
  const current = world.hullUpgrades ?? {};
  const base = Math.max(1e-6, playerCombatPower(world));
  const out: MineralUpgradePick[] = [];
  for (const stat of listMineralUpgradeStats()) {
    const lv = current[stat.statId] ?? 0;
    if (lv >= cap) continue;
    const targetLevel = lv + 1;
    const gain = playerCombatPower(world, { mineralUpgrades: { ...current, [stat.statId]: targetLevel } }) / base - 1;
    if (gain < MIN_GAIN) continue;
    const cost = getMineralUpgradeCost(hullTierKey, stat.statId, targetLevel);
    if (!cost) continue;
    const affordable = world.credits - cost.credits >= UPGRADE_CASH_FLOOR
      && cost.ores.every((c) => oreCount(world, c.oreId) >= c.qty);
    out.push({ statId: stat.statId, targetLevel, cost, gain, affordable });
  }
  // 크레딧 환산 1당 상승 — 싼 강화부터 고르게 오른다
  const per = (p: MineralUpgradePick) => p.gain / Math.max(1, creditValueOf(p.cost));
  out.sort((a, b) => per(b) - per(a));
  pickRows = out;
  return out;
}

export function bestAffordableMineralUpgrade(world: WorldState): MineralUpgradePick | null {
  if (world.hangarShips <= 0) return null;
  return mineralUpgradeCandidates(world).find((p) => p.affordable) ?? null;
}

export function canMineralUpgrade(world: WorldState): boolean {
  return bestAffordableMineralUpgrade(world) != null;
}

/** 광물을 모으는 목표 강화(가성비 1위) — 없으면 null(상한·가치 없음). */
export function mineralUpgradeTarget(world: WorldState): MineralUpgradePick | null {
  if (world.hangarShips <= 0) return null;
  return mineralUpgradeCandidates(world)[0] ?? null;
}

/** 다음 목표 강화에 남겨 둘 광물 — 매도에서 뺀다. */
function reservedOre(world: WorldState, oreId: string): number {
  const target = mineralUpgradeCandidates(world)[0];
  if (!target) return 0;
  return target.cost.ores.find((c) => c.oreId === oreId)?.qty ?? 0;
}

/**
 * 매도 주기(mineCap)에 셀 적재 — 강화 몫으로 남긴 광물은 인벤토리 보관분이라 빼고 센다.
 * 실기도 강화 광물은 인벤토리에 쌓아 두고 조선소에서 쓴다.
 */
export function sellableCargo(world: WorldState): number {
  const total = world.mineralCargo ?? 0;
  const ores = world.oreCargo ?? {};
  let reserved = 0;
  for (const id of Object.keys(ores)) reserved += Math.min(ores[id] ?? 0, reservedOre(world, id));
  return Math.max(0, total - reserved);
}

/**
 * 1개 팔 광물 — 강화에 안 쓰는 광물 먼저, 다음은 목표 강화 몫을 넘는 여유분이 큰 것.
 * 모두 강화 몫이면 null(팔지 않음). 종류 기록이 없는 옛 적재는 'legacy'.
 */
export function pickOreToSell(world: WorldState): string | null {
  const ores = world.oreCargo ?? {};
  const ids = Object.keys(ores).filter((id) => (ores[id] ?? 0) > 0);
  const tracked = ids.reduce((s, id) => s + (ores[id] ?? 0), 0);
  if ((world.mineralCargo ?? 0) > tracked) return 'legacy';
  let best: string | null = null;
  let bestSurplus = 0;
  for (const id of ids) {
    if (!UPGRADE_ORES.has(id)) return id;
    const surplus = (ores[id] ?? 0) - reservedOre(world, id);
    if (surplus > bestSurplus) {
      bestSurplus = surplus;
      best = id;
    }
  }
  return best;
}

export function removeSoldOre(world: WorldState, oreId: string): void {
  if (oreId === 'legacy') return;
  const cargo = { ...(world.oreCargo ?? {}) };
  cargo[oreId] = Math.max(0, (cargo[oreId] ?? 0) - 1);
  if (cargo[oreId] === 0) delete cargo[oreId];
  world.oreCargo = cargo;
}

/** 조선소에서 강화 1회 — 실기 비용 차감·함선별 레벨 +1. 할 수 없으면 null. */
export function applyMineralUpgrade(world: WorldState): string | null {
  const pick = bestAffordableMineralUpgrade(world);
  if (!pick) return null;
  const cargo = { ...(world.oreCargo ?? {}) };
  let used = 0;
  for (const c of pick.cost.ores) {
    cargo[c.oreId] = (cargo[c.oreId] ?? 0) - c.qty;
    if (cargo[c.oreId]! <= 0) delete cargo[c.oreId];
    used += c.qty;
  }
  world.oreCargo = cargo;
  world.mineralCargo = Math.max(0, (world.mineralCargo ?? 0) - used);
  world.credits -= pick.cost.credits;
  world.hullUpgrades = { ...(world.hullUpgrades ?? {}), [pick.statId]: pick.targetLevel };
  world.mineralUpgradeCount = (world.mineralUpgradeCount ?? 0) + 1;
  const costText = [`${pick.cost.credits}cr`, ...pick.cost.ores.map((c) => `${c.oreId}×${c.qty}`)].join(' ');
  return `광물 강화 ${pick.statId} ${pick.targetLevel}강 (${costText}) · 전투력 +${(pick.gain * 100).toFixed(1)}% · ${world.hullShipId}`;
}
