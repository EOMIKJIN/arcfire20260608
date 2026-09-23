import type { StarSystem } from '../types';

/**
 * 미발견·이동안개 성계 별빛 배칭.
 * systemId 결정적 해시 — Math.random 금지. Path 컴포넌트 수는 색×opacity 상한.
 */

export const GALAXY_MAP_STARLIGHT_SHOW_PCT = 36;
/** 외곽 미발견 — 기존 3색 유지(해시 모듈로 회귀 방지) */
export const GALAXY_MAP_STARLIGHT_OUTER_COLORS = ['#eaf3ff', '#bfe0ff', '#93cdf2'] as const;
/** 이동 안개로 가린 성계 — 같은 계열 + 온기·보랏빛 */
export const GALAXY_MAP_STARLIGHT_FOG_COLORS = [
  '#eaf3ff',
  '#bfe0ff',
  '#93cdf2',
  '#d7ecff',
  '#a8c4e8',
  '#f3e0c4',
  '#e3c6f2',
] as const;
/** 5단 분포 유지 · 전체 ×1.3 (대표님 2026-09-12) */
export const GALAXY_MAP_STARLIGHT_OPACITY_BUCKETS = [0.08, 0.18, 0.3, 0.43, 0.59] as const;
export const GALAXY_MAP_STARLIGHT_STROKE_WIDTH = 1.3;
/** 전 지도 빈 구역 채움 — Path는 색×opacity 배칭이라 포인트만 증가 */
export const GALAXY_MAP_AMBIENT_STARLIGHT_COLS = 24;
export const GALAXY_MAP_AMBIENT_STARLIGHT_ROWS = 24;
/** 성계 노드와 겹치지 않게(정규화 좌표). 성계 최소거리 0.09보다 작게 */
export const GALAXY_MAP_AMBIENT_STARLIGHT_CLEARANCE = 0.038;

export function hashGalaxyMapStarlightId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type GalaxyMapStarlightPath = {
  key: string;
  d: string;
  color: string;
  opacity: number;
};

type StarlightSite = Pick<StarSystem, 'id' | 'position'>;

function appendStarlightSites(
  groups: Map<string, { color: string; opacity: number; parts: string[] }>,
  systems: readonly StarlightSite[],
  toScreen: (pos: { x: number; y: number }) => { x: number; y: number },
  colors: readonly string[],
  samplePct: number | null,
  seenIds: Set<string>,
): void {
  for (const s of systems) {
    const id = s.id;
    if (!id || seenIds.has(id)) continue;
    const h = hashGalaxyMapStarlightId(id);
    if (samplePct != null && h % 100 >= samplePct) continue;
    const p = toScreen(s.position);
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    seenIds.add(id);
    const color = colors[(h >>> 8) % colors.length]!;
    const opacity = GALAXY_MAP_STARLIGHT_OPACITY_BUCKETS[
      (h >>> 16) % GALAXY_MAP_STARLIGHT_OPACITY_BUCKETS.length
    ]!;
    const key = `${color}|${opacity}`;
    let group = groups.get(key);
    if (!group) {
      group = { color, opacity, parts: [] };
      groups.set(key, group);
    }
    group.parts.push(`M${p.x.toFixed(1)} ${p.y.toFixed(1)}l0.01 0`);
  }
}

/**
 * 성계가 없는 지도 전면(모서리 포함)에 결정적 지터 격자 별빛.
 * Math.random 금지. 성계 근처는 건너뛰어 노드·안개 별빛과 겹치지 않게 한다.
 */
export function buildGalaxyMapAmbientStarlightSites(input: {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  occupierPositions: readonly { x: number; y: number }[];
  padWorldX?: number;
  padWorldY?: number;
}): StarlightSite[] {
  const padX = Number.isFinite(input.padWorldX) ? Math.max(0, input.padWorldX as number) : 0;
  const padY = Number.isFinite(input.padWorldY) ? Math.max(0, input.padWorldY as number) : 0;
  const x0 = input.minX - padX;
  const y0 = input.minY - padY;
  const x1 = input.maxX + padX;
  const y1 = input.maxY + padY;
  const spanX = Math.max(x1 - x0, 0.001);
  const spanY = Math.max(y1 - y0, 0.001);
  const cols = GALAXY_MAP_AMBIENT_STARLIGHT_COLS;
  const rows = GALAXY_MAP_AMBIENT_STARLIGHT_ROWS;
  const cellW = spanX / cols;
  const cellH = spanY / rows;
  const clearance2 = GALAXY_MAP_AMBIENT_STARLIGHT_CLEARANCE * GALAXY_MAP_AMBIENT_STARLIGHT_CLEARANCE;
  const occupiers = input.occupierPositions;
  const out: StarlightSite[] = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const id = `ambient_${col}_${row}`;
      const h = hashGalaxyMapStarlightId(id);
      const jx = ((h & 0xff) / 255 - 0.5) * 0.72;
      const jy = (((h >>> 8) & 0xff) / 255 - 0.5) * 0.72;
      const x = x0 + (col + 0.5 + jx) * cellW;
      const y = y0 + (row + 0.5 + jy) * cellH;
      let tooClose = false;
      for (let i = 0; i < occupiers.length; i += 1) {
        const dx = occupiers[i]!.x - x;
        const dy = occupiers[i]!.y - y;
        if (dx * dx + dy * dy < clearance2) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;
      out.push({ id, position: { x, y } });
    }
  }
  return out;
}

function groupsToPaths(
  groups: Map<string, { color: string; opacity: number; parts: string[] }>,
): GalaxyMapStarlightPath[] {
  const out: GalaxyMapStarlightPath[] = [];
  let idx = 0;
  for (const [key, group] of groups) {
    if (group.parts.length === 0) continue;
    out.push({
      key: `starlight-${idx}-${key}`,
      d: group.parts.join(''),
      color: group.color,
      opacity: group.opacity,
    });
    idx += 1;
  }
  return out;
}

export function buildGalaxyMapStarlightPaths(input: {
  sampledSystems: readonly StarlightSite[];
  alwaysVisibleSystems?: readonly StarlightSite[];
  /** 성계 없는 전면 채움 — 존 컬링 없음 */
  fillSites?: readonly StarlightSite[];
  toScreen: (pos: { x: number; y: number }) => { x: number; y: number };
}): GalaxyMapStarlightPath[] {
  const groups = new Map<string, { color: string; opacity: number; parts: string[] }>();
  const seenIds = new Set<string>();
  // 안개 가림 성계를 먼저 — 외곽 샘플과 id가 겹치면 1별빛만
  appendStarlightSites(
    groups,
    input.alwaysVisibleSystems ?? [],
    input.toScreen,
    GALAXY_MAP_STARLIGHT_FOG_COLORS,
    null,
    seenIds,
  );
  appendStarlightSites(
    groups,
    input.sampledSystems,
    input.toScreen,
    GALAXY_MAP_STARLIGHT_OUTER_COLORS,
    GALAXY_MAP_STARLIGHT_SHOW_PCT,
    seenIds,
  );
  appendStarlightSites(
    groups,
    input.fillSites ?? [],
    input.toScreen,
    GALAXY_MAP_STARLIGHT_FOG_COLORS,
    null,
    seenIds,
  );
  return groupsToPaths(groups);
}
