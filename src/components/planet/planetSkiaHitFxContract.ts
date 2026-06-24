// ============================================================
// Arcfire Skia 명중/폭발 FX 계약 — Screen · ColorDodge · Plus+Blur(Normal)
// 정본: docs/(구현)SKIA_WORKLET_MEMORY_CONTRACT.md · rendering-pipeline-baseline §4
//
// ┌─ 화염 폭발 (FLAME_BURST) ─ 궤도 Picture / 트레일 Canvas ONLY
// │  ① Plus blend + BlurStyle.Normal 3중 원 (구 defenseIntercept inbound burst)
// │  ② tail_fire_02.png — BlendMode.Screen 오버레이
// │  ✗ ColorDodge 금지 (투명 Picture 위에서 깨짐)
// │
// └─ 닷지 섬광 (COLOR_DODGE) ─ SkiaPlanetNebulaShaderBackdrop ONLY
//    ① color_dodge_02.png · BlendMode.ColorDodge (JSI enum — 문자열 금지)
//    ② 성운 baked image 와 동일 SkCanvas · orbit→nebula 좌표 변환
//    ✗ PlanetHubInboundDroneSkiaTrailLayer / Combat Picture 에서 dodge 금지
//
// ── 메모리 정책 (2026-06-15) ──────────────────────────────────
//   burst/dodge Paint 는 모듈 레벨 스크래치(한 번만 생성).
//   PictureRecorder 는 drawCircle/drawImageRect 호출 시 Paint 상태를 스냅샷하므로
//   호출 직후 paint 재사용이 안전하다. disposables 배열 불필요.
//   MaskFilter 는 sigma별 캐시를 두어 MakeBlur 반복 호출 최소화.
// ============================================================

import {
  BlendMode,
  BlurStyle,
  PaintStyle,
  Skia,
  type SkCanvas,
  type SkImage,
  type SkMaskFilter,
  type SkPaint,
} from '@shopify/react-native-skia';
import type { MissileHitFx } from './PlanetEdenRaidTestLayer';

/** 구 `DEFENSE_INTERCEPT_EXPLOSION_MS`(550) × 1.2 */
export const PLANET_FLAME_BURST_FADE_MS = 660;
/** orbitClock rAF slop — FX premature compact 방지 */
export const INBOUND_DRONE_FX_ORBIT_AGE_SLOP_MS = 48;
export const INBOUND_DRONE_FLAME_FX_MS = PLANET_FLAME_BURST_FADE_MS;
export const NEBULA_DODGE_FX_DURATION_MS = 203;
export const NEBULA_DODGE_FX_RENDER_LIMIT = 12;
export const NEBULA_DODGE_BASE_PULSE_PX = 60;

/** 구 intercept inbound burst r=22/12/5 — scale 1.0 기준 */
export const PLANET_FLAME_BURST_BASE = {
  outerR: 22,
  outerBlur: 16,
  outerColor: 'rgba(255, 96, 32, 0.42)',
  midR: 12,
  midBlur: 8,
  midColor: 'rgba(255, 210, 120, 0.55)',
  coreR: 5,
  coreColor: 'rgba(255, 255, 248, 0.88)',
  fireSpriteBasePx: 52,
} as const;

/** 구 intercept missile hit r=14/8/3.5 */
export const PLANET_FLAME_BURST_INTERCEPT_BASE = {
  outerR: 14,
  outerBlur: 10,
  outerColor: 'rgba(255, 120, 40, 0.55)',
  midR: 8,
  midBlur: 5,
  midColor: 'rgba(255, 220, 140, 0.72)',
  coreR: 3.5,
  coreColor: 'rgba(255, 255, 240, 0.9)',
  fireSpriteBasePx: 38,
} as const;

export type PlanetFlameBurstBaseSpec = {
  outerR: number;
  outerBlur: number;
  outerColor: string;
  midR: number;
  midBlur: number;
  midColor: string;
  coreR: number;
  coreColor: string;
  fireSpriteBasePx: number;
};

