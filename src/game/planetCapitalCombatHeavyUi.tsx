/**

 * 행성 허브 전투 UI — `planetCapitalCombatIntegration`에서만 dynamic import.

 */



import React, { memo, useEffect } from 'react';

import { View, StyleSheet, Platform } from 'react-native';

import {

  CapitalRealtimeCombatHudOverlay,

  CapitalRealtimeCombatOrbitSkia,

  useCapitalRealtimeCombatSimContext,

  type CapitalRealtimeCombatSim,

} from '../combat';

import { SPACING } from '../utils/theme';

import { CombatStanceRow } from './combat/CombatStanceRow';

import {

  PLANET_MAIN_BACKGROUND_SYSTEM_BADGE_BLOCK_EST_PX,

  PLANET_MAIN_ORBIT_SCENE_SIZE as ORBIT_SCENE_SIZE,

} from '../stages/planetMainStageLayout';

import {

  PLANET_MAIN_COMBAT_LAYER_HEIGHT_SCALE_Y,

  PLANET_MAIN_COMBAT_LAYER_WIDTH_SCALE_X,

  PLANET_MAIN_ORBIT_VISUAL_LIFT_PX,

} from './planetHub/planetHubConstants';



export const CombatSimRefBridge = memo(function CombatSimRefBridge({

  targetRef,

}: {

  targetRef: React.MutableRefObject<CapitalRealtimeCombatSim | null>;

}) {

  const sim = useCapitalRealtimeCombatSimContext();

  useEffect(() => {

    targetRef.current = sim;

    return () => {

      targetRef.current = null;

    };

  }, [sim, targetRef]);

  return null;

});



export const PlanetCapitalCombatOrbitForegroundOverlay = memo(

  function PlanetCapitalCombatOrbitForegroundOverlay({

    backgroundChrome,

    planetStageScale,

  }: {

    backgroundChrome: { paddingTop: number; paddingBottom: number };

    planetStageScale: number;

  }) {

    const sim = useCapitalRealtimeCombatSimContext();

    if (!sim) return null;

    return (

      <View style={[overlayStyles.root, backgroundChrome]} pointerEvents="box-none">

        <View style={overlayStyles.planetBgStack}>

          <View

            style={{

              width: '100%',

              maxWidth: 340,

              alignSelf: 'center',

              minHeight: PLANET_MAIN_BACKGROUND_SYSTEM_BADGE_BLOCK_EST_PX,

              marginBottom: SPACING.xs,

            }}

          />

          <View style={overlayStyles.planetOrbitSlot}>

            <View

              style={[

                overlayStyles.planetColumn,

                { transform: [{ translateY: -PLANET_MAIN_ORBIT_VISUAL_LIFT_PX }, { scale: planetStageScale }] },

              ]}

            >

              <View style={overlayStyles.orbitScene}>

                <View style={overlayStyles.orbitTestLayer} pointerEvents="none">

                  <CapitalRealtimeCombatOrbitSkia renderMissileDodgeFx={false} />

                </View>

              </View>

            </View>

          </View>

        </View>

      </View>

    );

  },

);



export { CapitalRealtimeCombatHudOverlay };





export function PlanetMainStanceRow({

  routeFocused,

  planetId,

}: {

  routeFocused: boolean;

  planetId: string | null;

}) {

  return (

    <CombatStanceRow

      routeFocused={routeFocused}

      planetId={planetId}

      bindPlanetSession

    />

  );

}


const overlayStyles = StyleSheet.create({

  root: {

    flex: 1,

    alignItems: 'center',

  },

  planetBgStack: {

    flex: 1,

    width: '100%',

    maxWidth: 430,

    alignSelf: 'center',

  },

  planetOrbitSlot: {

    flex: 1,

    minHeight: 0,

    width: '100%',

    alignItems: 'center',

    justifyContent: 'center',

  },

  planetColumn: {

    alignItems: 'center',

    maxWidth: 430,

    alignSelf: 'center',

    width: '100%',

  },

  orbitScene: {

    width: ORBIT_SCENE_SIZE,

    height: ORBIT_SCENE_SIZE,

    alignSelf: 'center',

    position: 'relative',

    overflow: 'visible',

  },

  orbitTestLayer: {

    ...StyleSheet.absoluteFillObject,

    zIndex: 5,

    transform: [

      { scaleX: PLANET_MAIN_COMBAT_LAYER_WIDTH_SCALE_X },

      { scaleY: PLANET_MAIN_COMBAT_LAYER_HEIGHT_SCALE_Y },

    ],

    ...(Platform.OS === 'android' ? { elevation: 8 } : {}),

  },

});

