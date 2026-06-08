// ============================================================
// 아이템 카탈로그 레지스트리 — O(1) 조회, 200~1000+ 엔트리 전제
// - 초기화 시 전체 등록(또는 청크 merge) 후 불변 사용 권장
// ============================================================

import type {
  AnyCatalogEntry,
  CatalogItemId,
  WeaponSystemCatalogEntry,
} from './catalogTypes';
import { isWeaponSystemEntry } from './catalogTypes';
import { WEAPON_CATALOG_SEED_ENTRIES } from './weaponCatalogSeed';

/** 번들·풀 사이징 시 참고 (실제 배열은 게임 모드별로 별도) */
export const CATALOG_SOFT_CAP_ENTRIES = 1024;

export class ItemCatalogRegistry {
  private readonly byId = new Map<CatalogItemId, AnyCatalogEntry>();
  private weaponIdList: CatalogItemId[] = [];

  /** 중복 id 시 마지막 등록이 이기며, 개발 중 assert 용으로 경고만 */
  registerMany(entries: readonly AnyCatalogEntry[]): void {
    for (const e of entries) {
      if (this.byId.has(e.id)) {
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
          // eslint-disable-next-line no-console
          console.warn(`[ItemCatalogRegistry] duplicate id overwrite: ${e.id}`);
        }
      }
      this.byId.set(e.id, e);
    }
    this.rebuildWeaponIndex();
  }

  registerOne(entry: AnyCatalogEntry): void {
    this.registerMany([entry]);
  }

  private rebuildWeaponIndex(): void {
    this.weaponIdList = [];
    for (const [id, e] of this.byId) {
      if (isWeaponSystemEntry(e)) this.weaponIdList.push(id);
    }
    this.weaponIdList.sort();
  }

  get(id: CatalogItemId): AnyCatalogEntry | undefined {
    return this.byId.get(id);
  }

  getWeaponSystem(id: CatalogItemId): WeaponSystemCatalogEntry | undefined {
    const e = this.byId.get(id);
    return e && isWeaponSystemEntry(e) ? e : undefined;
  }

  /** 무기 체계 id만 (안정 정렬) */
  getAllWeaponSystemIds(): readonly CatalogItemId[] {
    return this.weaponIdList;
  }

  size(): number {
    return this.byId.size;
  }

}

let defaultRegistry: ItemCatalogRegistry | null = null;
let defaultSeeded = false;

export function getDefaultItemCatalogRegistry(): ItemCatalogRegistry {
  if (!defaultRegistry) {
    defaultRegistry = new ItemCatalogRegistry();
  }
  if (!defaultSeeded) {
    defaultRegistry.registerMany(WEAPON_CATALOG_SEED_ENTRIES);
    defaultSeeded = true;
  }
  return defaultRegistry;
}

export function resetDefaultItemCatalogRegistryForTests(): void {
  defaultRegistry = null;
  defaultSeeded = false;
}

/** 앱 어디서든 1회 호출해도 됨(내부적으로 idempotent). */
export function ensureItemCatalogLoaded(): void {
  getDefaultItemCatalogRegistry();
}
