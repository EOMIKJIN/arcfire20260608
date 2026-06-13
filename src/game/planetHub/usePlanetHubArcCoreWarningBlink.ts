import { useEffect, useState } from 'react';
import { PLANET_MAIN_BATTLE_READY_BLINK_MS } from './planetHubConstants';
import { usePlanetHubInterval } from './usePlanetHubInterval';

export function usePlanetHubArcCoreWarningBlink(
  planetId: string | null,
  warningVisible: boolean,
): boolean {
  const [blinkOn, setBlinkOn] = useState(true);

  useEffect(() => {
    if (!warningVisible) setBlinkOn(true);
  }, [warningVisible]);

  usePlanetHubInterval(
    'planet_hub_arc_core_warning_blink',
    planetId,
    warningVisible,
    PLANET_MAIN_BATTLE_READY_BLINK_MS,
    () => setBlinkOn((v) => !v),
  );

  return blinkOn;
}
