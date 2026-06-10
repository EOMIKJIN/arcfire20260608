// ============================================================
// 실시간 전함 궤도 — Skia 단일 Canvas (sim ref 직독)
// 구조: 시뮬 틱마다 PictureRecorder로 SkPicture 1장만 기록 → React 자식은 <Picture> 1개로 고정.
//      (기존: useReducer force로 수백 노드 Skia-DOM 리컨실 / 프레임당 GC·비용 누적)
// 메모리: 미사일·함선 마름모는 Path 풀에서 rewind 후 재사용, 풀에서 제거 시 SkPath.dispose().
// ============================================================

import React, { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Canvas,
  PaintStyle,
  Picture,
  Skia,
  StrokeCap,
  StrokeJoin,
} from '@shopify/react-native-skia';
import type { SkPaint } from '@shopify/react-native-skia';
import type { SkPicture } from '@shopify/react-native-skia';
import { FONTS } from '../../utils/theme';
import {
  isNovaAoeWeapon,
  isRocketFamilyWeapon,
  resolveCapitalLaserBeamPresentation,
  resolveCapitalProjectilePresentation,
} from '../../combat/capitalWeaponPipeline';
import type { Agent, Missile, PlanetEdenRaidSim } from './PlanetEdenRaidTestLayer';

const ALLY_MARK_HALF = 7;
const DIAMOND_HEADING_OFFSET_DEG = 90;
const DEBUG_CAPITAL_BOW_LINE_PX = 22;
const LASER_DURATION_MS = 320;
const LASER_BOLT_TRAVEL_MS_FALLBACK = 26;
const LASER_FADE_START_MS = 170;
const LASER_MUZZLE_FORWARD_PX = ALLY_MARK_HALF + 3;
const CAPITAL_ATTACK_ARC_COS_HALF = 0.5;
const MISSILE_TRAIL_FADE_MS = 2000;
const MISSILE_INFLIGHT_TRAIL_WINDOW_U = 0.78;
const MISSILE_TRAIL_GLOW_STROKE_MUL = 2.4;
const MISSILE_TRAIL_GLOW_OPACITY_MUL = 0.42;
const MISSILE_TRAIL_MAIN_PASS_ENABLED = false; // 임시 시각 확인용
const MISSILE_HEAD_DOT_RADIUS = 1.15;
const NOVA_HEAD_MAJOR_RADIUS = MISSILE_HEAD_DOT_RADIUS * 2;
const NOVA_HEAD_MINOR_RADIUS = MISSILE_HEAD_DOT_RADIUS * 1.35;
const BEZIER_SAMPLES = 16;
const MISSILE_MAX_TRAIL_SEGMENTS = 10;
const DESTROY_FX_DURATION_MS = 1100;
const DESTROY_FX_PARTICLES = 10;
const NOVA_TELEGRAPH_DURATION_MS = 420;
const NOVA_EFFECT_RADIUS_ORBIT_MUL = 0.25; // 지름=전투영역 가로 1/2
type Pt = { x: number; y: number };
type SkPath = ReturnType<typeof Skia.Path.Make>;

type CombatSkiaPoolBundle = {
  missileTrail: Map<number, SkPath>;
  diamond: Map<number, SkPath>;
  novaHead: Map<number, SkPath>;
  /** 미사일 id → atan2 불연속(±π) 제거용 연속 접선 각 */
  novaTangentStable: Map<number, number>;
};

function createCombatSkiaPoolBundle(): CombatSkiaPoolBundle {
  return {
    missileTrail: new Map(),
    diamond: new Map(),
    novaHead: new Map(),
    novaTangentStable: new Map(),
  };
}

