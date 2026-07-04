// ============================================================
// 일 1회 — 행성 R → 매장 maxUnits 동기 · 잔량 재생
// ============================================================

import { invalidateMineralDepositProfileCache } from '../../world/mineralDepositModel';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import { usePlanetMineralLedgerStore } from '../../store/planetMineralLedgerStore';
import { forEachCoreOpenGameplayPlanet } from '../../world/coreOpenGameplayPlanets';
import { resolvePlanetMineralLedgerPolicy } from './planetMineralLedgerPolicy';

export type PlanetMineralLedgerDailyPassResult = {
  ran: boolean;
  planetsTouched: number;
};

export function runPlanetMineralLedgerDailyPass(): PlanetMineralLedgerDailyPassResult {
  const policy = resolvePlanetMineralLedgerPolicy();
  if (!policy.enabled) return { ran: false, planetsTouched: 0 };

  const core = usePlanetCoreRuntimeStore.getState();
  if (!core.hydrated) return { ran: false, planetsTouched: 0 };

  const ledger = usePlanetMineralLedgerStore.getState();
  if (!ledger.loaded) return { ran: false, planetsTouched: 0 };

  let planetsTouched = 0;
  forEachCoreOpenGameplayPlanet(({ planetId }) => {
    const runtime = core.getPlanetCoreRuntime(planetId);
    if (!runtime) return;
    ledger.applyDailyRegenForPlanet(planetId, runtime.resource);
    planetsTouched += 1;
  });

  invalidateMineralDepositProfileCache();
  void ledger.persistLocal();

  return { ran: true, planetsTouched };
}
