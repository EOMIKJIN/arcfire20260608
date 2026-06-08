import React, { memo, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Canvas,
  Fill,
  Group,
  Image as SkiaImage,
  Paint,
  Shader,
  Skia,
  useImage,
} from '@shopify/react-native-skia';
import type { PlanetNebulaProfile } from '../../store/planetNebulaStore';
import type { MissileHitFx } from './PlanetEdenRaidTestLayer';

const DODGE_HIT_FX_DURATION_MS = 203;
const DODGE_HIT_FX_RENDER_LIMIT = 12;

function resolveDodgeFxDurationMs(fx: MissileHitFx): number {
  if (fx.effectKind === 'laser_dodge') return Math.max(1, Math.round(DODGE_HIT_FX_DURATION_MS * 0.5));
  return DODGE_HIT_FX_DURATION_MS;
}

function resolveDodgeFxSizeScale(fx: MissileHitFx): number {
  if (fx.effectKind === 'laser_dodge') return 0.5;
  return 1;
}

const PLANET_NEBULA_SKSL = Skia.RuntimeEffect.Make(`
uniform float2 u_res;
uniform float u_t;
uniform float u_seed;
uniform float u_flow;
uniform float u_swirl;
uniform float u_density;
uniform float3 u_col_a;
uniform float3 u_col_b;
uniform float3 u_col_c;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7)) + u_seed * 0.00021) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.53;
  }
  return v;
}

half4 main(float2 fragcoord) {
  vec2 uv = fragcoord / max(u_res.xy, vec2(1.0));
  vec2 p = (uv - 0.5) * vec2(2.3, 1.7);
  float t = u_t * u_flow;
  float sw = max(0.6, u_swirl);
  float d = clamp(u_density, 0.05, 1.4);

  float n1 = fbm(p * (2.0 + d * 0.4) + vec2(0.0, t));
  float n2 = fbm(p * (3.1 + d * 0.5) + vec2(t * 0.9, -t * 0.35));
  float n3 = fbm(p * (4.9 + d * 0.3) + vec2(-t * 0.65, t * 0.52));
  float n = n1 * 0.5 + n2 * 0.32 + n3 * 0.18;
  float spiral = sin((p.x * 1.4 + p.y * 1.1) * sw + t * 2.2) * 0.08;
  n += spiral;

  float fog = smoothstep(0.22, 0.88, n);
  float ridge = smoothstep(0.6, 0.94, n + 0.04 * sin((p.x - p.y) * 5.2 + t * 1.3));
  vec3 col = u_col_a;
  col += u_col_b * fog * (0.68 + d * 0.2);
  col += u_col_c * ridge * (0.48 + d * 0.36);

  float vignette = smoothstep(1.34, 0.36, length(p * vec2(1.0, 1.2)));
  col *= vignette;
  // 원형이 아닌 "구름형" 알파 마스크:
  // 각도/노이즈 기반으로 경계를 흔들어 성운 본체만 남기고 바깥은 투명 처리
  vec2 c = uv - vec2(0.5);
  float r = length(c);
  float ang = atan(c.y, c.x);
  float wobble =
    (fbm(c * 6.2 + vec2(u_t * 0.10, -u_t * 0.08)) - 0.5) * 0.10 +
    sin(ang * 3.0 + u_t * 0.24) * 0.020 +
    sin(ang * 7.0 - u_t * 0.17) * 0.013;
  float cloudCore = 0.35 + wobble;
  float cloudOuter = cloudCore + 0.16;
  float edgeFade = 1.0 - smoothstep(cloudCore, cloudOuter, r);
  // 외곽 끝단을 한 번 더 길게 감쇠해 경계선 체감을 제거
  float tailFade = 1.0 - smoothstep(cloudOuter - 0.02, cloudOuter + 0.08, r);
  float alpha = clamp(edgeFade * tailFade * vignette, 0.0, 1.0);
  return half4(col, alpha);
}
`);

function hexToRgb01(hex: string): [number, number, number] {
  const raw = hex.startsWith('#') ? hex.slice(1) : hex;
  const n = parseInt(raw.padStart(6, '0').slice(0, 6), 16);
  return [((n >> 16) & 0xff) / 255, ((n >> 8) & 0xff) / 255, (n & 0xff) / 255];
}