function finiteNum(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

type CombatOrbitVfxBudget = {
  missileSegmentBudget: number;
  bezierSampleCap: number;
  renderLaserGlow: boolean;
  missileHeadDotEnabled: boolean;
};

function quadBezier(p0: Pt, p1: Pt, p2: Pt, t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

/** Quadratic Bézier 접선 각 — 탄두(타원) 장축을 실제 비행 방향에 맞출 때 사용. `p0→p2` 직선 각과 다르면 곡선 구간에서 “좌우 흔들림”처럼 보임. */
function quadBezierTangentRad(p0: Pt, p1: Pt, p2: Pt, t: number): number {
  const u = 1 - t;
  const vx = 2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const vy = 2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  if (!Number.isFinite(vx) || !Number.isFinite(vy) || Math.hypot(vx, vy) < 1e-9) {
    return Math.atan2(p2.y - p0.y, p2.x - p0.x);
  }
  return Math.atan2(vy, vx);
}

function clampPointToward(from: Pt, to: Pt, maxDist: number): Pt {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const d = Math.hypot(dx, dy);
  if (d <= maxDist + 1e-6) return { x: to.x, y: to.y };
  if (d < 1e-9) return { x: from.x, y: from.y };
  const s = maxDist / d;
  return { x: from.x + dx * s, y: from.y + dy * s };
}

function laserMuzzleFromAgent(ag: { x: number; y: number; headingRad: number }): Pt {
  const u = { x: Math.cos(ag.headingRad), y: Math.sin(ag.headingRad) };
  return {
    x: ag.x + u.x * LASER_MUZZLE_FORWARD_PX,
    y: ag.y + u.y * LASER_MUZZLE_FORWARD_PX,
  };
}

function targetInCapitalFrontAttackArc(
  attacker: { x: number; y: number; headingRad: number },
  target: Pt,
): boolean {
  const dx = target.x - attacker.x;
  const dy = target.y - attacker.y;
  const d = Math.hypot(dx, dy);
  if (d < 1e-9) return false;
  const ux = dx / d;
  const uy = dy / d;
  const fx = Math.cos(attacker.headingRad);
  const fy = Math.sin(attacker.headingRad);
  return ux * fx + uy * fy >= CAPITAL_ATTACK_ARC_COS_HALF - 1e-7;
}

function currentTargetAliveByBuf(self: Agent, idBuf: (Agent | undefined)[]): Agent | null {
  const tid = self.currentTargetAgentId;
  if (tid === null) return null;
  const t = idBuf[tid];
  if (!t?.alive) return null;
  if (self.team !== 'orange' && t.team === self.team) return null;
  if (self.team === 'orange' && t.id === self.id) return null;
  return t;
}

function resolveCombatOrbitVfxBudget(
  _agentCount: number,
  _approxActiveMissiles: number,
  _fpsNow: number,
): CombatOrbitVfxBudget {
  // Skia 전투 오버레이는 표현 축소 없이 항상 풀옵션 렌더를 유지한다.
  return {
    missileSegmentBudget: MISSILE_MAX_TRAIL_SEGMENTS,
    bezierSampleCap: BEZIER_SAMPLES,
    renderLaserGlow: true,
    missileHeadDotEnabled: true,
  };
}

function destroyFxParticlePoint(agent: Agent, t01: number, idx: number): Pt {
  const base = (idx / DESTROY_FX_PARTICLES) * Math.PI * 2 + agent.id * 0.37;
  const drift = 16 + idx * 2.2;
  const slowT = Math.pow(Math.min(1, Math.max(0, t01)), 1.65);
  return {
    x: agent.x + Math.cos(base) * drift * slowT,
    y: agent.y + Math.sin(base) * drift * slowT,
  };
}

function buildLaserBolt(
  ag: Agent,
  idBuf: (Agent | undefined)[],
  tMs: number,
): {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
  coreColor: string;
  glowColor: string;
  glowWidthMul: number;
} | null {
  const other = currentTargetAliveByBuf(ag, idBuf);
  if (!other?.alive) return null;
  const dist = Math.hypot(other.x - ag.x, other.y - ag.y);
  if (dist > ag.laserEngageRangePx || !targetInCapitalFrontAttackArc(ag, other)) return null;
  const laserT = tMs - ag.lastLaserStartMs;
  if (laserT < 0 || laserT >= LASER_DURATION_MS) return null;
  const muzzle = laserMuzzleFromAgent(ag);
  const targetEnd = clampPointToward({ x: ag.x, y: ag.y }, { x: other.x, y: other.y }, ag.laserEngageRangePx);
  const tx = targetEnd.x - muzzle.x;
  const ty = targetEnd.y - muzzle.y;
  const td = Math.hypot(tx, ty);
  if (td < 1e-9) return null;
  const boltU = Math.min(1, laserT / Math.max(1, ag.laserBoltTravelMs || LASER_BOLT_TRAVEL_MS_FALLBACK));
  const reach = td * boltU;
  const ux = tx / td;
  const uy = ty / td;
  const x2 = muzzle.x + ux * reach;
  const y2 = muzzle.y + uy * reach;
  let opacity = 0.97;
  if (laserT >= LASER_FADE_START_MS) {
    opacity *= Math.max(
      0,
      1 - (laserT - LASER_FADE_START_MS) / Math.max(1, LASER_DURATION_MS - LASER_FADE_START_MS),
    );
  }
  const laserVis = resolveCapitalLaserBeamPresentation(ag.laserWeaponId);
  return {
    x1: muzzle.x,
    y1: muzzle.y,
    x2,
    y2,
    opacity,
    coreColor: laserVis.coreColor,
    glowColor: laserVis.glowColor,
    glowWidthMul: laserVis.glowWidthMul,
  };
}

function resetPath(path: SkPath): void {
  const anyPath = path as unknown as { rewind?: () => void; reset?: () => void };
  if (typeof anyPath.rewind === 'function') anyPath.rewind();
  else if (typeof anyPath.reset === 'function') anyPath.reset();
}

function disposeSkiaPath(path: SkPath | undefined): void {
  if (!path) return;
  try {
    const d = (path as unknown as { dispose?: () => void }).dispose;
    if (typeof d === 'function') d.call(path);
  } catch {
    /* 네이티브 객체 해제 실패 무시 */
  }
}

function disposePathPool(map: Map<number, SkPath>): void {
  for (const p of map.values()) disposeSkiaPath(p);
  map.clear();
}

/**
 * `<Picture picture={skPicture} />`가 네이티브에서 아직 참조 중인데 JS에서 dispose 하면
 * "Missing … picture" / JSI 타입 오류가 난다. 단일 rAF만으로는 저FPS·백그라운드 복귀·장시간 전투 후에도 레이스가 남을 수 있어
 * 이중 rAF + 짧은 지연 뒤 dispose 한다.
 */
function scheduleSkPictureDispose(pic: SkPicture | null): void {
  if (!pic) return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        try {
          pic.dispose();
        } catch {
          /* 이미 dispose 또는 네이티브 핸들 무효 */
        }
      }, 48);
    });
  });
}