// ── 모듈 레벨 스크래치 Paint / MaskFilter 캐시 ─────────────────────────────
// Skia PictureRecorder: drawXxx 호출 시 paint 상태를 즉시 직렬화 → 호출 후 paint 재사용 안전.

type BurstPaintScratch = {
  outer: SkPaint;
  mid: SkPaint;
  core: SkPaint;
  screen: SkPaint;
};

let _burstPaints: BurstPaintScratch | null = null;
let _dodgePaint: SkPaint | null = null;
/** sigma(×100 정수) → SkMaskFilter 캐시 — 동일 sigma는 재사용 */
const _mfCache = new Map<number, SkMaskFilter>();

/** drawImageRect scratch — 프레임당 XYWHRect 할당 금지 */
let _scratchSrcRect: ReturnType<typeof Skia.XYWHRect> | null = null;
let _scratchDestRect: ReturnType<typeof Skia.XYWHRect> | null = null;

function scratchSrcRect(iw: number, ih: number) {
  if (!_scratchSrcRect) _scratchSrcRect = Skia.XYWHRect(0, 0, iw, ih);
  else _scratchSrcRect.setXYWH(0, 0, iw, ih);
  return _scratchSrcRect;
}

function scratchDestRect(x: number, y: number, w: number, h: number) {
  if (!_scratchDestRect) _scratchDestRect = Skia.XYWHRect(x, y, w, h);
  else _scratchDestRect.setXYWH(x, y, w, h);
  return _scratchDestRect;
}

export function disposePlanetSkiaHitFxModuleCaches(): void {
  safeDisposeSkPaint(_dodgePaint);
  _dodgePaint = null;
  if (_burstPaints) {
    safeDisposeSkPaint(_burstPaints.outer);
    safeDisposeSkPaint(_burstPaints.mid);
    safeDisposeSkPaint(_burstPaints.core);
    safeDisposeSkPaint(_burstPaints.screen);
    _burstPaints = null;
  }
  for (const mf of _mfCache.values()) {
    try {
      mf.dispose?.();
    } catch {
      /* idempotent */
    }
  }
  _mfCache.clear();
  _scratchSrcRect = null;
  _scratchDestRect = null;
}

function safeDisposeSkPaint(obj: { dispose?: () => void } | null | undefined): void {
  try {
    obj?.dispose?.();
  } catch {
    /* idempotent */
  }
}

function getBurstPaints(): BurstPaintScratch {
  if (_burstPaints) return _burstPaints;
  const makePlus = (): SkPaint => {
    const p = Skia.Paint();
    p.setStyle(PaintStyle.Fill);
    p.setAntiAlias(true);
    p.setBlendMode(BlendMode.Plus);
    return p;
  };
  const screen = Skia.Paint();
  screen.setAntiAlias(true);
  screen.setBlendMode(BlendMode.Screen);
  _burstPaints = { outer: makePlus(), mid: makePlus(), core: makePlus(), screen };
  return _burstPaints;
}

function getDodgePaint(): SkPaint {
  if (!_dodgePaint) {
    _dodgePaint = Skia.Paint();
    _dodgePaint.setBlendMode(BlendMode.ColorDodge);
  }
  return _dodgePaint;
}

function getCachedMaskFilter(sigma: number): SkMaskFilter {
  const key = Math.round(Math.max(0.5, sigma) * 100);
  let mf = _mfCache.get(key);
  if (!mf) {
    mf = Skia.MaskFilter.MakeBlur(BlurStyle.Normal, Math.max(0.5, sigma), true);
    _mfCache.set(key, mf);
  }
  return mf;
}

// ── 공용 수식 ────────────────────────────────────────────────────────────────

export function resolveNebulaDodgeFxDurationMs(fx: MissileHitFx): number {
  if (fx.effectKind === 'laser_dodge') {
    return Math.max(1, Math.round(NEBULA_DODGE_FX_DURATION_MS * 0.5));
  }
  return NEBULA_DODGE_FX_DURATION_MS;
}

