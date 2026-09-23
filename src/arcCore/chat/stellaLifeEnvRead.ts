import { emptyStellaLifeEnv } from './stellaLifeResolve';
import type { StellaLifeEnv } from './stellaLifeTypes';
import { stellaLifeKstParts, stellaLifeWeekdayMaskKey } from './stellaLifeClock';

export function readStellaLifeEnv(nowMs: number): StellaLifeEnv {
  const env = emptyStellaLifeEnv(nowMs);
  const parts = stellaLifeKstParts(nowMs);
  env.hour = parts.hour;
  env.weekdayKey = stellaLifeWeekdayMaskKey(nowMs);
  try {
    const { readArcCoreChatFacts } =
      require('./arcCoreChatTurnFacts') as typeof import('./arcCoreChatTurnFacts');
    const facts = readArcCoreChatFacts([]);
    env.spyAlertPending = facts.spyAlertPending;
    env.hasCombatRecord = facts.hasCombatRecord;
  } catch {
    /* test */
  }
  try {
    const { usePlayerStore } =
      require('../../store/playerStore') as typeof import('../../store/playerStore');
    const planetId = usePlayerStore.getState().player?.currentPlanetId?.trim() ?? '';
    env.planetId = planetId;
    if (planetId) {
      const { usePlanetCoreRuntimeStore } =
        require('../../store/planetCoreRuntimeStore') as typeof import('../../store/planetCoreRuntimeStore');
      const core = usePlanetCoreRuntimeStore.getState().byPlanetId?.[planetId];
      if (core) {
        env.coreR = Number(core.resource ?? 50);
        env.coreP = Number(core.population ?? 50);
        env.coreD = Number(core.defense ?? 50);
        env.coreT = Number(core.technology ?? 50);
        env.coreE = Number(core.environment ?? 50);
      }
    }
  } catch {
    /* test */
  }
  return env;
}

export function readStellaLifeUid(): string {
  try {
    const { usePlayerStore } =
      require('../../store/playerStore') as typeof import('../../store/playerStore');
    return usePlayerStore.getState().player?.uid?.trim() || 'anon';
  } catch {
    return 'anon';
  }
}