function writeDiamondPath(path: SkPath, cx: number, cy: number, headingRad: number, h: number) {
  resetPath(path);
  const ang = headingRad + (DIAMOND_HEADING_OFFSET_DEG * Math.PI) / 180;
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const local: Pt[] = [
    { x: 0, y: -h },
    { x: h, y: 0 },
    { x: 0, y: h },
    { x: -h, y: 0 },
  ];
  const w0 = {
    x: cx + local[0]!.x * c - local[0]!.y * s,
    y: cy + local[0]!.x * s + local[0]!.y * c,
  };
  path.moveTo(w0.x, w0.y);
  for (let i = 1; i < local.length; i++) {
    const lx = local[i]!.x;
    const ly = local[i]!.y;
    path.lineTo(cx + lx * c - ly * s, cy + lx * s + ly * c);
  }
  path.close();
}

/** 노바 탄두: 비행 접선 방향으로 회전한 타원을 Path에 직접 기록(Group transform 미사용 → 피벗/정렬로 인한 ‘튐’ 방지). */
function writeNovaHeadOvalAlongTangent(
  path: SkPath,
  cx: number,
  cy: number,
  tangentRad: number,
  rxAlong: number,
  ryPerp: number,
) {
  resetPath(path);
  const tc = Math.cos(tangentRad);
  const ts = Math.sin(tangentRad);
  const seg = 14;
  for (let i = 0; i <= seg; i += 1) {
    const phi = (i / seg) * Math.PI * 2;
    const lx = rxAlong * Math.cos(phi);
    const ly = ryPerp * Math.sin(phi);
    const wx = cx + lx * tc - ly * ts;
    const wy = cy + lx * ts + ly * tc;
    if (i === 0) path.moveTo(wx, wy);
    else path.lineTo(wx, wy);
  }
  path.close();
}

