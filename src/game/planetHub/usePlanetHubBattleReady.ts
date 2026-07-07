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
  /** blink 누적 경과(ms) — tick 타이머에 얹어써서 setInterval 1개로 통합 */
  const blinkAccumMsRef = useRef(0);

  useEffect(() => {
    if (!enemyFleetEntered) {
      setBattleReadyMsLeft(0);
      prevEnemyFleetEnteredRef.current = false;
      return;
    }
    if (!prevEnemyFleetEnteredRef.current) {
      setBattleReadyMsLeft(battleReadyDurationMs);
      setBattleReadyBlinkOn(true);
      blinkAccumMsRef.current = 0;
    }
    prevEnemyFleetEnteredRef.current = true;
  }, [enemyFleetEntered, battleReadyDurationMs]);

  const intervalActive =
    battleReadyMsLeft > 0 && isPlanetRouteFocused && appStateActive;

  /**
   * tick(100ms)·blink(180ms) — 활성조건이 동일해 setInterval 1개(100ms)로 합치고,
   * blink는 누적 경과시간으로 자체 주기(180ms)를 유지한다(JS 타이머 등록 수 절반으로 축소).
   */
  usePlanetHubInterval(
    'planet_hub_battle_ready_tick',
    planetId ?? null,
    intervalActive,
    PLANET_MAIN_BATTLE_READY_TICK_MS,
    () => {
      setBattleReadyMsLeft((prev) => Math.max(0, prev - PLANET_MAIN_BATTLE_READY_TICK_MS));
      blinkAccumMsRef.current += PLANET_MAIN_BATTLE_READY_TICK_MS;
      if (blinkAccumMsRef.current >= PLANET_MAIN_BATTLE_READY_BLINK_MS) {
        blinkAccumMsRef.current -= PLANET_MAIN_BATTLE_READY_BLINK_MS;
        setBattleReadyBlinkOn((v) => !v);
      }
    },
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
