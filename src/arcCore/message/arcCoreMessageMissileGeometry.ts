import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../stages/planetMainStageLayout';
import {
  ARC_CORE_MESSAGE_VISUAL_SCALE,
  ARC_CORE_MESSAGE_VISUAL_SIZE_MUL,
  ARC_CORE_MESSAGE_WARHEAD_SCALE,
} from './arcCoreMessagePolicy';

// Inbound SSOT: bezier + resolveArcCoreInboundWarheadTopAnchor* → Skia·sim·요격.

/** `PlanetDot` size={120} — 궤도 씬 행성 도트 직경과 동기 */
export const PLANET_HUB_ORBIT_PLANET_DOT_DIAM_PX = 120;

export type ArcCoreMessageMissileBezier = {
  p0: { x: number; y: number };
  p1: { x: number; y: number };
  p2: { x: number; y: number };
};

/** 행성 허브 궤도 씬 — PlanetDot 반경(px) */
export function resolvePlanetHubOrbitPlanetVisualRadiusPx(
  orbitSize: number = PLANET_MAIN_ORBIT_SCENE_SIZE,
): number {
  return (PLANET_HUB_ORBIT_PLANET_DOT_DIAM_PX / 2) * (orbitSize / PLANET_MAIN_ORBIT_SCENE_SIZE);
}

export function resolvePlanetHubOrbitPlanetCenterPx(
  orbitSize: number = PLANET_MAIN_ORBIT_SCENE_SIZE,
): { x: number; y: number } {
  return { x: orbitSize / 2, y: orbitSize / 2 };
}

/** 행성 림 바로 위 여백(px) — PlanetDot(120) 기준 */
export function resolveArcCoreInboundWarheadRimClearancePx(
  orbitSize: number = PLANET_MAIN_ORBIT_SCENE_SIZE,
): number {
  const headMajor = resolveArcCoreMeteorHeadRadiiPx(orbitSize).major;
  return Math.max(20, headMajor * 2.4 + orbitSize * 0.04);
}

/** 행성 12시 정중앙 — x=중심, y=림+여백 */
export function resolveArcCoreInboundWarheadTopCenterPx(
  orbitSize: number = PLANET_MAIN_ORBIT_SCENE_SIZE,
): { x: number; y: number } {
  const { x: cx, y: cy } = resolvePlanetHubOrbitPlanetCenterPx(orbitSize);
  const rim = resolvePlanetHubOrbitPlanetVisualRadiusPx(orbitSize);
  const clearance = resolveArcCoreInboundWarheadRimClearancePx(orbitSize);
  return { x: cx, y: cy - rim - clearance };
}

/** dev·정적 inbound 꼬리 — p2=탄두(행성 12시), p0=우상단 진입. 꼬리 끝=탄두(u=1). */
export const ARC_CORE_STATIC_INBOUND_TRAIL_TAIL_U = 0.16;

export function buildArcCoreStaticInboundTrailBezier(
  orbitSize: number = PLANET_MAIN_ORBIT_SCENE_SIZE,
): ArcCoreMessageMissileBezier {
  const head = resolveArcCoreInboundWarheadTopCenterPx(orbitSize);
  const { x: cx } = resolvePlanetHubOrbitPlanetCenterPx(orbitSize);
  const pad = orbitSize * 0.22;
  return {
    p0: { x: orbitSize + pad * 1.05, y: -pad * 0.35 },
    p1: { x: cx + pad * 0.62, y: head.y - pad * 0.52 },
    p2: { x: head.x, y: head.y },
  };
}

export type ArcCoreInboundWarheadTopAnchor = {
  x: number;
  y: number;
  /** 꼬리·탄두 공통 베지어 끝(u=1) */
  u: number;
  visible: boolean;
};

/** dev·정적 — 탄두=행성 정중앙 위, 꼬리=trailBezier uTail→1 */
export function resolveArcCoreInboundWarheadTopAnchorWithTrailU(
  orbitSize: number = PLANET_MAIN_ORBIT_SCENE_SIZE,
): ArcCoreInboundWarheadTopAnchor {
  const head = resolveArcCoreInboundWarheadTopCenterPx(orbitSize);
  return { x: head.x, y: head.y, u: 1, visible: true };
}

