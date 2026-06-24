// ============================================================
// 실시간 전함 궤도 — Skia 단일 Canvas (sim ref 직독)
// 구조: 시뮬 틱마다 PictureRecorder로 SkPicture 1장만 기록 → React 자식은 <Picture> 1개로 고정.
//      (기존: useReducer force로 수백 노드 Skia-DOM 리컨실 / 프레임당 GC·비용 누적)
// 메모리: 미사일·함선 마름모는 Path 풀에서 rewind 후 재사용, 풀에서 제거 시 SkPath.dispose().
// ============================================================

import React, { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BlendMode,
  Canvas,
  PaintStyle,
  Picture,
  Skia,
  StrokeCap,
  StrokeJoin,
  useImage,
} from '@shopify/react-native-skia';
import type { SkCanvas, SkColorFilter, SkPaint } from '@shopify/react-native-skia';
import type { SkPicture } from '@shopify/react-native-skia';
import type { SkImage } from '@shopify/react-native-skia';
import type { SkColor } from '@shopify/react-native-skia';
import { FONTS } from '../../utils/theme';
import {
  isNovaAoeWeapon,
  isRocketFamilyWeapon,
  resolveCapitalLaserBeamPresentation,
  resolveCapitalProjectilePresentation,
} from '../../combat/capitalWeaponPipeline';
import { registerCombatSkiaPresentationReclaim } from '../../combat/combatSkiaPresentationReclaim';
import { disposePlanetSkiaHitFxModuleCaches } from './planetSkiaHitFxContract';
import {
  acquireSkPathFromPool,
  drainSkPathPool,
  releaseSkPathToSpare,
  resetSkPath,
  scheduleSkPictureDispose,
  safeSkiaDispose,
} from '../../game/skia/skiaMemoryLifecycle';
import type { Agent, Missile, PlanetEdenRaidSim } from './PlanetEdenRaidTestLayer';
import { drawMissileHitFxOnSkCanvas } from './planetNebulaMissileHitFxDraw';
import {
  drawPlanetFlameBurstOnSkCanvas,
  PLANET_FLAME_BURST_BASE,
  PLANET_FLAME_BURST_FADE_MS,
} from './planetSkiaHitFxContract';

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
// 전함 폭발 FX — 아크코어 드론 미사일 폭발과 동일한 화염 폭발 FX(planetSkiaHitFxContract) 재사용.
/** 전함 폭발 화염 FX 지속(화염 burst 페이드 기준) */
const SHIP_DESTROY_FLAME_FX_MS = PLANET_FLAME_BURST_FADE_MS;
/** 전함(캐피털) 폭발 화염 스케일 — 드론(0.5)보다 큰 폭발 */
const SHIP_DESTROY_FLAME_BURST_SCALE = 1.3;
const NOVA_TELEGRAPH_DURATION_MS = 420;
const NOVA_EFFECT_RADIUS_ORBIT_MUL = 0.25; // 지름=전투영역 가로 1/2
type Pt = { x: number; y: number };
type SkPath = ReturnType<typeof Skia.Path.Make>;

type CombatSkiaPoolBundle = {
  missileTrail: Map<number, SkPath>;
  missileTrailSpare: SkPath[];
  diamond: Map<number, SkPath>;
  diamondSpare: SkPath[];
  novaHead: Map<number, SkPath>;
  novaHeadSpare: SkPath[];
  /** 미사일 id → atan2 불연속(±π) 제거용 연속 접선 각 */
  novaTangentStable: Map<number, number>;
  /** 에이전트 id → 분사화염 길이(속도 연동 ease 상태) */
  thrusterLenSmooth: Map<number, number>;
};

