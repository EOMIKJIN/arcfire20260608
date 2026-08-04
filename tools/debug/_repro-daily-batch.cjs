// 실제 세이브 데이터로 runArcCoreDailyOpsBatch()를 재현 — 7/18 이후 매일 미완료되는
// 원인(예외 스택트레이스) 특정용. tsx runtime으로 .ts를 직접 require.
// 실행: npx tsx tools/debug/_repro-daily-batch.cjs
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

async function main() {
  const { usePlayerStore } = require(path.join(ROOT, 'src/store/playerStore.ts'));
  const { useWorldStore } = require(path.join(ROOT, 'src/store/worldStore.ts'));
  const { usePlanetCoreRuntimeStore } = require(path.join(ROOT, 'src/store/planetCoreRuntimeStore.ts'));
  const { useClanWarFoundationStore } = require(path.join(ROOT, 'src/store/clanWarFoundationStore.ts'));

  console.log('hydrating player store...');
  await usePlayerStore.getState().loadLocalPlayer?.();
  console.log('player hydrated:', !!usePlayerStore.getState().player);

  console.log('hydrating world store...');
  await useWorldStore.getState().loadLocalWorld?.();
  console.log('world loaded:', useWorldStore.getState().loaded);

  console.log('hydrating planetCoreRuntime store...');
  await usePlanetCoreRuntimeStore.getState().bootstrapFromWorldAsync?.();
  console.log('planetCore hydrated:', usePlanetCoreRuntimeStore.getState().hydrated, 'planets:', Object.keys(usePlanetCoreRuntimeStore.getState().byPlanetId).length);

  console.log('hydrating clanWarFoundation store...');
  await useClanWarFoundationStore.getState().hydrate?.();
  console.log('clanWar hydrated:', !!useClanWarFoundationStore.getState);

  const { runArcCoreDailyOpsBatch } = require(path.join(ROOT, 'src/arcCore/schedule/runArcCoreDailyOpsBatch.ts'));

  console.log('\n=== running runArcCoreDailyOpsBatch() ===\n');
  const t0 = Date.now();
  try {
    const result = await runArcCoreDailyOpsBatch();
    console.log(`BATCH COMPLETED OK in ${Date.now() - t0}ms`, result);
  } catch (err) {
    console.error(`BATCH THREW after ${Date.now() - t0}ms:`);
    console.error(err && err.stack ? err.stack : err);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('SETUP FAILED:');
  console.error(err && err.stack ? err.stack : err);
  process.exitCode = 1;
});
