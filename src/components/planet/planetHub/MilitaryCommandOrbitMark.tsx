// ============================================================
// 허브 군사령부 마크 — RN + orbitClockMs. 신규 Skia Canvas 없음
// 소행성 1 궤도 · 육각 사령부 + 푸른 도트 6 · 선회·소멸·사출
// ============================================================

import React, { memo } from 'react';
import { View, Text } from 'react-native';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useT } from '../../../i18n';
import { usePlanetCoreRuntimeStore } from '../../../store/planetCoreRuntimeStore';
import { PLANET_DEV_MODULE_MILITARY_COMMAND } from '../../../game/planetDevelopment/planetMilitaryCommandListing';
import { WORLD_OBJECT_ANCHOR_PX } from '../../../game/planetHub/planetHubConstants';
import {
  MILITARY_COMMAND_PATROL_DOCK_MS,
  MILITARY_COMMAND_PATROL_DOT_COUNT,
  MILITARY_COMMAND_PATROL_DOT_PARAMS,
  MILITARY_COMMAND_PATROL_EXIT_PX,
  MILITARY_COMMAND_PATROL_LAUNCH_MS,
  MILITARY_COMMAND_PATROL_RETURN_MS,
  MILITARY_COMMAND_PATROL_WOBBLE,
} from '../../../game/planetHub/militaryCommandPatrolPose';
import { PLANET_MAIN_ORBIT_SCENE_SIZE } from '../../../stages/planetMainStageLayout';
import {
  WORLD_OBJECT_ASTEROID_INNER_RADIUS_SCALE,
  WORLD_OBJECT_ORBIT_CYCLE_MS,
} from '../../../worldObjects/planetWorldObjectOrbit';
import { planetHubBgStyles as bgStyles } from './planetHubStyles';

const ORBIT_CENTER = PLANET_MAIN_ORBIT_SCENE_SIZE / 2;
const COLONY_RADIUS_PX = ORBIT_CENTER * WORLD_OBJECT_ASTEROID_INNER_RADIUS_SCALE;
const COLONY_PHASE_BIAS = 0.5;

const MilitaryCommandPatrolDot = memo(function MilitaryCommandPatrolDot({
  index,
  orbitClockMs,
  combatGray,
}: {
  index: number;
  orbitClockMs: SharedValue<number>;
  combatGray?: boolean;
}) {
  const p = MILITARY_COMMAND_PATROL_DOT_PARAMS[index] ?? MILITARY_COMMAND_PATROL_DOT_PARAMS[0]!;
  const cycleMs = p.cycleMs;
  const patrolMs = p.patrolMs;
  const phase = p.phase;
  const dir = p.dir;
  const rx = p.rx;
  const ry = p.ry;
  const homeAng = p.homeAng;

  const animated = useAnimatedStyle(() => {
    'worklet';
    const dock = MILITARY_COMMAND_PATROL_DOCK_MS;
    const launch = MILITARY_COMMAND_PATROL_LAUNCH_MS;
    const ret = MILITARY_COMMAND_PATROL_RETURN_MS;
    const exitPx = MILITARY_COMMAND_PATROL_EXIT_PX;
    const wobble = MILITARY_COMMAND_PATROL_WOBBLE;
    let local = (orbitClockMs.value + phase * cycleMs) % cycleMs;
    if (local < 0) local += cycleMs;
    if (local < dock) {
      return { opacity: 0, transform: [{ translateX: 0 }, { translateY: 0 }] };
    }
    if (local < dock + launch) {
      const t = (local - dock) / launch;
      const e = 1 - (1 - t) * (1 - t) * (1 - t);
      const ox = Math.cos(homeAng) * rx;
      const oy = Math.sin(homeAng) * ry + Math.sin(2 * homeAng) * wobble * ry;
      const gx = Math.cos(homeAng) * exitPx;
      const gy = Math.sin(homeAng) * exitPx;
      return {
        opacity: e,
        transform: [{ translateX: gx + e * (ox - gx) }, { translateY: gy + e * (oy - gy) }],
      };
    }
    if (local < dock + launch + patrolMs) {
      const t = (local - dock - launch) / patrolMs;
      const ang = homeAng + dir * t * Math.PI * 2;
      return {
        opacity: 1,
        transform: [
          { translateX: Math.cos(ang) * rx },
          { translateY: Math.sin(ang) * ry + Math.sin(2 * ang) * wobble * ry },
        ],
      };
    }
    const t = (local - dock - launch - patrolMs) / ret;
    const e = t * t;
    const s = 1 - e;
    const ox = Math.cos(homeAng) * rx;
    const oy = Math.sin(homeAng) * ry + Math.sin(2 * homeAng) * wobble * ry;
    const gx = Math.cos(homeAng) * exitPx;
    const gy = Math.sin(homeAng) * exitPx;
    return {
      opacity: 1 - e,
      transform: [{ translateX: gx + s * (ox - gx) }, { translateY: gy + s * (oy - gy) }],
    };
  }, [orbitClockMs, cycleMs, patrolMs, phase, dir, rx, ry, homeAng]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        bgStyles.militaryCommandPatrolDot,
        combatGray ? bgStyles.militaryCommandPatrolDotCombat : null,
        animated,
      ]}
    />
  );
});