/** `atan2` 분기(±π) 때문에 인접 프레임에서 각이 π만큼 튀는 현상 제거 — 접선 방향의 연속 각 누적. */
function unwrapTangentAdjacent(prev: number, atan2Raw: number): number {
  let d = atan2Raw - prev;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return prev + d;
}

function makeMissileTrailPath(
  m: Missile,
  tMs: number,
  missileSegmentBudget: number,
  bezierSampleCap: number,
  path: SkPath,
): {
  path: SkPath;
  head: Pt;
  headOpacity: number;
  trailOpacity: number;
  headVisible: boolean;
  visible: boolean;
} {
  resetPath(path);
  const tSince = tMs - m.startMs;
  const lifeEnd = m.travelMs + MISSILE_TRAIL_FADE_MS;
  if (tSince >= lifeEnd) {
    return {
      path,
      head: { x: 0, y: 0 },
      headOpacity: 0,
      trailOpacity: 0,
      headVisible: false,
      visible: false,
    };
  }
  const p0 = m.p0;
  const p1 = m.p1;
  const p2 = m.p2;
  const uFlight = Math.min(1, tSince / Math.max(1, m.travelMs));
  const tailStartAtImpact = Math.max(0, 1 - MISSILE_INFLIGHT_TRAIL_WINDOW_U);
  let uHead: number;
  let uTail: number;
  if (tSince < m.travelMs) {
    uHead = uFlight;
    uTail = Math.max(0, uHead - MISSILE_INFLIGHT_TRAIL_WINDOW_U);
  } else {
    uHead = 1;
    const postHitFade = Math.min(1, (tSince - m.travelMs) / MISSILE_TRAIL_FADE_MS);
    uTail = tailStartAtImpact + (1 - tailStartAtImpact) * postHitFade;
  }
  const span = uHead - uTail;
  let trailOpacity = 0.9;
  const headOpacity = 0.98;
  if (tSince >= m.travelMs) {
    const postHitT01 = Math.min(1, (tSince - m.travelMs) / Math.max(1, MISSILE_TRAIL_FADE_MS));
    // 명중 이후에는 길이 축소 + 알파 감쇠를 동시에 적용해 잔류 체감을 제거
    trailOpacity *= Math.max(0, 1 - Math.pow(postHitT01, 0.85));
  }
  const n = Math.max(2, Math.min(missileSegmentBudget, Math.ceil(bezierSampleCap * Math.max(span, 0.004))));
  if (span >= 0.004) {
    const q0 = quadBezier(p0, p1, p2, uTail);
    path.moveTo(q0.x, q0.y);
    for (let k = 1; k <= n; k++) {
      const t = uTail + (k / n) * span;
      const q = quadBezier(p0, p1, p2, t);
      path.lineTo(q.x, q.y);
    }
  }
  // 탄두는 항상 궤적 선두(uHead)에 고정한다.
  // (중간 샘플점 사용 시 "끝까지 안 날아감"처럼 보이는 시각 오해가 발생)
  const head = quadBezier(p0, p1, p2, uHead);
  const headVisible = tSince < m.travelMs;
  const visible = trailOpacity > 0.01 && (span >= 0.004 || headVisible);
  return { path, head, headOpacity, trailOpacity, headVisible, visible };
}