export function resolveNebulaDodgeFxSizeScale(fx: MissileHitFx): number {
  if (fx.effectKind === 'laser_dodge') return 0.5;
  if (fx.effectKind === 'drone_burst') return 0.59;
  return 1;
}

export type NebulaDodgePulse = {
  pulseSize: number;
  pulseOpacity: number;
};

export function resolveNebulaDodgeFxPulse(
  ageMs: number,
  fxDurationMs: number,
  sizeScale: number,
): NebulaDodgePulse | null {
  if (ageMs < -INBOUND_DRONE_FX_ORBIT_AGE_SLOP_MS || ageMs > fxDurationMs) return null;
  const ageClamped = Math.max(0, ageMs);
  const t01 = Math.max(0, Math.min(1, ageClamped / fxDurationMs));
  const pulse = 1 - Math.abs(t01 * 2 - 1);
  const pulseScale = (0.72 + pulse * 0.85) * sizeScale;
  const pulseSize = NEBULA_DODGE_BASE_PULSE_PX * pulseScale;
  const pulseOpacity = Math.max(0, 1 - t01 ** 0.58);
  if (pulseOpacity < 0.015) return null;
  return { pulseSize, pulseOpacity };
}

export function resolvePlanetFlameBurstOpacity(ageMs: number): number {
  if (ageMs < -INBOUND_DRONE_FX_ORBIT_AGE_SLOP_MS || ageMs > PLANET_FLAME_BURST_FADE_MS) return 0;
  return Math.max(0, 1 - Math.max(0, ageMs) / PLANET_FLAME_BURST_FADE_MS);
}

// ── 드로우 함수 ──────────────────────────────────────────────────────────────

/**
 * Plus+Blur(Normal) 3중 원 + tail_fire Screen — 궤도 Picture 전용.
 *
 * Paint 는 모듈 레벨 스크래치를 재사용. disposables 인자 불필요.
 * @param scaleMul 드론=0.5 (구 intercept 대비 절반)
 */
export function drawPlanetFlameBurstOnSkCanvas(
  canvas: SkCanvas,
  cx: number,
  cy: number,
  ageMs: number,
  scaleMul: number,
  baseSpec: PlanetFlameBurstBaseSpec,
  flameImage: SkImage | null,
): boolean {
  const burstOpacity = resolvePlanetFlameBurstOpacity(ageMs);
  if (burstOpacity < 0.015) return false;

  const p = getBurstPaints();
  const mul = Number.isFinite(scaleMul) && scaleMul > 0 ? scaleMul : 1;

  p.outer.setColor(Skia.Color(baseSpec.outerColor));
  p.outer.setAlphaf(burstOpacity);
  p.outer.setMaskFilter(getCachedMaskFilter(baseSpec.outerBlur * mul));
  canvas.drawCircle(cx, cy, baseSpec.outerR * mul, p.outer);

  p.mid.setColor(Skia.Color(baseSpec.midColor));
  p.mid.setAlphaf(burstOpacity);
  p.mid.setMaskFilter(getCachedMaskFilter(baseSpec.midBlur * mul));
  canvas.drawCircle(cx, cy, baseSpec.midR * mul, p.mid);

  p.core.setColor(Skia.Color(baseSpec.coreColor));
  p.core.setAlphaf(burstOpacity);
  p.core.setMaskFilter(null);
  canvas.drawCircle(cx, cy, baseSpec.coreR * mul, p.core);

  if (flameImage) {
    const ageClamped = Math.max(0, ageMs);
    const t01 = Math.max(0, Math.min(1, ageClamped / PLANET_FLAME_BURST_FADE_MS));
    const burst = 1 - Math.pow(1 - t01, 1.35);
    const size = baseSpec.fireSpriteBasePx * mul * (0.55 + burst * 0.95);
    p.screen.setAlphaf(burstOpacity * 0.88);
    const iw = flameImage.width();
    const ih = flameImage.height();
    canvas.drawImageRect(
      flameImage,
      scratchSrcRect(iw, ih),
      scratchDestRect(cx - size * 0.5, cy - size * 0.5, size, size),
      p.screen,
    );
  }

  return true;
}