const MilitaryCommandOrbitVisual = memo(function MilitaryCommandOrbitVisual({
  orbitClockMs,
  combatGray,
}: {
  orbitClockMs: SharedValue<number>;
  combatGray?: boolean;
}) {
  const t = useT();

  const colonyOrbit = useAnimatedStyle(() => {
    'worklet';
    const now = orbitClockMs.value;
    const phase = ((now % WORLD_OBJECT_ORBIT_CYCLE_MS) / WORLD_OBJECT_ORBIT_CYCLE_MS + COLONY_PHASE_BIAS) % 1;
    const angle = phase * Math.PI * 2;
    const x = ORBIT_CENTER + Math.cos(angle) * COLONY_RADIUS_PX;
    const y = ORBIT_CENTER + Math.sin(angle) * COLONY_RADIUS_PX;
    return {
      opacity: 0.9,
      transform: [{ translateX: x - WORLD_OBJECT_ANCHOR_PX }, { translateY: y - WORLD_OBJECT_ANCHOR_PX }],
    };
  }, [orbitClockMs]);

  const dots: React.ReactNode[] = [];
  for (let i = 0; i < MILITARY_COMMAND_PATROL_DOT_COUNT; i += 1) {
    dots.push(
      <MilitaryCommandPatrolDot
        key={`hq-dot-${i}`}
        index={i}
        orbitClockMs={orbitClockMs}
        combatGray={combatGray}
      />,
    );
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[bgStyles.orbitMarkWrap, bgStyles.worldObjectMarkWrap, colonyOrbit]}
    >
      <View style={[bgStyles.orbitMarkLabelCol, bgStyles.worldObjectLabelCol]}>
        <View style={bgStyles.militaryCommandSetWrap} accessibilityLabel={t('hubBg.militaryCommand')}>
          {dots}
          <View style={bgStyles.militaryCommandColonyHex}>
            <View
              style={[
                bgStyles.militaryCommandColonyCapLeft,
                combatGray ? bgStyles.militaryCommandColonyCapLeftCombat : null,
              ]}
            />
            <View
              style={[
                bgStyles.militaryCommandColonyBody,
                combatGray ? bgStyles.militaryCommandColonyBodyCombat : null,
              ]}
            />
            <View
              style={[
                bgStyles.militaryCommandColonyCapRight,
                combatGray ? bgStyles.militaryCommandColonyCapRightCombat : null,
              ]}
            />
          </View>
        </View>
        <Text
          style={[
            bgStyles.worldObjectCaption,
            bgStyles.militaryCommandCaptionOverlay,
            combatGray && bgStyles.hubCombatGrayCaption,
          ]}
          numberOfLines={1}
          ellipsizeMode="clip"
        >
          {t('hubBg.militaryCommand')}
        </Text>
      </View>
    </Animated.View>
  );
});

export const MilitaryCommandOrbitSet = memo(function MilitaryCommandOrbitSet({
  planetId,
  orbitClockMs,
  combatGray,
}: {
  planetId: string;
  orbitClockMs: SharedValue<number>;
  combatGray?: boolean;
}) {
  const installed = usePlanetCoreRuntimeStore((s) => {
    const mod = s.byPlanetId[planetId]?.detail?.development?.byModuleId?.[PLANET_DEV_MODULE_MILITARY_COMMAND];
    const installedFlag = Boolean(mod && 'installed' in mod && mod.installed === true);
    const level = typeof mod?.level === 'number' ? mod.level : 0;
    return installedFlag && level > 0;
  });
  if (!installed) return null;
  return <MilitaryCommandOrbitVisual orbitClockMs={orbitClockMs} combatGray={combatGray} />;
});
