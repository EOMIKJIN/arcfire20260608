export {
  backfillEquipSlotInventoryIndices,
  applyPostCombatDurabilityPass,
  DURABILITY_DEFAULT_PCT,
  DURABILITY_MIN_PCT,
  isDurabilityTrackedInventoryGoodId,
  isPlayerShipHullOperable,
  normalizeCargoItemDurability,
  repairActiveShipHull,
  resolveCapitalShipRepairCost,
  resolveDurabilityPct,
  resolveHangarShipDurabilityPct,
  resolvePlayerShipDurabilityPct,
  syncCurrentShipDurabilityToHangar,
  type PostCombatDurabilityResult,
} from './durabilityModel';
export {
  getCapitalShipDurabilityPolicy,
  resolveItemWearPerCombatPct,
  rollCapitalShipWearPerCombatPct,
} from './durabilityPolicy';
export { formatInventoryDurabilityMeta } from './durabilityDisplay';
