// ============================================================
// 일 1회 — 교역 생산지 전수 수송선단 왕복·무역소 수수료 정산
// ============================================================

import { planetAttackKstDayKey } from '../planetAttack/planetAttackKstDayKey';
import { useArcCoreTransportFleetBankStore } from '../../store/factionVault/arcCoreTransportFleetBankStore';
import { usePlanetTradeFeeLedgerStore } from '../../store/planetTradeFeeLedgerStore';
import {
  convoyDailyCoverageEnabled,
  getConvoyDailyMinTradeQty,
} from './planetUpkeepPolicy';
import { executeArcConvoyRoundTrip } from './runArcTransportTradePass';
import {
  listConvoyDemandPlanetIds,
  listConvoySupplyPlanetIds,
  listTradeRouteDemandImportItemIdsForPlanet,
} from './tradeRouteRegistry';
import { resolveTradeRouteAssignedSupplyPlanetId } from './tradeRoutePlanetAssignmentRegistry';

export type ArcCoreConvoyDailySettlementResult = {
  ran: boolean;
  kstDayKey: string;
  supplyRoundTripsOk: number;
  supplyRoundTripsFailed: number;
  demandPlanetsCovered: number;
  failedPlanetIds: string[];
};

export async function runArcCoreConvoyDailySettlementPass(): Promise<ArcCoreConvoyDailySettlementResult> {
  const kstDayKey = planetAttackKstDayKey();
  const empty: ArcCoreConvoyDailySettlementResult = {
    ran: false,
    kstDayKey,
    supplyRoundTripsOk: 0,
    supplyRoundTripsFailed: 0,
    demandPlanetsCovered: 0,
    failedPlanetIds: [],
  };
  if (!convoyDailyCoverageEnabled()) return empty;

  if (!useArcCoreTransportFleetBankStore.getState().hydrated) {
    await useArcCoreTransportFleetBankStore.getState().hydrate();
  }
  if (!usePlanetTradeFeeLedgerStore.getState().hydrated) {
    await usePlanetTradeFeeLedgerStore.getState().hydrate();
  }

  usePlanetTradeFeeLedgerStore.getState().ensureDay(kstDayKey);

  const minQty = getConvoyDailyMinTradeQty();
  const supplyPlanetIds = listConvoySupplyPlanetIds();
  const demandPlanetSet = new Set<string>();
  const failedPlanetIds: string[] = [];
  let supplyRoundTripsOk = 0;
  let supplyRoundTripsFailed = 0;

  for (const supplyPlanetId of supplyPlanetIds) {
    const shipId = `arc_daily_convoy_${kstDayKey}_${supplyPlanetId}`;
    const trip = executeArcConvoyRoundTrip(shipId, supplyPlanetId, { minQty });
    if (trip.ok && trip.destPlanetId) {
      supplyRoundTripsOk += 1;
      demandPlanetSet.add(trip.destPlanetId);
    } else {
      supplyRoundTripsFailed += 1;
      failedPlanetIds.push(supplyPlanetId);
    }
  }

  const allDemand = listConvoyDemandPlanetIds();
  for (const demandPlanetId of allDemand) {
    if (!demandPlanetSet.has(demandPlanetId)) {
      const bucket = usePlanetTradeFeeLedgerStore.getState().byPlanetId[demandPlanetId];
      if (bucket && bucket.convoyGrossCredits > 0) {
        demandPlanetSet.add(demandPlanetId);
      }
    }
  }

  for (const demandPlanetId of allDemand) {
    if (demandPlanetSet.has(demandPlanetId)) continue;
    const imports = listTradeRouteDemandImportItemIdsForPlanet(demandPlanetId);
    const tgId = imports[0];
    if (!tgId) {
      failedPlanetIds.push(demandPlanetId);
      continue;
    }
    const supplyPlanetId = resolveTradeRouteAssignedSupplyPlanetId(tgId);
    if (!supplyPlanetId) {
      failedPlanetIds.push(demandPlanetId);
      continue;
    }
    const shipId = `arc_daily_convoy_backfill_${kstDayKey}_${demandPlanetId}`;
    const trip = executeArcConvoyRoundTrip(shipId, supplyPlanetId, {
      minQty,
      forceDestPlanetId: demandPlanetId,
    });
    if (trip.ok && trip.destPlanetId) {
      supplyRoundTripsOk += 1;
      demandPlanetSet.add(trip.destPlanetId);
    } else {
      supplyRoundTripsFailed += 1;
      failedPlanetIds.push(demandPlanetId);
    }
  }

  return {
    ran: true,
    kstDayKey,
    supplyRoundTripsOk,
    supplyRoundTripsFailed,
    demandPlanetsCovered: demandPlanetSet.size,
    failedPlanetIds,
  };
}
