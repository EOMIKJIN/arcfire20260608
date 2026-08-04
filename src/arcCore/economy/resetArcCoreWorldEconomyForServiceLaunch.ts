// ============================================================
// 서비스 개시일 — 아크코어 전행성 경제 월드 패키지 리셋
// task_id=economy-service-launch-world-reset-20260804
// 김팀장(글록 4.5) 직접 구현 · onBoot 자동 호출 금지 · 운영/명시 API만
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useArcCoreVaultStore } from '../../store/factionVault/arcCoreVaultStore';
import { useArcCoreTransportFleetBankStore } from '../../store/factionVault/arcCoreTransportFleetBankStore';
import { useBlueTeamSharedVaultStore } from '../../store/factionVault/blueTeamSharedVaultStore';
import { useNeutralNationVaultStore } from '../../store/factionVault/neutralNationVaultStore';
import { usePlayerIndependentNationVaultStore } from '../../store/factionVault/playerIndependentNationVaultStore';
import { clearPlanetTradeFeeLedgerForServiceLaunch } from '../../store/planetTradeFeeLedgerStore';
import { listPlanetIdsWithTradePort } from '../../world/planetTradePortDb';
import { rebuildAllPlanetTradeMarkets } from '../../world/planetTradeMarketStore';
import { clearArcCoreDailyOpsStateForServiceLaunch } from '../schedule/arcCoreDailyOpsState';
import { clearArcCoreDailyOpsSummaryPendingForServiceLaunch } from '../schedule/arcCoreDailyOpsSummaryPending';
import { clearArcCoreCentralBankExpenditureLedgerForServiceLaunch } from './arcCoreCentralBankExpenditureLedger';
import { clearBalanceOverlayIngestStateForServiceLaunch } from './ingestBalanceOverlayDelta';
import { resetEconomyPriceOverlayForServiceLaunch } from './economyPriceOverlayStore';
import { getArcCoreVaultSeedCredits, getBlueTeamVaultSeedCredits } from './planetUpkeepPolicy';
import { reseedArcCoreTransportFleetBankToSeed } from './reseedArcCoreConvoyFleetBank';
import type { FactionVaultState } from '../../store/factionVault/createFactionVaultStore';
import type { StoreApi, UseBoundStore } from 'zustand';

/** convoy 1회 오염 리시드 플래그 — 개시일 full 시 제거 후 transport 재시드 허용 */
const CONVOY_FLEET_ECONOMY_RESEED_FLAG = 'arcfire_convoy_fleet_economy_reseed_20260629_v1';

export type WorldEconomyServiceLaunchResetMode = 'full' | 'soft';

export type WorldEconomyServiceLaunchResetResult = {
  ran: boolean;
  mode: WorldEconomyServiceLaunchResetMode;
  vaultsReseeded: boolean;
  feeLedgerCleared: boolean;
  overlayCleared: boolean;
  marketsRebuilt: number;
  dailyOpsCleared: boolean;
  independentVaultUntouched: boolean;
  note: string;
};

type VaultStore = UseBoundStore<StoreApi<FactionVaultState>>;

async function reseedVaultStore(
  store: VaultStore,
  seedCredits: number,
  seedNote: string,
): Promise<void> {
  const seed = Math.floor(seedCredits);
  const now = Date.now();
  store.setState({
    hydrated: true,
    balanceCredits: seed,
    totalInflowCredits: seed > 0 ? seed : 0,
    totalOutflowCredits: 0,
    txns:
      seed !== 0
        ? [
            {
              id: `${now}_service_launch_seed`,
              kind: 'seed',
              deltaCredits: seed,
              balanceAfter: seed,
              note: seedNote,
              createdAt: now,
            },
          ]
        : [],
  });
  await store.getState().persist();
}

async function clearSoftWorldEconomyLayer(): Promise<{ marketsRebuilt: number }> {
  await clearPlanetTradeFeeLedgerForServiceLaunch();
  await resetEconomyPriceOverlayForServiceLaunch();
  await clearBalanceOverlayIngestStateForServiceLaunch();
  await clearArcCoreCentralBankExpenditureLedgerForServiceLaunch();
  const planetIds = listPlanetIdsWithTradePort();
  rebuildAllPlanetTradeMarkets(planetIds, true);
  return { marketsRebuilt: planetIds.length };
}

/**
 * 서비스 개시(또는 운영 재시동)용 월드 경제 패키지 리셋.
 *
 * - **full**: 월드 금고 1~4 시드 + soft 레이어 + dailyOps 게이트 클리어 + convoy 플래그 리셋
 * - **soft**: fee/overlay/ingest/central ledger/market만 (금고 잔액 유지)
 *
 * **비대상(절대)**: playerIndependentNationVault · player credits · missions · clan hold 시드 ·
 * 계정 purge · planetCore RED/BLUE(별 파라미터 없이 손대지 않음) · synth hardReset(기존 epoch/gen 경로)
 *
 * onBoot / 틱에서 호출하지 말 것 — 운영 도구·승인된 개시 플로우만.
 */
export async function resetArcCoreWorldEconomyForServiceLaunch(
  mode: WorldEconomyServiceLaunchResetMode = 'full',
): Promise<WorldEconomyServiceLaunchResetResult> {
  const independentBefore = usePlayerIndependentNationVaultStore.getState().getBalance();

  const soft = await clearSoftWorldEconomyLayer();

  let vaultsReseeded = false;
  let dailyOpsCleared = false;

  if (mode === 'full') {
    await reseedVaultStore(
      useArcCoreVaultStore,
      getArcCoreVaultSeedCredits(),
      '서비스 개시 — 아크코어(RED) 금고 시드',
    );
    await reseedVaultStore(
      useBlueTeamSharedVaultStore,
      getBlueTeamVaultSeedCredits(),
      '서비스 개시 — 블루 금고 시드',
    );
    await reseedVaultStore(useNeutralNationVaultStore, 0, '서비스 개시 — 중립 금고 클리어');
    try {
      await AsyncStorage.removeItem(CONVOY_FLEET_ECONOMY_RESEED_FLAG);
    } catch {
      /* ignore */
    }
    await reseedArcCoreTransportFleetBankToSeed();
    vaultsReseeded = true;

    await clearArcCoreDailyOpsStateForServiceLaunch();
    await clearArcCoreDailyOpsSummaryPendingForServiceLaunch();
    dailyOpsCleared = true;
  }

  const independentAfter = usePlayerIndependentNationVaultStore.getState().getBalance();
  const independentVaultUntouched = independentBefore === independentAfter;

  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log(
      `[ArcCore/Economy] service-launch world reset mode=${mode} vaults=${vaultsReseeded} markets=${soft.marketsRebuilt} independentUntouched=${independentVaultUntouched}`,
    );
  }

  return {
    ran: true,
    mode,
    vaultsReseeded,
    feeLedgerCleared: true,
    overlayCleared: true,
    marketsRebuilt: soft.marketsRebuilt,
    dailyOpsCleared,
    independentVaultUntouched,
    note:
      mode === 'full'
        ? '월드 금고1~4·fee·overlay·dailyOps 리셋. synth hardReset은 epoch/gen 별도. 플레이어축 비대상.'
        : 'soft: fee·overlay·ingest·market만. 금고·dailyOps 유지.',
  };
}
