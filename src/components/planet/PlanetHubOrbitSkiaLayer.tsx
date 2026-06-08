// ============================================================
// 행성 허브 궤도 — Skia: ◇ 경로만 / 함장 캡션: 전투 궤도와 동일하게 RN Text(절대 위치)
// `PlanetEdenRaidOrbitSkiaCombat` — Canvas 밖 `Text` + `FONTS.mono` (시스템 한글 폴백)
// ============================================================

import React, { memo, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import Animated, { type SharedValue, useAnimatedStyle, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import type { ArcNpcTrafficShip } from '../../store/arcNpcTrafficStore';
import { FONTS } from '../../utils/theme';
import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../stages/planetMainStageLayout';
import { appendSkiaDiamondPath, computeArcNpcShipScreenPacked, packArcNpcShipsToFloat32 } from './planetOrbitHubWorklets';

const AnimatedText = Animated.createAnimatedComponent(Text);

const HUB_ARC_CAPTION_MAX = 12;
const ARC_DIAMOND_R = 7;
const CAPTION_DY = 10;
const CAPTION_WIDTH = 72;
const CAPTION_OFFSET_X = 36;

const orbitCaptionStyles = StyleSheet.create({
  table: {
    position: 'absolute',
    width: CAPTION_WIDTH,
    fontFamily: FONTS.mono,
    fontSize: 7,
    lineHeight: 9,
    textAlign: 'center',
    color: 'rgba(200,208,220,0.92)',
    textShadowColor: 'rgba(6,10,20,0.75)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1.5,
  },
  arc: {
    position: 'absolute',
    width: CAPTION_WIDTH,
    fontFamily: FONTS.mono,
    fontSize: 7,
    lineHeight: 9,
    textAlign: 'center',
    color: 'rgba(220,200,255,0.92)',
    textShadowColor: 'rgba(20,10,32,0.65)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1.5,
  },
});

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
  },
});

const HubArcRnCaption = memo(function HubArcRnCaption({
  index,
  caption,
  orbitClockMs,
  syncMsSv,
  flatSv,
  shipCountSv,
  center,
}: {
  index: number;
  caption: string;
  orbitClockMs: SharedValue<number>;
  syncMsSv: SharedValue<number>;
  flatSv: SharedValue<number[]>;
  shipCountSv: SharedValue<number>;
  center: number;
}) {
  const animated = useAnimatedStyle(() => {
    'worklet';
    if (caption.length === 0) {
      return { left: -9999, top: 0, opacity: 0 };
    }
    const p = computeArcNpcShipScreenPacked(
      index,
      orbitClockMs.value,
      syncMsSv.value,
      flatSv.value,
      shipCountSv.value,
      center,
    );
    if (!p) {
      return { left: -9999, top: 0, opacity: 0 };
    }
    return {
      left: p.x - CAPTION_OFFSET_X,
      top: p.y + CAPTION_DY,
      opacity: p.opacity,
    };
  }, [caption, index, center]);

  return (
    <AnimatedText style={[orbitCaptionStyles.arc, animated]} numberOfLines={1} ellipsizeMode="tail">
      {caption}
    </AnimatedText>
  );
});

