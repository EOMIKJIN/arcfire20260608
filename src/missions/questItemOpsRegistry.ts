/**
 * 퀘스트 아이템·전투 배치 — 경제 밸런싱(tradePortCatalog)과 분리된 미션 전용 오버레이.
 * 정본: tables/content/mission_quest_placements.csv · mission_quest_combat_ops.csv
 */

import type { MarketListing, MissionProgress } from '../types';
import { getItemDef } from '../data/goods';
import {
  MISSION_QUEST_COMBAT_OPS_FROM_CSV,
  MISSION_QUEST_PLACEMENTS_FROM_CSV,
  type MissionQuestCombatOpRow,
  type MissionQuestPlacementRow,
} from '../data/generated';
import { getMissionById } from './missionCatalog';
import { findFirstIncompleteObjective, listActiveMissionBundles, type MissionActiveBundle } from './missionActiveBundles';
import { sortMarketListingsByBuyPrice } from '../engine/TradeEngine';

const placementByObjectiveId = new Map<string, MissionQuestPlacementRow>(
  MISSION_QUEST_PLACEMENTS_FROM_CSV.map((row) => [row.objectiveId, row]),
);

const combatOpByObjectiveId = new Map<string, MissionQuestCombatOpRow>(
  MISSION_QUEST_COMBAT_OPS_FROM_CSV.map((row) => [row.objectiveId, row]),
);

export type ActiveQuestBuyPlacement = MissionQuestPlacementRow & {
  missionId: string;
  requiredQty: number;
};

export function getQuestPlacementForObjective(objectiveId: string): MissionQuestPlacementRow | undefined {
  return placementByObjectiveId.get(objectiveId);
}

export function getQuestCombatOpForObjective(objectiveId: string): MissionQuestCombatOpRow | undefined {
  return combatOpByObjectiveId.get(objectiveId);
}

export function listActiveQuestBuyPlacementsForPlanet(
  planetId: string,
  progresses: Record<string, MissionProgress>,
): ActiveQuestBuyPlacement[] {
  const rows: ActiveQuestBuyPlacement[] = [];
  for (const bundle of listActiveMissionBundles(progresses)) {
    for (const objective of bundle.mission.objectives) {
      if (objective.type !== 'buy_goods') continue;
      if (bundle.progress.objectives[objective.id] === true) continue;
      const placement = placementByObjectiveId.get(objective.id);
      if (!placement || placement.planetId !== planetId) continue;
      if (placement.itemId !== objective.targetId) continue;
      rows.push({
        ...placement,
        missionId: bundle.mission.id,
        requiredQty: objective.quantity ?? 1,
      });
    }
  }
  return rows;
}

/** 무역소 CSV 미보유 행성 — 활성 퀘스트 구매 배치만으로 무역소 SUB-STAGE 허용 */
export function hasActiveQuestBuyPlacementAtPlanet(
  planetId: string,
  progresses: Record<string, MissionProgress>,
): boolean {
  return listActiveQuestBuyPlacementsForPlanet(planetId, progresses).length > 0;
}

/** 무역소 구매 탭 — 경제 카탈로그 + 활성 퀘스트 오버레이(중복 제거) */
export function mergeQuestTradePortItemIds(
  planetId: string,
  baseItemIds: readonly string[],
  progresses: Record<string, MissionProgress>,
): string[] {
  const merged = new Set(baseItemIds);
  for (const placement of listActiveQuestBuyPlacementsForPlanet(planetId, progresses)) {
    if (getItemDef(placement.itemId)?.tradeable) merged.add(placement.itemId);
  }
  return [...merged];
}

/** 퀘스트 배치 재고·단가 고정 — generateMarketByItemIds 이후 패치 */
export function applyQuestMarketListingOverrides(
  listings: readonly MarketListing[],
  planetId: string,
  progresses: Record<string, MissionProgress>,
): MarketListing[] {
  const placements = listActiveQuestBuyPlacementsForPlanet(planetId, progresses);
  if (placements.length === 0) return [...listings];

  const byGoodId = new Map(listings.map((row) => [row.goodId, { ...row }]));
  for (const placement of placements) {
    const def = getItemDef(placement.itemId);
    if (!def?.tradeable) continue;
    const stockFloor = Math.max(placement.stockQty, placement.requiredQty);
    const existing = byGoodId.get(placement.itemId);
    const price = placement.unitPriceOverride > 0
      ? placement.unitPriceOverride
      : existing?.price ?? Math.max(1, def.basePrice);
    byGoodId.set(placement.itemId, {
      goodId: placement.itemId,
      price,
      stock: existing ? Math.max(existing.stock, stockFloor) : stockFloor,
      demand: existing?.demand ?? 'normal',
    });
  }
  return sortMarketListingsByBuyPrice([...byGoodId.values()]);
}

function bundleHasTransitGuaranteedDefeat(bundle: MissionActiveBundle): boolean {
  for (const objective of bundle.mission.objectives) {
    if (objective.type !== 'defeat_enemy') continue;
    if (bundle.progress.objectives[objective.id] === true) continue;
    const op = combatOpByObjectiveId.get(objective.id);
    if (op?.encounterPolicy === 'transit_guaranteed') return true;
  }
  return false;
}

/** transit 이동 시 전투 미션 — `transit_guaranteed` 정책이면 100% 조우 */
export function shouldGuaranteeQuestCombatEncounter(
  progresses: Record<string, MissionProgress>,
  activeMissionId?: string | null,
): boolean {
  const bundles = listActiveMissionBundles(progresses);
  if (activeMissionId) {
    const primary = bundles.find((bundle) => bundle.mission.id === activeMissionId);
    return primary ? bundleHasTransitGuaranteedDefeat(primary) : false;
  }
  const first = findFirstIncompleteObjective(bundles, 'defeat_enemy');
  if (!first) return false;
  const op = combatOpByObjectiveId.get(first.objective.id);
  return op?.encounterPolicy === 'transit_guaranteed';
}

/** combat.tsx — offerPlanetId 대신 퀘스트 앵커 행성 우선 */
export function resolveQuestCombatAnchorPlanetId(
  progresses: Record<string, MissionProgress>,
  fallbackPlanetId: string | null | undefined,
): string | null {
  for (const bundle of listActiveMissionBundles(progresses)) {
    for (const objective of bundle.mission.objectives) {
      if (objective.type !== 'defeat_enemy') continue;
      if (bundle.progress.objectives[objective.id] === true) continue;
      const op = combatOpByObjectiveId.get(objective.id);
      if (op?.anchorPlanetId) return op.anchorPlanetId;
      const mission = getMissionById(bundle.mission.id);
      if (mission?.offerPlanetId) return mission.offerPlanetId;
    }
  }
  return fallbackPlanetId ?? null;
}

export function listAllQuestPlacementRows(): MissionQuestPlacementRow[] {
  return MISSION_QUEST_PLACEMENTS_FROM_CSV;
}

export function listAllQuestCombatOpRows(): MissionQuestCombatOpRow[] {
  return MISSION_QUEST_COMBAT_OPS_FROM_CSV;
}
