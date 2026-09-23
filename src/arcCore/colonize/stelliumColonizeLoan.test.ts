/**
 * npx tsx --test src/arcCore/colonize/stelliumColonizeLoan.test.ts
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getArcCoreVaultSeedCredits, getBlueTeamVaultSeedCredits } from '../economy/planetUpkeepPolicy';
import { useArcCoreVaultStore } from '../../store/factionVault/arcCoreVaultStore';
import { useBlueTeamSharedVaultStore } from '../../store/factionVault/blueTeamSharedVaultStore';
import type { FactionVaultState } from '../../store/factionVault/createFactionVaultStore';
import {
  bindStelliumColonizeRuntimeFiscal,
  drawStelliumColonizeLoan,
  getStelliumColonizeLoanCredits,
  repayStelliumColonizeLoanDaily,
  resetStelliumColonizeFiscalForTest,
  seedStelliumColonizeFiscalForTest,
  tryChargeStelliumColonizeSuccessBond,
} from './stelliumColonizeFiscal';
import { enqueueStelliumColonizeRecord } from './stelliumColonizeEngine';
import { createStelliumColonizePolicyForTest } from './stelliumColonizePolicy';
import { applyStelliumColonizeDailyOpex } from './stelliumColonizeFiscal';

const POLICY = createStelliumColonizePolicyForTest();
const CASH_ONLY = createStelliumColonizePolicyForTest({ loanEnabled: false });

function mutePersist(store: { setState: (p: Partial<FactionVaultState>) => void }): void {
  store.setState({ persist: async () => undefined });
}

function seedVault(
  store: {
    setState: (p: Partial<FactionVaultState>) => void;
  },
  balance: number,
): void {
  store.setState({
    hydrated: true,
    balanceCredits: balance,
    totalInflowCredits: Math.max(0, balance),
    totalOutflowCredits: 0,
    txns: [],
    persist: async () => undefined,
  });
}

function resetVaults(blue: number, central: number): void {
  seedVault(useBlueTeamSharedVaultStore, blue);
  seedVault(useArcCoreVaultStore, central);
  mutePersist(useBlueTeamSharedVaultStore);
  mutePersist(useArcCoreVaultStore);
}

test('대출 — 블루 0원이면 사령부 시도 400을 중앙 신용으로 운용', () => {
  resetStelliumColonizeFiscalForTest();
  seedStelliumColonizeFiscalForTest();
  const centralSeed = getArcCoreVaultSeedCredits();
  resetVaults(0, centralSeed);
  const fiscal = bindStelliumColonizeRuntimeFiscal(POLICY);
  assert.equal(fiscal.onBeforeHqRoll('p1', 1), true);
  assert.equal(getStelliumColonizeLoanCredits(), 400);
  assert.equal(useBlueTeamSharedVaultStore.getState().getBalance(), 0);
  assert.equal(useArcCoreVaultStore.getState().getBalance(), centralSeed);
});

test('대출 — 보증 8000도 블루 현금 없이 성공', () => {
  resetStelliumColonizeFiscalForTest();
  seedStelliumColonizeFiscalForTest();
  resetVaults(0, getArcCoreVaultSeedCredits());
  assert.equal(tryChargeStelliumColonizeSuccessBond(POLICY, 'p1'), true);
  assert.equal(getStelliumColonizeLoanCredits(), 8000);
});

test('상환 — 블루 시드 초과분만 중앙금고로 · 시드 아래는 남김', () => {
  resetStelliumColonizeFiscalForTest();
  seedStelliumColonizeFiscalForTest({ loanCredits: 8000 });
  const blueSeed = getBlueTeamVaultSeedCredits();
  const centralSeed = getArcCoreVaultSeedCredits();
  resetVaults(blueSeed + 3000, centralSeed);
  const first = repayStelliumColonizeLoanDaily('2026-09-21', POLICY);
  assert.equal(first.repaid, 3000);
  assert.equal(getStelliumColonizeLoanCredits(), 5000);
  assert.equal(useBlueTeamSharedVaultStore.getState().getBalance(), blueSeed);
  assert.equal(useArcCoreVaultStore.getState().getBalance(), centralSeed + 3000);

  const again = repayStelliumColonizeLoanDaily('2026-09-21', POLICY);
  assert.equal(again.repaid, 0);
  assert.equal(getStelliumColonizeLoanCredits(), 5000);
});

test('상환 — 같은 날 두 번째 패스는 0 · 다음날 잔여 상환', () => {
  resetStelliumColonizeFiscalForTest();
  seedStelliumColonizeFiscalForTest({ loanCredits: 2000, lastRepayDayKey: '2026-09-21' });
  const blueSeed = getBlueTeamVaultSeedCredits();
  const centralSeed = getArcCoreVaultSeedCredits();
  resetVaults(blueSeed + 5000, centralSeed);
  assert.equal(repayStelliumColonizeLoanDaily('2026-09-21', POLICY).repaid, 0);
  const next = repayStelliumColonizeLoanDaily('2026-09-22', POLICY);
  assert.equal(next.repaid, 2000);
  assert.equal(getStelliumColonizeLoanCredits(), 0);
  assert.equal(useBlueTeamSharedVaultStore.getState().getBalance(), blueSeed + 3000);
});

test('대출 꺼짐 — 블루 0원이면 사령부 롤 보류', () => {
  resetStelliumColonizeFiscalForTest();
  seedStelliumColonizeFiscalForTest();
  resetVaults(0, getArcCoreVaultSeedCredits());
  const fiscal = bindStelliumColonizeRuntimeFiscal(CASH_ONLY);
  assert.equal(fiscal.onBeforeHqRoll('p1', 1), false);
  assert.equal(getStelliumColonizeLoanCredits(), 0);
});

test('운용비 — 활성 척 대출로 200 청구', () => {
  resetStelliumColonizeFiscalForTest();
  seedStelliumColonizeFiscalForTest();
  resetVaults(0, getArcCoreVaultSeedCredits());
  const records = applyStelliumColonizeDailyOpex(
    {
      p1: {
        planetId: 'p1',
        systemId: 's1',
        factionId: 'stellium',
        phase: 'outpost',
        hopDistance: 1,
        travelDays: 1,
        attempt: 0,
        departedDayKey: '2026-09-20',
        dueDayKey: '2026-09-21',
        outpostDueAtMs: 1,
        lastOpexDayKey: null,
      },
    },
    '2026-09-21',
    POLICY,
  );
  assert.equal(records.p1?.lastOpexDayKey, '2026-09-21');
  assert.equal(getStelliumColonizeLoanCredits(), 200);
});

test('5분 접근 — 대출과 무관하게 방위위성+슬롯만', () => {
  resetStelliumColonizeFiscalForTest();
  const fiscal = bindStelliumColonizeRuntimeFiscal(POLICY);
  const out = enqueueStelliumColonizeRecord({
    records: {},
    planetId: 'p1',
    systemId: 's1',
    hopDistance: 1,
    todayKey: '2026-09-21',
    policy: POLICY,
    nowMs: 1_000,
    travelDays: 1,
    fleetReadyAtMs: [0, 0, 0],
    operationalCap: 3,
    defenseSatLevel: 1,
    fiscal,
  });
  assert.equal(out.records.p1?.phase, 'in_flight');
  assert.equal(out.records.p1?.outpostDueAtMs, 1_000 + 300_000);
  assert.equal(getStelliumColonizeLoanCredits(), 0);
});

test('인출 — 중앙 시드 초과분은 실제 인출', () => {
  resetStelliumColonizeFiscalForTest();
  seedStelliumColonizeFiscalForTest();
  const centralSeed = getArcCoreVaultSeedCredits();
  resetVaults(0, centralSeed + 1500);
  assert.equal(drawStelliumColonizeLoan(POLICY, 1000, { kind: 'colonize_hq_attempt' }), true);
  assert.equal(getStelliumColonizeLoanCredits(), 1000);
  assert.equal(useArcCoreVaultStore.getState().getBalance(), centralSeed + 500);
  assert.equal(useBlueTeamSharedVaultStore.getState().getBalance(), 1000);
});
