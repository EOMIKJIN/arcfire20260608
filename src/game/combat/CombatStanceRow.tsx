import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  useCapitalRealtimeCombatSimContext,
  type CapitalRealtimeCombatSim,
} from '../../combat';
import { useT } from '../../i18n';
import { BATTLE_STANCE_META, useBattleStanceStore } from '../../store/battleStanceStore';
import { COLORS, FONTS, SPACING } from '../../utils/theme';
import { registerPlanetSessionResource } from '../planetSessionRegistry';
import {
  PLANET_MAIN_STANCE_ENGAGEMENT_POLL_MS,
  PLANET_MAIN_STANCE_UI_DELAY_MS,
} from '../planetHub/planetHubConstants';

function bothSidesAlive(sim: CapitalRealtimeCombatSim): boolean {
  const agents = sim.agentsRef.current;
  let blueAlive = false;
  let foeAlive = false;
  for (let i = 0; i < agents.length; i += 1) {
    const agent = agents[i]!;
    if (!agent.alive) continue;
    if (agent.team === 'blue') blueAlive = true;
    if (agent.team === 'red' || agent.team === 'orange') foeAlive = true;
  }
  return blueAlive && foeAlive;
}

/**
 * 허브·이동중 공용 태세 버튼.
 * 아군과 적군이 둘 다 살아 있으면 1초 뒤 연다. 화면 재렌더로 그 1초를 다시 세지 않는다.
 * 허브만 행성 세션 레지스트리에 타이머를 묶어 이탈 시 정리한다.
 */
export function CombatStanceRow({
  routeFocused,
  planetId,
  bindPlanetSession = false,
}: {
  routeFocused: boolean;
  planetId: string | null;
  bindPlanetSession?: boolean;
}) {
  const sim = useCapitalRealtimeCombatSimContext();
  const t = useT();
  const activeStance = useBattleStanceStore((s) => s.activeStance);
  const setBattleStance = useBattleStanceStore((s) => s.setStance);
  const [engaged, setEngaged] = useState(false);
  const [delayReady, setDelayReady] = useState(false);
  const onReadyRef = useRef(() => setDelayReady(true));

  const pollEngagement = useCallback(() => {
    if (!sim || !routeFocused) {
      setEngaged(false);
      return;
    }
    setEngaged(bothSidesAlive(sim));
  }, [sim, routeFocused]);

  useEffect(() => {
    if (!sim || !routeFocused) {
      setEngaged(false);
      return;
    }
    pollEngagement();
  }, [sim, routeFocused, pollEngagement]);

  useEffect(() => {
    if (!sim || !routeFocused) return undefined;
    const handle = setInterval(pollEngagement, PLANET_MAIN_STANCE_ENGAGEMENT_POLL_MS);
    const release = bindPlanetSession
      ? registerPlanetSessionResource({
        ownerId: 'planet_main_stance_engagement_poll',
        planetId,
        dispose: () => clearInterval(handle),
      }).release
      : null;
    return () => {
      clearInterval(handle);
      release?.();
    };
  }, [sim, routeFocused, pollEngagement, bindPlanetSession, planetId]);

  useEffect(() => {
    if (!engaged) setDelayReady(false);
  }, [engaged]);

  useEffect(() => {
    if (!engaged) return undefined;
    const handle = setTimeout(() => onReadyRef.current(), PLANET_MAIN_STANCE_UI_DELAY_MS);
    const release = bindPlanetSession
      ? registerPlanetSessionResource({
        ownerId: 'planet_main_stance_ui_delay',
        planetId,
        dispose: () => clearTimeout(handle),
      }).release
      : null;
    return () => {
      clearTimeout(handle);
      release?.();
    };
  }, [engaged, bindPlanetSession, planetId]);

  const stanceControlsEnabled = engaged && delayReady;

  return (
    <View
      style={[styles.stanceRow, !stanceControlsEnabled && styles.stanceRowHidden]}
      pointerEvents={stanceControlsEnabled ? 'auto' : 'none'}
    >
      {(['AGGRESSIVE', 'DEFENSIVE', 'NEUTRAL'] as const).map((stanceId) => {
        const meta = BATTLE_STANCE_META[stanceId];
        const isActive = stanceControlsEnabled && activeStance === stanceId;
        return (
          <TouchableOpacity
            key={stanceId}
            style={[
              styles.stanceBtn,
              isActive && { borderColor: meta.color, backgroundColor: `${meta.color}22` },
            ]}
            onPress={() => setBattleStance(stanceId)}
            disabled={!stanceControlsEnabled}
            activeOpacity={stanceControlsEnabled ? 0.7 : 1}
          >
            <Text
              style={[
                styles.stanceLabel,
                isActive && { color: meta.color, fontWeight: FONTS.weight.bold },
              ]}
            >
              [{t(`battleStance.${stanceId}`)}]
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
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