function createCombatSkiaPoolBundle(): CombatSkiaPoolBundle {
  return {
    missileTrail: new Map(),
    missileTrailSpare: [],
    diamond: new Map(),
    diamondSpare: [],
    novaHead: new Map(),
    novaHeadSpare: [],
    novaTangentStable: new Map(),
    thrusterLenSmooth: new Map(),
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

/** 부하(미사일 수) 단계 임계 — 비용 주도 변수라 fps보다 안정적(플리커 방지) */
const VFX_MISSILES_HEAVY = 28;
const VFX_MISSILES_SEVERE = 40;
/** fps 백스톱 — 부하가 낮아도 프레임이 무너지면 디테일 삭감(25fps 바닥 방어) */
const VFX_FPS_MILD = 30;
const VFX_FPS_SEVERE = 25;

/**
 * 전투 VFX 버짓 — fps·미사일 수 인지 단계적 축소.
 * 프레임이 건강하면(부하 낮음 + fps≥30) 풀옵션 유지, 저하 시에만 디테일을 삭감해
 * 디버그 빌드 25fps 바닥을 방어한다(GPU가 아니라 CPU/JS 기록 비용이 병목).
 * 주(主) 트리거는 미사일 수(단조·안정), fps는 백스톱(오실레이션 방지).
 */
function resolveCombatOrbitVfxBudget(
  _agentCount: number,
  approxActiveMissiles: number,
  fpsNow: number,
): CombatOrbitVfxBudget {
  // 미사일 탄두(head)는 게임 가독성 핵심이라 어떤 단계에서도 끄지 않는다.
  // (메인 트레일 패스가 off라 탄두까지 끄면 미사일이 흐린 잔상만 남아 "탄두 미표시" 회귀가 됨)
  // 비용 큰 요소만 단계 축소: 트레일 세그먼트·베지어 샘플 캡, 레이저 글로우 패스.
  const severe = approxActiveMissiles >= VFX_MISSILES_SEVERE || fpsNow < VFX_FPS_SEVERE;
  if (severe) {
    return {
      missileSegmentBudget: Math.max(4, Math.round(MISSILE_MAX_TRAIL_SEGMENTS * 0.5)),
      bezierSampleCap: Math.max(8, Math.round(BEZIER_SAMPLES * 0.6)),
      renderLaserGlow: false,
      missileHeadDotEnabled: true,
    };
  }
  const heavy = approxActiveMissiles >= VFX_MISSILES_HEAVY || fpsNow < VFX_FPS_MILD;
  if (heavy) {
    return {
      missileSegmentBudget: Math.max(6, Math.round(MISSILE_MAX_TRAIL_SEGMENTS * 0.75)),
      bezierSampleCap: Math.max(10, Math.round(BEZIER_SAMPLES * 0.8)),
      renderLaserGlow: false,
      missileHeadDotEnabled: true,
    };
  }
  return {
    missileSegmentBudget: MISSILE_MAX_TRAIL_SEGMENTS,
    bezierSampleCap: BEZIER_SAMPLES,
    renderLaserGlow: true,
    missileHeadDotEnabled: true,
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
  resetSkPath(path);
}

let _combatPictureRecorder: ReturnType<typeof Skia.PictureRecorder> | null = null;

function getCombatPictureRecorder(): ReturnType<typeof Skia.PictureRecorder> {
  if (!_combatPictureRecorder) _combatPictureRecorder = Skia.PictureRecorder();
  return _combatPictureRecorder;
}

let _thrusterSrcRect: ReturnType<typeof Skia.XYWHRect> | null = null;
let _thrusterDestRect: ReturnType<typeof Skia.XYWHRect> | null = null;

function thrusterSrcRect(iw: number, ih: number) {
  if (!_thrusterSrcRect) _thrusterSrcRect = Skia.XYWHRect(0, 0, iw, ih);
  else _thrusterSrcRect.setXYWH(0, 0, iw, ih);
  return _thrusterSrcRect;
}

function thrusterDestRect(x: number, y: number, w: number, h: number) {
  if (!_thrusterDestRect) _thrusterDestRect = Skia.XYWHRect(x, y, w, h);
  else _thrusterDestRect.setXYWH(x, y, w, h);
  return _thrusterDestRect;
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
  const headVisible = !m.hitApplied && tSince < m.travelMs;
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
      releaseSkPathToSpare(missileTrailPoolSync, pools.missileTrailSpare, id);
      pools.novaTangentStable.delete(id);
    }
  }
  const novaHeadPoolSync = pools.novaHead;
  for (const id of novaHeadPoolSync.keys()) {
    if (!activeMissileIds.has(id)) {
      releaseSkPathToSpare(novaHeadPoolSync, pools.novaHeadSpare, id);
      pools.novaTangentStable.delete(id);
    }
  }
  const diamondPoolSync = pools.diamond;
  for (const id of diamondPoolSync.keys()) {
    if (!activeAgentIds.has(id)) {
      releaseSkPathToSpare(diamondPoolSync, pools.diamondSpare, id);
      pools.thrusterLenSmooth.delete(id);
    }
  }
}

/**
 * CSS 색 문자열 → SkColor(Float32Array) 캐시.
 * 전투 색은 유한한 정적 집합인데 드로우마다 Skia.Color()로 파싱하면 프레임당 100+회
 * 문자열 파싱 + JSI 왕복이 발생한다(디버그 빌드 CPU 병목). 1회 파싱 후 재사용한다.
 * setColor 는 색 값을 paint 로 복사하므로 캐시된 SkColor 공유는 안전하다.
 */
const skColorCache = new Map<string, SkColor>();
function cachedSkColor(colorCss: string): SkColor {
  let c = skColorCache.get(colorCss);
  if (c === undefined) {
    c = Skia.Color(colorCss);
    skColorCache.set(colorCss, c);
  }
  return c;
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
  p.setColor(cachedSkColor(colorCss));
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
  p.setColor(cachedSkColor(colorCss));
  if (alphaMul !== 1) {
    p.setAlphaf(Math.max(0, Math.min(1, p.getAlphaf() * alphaMul)));
  }
  return p;
}

// ── 전함 분사화염 테일 (thruster flame) ───────────────────────────────────────
// tail_fire_02.png(원형)을 함선 후미에 타원형으로 늘려 분사 형태로 렌더.
// 속도 연동(엑셀링): 정지=원형(짧음), 이동=현재 길이까지 늘어남.
// 색은 향후 팀별 보정 가능(resolveTeamFlameTint) — 현재는 원본 색 그대로(틴트 없음).
/** 최대 분사 길이(함축 방향, 최고속에서) */
const THRUSTER_FLAME_LENGTH_PX = 34;
/** 분사 폭(가로축) — 정지 시 길이도 이 값이 되어 원형 */
const THRUSTER_FLAME_WIDTH_PX = 15;
/** 함선 중심에서 후미 시작점까지 오프셋 */
const THRUSTER_FLAME_REAR_OFFSET_PX = ALLY_MARK_HALF * 0.5;
const THRUSTER_FLAME_OPACITY = 0.92;
/** 최대 길이 도달 속도 기준 — maxMoveSpeed 의 이 비율에서 풀 길이(순항에서 충분히 길게) */
const THRUSTER_FULL_LEN_SPEED_RATIO = 0.7;
/** 길이 ease 계수(프레임당 보간) — 출렁임 완화 */
const THRUSTER_LEN_EASE = 0.22;

let _thrusterFlamePaint: SkPaint | null = null;
function getThrusterFlamePaint(): SkPaint {
  if (!_thrusterFlamePaint) {
    const p = Skia.Paint();
    p.setAntiAlias(true);
    // 어두운 우주/성운 위에서 화염은 Screen 오버레이(다른 화염 FX와 동일 계약)
    p.setBlendMode(BlendMode.Screen);
    _thrusterFlamePaint = p;
  }
  return _thrusterFlamePaint;
}

/** sigma·team 별 SkColorFilter 캐시 — 향후 팀 색 보정 진입점 */
const _teamFlameTintCache = new Map<string, SkColorFilter | null>();
/**
 * 팀별 화염 색 보정 — 현재는 모두 원본 색(null = 틴트 없음).
 * 향후 팀 색으로 칠하려면 이 맵만 채우면 된다:
 *   예) Skia.ColorFilter.MakeBlend(Skia.Color('rgba(80,160,255,1)'), BlendMode.Modulate)
 */
function resolveTeamFlameTint(team: Agent['team']): SkColorFilter | null {
  if (_teamFlameTintCache.has(team)) return _teamFlameTintCache.get(team) ?? null;
  const tint: SkColorFilter | null = null; // 원본 색 그대로 (red/blue/orange 공통)
  _teamFlameTintCache.set(team, tint);
  return tint;
}

function reclaimCombatSkiaModuleCaches(): void {
  skColorCache.clear();
  for (const filter of _teamFlameTintCache.values()) {
    safeSkiaDispose(filter as { dispose?: () => void });
  }
  _teamFlameTintCache.clear();
  safeSkiaDispose(SK_PAINT_STROKE);
  SK_PAINT_STROKE = null;
  safeSkiaDispose(SK_PAINT_FILL);
  SK_PAINT_FILL = null;
  safeSkiaDispose(_thrusterFlamePaint);
  _thrusterFlamePaint = null;
  safeSkiaDispose(_combatPictureRecorder as unknown as { dispose?: () => void });
  _combatPictureRecorder = null;
  _thrusterSrcRect = null;
  _thrusterDestRect = null;
}

registerCombatSkiaPresentationReclaim(reclaimCombatSkiaModuleCaches);
registerCombatSkiaPresentationReclaim(disposePlanetSkiaHitFxModuleCaches);

/**
 * 함선 후미에 타원형 분사화염을 1장 그린다(이미지 stretch). flameImage 없으면 no-op.
 * 속도 연동: 정지=원형(길이=폭), 이동=최대 길이까지 ease 보간.
 * 드로우 콜·할당 추가 없음(기존 1장 drawImageRect, dest 값만 속도로 변함).
 */
function drawThrusterFlame(
  canvas: SkCanvas,
  ag: Agent,
  flameImage: SkImage | null,
  lenSmoothMap: Map<number, number>,
): void {
  if (!flameImage) return;
  const iw = flameImage.width();
  const ih = flameImage.height();
  if (iw <= 0 || ih <= 0) return;

  // 속도 0~1 (maxMoveSpeed 의 FULL_LEN_SPEED_RATIO 에서 1로 포화)
  const maxSpd = ag.maxMoveSpeedPxPerMs > 0 ? ag.maxMoveSpeedPxPerMs : 0.02;
  const spd = Math.sqrt(ag.vx * ag.vx + ag.vy * ag.vy);
  const speed01 = Math.min(1, spd / (maxSpd * THRUSTER_FULL_LEN_SPEED_RATIO));
  // 정지=폭(원형) → 이동=최대 길이
  const targetLen = THRUSTER_FLAME_WIDTH_PX + (THRUSTER_FLAME_LENGTH_PX - THRUSTER_FLAME_WIDTH_PX) * speed01;
  const prevLen = lenSmoothMap.get(ag.id);
  const len =
    prevLen === undefined ? targetLen : prevLen + (targetLen - prevLen) * THRUSTER_LEN_EASE;
  lenSmoothMap.set(ag.id, len);

  const paint = getThrusterFlamePaint();
  paint.setAlphaf(THRUSTER_FLAME_OPACITY);
  paint.setColorFilter(resolveTeamFlameTint(ag.team));
  const lenRect = THRUSTER_FLAME_REAR_OFFSET_PX + len;
  canvas.save();
  canvas.translate(ag.x, ag.y);
  canvas.rotate((ag.headingRad * 180) / Math.PI, 0, 0);
  canvas.drawImageRect(
    flameImage,
    thrusterSrcRect(iw, ih),
    thrusterDestRect(-lenRect, -THRUSTER_FLAME_WIDTH_PX * 0.5, len, THRUSTER_FLAME_WIDTH_PX),
    paint,
  );
  canvas.restore();
}

// 프레임당 클로저 할당 제거 — draw 헬퍼는 모듈 싱글톤(1회 생성), 캔버스만 기록 시 주입.
// 기록은 recordCombatOrbitPicture 내부에서 동기 완료되므로 모듈 캔버스 공유가 안전(재진입 없음).
let _recCanvas: SkCanvas | null = null;
const recDraw = {
  pathStroke(
    path: SkPath,
    colorCss: string,
    width: number,
    opacityMul: number,
    join = StrokeJoin.Round,
    cap = StrokeCap.Round,
  ) {
    _recCanvas!.drawPath(path, strokePaint(colorCss, width, opacityMul, join, cap));
  },
  line(x0: number, y0: number, x1: number, y1: number, colorCss: string, width: number, opacityMul: number) {
    _recCanvas!.drawLine(x0, y0, x1, y1, strokePaint(colorCss, width, opacityMul, StrokeJoin.Round, StrokeCap.Round));
  },
  circle(cx: number, cy: number, r: number, colorCss: string, mode: 'fill' | 'stroke', strokeW?: number, opacityMul = 1) {
    if (mode === 'fill') {
      _recCanvas!.drawCircle(cx, cy, r, fillPaint(colorCss, opacityMul));
    } else {
      const w = strokeW ?? 1;
      _recCanvas!.drawCircle(cx, cy, r, strokePaint(colorCss, w, opacityMul, StrokeJoin.Round, StrokeCap.Round));
    }
  },
};

/** 한 틱 분량을 SkPicture로 기록 — React에는 Picture 노드만 넘긴다. */
function recordCombatOrbitPicture(
  sim: PlanetEdenRaidSim,
  pools: CombatSkiaPoolBundle,
  orbitSize: number,
  dodgeImage: SkImage | null,
  flameImage: SkImage | null,
  renderMissileDodgeFx: boolean,
): SkPicture {
  const tMs = sim.tMsRef.current;
  const agents = sim.agentsRef.current;
  const missiles = sim.missilesRef.current;
  const idBuf = sim.agentByIdSparseRef.current;

  syncCombatSkiaPoolsFromSim(missiles, agents, pools);

  const vfx = resolveCombatOrbitVfxBudget(agents.length, missiles.length, sim.fpsRef.current);

  const recorder = getCombatPictureRecorder();
  const canvas = recorder.beginRecording(Skia.XYWHRect(0, 0, orbitSize, orbitSize));

  _recCanvas = canvas;
  const draw = recDraw;

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
    const missilePath = acquireSkPathFromPool(
      missileTrailPool,
      pools.missileTrailSpare,
      m.id,
    );
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
      const ovalPath = acquireSkPathFromPool(novaHeadPool, pools.novaHeadSpare, m.id);
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
      !ag.alive && destroyedForMs >= 0 && destroyedForMs < SHIP_DESTROY_FLAME_FX_MS;
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
      // 분사화염 테일 — 함선(다이아몬드) 아래에 먼저 그린다(red/blue/플레이어 공통)
      drawThrusterFlame(canvas, ag, flameImage, pools.thrusterLenSmooth);

      const diamondPool = pools.diamond;
      const dPath = acquireSkPathFromPool(diamondPool, pools.diamondSpare, ag.id);
      writeDiamondPath(dPath, ag.x, ag.y, ag.headingRad, ALLY_MARK_HALF);
      draw.pathStroke(dPath, ag.stroke, 2.5, 0.98, StrokeJoin.Miter, StrokeCap.Round);

      const bx = ag.x + Math.cos(ag.headingRad) * DEBUG_CAPITAL_BOW_LINE_PX;
      const by = ag.y + Math.sin(ag.headingRad) * DEBUG_CAPITAL_BOW_LINE_PX;
      draw.line(ag.x, ag.y, bx, by, ag.stroke, 1.35, 0.9);
    } else if (showDestroyFx) {
      // 전함 폭발 — 아크코어 드론 미사일 폭발과 동일한 화염 폭발 FX(궤도 Picture 전용)
      drawPlanetFlameBurstOnSkCanvas(
        canvas,
        ag.x,
        ag.y,
        destroyedForMs,
        SHIP_DESTROY_FLAME_BURST_SCALE,
        PLANET_FLAME_BURST_BASE,
        flameImage,
      );
    }
  }

  if (renderMissileDodgeFx && dodgeImage) {
    drawMissileHitFxOnSkCanvas(canvas, dodgeImage, sim.missileHitFxRef.current, tMs);
  }

  return recorder.finishRecordingAsPicture();
}

