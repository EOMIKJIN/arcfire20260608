// ============================================================
// 아크코어 드론 충돌 FX — planetSkiaHitFxContract (Screen+Plus+Blur / Dodge 분리)
// Paint 는 planetSkiaHitFxContract 모듈 스크래치 재사용 → disposables 불필요.
// ============================================================

import type { SkCanvas, SkImage } from '@shopify/react-native-skia';
import type { MissileHitFx } from './PlanetEdenRaidTestLayer';
import {
  compactInboundDroneHitFxInPlace,
  INBOUND_DRONE_HIT_FX_MAX,
  type InboundDroneHitFx,
} from './inboundDroneHitFx';
import {
  drawPlanetFlameBurstOnSkCanvas,
  PLANET_FLAME_BURST_BASE,
  PLANET_FLAME_BURST_INTERCEPT_BASE,
  resolvePlanetFlameBurstOpacity,
} from './planetSkiaHitFxContract';

/** 드론 — 구 intercept burst 대비 50% */
export const INBOUND_DRONE_FLAME_BURST_SCALE = 0.5;

function hashFxId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 1_000_000;
}

export function inboundDroneHitFxAsDodge(fx: InboundDroneHitFx): MissileHitFx {
  return {
    id: hashFxId(fx.id),
    x: fx.x,
    y: fx.y,
    startMs: fx.startOrbitMs,
    color: '#ef4444',
    effectKind: fx.variant === 'impact' ? 'drone_burst' : 'default',
  };
}

export function drawInboundDroneFlameFxOnSkCanvas(
  canvas: SkCanvas,
  flameImage: SkImage | null,
  hitFxList: readonly InboundDroneHitFx[],
  orbitMs: number,
): number {
  let drawn = 0;
  for (let i = hitFxList.length - 1; i >= 0; i -= 1) {
    if (drawn >= INBOUND_DRONE_HIT_FX_MAX) break;
    const fx = hitFxList[i]!;
    const age = orbitMs - fx.startOrbitMs;
    if (resolvePlanetFlameBurstOpacity(age) < 0.015) continue;

    const spec = fx.variant === 'impact' ? PLANET_FLAME_BURST_BASE : PLANET_FLAME_BURST_INTERCEPT_BASE;
    const scaleMul =
      fx.variant === 'impact' ? INBOUND_DRONE_FLAME_BURST_SCALE : INBOUND_DRONE_FLAME_BURST_SCALE * 0.72;

    if (drawPlanetFlameBurstOnSkCanvas(canvas, fx.x, fx.y, age, scaleMul, spec, flameImage)) {
      drawn += 1;
    }
  }
  return drawn;
}

/** colorDodge는 성운 Skia 백드롭 전용 — 트레일 Picture 금지 */
export function drawInboundDroneHitFxOnSkCanvas(
  canvas: SkCanvas,
  flameImage: SkImage | null,
  hitFxList: InboundDroneHitFx[],
  orbitMs: number,
): boolean {
  compactInboundDroneHitFxInPlace(hitFxList, orbitMs);
  if (hitFxList.length === 0) return false;
  return drawInboundDroneFlameFxOnSkCanvas(canvas, flameImage, hitFxList, orbitMs) > 0;
}
