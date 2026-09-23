// ============================================================
// 은하 지도 존 분할 로딩 (Z 로드 세션)
//
// 존 5 상시. 관문/외곽 현재·선택 시 해당 방향만 로드.
// 반대 존은 히스테리시스 — 트리거가 반대가 되기 전에는 유지.
// 가시 노드(21+76+관문)·지도 bbox/스케일은 바꾸지 않는다.
// 미발견→미개척 표시(R1)는 이 모듈에서 하지 않는다. 안정화 이후 추후.
// ============================================================

import {
  GALAXY_MAP_CENTER_ZONE_ID,
  GALAXY_MAP_OPPOSITE_CARDINAL_ZONE,
  isGalaxyMapCardinalZoneId,
  resolveGalaxyMapCardinalZoneForLoadTrigger,
  resolveGalaxyMapZoneIdForSystemId,
  type GalaxyMapZoneId,
} from './galaxyMapZoneContract';

export const GALAXY_MAP_ZONE_LOAD_INITIAL: readonly GalaxyMapZoneId[] = [
  GALAXY_MAP_CENTER_ZONE_ID,
];

export const GALAXY_MAP_STARLIGHT_CONTENT_MARGIN_PX = 48;

export type GalaxyMapZoneLoadState = {
  loaded: readonly GalaxyMapZoneId[];
};

export function sameGalaxyMapZoneIdList(
  a: readonly GalaxyMapZoneId[],
  b: readonly GalaxyMapZoneId[],
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function sortGalaxyMapZoneIds(ids: Iterable<GalaxyMapZoneId>): GalaxyMapZoneId[] {
  const out: GalaxyMapZoneId[] = [];
  for (const id of ids) out.push(id);
  out.sort((a, b) => a - b);
  return out;
}

export function resolveGalaxyMapZoneLoadState(input: {
  currentSystemId: string | null;
  selectedSystemId: string | null;
  prevLoaded: readonly GalaxyMapZoneId[];
}): GalaxyMapZoneLoadState {
  const active = new Set<GalaxyMapZoneId>([GALAXY_MAP_CENTER_ZONE_ID]);
  const currentZone = resolveGalaxyMapCardinalZoneForLoadTrigger(input.currentSystemId);
  const selectedZone = resolveGalaxyMapCardinalZoneForLoadTrigger(input.selectedSystemId);
  if (currentZone) active.add(currentZone);
  if (selectedZone) active.add(selectedZone);

  const next = new Set<GalaxyMapZoneId>(active);
  for (let i = 0; i < input.prevLoaded.length; i += 1) {
    const zone = input.prevLoaded[i];
    if (zone == null || !isGalaxyMapCardinalZoneId(zone)) continue;
    if (active.has(zone)) continue;
    const opposite = GALAXY_MAP_OPPOSITE_CARDINAL_ZONE[zone];
    if (active.has(opposite)) continue;
    next.add(zone);
  }
  return { loaded: sortGalaxyMapZoneIds(next) };
}

/** 로드된 외곽 존 페이로드 + 현재 지도 SVG 안(클리핑과 동일) 별빛만. 화면 픽셀 불변. */
export function isHiddenSystemInGalaxyMapStarlightPayload(input: {
  systemId: string;
  loadedZoneIds: readonly GalaxyMapZoneId[];
  screenX: number;
  screenY: number;
  contentW: number;
  contentH: number;
  marginPx?: number;
}): boolean {
  const zone = resolveGalaxyMapZoneIdForSystemId(input.systemId);
  if (zone != null) {
    for (let i = 0; i < input.loadedZoneIds.length; i += 1) {
      if (input.loadedZoneIds[i] === zone) return true;
    }
  }
  const margin = input.marginPx ?? GALAXY_MAP_STARLIGHT_CONTENT_MARGIN_PX;
  return (
    input.screenX >= -margin
    && input.screenX <= input.contentW + margin
    && input.screenY >= -margin
    && input.screenY <= input.contentH + margin
  );
}
