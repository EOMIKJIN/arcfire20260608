import type { Planet } from '../types';
import { STAR_SYSTEMS } from '../data/systems';
import { getItemDef } from '../data/goods';
import { listItemDefs } from '../data/itemRegistry';

type PlanetTradePortMutableState = {
  catalogItemIds: Set<string>;
  addedItemIds: Set<string>;
  removedItemIds: Set<string>;
};

/**
 * 행성별 무역소 진열 DB — 정본은 아크코어 `syncTradePortCatalogFromBalance`만.
 * - catalogItemIds: `set_catalog`로 교체된 행성별 전체 진열
 * - added/removed: 이벤트·중개소 등 런타임 증감(선택)
 */
const PLANET_TRADE_PORT_MUTABLE_STATE: Record<string, PlanetTradePortMutableState> = {};

function getOrCreateMutableState(planetId: string): PlanetTradePortMutableState {
  const existing = PLANET_TRADE_PORT_MUTABLE_STATE[planetId];
  if (existing) return existing;
  const created: PlanetTradePortMutableState = {
    catalogItemIds: new Set<string>(),
    addedItemIds: new Set<string>(),
    removedItemIds: new Set<string>(),
  };
  PLANET_TRADE_PORT_MUTABLE_STATE[planetId] = created;
  return created;
}

function isTradeableItemId(itemId: string): boolean {
  return Boolean(getItemDef(itemId)?.tradeable);
}

function findPlanet(planetId: string): Planet | undefined {
  for (const system of Object.values(STAR_SYSTEMS)) {
    const p = system.planets.find(pl => pl.id === planetId);
    if (p) return p;
  }
  return undefined;
}

/** 아크코어·경제 서브코어 등 — 행성 레코드 조회 */
export function getPlanetRecord(planetId: string): Planet | undefined {
  return findPlanet(planetId);
}

/** 무역소가 있는 행성 id — CSV 정본(17/21) ∪ dev_trade_port 설치 */
export function listPlanetIdsWithTradePort(): string[] {
  const ids = new Set<string>();
  for (const system of Object.values(STAR_SYSTEMS)) {
    for (const planet of system.planets) {
      if (planet.hasTradePort) ids.add(planet.id);
    }
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isPlanetTradePortInstalled } = require('../game/planetDevelopment/planetTradePortListing') as typeof import('../game/planetDevelopment/planetTradePortListing');
    for (const system of Object.values(STAR_SYSTEMS)) {
      for (const planet of system.planets) {
        if (isPlanetTradePortInstalled(planet.id)) ids.add(planet.id);
      }
    }
  } catch {
    /* dev module 미로드 — CSV만 */
  }
  return [...ids];
}

function weaponModuleRequiredLevelFromDef(def: ReturnType<typeof getItemDef>): number {
  if (!def || def.type !== 'weapon_module') return Number.POSITIVE_INFINITY;
  const raw = def.attrs.weaponRequiredLevel;
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(1, Math.floor(raw));
  if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) return Math.max(1, parsed);
  }
  return 1;
}

/** `weapon_list.csv` 요구레벨 — UI·정책 연동용 */
export function getTradePortWeaponModuleRequiredLevel(itemId: string): number | null {
  const def = getItemDef(itemId);
  if (!def || def.type !== 'weapon_module') return null;
  return weaponModuleRequiredLevelFromDef(def);
}

function equipmentRequiredLevelFromDef(def: NonNullable<ReturnType<typeof getItemDef>>): number {
  const raw = def.attrs?.equipmentRequiredLevel;
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(1, Math.floor(raw));
  if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) return Math.max(1, parsed);
  }
  return 1;
}

/** 함선 장비 `equipmentRequiredLevel` — UI·정책 연동용 */
export function getTradePortEquipmentRequiredLevel(itemId: string): number | null {
  const def = getItemDef(itemId);
  if (!def || def.kind !== 'equipment' || def.type === 'weapon_module') return null;
  if (def.type !== 'ship_equipment') return null;
  return equipmentRequiredLevelFromDef(def);
}

/** 아크코어 `set_catalog` — 행성 무역소 진열 전체 교체 */
export function replaceTradePortCatalog(planetId: string, itemIds: readonly string[]): void {
  const mutable = getOrCreateMutableState(planetId);
  mutable.catalogItemIds.clear();
  for (const itemId of itemIds) {
    if (isTradeableItemId(itemId)) mutable.catalogItemIds.add(itemId);
  }
  mutable.addedItemIds.clear();
  mutable.removedItemIds.clear();
}

/** @deprecated planets.csv pipe 미사용 — 항상 빈 배열 */
export function getPlanetTradePortDefaultItemIds(_planetId: string): readonly string[] {
  return [];
}

/** 실제 무역소 노출 목록(아크코어 카탈로그 + 이벤트 증감) */
export function getPlanetTradePortItemIds(planetId: string): string[] {
  const mutable = PLANET_TRADE_PORT_MUTABLE_STATE[planetId];
  if (!mutable || mutable.catalogItemIds.size === 0) return [];

  const merged = new Set(mutable.catalogItemIds);
  for (const itemId of mutable.addedItemIds) {
    if (isTradeableItemId(itemId)) merged.add(itemId);
  }
  for (const itemId of mutable.removedItemIds) {
    merged.delete(itemId);
  }
  return [...merged];
}

/** 추후 드랍/이벤트/중개소 연동 시 사용 */
export function addTradePortItem(planetId: string, itemId: string): void {
  if (!isTradeableItemId(itemId)) return;
  const mutable = getOrCreateMutableState(planetId);
  mutable.removedItemIds.delete(itemId);
  mutable.addedItemIds.add(itemId);
}

export function removeTradePortItem(planetId: string, itemId: string): void {
  const mutable = getOrCreateMutableState(planetId);
  mutable.addedItemIds.delete(itemId);
  mutable.removedItemIds.add(itemId);
}

/** 운영 툴/디버그용 리셋 */
export function resetTradePortItemOverrides(planetId: string): void {
  delete PLANET_TRADE_PORT_MUTABLE_STATE[planetId];
}
