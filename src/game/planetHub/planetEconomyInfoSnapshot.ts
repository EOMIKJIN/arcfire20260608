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
import { resolvePlanetSupplyStockScale, resolvePlanetSupplyVitalityTier } from '../../arcCore/economy/planetEconomyFabric';
import { computePlanetDevelopmentDailyUpkeepCredits } from '../../arcCore/economy/planetDevelopmentUpkeep';
import {
  applyPlanetDevUpkeepEfficiency,
  resolvePlanetDevCostEfficiencyDiscountPct,
  resolvePlanetDevelopmentTdiPgpBonusBmu,
  resolvePlanetDevelopmentTdiScore,
} from '../../arcCore/planetDevelopment/planetDevelopmentLevelBenefits';
import { calculatePlanetPgpFromStats } from '../../world/planetPgpModel';
import { useArcCoreTransportFleetBankStore } from '../../store/factionVault/arcCoreTransportFleetBankStore';
import { useClanWarFoundationStore } from '../../store/clanWarFoundationStore';
import {
  planetCsvBaselineToRuntime,
  usePlanetCoreRuntimeStore,
} from '../../store/planetCoreRuntimeStore';
import { usePlanetTradeFeeLedgerStore, type PlanetTradeFeeBucket } from '../../store/planetTradeFeeLedgerStore';
import { useAppSettingsStore } from '../../store/appSettingsStore';
import { t } from '../../i18n';
import { formatCredits } from '../../utils/formatCredits';
import {
  readPlanetCoreStatOpsTrend,
  resolvePlanetCoreStatTrendView,
} from '../../arcCore/planetCore/planetCoreStatOpsTrend';
import type { PlanetCoreStatKey } from '../../store/planetCoreMetricTypes';
import { resolvePlanetInfoPanelDescription } from './resolvePlanetTableDescription';
import {
  resolvePlanetStabilityDisplay,
  type PlanetStabilityDisplay,
} from '../../world/planetStabilityModel';

export type PlanetEconomyInfoExtraRow = {
  label: string;
  value: string;
};

export type PlanetCoreStatTrendSnapshot = {
  resource: ReturnType<typeof resolvePlanetCoreStatTrendView>;
  population: ReturnType<typeof resolvePlanetCoreStatTrendView>;
  defense: ReturnType<typeof resolvePlanetCoreStatTrendView>;
  technology: ReturnType<typeof resolvePlanetCoreStatTrendView>;
  environment: ReturnType<typeof resolvePlanetCoreStatTrendView>;
  /** arc_core_daily_ops 배치 KST 일자 — 없으면 아직 배치 Δ 없음 */
  trendKstDayKey: string | null;
  observationWindowHours: number | null;
};

export type PlanetEconomyInfoSnapshot = {
  planetId: string;
  planetName: string;
  /** planets.csv description + planet governor line */
  planetDescription: string;
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
  /** 5대 스탯 일일 배치 추세(시세) */
  statTrends: PlanetCoreStatTrendSnapshot;
  /** 5대 스탯 기반 행성 총생산(PGP, BMU) */
  pgpBmu: number;
  /** 빈부격차·반란지수 4단 (행성정보 UI) */
  stability: PlanetStabilityDisplay;
  convoyMonopolyLabel: string;
  occupierFactionLabel: string;
  factionVaultLabel: string | null;
  factionVaultBalanceCredits: number | null;
  /** 생산 재고 활력 4단 (침체/보통/활황/대호황) */
  supplyVitalityLabel: string;
  /** 금일 fabric 윈도우 운영 1줄 요약 */
  fabricOpsSummary: string;
  extras: PlanetEconomyInfoExtraRow[];
};

function vitalityLabelKo(tier: ReturnType<typeof resolvePlanetSupplyVitalityTier>): string {
  switch (tier) {
    case 'slump':
      return t('econSnap.vitalitySlump');
    case 'normal':
      return t('econSnap.vitalityNormal');
    case 'boom':
      return t('econSnap.vitalityBoom');
    case 'super_boom':
      return t('econSnap.vitalitySuperBoom');
    default:
      return t('econSnap.vitalityNormal');
  }
}

