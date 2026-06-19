import React, { memo, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type ImageSourcePropType } from 'react-native';
import {
  Canvas,
  Fill,
  Group,
  Image as SkiaImage,
  Paint,
  useImage,
} from '@shopify/react-native-skia';
import { registerPlanetSessionResource } from '../../game/planetSessionRegistry';
import { registerGpuLayer, unregisterGpuLayer } from '../../game/planetStageGpuSupervisor';
import type { MissileHitFx } from './PlanetEdenRaidTestLayer';
import { INBOUND_DRONE_FX_ORBIT_AGE_SLOP_MS } from './planetSkiaHitFxContract';
import {
  NEBULA_DODGE_FX_RENDER_LIMIT,
  resolveNebulaDodgeFxDurationMs,
  resolveNebulaDodgeFxPulse,
  resolveNebulaDodgeFxSizeScale,
} from './planetSkiaHitFxContract';

const DODGE_HIT_FX_RENDER_LIMIT = NEBULA_DODGE_FX_RENDER_LIMIT;

/** @deprecated 행·전투 배경은 `PlanetNebulaImageBackdrop`(RN Image). dodge FX는 궤도 SkPicture. */
export const SkiaPlanetNebulaShaderBackdrop = memo(function SkiaPlanetNebulaShaderBackdrop({
  size,
  active = true,
  dodgeFxActive,
  nebulaBakedImageSource = null,
  renderNebulaShader = true,
  backgroundImageSource = null,
  dodgeHitFxRef = null,
  dodgeTimeMsRef = null,
  dodgeOrbitSize = 0,
  dodgeOrbitVisualScaleX = 1,
  dodgeOrbitVisualScaleY = 1,
  dodgeOrbitOffsetX = 0,
  dodgeOrbitOffsetY = 0,
  sessionPlanetId = null,
  onNebulaImagesReady,
  onNebulaImagesLost,
  opacity = 1,
  /** true — useImage 프리로드만, Canvas·dark Fill 미생성(깜박임 방지) */
  hideUntilImagesReady = false,
  dodgeFxOnlyOverlay = false,
}: {
  size: number;
  /** @deprecated dodgeFxActive 사용 — GPU·interval 게이트 */
  active?: boolean;
  /** colorDodge FX tick·GPU supervisor — idle prefetch 시 false */
  dodgeFxActive?: boolean;
  /** dual-stack: RN 성운 아래 colorDodge FX 전용 — nebula/backdrop SkImage 로드 금지 */
  dodgeFxOnlyOverlay?: boolean;
  nebulaBakedImageSource?: ImageSourcePropType | null;
  renderNebulaShader?: boolean;
  backgroundImageSource?: unknown;
  dodgeHitFxRef?: React.MutableRefObject<MissileHitFx[]> | null;
  dodgeTimeMsRef?: React.MutableRefObject<number> | null;
  dodgeOrbitSize?: number;
  dodgeOrbitVisualScaleX?: number;
  dodgeOrbitVisualScaleY?: number;
  dodgeOrbitOffsetX?: number;
  dodgeOrbitOffsetY?: number;
  /** Stage 1 행성 허브 — setInterval을 planet session dispose에 연동 */
  sessionPlanetId?: string | null;
  /** Skia useImage 프리로드 완료 — Canvas·dark Fill 미생성(깜박임 방지) */
  onNebulaImagesReady?: () => void;
  /** 한 번 ready였던 이미지가 소실(useImage null 복귀)됨 — 부모가 RN 폴백 재표시용 */
  onNebulaImagesLost?: () => void;
  opacity?: number;
  hideUntilImagesReady?: boolean;
}) {
  const fxLoopActive = dodgeFxActive ?? active;
  /** dual-stack 오вер레이도 colorDodge는 성운 SkImage와 동일 Canvas 필수(투명 Picture 위 dodge = 깨짐) */
  const loadNebulaImages = true;
  const [frameTickMs, setFrameTickMs] = useState(() => Date.now());
  const imagesReadyNotifiedRef = useRef(false);
  const everReadyRef = useRef(false);

  useEffect(() => {
    if (!fxLoopActive) return undefined;
    registerGpuLayer('skia_nebula_backdrop', 'T0');
    return () => {
      unregisterGpuLayer('skia_nebula_backdrop');
    };
  }, [fxLoopActive]);

  useEffect(() => {
    if (!fxLoopActive) return () => {};
    const id = setInterval(() => {
      if (!fxLoopActive) return;
      let needsRedraw = false;
      if (dodgeHitFxRef?.current?.length) {
        const t = dodgeTimeMsRef?.current ?? 0;
        const fxList = dodgeHitFxRef.current;
        for (let i = 0; i < fxList.length; i += 1) {
          const fx = fxList[i]!;
          const age = t - fx.startMs;
          if (age >= -INBOUND_DRONE_FX_ORBIT_AGE_SLOP_MS && age <= resolveNebulaDodgeFxDurationMs(fx)) {
            needsRedraw = true;
            break;
          }
        }
      }
      if (needsRedraw) setFrameTickMs(Date.now());
    }, 50);
    const sessionToken = sessionPlanetId
      ? registerPlanetSessionResource({
        ownerId: 'skia_nebula_dodge_fx_tick',
        planetId: sessionPlanetId,
        dispose: () => clearInterval(id),
      })
      : null;
    return () => {
      clearInterval(id);
      sessionToken?.release();
    };
  }, [fxLoopActive, dodgeHitFxRef, dodgeTimeMsRef, sessionPlanetId]);

  void frameTickMs;

  const nebulaImage = useImage(loadNebulaImages && renderNebulaShader ? ((nebulaBakedImageSource as any) ?? null) : null);
  const backdropImage = useImage(loadNebulaImages && backgroundImageSource ? (backgroundImageSource as any) : null);
  const dodgeImage = useImage(require('../../../assets/images/effects/color_dodge_02.png'));

  useEffect(() => {
    if (!loadNebulaImages) return;
    imagesReadyNotifiedRef.current = false;
  }, [loadNebulaImages, nebulaBakedImageSource, backgroundImageSource, renderNebulaShader]);

  useEffect(() => {
    if (!loadNebulaImages || imagesReadyNotifiedRef.current || !onNebulaImagesReady) return;
    if (dodgeFxOnlyOverlay) return;
    const nebulaOk = !renderNebulaShader || !nebulaBakedImageSource || Boolean(nebulaImage);
    const backdropOk = !backgroundImageSource || Boolean(backdropImage);
    if (!nebulaOk || !backdropOk) return;
    imagesReadyNotifiedRef.current = true;
    onNebulaImagesReady();
  }, [
    loadNebulaImages,
    backdropImage,
    backgroundImageSource,
    nebulaBakedImageSource,
    nebulaImage,
    onNebulaImagesReady,
    renderNebulaShader,
  ]);
  const dodgeHitFx = dodgeHitFxRef?.current;
  const dodgeTimeMs = dodgeTimeMsRef?.current ?? 0;
  const canRenderDodgeHitFx = Boolean(dodgeHitFx && dodgeOrbitSize > 0 && dodgeImage);
  const showNebulaBaked = loadNebulaImages && renderNebulaShader && Boolean(nebulaImage);
  const showBackdropImage = loadNebulaImages && Boolean(backdropImage);
  const imagesReady =
    (!renderNebulaShader || !nebulaBakedImageSource || Boolean(nebulaImage))
    && (!backgroundImageSource || Boolean(backdropImage));
  const deferCanvas = hideUntilImagesReady && !imagesReady;

  // 이미지가 한 번 ready였다가 소실되면(useImage null 복귀: 서브메뉴 왕복 등) 부모에 알려
  // RN 폴백을 재표시하게 한다(서브메뉴 후 성운 소실·미복구 버그 수정). 소실 중엔 불투명
  // dark Fill 을 그리지 않아(투명 유지) 깜박임을 줄인다.
  useEffect(() => {
    if (dodgeFxOnlyOverlay) return;
    if (imagesReady) {
      everReadyRef.current = true;
    } else if (everReadyRef.current) {
      everReadyRef.current = false;
      imagesReadyNotifiedRef.current = false;
      onNebulaImagesLost?.();
    }
  }, [dodgeFxOnlyOverlay, imagesReady, onNebulaImagesLost]);

  useEffect(() => {
    if (!dodgeFxOnlyOverlay || !onNebulaImagesReady) return;
    if (!imagesReady) {
      if (imagesReadyNotifiedRef.current) {
        imagesReadyNotifiedRef.current = false;
        onNebulaImagesLost?.();
      }
      return;
    }
    if (imagesReadyNotifiedRef.current) return;
    imagesReadyNotifiedRef.current = true;
    onNebulaImagesReady();
  }, [dodgeFxOnlyOverlay, imagesReady, onNebulaImagesReady, onNebulaImagesLost]);

  if (dodgeFxOnlyOverlay && !fxLoopActive) {
    return <View style={[styles.root, { opacity, width: size, height: size }]} pointerEvents="none" />;
  }

  // dodge-only: nebula 로드 전엔 투명 유지(RN 성운 노출). full backdrop은 dark Fill.
  const fillWhenEmpty =
    !dodgeFxOnlyOverlay && !showNebulaBaked && !showBackdropImage && !everReadyRef.current;

  // SkImage(useImage 반환) 수동 dispose 금지 — 훅이 언마운트·소스 변경 시 수명을 자체 관리한다.
  // 수동 .dispose()는 <SkiaImage>(JsiImageNode)가 아직 참조 중인 SkImage를 조기 해제해
  // 이중 해제(use-after-free)를 유발하고, GC FinalizerDaemon 의 JsiImageNode 파괴 시
  // SIGSEGV(null deref)로 이어진다(2026-06-17 크래시). 해제는 react-native-skia 가 담당.

  return (
    <View style={[styles.root, { opacity, width: size, height: size }]} pointerEvents="none">
      {deferCanvas ? null : (
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
        {showNebulaBaked ? (
          <SkiaImage
            image={nebulaImage}
            x={0}
            y={0}
            width={size}
            height={size}
            fit="cover"
          />
        ) : null}
        {canRenderDodgeHitFx
          ? (() => {
            const nodes: React.ReactNode[] = [];
            for (let i = dodgeHitFx!.length - 1; i >= 0; i -= 1) {
              if (nodes.length >= DODGE_HIT_FX_RENDER_LIMIT) break;
              const fx = dodgeHitFx![i]!;
              const age = dodgeTimeMs - fx.startMs;
              const fxDurationMs = resolveNebulaDodgeFxDurationMs(fx);
              if (age < -INBOUND_DRONE_FX_ORBIT_AGE_SLOP_MS || age > fxDurationMs) continue;
              const pulse = resolveNebulaDodgeFxPulse(
                age,
                fxDurationMs,
                resolveNebulaDodgeFxSizeScale(fx),
              );
              if (!pulse) continue;
              const { pulseSize, pulseOpacity } = pulse;
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
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
});