/** uTail..1 구간 Skia Path — 탄두까지 단일 2차 곡선 */
export function writeArcCoreStaticInboundTrailSkiaPath(
  path: { moveTo: (x: number, y: number) => void; lineTo: (x: number, y: number) => void },
  orbitSize: number = PLANET_MAIN_ORBIT_SCENE_SIZE,
  uTail: number = ARC_CORE_STATIC_INBOUND_TRAIL_TAIL_U,
): boolean {
  const bezier = buildArcCoreStaticInboundTrailBezier(orbitSize);
  const uEnd = 1;
  const uStart = Math.max(0, Math.min(uTail, uEnd - 0.02));
  const span = uEnd - uStart;
  if (span < 0.01) return false;
  const q0 = quadBezierPoint(bezier.p0, bezier.p1, bezier.p2, uStart);
  path.moveTo(q0.x, q0.y);
  const steps = Math.min(36, Math.max(8, Math.ceil(10 + 26 * span)));
  for (let k = 1; k <= steps; k += 1) {
    const u = uStart + (span * k) / steps;
    const p = quadBezierPoint(bezier.p0, bezier.p1, bezier.p2, u);
    path.lineTo(p.x, p.y);
  }
  return true;
}

/** @deprecated — WithTrailU 사용 */
export function resolveArcCoreInboundWarheadTopAnchorPx(
  orbitSize: number = PLANET_MAIN_ORBIT_SCENE_SIZE,
): { x: number; y: number } {
  return resolveArcCoreInboundWarheadTopCenterPx(orbitSize);
}

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
  const planetVisualRadius = resolvePlanetHubOrbitPlanetVisualRadiusPx(orbitSize);
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
  let bestU = 0;
  let bestD = Number.POSITIVE_INFINITY;
  let bestP = quadBezierPoint(bezier.p0, bezier.p1, bezier.p2, 0);
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
  const scale =
    ARC_CORE_MESSAGE_VISUAL_SCALE * ARC_CORE_MESSAGE_WARHEAD_SCALE * ARC_CORE_MESSAGE_VISUAL_SIZE_MUL;
  const major = Math.max(10, orbitSize * 0.055 * scale);
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

/** inbound 시작 기준 ms → warhead (아크코어 베지어 위) */
export function resolveArcCoreInboundWarheadAtRelativeMs(
  relativeMs: number,
  inboundTravelMs: number,
  orbitSize: number = PLANET_MAIN_ORBIT_SCENE_SIZE,
): { x: number; y: number; u: number; visible: boolean } {
  const bezier = buildArcCoreMessageMissileBezier(orbitSize);
  const u = Math.min(1, Math.max(0, relativeMs / Math.max(1, inboundTravelMs)));
  const p = quadBezierPoint(bezier.p0, bezier.p1, bezier.p2, u);
  const { uEnter, uExit } = resolveArcCoreMessageMissileViewportURange(orbitSize);
  return { x: p.x, y: p.y, u, visible: u >= uEnter && u < uExit };
}

/** 절대 시각 → inbound warhead (요격·inbound Skia 공용 SSOT) */
export function resolveArcCoreInboundWarheadAtMs(
  clockMs: number,
  inboundStartMs: number,
  travelMs: number,
  orbitSize: number = PLANET_MAIN_ORBIT_SCENE_SIZE,
): { x: number; y: number; u: number; visible: boolean } {
  return resolveArcCoreInboundWarheadAtRelativeMs(
    clockMs - inboundStartMs,
    travelMs,
    orbitSize,
  );
}

/** 요격탄 vs inbound 탄두 충돌 반경(px) — 탄두 이미지 대비 여유 */
export function resolveDefenseInterceptCollisionRadiusPx(
  orbitSize: number = PLANET_MAIN_ORBIT_SCENE_SIZE,
): number {
  const warheadMajor = resolveArcCoreMeteorHeadRadiiPx(orbitSize).major;
  const interceptHeadMajor = 2.2 * 2;
  return Math.max(52, warheadMajor * 2.5 + interceptHeadMajor * 2);
}

/** 충돌 판정용 inbound 탄두 가시성 — viewport uEnter/uExit ± margin */
export function isInboundWarheadCollisionEligible(
  warhead: { u: number; visible: boolean },
  orbitSize: number = PLANET_MAIN_ORBIT_SCENE_SIZE,
  uMargin = 0.04,
): boolean {
  if (warhead.visible) return true;
  const { uEnter, uExit } = resolveArcCoreMessageMissileViewportURange(orbitSize);
  return warhead.u >= uEnter - uMargin && warhead.u <= uExit + uMargin;
}
