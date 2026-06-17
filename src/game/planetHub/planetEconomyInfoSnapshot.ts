// ============================================================
// 행성 경제 정보 스냅샷 — 허브 UI·오버레이 공용
// ============================================================

import {
  computePlanetDailyUpkeepCredits,
  getTransportFleetDisplayNameKo,
  PLANET_ECONOMY_MONTHLY_DAYS,
  resolvePlanetUpkeepPolicy,
} from '../../arcCore/economy/planetUpkeepPolicy';
import { resolvePlanetTradeConvoyMonopolyLabel } from '../../arcCore/economy/resolvePlanetTradeConvoyMonopoly';
import {
  resolveFactionVaultForOccupierClanId,
  resolveOccupierFactionKindForHold,
} from '../../arcCore/economy/resolveFactionVault';
import { findPlanetById } from '../../arcCore/planetEnvironment/resolvePlanetAsteroidVisualPolicy';
import { planetAttackKstDayKey } from '../../arcCore/planetAttack/planetAttackKstDayKey';
import { resolvePlanetSupplyStockScale } from '../../arcCore/economy/planetEconomyFabric';
import { calculatePlanetPgpFromStats } from '../../world/planetPgpModel';
import { useArcCoreTransportFleetBankStore } from '../../store/factionVault/arcCoreTransportFleetBankStore';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import {
  planetCsvBaselineToRuntime,
  usePlanetCoreRuntimeStore,
} from '../../store/planetCoreRuntimeStore';
import { usePlanetTradeFeeLedgerStore } from '../../store/planetTradeFeeLedgerStore';

export type PlanetEconomyInfoExtraRow = {
  label: string;
  value: string;
};

export type PlanetEconomyInfoSnapshot = {
  planetId: string;
  planetName: string;
  kstDayKey: string;
  populationPct: number;
  upkeepDailyCredits: number;
  upkeepMonthlyCredits: number;
  tradeFeeTodayCredits: number;
  tradeFeeMonthlyEstCredits: number;
  tradeGrossTodayCredits: number;
  /** 수송선단 — 수수료율 적용 수수료 수익(금일) */
  convoyTradeFeeTodayCredits: number;
  /** 플레이어 — 수수료율 적용 수수료 수익(금일) */
  playerTradeFeeTodayCredits: number;
  resourcePct: number;
  populationStatPct: number;
  defensePct: number;
  technologyPct: number;
  environmentPct: number;
  /** 5대 스탯 기반 행성 총생산(PGP, BMU) */
  pgpBmu: number;
  convoyMonopolyLabel: string;
  occupierFactionLabel: string;
  factionVaultLabel: string | null;
  factionVaultBalanceCredits: number | null;
  extras: PlanetEconomyInfoExtraRow[];
};

function occupierFactionLabelKo(
  faction: ReturnType<typeof resolveOccupierFactionKindForHold>,
): string {
  switch (faction) {
    case 'red':
      return 'RED 점령 (아크코어)';
    case 'blue':
      return 'BLUE 점령 (연합)';
    case 'neutral':
      return '중립';
    case 'player_clan':
      return '플레이어 클랜 점유';
    default:
      return '—';
  }
}

function resolvePopulation(planetId: string): number {
  const runtime = usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId);
  if (runtime) return runtime.population;
  const planet = findPlanetById(planetId);
  if (!planet) return 50;
  return planetCsvBaselineToRuntime(planet).population;
}

function resolveCoreRuntime(planetId: string) {
  const runtime = usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId);
  if (runtime) return runtime;
  const planet = findPlanetById(planetId);
  if (!planet) {
    return {
      resource: 50,
      population: 50,
      defense: 50,
      technology: 50,
      environment: 50,
    };
  }
  const base = planetCsvBaselineToRuntime(planet);
  return {
    resource: base.resource,
    population: base.population,
    defense: base.defense,
    technology: base.technology,
    environment: base.environment,
  };
}

/** 스토어 최신값으로 스냅샷 조립 — 오버레이·실시간 갱신용 */
export function buildPlanetEconomyInfoSnapshot(
  planetId: string,
  planetName: string,
): PlanetEconomyInfoSnapshot {
  const policy = resolvePlanetUpkeepPolicy();
  const population = resolvePopulation(planetId);
  const upkeepDaily = computePlanetDailyUpkeepCredits(population, policy);
  const core = resolveCoreRuntime(planetId);
  const hold = useClanWarFoundationStore.getState().getHold(planetId);
  const faction = resolveOccupierFactionKindForHold(hold);
  const bucket = usePlanetTradeFeeLedgerStore.getState().getBucket(planetId);
  const tradeFeeToday = bucket.arcFeeCredits;
  const vault = hold ? resolveFactionVaultForOccupierClanId(hold.occupierClanId) : null;
  let factionVaultLabel: string | null = null;
  let factionVaultBalance: number | null = null;
  if (faction === 'red') {
    factionVaultLabel = '아크코어 금고 (팩션 통합)';
    factionVaultBalance = vault?.getBalance() ?? null;
  } else if (faction === 'blue') {
    factionVaultLabel = '블루팀 공용 금고';
    factionVaultBalance = vault?.getBalance() ?? null;
  }

  const fleetBalance = useArcCoreTransportFleetBankStore.getState().getBalance();
  const supplyScale = resolvePlanetSupplyStockScale(planetId);
  const convoyLabel = resolvePlanetTradeConvoyMonopolyLabel(planetId);

  const extras: PlanetEconomyInfoExtraRow[] = [
    {
      label: '수송선단 금고',
      value: `${fleetBalance.toLocaleString('ko-KR')} cr`,
    },
    {
      label: '생산 재고 배율',
      value: `${(supplyScale * 100).toFixed(1)}%`,
    },
    {
      label: '플레이어 수수료 풀(금일)',
      value: `${bucket.playerWalletPending.toLocaleString('ko-KR')} cr`,
    },
  ];

  const runtimeRec = usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId);
  // [보완 #4] 배치 갱신 PGP 우선 — 없으면 레거시 즉시 계산 폴백
  const pgpBmu =
    typeof runtimeRec?.pgp === 'number' && Number.isFinite(runtimeRec.pgp)
      ? runtimeRec.pgp
      : calculatePlanetPgpFromStats({
          resource: core.resource,
          population: core.population,
          defense: core.defense,
          technology: core.technology,
          environment: core.environment,
        });

  return {
    planetId,
    planetName,
    kstDayKey: planetAttackKstDayKey(),
    populationPct: population,
    upkeepDailyCredits: upkeepDaily,
    upkeepMonthlyCredits: upkeepDaily * PLANET_ECONOMY_MONTHLY_DAYS,
    tradeFeeTodayCredits: tradeFeeToday,
    tradeFeeMonthlyEstCredits: tradeFeeToday * PLANET_ECONOMY_MONTHLY_DAYS,
    tradeGrossTodayCredits: bucket.grossCredits,
    convoyTradeFeeTodayCredits: bucket.convoyFeeCredits,
    playerTradeFeeTodayCredits: bucket.playerTradeFeeCredits,
    resourcePct: core.resource,
    populationStatPct: core.population,
    defensePct: core.defense,
    technologyPct: core.technology,
    environmentPct: core.environment,
    pgpBmu,
    convoyMonopolyLabel: convoyLabel || getTransportFleetDisplayNameKo(),
    occupierFactionLabel: occupierFactionLabelKo(faction),
    factionVaultLabel,
    factionVaultBalanceCredits: factionVaultBalance,
    extras,
  };
}
