import type { Planet } from '../types';
import { isPlanetOwnershipDeedCatalogEligible } from '../arcCore/balance/planetOwnershipDeedCatalog';
import {
  isPlanetOwnershipItemId,
  resolvePlanetIdFromOwnershipItemId,
} from '../arcCore/balance/planetOwnershipDeedItemDef';
import { resolvePlanetById } from './resolvePlanetById';
import { listCoreOpenGameplayPlanetIds } from './coreOpenGameplayPlanets';
import { isPlanetCsvTradePortWorldEnabled } from '../game/planetDevelopment/planetCsvWorldFlags';

type ItemDefLike = {
  tradeable?: boolean;
  type?: string;
  kind?: string;
  attrs?: Record<string, unknown>;
};

function readItemDef(itemId: string): ItemDefLike | undefined {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getItemDef } = require('../data/goods') as typeof import('../data/goods');
  return getItemDef(itemId);
}

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

/** 정책 카탈로그 persist — CSV 21 + synth ownership 합성 SKU drop 방지 */
function isCatalogPersistableItemId(itemId: string): boolean {
  if (isPlanetOwnershipItemId(itemId)) {
    const planetId = resolvePlanetIdFromOwnershipItemId(itemId);
    return Boolean(planetId && isPlanetOwnershipDeedCatalogEligible(planetId));
  }
  return Boolean(readItemDef(itemId)?.tradeable);
}

function findPlanet(planetId: string): Planet | undefined {
  return resolvePlanetById(planetId) ?? undefined;
}

/** 아크코어·경제 서브코어 등 — 행성 레코드 조회 */
export function getPlanetRecord(planetId: string): Planet | undefined {
  return findPlanet(planetId);
}

/** 무역소가 있는 행성 id — 코어 개방(A+B) CSV·colonization·runtime hasTradePort ∪ dev_trade_port */
export function listPlanetIdsWithTradePort(): string[] {
  const ids = new Set<string>();
  for (const planetId of listCoreOpenGameplayPlanetIds()) {
    if (isPlanetCsvTradePortWorldEnabled(planetId)) ids.add(planetId);
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { isPlanetTradePortInstalled } = require('../game/planetDevelopment/planetTradePortListing') as typeof import('../game/planetDevelopment/planetTradePortListing');
    for (const planetId of listCoreOpenGameplayPlanetIds()) {
      if (isPlanetTradePortInstalled(planetId)) ids.add(planetId);
    }
  } catch {
    /* dev module 미로드 */
  }
  return [...ids];
}

function weaponModuleRequiredLevelFromDef(def: ItemDefLike | undefined): number {
  if (!def || def.type !== 'weapon_module') return Number.POSITIVE_INFINITY;
  const raw = def.attrs?.weaponRequiredLevel;
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(1, Math.floor(raw));
  if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) return Math.max(1, parsed);
  }
  return 1;
}

/** `weapon_list.csv` 요구레벨 — UI·정책 연동용 */
export function getTradePortWeaponModuleRequiredLevel(itemId: string): number | null {
  const def = readItemDef(itemId);
  if (!def || def.type !== 'weapon_module') return null;
  return weaponModuleRequiredLevelFromDef(def);
}

function equipmentRequiredLevelFromDef(def: ItemDefLike): number {
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
  const def = readItemDef(itemId);
  if (!def || def.kind !== 'equipment' || def.type === 'weapon_module') return null;
  if (def.type !== 'ship_equipment') return null;
  return equipmentRequiredLevelFromDef(def);
}

/** 아크코어 `set_catalog` — 행성 무역소 진열 전체 교체 */
export function replaceTradePortCatalog(planetId: string, itemIds: readonly string[]): void {
  const mutable = getOrCreateMutableState(planetId);
  mutable.catalogItemIds.clear();
  for (const itemId of itemIds) {
    if (isCatalogPersistableItemId(itemId)) mutable.catalogItemIds.add(itemId);
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
    if (isCatalogPersistableItemId(itemId)) merged.add(itemId);
  }
  for (const itemId of mutable.removedItemIds) {
    merged.delete(itemId);
  }
  return [...merged];
}

/** 추후 드랍/이벤트/중개소 연동 시 사용 */
export function addTradePortItem(planetId: string, itemId: string): void {
  if (!isCatalogPersistableItemId(itemId)) return;
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

/** 계정·월드 초기화 — synth 포함 전 행성 무역소 런타임 오버라이드 제거 */
export function resetAllTradePortItemOverrides(): void {
  for (const key of Object.keys(PLANET_TRADE_PORT_MUTABLE_STATE)) {
    delete PLANET_TRADE_PORT_MUTABLE_STATE[key];
  }
}
