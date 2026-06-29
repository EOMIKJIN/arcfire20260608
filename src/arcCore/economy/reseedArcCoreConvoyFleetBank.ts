// ============================================================
// 수송선단 금고·convoy ledger — 잘못된 누적 잔액 1회 시드 리셋
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import { getArcCoreTransportFleetSeedCredits } from './planetUpkeepPolicy';
import { clearAllConvoyShipCargo } from './runArcTransportTradePass';
import { useArcCoreTransportFleetBankStore } from '../../store/factionVault/arcCoreTransportFleetBankStore';
import {
  type PlanetTradeFeeBucket,
  usePlanetTradeFeeLedgerStore,
} from '../../store/planetTradeFeeLedgerStore';

/** 1회성 — B1~B3 이전 잘못 누적된 −2천만대 fleet bank 정리 (2026-06-29) */
const CONVOY_FLEET_ECONOMY_RESEED_FLAG = 'arcfire_convoy_fleet_economy_reseed_20260629_v1';

export async function reseedArcCoreTransportFleetBankToSeed(): Promise<void> {
  const seed = getArcCoreTransportFleetSeedCredits();
  const now = Date.now();
  useArcCoreTransportFleetBankStore.setState({
    hydrated: true,
    balanceCredits: seed,
    totalInflowCredits: seed,
    totalOutflowCredits: 0,
    txns: [
      {
        id: `${now}_seed`,
        kind: 'seed',
        deltaCredits: seed,
        balanceAfter: seed,
        note: '아크코어 수송선단 금고 시드 (convoy reseed)',
        createdAt: now,
      },
    ],
  });
  await useArcCoreTransportFleetBankStore.getState().persist();
}

/** 당일 ledger — convoy 채널만 0 (플레이어 수수료 풀 유지) */
export async function clearPlanetTradeFeeLedgerConvoyChannels(): Promise<void> {
  const state = usePlanetTradeFeeLedgerStore.getState();
  const kstDayKey = planetAttackKstDayKey();
  const next: Record<string, PlanetTradeFeeBucket> = {};
  for (const [planetId, bucket] of Object.entries(state.byPlanetId)) {
    const convoyGross = bucket.convoyGrossCredits ?? 0;
    const convoyFee = bucket.convoyFeeCredits ?? 0;
    if (convoyGross <= 0 && convoyFee <= 0) {
      next[planetId] = bucket;
      continue;
    }
    next[planetId] = {
      ...bucket,
      grossCredits: Math.max(0, bucket.grossCredits - convoyGross),
      convoyGrossCredits: 0,
      convoyFeeCredits: 0,
      arcFeeCredits: Math.max(0, bucket.arcFeeCredits - convoyFee),
    };
  }
  usePlanetTradeFeeLedgerStore.setState({
    hydrated: true,
    kstDayKey,
    byPlanetId: next,
  });
  await usePlanetTradeFeeLedgerStore.getState().persist();
}

/**
 * 잘못 누적된 convoy fleet 경제 1회 초기화 — 기기당 1회.
 * fleet bank → 시드(500k), convoy ledger·RAM 화물 클리어.
 */
export async function reseedCorruptConvoyFleetEconomyOnce(): Promise<boolean> {
  const done = await AsyncStorage.getItem(CONVOY_FLEET_ECONOMY_RESEED_FLAG);
  if (done === '1') return false;

  await reseedArcCoreTransportFleetBankToSeed();
  if (usePlanetTradeFeeLedgerStore.getState().hydrated) {
    await clearPlanetTradeFeeLedgerConvoyChannels();
  }
  clearAllConvoyShipCargo();

  await AsyncStorage.setItem(CONVOY_FLEET_ECONOMY_RESEED_FLAG, '1');
  if (__DEV__) {
    console.log('[ArcCore/Economy] convoy fleet economy reseed → seed', getArcCoreTransportFleetSeedCredits());
  }
  return true;
}
