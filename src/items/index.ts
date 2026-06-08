// ============================================================
// 아이템·무기 카탈로그 — 공개 진입점
// - 기본 레지스트리는 `getDefaultItemCatalogRegistry()` 최초 호출 시 시드 로드
// ============================================================

export type {
  AnyCatalogEntry,
  CatalogItemId,
  ConsumableCatalogEntry,
  ItemCatalogMeta,
  ItemRarity,
  ItemStackPolicy,
  ShipModuleCatalogEntry,
  ShipModuleCombatProfile,
  TradeGoodCatalogEntry,
  WeaponCombatProfile,
  WeaponFamily,
  WeaponMountKind,
  WeaponRealtimeProfile,
  WeaponSystemCatalogEntry,
} from './catalogTypes';
export {
  isShipModuleEntry,
  isWeaponSystemEntry,
} from './catalogTypes';

export {
  CATALOG_SOFT_CAP_ENTRIES,
  ensureItemCatalogLoaded,
  getDefaultItemCatalogRegistry,
  ItemCatalogRegistry,
  resetDefaultItemCatalogRegistryForTests,
} from './itemCatalogRegistry';

export { weaponDataFromCatalogId, weaponSystemToWeaponData } from './weaponRuntimeAdapter';

export {
  CANONICAL_WEAPON_ENTRIES,
  SAMPLE_MODULE_ENTRIES,
  WEAPON_CATALOG_SEED_ENTRIES,
  WEAPON_CATALOG_WEAPON_COUNT,
} from './weaponCatalogSeed';
