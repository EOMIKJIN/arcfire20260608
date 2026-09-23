/**
 * 개척 원반 1회 래스터 — planetGlobeRuntimeBake만 lazy require.
 * PlanetDot·continue-prewarm 정적 import 금지.
 */
import type { ZoneType } from '../types';
import { PLANET_GLOBE_LOOK_CANON } from './planetGlobeLookCanon';
import { deriveColonizedGlobeLook, seedColonizedLookUniquenessState } from './planetGlobeLookDerive';
import { samplePlanetGlobeLookRgba } from './planetGlobeBakeSample';
import { encodeRgbaToPngDataUri } from './planetGlobePngEncode';

export const PLANET_GLOBE_RUNTIME_BAKE_SIZE_PX = 128;
const ROWS_PER_SLICE = 16;
const RGBA_BYTES = PLANET_GLOBE_RUNTIME_BAKE_SIZE_PX * PLANET_GLOBE_RUNTIME_BAKE_SIZE_PX * 4;

let rgbaScratch: Uint8Array | null = null;

function getRgbaScratch(): Uint8Array {
  if (!rgbaScratch || rgbaScratch.length !== RGBA_BYTES) {
    rgbaScratch = new Uint8Array(RGBA_BYTES);
  }
  return rgbaScratch;
}

function yieldBakeSlice(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

export async function rasterizeColonizedPlanetGlobeDataUri(
  planetId: string,
  zone: ZoneType,
): Promise<string> {
  const { usedSeeds, usedFingerprintsByKind } = seedColonizedLookUniquenessState(PLANET_GLOBE_LOOK_CANON);
  const look = deriveColonizedGlobeLook(planetId, zone, usedSeeds, usedFingerprintsByKind);
  const size = PLANET_GLOBE_RUNTIME_BAKE_SIZE_PX;
  const rgba = getRgbaScratch();
  for (let y0 = 0; y0 < size; y0 += ROWS_PER_SLICE) {
    const y1 = Math.min(size, y0 + ROWS_PER_SLICE);
    for (let y = y0; y < y1; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const [r, g, b, a] = samplePlanetGlobeLookRgba(look, x, y, size);
        const i = (y * size + x) * 4;
        rgba[i] = Math.round(r * 255);
        rgba[i + 1] = Math.round(g * 255);
        rgba[i + 2] = Math.round(b * 255);
        rgba[i + 3] = Math.round(a * 255);
      }
    }
    await yieldBakeSlice();
  }
  return encodeRgbaToPngDataUri(rgba, size, size);
}
