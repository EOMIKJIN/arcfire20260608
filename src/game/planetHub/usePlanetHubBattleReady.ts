import { useEffect, useRef, useState } from 'react';
import {
  PLANET_MAIN_BATTLE_READY_BLINK_MS,
  PLANET_MAIN_BATTLE_READY_TICK_MS,
} from './planetHubConstants';
import { usePlanetHubInterval } from './usePlanetHubInterval';

export type PlanetHubBattleReadyState = {
  battleReadyMsLeft: number;
  battleReadyBlinkOn: boolean;
  battleReadyVisible: boolean;
  battleReadyCounterSec: number;
  capitalCombatOrbitActive: boolean;
};

export function usePlanetHubBattleReady(input: {
  planetId: string | null | undefined;
  enemyFleetEntered: boolean;
  battleReadyDurationMs: number;
  isPlanetRouteFocused: boolean;
  appStateActive: boolean;
  stageSessionActive: boolean;
}): PlanetHubBattleReadyState {
  const {
    enemyFleetEntered,
    battleReadyDurationMs,
    isPlanetRouteFocused,
    appStateActive,
    stageSessionActive,
    planetId,
  } = input;

  const [battleReadyMsLeft, setBattleReadyMsLeft] = useState(0);
  const [battleReadyBlinkOn, setBattleReadyBlinkOn] = useState(true);
  const prevEnemyFleetEnteredRef = useRef(false);

  useEffect(() => {
    if (!enemyFleetEntered) {
      setBattleReadyMsLeft(0);
      prevEnemyFleetEnteredRef.current = false;
      return;
    }
    if (!prevEnemyFleetEnteredRef.current) {
      setBattleReadyMsLeft(battleReadyDurationMs);
      setBattleReadyBlinkOn(true);
    }
    prevEnemyFleetEnteredRef.current = true;
  }, [enemyFleetEntered, battleReadyDurationMs]);

  const intervalActive =
    battleReadyMsLeft > 0 && isPlanetRouteFocused && appStateActive;

  usePlanetHubInterval(
    'planet_hub_battle_ready_tick',
    planetId ?? null,
    intervalActive,
    PLANET_MAIN_BATTLE_READY_TICK_MS,
    () => setBattleReadyMsLeft((prev) => Math.max(0, prev - PLANET_MAIN_BATTLE_READY_TICK_MS)),
  );

  usePlanetHubInterval(
    'planet_hub_battle_ready_blink',
    planetId ?? null,
    intervalActive,
    PLANET_MAIN_BATTLE_READY_BLINK_MS,
    () => setBattleReadyBlinkOn((v) => !v),
  );

  const battleReadyVisible = enemyFleetEntered && battleReadyMsLeft > 0;
  const battleReadyCounterSec = Math.max(1, Math.ceil(battleReadyMsLeft / 1000));
  const capitalCombatOrbitActive =
    enemyFleetEntered && !battleReadyVisible && stageSessionActive;

  return {
    battleReadyMsLeft,
    battleReadyBlinkOn,
    battleReadyVisible,
    battleReadyCounterSec,
    capitalCombatOrbitActive,
  };
}