export const PlanetEdenRaidOrbitSkiaCombat = memo(function PlanetEdenRaidOrbitSkiaCombat({
  sim,
  renderMissileDodgeFx = true,
}: {
  sim: PlanetEdenRaidSim;
  /** false — 성운 Skia 백드롭(`SkiaPlanetNebulaShaderBackdrop`)에서 colorDodge 처리 */
  renderMissileDodgeFx?: boolean;
}) {
  const mountedRef = useRef(true);
  const combatSkiaLoopsActiveRef = useRef(true);
  const pictureFlushRafRef = useRef(0);
  const pendingPictureRef = useRef<SkPicture | null>(null);
  const orbitSizeRef = useRef(0);
  const renderMissileDodgeFxRef = useRef(renderMissileDodgeFx);
  renderMissileDodgeFxRef.current = renderMissileDodgeFx;
  const picLiveRef = useRef<SkPicture | null>(null);
  /** Path 풀·노바 접선 맵을 한 객체에 유지 — 분리 ref 시 HMR/번들 불일치로 런타임 ReferenceError·Skia SIGSEGV로 이어진 사례 방지 */
  const poolsRef = useRef<CombatSkiaPoolBundle | null>(null);
  if (poolsRef.current === null) {
    poolsRef.current = createCombatSkiaPoolBundle();
  }
  const pools = poolsRef.current;
  const dodgeImage = useImage(require('../../../assets/images/effects/color_dodge_02.png'));
  const dodgeImageRef = useRef<SkImage | null>(null);
  useEffect(() => {
    dodgeImageRef.current = dodgeImage ?? null;
  }, [dodgeImage]);
  // 전함 폭발 화염 FX 스프라이트(아크코어 드론 폭발과 동일 에셋)
  const flameImage = useImage(require('../../../assets/images/effects/tail_fire_02.png'));
  const flameImageRef = useRef<SkImage | null>(null);
  useEffect(() => {
    flameImageRef.current = flameImage ?? null;
  }, [flameImage]);
  // SkImage(useImage 반환) 수동 dispose 금지 — 훅이 수명을 자체 관리한다.
  // 수동 해제는 SkPicture/JsiImageNode 가 아직 참조 중인 이미지를 조기 해제해
  // use-after-free → GC FinalizerDaemon 파괴 시 SIGSEGV 를 유발한다(2026-06-17 크래시).

  const [picture, setPicture] = useState<SkPicture | null>(null);

  const orbitSizeRaw = sim.orbitSize;
  const orbitSize = Math.max(0, Math.floor(finiteNum(orbitSizeRaw) ? orbitSizeRaw : 0));
  orbitSizeRef.current = orbitSize;

  useEffect(() => {
    mountedRef.current = true;
    combatSkiaLoopsActiveRef.current = true;
    const flushPictureToReact = () => {
      pictureFlushRafRef.current = 0;
      if (!mountedRef.current || !combatSkiaLoopsActiveRef.current) return;
      const next = pendingPictureRef.current;
      if (!next) return;
      const prev = picLiveRef.current;
      picLiveRef.current = next;
      setPicture(next);
      if (prev != null && prev !== next) {
        scheduleSkPictureDispose(prev);
      }
    };
    const pushFrame = () => {
      if (!mountedRef.current || !combatSkiaLoopsActiveRef.current) return;
      const orbitSz = orbitSizeRef.current;
      if (orbitSz < 1) return;
      pendingPictureRef.current = recordCombatOrbitPicture(
        sim,
        pools,
        orbitSz,
        dodgeImageRef.current,
        flameImageRef.current,
        renderMissileDodgeFxRef.current,
      );
      if (pictureFlushRafRef.current === 0) {
        pictureFlushRafRef.current = requestAnimationFrame(flushPictureToReact);
      }
    };
    sim.combatOrbitPostStepRef.current = pushFrame;
    pushFrame();
    return () => {
      combatSkiaLoopsActiveRef.current = false;
      mountedRef.current = false;
      if (pictureFlushRafRef.current !== 0) {
        cancelAnimationFrame(pictureFlushRafRef.current);
        pictureFlushRafRef.current = 0;
      }
      pendingPictureRef.current = null;
      if (sim.combatOrbitPostStepRef.current) {
        sim.combatOrbitPostStepRef.current = null;
      }
      setTimeout(() => {
        drainSkPathPool(pools.missileTrail, pools.missileTrailSpare);
        drainSkPathPool(pools.novaHead, pools.novaHeadSpare);
        drainSkPathPool(pools.diamond, pools.diamondSpare);
        pools.novaTangentStable.clear();
        pools.thrusterLenSmooth.clear();
        const live = picLiveRef.current;
        picLiveRef.current = null;
        scheduleSkPictureDispose(live);
        reclaimCombatSkiaModuleCaches();
      }, 16);
    };
  }, [sim, pools]);

  if (orbitSize < 1) {
    return null;
  }

  const agents = sim.agentsRef.current;
  const labelEls: React.ReactNode[] = [];
  for (const ag of agents) {
    if (!ag.alive) continue;
    // 프레임 효율: 적함(red/orange) 닉네임은 렌더하지 않는다(매 프레임 RN Text 레이아웃 비용 절감).
    // 플레이어(blue 팀)만 닉네임 유지 — 웨이브 전투에서 텍스트 노드 ~12개 제거.
    if (ag.team !== 'blue') continue;
    if (!finiteNum(ag.x) || !finiteNum(ag.y)) continue;
    labelEls.push(
      <View
        key={`lb-${ag.id}`}
        style={[
          styles.captionWrap,
          {
            transform: [
              { translateX: ag.x - 36 },
              { translateY: ag.y - ALLY_MARK_HALF - 18 },
            ],
          },
        ]}
        pointerEvents="none"
      >
        <Text
          style={[
            styles.caption,
            {
              width: 72,
              color: typeof ag.stroke === 'string' && ag.stroke.length > 0 ? ag.stroke : 'rgba(248,250,252,0.96)',
            },
          ]}
          numberOfLines={1}
        >
          {ag.captainLabel}
        </Text>
      </View>,
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
  captionWrap: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  caption: {
    fontFamily: FONTS.mono,
    fontSize: 8,
    lineHeight: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(6,10,20,0.75)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1.5,
  },
});
