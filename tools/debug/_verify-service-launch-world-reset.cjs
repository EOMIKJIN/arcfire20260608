// 서비스 개시 월드 경제 리셋 검증 — economy-service-launch-world-reset-20260804
// 실행: npx tsx tools/debug/_verify-service-launch-world-reset.cjs
const path = require('path');
const Module = require('module');
global.__DEV__ = false;

const ROOT = path.resolve(__dirname, '..', '..');
const mockAsyncStoragePath = path.join(__dirname, '_mock-async-storage.cjs');
const genericStub = path.join(__dirname, '_mock-firebase-stub.cjs');

const REDIRECTS = {
  '@react-native-async-storage/async-storage': mockAsyncStoragePath,
  'react-native': path.join(__dirname, '_mock-react-native.cjs'),
  [path.join(ROOT, 'src/firebase/auth.ts')]: genericStub,
  [path.join(ROOT, 'src/firebase/rtdbRefs.ts')]: genericStub,
};

const PATTERN_REDIRECTS = [
  { test: (r) => r.startsWith('@react-native-firebase/'), to: genericStub },
  { test: (r) => r.startsWith('react-native/'), to: path.join(__dirname, '_mock-react-native.cjs') },
  { test: (r) => r.startsWith('@shopify/react-native-skia'), to: genericStub },
  { test: (r) => r === 'arcfire-native-memory', to: genericStub },
  { test: (r) => r.startsWith('react-native-reanimated'), to: genericStub },
  { test: (r) => r.startsWith('react-native-gesture-handler'), to: genericStub },
  { test: (r) => r.startsWith('react-native-svg'), to: genericStub },
  { test: (r) => r.startsWith('expo'), to: genericStub },
  { test: (r) => r.includes('/firebase/userCloudSyncSchedule') || r === './userCloudSyncSchedule', to: genericStub },
  { test: (r) => r.includes('/firebase/firestoreClientConfig'), to: genericStub },
  { test: (r) => r.includes('/firebase/userDataSync'), to: genericStub },
];

const origResolve = Module._resolveFilename;
Module._resolveFilename = function patchedResolve(request, ...rest) {
  if (REDIRECTS[request]) return REDIRECTS[request];
  for (const rule of PATTERN_REDIRECTS) {
    if (rule.test(request)) return rule.to;
  }
  return origResolve.call(this, request, ...rest);
};

const ASSET_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.ttf', '.otf', '.mp3', '.wav', '.json5'];
for (const ext of ASSET_EXTS) {
  require.extensions[ext] = function assetStub(mod) {
    mod.exports = { uri: 'stub-asset', width: 1, height: 1 };
  };
}

let failed = 0;
function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failed += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}: got=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
}

async function main() {
  const { useArcCoreVaultStore } = require(path.join(ROOT, 'src/store/factionVault/arcCoreVaultStore.ts'));
  const { useNeutralNationVaultStore } = require(path.join(
    ROOT,
    'src/store/factionVault/neutralNationVaultStore.ts',
  ));
  const {
    usePlayerIndependentNationVaultStore,
  } = require(path.join(ROOT, 'src/store/factionVault/playerIndependentNationVaultStore.ts'));
  const { usePlanetTradeFeeLedgerStore } = require(path.join(
    ROOT,
    'src/store/planetTradeFeeLedgerStore.ts',
  ));
  const { getArcCoreDailyOpsLastBatchCompletedDayKey, hydrateArcCoreDailyOpsState, markArcCoreDailyBatchCompleted } =
    require(path.join(ROOT, 'src/arcCore/schedule/arcCoreDailyOpsState.ts'));
  const { getArcCoreVaultSeedCredits } = require(path.join(
    ROOT,
    'src/arcCore/economy/planetUpkeepPolicy.ts',
  ));
  const { resetArcCoreWorldEconomyForServiceLaunch } = require(path.join(
    ROOT,
    'src/arcCore/economy/resetArcCoreWorldEconomyForServiceLaunch.ts',
  ));

  await useArcCoreVaultStore.getState().hydrate();
  await useNeutralNationVaultStore.getState().hydrate();
  await usePlayerIndependentNationVaultStore.getState().hydrate();
  await usePlanetTradeFeeLedgerStore.getState().hydrate();
  await hydrateArcCoreDailyOpsState();

  usePlayerIndependentNationVaultStore.getState().appendInflow(7777, {
    kind: 'trade_fee',
    planetId: 'probe',
  });
  const independentBefore = usePlayerIndependentNationVaultStore.getState().getBalance();
  check('independent before reset', independentBefore, 7777);

  usePlanetTradeFeeLedgerStore.getState().accumulate('probe_planet', 1000, 100, 50, 'player');
  await markArcCoreDailyBatchCompleted(Date.now());
  check('dailyOps completed set', typeof getArcCoreDailyOpsLastBatchCompletedDayKey(), 'string');

  const result = await resetArcCoreWorldEconomyForServiceLaunch('full');
  check('result.ran', result.ran, true);
  check('result.vaultsReseeded', result.vaultsReseeded, true);
  check('result.independentVaultUntouched', result.independentVaultUntouched, true);
  check(
    'independent after full',
    usePlayerIndependentNationVaultStore.getState().getBalance(),
    independentBefore,
  );
  check('fee ledger empty', Object.keys(usePlanetTradeFeeLedgerStore.getState().byPlanetId).length, 0);
  check('dailyOps completed cleared', getArcCoreDailyOpsLastBatchCompletedDayKey(), null);
  check('neutral vault zero', useNeutralNationVaultStore.getState().getBalance(), 0);

  const arcSeed = getArcCoreVaultSeedCredits();
  check('arc vault ≈ seed', useArcCoreVaultStore.getState().getBalance(), arcSeed);

  console.log(failed === 0 ? '\nALL PASS' : `\n${failed} FAILED`);
  process.exitCode = failed === 0 ? 0 : 1;
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exitCode = 1;
});
