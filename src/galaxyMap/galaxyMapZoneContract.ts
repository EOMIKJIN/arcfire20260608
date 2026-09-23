// ============================================================
// 은하 지도 존 계약 (Z1)
//
// 9칸 번호 · 실분포는 십자 5존. 존 5 = 현재 가시 코어+레거시.
// 가시 노드 리스트·지도 스케일은 worldmap 이 그대로 유지한다.
// ============================================================

import {
  GALAXY_SYSTEMS,
  GAMEPLAY_SYSTEM_IDS,
  isExpansionGatewayOrdinal,
  LEGACY_VISIBLE_TOTAL_SYSTEMS,
  parseSynthOrdinal,
} from '../data/galaxy100';

export type GalaxyMapZoneId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type GalaxyMapCardinalZoneId = 2 | 4 | 6 | 8;

export const GALAXY_MAP_CENTER_ZONE_ID: GalaxyMapZoneId = 5;
export const GALAXY_MAP_EMPTY_CORNER_ZONE_IDS = [1, 3, 7, 9] as const;
export const GALAXY_MAP_CARDINAL_ZONE_IDS = [2, 4, 6, 8] as const;
export const GALAXY_MAP_LOADABLE_ZONE_IDS = [2, 4, 5, 6, 8] as const;

/** 방향당 주 관문 — 존 5 중심에 가장 가까운 기존 expansion gateway */
export const GALAXY_MAP_PRIMARY_GATEWAY_BY_ZONE: Record<GalaxyMapCardinalZoneId, string> = {
  2: 'synth_092',
  4: 'synth_083',
  6: 'synth_085',
  8: 'synth_090',
};

export type GalaxyMapGraphBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

let boundsCache: GalaxyMapGraphBounds | null = null;
let zoneIdsByZoneCache: Map<GalaxyMapZoneId, string[]> | null = null;
let zoneBySystemIdCache: Map<string, GalaxyMapZoneId> | null = null;

function resolveLegacySynthCount(): number {
  return Math.max(0, LEGACY_VISIBLE_TOTAL_SYSTEMS - GAMEPLAY_SYSTEM_IDS.size);
}

export function getGalaxyMapGraphBounds(): GalaxyMapGraphBounds {
  if (boundsCache) return boundsCache;
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const sys of Object.values(GALAXY_SYSTEMS)) {
    const x = sys.position.x;
    const y = sys.position.y;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  boundsCache = { minX, maxX, minY, maxY };
  return boundsCache;
}

export function resolveGalaxyMapZoneIdFromPosition(
  x: number,
  y: number,
  bounds: GalaxyMapGraphBounds = getGalaxyMapGraphBounds(),
): GalaxyMapZoneId {
  const spanX = bounds.maxX - bounds.minX;
  const spanY = bounds.maxY - bounds.minY;
  const nx = spanX <= 0 ? 0.5 : (x - bounds.minX) / spanX;
  const ny = spanY <= 0 ? 0.5 : (y - bounds.minY) / spanY;
  const col = Math.min(2, Math.max(0, Math.floor(nx * 3)));
  const row = Math.min(2, Math.max(0, Math.floor(ny * 3)));
  return ((row * 3 + col + 1) as GalaxyMapZoneId);
}

export function resolveGalaxyMapZoneIdForSystemId(systemId: string): GalaxyMapZoneId | null {
  const sys = GALAXY_SYSTEMS[systemId];
  if (!sys) return null;
  return resolveGalaxyMapZoneIdFromPosition(sys.position.x, sys.position.y);
}

function ensureZoneIndexes(): void {
  if (zoneIdsByZoneCache && zoneBySystemIdCache) return;
  const byZone = new Map<GalaxyMapZoneId, string[]>();
  const byId = new Map<string, GalaxyMapZoneId>();
  for (let z = 1; z <= 9; z += 1) {
    byZone.set(z as GalaxyMapZoneId, []);
  }
  const bounds = getGalaxyMapGraphBounds();
  for (const sys of Object.values(GALAXY_SYSTEMS)) {
    const zone = resolveGalaxyMapZoneIdFromPosition(sys.position.x, sys.position.y, bounds);
    byZone.get(zone)!.push(sys.id);
    byId.set(sys.id, zone);
  }
  zoneIdsByZoneCache = byZone;
  zoneBySystemIdCache = byId;
}

export function listGalaxyMapSystemIdsInZone(zoneId: GalaxyMapZoneId): readonly string[] {
  ensureZoneIndexes();
  return zoneIdsByZoneCache!.get(zoneId) ?? [];
}

export function isGalaxyMapEmptyCornerZone(zoneId: GalaxyMapZoneId): boolean {
  return (GALAXY_MAP_EMPTY_CORNER_ZONE_IDS as readonly number[]).includes(zoneId);
}

export function isGalaxyMapLoadableZone(zoneId: GalaxyMapZoneId): boolean {
  return (GALAXY_MAP_LOADABLE_ZONE_IDS as readonly number[]).includes(zoneId);
}

export function isGalaxyMapCenterResidentSystemId(systemId: string): boolean {
  if (GAMEPLAY_SYSTEM_IDS.has(systemId)) return true;
  const ord = parseSynthOrdinal(systemId);
  if (ord == null) return false;
  return ord <= resolveLegacySynthCount();
}

export function isGalaxyMapExpansionGatewaySystemId(systemId: string): boolean {
  const ord = parseSynthOrdinal(systemId);
  if (ord == null) return false;
  return isExpansionGatewayOrdinal(ord, resolveLegacySynthCount());
}

export function getGalaxyMapPrimaryGatewaySystemId(
  zoneId: GalaxyMapCardinalZoneId,
): string {
  return GALAXY_MAP_PRIMARY_GATEWAY_BY_ZONE[zoneId];
}

export function resolveGalaxyMapCardinalZoneForPrimaryGateway(
  systemId: string,
): GalaxyMapCardinalZoneId | null {
  const entries = Object.entries(GALAXY_MAP_PRIMARY_GATEWAY_BY_ZONE) as Array<
    [string, string]
  >;
  for (let i = 0; i < entries.length; i += 1) {
    const pair = entries[i]!;
    if (pair[1] === systemId) {
      return Number(pair[0]) as GalaxyMapCardinalZoneId;
    }
  }
  return null;
}

export const GALAXY_MAP_OPPOSITE_CARDINAL_ZONE: Record<
  GalaxyMapCardinalZoneId,
  GalaxyMapCardinalZoneId
> = {
  2: 8,
  8: 2,
  4: 6,
  6: 4,
};

export function isGalaxyMapCardinalZoneId(
  zoneId: number,
): zoneId is GalaxyMapCardinalZoneId {
  return zoneId === 2 || zoneId === 4 || zoneId === 6 || zoneId === 8;
}

/** 현재/선택 성계가 외곽 존에 있으면 그 존을 로드 트리거로 쓴다. 존 5는 상시라 null. */
export function resolveGalaxyMapCardinalZoneForLoadTrigger(
  systemId: string | null | undefined,
): GalaxyMapCardinalZoneId | null {
  if (!systemId) return null;
  const zone = resolveGalaxyMapZoneIdForSystemId(systemId);
  if (zone == null || !isGalaxyMapCardinalZoneId(zone)) return null;
  return zone;
}
