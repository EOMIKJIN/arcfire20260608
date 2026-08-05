/**

 * 행성 허브 전투 UI — `planetCapitalCombatIntegration`에서만 dynamic import.

 */



import React, { memo, useCallback, useEffect, useState } from 'react';

import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

import {

  CapitalRealtimeCombatHudOverlay,

  CapitalRealtimeCombatOrbitSkia,

  useCapitalRealtimeCombatSimContext,

  type CapitalRealtimeCombatSim,

} from '../combat';

import { COLORS, FONTS, SPACING } from '../utils/theme';

import { useBattleStanceStore, BATTLE_STANCE_META } from '../store/battleStanceStore';
import { useT } from '../i18n';

import {

  PLANET_MAIN_BACKGROUND_SYSTEM_BADGE_BLOCK_EST_PX,

  PLANET_MAIN_ORBIT_SCENE_SIZE as ORBIT_SCENE_SIZE,

} from '../stages/planetMainStageLayout';

import {

  PLANET_MAIN_COMBAT_LAYER_HEIGHT_SCALE_Y,

  PLANET_MAIN_COMBAT_LAYER_WIDTH_SCALE_X,

  PLANET_MAIN_ORBIT_VISUAL_LIFT_PX,

  PLANET_MAIN_STANCE_ENGAGEMENT_POLL_MS,

  PLANET_MAIN_STANCE_UI_DELAY_MS,

} from './planetHub/planetHubConstants';

import { usePlanetHubInterval } from './planetHub/usePlanetHubInterval';

import { usePlanetHubTimeout } from './planetHub/usePlanetHubTimeout';



function computeMainStageCapitalEngagement(sim: CapitalRealtimeCombatSim): boolean {

  const agents = sim.agentsRef.current;

  let blueAlive = false;

  let foeAlive = false;

  for (let i = 0; i < agents.length; i += 1) {

    const a = agents[i]!;

    if (!a.alive) continue;

    if (a.team === 'blue') blueAlive = true;

    if (a.team === 'red' || a.team === 'orange') foeAlive = true;

  }

  return blueAlive && foeAlive;

}



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

  const sim = useCapitalRealtimeCombatSimContext();

  const t = useT();

  const activeStance = useBattleStanceStore((s) => s.activeStance);

  const setBattleStance = useBattleStanceStore((s) => s.setStance);

  const [engaged, setEngaged] = useState(false);

  const [delayReady, setDelayReady] = useState(false);



  const pollEngagement = useCallback(() => {

    if (!sim || !routeFocused) {

      setEngaged(false);

      return;

    }

    setEngaged(computeMainStageCapitalEngagement(sim));

  }, [sim, routeFocused]);



  useEffect(() => {

    if (!sim || !routeFocused) {

      setEngaged(false);

      return;

    }

    pollEngagement();

  }, [sim, routeFocused, pollEngagement]);



  usePlanetHubInterval(

    'planet_main_stance_engagement_poll',

    planetId,

    Boolean(sim && routeFocused),

    PLANET_MAIN_STANCE_ENGAGEMENT_POLL_MS,

    pollEngagement,

  );



  useEffect(() => {

    if (!engaged) setDelayReady(false);

  }, [engaged]);



  usePlanetHubTimeout(

    'planet_main_stance_ui_delay',

    planetId,

    engaged,

    PLANET_MAIN_STANCE_UI_DELAY_MS,

    () => setDelayReady(true),

  );



  const stanceControlsEnabled = engaged && delayReady;



  return (

    <View

      style={[stanceStyles.stanceRow, !stanceControlsEnabled && stanceStyles.stanceRowHidden]}

      pointerEvents={stanceControlsEnabled ? 'auto' : 'none'}

    >

      {(['AGGRESSIVE', 'DEFENSIVE', 'NEUTRAL'] as const).map((stanceId) => {

        const meta = BATTLE_STANCE_META[stanceId];

        const isActive = stanceControlsEnabled && activeStance === stanceId;

        return (

          <TouchableOpacity

            key={stanceId}

            style={[

              stanceStyles.stanceBtn,

              isActive && { borderColor: meta.color, backgroundColor: `${meta.color}22` },

            ]}

            onPress={() => setBattleStance(stanceId)}

            disabled={!stanceControlsEnabled}

            activeOpacity={stanceControlsEnabled ? 0.7 : 1}

          >

            <Text

              style={[

                stanceStyles.stanceLabel,

                isActive && { color: meta.color, fontWeight: FONTS.weight.bold },

              ]}

            >

              [{
                t(`battleStance.${stanceId}`)
              }]

            </Text>

          </TouchableOpacity>

        );

      })}

    </View>

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



const stanceStyles = StyleSheet.create({

  stanceRow: {

    flexDirection: 'row',

    justifyContent: 'space-between',

    paddingHorizontal: SPACING.md,

    columnGap: SPACING.sm,

    marginBottom: 4,

  },

  stanceRowHidden: {

    opacity: 0,

  },

  stanceBtn: {

    width: '30.5%',

    backgroundColor: COLORS.bg_panel,

    borderWidth: 1,

    borderColor: COLORS.border_dark,

    borderRadius: 6,

    paddingVertical: SPACING.md,

    alignItems: 'center',

  },

  stanceLabel: {

    fontFamily: FONTS.mono,

    fontSize: FONTS.size.xs,

    color: COLORS.ink_mid,

  },

});


