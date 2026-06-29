// ============================================================
// 수요지 convoy 일일 gross cap — 잔여 흡수량·정산 게이트
// ============================================================

import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import { getConvoyDemandDailyGrossCapCredits } from '../balance/balanceTableRegistry';
import { useArcCoreTransportFleetBankStore } from '../../store/factionVault/arcCoreTransportFleetBankStore';
import { usePlanetTradeFeeLedgerStore } from '../../store/planetTradeFeeLedgerStore';

/** 수송선단 금고·수수료 ledger hydrate 완료 후에만 convoy 정산 허용 */
export function canRunConvoyTradeSettlement(): boolean {
  return (
    useArcCoreTransportFleetBankStore.getState().hydrated &&
    usePlanetTradeFeeLedgerStore.getState().hydrated
  );
}

/**
 * 수요 행성 당일 convoy 매출 gross 잔여(cr).
 * ledger 미 hydrate → 0 (적재·하역 모두 보수적으로 차단).
 */
export function resolveConvoyDemandGrossRoomCredits(demandPlanetId: string): number {
  if (!demandPlanetId) return 0;
  const grossCap = getConvoyDemandDailyGrossCapCredits();
  if (grossCap <= 0) return Number.MAX_SAFE_INTEGER;

  const ledger = usePlanetTradeFeeLedgerStore.getState();
  if (!ledger.hydrated) return 0;

  ledger.ensureDay(planetAttackKstDayKey());
  const prior = ledger.byPlanetId[demandPlanetId]?.convoyGrossCredits ?? 0;
  const effectivePrior = Math.min(Math.max(0, prior), grossCap);
  return Math.max(0, grossCap - effectivePrior);
}
