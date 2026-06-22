import { useArcCoreTransportFleetBankStore } from '../../store/factionVault/arcCoreTransportFleetBankStore';
import { useArcCoreVaultStore } from '../../store/factionVault/arcCoreVaultStore';
import { useBlueTeamSharedVaultStore } from '../../store/factionVault/blueTeamSharedVaultStore';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import { usePlanetCoreRuntimeStore } from '../../store/planetCoreRuntimeStore';
import { usePlanetTradeFeeLedgerStore } from '../../store/planetTradeFeeLedgerStore';
import type { HeavyUiHydrateStep } from './types';

export function createPlanetCoreBootstrapStep(): HeavyUiHydrateStep {
  return {
    id: 'planet_core_runtime',
    isReady: () => usePlanetCoreRuntimeStore.getState().hydrated,
    run: () => usePlanetCoreRuntimeStore.getState().bootstrapFromWorldAsync(),
  };
}

export function createClanWarFoundationStep(): HeavyUiHydrateStep {
  return {
    id: 'clan_war_foundation',
    isReady: () => useClanWarFoundationStore.getState().hydrated,
    run: () => useClanWarFoundationStore.getState().loadLocalClanWarFoundation(),
  };
}

export function createPlanetTradeFeeLedgerStep(): HeavyUiHydrateStep {
  return {
    id: 'planet_trade_fee_ledger',
    isReady: () => usePlanetTradeFeeLedgerStore.getState().hydrated,
    run: () => usePlanetTradeFeeLedgerStore.getState().hydrate(),
  };
}

export function createFactionVaultHydrateSteps(): HeavyUiHydrateStep[] {
  return [
    {
      id: 'arc_core_transport_fleet_bank',
      isReady: () => useArcCoreTransportFleetBankStore.getState().hydrated,
      run: () => useArcCoreTransportFleetBankStore.getState().hydrate(),
    },
    {
      id: 'arc_core_vault',
      isReady: () => useArcCoreVaultStore.getState().hydrated,
      run: () => useArcCoreVaultStore.getState().hydrate(),
    },
    {
      id: 'blue_team_shared_vault',
      isReady: () => useBlueTeamSharedVaultStore.getState().hydrated,
      run: () => useBlueTeamSharedVaultStore.getState().hydrate(),
    },
  ];
}

/** 행성 경제 정보 오버레이 — 필요 스토어 일괄 hydrate */
export function createPlanetEconomyInfoHydrateSteps(): HeavyUiHydrateStep[] {
  return [
    createPlanetCoreBootstrapStep(),
    createClanWarFoundationStep(),
    createPlanetTradeFeeLedgerStep(),
    ...createFactionVaultHydrateSteps(),
  ];
}

/** 행성 개발 목록 — 코어 런타임 bootstrap */
export function createPlanetDevelopmentHydrateSteps(): HeavyUiHydrateStep[] {
  return [createPlanetCoreBootstrapStep()];
}