/** 풀 동기화만 전역 스크래치 Set 사용(JS 단일 스레드·전투 틱 직렬 전제). */
const SCRATCH_MISSILE_IDS_SYNC = new Set<number>();
const SCRATCH_AGENT_IDS_SYNC = new Set<number>();

let SK_PAINT_STROKE: SkPaint | null = null;
let SK_PAINT_FILL: SkPaint | null = null;

function scratchStrokePaint(): SkPaint {
  if (!SK_PAINT_STROKE) SK_PAINT_STROKE = Skia.Paint();
  return SK_PAINT_STROKE;
}

function scratchFillPaint(): SkPaint {
  if (!SK_PAINT_FILL) SK_PAINT_FILL = Skia.Paint();
  return SK_PAINT_FILL;
}

function syncCombatSkiaPoolsFromSim(
  missiles: Missile[],
  agents: Agent[],
  pools: CombatSkiaPoolBundle,
): void {
  const activeMissileIds = SCRATCH_MISSILE_IDS_SYNC;
  activeMissileIds.clear();
  for (let i = 0; i < missiles.length; i++) {
    activeMissileIds.add(missiles[i]!.id);
  }
  const activeAgentIds = SCRATCH_AGENT_IDS_SYNC;
  activeAgentIds.clear();
  for (let i = 0; i < agents.length; i++) {
    activeAgentIds.add(agents[i]!.id);
  }
  const missileTrailPoolSync = pools.missileTrail;
  for (const id of missileTrailPoolSync.keys()) {
    if (!activeMissileIds.has(id)) {
      disposeSkiaPath(missileTrailPoolSync.get(id));
      missileTrailPoolSync.delete(id);
      pools.novaTangentStable.delete(id);
    }
  }
  const novaHeadPoolSync = pools.novaHead;
  for (const id of novaHeadPoolSync.keys()) {
    if (!activeMissileIds.has(id)) {
      disposeSkiaPath(novaHeadPoolSync.get(id));
      novaHeadPoolSync.delete(id);
      pools.novaTangentStable.delete(id);
    }
  }
  const diamondPoolSync = pools.diamond;
  for (const id of diamondPoolSync.keys()) {
    if (!activeAgentIds.has(id)) {
      disposeSkiaPath(diamondPoolSync.get(id));
      diamondPoolSync.delete(id);
    }
  }
}

function strokePaint(
  colorCss: string,
  strokeWidth: number,
  alphaMul: number,
  join: StrokeJoin = StrokeJoin.Round,
  cap: StrokeCap = StrokeCap.Round,
): SkPaint {
  const p = scratchStrokePaint();
  p.reset();
  p.setAntiAlias(true);
  p.setStyle(PaintStyle.Stroke);
  p.setStrokeWidth(strokeWidth);
  p.setStrokeJoin(join);
  p.setStrokeCap(cap);
  // SkColor는 Float32Array — CSS 문자열은 Skia.Color()로 변환해야 함(문자열 그대로 넘기면 JSI 타입 오류).
  p.setColor(Skia.Color(colorCss));
  if (alphaMul !== 1) {
    p.setAlphaf(Math.max(0, Math.min(1, p.getAlphaf() * alphaMul)));
  }
  return p;
}

function fillPaint(colorCss: string, alphaMul: number): SkPaint {
  const p = scratchFillPaint();
  p.reset();
  p.setAntiAlias(true);
  p.setStyle(PaintStyle.Fill);
  p.setColor(Skia.Color(colorCss));
  if (alphaMul !== 1) {
    p.setAlphaf(Math.max(0, Math.min(1, p.getAlphaf() * alphaMul)));
  }
  return p;
}

