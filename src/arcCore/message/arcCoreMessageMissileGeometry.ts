import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../stages/planetMainStageLayout';
import { ARC_CORE_MESSAGE_VISUAL_SCALE, ARC_CORE_MESSAGE_WARHEAD_SCALE } from './arcCoreMessagePolicy';

export type ArcCoreMessageMissileBezier = {
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  p2: { x: number; y: number };
};

/**
 * 오른쪽 위 → 왼쪽 아래 대각선.
 * 제어점을 행성 림 바로 위로 스치게 해 거대 운석 근접 비껴감 연출(명중 없음).
 */
export function buildArcCoreMessageMissileBezier(
  orbitSize: number = PLANET_MAIN_ORBIT_SCENE_SIZE,
): ArcCoreMessageMissileBezier {
  const cx = orbitSize / 2;
  const cy = orbitSize / 2;
  const pad = orbitSize * 0.22;
  const planetVisualRadius = orbitSize * (120 / 320) * 0.5;
  return {
    p0: { x: orbitSize + pad * 1.05, y: -pad * 0.4 },
    p1: { x: cx + pad * 0.42, y: cy - planetVisualRadius - pad * 0.18 },
    p2: { x: -pad * 1.1, y: orbitSize + pad * 0.5 },
  };
}

export type ArcCoreMessageMissileViewportURange = {
  /** 뷰포트 안으로 처음 들어오는 u */
  uEnter: number;
  /** 뷰포트 밖으로 나가기 직전 u */
  uExit: number;
};

/**
 * 궤도 뷰포트(orbitSize 사각) 안에 머무는 u 구간.
 * p0는 화면 밖에서 시작하므로 u=0을 exit로 쓰면 탄두가 영원히 안 보인다.
 */
export function resolveArcCoreMessageMissileViewportURange(
  orbitSize: number = PLANET_MAIN_ORBIT_SCENE_SIZE,
  headMarginPx = 0,
): ArcCoreMessageMissileViewportURange {
  const bezier = buildArcCoreMessageMissileBezier(orbitSize);
  const inset = Math.max(0, headMarginPx);
  const minV = inset;
  const maxV = orbitSize - inset;
  let uEnter = 1;
  let uExit = 1;
  let everInside = false;
  let lastInsideU = 0;
  for (let i = 0; i <= 64; i += 1) {
    const u = i / 64;
    const p = quadBezierPoint(bezier.p0, bezier.p1, bezier.p2, u);
    const inside = p.x >= minV && p.x <= maxV && p.y >= minV && p.y <= maxV;
    if (inside) {
      if (!everInside) {
        uEnter = u;
        everInside = true;
      }
      lastInsideU = u;
      uExit = u;
    } else if (everInside) {
      uExit = lastInsideU;
      break;
    }
  }
  if (!everInside) {
    return { uEnter: 0, uExit: 1 };
  }
  return {
    uEnter: Math.max(0, uEnter),
    uExit: Math.min(1, Math.max(uEnter, uExit)),
  };
}

/** @deprecated — `resolveArcCoreMessageMissileViewportURange` 사용 */
export function resolveArcCoreMessageMissileViewportExitU(
  orbitSize: number = PLANET_MAIN_ORBIT_SCENE_SIZE,
  headMarginPx = 0,
): number {
  return resolveArcCoreMessageMissileViewportURange(orbitSize, headMarginPx).uExit;
}

/** 베지어·탄두가 궤도 사각 밖으로 나가는 만큼 Skia 캔버스 여백(px, 사방 동일) */
export function resolveArcCoreMessageMissileCanvasPadPx(
  orbitSize: number = PLANET_MAIN_ORBIT_SCENE_SIZE,
): number {
  const bezier = buildArcCoreMessageMissileBezier(orbitSize);
  const head = resolveArcCoreMeteorHeadRadiiPx(orbitSize);
  const slack = head.major * 3;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  for (let i = 0; i <= 20; i += 1) {
    const u = i / 20;
    const p = quadBezierPoint(bezier.p0, bezier.p1, bezier.p2, u);
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  const padLeft = Math.max(0, -minX);
  const padTop = Math.max(0, -minY);
  const padRight = Math.max(0, maxX - orbitSize);
  const padBottom = Math.max(0, maxY - orbitSize);
  return Math.max(padLeft, padTop, padRight, padBottom) + slack;
}

export type ArcCoreMessageClosestApproach = {
  u: number;
  point: { x: number; y: number };
  distancePx: number;
};

/** 행성 중심에 가장 가까운 베지어 매개변수 u — 스침·닷지 연출 기준점 */
export function resolveArcCoreMessageClosestApproach(
  bezier: ArcCoreMessageMissileBezier,
  planetCenter: { x: number; y: number },
  samples = 24,
): ArcCoreMessageClosestApproach {
  let bestU = 0.5;
  let bestD = Number.POSITIVE_INFINITY;
  let bestP = planetCenter;
  for (let i = 0; i <= samples; i += 1) {
    const u = i / samples;
    const p = quadBezierPoint(bezier.p0, bezier.p1, bezier.p2, u);
    const d = Math.hypot(p.x - planetCenter.x, p.y - planetCenter.y);
    if (d < bestD) {
      bestD = d;
      bestU = u;
      bestP = p;
    }
  }
  return { u: bestU, point: bestP, distancePx: bestD };
}

/** 탄두 타원 반경(px) — 고정 크기(비행 중 커졌다 작아지지 않음) */
export function resolveArcCoreMeteorHeadRadiiPx(orbitSize: number): { major: number; minor: number } {
  const scale = ARC_CORE_MESSAGE_VISUAL_SCALE * ARC_CORE_MESSAGE_WARHEAD_SCALE;
  const major = orbitSize * 0.055 * scale;
  return { major, minor: major * 0.72 };
}

/** 스침 구간(0..1) — 행성 대기권 링·근접 닷지 강도 */
export function resolveArcCoreMeteorScrapeIntensity(u: number, uClosest: number): number {
  const distU = Math.abs(u - uClosest);
  return Math.max(0, 1 - distU / 0.09);
}

export function quadBezierPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number,
): { x: number; y: number } {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

export function quadBezierTangentRad(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number,
): number {
  const u = 1 - t;
  const vx = 2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const vy = 2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  if (!Number.isFinite(vx) || !Number.isFinite(vy) || Math.hypot(vx, vy) < 1e-9) {
    return Math.atan2(p2.y - p0.y, p2.x - p0.x);
  }
  return Math.atan2(vy, vx);
}
