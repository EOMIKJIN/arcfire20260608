export type GalaxyVoronoiClipBounds = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
};

/** 채움·국경선이 같은 클립을 쓰게 하는 공통 패딩 */
export const GALAXY_VORONOI_CLIP_PADDING_PX = 48;

/**
 * 영역 채움·국경선 Voronoi가 **같은 사각형**을 쓰도록 한다.
 * 호출부가 넘긴 mapBounds를 한쪽만 축소하면 변경 셀 모양이 어긋난다
 * (docs/GALAXY_VORONOI_FRONTIER_TERRITORY_FIX_DESIGN.md 원인 B).
 */
export function computeGalaxyVoronoiClipBounds(
  sites: readonly { x: number; y: number }[],
  mapBounds: GalaxyVoronoiClipBounds,
  padding = GALAXY_VORONOI_CLIP_PADDING_PX,
): GalaxyVoronoiClipBounds {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < sites.length; i += 1) {
    const s = sites[i]!;
    minX = Math.min(minX, s.x);
    minY = Math.min(minY, s.y);
    maxX = Math.max(maxX, s.x);
    maxY = Math.max(maxY, s.y);
  }
  if (!Number.isFinite(minX)) return mapBounds;
  return {
    x0: Math.max(mapBounds.x0, minX - padding),
    y0: Math.max(mapBounds.y0, minY - padding),
    x1: Math.min(mapBounds.x1, maxX + padding),
    y1: Math.min(mapBounds.y1, maxY + padding),
  };
}