/** 한 틱 분량을 SkPicture로 기록 — React에는 Picture 노드만 넘긴다. */
function recordCombatOrbitPicture(
  sim: PlanetEdenRaidSim,
  pools: CombatSkiaPoolBundle,
  orbitSize: number,
): SkPicture {
  const tMs = sim.tMsRef.current;
  const agents = sim.agentsRef.current;
  const missiles = sim.missilesRef.current;
  const idBuf = sim.agentByIdSparseRef.current;

  syncCombatSkiaPoolsFromSim(missiles, agents, pools);

  const vfx = resolveCombatOrbitVfxBudget(agents.length, missiles.length, sim.fpsRef.current);

  const recorder = Skia.PictureRecorder();
  const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, orbitSize, orbitSize));

  const draw = {
    pathStroke(
      path: SkPath,
      colorCss: string,
      width: number,
      opacityMul: number,
      join = StrokeJoin.Round,
      cap = StrokeCap.Round,
    ) {
      canvas.drawPath(path, strokePaint(colorCss, width, opacityMul, join, cap));
    },
    line(x0: number, y0: number, x1: number, y1: number, colorCss: string, width: number, opacityMul: number) {
      canvas.drawLine(x0, y0, x1, y1, strokePaint(colorCss, width, opacityMul, StrokeJoin.Round, StrokeCap.Round));
    },
    circle(cx: number, cy: number, r: number, colorCss: string, mode: 'fill' | 'stroke', strokeW?: number, opacityMul = 1) {
      if (mode === 'fill') {
        canvas.drawCircle(cx, cy, r, fillPaint(colorCss, opacityMul));
      } else {
        const w = strokeW ?? 1;
        canvas.drawCircle(cx, cy, r, strokePaint(colorCss, w, opacityMul, StrokeJoin.Round, StrokeCap.Round));
      }
    },
  };

  for (let mi = 0; mi < missiles.length; mi++) {
    const m = missiles[mi]!;
    if (
      !finiteNum(m.p0.x) ||
      !finiteNum(m.p0.y) ||
      !finiteNum(m.p1.x) ||
      !finiteNum(m.p1.y) ||
      !finiteNum(m.p2.x) ||
      !finiteNum(m.p2.y)
    ) {
      continue;
    }
    const missileTrailPool = pools.missileTrail;
    const missilePath =
      missileTrailPool.get(m.id) ??
      (() => {
        const created = Skia.Path.Make();
        missileTrailPool.set(m.id, created);
        return created;
      })();
    const trail = makeMissileTrailPath(m, tMs, vfx.missileSegmentBudget, vfx.bezierSampleCap, missilePath);
    if (!trail.visible) continue;

    const tSince = tMs - m.startMs;
    const isRocket = isRocketFamilyWeapon(m.missileWeaponId);
    const isNovaLocked = isNovaAoeWeapon(m.missileWeaponId);
    const projectileVis = resolveCapitalProjectilePresentation(m.missileWeaponId);
    const showNovaTelegraph =
      isNovaLocked &&
      tSince >= 0 &&
      tSince <= NOVA_TELEGRAPH_DURATION_MS &&
      finiteNum(m.p2.x) &&
      finiteNum(m.p2.y);
    const novaRadius = orbitSize * NOVA_EFFECT_RADIUS_ORBIT_MUL;

    if (showNovaTelegraph) {
      draw.circle(m.p2.x, m.p2.y, novaRadius, 'rgba(220,38,38,0.12)', 'fill', undefined, 1);
      draw.circle(m.p2.x, m.p2.y, novaRadius, 'rgba(239,68,68,0.88)', 'stroke', 1.35, 1);
    }

    draw.pathStroke(
      trail.path,
      projectileVis.trailGlowColor,
      1 * MISSILE_TRAIL_GLOW_STROKE_MUL,
      trail.trailOpacity * MISSILE_TRAIL_GLOW_OPACITY_MUL,
    );
    if (MISSILE_TRAIL_MAIN_PASS_ENABLED) {
      draw.pathStroke(
        trail.path,
        projectileVis.trailColor,
        isRocket ? 1.35 : 1,
        trail.trailOpacity,
      );
    }

    const drawNovaHead =
      vfx.missileHeadDotEnabled &&
      trail.headVisible &&
      finiteNum(trail.head.x) &&
      finiteNum(trail.head.y) &&
      isNovaLocked;

    if (drawNovaHead) {
      const uProg = Math.min(1, Math.max(0, tSince / Math.max(1, m.travelMs)));
      const rawTan = quadBezierTangentRad(m.p0, m.p1, m.p2, uProg);
      const stableMap = pools.novaTangentStable;
      const prev = stableMap.get(m.id);
      const stableTan =
        prev === undefined || !Number.isFinite(prev) ? rawTan : unwrapTangentAdjacent(prev, rawTan);
      stableMap.set(m.id, stableTan);
      const novaHeadPool = pools.novaHead;
      const ovalPath =
        novaHeadPool.get(m.id) ??
        (() => {
          const created = Skia.Path.Make();
          novaHeadPool.set(m.id, created);
          return created;
        })();
      writeNovaHeadOvalAlongTangent(
        ovalPath,
        trail.head.x,
        trail.head.y,
        stableTan,
        NOVA_HEAD_MAJOR_RADIUS,
        NOVA_HEAD_MINOR_RADIUS,
      );
      canvas.drawPath(ovalPath, fillPaint('rgba(255,158,72,0.98)', trail.headOpacity));
    } else if (
      vfx.missileHeadDotEnabled &&
      trail.headVisible &&
      finiteNum(trail.head.x) &&
      finiteNum(trail.head.y)
    ) {
      const headR = MISSILE_HEAD_DOT_RADIUS * projectileVis.headRadiusMul;
      draw.circle(
        trail.head.x,
        trail.head.y,
        headR,
        projectileVis.headColor,
        'fill',
        undefined,
        trail.headOpacity,
      );
    }
  }

  for (let ai = 0; ai < agents.length; ai++) {
    const ag = agents[ai]!;
    if (!finiteNum(ag.x) || !finiteNum(ag.y) || !finiteNum(ag.headingRad)) continue;
    const destroyedForMs = tMs - ag.lastDestroyedAtMs;
    const showDestroyFx =
      !ag.alive && destroyedForMs >= 0 && destroyedForMs < DESTROY_FX_DURATION_MS;
    if (!ag.alive && !showDestroyFx) continue;

    const bolt = buildLaserBolt(ag, idBuf, tMs);
    if (bolt) {
      if (vfx.renderLaserGlow) {
        draw.line(
          bolt.x1,
          bolt.y1,
          bolt.x2,
          bolt.y2,
          bolt.glowColor,
          2.2 * bolt.glowWidthMul,
          bolt.opacity * 0.35,
        );
      }
      draw.line(bolt.x1, bolt.y1, bolt.x2, bolt.y2, bolt.coreColor, 0.85 * bolt.glowWidthMul, bolt.opacity);
    }

    if (ag.alive) {
      const diamondPool = pools.diamond;
      const dPath =
        diamondPool.get(ag.id) ??
        (() => {
          const created = Skia.Path.Make();
          diamondPool.set(ag.id, created);
          return created;
        })();
      writeDiamondPath(dPath, ag.x, ag.y, ag.headingRad, ALLY_MARK_HALF);
      draw.pathStroke(dPath, ag.stroke, 2.5, 0.98, StrokeJoin.Miter, StrokeCap.Round);

      const bx = ag.x + Math.cos(ag.headingRad) * DEBUG_CAPITAL_BOW_LINE_PX;
      const by = ag.y + Math.sin(ag.headingRad) * DEBUG_CAPITAL_BOW_LINE_PX;
      draw.line(ag.x, ag.y, bx, by, ag.stroke, 1.35, 0.9);
    } else if (showDestroyFx) {
      const t01 = Math.min(1, destroyedForMs / DESTROY_FX_DURATION_MS);
      const fade = 1 - Math.pow(t01, 1.25);
      const strokeCol = typeof ag.stroke === 'string' && ag.stroke.length > 0 ? ag.stroke : '#94A3B8';
      for (let i = 0; i < DESTROY_FX_PARTICLES; i++) {
        const pt = destroyFxParticlePoint(ag, t01, i);
        const rad = Math.max(0.2, 1.1 - t01 * 0.8);
        draw.circle(pt.x, pt.y, rad, strokeCol, 'fill', undefined, 0.9 * fade);
      }
    }
  }

  return recorder.finishRecordingAsPicture();
}

