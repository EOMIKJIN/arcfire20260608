// 일일배치·금고 스냅 — 운영 보고용
const path = require('path');
const Module = require('module');
global.__DEV__ = false;
const ROOT = path.resolve(__dirname, '..', '..');
const mock = path.join(__dirname, '_mock-async-storage.cjs');
const stub = path.join(__dirname, '_mock-firebase-stub.cjs');
const rn = path.join(__dirname, '_mock-react-native.cjs');
const REDIRECTS = {
  '@react-native-async-storage/async-storage': mock,
  'react-native': rn,
};
const orig = Module._resolveFilename;
Module._resolveFilename = function (req, ...rest) {
  if (REDIRECTS[req]) return REDIRECTS[req];
  if (
    req.startsWith('@react-native-firebase/') ||
    req.startsWith('expo') ||
    req.includes('/firebase/') ||
    req.startsWith('@shopify/') ||
    req === 'arcfire-native-memory'
  ) {
    return stub;
  }
  return orig.call(this, req, ...rest);
};
for (const ext of ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.json5']) {
  require.extensions[ext] = (m) => {
    m.exports = { uri: 'x' };
  };
}

(async () => {
  const {
    hydrateArcCoreDailyOpsState,
    getArcCoreDailyOpsLastBatchCompletedDayKey,
    getArcCoreDailyOpsLastBatchDayKey,
    getArcCoreDailyOpsLastBatchAtMs,
  } = require(path.join(ROOT, 'src/arcCore/schedule/arcCoreDailyOpsState.ts'));
  const { shouldRunArcCoreDailyBatch, resolveArcCoreDailyOpsPolicy } = require(path.join(
    ROOT,
    'src/arcCore/schedule/arcCoreDailyOpsPolicy.ts',
  ));
  await hydrateArcCoreDailyOpsState();
  const now = Date.now();
  const policy = resolveArcCoreDailyOpsPolicy();
  const completed = getArcCoreDailyOpsLastBatchCompletedDayKey();
  const started = getArcCoreDailyOpsLastBatchDayKey();
  const at = getArcCoreDailyOpsLastBatchAtMs();
  const wouldRun = shouldRunArcCoreDailyBatch(now, {
    lastBatchCompletedDayKey: completed,
    signupAtMs: null,
  });

  const { useArcCoreVaultStore } = require(path.join(ROOT, 'src/store/factionVault/arcCoreVaultStore.ts'));
  const { useBlueTeamSharedVaultStore } = require(path.join(
    ROOT,
    'src/store/factionVault/blueTeamSharedVaultStore.ts',
  ));
  const { useNeutralNationVaultStore } = require(path.join(
    ROOT,
    'src/store/factionVault/neutralNationVaultStore.ts',
  ));
  const { useArcCoreTransportFleetBankStore } = require(path.join(
    ROOT,
    'src/store/factionVault/arcCoreTransportFleetBankStore.ts',
  ));
  const { usePlayerIndependentNationVaultStore } = require(path.join(
    ROOT,
    'src/store/factionVault/playerIndependentNationVaultStore.ts',
  ));
  await Promise.all([
    useArcCoreVaultStore.getState().hydrate(),
    useBlueTeamSharedVaultStore.getState().hydrate(),
    useNeutralNationVaultStore.getState().hydrate(),
    useArcCoreTransportFleetBankStore.getState().hydrate(),
    usePlayerIndependentNationVaultStore.getState().hydrate(),
  ]);

  const out = {
    probedAtIso: new Date(now).toISOString(),
    policyBatchMinute: policy.batchMinuteOfDay,
    timeZone: policy.timeZone,
    lastBatchDayKey: started,
    lastBatchCompletedDayKey: completed,
    lastBatchAtMs: at,
    lastBatchAtIso: at != null ? new Date(at).toISOString() : null,
    shouldRunNow: wouldRun,
    vaults: {
      arc_red: useArcCoreVaultStore.getState().getBalance(),
      blue: useBlueTeamSharedVaultStore.getState().getBalance(),
      neutral: useNeutralNationVaultStore.getState().getBalance(),
      transport: useArcCoreTransportFleetBankStore.getState().getBalance(),
      independent: usePlayerIndependentNationVaultStore.getState().getBalance(),
    },
    codePresent: {
      resetWorldEconomy: true,
      vault5axis: true,
    },
  };
  console.log(JSON.stringify(out, null, 2));
})().catch((e) => {
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
