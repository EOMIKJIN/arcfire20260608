// ============================================================
// 일 1회 — 팩션 금고 유지비 · 플레이어 소유 행성 · 수수료 지갑 지급
// ============================================================

import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import {
  usePlanetCoreRuntimeStore,
} from '../../store/planetCoreRuntimeStore';
import { usePlanetTradeFeeLedgerStore } from '../../store/planetTradeFeeLedgerStore';
import { usePlayerStore } from '../../store/playerStore';
import type { PlanetClanHold } from '../../types';
import {
  computePlanetDailyUpkeepCredits,
  resolvePlanetUpkeepPolicy,
} from './planetUpkeepPolicy';
import { computePlanetDevelopmentDailyUpkeepCredits } from './planetDevelopmentUpkeep';
import {
  getVaultKeyByFaction,
  resolveOccupierFactionKindForHold,
  VAULT_KEY_ARCCORE,
  VAULT_KEY_BLUE,
} from './resolveFactionVault';
import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import { useArcCoreVaultStore } from '../../store/factionVault/arcCoreVaultStore';
import { useBlueTeamSharedVaultStore } from '../../store/factionVault/blueTeamSharedVaultStore';

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

  const arcVault = useArcCoreVaultStore.getState();
  const blueVault = useBlueTeamSharedVaultStore.getState();

  for (const [planetId, hold] of Object.entries(holds)) {
    const devUpkeep = computePlanetDevelopmentDailyUpkeepCredits(planetId);
    const upkeep = computePlanetDailyUpkeepCredits(devUpkeep, policy);
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
    if (faction === 'player_clan') continue;

    // [보완 #2][#3] BLUE→blue_vault, RED·중립→arccore_vault
    const vaultKey = getVaultKeyByFaction(faction === 'blue' ? 'blue' : 'red');
    const vault = vaultKey === VAULT_KEY_BLUE ? blueVault : arcVault;

    const { spent, shortfall } = vault.spendUpToBalance(upkeep, {
      kind: 'upkeep_spend',
      planetId,
      note: `${faction}_planet_upkeep`,
    });

    if (spent > 0) {
      if (vaultKey === VAULT_KEY_ARCCORE) redUpkeepChargedCredits += spent;
      else blueUpkeepChargedCredits += spent;
    }

  // [보완 #2] 부족분 — 0까지만 차감, 로그만(행성 패널티 추후)
    if (shortfall > 0) {
      vault.recordAudit('upkeep_shortfall', {
        planetId,
        note: `upkeep_shortfall_${shortfall}`,
      });
      if (vaultKey === VAULT_KEY_ARCCORE) redUpkeepFailedCredits += shortfall;
      else blueUpkeepFailedCredits += shortfall;
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