export const PlanetHubOrbitSkiaLayer = memo(function PlanetHubOrbitSkiaLayer({
  orbitClockMs,
  arcShips,
  arcCaptionHeads,
  paused = false,
}: {
  orbitClockMs: SharedValue<number>;
  arcShips: ArcNpcTrafficShip[];
  arcCaptionHeads: string[];
  /**
   * Phase 1: 메인스테이지가 비포커스(워드맵·시설 push 직후)일 때 worklet 재계산을 스킵.
   * orbitClockMs 자체가 비포커스 시 정지하므로 이 가드는 보조이지만, derived/animated style 의
   * 1회성 invalidation 도 건너뛰어 GPU 큐를 더 가볍게 한다.
   */
  paused?: boolean;
}) {
  const flatSv = useSharedValue<number[]>([]);
  const syncMsSv = useSharedValue(0);
  const shipCountSv = useSharedValue(0);
  /** 매 프레임 `Skia.Path.Make()` 대신 단일 경로를 rewind 해 재사용 — 네이티브 Path 할당 폭주 방지 */
  const hubArcDiamondPath = useSharedValue(Skia.Path.Make());
  const arcPackSigRef = useRef('');

  const arcPackSig = useMemo(
    () =>
      arcShips
        .map(s =>
          [
            s.id,
            s.phase,
            s.phaseDurationSec.toFixed(3),
            s.orbitRadiusPx.toFixed(2),
            s.edgeAngleRad.toFixed(4),
            s.arcTrafficDwellRadPerSec.toFixed(4),
          ].join(':'),
        )
        .join('|'),
    [arcShips],
  );

  useLayoutEffect(() => {
    if (arcPackSigRef.current === arcPackSig) return;
    arcPackSigRef.current = arcPackSig;
    shipCountSv.value = arcShips.length;
    flatSv.value = packArcNpcShipsToFloat32(arcShips);
    syncMsSv.value = orbitClockMs.value;
  }, [arcPackSig, arcShips, orbitClockMs, flatSv, shipCountSv, syncMsSv]);

  useEffect(() => {
    return () => {
      try {
        const p = hubArcDiamondPath.value;
        (p as unknown as { dispose?: () => void }).dispose?.();
      } catch {
        /* 언마운트 시 dispose 미지원·실패 무시 */
      }
    };
  }, [hubArcDiamondPath]);

  const center = PLANET_MAIN_ORBIT_SCENE_SIZE / 2;
  const sceneSize = PLANET_MAIN_ORBIT_SCENE_SIZE;

  const arcDiamondPath = useDerivedValue(() => {
    'worklet';
    const p = hubArcDiamondPath.value;
    const anyP = p as unknown as { rewind?: () => void; reset?: () => void };
    if (typeof anyP.rewind === 'function') anyP.rewind();
    else if (typeof anyP.reset === 'function') anyP.reset();
    if (paused) return p;
    const m = orbitClockMs.value;
    const t0 = syncMsSv.value;
    const flat = flatSv.value;
    const shipCount = shipCountSv.value;
    const n = Math.min(shipCount, Math.floor(flat.length / 7));
    for (let i = 0; i < n; i++) {
      const pt = computeArcNpcShipScreenPacked(i, m, t0, flat, shipCount, center);
      if (pt) appendSkiaDiamondPath(p, pt.x, pt.y, ARC_DIAMOND_R);
    }
    return p;
  });

  const arcCaptionSlots = useMemo(
    () => Array.from({ length: HUB_ARC_CAPTION_MAX }, (_, i) => arcCaptionHeads[i] ?? ''),
    [arcCaptionHeads],
  );

  return (
    <View
      style={styles.root}
      pointerEvents="none"
      accessibilityLabel="행성 궤도 함선"
      accessibilityRole="image"
      accessible
    >
      <Canvas style={{ width: sceneSize, height: sceneSize }} pointerEvents="none">
        <Group>
          <Path path={arcDiamondPath} style="stroke" strokeWidth={3.2} opacity={0.14} color="#B084FF" />
          <Path path={arcDiamondPath} style="stroke" strokeWidth={2} opacity={0.32} color="#B084FF" />
          <Path path={arcDiamondPath} style="stroke" strokeWidth={1.25} color="#E8D4FF" />
          <Path path={arcDiamondPath} style="fill" color="rgba(176,132,255,0.22)" />
        </Group>
      </Canvas>
      {arcCaptionSlots.map((caption, index) => (
        <HubArcRnCaption
          key={`hub-acap-rn-${index}`}
          index={index}
          caption={caption}
          orbitClockMs={orbitClockMs}
          syncMsSv={syncMsSv}
          flatSv={flatSv}
          shipCountSv={shipCountSv}
          center={center}
        />
      ))}
    </View>
  );
});
