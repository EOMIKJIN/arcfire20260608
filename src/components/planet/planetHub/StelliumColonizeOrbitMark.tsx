import React, { memo, useEffect, useLayoutEffect, useRef } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Polygon } from 'react-native-svg';
import { COLORS } from '../../../utils/theme';
import { useT } from '../../../i18n';
import { planetHubBgStyles as bgStyles } from './planetHubStyles';
import { WORLD_OBJECT_ANCHOR_PX } from '../../../game/planetHub/planetHubConstants';
import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../../stages/planetMainStageLayout';
import type { WorldObject } from '../../../worldObjects';
import { clampStelliumColonizeRadiusScale } from '../../../worldObjects/planetWorldObjectOrbit';
import { useStelliumColonizeStore } from '../../../store/stelliumColonizeStore';
import { isStelliumColonizeMarkPhase } from '../../../arcCore/colonize/stelliumColonizeTypes';
import { resolveStelliumColonizeFleet } from '../../../arcCore/colonize/stelliumColonizeFleet';
import { buildStelliumColonizeTrafficShip } from '../../../arcCore/colonize/stelliumColonizeTrafficPose';
import { computeArcNpcShipScreenPacked } from '../planetOrbitHubWorklets';
import {
  createArcOrbitPackEpochState,
  packArcNpcShipsWithEpoch,
} from '../arcOrbitPackEpoch';

const HEX_POINTS = '10,1.6 18.1,6.2 18.1,13.8 10,18.4 1.9,13.8 1.9,6.2';
const BLINK_HALF_MS = 720;
const ORBIT_CENTER = PLANET_MAIN_ORBIT_SCENE_SIZE / 2;
/** 개척 중 표시 — 궤도 마크 점 · 행성 외곽 볼드 림 */
export const STELLIUM_COLONIZE_ORANGE = '#FF8A2A';

export const StelliumColonizeOrbitMark = React.memo(function StelliumColonizeOrbitMark() {
  const t = useT();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(0.28, {
        duration: BLINK_HALF_MS,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
    return () => {
      pulse.value = 1;
    };
  }, [pulse]);

  const blink = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return (
    <View
      style={bgStyles.worldObjectStelliumColonizeWrap}
      accessibilityLabel={t('hubBg.stelliumColonize')}
    >
      <Svg width={20} height={20} viewBox="0 0 20 20" pointerEvents="none">
        <Polygon
          points={HEX_POINTS}
          fill="rgba(61, 191, 122, 0.12)"
          stroke={COLORS.exp}
          strokeWidth={1.6}
        />
      </Svg>
      <Animated.View style={[bgStyles.worldObjectStelliumColonizeCore, blink]} />
    </View>
  );
});

/**
 * 아크 수송선단과 동일 — `computeArcNpcShipScreenPacked`(entering → dwelling).
 * 5분 in_flight는 외곽에서 접근, 전초기지 이후 근궤도 체류 회전.
 */
export const StelliumColonizeOrbitTrafficMark = memo(function StelliumColonizeOrbitTrafficMark({
  object,
  orbitClockMs,
  combatGray,
}: {
  object: WorldObject;
  orbitClockMs: SharedValue<number>;
  combatGray?: boolean;
}) {
  const t = useT();
  const row = useStelliumColonizeStore((s) => s.byPlanetId[object.planetId]);
  const revision = useStelliumColonizeStore((s) => s.revision);
  const orbitRadiusPx = ORBIT_CENTER * clampStelliumColonizeRadiusScale(object.transform.radiusScale);
  const flatSv = useSharedValue<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const syncMsSv = useSharedValue(0);
  const packEpochRef = useRef(createArcOrbitPackEpochState());
  const packSigRef = useRef('');
  const packSig = `${object.planetId}:${row?.phase ?? ''}:${row?.outpostDueAtMs ?? ''}:${revision}:${orbitRadiusPx}`;

  useLayoutEffect(() => {
    if (!row || !isStelliumColonizeMarkPhase(row.phase)) return;
    if (packSigRef.current === packSig) return;
    packSigRef.current = packSig;
    const fleet = resolveStelliumColonizeFleet();
    const ship = buildStelliumColonizeTrafficShip({
      record: row,
      nowMs: Date.now(),
      orbitRadiusPx,
      outpostArriveSec: fleet.outpostArriveSec,
      orbitAngleRad: object.transform.phaseBias * Math.PI * 2,
    });
    if (!ship) return;
    const { flat, syncMs } = packArcNpcShipsWithEpoch([ship], packEpochRef.current);
    flatSv.value = flat;
    syncMsSv.value = syncMs;
  }, [flatSv, object.transform.phaseBias, orbitRadiusPx, packSig, row, syncMsSv]);

  const animated = useAnimatedStyle(() => {
    'worklet';
    const p = computeArcNpcShipScreenPacked(
      0,
      orbitClockMs.value,
      syncMsSv.value,
      flatSv.value,
      1,
      ORBIT_CENTER,
    );
    if (!p) {
      return {
        opacity: 0,
        transform: [{ translateX: -9999 }, { translateY: -9999 }],
      };
    }
    return {
      opacity: p.opacity,
      transform: [
        { translateX: p.x - WORLD_OBJECT_ANCHOR_PX },
        { translateY: p.y - WORLD_OBJECT_ANCHOR_PX },
      ],
    };
  }, [flatSv, orbitClockMs, syncMsSv]);

  if (!row || !isStelliumColonizeMarkPhase(row.phase)) return null;

  return (
    <Animated.View style={[bgStyles.orbitMarkWrap, bgStyles.worldObjectMarkWrap, animated]}>
      <View style={[bgStyles.orbitMarkLabelCol, bgStyles.worldObjectLabelCol]}>
        <StelliumColonizeOrbitMark />
        <Text
          style={[
            bgStyles.worldObjectCaption,
            bgStyles.worldObjectCaptionOverlay,
            combatGray && bgStyles.hubCombatGrayCaption,
          ]}
          numberOfLines={1}
          ellipsizeMode="clip"
        >
          {t(object.title)}
        </Text>
      </View>
    </Animated.View>
  );
});
