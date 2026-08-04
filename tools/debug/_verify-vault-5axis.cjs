// 순수 라우팅/purge 로직 검증 — economy-vault-5axis-upgrade-20260804
// 실행: npx tsx tools/debug/_verify-vault-5axis.cjs
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
  const {
    getVaultKeyByFaction,
    VAULT_KEY_ARCCORE,
    VAULT_KEY_BLUE,
    VAULT_KEY_NEUTRAL,
    isPlayerIndependentHold,
  } = require(path.join(ROOT, 'src/arcCore/economy/resolveFactionVault.ts'));
  const { releasePlayerPlanetHolds } = require(path.join(ROOT, 'src/clanWar/planetHoldReleasePolicy.ts'));

  console.log('=== getVaultKeyByFaction ===');
  check('blue', getVaultKeyByFaction('blue'), VAULT_KEY_BLUE);
  check('neutral', getVaultKeyByFaction('neutral'), VAULT_KEY_NEUTRAL);
  check('red', getVaultKeyByFaction('red'), VAULT_KEY_ARCCORE);
  check('unknown fallback', getVaultKeyByFaction('player_clan'), VAULT_KEY_ARCCORE);

  console.log('\n=== isPlayerIndependentHold ===');
  check('undefined', isPlayerIndependentHold(undefined), false);
  check(
    'kind=player_independent',
    isPlayerIndependentHold({ kind: 'player_independent', occupierClanId: 'solo_uid123' }),
    true,
  );
  check(
    'kind=neutral,occupier=neutral',
    isPlayerIndependentHold({ kind: 'neutral', occupierClanId: 'neutral' }),
    false,
  );
  check(
    'kind=clan_hold,occupier=balance_seed_faction_red',
    isPlayerIndependentHold({ kind: 'clan_hold', occupierClanId: 'balance_seed_faction_red' }),
    false,
  );

  console.log('\n=== purge_account releasePlayerPlanetHolds (독립국 hold 중립화, 기존 로직 회귀 확인) ===');
  const holds = {
    planet_x: {
      planetId: 'planet_x',
      systemId: 'sys_x',
      occupierClanId: 'solo_uid123',
      deedOwnerClanId: 'solo_uid123',
      homePlayerUid: 'uid123',
      kind: 'player_independent',
      capturedAt: 1000,
    },
  };
  const result = releasePlayerPlanetHolds({
    holds,
    removedClanIds: new Set(['solo_uid123']),
    remainingClanIds: new Set([]),
    uid: 'uid123',
    mode: 'purge_account',
  });
  const restored = result.holds.planet_x;
  check('releasedPlanetCount', result.releasedPlanetCount, 1);
  check('occupierClanId -> neutral', restored && restored.occupierClanId, 'neutral');
  check('kind -> neutral', restored && restored.kind, 'neutral');
  check('deedOwnerClanId -> null', restored && restored.deedOwnerClanId, null);
  check('homePlayerUid -> null', restored && restored.homePlayerUid, null);

  console.log('\n=== playerIndependentNationVaultStore: inflow -> purge zero ===');
  const {
    usePlayerIndependentNationVaultStore,
    resetPlayerIndependentNationVaultForAccountPurge,
  } = require(path.join(ROOT, 'src/store/factionVault/playerIndependentNationVaultStore.ts'));
  await usePlayerIndependentNationVaultStore.getState().hydrate();
  usePlayerIndependentNationVaultStore.getState().appendInflow(5000, { kind: 'trade_fee', planetId: 'planet_x' });
  check('balance after inflow', usePlayerIndependentNationVaultStore.getState().getBalance(), 5000);
  await resetPlayerIndependentNationVaultForAccountPurge();
  check('balance after purge reset', usePlayerIndependentNationVaultStore.getState().getBalance(), 0);
  check('txns cleared after purge', usePlayerIndependentNationVaultStore.getState().txns.length, 0);

  const { useArcCoreVaultStore } = require(path.join(ROOT, 'src/store/factionVault/arcCoreVaultStore.ts'));
  await useArcCoreVaultStore.getState().hydrate();
  const arcBalanceBefore = useArcCoreVaultStore.getState().getBalance();
  console.log(`(참고) arccore vault 잔액 — purge 대상 아님, 그대로 유지되어야 함: ${arcBalanceBefore}`);

  console.log(failed === 0 ? '\nALL PASS' : `\n${failed} FAILED`);
  process.exitCode = failed === 0 ? 0 : 1;
}

main().catch((err) => {
  console.error('SETUP FAILED:');
  console.error(err && err.stack ? err.stack : err);
  process.exitCode = 1;
});
