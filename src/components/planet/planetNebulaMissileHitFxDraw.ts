/**
 * 전투·허브 colorDodge 섬광 — `planetSkiaHitFxContract` 정본.
 * 성운 Skia 백드롭(`SkiaPlanetNebulaShaderBackdrop`)과 동일 버퍼에서만 호출.
 */
import type { SkCanvas, SkImage } from '@shopify/react-native-skia';
import type { MissileHitFx } from './PlanetEdenRaidTestLayer';
import {
  drawNebulaColorDodgeFxOnSkCanvas,
  NEBULA_DODGE_FX_DURATION_MS,
  NEBULA_DODGE_FX_RENDER_LIMIT,
  resolveNebulaDodgeFxDurationMs,
  resolveNebulaDodgeFxSizeScale,
} from './planetSkiaHitFxContract';

export {
  NEBULA_DODGE_FX_DURATION_MS,
  NEBULA_DODGE_FX_RENDER_LIMIT,
  resolveNebulaDodgeFxDurationMs,
  resolveNebulaDodgeFxSizeScale,
};

/** orbit 좌표계 — fx.x/y 는 궤도 씬 px (성운 백드롭은 JSX에서 orbit→nebula 변환) */
export function drawMissileHitFxOnSkCanvas(
  canvas: SkCanvas,
  dodgeImage: SkImage,
  hitFxList: readonly MissileHitFx[],
  tMs: number,
): void {
  drawNebulaColorDodgeFxOnSkCanvas(canvas, dodgeImage, hitFxList, tMs);
}