export const SkiaPlanetNebulaShaderBackdrop = memo(function SkiaPlanetNebulaShaderBackdrop({
  size,
  active,
  profile,
  renderNebulaShader = true,
  backgroundImageSource = null,
  dodgeHitFxRef = null,
  dodgeTimeMsRef = null,
  dodgeOrbitSize = 0,
  dodgeOrbitVisualScaleX = 1,
  dodgeOrbitVisualScaleY = 1,
  dodgeOrbitOffsetX = 0,
  dodgeOrbitOffsetY = 0,
}: {
  size: number;
  active: boolean;
  profile: PlanetNebulaProfile | null;
  renderNebulaShader?: boolean;
  backgroundImageSource?: unknown;
  dodgeHitFxRef?: React.MutableRefObject<MissileHitFx[]> | null;
  dodgeTimeMsRef?: React.MutableRefObject<number> | null;
  dodgeOrbitSize?: number;
  dodgeOrbitVisualScaleX?: number;
  dodgeOrbitVisualScaleY?: number;
  dodgeOrbitOffsetX?: number;
  dodgeOrbitOffsetY?: number;
}) {
  const [frameTickMs, setFrameTickMs] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return () => {};
    const intervalMs = renderNebulaShader ? 80 : 50;
    const id = setInterval(() => {
      if (!active) return;
      let needsRedraw = renderNebulaShader;
      if (!needsRedraw && dodgeHitFxRef?.current?.length) {
        const t = dodgeTimeMsRef?.current ?? 0;
        const fxList = dodgeHitFxRef.current;
        for (let i = 0; i < fxList.length; i += 1) {
          const fx = fxList[i]!;
          const age = t - fx.startMs;
          if (age >= 0 && age <= resolveDodgeFxDurationMs(fx)) {
            needsRedraw = true;
            break;
          }
        }
      }
      if (needsRedraw) setFrameTickMs(Date.now());
    }, intervalMs);
    return () => clearInterval(id);
  }, [active, renderNebulaShader, dodgeHitFxRef, dodgeTimeMsRef]);

  const tSec = frameTickMs / 1000;
  const colA = hexToRgb01(profile?.paletteA ?? '#111827');
  const colB = hexToRgb01(profile?.paletteB ?? '#2b4a7a');
  const colC = hexToRgb01(profile?.paletteC ?? '#7aa5d8');
  const effect = PLANET_NEBULA_SKSL;
  const backdropImage = useImage((backgroundImageSource as any) ?? null);
  const dodgeImage = useImage(require('../../../assets/images/effects/color_dodge_02.png'));
  const dodgeHitFx = dodgeHitFxRef?.current;
  const dodgeTimeMs = dodgeTimeMsRef?.current ?? 0;
  const canRenderDodgeHitFx = Boolean(dodgeHitFx && dodgeOrbitSize > 0 && dodgeImage);
  const showBackdropImage = Boolean(backdropImage);
  const fillWhenEmpty = !renderNebulaShader && !showBackdropImage;

  useEffect(() => {
    return () => {
      try {
        (backdropImage as unknown as { dispose?: () => void })?.dispose?.();
      } catch {
        /* SkImage.dispose 미지원·이중 호출 방어 */
      }
    };
  }, [backdropImage]);

  useEffect(() => {
    return () => {
      try {
        (dodgeImage as unknown as { dispose?: () => void })?.dispose?.();
      } catch {
        /*同上*/
      }
    };
  }, [dodgeImage]);

  return (
    <View style={styles.root} pointerEvents="none">
      {effect ? (
        <Canvas style={{ width: size, height: size }}>
          {fillWhenEmpty ? <Fill color="#0a0f18" /> : null}
          {showBackdropImage ? (
            <SkiaImage
              image={backdropImage}
              x={0}
              y={0}
              width={size}
              height={size}
              fit="cover"
              opacity={0.42}
            />
          ) : null}
          {renderNebulaShader ? (
            <Fill>
              <Shader
                source={effect}
                uniforms={{
                  u_res: [size, size],
                  u_t: tSec,
                  u_seed: profile?.seed ?? 1,
                  u_flow: profile?.flowSpeed ?? 0.02,
                  u_swirl: profile?.swirl ?? 1.2,
                  u_density: profile?.density ?? 0.4,
                  u_col_a: colA,
                  u_col_b: colB,
                  u_col_c: colC,
                }}
              />
            </Fill>
          ) : null}
          {canRenderDodgeHitFx
            ? (() => {
              const nodes: React.ReactNode[] = [];
              for (let i = dodgeHitFx!.length - 1; i >= 0; i -= 1) {
                if (nodes.length >= DODGE_HIT_FX_RENDER_LIMIT) break;
                const fx = dodgeHitFx![i]!;
                const age = dodgeTimeMs - fx.startMs;
                const fxDurationMs = resolveDodgeFxDurationMs(fx);
                if (age < 0 || age > fxDurationMs) continue;
                const t01 = Math.max(0, Math.min(1, age / fxDurationMs));
                const pulse = 1 - Math.abs(t01 * 2 - 1); // 0 -> 1 -> 0
                const baseSizeScale = resolveDodgeFxSizeScale(fx);
                const pulseScale = (0.72 + pulse * 0.85) * baseSizeScale;
                const pulseSize = 60 * pulseScale;
                const pulseOpacity = Math.max(0, 1 - Math.pow(t01, 0.58));
                if (pulseOpacity < 0.015) continue;
                const orbitCenter = dodgeOrbitSize / 2;
                const px = size / 2 + dodgeOrbitOffsetX + (fx.x - orbitCenter) * dodgeOrbitVisualScaleX;
                const py = size / 2 + dodgeOrbitOffsetY + (fx.y - orbitCenter) * dodgeOrbitVisualScaleY;
                nodes.push(
                  <Group key={`nebula-hit-${fx.id}-${fx.startMs}`} layer={<Paint blendMode="colorDodge" opacity={pulseOpacity} />}>
                    <SkiaImage
                      image={dodgeImage!}
                      x={px - pulseSize * 0.5}
                      y={py - pulseSize * 0.5}
                      width={pulseSize}
                      height={pulseSize}
                    />
                  </Group>,
                );
              }
              return nodes;
            })()
            : null}
        </Canvas>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
});