export const PlanetEdenRaidOrbitSkiaCombat = memo(function PlanetEdenRaidOrbitSkiaCombat({
  sim,
}: {
  sim: PlanetEdenRaidSim;
}) {
  const mountedRef = useRef(true);
  const orbitSizeRef = useRef(0);
  const picLiveRef = useRef<SkPicture | null>(null);
  /** Path 풀·노바 접선 맵을 한 객체에 유지 — 분리 ref 시 HMR/번들 불일치로 런타임 ReferenceError·Skia SIGSEGV로 이어진 사례 방지 */
  const poolsRef = useRef<CombatSkiaPoolBundle | null>(null);
  if (poolsRef.current === null) {
    poolsRef.current = createCombatSkiaPoolBundle();
  }
  const pools = poolsRef.current;

  const [picture, setPicture] = useState<SkPicture | null>(null);

  const orbitSizeRaw = sim.orbitSize;
  const orbitSize = Math.max(0, Math.floor(finiteNum(orbitSizeRaw) ? orbitSizeRaw : 0));
  orbitSizeRef.current = orbitSize;

  useEffect(() => {
    mountedRef.current = true;
    const pushFrame = () => {
      if (!mountedRef.current) return;
      const orbitSz = orbitSizeRef.current;
      if (orbitSz < 1) return;
      const next = recordCombatOrbitPicture(sim, pools, orbitSz);
      const prev = picLiveRef.current;
      picLiveRef.current = next;
      setPicture(next);
      if (prev != null && prev !== next) {
        scheduleSkPictureDispose(prev);
      }
    };
    sim.combatOrbitPostStepRef.current = pushFrame;
    pushFrame();
    return () => {
      mountedRef.current = false;
      if (sim.combatOrbitPostStepRef.current) {
        sim.combatOrbitPostStepRef.current = null;
      }
      disposePathPool(pools.missileTrail);
      disposePathPool(pools.novaHead);
      disposePathPool(pools.diamond);
      pools.novaTangentStable.clear();
      const live = picLiveRef.current;
      picLiveRef.current = null;
      scheduleSkPictureDispose(live);
    };
  }, [sim, pools]);

  if (orbitSize < 1) {
    return null;
  }

  const agents = sim.agentsRef.current;
  const labelEls: React.ReactNode[] = [];
  for (const ag of agents) {
    if (!ag.alive) continue;
    if (!finiteNum(ag.x) || !finiteNum(ag.y)) continue;
    labelEls.push(
      <Text
        key={`lb-${ag.id}`}
        style={[
          styles.caption,
          {
            left: ag.x - 36,
            top: ag.y - ALLY_MARK_HALF - 18,
            width: 72,
            color: typeof ag.stroke === 'string' && ag.stroke.length > 0 ? ag.stroke : 'rgba(248,250,252,0.96)',
          },
        ]}
        numberOfLines={1}
      >
        {ag.captainLabel}
      </Text>,
    );
  }

  return (
    <View style={{ width: orbitSize, height: orbitSize, position: 'relative' }} pointerEvents="none">
      <Canvas style={{ width: orbitSize, height: orbitSize }}>
        {picture ? <Picture picture={picture} /> : null}
      </Canvas>
      {labelEls}
    </View>
  );
});

const styles = StyleSheet.create({
  caption: {
    position: 'absolute',
    fontFamily: FONTS.mono,
    fontSize: 8,
    lineHeight: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(6,10,20,0.75)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1.5,
  },
});