function occupierFactionLabelKo(
  faction: ReturnType<typeof resolveOccupierFactionKindForHold>,
): string {
  switch (faction) {
    case 'red':
      return t('econSnap.redOccupied');
    case 'blue':
      return t('econSnap.blueOccupied');
    case 'neutral':
      return t('econSnap.neutral');
    case 'player_clan':
      return t('econSnap.playerClanOccupied');
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

/** 레거시·미 hydrate 스토어 값 — toLocaleString 크래시 방지 */
function finiteCredits(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.floor(n) : 0;
}

function normalizeTradeFeeBucket(raw: PlanetTradeFeeBucket) {
  return {
    grossCredits: finiteCredits(raw.grossCredits),
    playerWalletPending: finiteCredits(raw.playerWalletPending),
    arcFeeCredits: finiteCredits(raw.arcFeeCredits),
    convoyFeeCredits: finiteCredits(raw.convoyFeeCredits),
    playerTradeFeeCredits: finiteCredits(raw.playerTradeFeeCredits),
  };
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

function buildStatTrendSnapshot(planetId: string): PlanetCoreStatTrendSnapshot {
  const trend = readPlanetCoreStatOpsTrend(planetId);
  const statKeys: PlanetCoreStatKey[] = [
    'resource',
    'population',
    'defense',
    'technology',
    'environment',
  ];
  const views = {} as Omit<PlanetCoreStatTrendSnapshot, 'trendKstDayKey' | 'observationWindowHours'>;
  for (const key of statKeys) {
    views[key] = resolvePlanetCoreStatTrendView(trend, key);
  }
  return {
    ...views,
    trendKstDayKey: trend?.kstDayKey ?? null,
    observationWindowHours: trend?.observationWindowHours ?? null,
  };
}

/** 세션 캐시·구버전 스냅샷 폴백 */
export function createEmptyPlanetCoreStatTrendSnapshot(): PlanetCoreStatTrendSnapshot {
  return {
    resource: resolvePlanetCoreStatTrendView(null, 'resource'),
    population: resolvePlanetCoreStatTrendView(null, 'population'),
    defense: resolvePlanetCoreStatTrendView(null, 'defense'),
    technology: resolvePlanetCoreStatTrendView(null, 'technology'),
    environment: resolvePlanetCoreStatTrendView(null, 'environment'),
    trendKstDayKey: null,
    observationWindowHours: null,
  };
}

/** 스토어 최신값으로 스냅샷 조립 — 오버레이·실시간 갱신용 */
export function buildPlanetEconomyInfoSnapshot(
  planetId: string,
  planetName: string,
): PlanetEconomyInfoSnapshot {
  const policy = resolvePlanetUpkeepPolicy();
  const population = resolvePopulation(planetId);
  const devUpkeepRaw = computePlanetDevelopmentDailyUpkeepCredits(planetId);
  const devUpkeep = applyPlanetDevUpkeepEfficiency(planetId, devUpkeepRaw);
  const bucket = normalizeTradeFeeBucket(
    usePlanetTradeFeeLedgerStore.getState().getBucket(planetId),
  );
  const tradeFeeToday = bucket.arcFeeCredits;
  const upkeepDaily = computePlanetDailyUpkeepCredits(devUpkeep, policy, tradeFeeToday);
  const core = resolveCoreRuntime(planetId);
  const hold = useClanWarFoundationStore.getState().getHold(planetId);
  const faction = resolveOccupierFactionKindForHold(hold);
  const vault = hold ? resolveFactionVaultForOccupierClanId(hold.occupierClanId) : null;
  let factionVaultLabel: string | null = null;
  let factionVaultBalance: number | null = null;
  if (faction === 'red') {
    factionVaultLabel = t('econSnap.arcVault');
    factionVaultBalance = vault != null ? finiteCredits(vault.getBalance()) : null;
  } else if (faction === 'blue') {
    factionVaultLabel = t('econSnap.blueVault');
    factionVaultBalance = vault != null ? finiteCredits(vault.getBalance()) : null;
  }

  const fleetBalance = finiteCredits(useArcCoreTransportFleetBankStore.getState().getBalance());
  const runtimeRec = usePlanetCoreRuntimeStore.getState().getPlanetCoreRuntime(planetId);
  const supplyScale = resolvePlanetSupplyStockScale(planetId);
  const supplyScalePct = Number.isFinite(supplyScale) ? supplyScale * 100 : 0;
  const supplyVitalityLabel = vitalityLabelKo(resolvePlanetSupplyVitalityTier(supplyScale));
  const fabricWindow = runtimeRec?.detail?.economyFabric?.window;
  const fabricTrips = fabricWindow?.convoyTrips ?? 0;
  const fabricTradeGross = fabricWindow?.playerTradeGrossCredits ?? 0;
  const fabricOpsSummary = t('econSnap.fabricOpsLine', {
    trips: String(fabricTrips),
    gross: formatCredits(fabricTradeGross, { suffix: true }),
    scalePct: supplyScalePct.toFixed(0),
  });
  const convoyLabel = resolvePlanetTradeConvoyMonopolyLabel(planetId);
  const locale = useAppSettingsStore.getState().locale;
  const planetDescription = resolvePlanetInfoPanelDescription(planetId, locale);

  const extras: PlanetEconomyInfoExtraRow[] = [
    {
      label: t('econSnap.fleetVault'),
      value: formatCredits(fleetBalance, { suffix: true }),
    },
    {
      label: t('econSnap.supplyScale'),
      value: `${supplyScalePct.toFixed(1)}%`,
    },
    {
      label: t('econSnap.devCostEfficiency'),
      value: `${resolvePlanetDevCostEfficiencyDiscountPct(planetId).toFixed(1)}%`,
    },
    {
      label: t('econSnap.devTdiScore'),
      value: String(resolvePlanetDevelopmentTdiScore(planetId)),
    },
    {
      label: t('econSnap.playerFeePool'),
      value: formatCredits(bucket.playerWalletPending, { suffix: true }),
    },
  ];

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
        }) + resolvePlanetDevelopmentTdiPgpBonusBmu(planetId);

  const stability = resolvePlanetStabilityDisplay(planetId);

  return {
    planetId,
    planetName,
    planetDescription,
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
    statTrends: buildStatTrendSnapshot(planetId),
    pgpBmu,
    stability,
    convoyMonopolyLabel: convoyLabel || getTransportFleetDisplayNameKo(),
    occupierFactionLabel: occupierFactionLabelKo(faction),
    factionVaultLabel,
    factionVaultBalanceCredits: factionVaultBalance,
    supplyVitalityLabel,
    fabricOpsSummary,
    extras,
  };
}
