/**
 * 헤드리스 convoy·ledger 시뮬 — tsconfig.headless.json 경로 치환(RN·AsyncStorage stub)
 */
import { createRequire } from 'node:module';

const headlessRequire = createRequire(import.meta.url);
for (const ext of ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.ttf', '.otf']) {
  (headlessRequire.extensions as NodeJS.Dict<(m: NodeModule, filename: string) => void>)[ext] = (
    m: NodeModule,
  ) => {
    m.exports = 0;
  };
}

process.env.ARCFIRE_HEADLESS_ECONOMY_AUDIT = '1';

async function main(): Promise<void> {
  const { runArcCoreConvoyDailySettlementPass } = await import(
    '../../src/arcCore/economy/runArcCoreConvoyDailySettlementPass'
  );
  const { listAllTradeRoutePlanetIds } = await import('../../src/arcCore/economy/tradeRouteRegistry');
  const { useArcCoreTransportFleetBankStore } = await import(
    '../../src/store/factionVault/arcCoreTransportFleetBankStore'
  );
  const { useArcCoreVaultStore } = await import('../../src/store/factionVault/arcCoreVaultStore');
  const { useBlueTeamSharedVaultStore } = await import(
    '../../src/store/factionVault/blueTeamSharedVaultStore'
  );
  const { usePlanetTradeFeeLedgerStore } = await import('../../src/store/planetTradeFeeLedgerStore');
  const { rebuildAllPlanetTradeMarkets } = await import('../../src/world/planetTradeMarketStore');

  await useArcCoreTransportFleetBankStore.getState().hydrate();
  await useArcCoreVaultStore.getState().hydrate();
  await useBlueTeamSharedVaultStore.getState().hydrate();
  await usePlanetTradeFeeLedgerStore.getState().hydrate();

  const { seedSynthConvoyAuditFixtures } = await import(
    '../../src/arcCore/economy/synthFrontierConvoyTradeBridge'
  );
  const synthFixtureCount = seedSynthConvoyAuditFixtures(['synth_002_p', 'synth_003_p']);

  rebuildAllPlanetTradeMarkets(listAllTradeRoutePlanetIds(), true);

  const arcBefore = useArcCoreVaultStore.getState().getBalance();
  const blueBefore = useBlueTeamSharedVaultStore.getState().getBalance();
  const convoyDaily = await runArcCoreConvoyDailySettlementPass();
  const arcAfter = useArcCoreVaultStore.getState().getBalance();
  const blueAfter = useBlueTeamSharedVaultStore.getState().getBalance();

  const ledger = usePlanetTradeFeeLedgerStore.getState();
  const planets = listAllTradeRoutePlanetIds().map((planetId) => {
    const b = ledger.getBucket(planetId);
    return {
      planetId,
      arcFeeCredits: b.arcFeeCredits,
      convoyGrossCredits: b.convoyGrossCredits,
      convoyFeeCredits: b.convoyFeeCredits,
      playerTradeGrossCredits: b.playerTradeGrossCredits,
      playerTradeFeeCredits: b.playerTradeFeeCredits,
      playerWalletPending: b.playerWalletPending,
      grossCredits: b.grossCredits,
    };
  });

  console.log(
    JSON.stringify({
      synthFixtureCount,
      convoyDaily,
      fleetBankBalance: useArcCoreTransportFleetBankStore.getState().getBalance(),
      arcVaultDelta: arcAfter - arcBefore,
      blueVaultDelta: blueAfter - blueBefore,
      arcVaultBalance: arcAfter,
      blueVaultBalance: blueAfter,
      kstDayKey: ledger.kstDayKey,
      planets,
    }),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
