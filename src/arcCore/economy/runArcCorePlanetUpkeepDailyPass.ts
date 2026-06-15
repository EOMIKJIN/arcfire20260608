// ============================================================
// 일 1회 — 팩션 금고 유지비 · 플레이어 소유 행성 · 수수료 지갑 지급
// ============================================================

import { findPlanetById } from '../planetEnvironment/resolvePlanetAsteroidVisualPolicy';
import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import { useArcCoreVaultStore } from '../../store/factionVault/arcCoreVaultStore';
import { useBlueTeamSharedVaultStore } from '../../store/factionVault/blueTeamSharedVaultStore';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import {
  planetCsvBaselineToRuntime,
  usePlanetCoreRuntimeStore,
} from '../../store/planetCoreRuntimeStore';
import { usePlanetTradeFeeLedgerStore } from '../../store/planetTradeFeeLedgerStore';
import { usePlayerStore } from '../../store/playerStore';
import type { PlanetClanHold } from '../../types';
import {
  computePlanetDailyUpkeepCredits,
  resolvePlanetUpkeepPolicy,
} from './planetUpkeepPolicy';
import {
  resolveOccupierFactionKindForHold,
  resolveFactionVaultForOccupierClanId,
} from './resolveFactionVault';

export type ArcCorePlanetUpkeepDailyPassResult = {
  ran: boolean;
  kstDayKey: string;
  redUpkeepChargedCredits: number;
  redUpkeepFailedCredits: number;
  blueUpkeepChargedCredits: number;
  blueUpkeepFailedCredits: number;
  playerUpkeepChargedCredits: number;
  playerUpkeepFailedCredits: number;
  playerWalletPayoutCredits: number;
  planetsProcessed: number;
};

function isPlayerOwnedHold(hold: PlanetClanHold, playerUid: string | null | undefined): boolean {
  if (!playerUid) return false;
  if (hold.homePlayerUid === playerUid) return true;
  if (hold.kind === 'player_home' && hold.homePlayerUid === playerUid) return true;
  return false;
}

function resolvePlanetPopulation(planetId: string): number {
  const runtime = usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId);
  if (runtime) return runtime.population;
  const planet = findPlanetById(planetId);
  if (!planet) return 50;
  return planetCsvBaselineToRuntime(planet).population;
}

function listPlayerOwnedPlanetIds(playerUid: string): string[] {
  const holds = useClanWarFoundationStore.getState().planetHolds;
  return Object.entries(holds)
    .filter(([, hold]) => isPlayerOwnedHold(hold, playerUid))
    .map(([planetId]) => planetId);
}

export async function runArcCorePlanetUpkeepDailyPass(): Promise<ArcCorePlanetUpkeepDailyPassResult> {
  const policy = resolvePlanetUpkeepPolicy();
  const kstDayKey = planetAttackKstDayKey();
  const empty: ArcCorePlanetUpkeepDailyPassResult = {
    ran: false,
    kstDayKey,
    redUpkeepChargedCredits: 0,
    redUpkeepFailedCredits: 0,
    blueUpkeepChargedCredits: 0,
    blueUpkeepFailedCredits: 0,
    playerUpkeepChargedCredits: 0,
    playerUpkeepFailedCredits: 0,
    playerWalletPayoutCredits: 0,
    planetsProcessed: 0,
  };
  if (!policy.enabled) return empty;

  if (!usePlanetCoreRuntimeStore.getState().hydrated) {
    await usePlanetCoreRuntimeStore.getState().bootstrapFromWorldAsync();
  }
  if (!useClanWarFoundationStore.getState().hydrated) {
    await useClanWarFoundationStore.getState().loadLocalClanWarFoundation();
  }
  if (!useArcCoreVaultStore.getState().hydrated) {
    await useArcCoreVaultStore.getState().hydrate();
  }
  if (!useBlueTeamSharedVaultStore.getState().hydrated) {
    await useBlueTeamSharedVaultStore.getState().hydrate();
  }
  if (!usePlanetTradeFeeLedgerStore.getState().hydrated) {
    await usePlanetTradeFeeLedgerStore.getState().hydrate();
  }

  const player = usePlayerStore.getState().player;
  const playerUid = player?.uid ?? null;

  let playerWalletPayoutCredits = 0;
  if (playerUid) {
    const ownedPlanetIds = listPlayerOwnedPlanetIds(playerUid);
    playerWalletPayoutCredits = usePlanetTradeFeeLedgerStore
      .getState()
      .takePlayerWalletPendingForPlanets(ownedPlanetIds);
    if (playerWalletPayoutCredits > 0) {
      usePlayerStore.getState().addCredits(playerWalletPayoutCredits);
      void usePlayerStore.getState().persist();
    }
  }

  usePlanetTradeFeeLedgerStore.getState().ensureDay(kstDayKey);

  const holds = useClanWarFoundationStore.getState().planetHolds;
  let redUpkeepChargedCredits = 0;
  let redUpkeepFailedCredits = 0;
  let blueUpkeepChargedCredits = 0;
  let blueUpkeepFailedCredits = 0;
  let playerUpkeepChargedCredits = 0;
  let playerUpkeepFailedCredits = 0;
  let planetsProcessed = 0;

  for (const [planetId, hold] of Object.entries(holds)) {
    if (hold.kind === 'neutral' || hold.occupierClanId === 'neutral') continue;
    const population = resolvePlanetPopulation(planetId);
    const upkeep = computePlanetDailyUpkeepCredits(population, policy);
    if (upkeep <= 0) continue;
    planetsProcessed += 1;

    if (isPlayerOwnedHold(hold, playerUid)) {
      const spent = usePlayerStore.getState().spendCredits(upkeep);
      if (spent) {
        playerUpkeepChargedCredits += upkeep;
      } else {
        playerUpkeepFailedCredits += upkeep;
      }
      continue;
    }

    const faction = resolveOccupierFactionKindForHold(hold);
    if (faction !== 'red' && faction !== 'blue') continue;

    const vault = resolveFactionVaultForOccupierClanId(hold.occupierClanId);
    if (!vault) continue;

    const balanceBefore = vault.getBalance();
    const spent = vault.trySpend(upkeep, {
      kind: 'upkeep_spend',
      planetId,
      note: `${faction}_planet_upkeep`,
    });
    const charged = balanceBefore - vault.getBalance();

    if (spent && charged > 0) {
      if (faction === 'red') redUpkeepChargedCredits += charged;
      else blueUpkeepChargedCredits += charged;
    } else if (!spent) {
      if (faction === 'red') redUpkeepFailedCredits += upkeep;
      else blueUpkeepFailedCredits += upkeep;
    }
  }

  return {
    ran: true,
    kstDayKey,
    redUpkeepChargedCredits,
    redUpkeepFailedCredits,
    blueUpkeepChargedCredits,
    blueUpkeepFailedCredits,
    playerUpkeepChargedCredits,
    playerUpkeepFailedCredits,
    playerWalletPayoutCredits,
    planetsProcessed,
  };
}
