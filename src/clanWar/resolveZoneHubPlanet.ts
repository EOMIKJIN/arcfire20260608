// ============================================================
// 구역(안전/중립/PvP)별 **플레이 성계** 기하학적 중심에 가장 가까운 허브 행성
// — 코어 개방(A+B) 성계만 — 합성 미개척(C) 제외
// ============================================================

import type { StarSystem, ZoneType } from '../types';
import { isCoreOpenSystemId } from '../world/coreOpenGameplayPlanets';

/** 클랜전 AI 거점에 쓰는 구역(엔드게임은 별도 콘텐츠로 미포함) */
export type ClanWarHubZone = Extract<ZoneType, 'safe' | 'neutral' | 'pvp'>;

function centroid2(points: { x: number; y: number }[]): { x: number; y: number } {
  if (!points.length) return { x: 0.5, y: 0.5 };
  let sx = 0;
  let sy = 0;
  for (const p of points) {
    sx += p.x;
    sy += p.y;
  }
  return { x: sx / points.length, y: sy / points.length };
}

function dist2(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

/**
 * 주어진 은하 `systems` 스냅샷에서 해당 구역의 플레이 성계 좌표 무게중심에 가장 가까운 성계의
 * **첫 번째 행성**을 클랜 기지 후보로 반환.
 */
export function resolveGameplayZoneHubPlanet(
  systems: Record<string, StarSystem>,
  zone: ClanWarHubZone,
): { systemId: string; planetId: string } | null {
  const list = Object.values(systems).filter((s) => isCoreOpenSystemId(s.id) && s.zone === zone);
  if (!list.length) return null;
  const c = centroid2(list.map((s) => s.position));
  let best: StarSystem | null = null;
  let bestD = Infinity;
  for (const s of list) {
    const d = dist2(s.position, c);
    if (d < bestD) {
      bestD = d;
      best = s;
    }
  }
  const p0 = best?.planets[0];
  if (!best || !p0) return null;
  return { systemId: best.id, planetId: p0.id };
}