/**
 * ColorDodge 섬광 — 성운 Skia 백드롭 / 동일 버퍼 Picture(imperative) 공용.
 *
 * Paint 는 모듈 레벨 스크래치를 재사용. FX 개수만큼 setAlphaf 만 갱신.
 */
export function drawNebulaColorDodgeFxOnSkCanvas(
  canvas: SkCanvas,
  dodgeImage: SkImage,
  hitFxList: readonly MissileHitFx[],
  tMs: number,
  renderLimit = NEBULA_DODGE_FX_RENDER_LIMIT,
): void {
  const paint = getDodgePaint();
  let drawn = 0;
  for (let i = hitFxList.length - 1; i >= 0; i -= 1) {
    if (drawn >= renderLimit) break;
    const fx = hitFxList[i]!;
    const fxX = Number(fx.x);
    const fxY = Number(fx.y);
    if (!Number.isFinite(fxX) || !Number.isFinite(fxY)) continue;

    const fxDurationMs = resolveNebulaDodgeFxDurationMs(fx);
    const pulse = resolveNebulaDodgeFxPulse(tMs - fx.startMs, fxDurationMs, resolveNebulaDodgeFxSizeScale(fx));
    if (!pulse) continue;

    paint.setAlphaf(pulse.pulseOpacity);
    const iw = dodgeImage.width();
    const ih = dodgeImage.height();
    canvas.drawImageRect(
      dodgeImage,
      scratchSrcRect(iw, ih),
      scratchDestRect(
        fxX - pulse.pulseSize * 0.5,
        fxY - pulse.pulseSize * 0.5,
        pulse.pulseSize,
        pulse.pulseSize,
      ),
      paint,
    );
    drawn += 1;
  }
}

export type NebulaDodgeOrbitTransform = {
  nebulaSize: number;
  orbitSize: number;
  orbitOffsetX: number;
  orbitOffsetY: number;
  scaleX: number;
  scaleY: number;
};

/**
 * orbit→nebula 좌표 변환 후 ColorDodge — SkiaPlanetNebulaShaderBackdrop Picture 전용.
 * React `<Group><SkiaImage>` N개 렌더 금지.
 */
export function drawNebulaColorDodgeFxTransformedOnSkCanvas(
  canvas: SkCanvas,
  dodgeImage: SkImage,
  hitFxList: readonly MissileHitFx[],
  tMs: number,
  transform: NebulaDodgeOrbitTransform,
  renderLimit = NEBULA_DODGE_FX_RENDER_LIMIT,
): boolean {
  const paint = getDodgePaint();
  const orbitCenter = transform.orbitSize / 2;
  let drawn = 0;
  for (let i = hitFxList.length - 1; i >= 0; i -= 1) {
    if (drawn >= renderLimit) break;
    const fx = hitFxList[i]!;
    const fxX = Number(fx.x);
    const fxY = Number(fx.y);
    if (!Number.isFinite(fxX) || !Number.isFinite(fxY)) continue;

    const fxDurationMs = resolveNebulaDodgeFxDurationMs(fx);
    const pulse = resolveNebulaDodgeFxPulse(
      tMs - fx.startMs,
      fxDurationMs,
      resolveNebulaDodgeFxSizeScale(fx),
    );
    if (!pulse) continue;

    const px =
      transform.nebulaSize / 2
      + transform.orbitOffsetX
      + (fxX - orbitCenter) * transform.scaleX;
    const py =
      transform.nebulaSize / 2
      + transform.orbitOffsetY
      + (fxY - orbitCenter) * transform.scaleY;

    paint.setAlphaf(pulse.pulseOpacity);
    const iw = dodgeImage.width();
    const ih = dodgeImage.height();
    canvas.drawImageRect(
      dodgeImage,
      scratchSrcRect(iw, ih),
      scratchDestRect(
        px - pulse.pulseSize * 0.5,
        py - pulse.pulseSize * 0.5,
        pulse.pulseSize,
        pulse.pulseSize,
      ),
      paint,
    );
    drawn += 1;
  }
  return drawn > 0;
}
