/**
 * 헤드리스 convoy·ledger 시뮬 — dynamic import after AsyncStorage patch
 */
import { createRequire } from 'node:module';

const nodeRequire = createRequire(import.meta.url);

function createMemoryAsyncStorage() {
  const map = new Map<string, string>();
  return {
    getItem: async (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: async (key: string, value: string) => {
      map.set(key, value);
    },
    removeItem: async (key: string) => {
      map.delete(key);
    },
    multiGet: async (keys: string[]) => keys.map((k) => [k, map.get(k) ?? null] as [string, string | null]),
    multiSet: async (pairs: [string, string][]) => {
      for (const [k, v] of pairs) map.set(k, v);
    },
    multiRemove: async (keys: string[]) => {
      for (const k of keys) map.delete(k);
    },
    getAllKeys: async () => [...map.keys()],
    clear: async () => map.clear(),
  };
}

function patchAsyncStorageModule(): void {
  const mock = createMemoryAsyncStorage();
  const exportBag = { default: mock, ...mock };
  for (const id of [
    '@react-native-async-storage/async-storage',
    '@react-native-async-storage/async-storage/lib/commonjs/AsyncStorage.js',
  ]) {
    try {
      const storagePath = nodeRequire.resolve(id);
      nodeRequire.cache[storagePath] = {
        id: storagePath,
        filename: storagePath,
        loaded: true,
        exports: exportBag,
        children: [],
        paths: [],
        parent: null,
        path: storagePath,
        isPreloading: false,
        require: nodeRequire,
      } as NodeModule;
    } catch {
      /* optional path */
    }
  }
}

patchAsyncStorageModule();
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
