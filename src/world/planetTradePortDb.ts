import type { Planet } from '../types';
import { STAR_SYSTEMS } from '../data/systems';
import { getItemDef } from '../data/goods';
import { listItemDefs } from '../data/itemRegistry';
import { NPC_CAPITAL_SHIPS_FROM_CSV } from '../data/generated';

type PlanetTradePortMutableState = {
  addedItemIds: Set<string>;
  removedItemIds: Set<string>;
};

/**
 * 행성별 무역소 아이템 참조 DB
 * - defaultItemIds: planets.csv에서 온 기본 진열 상품
 * - added/removed: 추후 이벤트·중개소로 실시간 증감될 오버레이
 */
const PLANET_TRADE_PORT_DEFAULT_ITEM_IDS: Record<string, readonly string[]> = buildPlanetDefaultItemIds();
const PLANET_TRADE_PORT_MUTABLE_STATE: Record<string, PlanetTradePortMutableState> = {};

function buildPlanetDefaultItemIds(): Record<string, readonly string[]> {
  const out: Record<string, readonly string[]> = {};
  for (const system of Object.values(STAR_SYSTEMS)) {
    for (const planet of system.planets) {
      out[planet.id] = planet.tradeGoods.filter(isTradeableItemId);
    }
  }
  return out;
}

function getOrCreateMutableState(planetId: string): PlanetTradePortMutableState {
  const existing = PLANET_TRADE_PORT_MUTABLE_STATE[planetId];
  if (existing) return existing;
  const created: PlanetTradePortMutableState = { addedItemIds: new Set<string>(), removedItemIds: new Set<string>() };
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

/** 무역소가 있는 행성 id 목록(성계 순회) */
export function listPlanetIdsWithTradePort(): string[] {
  const out: string[] = [];
  for (const system of Object.values(STAR_SYSTEMS)) {
    for (const planet of system.planets) {
      if (planet.hasTradePort) out.push(planet.id);
    }
  }
  return out;
}

/** `npc_ai_ships.tradePortListed` + `item_defs` 병합 `capital_ship_*` id */
function tradePortListedCapitalShipItemIds(): string[] {
  return NPC_CAPITAL_SHIPS_FROM_CSV.filter(s => s.tradePortListed).map(s => `capital_ship_${s.id}`);
}

/** 무기 테이블 기반으로 생성된 weapon_module 아이템은 기본 무역소에서 공통 취급한다. */
function tradePortListedWeaponModuleItemIds(): string[] {
  return listItemDefs()
    .filter((d) => d.type === 'weapon_module' && d.tradeable)
    .map((d) => d.id);
}

function mergeDefaultTradePortItemIds(planetId: string, defaults: readonly string[]): string[] {
  const planet = findPlanet(planetId);
  const base = [...defaults];
  if (planet?.hasTradePort) {
    for (const itemId of tradePortListedWeaponModuleItemIds()) {
      if (isTradeableItemId(itemId)) base.push(itemId);
    }
    for (const itemId of tradePortListedCapitalShipItemIds()) {
      if (isTradeableItemId(itemId)) base.push(itemId);
    }
  }
  return [...new Set(base)];
}

export function getPlanetTradePortDefaultItemIds(planetId: string): readonly string[] {
  return PLANET_TRADE_PORT_DEFAULT_ITEM_IDS[planetId] ?? [];
}

/** 실제 무역소 노출 목록(기본 + 추가 - 제거) */
export function getPlanetTradePortItemIds(planetId: string): string[] {
  const defaults = mergeDefaultTradePortItemIds(planetId, getPlanetTradePortDefaultItemIds(planetId));
  const mutable = PLANET_TRADE_PORT_MUTABLE_STATE[planetId];
  if (!mutable) return [...defaults];

  const merged = new Set(defaults);
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

/** 기본 목록 포함 아이템도 임시/영구 제외 가능 */
export function removeTradePortItem(planetId: string, itemId: string): void {
  const mutable = getOrCreateMutableState(planetId);
  mutable.addedItemIds.delete(itemId);
  mutable.removedItemIds.add(itemId);
}

/** 운영 툴/디버그용 리셋 */
export function resetTradePortItemOverrides(planetId: string): void {
  delete PLANET_TRADE_PORT_MUTABLE_STATE[planetId];
}
