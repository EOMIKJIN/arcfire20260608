import {
  buildPlanetEconomyInfoSnapshot,
  type PlanetEconomyInfoSnapshot,
} from '../../../game/planetHub/planetEconomyInfoSnapshot';
import { useArcCoreTransportFleetBankStore } from '../../../store/factionVault/arcCoreTransportFleetBankStore';
import { useArcCoreVaultStore } from '../../../store/factionVault/arcCoreVaultStore';
import { useBlueTeamSharedVaultStore } from '../../../store/factionVault/blueTeamSharedVaultStore';
import { useClanWarFoundationStore } from '../../../store/clanWarFoundationStore';
import { usePlanetCoreRuntimeStore } from '../../../store/planetCoreRuntimeStore';
import { usePlanetTradeFeeLedgerStore } from '../../../store/planetTradeFeeLedgerStore';
import { createPlanetEconomyInfoHydrateSteps } from '../hydrateRecipes';
import { preflightPlanetHubSession } from '../preflightPlanetHub';
import type { HeavyUiSessionConfig } from '../types';

export function createPlanetEconomyInfoSession(
  planetId: string,
  planetName: string,
): HeavyUiSessionConfig<PlanetEconomyInfoSnapshot> {
  return {
    sessionKey: `planet-economy-info:${planetId}`,
    preflight: () => preflightPlanetHubSession(planetId),
    hydrateSteps: createPlanetEconomyInfoHydrateSteps(),
    build: () => buildPlanetEconomyInfoSnapshot(planetId, planetName),
  };
}

/** ready 이후 스토어 revision — build-only 재실행용 */
export function readPlanetEconomyInfoRevision(planetId: string): string {
  const core = usePlanetCoreRuntimeStore.getState().byPlanetId[planetId];
  const bucket = usePlanetTradeFeeLedgerStore.getState().getBucket(planetId);
  const hold = useClanWarFoundationStore.getState().planetHolds[planetId];
  const fleet = useArcCoreTransportFleetBankStore.getState().balanceCredits;
  const arcVault = useArcCoreVaultStore.getState().balanceCredits;
  const blueVault = useBlueTeamSharedVaultStore.getState().balanceCredits;
  return [
    core?.population ?? '',
    core?.resource ?? '',
    core?.pgp ?? '',
    bucket.arcFeeCredits,
    bucket.playerWalletPending,
    hold?.occupierClanId ?? '',
    fleet,
    arcVault,
    blueVault,
  ].join('|');
}
