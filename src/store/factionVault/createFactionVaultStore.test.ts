/**
 * 팩션 금고 hydrate 레이스 — unit tests
 * (task_id=faction-vault-fee-hydrate-race-20260803)
 *
 * createFactionVaultStore의 실제 hydrate()/persist()는 AsyncStorage를 직접 호출하는데,
 * `@react-native-async-storage/async-storage`는 tsx(node ESM) 하에서 default export가
 * 이중 래핑돼(esModuleInterop 미적용) getItem/setItem이 undefined로 잡힌다(Metro/Babel
 * 번들 환경에서만 정상 동작 — 이 저장소의 다른 AsyncStorage 기반 store들도 전부 테스트
 * 파일이 없는 이유와 동일). 그래서 이 테스트는 zustand의 표준 setState로 hydrate/persist를
 * "가짜(디스크 I/O 없는 지연 함수)"로 교체해 실제 ensureHydrated/appendInflow 로직만 검증한다.
 * npx tsx --test src/store/factionVault/createFactionVaultStore.test.ts
 */
import assert from 'node:assert/strict';
import { createFactionVaultStore } from './createFactionVaultStore';

async function test(name: string, fn: () => Promise<void> | void): Promise<void> {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}`);
    throw err;
  }
}

function makeStore(diskBalance: number) {
  const store = createFactionVaultStore({
    storageKey: 'test_vault_key',
    seedCredits: () => 0,
    seedNote: 'test_seed',
    txnHistoryLimit: () => 50,
    allowNegativeBalance: () => false,
  });
  let hydrateCallCount = 0;
  // 실제 hydrate()를 "50ms 후 디스크값 통째 교체"로 흉내(AsyncStorage 없이) — 원본 버그의
  // 핵심 메커니즘(hydrate 완료 시 set({ balanceCredits: ... })으로 전량 교체)은 그대로 재현.
  store.setState({
    hydrate: async () => {
      hydrateCallCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 50));
      store.setState({
        hydrated: true,
        balanceCredits: diskBalance,
        totalInflowCredits: diskBalance,
      });
    },
    persist: async () => {
      /* AsyncStorage 실사용 회피 — 잔액 검증에 불필요 */
    },
  });
  return { store, getHydrateCallCount: () => hydrateCallCount };
}

void (async () => {

await test('1) 원본 버그 재현 — fire-and-forget hydrate 도중 appendInflow → hydrate 완료 시 디스크값이 덮어써 유실', async () => {
  const { store } = makeStore(1000);
  // 수정 전 코드와 동일한 패턴: await 없이 hydrate 호출 직후 바로 appendInflow.
  void store.getState().hydrate();
  store.getState().appendInflow(500, { kind: 'trade_fee', note: 'race' });
  assert.equal(store.getState().balanceCredits, 500, 'hydrate 완료 전 시점엔 500만 반영');

  await new Promise((resolve) => setTimeout(resolve, 80)); // hydrate(50ms)가 끝날 때까지 대기
  assert.equal(
    store.getState().balanceCredits,
    1000,
    '버그 재현: hydrate가 나중에 끝나며 balanceCredits를 디스크값(1000)으로 통째 덮어써 500 유실',
  );
});

await test('2) 수정 확인 — ensureHydrated를 먼저 await하면 appendInflow가 유실 없이 반영됨', async () => {
  const { store } = makeStore(1000);
  await store.getState().ensureHydrated();
  store.getState().appendInflow(500, { kind: 'trade_fee', note: 'fixed' });
  assert.equal(
    store.getState().balanceCredits,
    1500,
    'ensureHydrated 완료 후 적립이라 디스크값(1000)+500=1500, 유실 없음',
  );
  assert.equal(store.getState().totalInflowCredits, 1500);
});

await test('3) 이미 hydrated면 ensureHydrated가 hydrate()를 다시 부르지 않음(즉시 resolve)', async () => {
  const { store, getHydrateCallCount } = makeStore(200);
  await store.getState().ensureHydrated();
  assert.equal(getHydrateCallCount(), 1);
  await store.getState().ensureHydrated();
  assert.equal(getHydrateCallCount(), 1, '두 번째 호출은 이미 hydrated=true라 hydrate() 재호출 없이 즉시 resolve');
});

await test('4) 동시 호출 dedup — 진행 중인 hydrate()가 있으면 새 ensureHydrated가 같은 Promise를 공유(중복 hydrate 없음)', async () => {
  const { store, getHydrateCallCount } = makeStore(300);
  const p1 = store.getState().ensureHydrated();
  const p2 = store.getState().ensureHydrated();
  await Promise.all([p1, p2]);
  assert.equal(getHydrateCallCount(), 1, '동시에 2번 호출해도 내부 hydrate()는 1번만 실행');
  assert.equal(store.getState().balanceCredits, 300);
});

console.log('[createFactionVaultStore] all tests passed');

})();
